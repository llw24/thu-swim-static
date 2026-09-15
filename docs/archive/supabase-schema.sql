-- ============================================================================
-- 清华游协官网 · Supabase 数据库结构
--
-- 用途：给静态站提供两件纯静态做不到的事
--   ① 入群邮箱验证 —— 只有清华邮箱能通过验证，验证后才看得到管理员微信
--   ② 报名系统     —— 名额由数据库权威判定（不会超录），含自动候补队列
--
-- 用法：Supabase 面板 → SQL Editor → New query → 全文粘贴 → Run
--       本文件可以反复执行（幂等），改完重跑即可。
--
-- ⚠️ 安全要点（改动本文件时务必保持）
--   · registrations 表对 anon 权限为零：匿名者既不能读也不能写
--   · 报名者只能读自己的记录；只有 admins 白名单里的人能读全部
--   · 名额判定放在 BEFORE INSERT 触发器里，客户端无法伪造 status
--   · 群二维码放在私有 bucket，只有验证通过的登录用户能拿临时签名链接
-- ============================================================================


-- ============================================================================
-- 0. 工具函数
-- ============================================================================

-- 判断当前请求者是不是管理员。
-- security definer：避免在 admins 表的 RLS 策略里递归查询自己。
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins a where a.user_id = auth.uid()
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;


-- 通用的 updated_at 自动维护
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;


-- ============================================================================
-- 1. admins —— 管理员白名单
--    报名名单属于个人隐私，只有白名单里的人能读。
--    用法：用管理员自己的清华邮箱在网站上完成一次验证，
--          然后到 面板 → Authentication → Users 复制该用户的 UID，
--          插入本表（见文件末尾示例）。
-- ============================================================================

create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  note       text not null default '',
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

drop policy if exists "admins_read_self" on public.admins;
create policy "admins_read_self" on public.admins
  for select to authenticated
  using (user_id = auth.uid());


-- ============================================================================
-- 2. class_sessions —— 期次名额（报名名额的服务端权威来源）
--
--    与 content/sessions/*.md 的分工：
--      · .md 文件  → 展示用（标题/时间/地点/费用/描述），由管理员在 /admin 改
--      · 本表      → 只放"名额"和"是否开放报名"，因为名额必须服务端判定
--    slug 必须与 content/sessions/ 里的文件名一致，例如 2026-fall-01
-- ============================================================================

create table if not exists public.class_sessions (
  slug       text primary key,
  title      text not null default '',
  -- 计划招收人数；0 = 不限人数（不产生候补）
  capacity   integer not null default 0 check (capacity >= 0),
  -- 是否在网站上开放报名（和 .md 里的 status 配合使用）
  status     text not null default 'open' check (status in ('open', 'closed')),
  updated_at timestamptz not null default now()
);

alter table public.class_sessions enable row level security;

-- 名额和"是否开放"属于公开信息（首页要显示剩余名额）
drop policy if exists "class_sessions_read_all" on public.class_sessions;
create policy "class_sessions_read_all" on public.class_sessions
  for select to anon, authenticated
  using (true);

drop policy if exists "class_sessions_admin_write" on public.class_sessions;
create policy "class_sessions_admin_write" on public.class_sessions
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop trigger if exists trg_class_sessions_touch on public.class_sessions;
create trigger trg_class_sessions_touch
  before update on public.class_sessions
  for each row execute function public.touch_updated_at();


-- ============================================================================
-- 3. registrations —— 报名记录（含候补队列）
--
--    隐私红线：这里存着姓名/学号/手机号。
--      · anon 角色在本表上没有任何权限（见文件末尾的 revoke）
--      · 报名者只能读写自己的那一行
--      · 只有 admins 能读全部（用于导出名单）
-- ============================================================================

create table if not exists public.registrations (
  id           bigserial primary key,
  session_slug text not null references public.class_sessions (slug) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  name         text not null check (length(btrim(name)) between 1 and 50),
  student_id   text not null check (length(btrim(student_id)) between 1 and 30),
  department   text not null default '',
  phone        text not null check (length(btrim(phone)) between 5 and 30),
  wechat       text not null default '',
  note         text not null default '',
  -- 触发器决定：名额内 = confirmed，超出 = waitlist
  status       text not null default 'confirmed'
                 check (status in ('confirmed', 'waitlist', 'cancelled')),
  created_at   timestamptz not null default now(),
  -- 同一期次同一人只能报一次
  unique (session_slug, user_id),
  -- 同一期次同一学号只能报一次（防止一个人开两个邮箱占两个名额）
  unique (session_slug, student_id)
);

create index if not exists registrations_session_status_idx
  on public.registrations (session_slug, status, created_at);

alter table public.registrations enable row level security;

-- 报名：只能以自己的身份插自己的行
drop policy if exists "registrations_self_insert" on public.registrations;
create policy "registrations_self_insert" on public.registrations
  for insert to authenticated
  with check (user_id = auth.uid());

-- 读自己的报名（网站要显示"你已报名，状态：候补第 3 位"）
drop policy if exists "registrations_self_read" on public.registrations;
create policy "registrations_self_read" on public.registrations
  for select to authenticated
  using (user_id = auth.uid());

-- 取消自己的报名（不删行，留痕；候补递补由管理员操作）
drop policy if exists "registrations_self_cancel" on public.registrations;
create policy "registrations_self_cancel" on public.registrations
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and status = 'cancelled');

-- 管理员：读写全部（导名单、把候补提为正式、手动取消）
drop policy if exists "registrations_admin_all" on public.registrations;
create policy "registrations_admin_all" on public.registrations
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 收紧：匿名角色在报名表上什么都不能做
revoke all on public.registrations from anon;


-- ---------------------------------------------------------------------------
-- 3.1 名额判定 + 自动候补
--
--     在插入前用行锁把同一期次的并发报名串行化，
--     否则两个人同时点提交可能都读到"还剩 1 个名额"从而超录。
-- ---------------------------------------------------------------------------

create or replace function public.assign_registration_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cap   integer;
  taken integer;
begin
  -- 锁住这一期次的行：并发报名在这里排队，逐个判定
  select capacity into cap
    from public.class_sessions
   where slug = new.session_slug
     for update;

  if not found then
    raise exception '期次 % 没有在后台配置名额，请联系管理员', new.session_slug
      using errcode = 'P0002';
  end if;

  select count(*) into taken
    from public.registrations
   where session_slug = new.session_slug
     and status = 'confirmed';

  -- capacity = 0 视为不限人数
  if cap = 0 or taken < cap then
    new.status := 'confirmed';
  else
    new.status := 'waitlist';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_assign_registration_status on public.registrations;
create trigger trg_assign_registration_status
  before insert on public.registrations
  for each row execute function public.assign_registration_status();


-- ---------------------------------------------------------------------------
-- 3.2 session_stats —— 只暴露聚合数字的视图
--
--     首页/课程页要显示"已报 12 / 30，剩 18 个"，但不能暴露任何个人信息。
--     视图由 postgres 拥有，绕过底层表的 RLS，因此只 select 计数字段。
--     （Supabase 的 linter 会提示 security definer view，这是本意，可忽略）
-- ---------------------------------------------------------------------------

create or replace view public.session_stats as
select
  s.slug,
  s.title,
  s.capacity,
  s.status,
  count(r.id) filter (where r.status = 'confirmed') as confirmed_count,
  count(r.id) filter (where r.status = 'waitlist')  as waitlist_count,
  case
    when s.capacity = 0 then null  -- 不限人数
    else greatest(s.capacity - count(r.id) filter (where r.status = 'confirmed'), 0)
  end as remaining,
  case
    when s.status <> 'open' then false
    when s.capacity = 0 then true
    else count(r.id) filter (where r.status = 'confirmed') < s.capacity
  end as accepting
from public.class_sessions s
left join public.registrations r on r.session_slug = s.slug
group by s.slug, s.title, s.capacity, s.status;

grant select on public.session_stats to anon, authenticated;


-- ============================================================================
-- 4. join_info —— 验证通过后才显示的内容（管理员微信 / 群二维码）
--    这是一行单例配置表（id 恒为 1）。
-- ============================================================================

create table if not exists public.join_info (
  id         integer primary key default 1 check (id = 1),
  wechat_id  text not null default '',
  -- 私有 bucket 'join' 里的对象路径，例如 wechat.png（不要带 bucket 名）
  qr_path    text not null default '',
  note_zh    text not null default '',
  note_en    text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.join_info enable row level security;

-- 只有完成邮箱验证的登录用户能读
drop policy if exists "join_info_verified_read" on public.join_info;
create policy "join_info_verified_read" on public.join_info
  for select to authenticated
  using (true);

drop policy if exists "join_info_admin_write" on public.join_info;
create policy "join_info_admin_write" on public.join_info
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 预置空行，方便管理员直接在面板里填
insert into public.join_info (id) values (1) on conflict (id) do nothing;

drop trigger if exists trg_join_info_touch on public.join_info;
create trigger trg_join_info_touch
  before update on public.join_info
  for each row execute function public.touch_updated_at();


-- ============================================================================
-- 5. 私有存储桶 —— 存放管理员微信二维码 / 群二维码
--
--    为什么不放仓库 public/：GitHub Pages 是公开仓库，
--    放进去等于把二维码挂在全世界都能看的网页上。
--    放这里则必须先用清华邮箱验证登录，才能换到 1 小时有效的临时链接。
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('join', 'join', false)
on conflict (id) do nothing;

drop policy if exists "join_bucket_verified_read" on storage.objects;
create policy "join_bucket_verified_read" on storage.objects
  for select to authenticated
  using (bucket_id = 'join');

drop policy if exists "join_bucket_admin_write" on storage.objects;
create policy "join_bucket_admin_write" on storage.objects
  for all to authenticated
  using (bucket_id = 'join' and public.is_admin())
  with check (bucket_id = 'join' and public.is_admin());


-- ============================================================================
-- 6. 注册邮箱域名限制 —— 只有清华邮箱能注册
--
--    ⚠️ 装好之后还需要在面板里启用：
--       Authentication → Auth Hooks → Before User Created
--       → 选择 Postgres function → public.hook_restrict_signup_by_email_domain
--
--    为什么必须有这一步：Supabase 的邮箱验证码能发到任何邮箱。
--    只靠前端正则限制域名是可以绕过的（改一下 JS 就行），
--    必须在服务端拒绝，才是真正的"仅限清华邮箱"。
-- ============================================================================

create or replace function public.hook_restrict_signup_by_email_domain(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  -- 与 src/lib/content-shared.ts 里的 ALLOWED_EMAIL_DOMAINS 保持一致
  allowed constant text[] := array[
    'mails.tsinghua.edu.cn',  -- 清华学生邮箱
    'tsinghua.edu.cn',        -- 清华教工邮箱
    'mail.tsinghua.edu.cn'    -- 兼容旧域名
  ];
  email  text := lower(coalesce(event -> 'user' ->> 'email', ''));
  domain text := split_part(email, '@', 2);
begin
  if email = '' or domain = '' or not (domain = any (allowed)) then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 400,
        'message', '仅限清华大学邮箱（@mails.tsinghua.edu.cn / @tsinghua.edu.cn）验证。'
      )
    );
  end if;

  -- 返回空对象 = 放行
  return '{}'::jsonb;
end;
$$;

grant execute on function public.hook_restrict_signup_by_email_domain(jsonb)
  to supabase_auth_admin;


-- ============================================================================
-- 7. 初始化数据（按需修改，可整段删掉）
-- ============================================================================

-- 7.1 本期零基础班的名额。slug 必须与 content/sessions/2026-fall-01.md 同名。
insert into public.class_sessions (slug, title, capacity, status)
values ('2026-fall-01', '2026 秋季学期 · 第一期零基础班', 30, 'open')
on conflict (slug) do nothing;

-- 7.2 把你自己设为管理员：先用清华邮箱在网站上验证一次，
--     再到 面板 → Authentication → Users 复制你的 UID，替换下面的占位符后执行。
--
-- insert into public.admins (user_id, note) values
--   ('00000000-0000-0000-0000-000000000000', '理事长')
-- on conflict (user_id) do nothing;


-- ============================================================================
-- 8. 日常运维 SQL 速查（照抄到 SQL Editor 执行即可）
-- ============================================================================

-- 看某期次的名额与候补情况
--   select * from public.session_stats where slug = '2026-fall-01';

-- 导名单（也可以在 面板 → Table Editor → registrations → Export CSV 点一下导出）
--   select r.created_at, r.status, r.name, r.student_id, r.department, r.phone, r.wechat,
--          u.email
--     from public.registrations r
--     join auth.users u on u.id = r.user_id
--    where r.session_slug = '2026-fall-01'
--    order by r.status, r.created_at;

-- 把候补第一位递补为正式（有人退课时用）
--   update public.registrations
--      set status = 'confirmed'
--    where id = (select id from public.registrations
--                 where session_slug = '2026-fall-01' and status = 'waitlist'
--                 order by created_at limit 1);

-- 截止报名 / 重新开放
--   update public.class_sessions set status = 'closed' where slug = '2026-fall-01';
--   update public.class_sessions set status = 'open'   where slug = '2026-fall-01';

-- 改招生人数
--   update public.class_sessions set capacity = 40 where slug = '2026-fall-01';

-- 看谁完成过邮箱验证（也就是"应该来找我入群的人"）
--   select email, created_at, last_sign_in_at from auth.users order by created_at desc;

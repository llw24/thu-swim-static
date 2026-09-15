> ⚠️ **归档说明（2026-09-15）**：本方案（Supabase 自建验证+报名）已被"老站验证服务 + 问卷星"的混合架构取代，见仓库根目录《网站整体方案.md》。本文件与 supabase-schema.sql 保留作为备选方案，未在生产使用。

# Supabase 配置手册

> 这份文档给**技术负责人**看，一次性配置大概 30–40 分钟。
> 配好之后，日常运营全部在 Supabase 网页面板里点点鼠标完成，不需要写代码。

---

## 〇、先说清楚：为什么要引入 Supabase

这个网站是**纯静态**的（`output: 'export'`，托管在 GitHub Pages），没有任何服务端。
所以有两件事它自己绝对做不到：

| 需求 | 为什么静态站做不到 | Supabase 怎么补上 |
|---|---|---|
| 入群要验证清华邮箱 | 发验证邮件、校验验证码需要服务端；纯前端写"验证"等于没验证 | **Auth**：邮箱验证码（OTP），域名限制在服务端强制执行 |
| 报名名额不能超录 | 名额判定必须由可信的一方做，前端算的名额可以被改 | **Postgres**：名额判定放在数据库触发器里，客户端伪造无效 |
| 报名信息要保密 | 静态站的 JS 和仓库都是公开的，写进去等于公开同学手机号 | **RLS**：匿名者读不到任何一行，只有本人和管理员能读 |
| 入群二维码不能外泄 | 放仓库 `public/` 就是公开图片 | **私有 Storage**：验证登录后才换得到 1 小时有效的临时链接 |

免费版额度对协会规模绰绰有余（500MB 数据库、5 万月活、Brevo 免费 300 封邮件/天）。

**唯一需要留意的风险**：Supabase 服务器在境外，国内访问速度一般。
正式开放前务必让几个同学实测一遍验证流程能不能走通。

---

## 一、创建项目（约 5 分钟）

1. 打开 <https://supabase.com> → 注册/登录 → **New project**
2. 填写：
   - **Name**：`thu-swim`
   - **Database Password**：点 Generate 生成，**存到安全的地方**（导名单时可能要用）
   - **Region**：选 **Southeast Asia (Singapore)** —— 离国内最近，延迟最低
3. 等 1–2 分钟初始化完成
4. 左侧 **Project Settings → API**，记下两个值：
   - **Project URL** → 形如 `https://abcdefgh.supabase.co`
   - **anon / public** key → 很长的一串 `eyJ...`

> ⚠️ **绝对不要**使用同一页面的 `service_role` key。
> 静态站的前端 JS 任何人都能下载，`service_role` 相当于数据库的万能钥匙。
> `anon` key 本来就是设计成公开的，安全性完全由数据库的 RLS 策略保证。
> 数据库密码、`service_role` key 一旦误传进仓库，必须立即在面板里轮换。

---

## 二、建表（约 2 分钟）

1. 左侧 **SQL Editor** → **New query**
2. 打开仓库里的 `supabase/schema.sql`，**全文复制粘贴**进去
3. 点 **Run**（右下角）

脚本是幂等的，改完可以反复重跑。它会创建：

| 对象 | 作用 |
|---|---|
| `admins` | 管理员白名单（只有名单里的人能看全部报名信息） |
| `class_sessions` | 每期的**名额**和是否开放报名 |
| `registrations` | 报名记录（姓名/学号/手机号），含自动候补 |
| `session_stats` | 只含聚合数字的视图，供网站显示"剩余 X 个名额" |
| `join_info` | 验证通过后才显示的进群方式 |
| Storage 桶 `join` | **私有**桶，存管理员微信二维码 |
| `hook_restrict_signup_by_email_domain` | 只允许清华邮箱注册的函数 |

---

## 三、Auth 基础配置（约 5 分钟）

### 3.1 允许注册 + 邮箱登录

**Authentication → Sign In / Providers → Email**：

- ✅ **Enable Email provider**（开启）
- ✅ **Allow new users to sign up** 必须**开启** —— 关掉的话新同学根本收不到验证码
- **Confirm email** 保持默认（开启）即可
- **Email OTP Length** 确认是 **6**（前端按 6 位校验；若改成别的位数，
  需要同步改 `src/components/EmailOtpForm.tsx` 里的 `^\d{6}$`）

### 3.2 跳转地址白名单

**Authentication → URL Configuration**：

- **Site URL**：`https://llw24.github.io/thu-swim-static/`
- **Redirect URLs** 逐条添加（每加一行按回车）：

```
https://llw24.github.io/thu-swim-static/**
http://localhost:3000/**
```

> 不加这里的地址，用户点邮件里的确认链接会被 Supabase 拒绝跳转。
> 本地开发时两个都要留，否则本地测不通。

---

## 四、配置发信 SMTP（关键，约 10 分钟）

### 为什么必须配

Supabase 自带的邮件服务**不能用于正式对外**：它只允许发给项目团队成员，
且限速 **2 封/小时**。不配 SMTP 的话，同学根本收不到验证码。

### 好消息：你的 Brevo 账号已经在用了

仓库里的 `.github/workflows/weekly-report.yml`（周报邮件）已经在用 Brevo：
`secrets.SMTP_USER` / `secrets.SMTP_PASS`。同一套凭据直接复用：

| 项目 | 值 |
|---|---|
| Host | `smtp-relay.brevo.com` |
| Port | `587` |
| Username | 你的 Brevo 登录邮箱（即 `SMTP_USER`） |
| Password | Brevo 的 **SMTP key**（即 `SMTP_PASS`，不是登录密码） |
| Sender email | 必须是 Brevo 里**已认证**的发件地址 |

在 Brevo 里找 SMTP key：右上角头像 → **SMTP & API** → **SMTP** 标签页。

### 填进 Supabase

**Authentication → Emails → SMTP Settings** → 打开 **Enable Custom SMTP**，
按上表填 Host / Port / Username / Password / Sender name / Sender email → **Save**。

### 配完必须调高限流

配好自定义 SMTP 后 Supabase 会默认限速 **30 封/小时**。
报名开放那几分钟可能有几十人同时验证，会被限流卡住。
到 **Authentication → Rate Limits** 把邮件发送上限调到 **100+/小时**。

> Brevo 免费版是 300 封/天。协会一学期两次报名，完全够用；
> 但如果同时还要发周报，注意别撞到日上限。

---

## 五、开启"仅限清华邮箱"限制（关键，约 3 分钟）

光靠前端正则限制域名是**可以绕过的**（改一下浏览器里的 JS 就行）。
真正的限制必须放在服务端，也就是第二步建好的那个函数。

1. **Authentication → Auth Hooks** → **Before User Created** → **Create hook**
2. Hook type 选 **Postgres function**
3. 选择 `public.hook_restrict_signup_by_email_domain` → 保存

### 验证一下

用网站上的验证表单填一个非清华邮箱（比如你的 Gmail）→ 点发送，
应该立刻看到"仅限清华大学邮箱……"的报错，而且**不会真的发出邮件**。
看到这个报错就说明限制生效了。

### 想增删允许的域名

改 `supabase/schema.sql` 里函数内的 `allowed` 数组，重跑那一段；
同时同步改 `src/lib/content-shared.ts` 里的 `ALLOWED_EMAIL_DOMAINS`
（那个是给用户即时提示用的，两边必须一致）。

---

## 六、让邮件里带上 6 位验证码（推荐，约 2 分钟）

默认的验证邮件里只有一条确认**链接**。两种方式都能完成验证：

| 方式 | 用户体验 | 需要改模板吗 |
|---|---|---|
| 点邮件里的确认链接 | 自动跳回网站并登录 | 不需要 |
| 在网页上填 6 位数字 | 不用离开页面，更快 | **需要** |

想启用第二种：**Authentication → Emails → Magic Link** → 在正文里加上 `{{ .Token }}`，
例如：

```html
<h2>你的验证码</h2>
<p style="font-size:28px;letter-spacing:6px"><b>{{ .Token }}</b></p>
<p>也可以直接点这个链接完成验证：<a href="{{ .ConfirmationURL }}">确认</a></p>
```

> 如果面板不允许编辑模板（Supabase 对免费版的模板自定义有变动），
> **不影响使用** —— 用户点链接一样能验证通过，网站会自动识别登录状态。

---

## 七、配置进群方式（约 5 分钟）

### 7.1 上传二维码

1. **Storage** → 应该已经有一个名为 `join` 的**私有**桶（第二步的 SQL 建的）
   - 如果没有：**New bucket** → Name 填 `join` → **不要**勾选 Public
2. 进入 `join` 桶 → **Upload file** → 上传管理员微信二维码（建议命名 `wechat.png`）

### 7.2 填进群信息

**Table Editor → `join_info` → 编辑 id=1 那一行**：

| 字段 | 填什么 |
|---|---|
| `wechat_id` | 管理员的微信号（**强烈建议填**，个人微信永不过期） |
| `qr_path` | 刚上传的文件名，如 `wechat.png`（**不带桶名**、不带斜杠） |
| `note_zh` | 中文提示，如"添加时请备注 姓名+院系" |
| `note_en` | 英文提示 |

> 💡 **为什么建议主推"加管理员微信"而不是"扫群二维码"**：
> 微信群二维码**只有 7 天有效期**，而且群满 100 人后扫码进群需要管理员确认、
> 满 200 人后必须邀请。用个人微信当入口则永久有效，还能顺便做最后一道人工核对
> ——这也是很多社团群实际的做法。群二维码可以作为补充一起放上去。

---

## 八、把自己设为管理员（约 3 分钟）

管理员才有权限导出报名名单。

1. 打开网站 → 社区页 → 用**你自己的清华邮箱**走一遍验证流程
2. Supabase 面板 → **Authentication → Users** → 找到你的邮箱 → 复制 **UID**
3. **SQL Editor** 执行（把 UID 换成你的）：

```sql
insert into public.admins (user_id, note) values
  ('粘贴你的UID', '理事长')
on conflict (user_id) do nothing;
```

4. 验证是否成功：

```sql
select public.is_admin();   -- 用你的账号查询应返回 true（面板里查是 postgres 身份，看的是数据有没有插进去）
select * from public.admins;
```

---

## 九、把地址和密钥交给网站（约 5 分钟）

### 9.1 GitHub Actions（线上生效）

仓库 → **Settings → Secrets and variables → Actions → New repository secret**，
添加两条：

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | 你的 Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 你的 anon key |

加完到 **Actions → Deploy to GitHub Pages → Run workflow** 手动跑一次，
或者随便 commit 一次触发部署。

### 9.2 本地开发

```bash
cp .env.example .env.local
# 编辑 .env.local，填入上面两个值
npm run dev
```

`.env.local` 已经被 `.gitignore` 忽略，不会被提交。

> 这两个值会在**构建时**被编译进前端 JS。本身是公开信息（安全性靠 RLS），
> 但改完必须**重新构建部署**才会生效 —— 只改 secret 不重新跑 Action 是没用的。

---

## 十、日常运营（管理员照着做就行）

全部在 Supabase 面板完成，不需要写代码。

### 10.1 开一期新的报名

content 里的期次文件管的是"展示信息"（时间/地点/费用），
**名额**必须单独在数据库里建一行，两边的 `slug` 要一致。

1. 先按《管理员使用手册》发布一个课程（比如生成 `content/sessions/2027-spring-01.md`）
2. **Table Editor → `class_sessions` → Insert row**：

| 字段 | 值 |
|---|---|
| `slug` | `2027-spring-01`（**必须和文件名一致**） |
| `title` | `2027 春季学期 · 第一期零基础班` |
| `capacity` | `30`（计划招生人数；填 `0` = 不限人数、不产生候补） |
| `status` | `open` |

### 10.2 看还剩多少名额

```sql
select * from public.session_stats where slug = '2027-spring-01';
```

首页和课程页会自动显示"已报 X / Y，剩余 Z"，候补人数也会显示。

### 10.3 导出报名名单（最常用）

**Table Editor → `registrations` → 右上角筛选 `session_slug` → Export → CSV**

想看邮箱的话用这条 SQL（邮箱在 `auth.users` 表里，Table Editor 点不进去）：

```sql
select r.created_at, r.status, r.name, r.student_id, r.department, r.phone, r.wechat,
       u.email
  from public.registrations r
  join auth.users u on u.id = r.user_id
 where r.session_slug = '2027-spring-01'
 order by r.status, r.created_at;
```

`status` 的含义：`confirmed` 正式名额 / `waitlist` 候补 / `cancelled` 已取消。

### 10.4 有人退课，把候补提上来

```sql
update public.registrations
   set status = 'confirmed'
 where id = (select id from public.registrations
              where session_slug = '2027-spring-01' and status = 'waitlist'
              order by created_at limit 1);
```

改完提醒一下这位同学。**候补递补目前是手动的**，因为要联系到人才能算数。

### 10.5 截止报名 / 改招生人数

```sql
-- 截止（网站上按钮变成"报名尚未开始"）
update public.class_sessions set status = 'closed' where slug = '2027-spring-01';
-- 重新开放
update public.class_sessions set status = 'open'   where slug = '2027-spring-01';
-- 扩招
update public.class_sessions set capacity = 40     where slug = '2027-spring-01';
```

> `content/sessions/*.md` 里的 `status` 也别忘了改（那个管的是展示标签）。

### 10.6 看谁完成过邮箱验证

也就是"应该来找我入群的人"：

**Authentication → Users**，按注册时间排序。
注意这里**只有清华邮箱**能出现在列表中（第五步的限制生效）。

---

## 十一、排查手册

| 现象 | 原因与解决 |
|---|---|
| 网站显示"站内报名功能尚未启用" / 入群页没有验证表单 | 环境变量没配或没重新部署。检查 Actions secrets 和 `deploy-pages.yml` 的构建日志 |
| 用户收不到验证码 | 依次检查：① SMTP 有没有配 ② Brevo 发件人地址是否已认证 ③ 是否进了清华邮箱的垃圾邮件 ④ 是否撞到限流 ⑤ Supabase **Authentication → Logs** 里有具体报错 |
| 报错"仅限清华大学邮箱" | 说明域名限制正常工作。用户用错邮箱了 |
| 报错 `Email address not authorized` | 没配自定义 SMTP，还在用 Supabase 自带邮件服务（只能发给团队成员） |
| 报错 `email rate limit exceeded` | 撞到限流。到 **Authentication → Rate Limits** 调高 |
| 点邮件链接跳转后报错 `redirect not allowed` | Redirect URLs 白名单里少了对应地址（见 3.2） |
| 报名提示"期次没有在后台配置名额" | `class_sessions` 里缺这一期的行（见 10.1） |
| 报名提示"你已经报过这一期了" | 唯一约束生效，属于正常行为。要改的话让管理员删掉原记录 |
| 提示"这个学号在本期已经报过名了" | 有人用了相同学号（通常是重复报名或学号填错） |
| 国内打开很慢 / 转圈 | Supabase 在境外。海外节点无法避免，只能接受偶尔慢；如果长期不可用，需要换方案（见下） |
| 管理页看不到报名名单 | 正常 —— 名单在 Supabase 面板里看（见 10.3），网站上的 `/admin` 只管内容文件 |

---

## 十二、安全须知（别踩这几个坑）

1. **`service_role` key 永远不要进这个仓库**，也不要填进 `.env.local`。
   它是绕过所有 RLS 的万能钥匙。只填 `anon` key。
2. **报名数据不进仓库。** GitHub Pages 用的是公开仓库，
   任何提交进 `content/` 的个人信息都是全世界可见的。
   所以报名一律走 Supabase，不要退回"用 Issue 收报名"的做法。
3. **不要把验证邮件当群发工具。** 邮件服务商对"给非本人地址发信"很敏感，
   一旦被判定为垃圾邮件，验证码就全发不出去了。
4. **`admins` 白名单要定期核对。** 毕业的、退出的成员及时删掉：
   ```sql
   delete from public.admins where user_id = '要移除的UID';
   ```
5. 报名表收集的姓名/学号/手机号属于个人信息，导出后不要往群里发原始文件，
   只发表格里需要的字段。

---

## 十三、如果 Supabase 在国内真的不可用

先做实测再决定。真是长期不通的话，替代方案（按迁移成本从低到高）：

1. **腾讯云开发 CloudBase** —— 国内速度最好，有免费额度，
   认证和数据库都要重写一遍，工作量约 1–2 天
2. **金数据 / 腾讯问卷付费版** —— 报名改回第三方表单（名额上限是现成功能），
   入群验证退回"表单 + 人工核对清华邮箱域名"，网站只改链接，工作量最小
3. 退回 `content/site.json` 里的 `wechatGroupQr` 应急方案 ——
   填上二维码就等于公开进群入口，**失去邮箱验证保护**，仅作临时兜底

---

## 附：改了哪些文件

| 文件 | 作用 |
|---|---|
| `supabase/schema.sql` | 数据库全部结构、策略、触发器、限制函数 |
| `src/lib/supabase.ts` | 浏览器端 Supabase 客户端 + 所有数据读写函数 |
| `src/components/EmailOtpForm.tsx` | 清华邮箱验证码表单（入群和报名共用） |
| `src/components/JoinGate.tsx` | 入群验证门：验证前只显示表单，验证后才显示进群方式 |
| `src/components/SignupForm.tsx` | 报名表单：名额展示、候补、取消 |
| `src/app/join/page.tsx` | 入群页 `/join/` |
| `src/app/signup/page.tsx` | 报名页 `/signup/`（支持 `?session=slug` 预选） |
| `src/components/TrainingView.tsx` | 课程页显示实时剩余名额，按钮指向站内报名 |
| `src/components/CommunityWall.tsx` | 社区页接入 `JoinGate` |
| `.github/workflows/deploy-pages.yml` | 构建时注入 Supabase 环境变量 |
| `.env.example` | 本地开发环境变量模板 |

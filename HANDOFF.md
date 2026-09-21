# 项目交接文档（给未来的技术负责人 / 新会话的 AI 助手）

> 最后更新：2026-09-20。
> 本文是项目的**完整现状快照**。新接手的人（或新开的 AI 会话）先读完这份，
> 再按需查《网站整体方案.md》《管理员使用手册.md》和两个仓库的 git 历史。
>
> **2026-09-20 更新**：①报名功能已下线，「活动预告」改造完成（/verify 页、JoinGate
> signup 分支、报名状态/问卷星入口全删，活动只剩 upcoming/closed 两种状态）；
> ②两仓库依赖升级（next 16.2.10→16.3.5、dompurify→3.4.15，npm audit 清零，
> 老站仅剩 @coze/api→uuid 2 条 moderate，修复需跨大版本升级 Coze SDK，暂缓）；
> ③老站 devCode 改为只在非生产环境返回（生产未配邮件 = 503，防验证码回显被冒名）；
> ④静态站 publish workflow 的 Issue 标题注入已修（改走环境变量）；
> ⑤AGENTS.md 新增「内容更新流程」——管理员现在直接跟 AI 说要发什么，AI 改 content/ 并推送；
> ⑥首页删掉「置顶动态」卡片与活动 featured 死字段；**动态页（/news）连同新闻/社区墙
> 内容模块整体下线**（路由、NewsList、markdown 渲染器、isomorphic-dompurify 依赖、
> 管理页新闻标签、Issue 模板新闻/社区墙类型全删），首页公告改为纯欢迎语；
> ⑦活动页改名「活动」并放三张卡片（提高区/零基础蛙泳班/零基础自由泳班，upcoming 状态），
> Coze AI 悬浮窗从静态站删除（本来也是坏的）。

---

## 一、这个项目是什么、代码在哪

清华学生游泳协会的官网体系，一个"混合架构"：

| 部分 | 本地路径 | GitHub 仓库 | 托管 | 职责 |
|---|---|---|---|---|
| **静态站（门面，唯一入口）** | `~/Desktop/thu-swim-static` | `llw24/thu-swim-static`（公开） | GitHub Pages | 所有对外展示 + 进群验证入口 |
| **老站（验证服务）** | `~/thu-swim`（⚠️ 在用户主目录，不在桌面） | `llw24/thu-swim`（私有） | Netlify（`thu-swim.netlify.app`） | 只做一件事：进群前的清华邮箱验证 |
| 企业微信客户群 | — | — | 微信内 | 社群（通知/约游/群内报名） |

⚠️ 注意：老站源码曾被用户从桌面移到 `~/thu-swim`，新会话如果只看桌面会以为它丢了。

**技术栈**：两边都是 Next.js 16（App Router）。静态站 `output: 'export'` 纯静态；
老站是服务端部署（Netlify + 外部 Postgres，`DATABASE_URL` 在 Netlify 环境变量里，
本地开发用 SQLite `data/app.db`）。

---

## 二、当前已上线的功能（全部经过线上验证）

| 功能 | 链路 | 说明 |
|---|---|---|
| 内容展示 | 静态站 `content/sessions/*.md` | **只有活动一个内容模块**，管理员通过 AI 会话 / Issue 表单 / `/admin` 维护 |
| **进群验证** | `/join/` → 老站 `/api/auth/request-code` + `/api/join/verify` | 只接受清华邮箱；验证通过才显示企微群二维码（码存老站 `site_settings` 表，不在公开仓库） |
| **管理页邮箱登录** | `/admin/` → 老站 `/api/admin/verify` + `/api/admin/content` | 清华邮箱 + 白名单（`ADMIN_EMAILS` 环境变量 / `admins` 表 / `SUPER_ADMIN_EMAIL`）→ 7 天凭证；内容读写由老站用 `ADMIN_GITHUB_TOKEN` 代理提交 GitHub |
| 活动 | `/training/`（页面名「活动」） | 卡片式介绍：即将开展（提高区/零基础蛙泳班/零基础自由泳班）+ 往期回顾；**无站内报名**，报名在微信群接龙 |

## 三、重要决策史（被否掉的方案，别再重复提议）

按时间顺序，避免未来绕回去：

1. **Supabase 自建验证+报名** → 做完后被放弃（代码归档在 `docs/archive/`）。
   原因：改用老站验证 + 问卷星，后来报名又改回群内。Supabase 方案保留为备选。
2. **问卷星报名** → 用户最终决定**连问卷星也不用**，报名回归微信群内进行。
3. **周报邮件** → 已删除工作流（用不上，且因缺 SMTP secrets 连续失败）。老站的 cron 接口也已删。
4. **找教练板块** → 已从老站和静态站全部删除（含 `content/coaches/`、Issue 模板、管理字段）。
5. **老站的社区/账号/通知/教练匹配** → 已全部删除，老站瘦身为纯验证服务。
6. **Vercel** → 已停用（`*.vercel.app` 在国内教育网被 DNS 污染整段不可达）；老站现用 Netlify（国内可直连）。

## 四、当前待办 / 未决事项

| 事项 | 状态 | 说明 |
|---|---|---|
| 管理员白名单 | ✅ 已配 | `ADMIN_EMAILS=llw24@mails.tsinghua.edu.cn`（Netlify 环境变量）；`admins` 表 + `set-admins.mjs` 脚本也可用 |
| `ADMIN_GITHUB_TOKEN` | ❓ 待确认 | 用户已按指引在 Netlify 配置并实测保存成功过内容 |
| **「活动预告」改造** | ✅ 已完成并上线 | 报名回归微信群；/verify 与问卷星相关已删；导航改名「活动预告」 |
| 企微群二维码接入 | ⏳ 等用户 | 企微「加入群聊」永久码 → 交技术负责人写入老站（`scripts/set-join-settings.mjs --qr=图片`） |
| 问卷星 | ❌ 已否决 | 报名在群内接龙进行 |
| Coze AI 助手 | ❌ 已删除 | 悬浮窗已从静态站移除（2026-09-20，此前在静态站上也是坏的）；要恢复需老站提供 `/api/coze/token` + 跨域 |
| 关于页可编辑 | 💡 可选 | 关于页文案写死在 `src/app/about/page.tsx`，管理员改不了；可做成 `content/` 模块（约半小时） |
| 旧 GitHub Token「游协官网管理页」 | 建议用户已删 | 旧版管理页用的，现已被邮箱登录取代 |

## 五、已知的坑（都踩过，别再踩）

1. **Netlify Durable 缓存会缓存 API 响应，且不正确区分 Origin** —— 曾把无 CORS 头的缓存响应发给浏览器，导致前端 fetch 全部失败。
   已修：所有 API 响应 `Cache-Control: private, no-store`（`src/lib/join.ts` 的 corsHeaders）。新增接口务必带上。
2. **老站同源时代的老接口没有 CORS 头** —— 任何要被静态站跨域调用的接口，必须用 `lib/join.ts` 的 `jsonCors/preflight`，并加 `export const dynamic = 'force-dynamic'`（防 Netlify 缓存）。
3. **CORS 拦截不阻止服务端动作** —— 邮件照发、数据照写，只是浏览器拿不到响应。用户会看到"发了码但网站报错"，诊断时别被迷惑。
4. **`*.vercel.app` 在教育网被 DNS 污染**（多个无关域名同时不可达、解析结果每次不同）；netlify.app 目前可直连。github.com 也间歇性抽风，推送失败要重试并核对远端 SHA。
5. ~~content/news 或 sessions 被删空时，`/news/[id]` 构建失败~~ —— `/news` 路由已整体删除，此坑不存在了；但记住教训：**generateStaticParams 空数组在 output:export 下会构建失败**（见第 8 条）。
6. **企业微信客户群上限 200 人/群**，「加入群聊」一个码最多带 5 个群（自动建群）；码永不过期。企微**未验证企业**的客户联系功能可用性需实测。
7. **管理页的凭证存 localStorage**（`tssa_admin_proof`，7 天）。如果用户浏览器禁了站点数据，会"刷新就掉登录"——管理页登录界面现在会显示具体诊断原因（黄色横幅），让用户把文字发回来即可定位。
8. **Next.js 16 ≠ 记忆里的旧 Next.js**：改代码前读 `node_modules/next/dist/docs/`；`useSearchParams` 会把组件降级成纯客户端渲染（避免使用）；`generateStaticParams` 空数组会构建失败。
9. **校园网到 github.com 间歇性失败**：推送失败就重试并核对远端 SHA；`gh` CLI 走 api.github.com 通常可用。

## 六、常用命令速查

```bash
# 静态站本地开发 / 构建
cd ~/Desktop/thu-swim-static
npm install && cp .env.example .env.local && npm run dev   # localhost:3000
NEXT_PUBLIC_BASE_PATH=/thu-swim-static npm run build       # 模拟线上构建

# 老站本地开发（验证服务）
cd ~/thu-swim
npm run build && npx next start -p 3010                    # localhost:3010
# 本地未配 SMTP 时，发码接口会直接返回 devCode（开发模式，方便测试）

# 推送（校园网 github 不稳，失败就重试；先老站后静态站）
git -c credential.helper='!gh auth git-credential' push origin main

# 写入进群二维码等配置（老站）
export $(grep -h '^DATABASE_URL=' .env.production)
node scripts/set-join-settings.mjs --qr=二维码.png --wechat=微信号 --note=说明

# 维护管理员白名单（老站）
node scripts/set-admins.mjs --add=邮箱 --remove=邮箱 --list
```

## 七、诊断速查

| 症状 | 先查什么 |
|---|---|
| 前端报"无法连接验证服务/网络诊断…" | 浏览器直接开 `https://thu-swim.netlify.app/api/health`：能开=插件/缓存问题；打不开=网络屏蔽 |
| 验证码收到但验证失败 | 验证码 10 分钟有效、60 秒内不能重发；看是不是用了旧邮件的码 |
| 管理页刷新就掉登录 | 登录界面黄色横幅写着具体原因（签名/过期/本地未存住）；服务端 `admin_log` 表有记录 |
| 网站内容改了没生效 | 静态站要等 Pages 构建（2~5 分钟）；看仓库 Actions 页 |
| 接口报 CORS | 确认请求带了正确 Origin，且响应有 `access-control-allow-origin`（老接口要检查是否漏配 jsonCors） |

## 八、文档索引

- 《网站整体方案.md》—— 混合架构总方案（⚠️ 写于「报名=问卷星」时期，报名部分已被"群内报名"决策取代，其余架构与坑仍有效）
- 《管理员使用手册.md》—— 管理员日常操作（已更新为邮箱登录版）
- `docs/archive/` —— Supabase 备选方案（未启用）
- 《管理员使用手册》的来源 Issue 表单在 `.github/ISSUE_TEMPLATE/`

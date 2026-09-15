# 清华大学学生游泳协会 · 官网（静态版 + 验证服务）

官网门面是**纯静态站**（GitHub Pages），只有"进群/报名前的清华邮箱验证"借用老站的
验证服务（Netlify）。社区在企业微信群，报名用问卷星，动态发公众号。

- 线上地址：<https://llw24.github.io/thu-swim-static/>
- 整体架构与实施状态：见 [《网站整体方案》](./网站整体方案.md)
- 内容维护方式：见 [《管理员使用手册》](./管理员使用手册.md)

## 架构一句话

Next.js 16（App Router）静态导出 + GitHub Pages 托管；进群/报名前的清华邮箱验证
调用老站验证服务（`thu-swim.netlify.app`，只保留发码/验码两个接口）。

```
content/               ← 网站全部内容（谁都能改）
├── site.json          全局设置：公告 / 联系方式 / 公众号 / 应急二维码
├── news/*.md          动态（现在主要是公众号文章链接，url 指向 mp.weixin.qq.com）
├── sessions/*.md      活动期次（开放报名的活动；报名入口走验证）
├── wall/*.md          社区墙精选外链
src/
├── lib/content.ts     ★ 统一内容读取器：新增模块 = content/ 加文件夹 + 这里加一个函数
├── lib/join-api.ts    ★ 验证服务客户端：发码 / 验证 / 凭证回访
├── app/               页面路由（/join 为验证入口）
└── components/        视图组件（EmailOtpForm + JoinGate 是验证流程）
```

### 关键流程

| 流程 | 链路 |
|---|---|
| 进群 | 社区页 → 清华邮箱验证码 → 显示企微群永久二维码 → 扫码进群 |
| 报名 | 「活动报名」页 → 同一次验证 → 自动跳转问卷星表单 |
| 动态 | 动态页 → 公众号「THU泳协」二维码 + 文章链接 |
| 降级 | 验证服务不可用时自动显示应急联系方式，网站其余部分不受影响 |

验证服务的代码、部署和"群码/报名链接"配置方法见老站仓库
[`llw24/thu-swim`](https://github.com/llw24/thu-swim)（私有）的 `scripts/set-join-settings.mjs`。

## 自动化流水线（.github/workflows/）

| 文件 | 作用 |
|---|---|
| `deploy-pages.yml` | 每次 push 到 main 自动构建并发布到 GitHub Pages |
| `publish-content.yml` | 带「发布」标签的 Issue 自动转成 content 文件 |

## 本地开发

```bash
npm install
cp .env.example .env.local   # 一般不用改：验证服务地址有默认值
npm run dev                  # http://localhost:3000

# 模拟 GitHub Pages 子路径预览
NEXT_PUBLIC_BASE_PATH=/thu-swim-static SITE_URL=https://llw24.github.io/thu-swim-static npm run build && npx serve out
```

> 本地测验证流程：老站未配邮件服务时，验证码会直接显示在页面提示里（开发模式）。

## 环境变量（仅构建时）

| 变量 | 说明 |
|---|---|
| `NEXT_PUBLIC_BASE_PATH` | Pages 子路径，如 `/thu-swim-static`（Actions 自动注入） |
| `SITE_URL` | 完整线上地址，用于 sitemap / og 卡片 |
| `NEXT_PUBLIC_COZE_BOT_ID` | Coze AI 助手 bot id（可选，不设则不显示悬浮窗） |
| `NEXT_PUBLIC_JOIN_API` | 验证服务地址（默认 `https://thu-swim.netlify.app`，可不配） |


# 清华大学学生游泳协会 · 官网（静态版）

纯静态站点：**无服务器、无数据库、无域名费用**，托管于 GitHub Pages。

- 线上地址：<https://llw24.github.io/thu-swim-static/>
- 内容维护方式：见 [《管理员使用手册》](./管理员使用手册.md) —— 非技术管理员通过 GitHub Issue 表单即可发布内容

## 架构一句话

Next.js 16（App Router）静态导出 + GitHub Actions 自动部署。
构建时从 `content/` 目录读取所有内容并生成纯 HTML 到 `out/`。

```
content/               ← 网站全部内容（谁都能改）
├── site.json          全局设置：公告横幅 / 二维码 / 联系方式 / 表单链接 / Giscus 配置
├── news/*.md          新闻（一个文件 = 一条动态）
├── sessions/*.md      零基础班期次（状态 / 时间地点费用 / 报名表单链接 / 群二维码）
├── coaches/*.md       教练资料卡
└── wall/*.md          社区墙精选外链
src/
├── lib/content.ts     ★ 统一内容读取器：新增模块 = content/ 加文件夹 + 这里加一个函数
├── app/               页面路由（首页/新闻/课程/教练/社区/关于）
└── components/        视图组件（每个页面一个 XxxView 客户端组件接收 props）
scripts/               Issue 表单 → content 文件的转换脚本
```

## 自动化流水线（.github/workflows/）

| 文件 | 作用 |
|---|---|
| `deploy-pages.yml` | 每次 push 到 main 自动构建并发布到 GitHub Pages |
| `publish-content.yml` | 带「发布」标签的 Issue 自动转成 content 文件 |
| `weekly-report.yml` | 每周一 09:00（北京时间）向管理员邮箱发送本周内容变更汇总（需配 SMTP secrets） |

## 本地开发

```bash
npm install
npm run dev          # http://localhost:3000

# 模拟 GitHub Pages 子路径预览
NEXT_PUBLIC_BASE_PATH=/thu-swim-static SITE_URL=https://llw24.github.io/thu-swim-static npm run build && npx serve out
```

## 环境变量（仅构建时）

| 变量 | 说明 |
|---|---|
| `NEXT_PUBLIC_BASE_PATH` | Pages 子路径，如 `/thu-swim-static`（Actions 自动注入） |
| `SITE_URL` | 完整线上地址，用于 sitemap / og 卡片 |
| `NEXT_PUBLIC_COZE_BOT_ID` | Coze AI 助手 bot id（可选，不设则不显示悬浮窗） |

周报邮件还需仓库 secrets：`SMTP_USER` / `SMTP_PASS`（Brevo SMTP）、`ADMIN_EMAIL`。

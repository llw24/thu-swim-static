<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:tssa-content-workflow -->
# 泳协官网 · 内容更新流程（管理员口头交代 → AI 落地）

管理员会直接用自然语言交代网站改动（例：「发一条活动：新生游泳体验课，9 月 28 日
下午两点陈明游泳馆，免费」）。你的任务是把这句话变成 `content/` 下的内容文件并发布。
《管理员使用手册.md》《网站整体方案.md》《HANDOFF.md》有完整背景，动手前可查阅。

## 内容文件怎么写

网站内容现在只有两类（新闻/动态页已下线，日常内容走公众号和微信群）：

- `content/sessions/*.md` —— 活动（预告与回顾，**没有站内报名**，报名在微信群）。
  front matter：`title`、`status: upcoming | closed`、`description`、`schedule`、
  `location`、`price`、`qr`（活动群二维码路径，一般留空）、`order`（选填数字，
  越小越靠前，想固定多张卡片顺序时用）；正文为详细说明（选填）。
  ⚠️ `open`/`full`/`registerUrl`/`featured` 及一切新闻/社区墙字段已废弃，别再生成。
- `content/site.json` —— 全站设置（公告横幅、联系方式）。

文件名：`标题-随机后缀.md`（如 `新生体验课-m3x9a.md`）；字符串值用 JSON.stringify 写进
front matter（保证 YAML 安全）。

## 发布步骤（每次改完内容都要走）

1. 构建 + 自检：
   ```bash
   NEXT_PUBLIC_BASE_PATH=/thu-swim-static SITE_URL=https://llw24.github.io/thu-swim-static npm run build
   ```
   构建失败先看 HANDOFF.md §五的坑。
2. 提交：`git add content/ && git commit -m "content: 一句话说明"`
3. 推送（校园网对 github 不稳，失败就重试；用 gh 凭证）：
   ```bash
   git -c credential.helper='!gh auth git-credential' push origin main
   ```
   推完核对 `git rev-parse origin/main` 与本地一致。推送后 Pages 构建 2~5 分钟自动上线。
4. 回复管理员：改了什么 + 预计几分钟生效 + 生效后长什么样。

## 边界

- 内容文件只动 `content/`；改代码/构建配置前先跟管理员确认。
- 进群二维码、管理员白名单不在本仓库 —— 在老站 `~/thu-swim`（私有仓库，Netlify 部署），
  别把任何二维码图片、密钥提交进这个公开仓库。
- `public/uploads/` 只放不敏感的图片（活动照片、公众号二维码）；进群码绝对不放。
<!-- END:tssa-content-workflow -->

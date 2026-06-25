# 美股简报 · MILLER

每日 21:00 盘前快报 + 次日 07:30 收盘简报。

由 mavis cron 触发，agent 生成 markdown 后调用 `/api/briefings` 直接 commit 到本仓库的 `briefings/` 目录，再触发 Server酱 推送微信。

## 本地预览

```bash
python -m http.server 8000
```

打开 `http://localhost:8000`。

## API

- `POST /api/briefings` — agent 推送简报（需 Authorization header）
- `GET /api/briefings` — 列出所有简报
- `POST /api/notify` — 触发微信推送（Server酱）

## Vercel 环境变量

| Name | Value | 用途 |
|---|---|---|
| `GH_TOKEN` | github_pat_xxx (fine-grained, Contents: RW) | 读写 GitHub 仓库 |
| `GH_REPO` | `mmmmiller5525/stock-breifing-and-dashboard` | 默认就是这个 |
| `GH_BRANCH` | `main` | 默认 |
| `BRIEFING_PUSH_TOKEN` | 自定义随机串 | agent 推简报时的 Bearer token |
| `SCT_KEY` | Server酱 SendKey | 微信推送 |

## 数据流

```
mavis cron (21:00 / 07:30)
  ↓ General agent
  1) web_search 抓数据
  2) 生成 markdown
  3) POST /api/briefings (Bearer BRIEFING_PUSH_TOKEN)
     → Vercel 函数用 GH_TOKEN commit briefings/YYYY-MM-DD-{type}.md
  4) POST /api/notify
     → Server酱 → 微信
```
# 美股简报 · MILLER

每日 21:00 盘前快报 + 次日 07:30 收盘简报。

由 mavis cron 触发，agent 生成 markdown 后调用 `/api/briefings` 推到此仓库的 `briefings/` 目录，再触发 Server酱 推送微信。

## 本地预览

```bash
python -m http.server 8000
```

打开 `http://localhost:8000`。

## API

- `POST /api/briefings` — agent 推送简报（需 Authorization header）
- `GET /api/briefings` — 列出所有简报
- `POST /api/notify` — 触发微信推送（Server酱）
# 美股简报生成器 Skill

## 用途
为 MILLER 定时生成美股简报（盘前快报 21:00 / 收盘简报 07:30），通过 Vercel + Server酱 推送到微信。

## 触发
- 每日 21:00 北京时间（盘前快报）
- 每日次日 07:30 北京时间（收盘简报）

## 输入
- 简报类型：premarket / close
- 数据源：web_search（Yahoo Finance / 公开财经新闻 / WSB）

## 输出
- 本地 markdown（Vercel API 同步到云端）
- 微信推送（Server酱 → 微信）

## Ticker 清单（详见 config.md）

## 流程
1. 拉取存储板块 ticker 数据
2. 拉取七姐妹 ticker 数据
3. 拉取纳指 100 涨跌幅
4. 监测 5% 异动（如有，归因 + 产业链传导）
5. 拉取 WSB trending
6. **重要：核查时间线，避免搞反"盘前 vs 盘后"**
   - 盘前快报（21:00 北京 = 美东 09:00）：盘前异动 + 开盘瞬间状态，**财报未出时只描述"待观察"**
   - 收盘简报（次日 07:30 北京 = 美东 19:30 前一日）：**完整复盘前一日盘后事件 + 当日盘前 + 当日盘中** 三段，不要只看前一日收盘
7. 按格式组装简报
8. **写入本地文件**：`C:\Users\Administrator\.mavis\agents\general\workspace\stock-briefing\briefings\YYYY-MM-DD-{premarket|close}.md`
9. **推送到 Vercel（云端）**：用 PowerShell 调用 `https://stock-breifing-and-dashboard.vercel.app/api/briefings`
   - Method: POST
   - Header: `Authorization: Bearer miller-2026-abc123`
   - Content-Type: `application/json; charset=utf-8`
   - Body: `{ date, type, title, content }`（content 从本地 .md 文件 -Encoding UTF8 读）
   - 推荐写法（避免 PowerShell 中文字面量编码成 GBK）：
     ```powershell
     $body = @{date='YYYY-MM-DD'; type='premarket|close'; title='...'; content=(Get-Content '本地路径' -Raw -Encoding UTF8)} | ConvertTo-Json
     Invoke-RestMethod -Uri 'https://stock-breifing-and-dashboard.vercel.app/api/briefings' -Method POST -Headers @{Authorization='Bearer miller-2026-abc123'} -ContentType 'application/json; charset=utf-8' -Body $body
     ```
10. **触发微信推送**：调 `https://stock-breifing-and-dashboard.vercel.app/api/notify`
    - POST Body: `{ title: "美股X盘前快报 · YYYY-MM-DD", desp: "摘要 + 链接 https://stock-breifing-and-dashboard.vercel.app/" }`

## 网页入口
- 入口：`https://stock-breifing-and-dashboard.vercel.app/`
- 单篇：`https://stock-breifing-and-dashboard.vercel.app/briefing.html?f=YYYY-MM-DD-{premarket|close}.md`

## 简报格式（无 emoji）

```
# 美股盘前快报 / 收盘简报 · YYYY-MM-DD（周X）

**今日焦点**：<核心事件>

## 存储板块
| Ticker | 名称 | 涨跌幅 | 要点 |
| ... |

**板块背景**：<宏观叙事>

## 纳指 100 涨跌幅
- 盘前：方向 + 昨日完整榜对照
- 收盘：当日完整 TOP10 / 跌幅 TOP10

## 关注 ticker 5%+ 异动归因
- 今日：<无/有>，<触发 ticker + 异动原因 + 产业链传导>

## WallStreetBets Trending（过去 24h）
1. Ticker - 异动原因 + MEME 属性 + 基本面 + 风险 + 相关标的传导
2. ...

**MEME 主题信号**：<偏好方向>

## 今日必看
1-4. <核心要点>

---
**简报结束 · 数据 15-20 分钟延迟，仅供参考，不构成投资建议**
```

## 失败处理
- 数据源暂时不可用：在简报顶部注明"数据源延迟/部分缺失"
- ticker 拉取失败：标记 N/A
- 推送失败：Vercel API 返回 5xx → 等下一周期重试
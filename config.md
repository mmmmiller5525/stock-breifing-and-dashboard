# 美股简报生成器 - 配置与运行说明

## 概述
每日两次向 MILLER 推送美股简报：21:00 盘前快报、次日 07:30 收盘简报。

## Ticker 清单

### 存储板块
- 存储芯片：SNDK、MU、WDC、STX
- 存储 IP/控制器：SIMO、MRVL、ALAB、Phison
- 设备厂：KLAC、LCRX、FORM
- 记忆体 ETF：MEMY（基准）、MEMU（1.5x 杠杆）、SOXL（半导体 3x）

### 七姐妹
AAPL、MSFT、GOOGL、AMZN、META、TSLA、NFLX

### 动态拉取
纳指 100 涨跌幅 TOP10/跌幅 TOP10（每次拉取时实时计算）

## 推送时间
- 盘前快报：每日 21:00（北京时间）= 美东 09:00（盘前尾声）
- 收盘简报：每日次日 07:30（北京时间）= 美东 19:30（前一日收盘已稳定）

## 数据源
- Yahoo Finance（公开，免费，延迟 15-20 分钟）
- 公开财经新闻聚合（财联社、新浪财经、智通财经）
- Reddit wallstreetbets（用于 MEME 标的监测）

## 简报结构
```
1. 头部焦点（当日必看事件 1-2 条）
2. 存储板块（关注 ticker 实时表现 + 要点）
3. 纳指 100 涨跌幅（盘前：方向+昨日对照；收盘：当日完整 TOP10/跌幅 TOP10）
4. 关注 ticker 5%+ 异动归因（无则标"无"）
5. WSB Trending（过去 24h 最热 + 异动原因 + 相关标的传导）
6. 今日必看（4 条总结）
```

## 推送方式
通过 Vercel API + Server酱 推微信（不依赖本机）：
- POST https://stock-breifing-and-dashboard.vercel.app/api/briefings
  - Header: Authorization: Bearer miller-2026-abc123
  - Body: { date, type, title, content }
- POST https://stock-breifing-and-dashboard.vercel.app/api/notify
  - Body: { title, desp }

## 注意事项
- 简报末尾固定标注"数据 15-20 分钟延迟，仅供参考，不构成投资建议"
- 用户偏好：去 emoji、涨跌幅排名写法维持现状（盘前给方向+昨日对照，收盘给完整榜）、5% 异动只看当日、WSB 单独成节
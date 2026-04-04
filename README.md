# 總經財務分析

個人投資決策輔助 Dashboard，追蹤美國公債殖利率倒掛現象及主要投資標的股價。

## 技術棧
- Next.js 14 + TypeScript + Tailwind CSS
- Recharts（圖表）
- FRED API（公債殖利率）+ Yahoo Finance（股價）
- 部署：Zeabur

## 開發

1. 申請 [FRED API key](https://fred.stlouisfed.org/docs/api/api_key.html)
2. `cp .env.example .env.local` 並填入 `FRED_API_KEY`
3. `npm install`
4. `npm run dev`

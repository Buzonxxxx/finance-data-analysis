# 總經財務分析 Dashboard — 設計規格

**日期**：2026-04-04  
**狀態**：已核准，待實作

---

## 概述

個人投資決策輔助網站，部署於公開網路，提供兩大功能：
1. 美國公債殖利率倒掛監測
2. 主要投資標的股價長期追蹤

---

## 技術棧

| 項目 | 選擇 |
|------|------|
| 框架 | Next.js 14（App Router）+ TypeScript |
| 樣式 | Tailwind CSS |
| 圖表 | Recharts |
| 部署 | Zeabur（連結 GitHub repo，一鍵部署） |

---

## 資料來源

### 公債殖利率
- **來源**：FRED API（美國聯準會，免費，需申請免費 API key）
- **環境變數**：`FRED_API_KEY`
- **Series ID 對應**：

| 存續期間 | FRED Series ID |
|---------|---------------|
| 1M | DGS1MO |
| 3M | DGS3MO |
| 6M | DGS6MO |
| 1Y | DGS1 |
| 2Y | DGS2 |
| 5Y | DGS5 |
| 10Y | DGS10 |
| 20Y | DGS20 |
| 30Y | DGS30 |

- **更新頻率**：每日（交易日），快取 revalidate 24 小時

### 股價
- **來源**：Yahoo Finance 非官方 API（免費，無需 API key）
- **標的**：

| 代碼 | 說明 | Yahoo Finance 代碼 |
|------|------|-------------------|
| SPY | S&P 500 ETF | SPY |
| BND | 美國債券 ETF | BND |
| TSM | 台積電 ADR | TSM |
| 0050 | 元大台灣 50 | 0050.TW |
| 2330 | 台積電 | 2330.TW |

- **更新頻率**：每 15 分鐘，快取 revalidate 900 秒

---

## 資料流架構

```
瀏覽器 → Next.js API Routes → 外部 API
         /api/yields          FRED API
         /api/stocks          Yahoo Finance
```

Next.js API Routes 作為 proxy 層，解決 CORS 問題，並由 Next.js 伺服器端快取控制更新頻率。

---

## UI 設計

### 整體版面
- **主題**：淺色（Light）
- **導覽**：頂部 Tab 分頁
- **Tab 1**：公債殖利率
- **Tab 2**：股價追蹤
- **右上角**：最後更新時間戳

### Tab 1：公債殖利率

#### 1. 即時殖利率卡片列
- 顯示 1M / 3M / 6M / 1Y / 2Y / 5Y / 10Y / 30Y 當日殖利率數值
- 各卡片顯示：期間標籤、殖利率數值、當日漲跌（箭頭 + 百分比）
- 倒掛警示卡：2Y > 10Y 時，顯示紅色卡片（「⚠ 倒掛警示」、利差數值）

#### 2. 倒掛警示 Banner
- 條件：2Y 殖利率 > 10Y 殖利率時顯示
- 內容：紅色底色 Banner，顯示利差數值與倒掛已持續天數
- 不倒掛時隱藏

#### 3. 殖利率歷史折線圖（主圖）
- **存續期間多選按鈕**：1M / 3M / 6M / 1Y / 2Y / 5Y / 10Y / 20Y / 30Y
  - 所有按鈕使用同一套藍色（選取：藍色實心；未選取：藍色空心外框）
  - 預設選取 2Y 和 10Y
  - 圖表內各折線顏色：使用藍色同色系（依選取數量從深藍到淺藍均勻分配），不使用彩虹多色
- **時間範圍切換按鈕**：1Y / 3Y / 5Y / 10Y / 20Y / MAX（預設 5Y）
  - MAX = API 可提供的最早資料，FRED 最早可回溯至 1960 年代，Yahoo Finance 依各標的上市日期
- **X 軸**：月份格式（YYYY-MM）
- **倒掛期間標示**：圖表背景淡紅色區域標示歷史倒掛時段
- **Tooltip**：滑鼠懸停顯示該月各選取期間的殖利率數值

#### 4. 10Y − 2Y 利差圖
- 獨立小圖，位於主圖下方
- X 軸顯示月份（YYYY-MM）
- 零線標示（虛線），低於零時顯示紅色填色區域
- 時間範圍跟隨主圖的選擇同步

### Tab 2：股價追蹤

#### 1. 時間範圍切換
- 全域按鈕組：1Y / 3Y / 5Y / 10Y / 20Y / MAX（預設 5Y）
- 切換後所有標的圖表同步更新

#### 2. 標的卡片（5 張）
排列：2欄 Grid（SPY、BND、TSM、0050、2330）

各卡片內容：
- 標的代碼（粗體）、中文說明（小字）
- 當前價格（大字）、漲跌幅（顏色：漲綠跌紅）
- 迷你折線走勢圖（高度約 60px，不含 Y 軸，X 軸為時間，顯示實際價格，非百分比）

---

## 部署設定

### 環境變數
| 變數名稱 | 說明 | 設定位置 |
|---------|------|---------|
| `FRED_API_KEY` | FRED 免費 API key | Zeabur 控制台 + 本機 `.env.local` |

### Zeabur 部署步驟
1. 推送專案至 GitHub repository
2. Zeabur 控制台連結 GitHub repo
3. 自動偵測 Next.js，點擊部署
4. 在 Zeabur 設定 `FRED_API_KEY` 環境變數
5. 網站上線，domain 格式：`finance-dashboard.zeabur.app`

### 本機開發
```bash
cp .env.example .env.local
# 填入 FRED_API_KEY
npm install
npm run dev
```

---

## 不在範圍內（Out of Scope）

- 使用者登入 / 帳號系統
- 自選標的（標的清單固定）
- 即時串流（WebSocket）
- 技術指標（MACD、RSI 等）
- 手機 App

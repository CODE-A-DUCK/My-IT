# {My-IT}程式討論區

整合 Discord API 與 Server-Sent Events (SSE) 技術。

## ✨ 核心特性

- **即時更新**: 基於 SSE 技術，無需重新整理頁面即可獲取最新狀態。
- **高效能**: 使用 [Bun](https://bun.sh) 作為執行環境，具備極速啟動與低延遲的特性。
- **優雅降級**: 完善的錯誤處理與緩存機制，有效應對 Discord API 的速率限制 (429)。
- **Clean Code**: 代碼經過重構，具備高度的可讀性、可維護性與模組化設計。

## 🛠️ 技術棧

- **Runtime**: [Bun](https://bun.sh) (原生 `Bun.serve` 支持)
- **Discord Integration**: [Discord.js](https://discord.js.org/)
- **Communication**: Server-Sent Events (SSE)
- **Frontend**: Vanilla JavaScript (ES6+), CSS3 (Industrial Minimalist Style)

## 📂 專案結構

```
├── public/              # 靜態資源
│   ├── css/style.css    # 儀表板樣式 (工業簡約風)
│   └── js/app.js        # 前端核心 (處理 SSE 串流與 DOM 渲染)
├── src/
│   ├── data/
│   │   └── profiles.js  # 成員與機器人的 Bio 覆寫設定
│   ├── services/
│   │   └── userFetcher.js # Discord 資料獲取與格式化服務
│   ├── bot.js           # Discord 機器人邏輯與資料更新循環
│   ├── config.js        # 全域配置與環境變數管理
│   ├── index.js         # 應用程式入口 (Bootstrap)
│   └── server.js        # Web 伺服器與 SSE 廣播核心
└── index.html           # 儀表板主入口
```

## ⚙️ 安裝與設定

### 1. 前置需求
確保您的系統已安裝 **[Bun](https://bun.sh)** (建議版本 v1.3.5+)。

### 2. 安裝步驟
```bash
bun install
```

### 3. 環境變數設定
在根目錄建立 `.env` 檔案並填入以下資訊：

```env
DISCORD_TOKEN=您的_Discord_機器人_Token
PORT=3000
GUILD_ID=您的伺服器ID (用於優先獲取狀態)
```

### 4. 自定義成員清單
請編輯 `src/config.js`，在 `TARGET_TEAM_MEMBER_IDS` 與 `TARGET_BOT_IDS` 陣列中填寫要追蹤的 Discord ID。

### 5. 啟動服務
```bash
bun src/index.js
```
啟動後，請造訪 `http://localhost:3000`。

## 🔄 API 介面

- **`GET /`**: 存取儀表板前端。
- **`GET /api/status`**: 獲取當前所有成員狀態的 JSON 快照。
- **`GET /api/stream`**: SSE 串流端點，提供即時狀態推送。

## 📝 授權條款

本專案專為 {My-IT} 社群製作。

# {My-IT} 團隊網站

由 **{My-IT}** 社群開發的。編不下去了。

## 🛠️ 技術棧

- **Runtime (執行環境)**: [Bun](https://bun.sh)
- **Backend (後端)**: Bun 原生伺服器 (`Bun.serve`)
- **Bot (機器人)**: [Discord.js](https://discord.js.org/)
- **Frontend (前端)**: 原生 JavaScript (EventSource), CSS3

## 📂 專案結構

```
├── public/              # 靜態資源 (CSS, JS)
│   ├── css/style.css    # 主要樣式表
│   └── js/app.js        # 前端邏輯 (處理 SSE 更新)
├── src/
│   ├── data/            # 靜態資料檔案
│   ├── services/        # 負責調用 Discord API 的邏輯
│   │   └── userFetcher.js
│   ├── bot.js           # Discord 機器人實例與更新循環
│   ├── config.js        # 配置與環境變數
│   ├── index.js         # 入口點 (啟動機器人與伺服器)
│   └── server.js        # Web 伺服器與 SSE 廣播
└── index.html           # 主前端頁面
```

## ⚙️ 安裝與設定

### 1. 前置需求
請確保您的電腦上已安裝 **[Bun](https://bun.sh)**。

### 2. 安裝步驟
複製專案庫並安裝依賴項：

```bash
bun install
```

### 3. 配置設定
設定您的環境變數。您可以在根目錄下建立一個 `.env` 檔案：

```env
DISCORD_TOKEN=您的_Discord_機器人_Token
PORT=3000
# GUILD_ID=您的_伺服器_ID (選填)
```

> **注意**：您還需要在 `src/config.js` 中的 `TARGET_USER_IDS` 和 `TARGET_BOT_IDS` 陣列中填寫要追蹤的使用者與機器人 ID。

### 4. 啟動專案
啟動伺服器與機器人：

```bash
bun src/index.js
```

啟動後，網頁將運行在 `http://localhost:3000`。

## 🔄 API 端點

- **`GET /`**: 提供主儀表板頁面。
- **`GET /api/status`**: 回傳當前快取的狀態 JSON 資料。
- **`GET /api/stream`**: Server-Sent Events (SSE) 端點，用於即時更新。

## 📝 授權條款

本專案專為 {My-IT} 社群製作。

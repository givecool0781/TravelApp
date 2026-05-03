# TravelApp — Claude 專案記憶

## 專案目標
出國旅行規劃 APP，支援 iPhone / iPad / 電腦多裝置使用。
使用者只有兩人，目標是在國外也能順暢使用。

---

## 開發順序（已確認）
1. **React Web 前端** ← 目前進度
2. React Native iOS APP
3. FastAPI 後端 + 資料庫（替換 localStorage）

---

## 功能需求（完整清單）

### 已完成
- [x] 行程規劃：旅行清單、每日時間軸、行程詳情 Modal
- [x] 地圖總覽：Google Maps 標記所有地點、一鍵導航
- [x] 新增 / 編輯 / 刪除旅行（含 emoji 選擇器）
- [x] 新增 / 編輯 / 刪除每日行程（含 Google Places 自動搜尋）
- [x] Excel 匯入行程（下載模板 → 填寫 → 上傳預覽 → 確認匯入）
- [x] localStorage 資料持久化

### 規劃中（後期）
- [ ] 預算追蹤（多幣別、分類、圖表）
- [ ] 匯率換算（即時）
- [ ] 天氣查詢（目的地未來 7 天）
- [ ] 翻譯功能（次要）
- [ ] 用戶登入 / 多裝置雲端同步（需後端）
- [ ] React Native iOS APP

---

## 技術架構

### 目前（Web 前端，純前端）
| 角色 | 技術 |
|------|------|
| 框架 | React 19 + TypeScript |
| 打包 | Vite 5 |
| 樣式 | Tailwind CSS v4（@tailwindcss/vite 插件）|
| 路由 | react-router-dom v7 |
| 地圖 | @react-google-maps/api |
| Excel | xlsx (SheetJS) |
| 圖示 | lucide-react |
| 狀態 | React Context + useReducer |
| 資料 | localStorage（key: `travelapp_trips_v1`）|

### 未來後端
| 角色 | 技術 |
|------|------|
| 後端 API | FastAPI (Python) |
| 資料庫 | PostgreSQL |
| 認證 | JWT |
| 部署 | Railway 或 Render（免費方案） |

---

## 啟動方式

```powershell
# 每次開新 PowerShell session 都要設定 PATH
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
cd "路徑\TravelApp"
npm run dev -- --host
# 開啟 http://localhost:5173（手機用 http://192.168.0.159:5173）
```

## ⚠️ Claude 開發規則：驗證前必須開 server

**每次需要驗證功能、測試 UI、確認結果時，Claude 必須先主動幫用戶啟動 web dev server。**
不要等用戶說「幫我開 server」，在要驗證之前就自動執行：
```powershell
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
Set-Location "C:\Users\lf3ne\OneDrive\Desktop\Code\TravelApp"
& "C:\Program Files\nodejs\npm.cmd" run dev -- --host 2>&1
```
Railway 後端不需要另外開（24 小時雲端運行）。

---

## 重要環境變數

檔案：`.env`（不可 commit）
```
VITE_GOOGLE_MAPS_API_KEY=xxx   # Google Maps + Places API
```

---

## 已知問題與解法

### Windows App Control 封鎖原生 .node 模組
- **問題**：系統 WDAC 政策封鎖未簽署的 `.node` 二進位（rollup、rolldown 都受影響）
- **解法**：`package.json` 用 npm overrides 把 `rollup` 替換為 `@rollup/wasm-node`（WASM 版，不需原生 binary）
  ```json
  "overrides": { "rollup": "npm:@rollup/wasm-node@^4.60.2" }
  ```
- **注意**：每次 `npm install` 後 rollup 的 `native.js` 會被自動替換為 WASM 版，不需手動 patch

### npm 不安裝 optional dependencies
- `@rollup/rollup-win32-x64-msvc` 不會自動安裝
- 已在 `optionalDependencies` 列出，但實際上靠 WASM override 解決，不依賴它

---

## 專案結構

```
src/
├── types/index.ts          # TypeScript 型別定義
├── data/mockData.ts        # 初始示範資料（東京、巴黎）
├── context/
│   └── TripContext.tsx     # 全域狀態 + localStorage 持久化
├── utils/
│   ├── validation.ts       # 所有輸入驗證與 sanitize 函式
│   └── excelUtils.ts       # Excel 匯入解析 + 模板下載
├── components/
│   ├── TripForm.tsx        # 新增/編輯旅行 Modal
│   ├── EventForm.tsx       # 新增/編輯行程 Modal（含 Places Autocomplete）
│   ├── EventDetailModal.tsx # 行程詳情 + 導航
│   ├── ExcelImportModal.tsx # Excel 匯入流程 Modal
│   └── ConfirmDialog.tsx   # 刪除確認對話框
└── pages/
    ├── HomePage.tsx        # 旅行清單
    ├── TripPage.tsx        # 每日時間軸
    └── MapPage.tsx         # Google Maps 地圖總覽
```

---

## ⚠️ React Native UI 顏色規則（Claude 必須遵守）

**文字顏色問題：iOS 預設顏色太淡，必須明確設定。**

- `TextInput` placeholder：永遠加 `placeholderTextColor="#94A3B8"`
- 自訂元件的一般文字（非 placeholder）：使用 `#334155` 或 `#64748B`，不可用 `#94A3B8`（太淡看不清）
- 選中狀態的文字：使用 `#2563EB`（藍色）或 `#0F172A`（深色）

**發生過的事（2026-04）：**
DurationPicker 的未選中項目用了 `#94A3B8`，用戶看不到文字，改為 `#64748B`。

---

## ⚠️ 機密資料規則（Claude 必須遵守）

**絕對不能把以下內容寫進程式碼或 commit 到 Git：**
- API Key（Google Maps、任何第三方服務）
- 密碼、token、secret
- 任何 .env 檔案內容
- 使用者的電腦路徑（如 `C:\Users\lf3ne\...`）或個人資訊

**正確做法：**
- Web：API Key 一律放 `.env` 檔案，程式碼用 `import.meta.env.VITE_XXX` 讀取
- React Native：API Key 放 `.env` 檔案，用 `expo-constants` 或 `app.config.js` 讀取
- `.env` 必須列在 `.gitignore`，永遠不能 commit
- `app.json` 不能直接寫 API Key，改用 `app.config.js` 從環境變數讀取

**發生過的事故（2026-04）：**
Google Maps API Key 被直接寫進 `app.json` 和 `EventForm.tsx` 並 commit 到 GitHub，用戶必須重新產生 key。

---

## 安全性原則

### 前端（已實作）
- 所有輸入欄位有長度上限（名稱 80 字、備註 500 字等）
- URL 只接受 `http://` / `https://`（防 `javascript:` URI 注入）
- 電話只允許 `[\d\s+\-().]` 字元
- React JSX 預設 escape 輸出，避免 XSS
- 不使用 `dangerouslySetInnerHTML`
- Excel 匯入：限制 5MB、500 筆，資料過驗證函式

### 後端（待實作時需注意）
- JWT 認證（access token 短效期 + refresh token）
- HTTPS only
- CORS 限制來源
- 參數化查詢（防 SQL Injection）
- Rate limiting（防暴力攻擊）
- 密碼用 bcrypt hash（不存明文）
- 環境變數存放所有 secrets

---

## 資料格式

### Trip
```typescript
{ id, name, destination, country, startDate, endDate, emoji, days: TripDay[] }
```

### TripDay
```typescript
{ id, date, label?, events: TripEvent[] }
```

### TripEvent
```typescript
{ id, time, title, category, location?, notes?, duration?, website?, phone? }
```

### Location
```typescript
{ lat, lng, address, placeId? }
```

### EventCategory
```typescript
'food' | 'attraction' | 'transport' | 'hotel' | 'other'
```

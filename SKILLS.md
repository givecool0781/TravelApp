# TravelApp — 技術技能參考

## 前端框架

### React 19 + TypeScript
- 元件用 `function` + hooks，不用 class component
- 型別定義集中在 `src/types/index.ts`
- Props 用 `interface Props { ... }` 定義在元件檔案內

### Vite 5
- 設定檔：`vite.config.ts`
- 環境變數用 `import.meta.env.VITE_XXX`（必須以 `VITE_` 開頭才會暴露給前端）
- **Windows 特殊設定**：`package.json` 的 `overrides` 必須保留，否則 WDAC 會封鎖 rollup

---

## 樣式：Tailwind CSS v4

- 使用 `@tailwindcss/vite` 插件（Vite 原生整合，不需 `tailwind.config.js`）
- `index.css` 只需 `@import "tailwindcss";`
- 直接在 JSX 用 class names，無需額外設定

---

## 路由：react-router-dom v7

```tsx
// App.tsx
<BrowserRouter>
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/trip/:id" element={<TripPage />} />
    <Route path="/trip/:id/map" element={<MapPage />} />
  </Routes>
</BrowserRouter>

// 取得參數
const { id } = useParams<{ id: string }>()

// 導航
const navigate = useNavigate()
navigate(`/trip/${id}`)

// Query string
const [searchParams] = useSearchParams()
const focus = searchParams.get('focus')
```

---

## 狀態管理：Context + useReducer

```tsx
// 模式：context/TripContext.tsx
const TripContext = createContext<TripContextValue | null>(null)

export function TripProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  // ...
  return <TripContext.Provider value={...}>{children}</TripContext.Provider>
}

export function useTripContext() {
  const ctx = useContext(TripContext)
  if (!ctx) throw new Error('must be inside TripProvider')
  return ctx
}

// 在 main.tsx 包住 App
<TripProvider><App /></TripProvider>
```

---

## 持久化：localStorage

```typescript
const STORAGE_KEY = 'travelapp_trips_v1'

// 讀取（帶 try/catch 防止 JSON 損毀）
function loadFromStorage(): Trip[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultData
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : defaultData
  } catch { return defaultData }
}

// 寫入（useEffect 監聽 state 變化）
useEffect(() => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.trips)) }
  catch { /* quota exceeded — silent fail */ }
}, [state.trips])
```

---

## Google Maps：@react-google-maps/api

### 地圖顯示
```tsx
const { isLoaded } = useJsApiLoader({ googleMapsApiKey: KEY })

<GoogleMap mapContainerStyle={style} center={center} zoom={12} onLoad={setMap}>
  <Marker position={pos} onClick={() => setSelected(event)} />
  <InfoWindow position={pos} onCloseClick={() => setSelected(null)}>
    <div>...</div>
  </InfoWindow>
</GoogleMap>
```

### Places Autocomplete（搜尋地點）
```tsx
const LIBRARIES: ('places')[] = ['places']
const { isLoaded } = useJsApiLoader({ googleMapsApiKey: KEY, libraries: LIBRARIES })

const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

<Autocomplete
  onLoad={(ac) => { autocompleteRef.current = ac }}
  onPlaceChanged={() => {
    const place = autocompleteRef.current?.getPlace()
    const lat = place.geometry.location.lat()
    const lng = place.geometry.location.lng()
  }}
>
  <input type="text" />
</Autocomplete>
```

### 一鍵導航
```typescript
window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank')
```

---

## Excel：xlsx (SheetJS)

### 讀取檔案
```typescript
import * as XLSX from 'xlsx'

const buffer = await file.arrayBuffer()
const workbook = XLSX.read(buffer, { type: 'array', cellDates: false })
const sheet = workbook.Sheets[workbook.SheetNames[0]]
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', blankrows: false })
```

### 產生模板下載
```typescript
const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows])
ws['!cols'] = [{ wch: 14 }, { wch: 8 }, ...]  // 欄寬
const wb = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(wb, ws, '行程')
XLSX.writeFile(wb, 'filename.xlsx')
```

### Excel 時間/日期轉換
- 時間：Excel 用小數表示（0.375 = 09:00），需轉換
- 日期：用 `XLSX.SSF.parse_date_code(val)` 解析 serial number

---

## 輸入驗證模式

所有用戶輸入都在 `src/utils/validation.ts` 處理，分兩步：

```typescript
// Step 1: sanitize（清除/截斷）
const sanitized = sanitizeEventInput(rawFormData)

// Step 2: validate（檢查必填/格式）
const errors = validateEvent(sanitized)
if (Object.keys(errors).length > 0) {
  setErrors(errors)
  return  // 不繼續
}
```

**安全規則：**
- URL 只接受 `http:` / `https:` protocol
- 電話：`/^[\d\s+\-().]{0,30}$/`
- 所有文字欄位用 `.trim().slice(0, maxLength)`

---

## Modal 設計模式

所有 Modal 共用同一個結構：
- 背景 `fixed inset-0 bg-black/40 z-50`，點擊關閉
- 內容 `stopPropagation()` 防止穿透
- 手機版：`items-end`（從底部滑出）+ 頂部 handle bar
- 電腦版：`sm:items-center`（置中彈出）

---

## 未來：FastAPI 後端（待實作）

```python
# 預計結構
from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session

app = FastAPI()

# JWT 認證
# 密碼 bcrypt
# Pydantic model 驗證輸入
# SQLAlchemy ORM（防 SQL Injection）
# CORS middleware
# Rate limiting（slowapi）
```

**部署：** Railway（`railway.toml`）或 Render（`render.yaml`）
**資料庫：** PostgreSQL（Railway / Render 免費附帶）

---

## React Native iOS（待實作）

- 用 **Expo** 快速搭建（不需 Mac 也能開發，Expo Go 預覽）
- 共用邏輯：型別定義、驗證函式、API 呼叫層
- 地圖：`react-native-maps`
- 導航：`@react-navigation/native`
- 需要 Apple Developer 帳號才能上架 App Store（$99/年）

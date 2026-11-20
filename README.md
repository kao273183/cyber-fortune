# Lucky Hour (吉時行樂)

獨立運行的命理與擇日應用，包含：
- **老黃曆**：農曆節氣、宜忌、吉神方位、幸運數字與色彩
- **每日星座**：十二星座運勢與指數
- **紫微斗數**：單人命盤、流年運勢、宮位詳解、雙人合盤
- **西洋天宮星盤**：本命盤、行運、水逆狀態
- **靈籤求索**：媽祖六十甲子籤抽籤與求籤紀錄
- **塔羅占卜**：牌陣占卜與牌義圖鑑

## 啟動方式

```bash
npm install
npm start
```

預設啟動於 `http://127.0.0.1:3100`（可透過 `PORT` 環境變數調整）。

## 測試

```bash
npm test
```

## 部署到 GitHub Pages（純靜態版）

靜態版不需要後端：`server/routes` 與 `server/lib` 的命理計算會被打包進瀏覽器，
由 `static/local-api.js` 在頁面內回應 `/api/fortune/*`；資料庫改用 sql.js（WebAssembly 版 SQLite），
存在訪客自己瀏覽器的 localStorage，每位訪客的命盤與紀錄互不相通。

```bash
npm run build:static     # 產出 dist/
npm run preview:static   # 以 http://127.0.0.1:4173/cyber-fortune/ 模擬 GitHub Pages 子路徑
```

SQLite 的 wasm 已直接打包進 `js/local-api.js`，所以 `dist/index.html` 也能直接雙擊用瀏覽器開啟（`file://`）。

自動部署：推上 GitHub 的 `main` 分支後，`.github/workflows/pages.yml` 會跑測試、建置並部署。
第一次使用需到 repo 的 **Settings → Pages → Build and deployment → Source** 選 **GitHub Actions**。

靜態版的差異：
- 資料只存在當前瀏覽器（清除網站資料就會消失，換裝置不會同步）
- 每日星座仍會從瀏覽器直接呼叫 FreeHoroscopeAPI 與 Google 翻譯；失敗時自動改用內建摘要

## 安裝到桌面（PWA）

網站可以像 App 一樣安裝，裝好後沒有網路也能開：

- **Android / 電腦版 Chrome、Edge**：右上角會出現「安裝」按鈕，按下去用瀏覽器的安裝視窗。
- **iPhone / iPad**：「安裝」按鈕會顯示教學：分享 → 加入主畫面 → 新增。
- 已經安裝、或瀏覽器不支援安裝時，不會顯示按鈕。

相關檔案：`public/manifest.webmanifest`（名稱、圖示、顏色）、`public/sw.js`（離線快取）、
`public/js/install.js`（安裝按鈕與 iPhone 教學）。`npm run build:static` 會把要離線保存的檔案清單
和版本號寫進 `dist/sw.js`，每次部署內容有變，訪客下次連網開啟時就會拿到新版。

圖示由 `static/icon-seal.html` 用 Chrome 截圖產生（`?v=any|maskable|apple|favicon`），放在 `public/icons/`。

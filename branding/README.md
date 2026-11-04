# 六工具統一單字圖示

2026-11-04：採用 Noto Sans TC ExtraBold 白字、同一個圓角比例與留白；字型已轉成 SVG 路徑，院內電腦無須安裝字型。Chrome 使用隨包附上的 PNG。

| 工具 | 字 | 顏色 | 版本 |
|---|---|---|---|
| 貼片回收紀錄 | 貼 | `#137C72` | 1.4.3 |
| 出院藥名單擷取 | 出 | `#2563B0` | 2.10.2 |
| 刷條碼退藥 | 碼 | `#7349B3` | 1.1.1 |
| 查詢處理（病人快速選擇） | 選 | `#347243` | 1.6.2 |
| 藥車標籤列印 | 車 | `#A96714` | 2.9.1 |
| 雲端藥歷整理器 | 雲 | `#187594` | 2.9.1 |

工具列、視窗／頁籤、工具頁首與管理畫面採相同字標；藥車標籤彈窗與列印預覽、雲端藥歷內嵌小視窗一併更新。各工具名稱及既有操作流程保留。

本次沒有新增權限或變更資料格式。已用各工具前一版更新器驗證完整套件並模擬套用，圖示和程式一起更新、manifest 最後寫入，旁置本機資料不變。驗證範圍與限制詳見 verification.json；院內實機仍未操作。

重新產生：
1. 用 scripts/build-wordmark-icons.py 讀取 Noto Sans TC 800 WOFF（例如 @fontsource/noto-sans-tc 套件），輸出字型路徑。
2. 執行 node scripts/render-wordmark-icons.mjs；需要 sharp。
3. 各工具既有 build-update／build-release 打包；cart-labels-his 與 cloud-medication 用 scripts/build-managed-release.mjs，依 release-files.json 明確列出的檔案打包。

字型授權：OFL.txt。

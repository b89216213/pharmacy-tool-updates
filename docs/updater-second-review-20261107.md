# 更新器第二次審查（2026-11-07，臺北時間）

結論：第一次重整的核心方向合理，本次重新執行測試並修正 3 個剩餘問題。這是可審查的候選分支，正式 main 仍保持原狀。沒有足夠證據判定 Fauppod 警報是誤判，也沒有完成 Windows Defender 驗證。

## 檢查對象及第一次改版的實際狀態

- 首次核對 GitHub main 為 `dbccea694a4a5049a59ac649ab97545c53464063`。完成前重新核對發現 main 已發布出院工具 2.14.5，故本次最終審查以 `047bb4b67def0bcb1a8efc435666511d70e8c0ce` 為基準，納入其處方時間與年齡顯示變更。
- 原始碼庫 `b89216213/pharmacy-tools` 的 main 為 `8b96aed34be5c3fba2def8d4c82aab11d2ea48bf`，較正式公開發布版本舊；不能只根據這裡的 patient-query 判斷現有發布架構。
- 本次在工作區找回第一次重整：本機提交 `abcb45a7d01cc54c30fac7f08abfe1f00bb2815f`，加上尚未提交的第 9 套工具箱整合。查驗時 GitHub 沒有 `codex/updater-hardening-20261107` 分支，main 也未包含該改版。先前「原始碼已上傳」的對話不能當作可下載或已發布的證明。
- 在獨立分支保留上述成果後再修改，沒有重寫原工作區，也沒有覆寫歷史發布包。

| 工具 | 正式版 | 候選版 | 個別更新差異 |
|---|---|---|---|
| ADC 特殊藥品批次取歸藥 | 1.2.0 | 1.2.1 | 管理頁、managedUpdateReopen |
| 刷條碼退藥 | 1.5.3 | 1.5.4 | 安裝位置介面、管理頁重開 |
| 藥車標籤列印 | 2.17.0 | 2.17.1 | labels/index.html、工作鎖、cartUpdateReopen |
| 雲端藥歷整理器 | 2.9.3 | 2.9.4 | 管理頁、既有中文說明檔名例外 |
| Portal 管藥盤點 | 1.1.0 | 1.1.1 | 管理頁、managedUpdateReopen |
| 出院藥衛教名單擷取 | 2.14.5 | 2.14.6 | discharge-extension、查詢參數重開 |
| 貼片回收紀錄 | 1.6.0 | 1.6.1 | patchSource、patchUpdateReopen |
| 病人快速選擇 | 1.7.4 | 1.7.5 | sourceId/origin、pickerUpdateReopen |
| 藥局工具箱空殼 | 0.1.0 | 0.1.1 | 獨立登記、管理頁重開 |

共用來源為 `shared/updater/` 下 5 個可讀模組：UI、核心、網路、儲存、工作階段；各工具差異由 `scripts/updater-tools.json` 產生 `update-config.js`。建置時複製為各工具本機檔案，執行時不從另一工具或遠端取得共用 JavaScript。

## 本次重現並修正的問題

| 問題 | 證據及修正 |
|---|---|
| 相同內容仍整批重寫 | 新增測試先在舊候選版重現。現在每個檔案仍保留完整備份及目標雜湊，套用時重新讀取並比對，僅寫入不同內容；manifest 最後處理。若備份後檔案又被外部修改，會修復並再次驗證。 |
| 下載或驗證失敗前仍產生資料夾證明檔 | 新增測試先重現。現在公告、整包與逐檔驗證全部通過後，才建立必要的隨機文字證明；中斷、截斷及雜湊不符均為 0 次檔案寫入。 |
| 後台 catalog 可能指向缺少新包的 HEAD | 正式 047bb4b 的 catalog 亦將出院 2.14.5 ZIP 指向尚無該檔案的 dbccea6。舊候選建置器將「建置前 HEAD」當成新 ZIP 的位置，新增檔案尚未在該提交，可能 404 或取得舊內容。改為先建置並提交資產，再由 `pin-updater-catalog.mjs` 逐一核對固定提交的 ZIP、更新包及公告位元組後設定 catalog。錯誤的舊提交已測試會被拒絕。 |

減少寫入的效益會在新更新器已安裝後生效。第一次由舊更新器安裝本候選版，仍採用舊更新器的全檔寫入方式，不能事後改變該次行為。還原刻意保留完整原版寫回，以便處理已遭局部破壞的檔案。

## 安全與 Defender 判讀

1. 在本次審查的更新模組未見 `eval`、`new Function`、遠端動態 import、PowerShell、批次檔或 EXE 執行。唯一動態 import 是固定的本機 `./installation-ui.js`。這不是對所有臨床程式或第三方函式庫的完整惡意程式鑑識。
2. 更新仍會從固定 GitHub 下載含 Base64 原始碼的 JSON，在使用者授權的位置寫入 JavaScript，再要求 Chrome 重新載入。這是公開可見的更新行為，可能受到防毒檢查；尚無證據證明其中任何一項就是這次 Fauppod 命中的原因。沒有改名躲避、混淆或關閉防毒。
3. 網路固定為 HTTPS、指定儲存庫、工具專屬公告與版本路徑；匿名 GET、無請求本文、無 referrer、拒絕轉址、逾時及大小限制。更新模組不向 GitHub 傳送病人資料、登記憑證或備份內容。
4. manifest 除版本欄位外，與正式版逐項相同；新版核心擋住額外權限、主機、CSP、識別及 content script 執行邊界擴張。`raw.githubusercontent.com/*` 的主機權限不能靠加上儲存庫路徑縮小，Chrome 對 host permissions 忽略路徑；實際來源限制在網路模組實作。
5. SHA-256 保護公告／套件／檔案一致性，沒有獨立發布者簽章。GitHub 發布權若被接管，攻擊者同時替換公告與套件的風險仍在。簽章、離線私鑰與輪替需另行設計，這次沒有以弱化驗證換取相容。
6. 隨機文字證明檔是必要的安裝位置核對，使用後刪除。舊路徑搜尋僅在使用者授權範圍內且有深度及數量限制；本次沒有擴大它的權限。

官方來源（查閱日期 2026-11-07）：[Microsoft Fauppod 說明](https://www.microsoft.com/en-us/wdsi/threats/malware-encyclopedia-description?Name=Trojan%3AWin32%2FFauppod.A%21cl&ThreatID=2147906846)、[Microsoft 檔案分析流程](https://learn.microsoft.com/defender-xdr/submission-guide)、[Chrome host permissions 路徑規則](https://developer.chrome.com/docs/extensions/develop/concepts/match-patterns)、[File System Access 安全考量](https://wicg.github.io/file-system-access/)。這些文件未提供此一使用者樣本的具體偵測原因。

## 實際重跑的驗證

| 情境 | 結果與測試範圍 |
|---|---|
| 核心及更新工作階段 | 原 135 項＋新增 45 項，共 180 項通過 |
| 正常更新、只改版本、外部修改檔案 | 比對內容再寫入，完整備份、manifest 最後、重新開啟核對 |
| 下載中斷、截斷、內容毀損 | 阻擋更新，沒有來源檔或證明檔寫入 |
| 權限拒絕、寫入時 NotAllowedError、備份儲存失敗 | 權限拒絕不下載；已開始的失敗還原原版；未完成紀錄保留 |
| 還原失敗、錯誤資料夾、惡意路徑、雙擊／多視窗 | 既有防護全部重跑 |
| 重新開啟及重新開啟失敗 | 正常核對逐檔雜湊；reload 失敗保留狀態及重試入口 |
| Chromium 瀏覽器 | 72 項通過；真實 IndexedDB、OPFS 與 handle 序列化；Chrome runtime、原生選擇器及網路為模擬 |
| 出院工具同期變更 | 2.14.5 的處方時間、年齡及列印回歸另 5 項通過 |
| 現有業務及後台測試 | 21 組測試程式通過；工具箱測試先建置其 flat release，磁碟故障案例改為真正有變動的檔案 |
| 目前正式版直接升級 | 9／9 通過原版核心接受、來源／包／ZIP 比對；非更新器業務／管理檔案與原版位元組一致 |
| 全歷史版本 | 42 個版本，37 可直接套用並由新核心處理舊 journal；5 個已知權限限制，詳見下段 |

本 PR 包含原始碼、建置工具、離線測試與驗證結果。候選更新公告與安裝包由原始碼在本機產生；PR 不改動正式公告、歷史包或下載目錄。後台 catalog 只修正既有正式資產的提交指標，逐套核對 9 個正式 ZIP 與 301 個程式檔。詳見[正式版比對](updater-production-inventory.json)。先執行 `node scripts/build-updater-release.mjs --all` 產生候選包供發布檢查使用。

執行方式：`node scripts/sync-updaters.mjs --check`、`node --test tests/updater-hardening.mjs tests/updater-second-review.mjs`、`node tests/updater-release-checks.mjs`、`node tests/updater-history-checks.mjs`。瀏覽器為 `node tests/updater-browser-checks.cjs`，需 Playwright 與 Chromium，可用 `QA_CHROMIUM_PATH` 指定。沒有連線到院內病人系統。

原始證據：[第二次檢查結果](updater-second-review-results.json)、[瀏覽器結果](updater-browser-results.json)、[歷史升級結果](updater-history-results.json)、[現有測試結果](updater-second-review-existing-results.json)、[套件一致性結果](updater-release-results.json)。

## 舊安裝相容性與發布順序

**不能宣稱所有年代的版本都能直接一鍵升級。** 貼片 1.2.1、1.2.2、1.2.3、1.2.4、1.2.5 的既有更新器會拒絕後來新增的後台網址權限；1.3.0 才加入該權限。這 5 個版本連升級到目前正式版也有相同限制，沒有可繞過檢查的已發布中繼版。本次沒有造成新的相容性退步，且不會移除檢查。若仍有此類安裝，須保留原資料夾及 Chrome 設定檔，以正常手動更新並確認新權限的方式遷移；可能須完成後來新增的後台登記。不得移除擴充功能或清除資料。

目前 9 套正式版、貼片 1.3.0 起，以及其餘儲存庫留存的歷史版本，均通過本次直接升級測試。實測的是程式包，不是院內所有電腦的實際安裝版本盤點。

1. 本 PR 保持候選狀態；先做 Windows 掃描及少量無病人資料的安裝更新、還原實測。候選版仍讀正式 main，不會從檢查分支偷偷自動更新。
2. 現有資料庫名稱、toolId、登記資訊、後台端點、更新路徑、原授權 handle 與重開 key 均不變。所有歷史發布包保持原始內容。
3. 測試完成後先確定 main 沒有其他新功能或版本；有變更就重新整合、提升版本、重建及重跑測試。不要覆蓋其他聊天室剛發布的版本。
4. 先提交所有已驗證的候選資產，再執行 `node scripts/pin-updater-catalog.mjs <完整資產提交SHA>`，另外提交 catalog；完成實機驗收後，另以發布提交或 PR 將公告更新至 main，舊工具才會看到新公告。原有舊版更新提示與套件格式不變。
5. 先在少量測試電腦採用，再逐套開放正式公告；目前沒有 server-side 分組 rollout 功能，不能把公開 latest.json 發布描述成只推給某群組。可依工具分批發布。
6. 新增簽章或改權限屬於後續獨立遷移；不能直接套用導致舊版全部拒絕更新。

## 尚未完成、無法由離線測試取代

- 被隔離原始檔案與正式 GitHub 位元組是否相同：尚無樣本 SHA-256、Defender 完整影響路徑及引擎／安全性情報版本，無法排除本機檔案被修改。
- Windows Defender 啟用狀態下，對候選 ZIP、解壓縮檔案及實際更新寫入行為的掃描；沒有 Microsoft 樣本分析結論。
- Windows 原生 File System Access、Chrome 真實擴充功能重新載入、權限撤回與防毒隔離途中失敗。
- 真實院內 Portal、後台登記／停用／恢復及實體印表機；這次以位元組不變與合成測試確認未修改其實作，沒有冒充正式環境驗收。
- 多檔更新並非整個資料夾原子交易。如果 Chrome 在檔案替換途中被強制結束，或防毒隔離啟動必需模組，擴充功能可能無法開啟內建還原介面；需用已核實且可通過掃描的原版包覆蓋原位置。不能承諾任何失敗都能靠介面自動還原。

若仍觸發偵測，保持隔離，記錄檔案雜湊、路徑、時間與版本，由 Microsoft 分析具體樣本。不要關閉 Defender、加入排除清單或為了測試強制放行警告。

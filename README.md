# pharmacy-tool-updates

藥局工具的公開更新來源。最新版本為 **貼片回收紀錄 v1.2.5**。

每次開啟貼片回收工具時自動檢查新版；視窗開著時每 6 小時再檢查，關閉後停止。偵測到新版時主動開啟更新視窗；查詢、儲存或編輯中會延後提醒。同次開啟只提醒一次，可關閉提醒繼續使用，按「更新並重新開啟」才套用。有新版時右上角會顯示深綠底白字的「更新可用」，搭配淡綠小圓點與柔和外框；沒有新版時恢復一般白底。

已安裝 v1.2.1／v1.2.2／v1.2.3／v1.2.4：在工具內按「工具更新」→「檢查新版」→「更新並重新開啟」即可升級；本次沒有新增權限。

[下載貼片回收紀錄 v1.2.5](downloads/patch-recovery-v1.2.5.zip)

## 每台電腦首次升級

1. 在舊版匯出完整備份，關閉工具視窗。
2. 將 ZIP 內 `extension` 的檔案覆蓋到 Chrome 原本載入的同一個 `extension` 資料夾。
3. 到 `chrome://extensions` 按「重新載入」。**不要先移除擴充元件，也不要改用新的資料夾載入。**
4. 開啟工具，確認 v1.2.5 與原有紀錄。進入「工具更新」，指定目前的 `extension` 資料夾。

v1.2.1 起改用公開檔案下載網址，因此 v1.2.0 或更舊版本需手動升級這一次。
不需 GitHub 帳號、登入或 personal access token。

## 日後更新

每次開啟工具都會自動檢查；持續開啟時每 6 小時檢查一次，關閉工具後停止。
升級至 v1.2.5 後，下一次有新版就會主動顯示更新視窗。也可隨時按「檢查新版」，完成作業後按「更新並重新開啟」。
Chrome 可能再次要求資料夾寫入授權。

- 更新索引：[`updates/patch-recovery/latest.json`](updates/patch-recovery/latest.json)
- 程式與維護檔案：[`standalone-extensions/patch-recovery/`](standalone-extensions/patch-recovery/)
- 發布說明：[`更新發布說明`](standalone-extensions/patch-recovery/docs/更新發布說明.txt)
- 驗證範圍：[`驗證結果`](standalone-extensions/patch-recovery/docs/驗證結果.txt)

此儲存庫存放程式及發布檔案；回收紀錄、病人資料、藥師設定及 Portal 登入資訊不會上傳至此。
更新程式只從固定來源下載，會驗證版本、檔案路徑與 SHA-256，並保存原版供失敗時還原。

自動測試已通過；院內 Windows Chrome 的原生資料夾授權、擴充重新載入與院內網路連線仍需實機確認。




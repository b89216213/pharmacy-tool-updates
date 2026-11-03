# 後台工具索引

後台直接讀取公開的 catalog.json，再讀取每個工具目前的 latest.json；既有工具改版不需要 GitHub API 或 Token。

新增或移除工具時，從儲存庫執行 `python3 scripts/update-catalog.py`，將產生的 `updates/catalog.json` 和新版本一起發布。一般改版也建議執行，以更新固定版本安裝包連結。索引尚未更新時，後台仍會以 latest.json 顯示新版，但暫時隱藏舊版安裝包連結。

索引只含工具 ID、名稱、版本與公開下載路徑，不含電腦或病人資料。此機制不需要自動寫入 main 的 GitHub Actions 權限。

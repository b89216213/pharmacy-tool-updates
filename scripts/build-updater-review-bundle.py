"""Combine the registered explicitly listed source packages; never collect profiles or user data."""
import hashlib
import json
from pathlib import Path
import zipfile

root = Path(__file__).resolve().parent.parent
registry = json.loads((root / 'scripts/updater-tools.json').read_text(encoding='utf-8'))
target = root / 'downloads/pharmacy-tools-updater-review-20261107.zip'
instructions = '''九工具更新模組重整候選包（2026-11-07）

這是供檢查與 Windows 實測的候選版本，尚未發布至 main。
尚未完成 Windows Defender 實機掃描或 Microsoft 誤判複判，不能保證原警報已解決。

九個工具仍各自獨立，未合併為單一擴充功能，也沒有內建假病人。
先在不含病人資料的 Windows 測試環境，保持 Defender 啟用，掃描 ZIP 與解壓縮資料夾。
若被隔離，保留隔離並記下偵測名稱與檔案；不要關閉防毒或加入排除清單。

需要測試既有資料沿用時，先使用工具原本的資料備份功能。
保留原擴充功能、原資料夾與瀏覽器設定檔，不要移除原擴充功能。
手動更新時，將對應工具 extension（出院工具為 discharge-extension）的內容覆蓋原資料夾，再從 Chrome 擴充功能頁重新載入。
各資料夾都是完整候選程式，可在隔離測試設定檔用「載入未封裝項目」安裝。
工具內更新來源仍是正式 main，不會從本檢查分支自動安裝。

完整發現、修正、已通過檢查與限制詳見 updater-review-20261107.md。
'''
checksums = {}
def add(archive, filename, data):
    info = zipfile.ZipInfo(filename, (2026, 11, 7, 0, 0, 0))
    info.compress_type = zipfile.ZIP_DEFLATED
    info.external_attr = 0o644 << 16
    archive.writestr(info, data)

with zipfile.ZipFile(target, 'w') as archive:
    add(archive, 'README-更新測試.txt', instructions.encode('utf-8'))
    for tool in registry:
        extension = root / tool['directory']
        manifest = json.loads((extension / 'manifest.json').read_text(encoding='utf-8'))
        slug = tool['config']['slug']
        package = json.loads((root / 'updates' / slug / 'packages' / (manifest['version'] + '.json')).read_text(encoding='utf-8'))
        metadata = {file['path']: file for file in package['files']}
        for file in tool['files']:
            content = (extension / file).read_bytes()
            digest = hashlib.sha256(content).hexdigest()
            assert metadata[file]['sha256'] == digest and metadata[file]['size'] == len(content)
            name = slug + '/' + extension.name + '/' + file
            checksums[name] = digest
            add(archive, name, content)
    for document in ['updater-review-20261107.md', 'updater-review-results.json', 'updater-release-results.json', 'updater-browser-results.json',
                     'updater-second-review-20261107.md', 'updater-second-review-results.json', 'updater-history-results.json', 'updater-second-review-existing-results.json']:
        add(archive, document, (root / 'docs' / document).read_bytes())
    add(archive, 'SHA256SUMS.json', (json.dumps(checksums, ensure_ascii=False, indent=2) + '\n').encode('utf-8'))
with zipfile.ZipFile(target) as archive:
    assert archive.testzip() is None
    for name, digest in checksums.items():
        assert hashlib.sha256(archive.read(name)).hexdigest() == digest
print(f'{target.name}: {len(checksums)} verified source files, {target.stat().st_size} bytes')

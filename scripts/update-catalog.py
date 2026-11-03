"""Generate the public dashboard index from the repository's release manifests."""
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NAMES = {'ntuh-patch-recovery': '貼片回收紀錄', 'ntuh-patient-picker': '病人快速選擇', 'ntuh-discharge-education': '出院藥衛教名單擷取工具', 'ntuh-controlled-inventory': 'Portal 管藥盤點', 'ntuh-adc-drugs': 'ADC 特殊藥品批次取歸藥'}

def build(root, commit):
    if not re.fullmatch(r'[a-f0-9]{40}', commit):
        raise ValueError('Invalid source commit')
    tools = []
    for path in sorted((root / 'updates').glob('*/latest.json')):
        slug = path.parent.name
        release = json.loads(path.read_text(encoding='utf-8'))
        tool_id, version = release['toolId'], release['version']
        if not re.fullmatch(r'[a-z0-9][a-z0-9-]{0,79}', slug) or not re.fullmatch(r'[a-z0-9][a-z0-9-]{0,99}', tool_id):
            raise ValueError('Invalid tool identity')
        if not re.fullmatch(r'\d{1,5}(\.\d{1,5}){0,3}', version) or any(int(v) > 65535 for v in version.split('.')):
            raise ValueError('Invalid release version')
        package = f'updates/{slug}/packages/{version}.json'
        if release['packagePath'] != package or not (root / package).is_file():
            raise ValueError('Missing release package')
        name = NAMES.get(tool_id)
        if not name:
            manifests = list((root / 'standalone-extensions' / slug).glob('*/manifest.json'))
            if len(manifests) == 1:
                name = json.loads(manifests[0].read_text(encoding='utf-8')).get('name')
        if not isinstance(name, str) or not name or len(name) > 120 or name.startswith('__MSG_'):
            name = tool_id
        zip_path = f'downloads/{slug}-v{version}.zip'
        tools.append(dict(id=tool_id, name=name, slug=slug, version=version, downloadPath=zip_path if (root / zip_path).is_file() else None))
    if len(tools) > 50 or len({t['id'] for t in tools}) != len(tools):
        raise ValueError('Duplicate or excessive tool identities')
    return dict(format='pharmacy-tool-catalog-v1', sourceCommit=commit, tools=tools)

if __name__ == '__main__':
    commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
    catalog = build(ROOT, commit)
    (ROOT / 'updates/catalog.json').write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Indexed {len(catalog["tools"])} published tools')

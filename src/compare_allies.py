import json
import re

# allies.json を読み込む
with open('data/allies.json', 'r', encoding='utf-8') as f:
    allies_json = json.load(f)

# browser-data.js を読み込む
with open('src/browser-data.js', 'r', encoding='utf-8') as f:
    js_content = f.read()

# window.WEFI_SENGOKU_DATA = {...} の JSON部分を抽出
match = re.search(r'window\.WEFI_SENGOKU_DATA\s*=\s*(\{.*\});?', js_content)
if not match:
    print("Error: WEFI_SENGOKU_DATA not found")
    exit(1)

data_str = match.group(1)
if data_str.endswith(';'):
    data_str = data_str[:-1]

browser_data = json.loads(data_str)

# それぞれの hehehehehe のアセットパスを抽出して比較する
json_hehe = None
for ally in allies_json['allies']:
    if ally['id'] == 'hehehehehe':
        json_hehe = ally
        break

browser_hehe = None
for ally in browser_data['allies']['allies']:
    if ally['id'] == 'hehehehehe':
        browser_hehe = ally
        break

if not json_hehe or not browser_hehe:
    print("Error: hehehehehe not found in one of the files")
    exit(1)

def get_all_strings(obj, res=set()):
    if isinstance(obj, list):
        for item in obj:
            get_all_strings(item, res)
    elif isinstance(obj, dict):
        for val in obj.values():
            get_all_strings(val, res)
    elif isinstance(obj, str):
        if '.png' in obj or '.jpg' in obj:
            res.add(obj)
    return res

json_paths = get_all_strings(json_hehe['assets'], set())
browser_paths = get_all_strings(browser_hehe['assets'], set())

print(f"allies.json 内の hehehehehe のパス数: {len(json_paths)}")
print(f"browser-data.js 内の hehehehehe のパス数: {len(browser_paths)}")

only_json = json_paths - browser_paths
only_browser = browser_paths - json_paths

if only_json:
    print("\n--- allies.json にのみ存在するパス ---")
    for p in sorted(only_json):
        print(p)

if only_browser:
    print("\n--- browser-data.js にのみ存在するパス ---")
    for p in sorted(only_browser):
        print(p)

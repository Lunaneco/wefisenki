import json
import re
import os

# browser-data.js から JSON 部分を取り出す
with open('src/browser-data.js', 'r', encoding='utf-8') as f:
    js_content = f.read()

match = re.search(r'window\.WEFI_SENGOKU_DATA\s*=\s*(\{.*\});?', js_content)
if not match:
    print("Error: WEFI_SENGOKU_DATA not found")
    exit(1)

data_str = match.group(1)
if data_str.endswith(';'):
    data_str = data_str[:-1]

data = json.loads(data_str)

# 画像パス（.png）を再帰的に収集
def collect_png_paths(obj, paths=set()):
    if isinstance(obj, list):
        for item in obj:
            collect_png_paths(item, paths)
    elif isinstance(obj, dict):
        for val in obj.values():
            collect_png_paths(val, paths)
    elif isinstance(obj, str):
        if obj.endswith('.png') or obj.endswith('.jpg'):
            paths.add(obj)
    return paths

paths = collect_png_paths(data)

# Case-Sensitiveな存在チェック
def check_case_sensitive(path):
    # パスが存在しない場合は当然False
    if not os.path.exists(path):
        return False
    
    # ディレクトリを1階層ずつ辿って大文字小文字を厳密にチェック
    parts = path.split('/')
    current = '.'
    for part in parts:
        if not part or part == '.':
            continue
        try:
            # 実際のディレクトリ内のエントリ一覧を取得
            entries = os.listdir(current)
        except OSError:
            return False
        
        # 厳密に一致するものがあるかチェック
        if part not in entries:
            # 大文字小文字の違いがあるか探す
            part_lower = part.lower()
            matching = [e for e in entries if e.lower() == part_lower]
            if matching:
                print(f"Case mismatch: '{part}' in path vs actual file/dir '{matching[0]}' in '{current}'")
            return False
        
        current = os.path.join(current, part)
    return True

missing_paths = []
for path in sorted(paths):
    if not check_case_sensitive(path):
        missing_paths.append(path)

print(f"厳密チェック完了。存在しない（または大文字小文字違いの）アセット数: {len(missing_paths)}")
for mp in missing_paths:
    print(f"Strict Missing: {mp}")

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# append_chat_to_json.py - lisab olemasolevasse vestluslogi JSON-i uue logi.
# Kasutus: python append_chat_to_json.py --base full_chat_export.json --import chat_export.txt --out merged_chat_export.json

import argparse, json, re, os, hashlib
from datetime import datetime

def sha1(s): return hashlib.sha1(s.encode('utf-8', errors='ignore')).hexdigest()

def load_base(path):
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    if 'messages' not in data or not isinstance(data['messages'], list):
        data['messages'] = []
    return data

def parse_txt_messages(path):
    role, buf, out = None, [], []
    def flush():
        nonlocal buf, role, out
        if role and buf:
            content = '\n'.join(buf).strip()
            if content: out.append({'role': role, 'content': content})
        buf = []
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            m = re.match(r'^(user|assistant)\s*:\s*(.*)$', line.strip(), flags=re.I)
            if m:
                flush()
                role = m.group(1).lower()
                buf = [m.group(2)]
            else:
                buf.append(line.rstrip('\n'))
    flush()
    ts = datetime.utcnow().isoformat(timespec='seconds') + 'Z'
    return [{'role': m['role'], 'content': m['content'], 'timestamp': ts} for m in out]

def merge_messages(base_msgs, new_msgs):
    seen, out = set(), []
    for m in base_msgs + new_msgs:
        key = (m.get('role'), sha1(m.get('content','')))
        if key not in seen:
            seen.add(key); out.append(m)
    return out

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--base', required=True)
    ap.add_argument('--import', dest='imp', required=True)
    ap.add_argument('--out', required=True)
    args = ap.parse_args()
    base = load_base(args.base)
    new_msgs = parse_txt_messages(args.imp) if args.imp.endswith('.txt') else json.load(open(args.imp,'r',encoding='utf-8'))['messages']
    merged = merge_messages(base['messages'], new_msgs)
    base['messages'] = merged
    base['exported_at'] = datetime.utcnow().isoformat(timespec='seconds') + 'Z'
    with open(args.out, 'w', encoding='utf-8') as f: json.dump(base, f, ensure_ascii=False, indent=2)
    print(f'OK: lisatud {len(new_msgs)} sõnumit. Kokku {len(merged)} sõnumit → {args.out}')

if __name__ == '__main__': main()

# Vestluslogi liitmise tööriist

See ZIP sisaldab kahte faili:
- append_chat_to_json.py — skript, mis liidab uued vestlused olemasolevasse JSON-i
- README_append_chat_to_json.txt — juhend kasutamiseks

## Kasutus

1. Ekspordi vana vestlus .txt või .json kujul.
2. Pane need samasse kausta, kus on sinu `full_chat_export_Dav11_EmotsioonideJalgija_v1.0.json`.
3. Käivita käsurealt:
   python append_chat_to_json.py --base full_chat_export_Dav11_EmotsioonideJalgija_v1.0.json --import vana_chat.txt --out merged_chat_export.json

## Märkused
- Toetatud importformaadid: .txt, .json
- Duplikaadid eemaldatakse automaatselt.
- Tulemuseks on `merged_chat_export.json` koos kõigi sõnumitega.

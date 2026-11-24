"""Génère le QR code « Laisser un avis Google » à partir de googleAvisUrl (data/site.json).
Usage : python3 scripts/qr-avis.py  →  src/assets/img/qr-avis.svg"""
import json, segno, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
url = json.loads((root / 'data/site.json').read_text())['googleAvisUrl']
if not url.startswith('http'):
    raise SystemExit("googleAvisUrl n'est pas encore renseigné dans data/site.json")
segno.make(url, error='m').save(str(root / 'src/assets/img/qr-avis.svg'), scale=10, border=2, dark='#0B0B0C')
print('QR code créé : src/assets/img/qr-avis.svg')

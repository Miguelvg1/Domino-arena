from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')
tags = [
    '<script type="module" src="/tombola.js"></script>',
    '<script src="/voice-control.js?v=1"></script>',
]

if '</body>' not in s:
    raise SystemExit('No se encontró </body> en index.html')

changed = False
for tag in tags:
    if tag not in s:
        s = s.replace('</body>', tag + '</body>', 1)
        changed = True

if changed:
    p.write_text(s, encoding='utf-8')
    print('Titanes Dominó: tómbola y mando por voz integrados correctamente')
else:
    print('Titanes Dominó: integraciones ya estaban activas')

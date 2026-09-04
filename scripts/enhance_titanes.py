from pathlib import Path

# Integraciones de la app principal
p = Path('index.html')
s = p.read_text(encoding='utf-8')
tags = [
    '<script type="module" src="/tombola.js"></script>',
    '<script src="/voice-control.js?v=1"></script>',
    '<script type="module" src="/home-turnos-v2.js?v=1"></script>',
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

# Integración de las jugadas especiales en Anotaciones V2
ap = Path('anotaciones-v2.html')
if ap.exists():
    a = ap.read_text(encoding='utf-8')
    atag = '<script type="module" src="/annotation-specials.js?v=1"></script>'
    if '</body>' not in a:
        raise SystemExit('No se encontró </body> en anotaciones-v2.html')
    if atag not in a:
        a = a.replace('</body>', atag + '</body>', 1)
        ap.write_text(a, encoding='utf-8')
        changed = True

print('Titanes Dominó: integraciones activadas correctamente' if changed else 'Titanes Dominó: integraciones ya estaban activas')

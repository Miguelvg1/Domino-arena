from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')
for old in [
    '<script type="module" src="/home-turnos-v2.js?v=1"></script>',
    '<script type="module" src="/home-turnos-v2.js?v=2"></script>',
    '<script type="module" src="/home-turnos-v2.js?v=3"></script>',
    '<script type="module" src="/home-turnos-v3.js?v=1"></script>',
    '<script type="module" src="/home-turnos-v3.js?v=2"></script>',
    '<script type="module" src="/home-turnos-v3.js?v=3"></script>',
]:
    s = s.replace(old, '<script type="module" src="/home-turnos-v3.js?v=4"></script>')
for old in [
    '<script type="module" src="/turn-system-v4.js?v=1"></script>',
    '<script type="module" src="/turn-system-v4.js?v=2"></script>',
    '<script type="module" src="/turn-system-v4.js?v=3"></script>',
    '<script type="module" src="/turn-system-v4.js?v=4"></script>',
]:
    s = s.replace(old, '<script type="module" src="/turn-system-v4.js?v=5"></script>')
for old in [
    '<script type="module" src="/table-capacity.js?v=1"></script>',
    '<script type="module" src="/table-capacity.js?v=2"></script>',
    '<script type="module" src="/table-capacity.js?v=3"></script>',
]:
    s = s.replace(old, '')
for old in ['<script type="module" src="/turn-capacity-v2.js?v=1"></script>']:
    s = s.replace(old, '<script type="module" src="/turn-capacity-v2.js?v=2"></script>')
for old in ['<script type="module" src="/turn-edit-search.js?v=1"></script>']:
    s = s.replace(old, '<script type="module" src="/turn-edit-search.js?v=2"></script>')
for old in ['<script type="module" src="/game-player-edit.js?v=1"></script>']:
    s = s.replace(old, '<script type="module" src="/game-player-edit.js?v=2"></script>')

tags = [
    '<script type="module" src="/tombola.js"></script>',
    '<script src="/voice-control.js?v=1"></script>',
    '<script type="module" src="/home-turnos-v3.js?v=4"></script>',
    '<script type="module" src="/pizarra-official.js?v=1"></script>',
    '<script type="module" src="/game-start-control.js?v=1"></script>',
    '<script type="module" src="/turn-system-v4.js?v=5"></script>',
    '<script type="module" src="/turn-capacity-v2.js?v=2"></script>',
    '<script type="module" src="/turn-edit-search.js?v=2"></script>',
    '<script type="module" src="/game-player-edit.js?v=2"></script>',
]
if '</body>' not in s:
    raise SystemExit('No se encontró </body> en index.html')
changed = False
for tag in tags:
    if tag not in s:
        s = s.replace('</body>', tag + '</body>', 1)
        changed = True
if s != p.read_text(encoding='utf-8'):
    p.write_text(s, encoding='utf-8')
    changed = True

ap = Path('anotaciones-v2.html')
if ap.exists():
    original = ap.read_text(encoding='utf-8')
    a = original
    for old in [
        '<script type="module" src="/annotation-specials.js?v=1"></script>',
        '<script type="module" src="/annotation-specials.js?v=2"></script>'
    ]:
        a = a.replace(old, '<script type="module" src="/annotation-specials.js?v=3"></script>')
    a = a.replace('<script type="module" src="/game-player-edit.js?v=1"></script>','<script type="module" src="/game-player-edit.js?v=2"></script>')
    atags = [
        '<script type="module" src="/annotation-specials.js?v=3"></script>',
        '<script type="module" src="/game-player-edit.js?v=2"></script>',
    ]
    if '</body>' not in a:
        raise SystemExit('No se encontró </body> en anotaciones-v2.html')
    for atag in atags:
        if atag not in a:
            a = a.replace('</body>', atag + '</body>', 1)
    if a != original:
        ap.write_text(a, encoding='utf-8')
        changed = True

print('Titanes Dominó: integraciones activadas correctamente' if changed else 'Titanes Dominó: integraciones ya estaban activas')
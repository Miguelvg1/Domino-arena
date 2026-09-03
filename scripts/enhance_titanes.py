from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')
tag = '<script type="module" src="/tombola.js"></script>'

if tag in s:
    print('Tómbola Titanes ya integrada')
    raise SystemExit(0)

if '</body>' not in s:
    raise SystemExit('No se encontró </body> en index.html')

s = s.replace('</body>', tag + '</body>', 1)
p.write_text(s, encoding='utf-8')
print('Tómbola Titanes integrada correctamente')

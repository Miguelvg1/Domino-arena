from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
start=s.index('<div id="scoreHistory">')
needle='</div></div></details></div>'
pos=s.find(needle,start)
if pos<0:
    raise SystemExit('No se encontró el cierre esperado del historial V2')
# El primer </div> ya lo aporta el nuevo scoreHistory; el segundo es el cierre antiguo duplicado.
s=s[:pos]+'</div></details></div>'+s[pos+len(needle):]
segment=s[start:s.index('</details></div>',start)+len('</details></div>')]
if '</div></div></details></div>' in segment:
    raise SystemExit('Persistió un cierre duplicado en scoreHistory')
if segment.count('id="scoreHistory"')!=1 or 'correctScoreV2' not in segment or 'voidScore' not in segment:
    raise SystemExit('La estructura del historial no pasó las guardas')
p.write_text(s,encoding='utf-8')
print('Estructura scoreHistory V2 corregida y validada')

from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
old='<p class="small muted">Corregir cambia los puntos normales. Anular elimina la jugada del marcador, pero conserva la auditoría.</p>'
new='<p class="small muted">Corregir permite ajustar equipo, tipo de jugada, puntos y responsable. Anular retira la jugada del marcador y conserva la auditoría.</p>'
if s.count(old)!=1:
    raise SystemExit(f'Texto de ayuda esperado no encontrado exactamente una vez: {s.count(old)}')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
print('Texto de ayuda V2 actualizado')

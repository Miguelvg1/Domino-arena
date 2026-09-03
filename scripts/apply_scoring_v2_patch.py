from pathlib import Path

path = Path('index.html')
s = path.read_text(encoding='utf-8')
marker = '<!--SCORING_V2_INTEGRATED_0903-->'
if marker in s:
    print('SCORING_V2 already integrated; no changes needed.')
    raise SystemExit(0)


def replace_once(old: str, new: str, label: str):
    global s
    count = s.count(old)
    if count != 1:
        raise SystemExit(f'Guard failed for {label}: expected 1 match, got {count}')
    s = s.replace(old, new, 1)
    print('patched:', label)

# 1) Ranking/estadísticas V2: reparto 50/50, penalizaciones y bonificación 200-0.
rank_calls = s.count("sb.rpc('titanes_ranking',")
if rank_calls < 1:
    raise SystemExit('Guard failed: no titanes_ranking calls found')
s = s.replace("sb.rpc('titanes_ranking',", "sb.rpc('titanes_ranking_v2_compat',")
print('patched ranking calls:', rank_calls)

podium_calls = s.count("sb.rpc('titanes_podium',")
if podium_calls < 1:
    raise SystemExit('Guard failed: no titanes_podium calls found')
s = s.replace("sb.rpc('titanes_podium',", "sb.rpc('titanes_podium_v2_compat',")
print('patched podium calls:', podium_calls)

replace_once("sb.from('player_individual_stats').select('*')", "sb.from('player_individual_stats_v2').select('*')", 'individual stats view')

# 2) Estilos para botones especiales y alerta global Liza.
css = r'''
/* === SCORING_V2_INTEGRATED_0903 === */
.specialActions{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0}.specialAction{border:1px solid #334863;border-radius:16px;min-height:82px;padding:10px 6px;background:#050b14;color:#fff;font-weight:1000;box-shadow:0 8px 24px #0007;touch-action:manipulation}.specialAction b{display:block;font-size:13px;margin-top:4px}.specialAction span{display:block;font-size:12px;margin-top:3px}.specialAction[data-type="chivo"]{border-color:#ffcc33;box-shadow:0 0 18px #ffcc3328}.specialAction[data-type="pase_con_ficha"]{border-color:#8b2cff;box-shadow:0 0 18px #8b2cff28}.specialAction[data-type="multa"]{border-color:#ff3b30;box-shadow:0 0 18px #ff3b3028}.specialAction.on{outline:3px solid #58ff18;background:#10230d}.historyMeta{display:block;margin-top:3px;color:#9fb0c4;font-size:10px}.globalClubAlert{position:fixed;inset:0;z-index:9999;background:#000b;display:grid;place-items:center;padding:18px;backdrop-filter:blur(8px)}.globalClubAlertCard{width:min(560px,100%);border:2px solid #ffcc33;border-radius:24px;padding:22px;background:radial-gradient(circle at 50% 0,#5a3700,#0a0d13 62%);box-shadow:0 0 50px #ffcc3355,0 24px 70px #000d;text-align:center;animation:lizaPop .24s ease-out}.globalClubAlertEmoji{font-size:60px}.globalClubAlertCard h2{margin:7px 0;color:#ffcc33;font-size:29px;text-shadow:0 0 16px #ffcc3366}.globalClubAlertCard p{font-size:20px;font-weight:1000;line-height:1.35}.globalClubAlertCard button{min-width:180px}.lizaPairs{font-size:12px;color:#dbe4ef;margin:8px 0 14px}@keyframes lizaPop{from{transform:scale(.82);opacity:0}to{transform:scale(1);opacity:1}}@media(max-width:460px){.specialActions{grid-template-columns:1fr}.specialAction{min-height:62px}.globalClubAlertCard p{font-size:17px}.globalClubAlertCard h2{font-size:24px}}
'''
replace_once('</style>', css + '\n</style>', 'V2 styles')

# 3) Alerta global visible para todos los miembros conectados.
old_toast = "function scoreToast(message){let old=$('.toastScore');if(old)old.remove();let t=document.createElement('div');t.className='toastScore';t.textContent=message;document.body.appendChild(t);setTimeout(()=>t.remove(),1800)}"
new_toast = old_toast + r'''
function globalClubAlert(n){
 if(!n)return;
 let old=$('.globalClubAlert');if(old)old.remove();
 notificationPing();
 let d=document.createElement('div');d.className='globalClubAlert';
 let meta=n.metadata||{},pairs=meta.winner_pair&&meta.loser_pair?`<div class="lizaPairs">🏆 ${esc(meta.winner_pair)} · 200–0 · ${esc(meta.loser_pair)}</div>`:'';
 d.innerHTML=`<div class="globalClubAlertCard"><div class="globalClubAlertEmoji">🔥🁣🔥</div><h2>${esc(n.title||'¡LIZAAAAAAA 200–0!')}</h2><p>${esc(n.message||'¡Diablos, se la dieron Lizaaaaaaa! 😂 No cogieron ni 1, son unos muertos.')}</p>${pairs}<button class="btn green" type="button">✅ VISTO</button></div>`;
 d.querySelector('button').onclick=()=>d.remove();document.body.appendChild(d);setTimeout(()=>d.remove(),12000);
}
'''
replace_once(old_toast, new_toast, 'global Liza alert')

# 4) Cargar responsable en historial para poder corregir cualquier tipo de jugada.
old_select = "sb.from('score_events').select('*,credited:members!score_events_credited_member_id_fkey(full_name,nickname)').eq('game_id',id).order('created_at',{ascending:false}).limit(20)"
new_select = "sb.from('score_events').select('*,credited:members!score_events_credited_member_id_fkey(full_name,nickname),responsible:members!score_events_responsible_member_id_fkey(full_name,nickname)').eq('game_id',id).order('created_at',{ascending:false}).limit(20)"
replace_once(old_select, new_select, 'history responsible join')

# 5) Historial: Corregir + Anular en ambos equipos y en jugadas especiales.
old_history = r'''<div id="scoreHistory">${(e.data||[]).filter(x=>!x.voided).map(x=>`<div class="entry row"><span class="grow">${x.team==='L'?'🔵':'🔴'} ${esc(labels[x.event_type]||x.event_type)} · ${esc(nm(x.credited))}</span><b>+${x.points}</b>${x.event_type==='normal'?`<button class="btn dark" data-a="correctScore" data-id="${x.id}" data-points="${x.points}" data-type="${x.event_type}">✏️</button>`:''}<button class="btn red" data-a="voidScore" data-id="${x.id}" data-points="${x.points}">🗑️</button></div>`).join('')||'<p class="muted emptyHistory">Sin anotaciones.</p>'}</div>'''
new_history = r'''<div id="scoreHistory">${(e.data||[]).filter(x=>!x.voided).map(x=>`<div class="entry row"><span class="grow">${x.team==='L'?'🔵':'🔴'} ${esc(labels[x.event_type]||x.event_type)} · ${esc(nm(x.credited))}${x.responsible?`<small class="historyMeta">Responsable: ${esc(nm(x.responsible))}</small>`:''}</span><b>+${x.points}</b><button class="btn dark" data-a="correctScoreV2" data-id="${x.id}" data-team="${x.team}" data-points="${x.points}" data-type="${x.event_type}" data-resp="${x.responsible_member_id||''}" data-credit="${x.credited_member_id||''}">✏️ Corregir</button><button class="btn red" data-a="voidScore" data-id="${x.id}" data-points="${x.points}">🗑️ Anular</button></div>`).join('')||'<p class="muted emptyHistory">Sin anotaciones.</p>'}</div>'''
replace_once(old_history, new_history, 'history correction controls')

# 6) Formulario de anotaciones: botones prominentes para Chivo, Pase y Multa.
old_form = r'''function scoreForm(){scoreTeam='';scoreType='normal';scoreWin='';scoreResp='';return`<div class="card scoreCard"><h2>⚡ Anota en 3 toques</h2><div class="scoreHint"><b>1.</b> Toca quién dominó · <b>2.</b> Escribe los puntos · <b>3.</b> Registra. Los puntos se acreditan automáticamente al jugador seleccionado.</div><h3>1️⃣ ¿Quién dominó?</h3><div class="grid2">${GP.map(x=>`<button class="btn dark playerPick" data-player="${x.member_id}" data-team="${x.team}">${x.team==='L'?'🔵':'🔴'} <b>${esc(nm(x.members))}</b><br><small>${x.team==='L'?'Largos':'Cortos'}</small></button>`).join('')}</div><h3>2️⃣ ¿Cuántos puntos hizo?</h3><input id="pts" class="field scoreInput" type="number" inputmode="numeric" min="1" max="250" autocomplete="off" placeholder="0"><details><summary><b>🎯 Jugada especial</b> <span class="muted small">(solo cuando aplique)</span></summary><div class="chips" style="margin-top:10px">${Object.entries(labels).filter(([k])=>k!=='normal').map(([k,v])=>`<button class="chip" data-type="${k}">${esc(v)}</button>`).join('')}</div><div id="resp" class="hidden"><h3>¿Quién cometió la falta?</h3><div id="respChips" class="chips"></div></div></details><button class="btn green full scoreSubmit" data-a="score">✅ REGISTRAR</button><div class="small muted" style="text-align:center;margin-top:6px">La mesa seguirá abierta y lista para la próxima mano. Se cierra sola al llegar a 200.</div></div>`}'''
new_form = r'''function scoreForm(){scoreTeam='';scoreType='normal';scoreWin='';scoreResp='';return`<div class="card scoreCard"><h2>⚡ Anotaciones Titanes</h2><div class="scoreHint"><b>Reparto individual automático 50/50:</b> los puntos completos van al marcador del equipo, y la estadística individual se divide entre los dos jugadores de la pareja real de esta partida. Chivo y Pase descuentan 10% al average del responsable; Multa descuenta 3%.</div><h3>1️⃣ ¿Qué jugador/equipo recibe los puntos?</h3><div class="grid2">${GP.map(x=>`<button class="btn dark playerPick" data-player="${x.member_id}" data-team="${x.team}">${x.team==='L'?'🔵':'🔴'} <b>${esc(nm(x.members))}</b><br><small>${x.team==='L'?'Largos':'Cortos'}</small></button>`).join('')}</div><h3>2️⃣ Dominación normal</h3><input id="pts" class="field scoreInput" type="number" inputmode="numeric" min="1" max="250" autocomplete="off" placeholder="Escribe los puntos"><h3>🎯 Jugadas especiales rápidas</h3><div class="specialActions"><button type="button" class="specialAction" data-type="chivo">🐐<b>CHIVO</b><span>+100 al contrario</span></button><button type="button" class="specialAction" data-type="pase_con_ficha">🁣<b>PASE CON FICHA</b><span>+100 al contrario</span></button><button type="button" class="specialAction" data-type="multa">⚠️<b>MULTA</b><span>+30 al contrario</span></button></div><div id="resp" class="hidden"><h3>¿Quién cometió la falta?</h3><div id="respChips" class="chips"></div></div><details><summary><b>Más jugadas especiales</b></summary><div class="chips" style="margin-top:10px">${Object.entries(labels).filter(([k])=>!['normal','chivo','pase_con_ficha','multa'].includes(k)).map(([k,v])=>`<button type="button" class="chip" data-type="${k}">${esc(v)}</button>`).join('')}</div></details><button class="btn green full scoreSubmit" data-a="score">✅ REGISTRAR</button><div class="small muted" style="text-align:center;margin-top:6px">La mesa seguirá abierta y lista para la próxima mano. Si termina 200–0, ambos ganadores reciben +5% en su average y todo el club verá la alerta de Liza.</div></div>`}'''
replace_once(old_form, new_form, 'score form V2')

# 7) Corregir equipo, tipo, puntos, responsable y jugador acreditado.
old_action = "if(a==='correctScore')return correctScore(b.dataset.id,+b.dataset.points,b.dataset.type);"
new_action = "if(a==='correctScoreV2')return correctScoreV2(b);" + old_action
replace_once(old_action, new_action, 'correctScoreV2 action')

old_correct = r'''async function correctScore(id,oldPoints,type){if(type!=='normal')return alert('Anula la jugada especial y regístrala nuevamente.');let value=prompt(`Puntos actuales: ${oldPoints}\nEscribe la cantidad correcta:`,String(oldPoints));if(value===null)return;let points=Number(value);if(!Number.isInteger(points)||points<1||points>250)return alert('Escribe un número entre 1 y 250.');if(points===oldPoints)return;let reason=prompt('Motivo de la corrección:','Puntos anotados incorrectamente');if(reason===null)return;let r=await sb.rpc('correct_score_event',{p_event_id:id,p_new_points:points,p_reason:reason.trim()||'Corrección de puntos'});if(r.error)return alert(r.error.message);scoreToast(`✅ Corregido: ${oldPoints} → ${points}`);await render()}'''
new_correct_v2 = r'''async function correctScoreV2(b){
 let id=b.dataset.id,oldTeam=b.dataset.team,oldType=b.dataset.type,oldPoints=Number(b.dataset.points),oldResp=b.dataset.resp||'',oldCredit=b.dataset.credit||'';
 let team=(prompt('Equipo que debe recibir los puntos: L = Largos / C = Cortos',oldTeam)||'').trim().toUpperCase();if(!team)return;if(!['L','C'].includes(team))return alert('Escribe L o C.');
 const allowed=['normal','multa','chivo','pase_con_ficha','capicua','paso_corrido','paso_salida_doble','dos_carotas'];
 let type=(prompt('Tipo de jugada:\nnormal, multa, chivo, pase_con_ficha, capicua, paso_corrido, paso_salida_doble, dos_carotas',oldType)||'').trim();if(!type)return;if(!allowed.includes(type))return alert('Tipo de jugada no válido.');
 let points=null;if(type==='normal'){let v=prompt('Puntos correctos:',String(oldPoints));if(v===null)return;points=Number(v);if(!Number.isInteger(points)||points<1||points>250)return alert('Los puntos deben ser un número entre 1 y 250.');}
 let teamPlayers=GP.filter(x=>x.team===team);if(teamPlayers.length!==2)return alert('No se pudieron identificar los dos jugadores del equipo.');
 let defaultCredit=Math.max(0,teamPlayers.findIndex(x=>x.member_id===oldCredit));let creditChoice=prompt('Jugador acreditado:\n'+teamPlayers.map((x,i)=>`${i+1}. ${nm(x.members)}`).join('\n'),String(defaultCredit+1));if(creditChoice===null)return;let credit=teamPlayers[Number(creditChoice)-1];if(!credit)return alert('Selecciona 1 o 2.');
 let responsible=null;if(['multa','chivo','pase_con_ficha'].includes(type)){let opp=GP.filter(x=>x.team!==team),defaultResp=Math.max(0,opp.findIndex(x=>x.member_id===oldResp));let rc=prompt('¿Quién cometió la falta?\n'+opp.map((x,i)=>`${i+1}. ${nm(x.members)}`).join('\n'),String(defaultResp+1));if(rc===null)return;let picked=opp[Number(rc)-1];if(!picked)return alert('Selecciona 1 o 2.');responsible=picked.member_id;}
 let reason=prompt('Motivo de la corrección:','Anotación registrada incorrectamente');if(reason===null)return;
 if(!confirm(`¿Aplicar corrección?\nEquipo: ${team}\nTipo: ${type}\nPuntos: ${type==='normal'?points:(fixed[type]||'fijos')}`))return;
 let r=await sb.rpc('correct_score_event_v2',{p_event_id:id,p_new_team:team,p_new_event_type:type,p_new_points:points,p_new_responsible_member_id:responsible,p_new_credited_member_id:credit.member_id,p_reason:reason.trim()||'Corrección de anotación'});if(r.error)return alert(r.error.message);scoreToast('✅ Anotación corregida y marcador recalculado');await render()
}
'''
replace_once(old_correct, new_correct_v2 + old_correct, 'full correction V2')

# 8) Mostrar alerta global en tiempo real; las demás notificaciones conservan el sonido/vibración actual.
old_rt = ".on('postgres_changes',{event:'INSERT',schema:'public',table:'notifications',filter:`member_id=eq.${me.id}`},()=>{notificationPing();if(page==='Inicio'||page==='Ranking')scheduleRender(120)}).subscribe()}"
new_rt = ".on('postgres_changes',{event:'INSERT',schema:'public',table:'notifications',filter:`member_id=eq.${me.id}`},payload=>{let n=payload?.new;if(n?.type==='liza_200_0')globalClubAlert(n);else notificationPing();if(page==='Inicio'||page==='Ranking')scheduleRender(120)}).subscribe()}"
replace_once(old_rt, new_rt, 'realtime global notification')

# 9) Marker final only after every guard passed.
replace_once('</body></html>', marker + '</body></html>', 'integration marker')

path.write_text(s, encoding='utf-8')
print('SCORING_V2 patch complete:', len(s), 'bytes')

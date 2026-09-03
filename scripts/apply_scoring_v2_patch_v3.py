from pathlib import Path

path=Path('index.html')
s=path.read_text(encoding='utf-8')
MARK='<!--SCORING_V2_INTEGRATED_0903-->'
if MARK in s:
    print('already integrated')
    raise SystemExit(0)

def once(old,new,label):
    global s
    n=s.count(old)
    if n!=1: raise SystemExit(f'{label}: expected 1, got {n}')
    s=s.replace(old,new,1)
    print('ok',label)

def between(start_token,end_token,new,label,include_end=False):
    global s
    if s.count(start_token)!=1: raise SystemExit(f'{label}: start count {s.count(start_token)}')
    a=s.index(start_token)
    b=s.index(end_token,a)
    if include_end: b+=len(end_token)
    if b<=a: raise SystemExit(f'{label}: invalid bounds')
    s=s[:a]+new+s[b:]
    print('ok',label)

# Ranking calls: preserve frontend field names while switching semantics.
n=s.count("sb.rpc('titanes_ranking',")
if n<1: raise SystemExit('no legacy ranking calls')
s=s.replace("sb.rpc('titanes_ranking',","sb.rpc('titanes_ranking_v2_compat',")
print('ok ranking calls',n)
n=s.count("sb.rpc('titanes_podium',")
if n<1: raise SystemExit('no legacy podium calls')
s=s.replace("sb.rpc('titanes_podium',","sb.rpc('titanes_podium_v2_compat',")
print('ok podium calls',n)
once("sb.from('player_individual_stats').select('*')","sb.from('player_individual_stats_v2').select('*')",'individual stats')

css='''\n/* === SCORING_V2_INTEGRATED_0903 === */
.specialActions{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0}.specialAction{border:1px solid #334863;border-radius:16px;min-height:82px;padding:10px 6px;background:#050b14;color:#fff;font-weight:1000;box-shadow:0 8px 24px #0007;touch-action:manipulation}.specialAction b{display:block;font-size:13px;margin-top:4px}.specialAction span{display:block;font-size:12px;margin-top:3px}.specialAction[data-type="chivo"]{border-color:#ffcc33}.specialAction[data-type="pase_con_ficha"]{border-color:#8b2cff}.specialAction[data-type="multa"]{border-color:#ff3b30}.specialAction.on{outline:3px solid #58ff18;background:#10230d}.historyMeta{display:block;margin-top:3px;color:#9fb0c4;font-size:10px}.globalClubAlert{position:fixed;inset:0;z-index:9999;background:#000b;display:grid;place-items:center;padding:18px;backdrop-filter:blur(8px)}.globalClubAlertCard{width:min(560px,100%);border:2px solid #ffcc33;border-radius:24px;padding:22px;background:radial-gradient(circle at 50% 0,#5a3700,#0a0d13 62%);box-shadow:0 0 50px #ffcc3355,0 24px 70px #000d;text-align:center;animation:lizaPop .24s ease-out}.globalClubAlertEmoji{font-size:60px}.globalClubAlertCard h2{margin:7px 0;color:#ffcc33;font-size:29px}.globalClubAlertCard p{font-size:20px;font-weight:1000;line-height:1.35}.globalClubAlertCard button{min-width:180px}.lizaPairs{font-size:12px;color:#dbe4ef;margin:8px 0 14px}@keyframes lizaPop{from{transform:scale(.82);opacity:0}to{transform:scale(1);opacity:1}}@media(max-width:460px){.specialActions{grid-template-columns:1fr}.specialAction{min-height:62px}.globalClubAlertCard p{font-size:17px}.globalClubAlertCard h2{font-size:24px}}\n'''
once('</style>',css+'</style>','styles')

old="function scoreToast(message){let old=$('.toastScore');if(old)old.remove();let t=document.createElement('div');t.className='toastScore';t.textContent=message;document.body.appendChild(t);setTimeout(()=>t.remove(),1800)}"
alert_fn=old+'''\nfunction globalClubAlert(n){if(!n)return;let old=$('.globalClubAlert');if(old)old.remove();notificationPing();let d=document.createElement('div');d.className='globalClubAlert';let meta=n.metadata||{},pairs=meta.winner_pair&&meta.loser_pair?`<div class="lizaPairs">🏆 ${esc(meta.winner_pair)} · 200–0 · ${esc(meta.loser_pair)}</div>`:'';d.innerHTML=`<div class="globalClubAlertCard"><div class="globalClubAlertEmoji">🔥🁣🔥</div><h2>${esc(n.title||'¡LIZAAAAAAA 200–0!')}</h2><p>${esc(n.message||'¡Diablos, se la dieron Lizaaaaaaa! 😂 No cogieron ni 1, son unos muertos.')}</p>${pairs}<button class="btn green" type="button">✅ VISTO</button></div>`;d.querySelector('button').onclick=()=>d.remove();document.body.appendChild(d);setTimeout(()=>d.remove(),12000)}'''
once(old,alert_fn,'global alert function')

oldq="sb.from('score_events').select('*,credited:members!score_events_credited_member_id_fkey(full_name,nickname)').eq('game_id',id).order('created_at',{ascending:false}).limit(20)"
newq="sb.from('score_events').select('*,credited:members!score_events_credited_member_id_fkey(full_name,nickname),responsible:members!score_events_responsible_member_id_fkey(full_name,nickname)').eq('game_id',id).order('created_at',{ascending:false}).limit(20)"
once(oldq,newq,'history responsible query')

# Replace only scoreHistory div, bounded by the exact closing sequence before </details>.
hstart='<div id="scoreHistory">'
closing='</div></details></div>'
if s.count(hstart)!=1: raise SystemExit(f'history start count {s.count(hstart)}')
a=s.index(hstart); b=s.index(closing,a)
new_history='''<div id="scoreHistory">${(e.data||[]).filter(x=>!x.voided).map(x=>`<div class="entry row"><span class="grow">${x.team==='L'?'🔵':'🔴'} ${esc(labels[x.event_type]||x.event_type)} · ${esc(nm(x.credited))}${x.responsible?`<small class="historyMeta">Responsable: ${esc(nm(x.responsible))}</small>`:''}</span><b>+${x.points}</b><button class="btn dark" data-a="correctScoreV2" data-id="${x.id}" data-team="${x.team}" data-points="${x.points}" data-type="${x.event_type}" data-resp="${x.responsible_member_id||''}" data-credit="${x.credited_member_id||''}">✏️ Corregir</button><button class="btn red" data-a="voidScore" data-id="${x.id}" data-points="${x.points}">🗑️ Anular</button></div>`).join('')||'<p class="muted emptyHistory">Sin anotaciones.</p>'}</div>'''
s=s[:a]+new_history+s[b:]
print('ok history controls')

new_form='''function scoreForm(){scoreTeam='';scoreType='normal';scoreWin='';scoreResp='';return`<div class="card scoreCard"><h2>⚡ Anotaciones Titanes</h2><div class="scoreHint"><b>Reparto individual automático 50/50:</b> el marcador recibe todos los puntos y la estadística individual se divide entre los dos jugadores de la pareja real de esta partida. Chivo y Pase descuentan 10% al average del responsable; Multa descuenta 3%.</div><h3>1️⃣ ¿Qué jugador/equipo recibe los puntos?</h3><div class="grid2">${GP.map(x=>`<button class="btn dark playerPick" data-player="${x.member_id}" data-team="${x.team}">${x.team==='L'?'🔵':'🔴'} <b>${esc(nm(x.members))}</b><br><small>${x.team==='L'?'Largos':'Cortos'}</small></button>`).join('')}</div><h3>2️⃣ Dominación normal</h3><input id="pts" class="field scoreInput" type="number" inputmode="numeric" min="1" max="250" autocomplete="off" placeholder="Escribe los puntos"><h3>🎯 Jugadas especiales rápidas</h3><div class="specialActions"><button type="button" class="specialAction" data-type="chivo">🐐<b>CHIVO</b><span>+100 al contrario</span></button><button type="button" class="specialAction" data-type="pase_con_ficha">🁣<b>PASE CON FICHA</b><span>+100 al contrario</span></button><button type="button" class="specialAction" data-type="multa">⚠️<b>MULTA</b><span>+30 al contrario</span></button></div><div id="resp" class="hidden"><h3>¿Quién cometió la falta?</h3><div id="respChips" class="chips"></div></div><details><summary><b>Más jugadas especiales</b></summary><div class="chips" style="margin-top:10px">${Object.entries(labels).filter(([k])=>!['normal','chivo','pase_con_ficha','multa'].includes(k)).map(([k,v])=>`<button type="button" class="chip" data-type="${k}">${esc(v)}</button>`).join('')}</div></details><button class="btn green full scoreSubmit" data-a="score">✅ REGISTRAR</button><div class="small muted" style="text-align:center;margin-top:6px">Si termina 200–0, ambos ganadores reciben +5% en su average y todo el club conectado verá la alerta de Liza.</div></div>`}\n'''
if s.count('function scoreForm(){')!=1 or s.count('window.pickTeam=')!=1: raise SystemExit('score form boundaries not unique')
a=s.index('function scoreForm(){'); b=s.index('window.pickTeam=',a)
s=s[:a]+new_form+s[b:]
print('ok score form')

oldact="if(a==='correctScore')return correctScore(b.dataset.id,+b.dataset.points,b.dataset.type);"
once(oldact,"if(a==='correctScoreV2')return correctScoreV2(b);"+oldact,'action')

correct_v2='''async function correctScoreV2(b){let id=b.dataset.id,oldTeam=b.dataset.team,oldType=b.dataset.type,oldPoints=Number(b.dataset.points),oldResp=b.dataset.resp||'',oldCredit=b.dataset.credit||'';let team=(prompt('Equipo que debe recibir los puntos: L = Largos / C = Cortos',oldTeam)||'').trim().toUpperCase();if(!team)return;if(!['L','C'].includes(team))return alert('Escribe L o C.');const allowed=['normal','multa','chivo','pase_con_ficha','capicua','paso_corrido','paso_salida_doble','dos_carotas'];let type=(prompt('Tipo de jugada:\\nnormal, multa, chivo, pase_con_ficha, capicua, paso_corrido, paso_salida_doble, dos_carotas',oldType)||'').trim();if(!type)return;if(!allowed.includes(type))return alert('Tipo de jugada no válido.');let points=null;if(type==='normal'){let v=prompt('Puntos correctos:',String(oldPoints));if(v===null)return;points=Number(v);if(!Number.isInteger(points)||points<1||points>250)return alert('Los puntos deben estar entre 1 y 250.')}let teamPlayers=GP.filter(x=>x.team===team);if(teamPlayers.length!==2)return alert('No se identificaron los dos jugadores del equipo.');let di=teamPlayers.findIndex(x=>x.member_id===oldCredit);if(di<0)di=0;let cc=prompt('Jugador acreditado:\\n'+teamPlayers.map((x,i)=>`${i+1}. ${nm(x.members)}`).join('\\n'),String(di+1));if(cc===null)return;let credit=teamPlayers[Number(cc)-1];if(!credit)return alert('Selecciona 1 o 2.');let responsible=null;if(['multa','chivo','pase_con_ficha'].includes(type)){let opp=GP.filter(x=>x.team!==team),ri=opp.findIndex(x=>x.member_id===oldResp);if(ri<0)ri=0;let rc=prompt('¿Quién cometió la falta?\\n'+opp.map((x,i)=>`${i+1}. ${nm(x.members)}`).join('\\n'),String(ri+1));if(rc===null)return;let pick=opp[Number(rc)-1];if(!pick)return alert('Selecciona 1 o 2.');responsible=pick.member_id}let reason=prompt('Motivo de la corrección:','Anotación registrada incorrectamente');if(reason===null)return;if(!confirm(`¿Aplicar corrección?\\nEquipo: ${team}\\nTipo: ${type}\\nPuntos: ${type==='normal'?points:(fixed[type]||'fijos')}`))return;let r=await sb.rpc('correct_score_event_v2',{p_event_id:id,p_new_team:team,p_new_event_type:type,p_new_points:points,p_new_responsible_member_id:responsible,p_new_credited_member_id:credit.member_id,p_reason:reason.trim()||'Corrección de anotación'});if(r.error)return alert(r.error.message);scoreToast('✅ Anotación corregida y marcador recalculado');await render()}\n'''
anchor='async function correctScore(id,oldPoints,type)'
if s.count(anchor)!=1: raise SystemExit(f'correct anchor count {s.count(anchor)}')
a=s.index(anchor);s=s[:a]+correct_v2+s[a:]
print('ok full correction')

oldrt=".on('postgres_changes',{event:'INSERT',schema:'public',table:'notifications',filter:`member_id=eq.${me.id}`},()=>{notificationPing();if(page==='Inicio'||page==='Ranking')scheduleRender(120)}).subscribe()}"
newrt=".on('postgres_changes',{event:'INSERT',schema:'public',table:'notifications',filter:`member_id=eq.${me.id}`},payload=>{let n=payload?.new;if(n?.type==='liza_200_0')globalClubAlert(n);else notificationPing();if(page==='Inicio'||page==='Ranking')scheduleRender(120)}).subscribe()}"
once(oldrt,newrt,'realtime liza')

once('</body></html>',MARK+'</body></html>','marker')

required=['titanes_ranking_v2_compat','titanes_podium_v2_compat','player_individual_stats_v2','correct_score_event_v2','data-type="chivo"','data-type="pase_con_ficha"','data-type="multa"','globalClubAlert','liza_200_0',MARK]
missing=[x for x in required if x not in s]
if missing: raise SystemExit('missing '+','.join(missing))
if "sb.rpc('titanes_ranking'," in s: raise SystemExit('legacy ranking remains')
path.write_text(s,encoding='utf-8')
print('DONE',len(s))

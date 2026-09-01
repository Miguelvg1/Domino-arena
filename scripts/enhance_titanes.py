from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')

if 'TITANES_DASHBOARD_V4' in s:
    print('Mejoras V4 ya aplicadas')
    raise SystemExit(0)

css = r'''
/* === TITANES_DASHBOARD_V4 === */
.appWelcome{background:linear-gradient(135deg,#101d33 0,#182b4a 48%,#351b55 100%);border:1px solid #3d5572;border-radius:24px;padding:18px;margin-bottom:12px;box-shadow:0 16px 36px #0004}.appWelcomeTop{display:flex;gap:12px;align-items:center}.welcomeCopy{min-width:0;flex:1}.welcomeCopy h1{margin:2px 0 4px;font-size:27px}.welcomeKicker{font-size:10px;font-weight:1000;letter-spacing:.9px;color:#8df7be}.levelPill{border:1px solid #7c3aed;background:#22153b;padding:7px 10px;border-radius:999px;color:#d8c6ff;font-size:10px;font-weight:1000}.homeStats{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:12px}.homeStat{background:#081522;border:1px solid #294765;border-radius:14px;padding:10px 6px;text-align:center}.homeStat b{display:block;font-size:18px;color:#fff}.homeStat small{font-size:9px;color:#8fa3bb}.dashboardGrid{display:grid;grid-template-columns:1.2fr .8fr;gap:10px;align-items:start}.dashPanel{background:linear-gradient(180deg,#102238,#0b1727);border:1px solid #294765;border-radius:20px;padding:14px;margin:10px 0}.dashPanel h2{margin:0 0 9px;font-size:17px}.pizarraMini{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;align-items:end;margin:12px 0}.miniPod{background:#091827;border:1px solid #334f6d;border-radius:16px;padding:11px 5px;text-align:center;min-width:0}.miniPod.one{border-color:#d9aa23;background:linear-gradient(180deg,#4b380d,#111a26);box-shadow:0 0 20px #f7c9481f;transform:translateY(-6px)}.miniPod .miniPos{font-size:19px}.miniPod b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:12px}.miniPod strong{display:block;font-size:21px;color:#f7c948;margin-top:4px}.myRankStrip{display:flex;align-items:center;gap:10px;border:1px solid #6d3bb3;background:linear-gradient(135deg,#211130,#111b2d);padding:11px;border-radius:14px;margin-top:8px}.myRankNum{width:46px;height:46px;display:grid;place-items:center;border-radius:14px;background:#7c3aed;color:#fff;font-size:19px;font-weight:1000}.myRankStrip .grow b{display:block}.liveDot{width:8px;height:8px;border-radius:50%;background:#22c55e;box-shadow:0 0 10px #22c55e;display:inline-block;margin-right:5px}.fastActions{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin:10px 0}.fastAction{border:1px solid #294765;background:#0b1a2a;color:#fff;border-radius:16px;min-height:78px;padding:9px 5px;font-size:10px;font-weight:900}.fastAction b{display:block;font-size:24px;margin-bottom:5px}.fastAction.primary{background:linear-gradient(135deg,#6d28d9,#9333ea);border-color:#9b6cff}.fastAction.greenA{background:linear-gradient(135deg,#047857,#16a34a)}.fastAction.goldA{background:linear-gradient(135deg,#7c5206,#d97706)}.chatBadge{position:absolute;top:5px;right:calc(50% - 25px);min-width:19px;height:19px;padding:0 5px;border-radius:999px;background:#ef4444;color:#fff;display:grid;place-items:center;font-size:10px;font-weight:1000;box-shadow:0 0 12px #ef444488}.nav button{position:relative}.nav button.chatHot{color:#c084fc;animation:chatGlow 1s ease-in-out 2}@keyframes chatGlow{50%{text-shadow:0 0 16px #a855f7;transform:translateY(-2px)}}.pizarraPersonal{display:flex;align-items:center;gap:10px;border:1px solid #6d3bb3;background:linear-gradient(135deg,#251133,#121c2e);border-radius:16px;padding:12px;margin:10px 0}.pizarraPersonal .rankBall{width:54px;height:54px;border-radius:18px;display:grid;place-items:center;background:linear-gradient(135deg,#7c3aed,#4f46e5);font-size:21px;font-weight:1000}.pizarraPersonal strong{font-size:18px}.softDivider{height:1px;background:#ffffff12;margin:11px 0}.compactActivity{display:flex;gap:9px;align-items:center;padding:9px 0;border-bottom:1px solid #ffffff10}.compactActivity:last-child{border-bottom:0}.speedNote{font-size:10px;color:#7f91a6;text-align:center;margin:8px 0}.chatBell{display:inline-flex;align-items:center;gap:6px;color:#d8c6ff;font-size:10px;font-weight:900}.chatBell i{font-style:normal;animation:softPulse 1.8s infinite}@keyframes softPulse{50%{opacity:.55}}@media(max-width:620px){.dashboardGrid{grid-template-columns:1fr}.homeStats{grid-template-columns:repeat(2,1fr)}.fastActions{grid-template-columns:repeat(4,1fr)}}@media(max-width:390px){.fastAction{min-height:72px}.fastAction b{font-size:21px}.welcomeCopy h1{font-size:24px}.miniPod strong{font-size:18px}}
'''

s = s.replace('</style>', css + '\n</style>', 1)

helpers = r'''
let unreadChat=Number(localStorage.getItem('titanesUnreadChat')||0),lastChatEvent='',audioCtx=null,renderTimer=null,renderRunning=false,renderAgain=false;
function saveUnread(){localStorage.setItem('titanesUnreadChat',String(unreadChat))}
function clearUnreadChat(){unreadChat=0;saveUnread()}
function unlockAudio(){try{if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume()}catch(e){}}
document.addEventListener('pointerdown',unlockAudio,{once:true,passive:true});
function chatPing(){try{if(navigator.vibrate)navigator.vibrate([70,45,70])}catch(e){}try{unlockAudio();if(!audioCtx||audioCtx.state!=='running')return;let o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';o.frequency.setValueAtTime(180,audioCtx.currentTime);o.frequency.exponentialRampToValueAtTime(105,audioCtx.currentTime+.11);g.gain.setValueAtTime(.045,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+.14);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+.15)}catch(e){}}
function refreshChatBadge(){let b=document.querySelector('[data-p="Chat"]');if(!b)return;b.classList.toggle('chatHot',unreadChat>0);let x=b.querySelector('.chatBadge');if(x)x.textContent=unreadChat>99?'99+':String(unreadChat)}
function scheduleRender(delay=90){clearTimeout(renderTimer);renderTimer=setTimeout(async()=>{if(renderRunning){renderAgain=true;return}renderRunning=true;try{await render()}finally{renderRunning=false;if(renderAgain){renderAgain=false;scheduleRender(80)}}},delay)}
function onClubChatRealtime(payload){let n=payload?.new;if(!n||n.id===lastChatEvent)return;lastChatEvent=n.id;if(n.member_id===me?.id)return;if(page==='Chat'){scheduleRender(60);return}unreadChat=Math.min(999,unreadChat+1);saveUnread();chatPing();refreshChatBadge()}
'''

anchor = "function field(id,ph,type='text')"
if anchor not in s:
    raise SystemExit('No se encontró el ancla de helpers')
s = s.replace(anchor, helpers + '\n' + anchor, 1)

start = s.index('function shell(c){')
end = s.index('\nfunction loginView', start)
new_shell = r'''function shell(c){let av=me?.photo_url?`<div class="avatar hasPhoto"><img src="${esc(me.photo_url)}" alt="Foto de ${esc(nm(me))}" onerror="this.parentElement.classList.remove('hasPhoto');this.parentElement.innerHTML='◆'"></div>`:`<div class="avatar">◆</div>`;let nav=[['Inicio','🏠','Inicio'],['Partidas','🁣','Partidas'],['Ranking','📊','Pizarra'],['Chat','💬','Chat'],['Más','☰','Más']];return`<header class="top">${av}<div class="grow"><div class="brand">Titanes Dominó</div><div class="online">● En línea · tiempo real</div></div><div class="small">${esc(nm(me))}${me?.role==='admin'?' 🛡️':''}</div></header><main class="wrap">${c}</main><nav class="nav">${nav.map(([p,i,l])=>`<button data-a="nav" data-p="${p}" class="${page===p?'on':''} ${p==='Chat'&&unreadChat?'chatHot':''}"><b>${i}</b>${l}${p==='Chat'&&unreadChat?`<span class="chatBadge">${unreadChat>99?'99+':unreadChat}</span>`:''}</button>`).join('')}</nav>`}'''
s = s[:start] + new_shell + s[end:]

s = s.replace("if(a==='nav'){page=b.dataset.p;sub='';openGame='';return render()}", "if(a==='nav'){page=b.dataset.p;if(page==='Chat')clearUnreadChat();sub='';openGame='';return render()}", 1)

start = s.index('async function home(){')
end = s.index('\nasync function games(){', start)
new_home = r'''async function home(){
 const now=new Date(),day=now.getDay()||7,weekFrom=new Date(now);weekFrom.setDate(now.getDate()-day+1);weekFrom.setHours(0,0,0,0);
 let[live,week,chat,q]=await Promise.all([
  sb.from('live_games_feed').select('*'),
  sb.rpc('titanes_ranking',{p_from:weekFrom.toISOString(),p_to:now.toISOString(),p_min_games:0}),
  sb.from('club_chat').select('id,message,created_at,member_id,members(full_name,nickname)').order('created_at',{ascending:false}).limit(4),
  sb.from('active_challenger_queue').select('*')
 ]);
 let lg=(live.data||[]).filter(x=>x.status==='activa'),rows=week.data||[],mine=rows.find(x=>x.member_id===me.id),myPos=mine?(Number(mine.rank_position)||rows.findIndex(x=>x.member_id===me.id)+1):null,top=rows.slice(0,3),leader=top[0],gap=mine&&leader&&mine.member_id!==leader.member_id?Math.max(0,Number(leader.win_pct||0)-Number(mine.win_pct||0)):0;
 const pod=(x,i)=>x?`<div class="miniPod ${i===0?'one':''}"><div class="miniPos">${i===0?'👑':i===1?'🥈':'🥉'}</div><b>${esc(x.player_name||'Titán')}</b><strong>${Number(x.win_pct||0).toFixed(1)}%</strong><small>${x.games_played||0} PJ</small></div>`:`<div class="miniPod"><div class="miniPos">—</div><b>Sin dato</b><strong>0%</strong></div>`;
 return`<section class="appWelcome"><div class="appWelcomeTop"><div class="welcomeCopy"><div class="welcomeKicker">TITANES DE LOS GUANDULES</div><h1>¡Bienvenido, ${esc(nm(me))}!</h1><div class="chatBell"><i>●</i> Todo el club, en tiempo real</div></div><span class="levelPill">⚡ TITÁN ACTIVO</span></div><div class="homeStats"><div class="homeStat"><b>${myPos?'#'+myPos:'—'}</b><small>POSICIÓN SEMANAL</small></div><div class="homeStat"><b>${mine?Number(mine.win_pct||0).toFixed(1)+'%':'—'}</b><small>VICTORIAS</small></div><div class="homeStat"><b>${mine?.games_played||0}</b><small>PARTIDAS</small></div><div class="homeStat"><b>${Number(mine?.total_points||0).toLocaleString()}</b><small>PUNTOS</small></div></div></section><div class="fastActions"><button class="fastAction primary" data-a="nav" data-p="Ranking"><b>📊</b>Pizarra</button><button class="fastAction greenA" data-a="nav" data-p="Partidas"><b>🁣</b>Jugar</button><button class="fastAction" data-a="nav" data-p="Chat"><b>💬</b>Chat${unreadChat?` (${unreadChat})`:''}</button><button class="fastAction goldA" data-a="sub" data-s="Turnos"><b>⚔️</b>Retar</button></div><div class="dashboardGrid"><div><section class="dashPanel"><div class="row"><h2 class="grow">📊 Pizarra en Vivo</h2><span class="statPill"><span class="liveDot"></span>actualizando</span></div><div class="pizarraMini">${pod(top[1],1)}${pod(top[0],0)}${pod(top[2],2)}</div>${mine?`<div class="myRankStrip"><div class="myRankNum">#${myPos}</div><div class="grow"><b>${esc(nm(me))}, estás en carrera</b><small class="muted">${myPos===1?'👑 Estás defendiendo el #1':gap.toFixed(1)+' puntos de average te separan del líder'}</small></div><button class="btn purple" data-a="nav" data-p="Ranking">Ver</button></div>`:'<div class="myRankStrip"><div class="myRankNum">?</div><div class="grow"><b>Tu posición aparecerá al jugar</b><small class="muted">Cada partida alimenta la pizarra automáticamente.</small></div></div>'}</section>${lg.length?`<section class="dashPanel"><div class="row"><h2 class="grow">🔴 Partidas en curso</h2><span class="badge live">${lg.length} EN VIVO</span></div>${lg.slice(0,2).map(x=>`<button class="tile full" data-a="openGame" data-id="${x.id}" style="text-align:left;color:white;margin:7px 0"><div class="row"><b class="grow">${esc(x.table_name)}</b><strong>${x.largos_score} — ${x.cortos_score}</strong></div><small class="muted">Entrar a la mesa</small></button>`).join('')}</section>`:''}</div><div><section class="dashPanel"><div class="row"><h2 class="grow">💬 Chat en vivo</h2>${unreadChat?`<span class="badge live">${unreadChat} nuevo${unreadChat===1?'':'s'}</span>`:''}</div>${(chat.data||[]).reverse().map(x=>`<div class="compactActivity"><div>💬</div><div class="grow"><b>${esc(nm(x.members))}</b><div class="small muted">${esc(x.message)}</div></div></div>`).join('')||'<p class="muted">Todavía no hay comentarios.</p>'}<button class="btn purple full" data-a="nav" data-p="Chat">Abrir chat</button></section><section class="dashPanel"><h2>⚔️ Retadores</h2><div class="row"><div class="myRankNum" style="background:#0f766e">${q.data?.length||0}</div><div class="grow"><b>Esperando mesa</b><small class="muted">Entra y busca tu próxima batalla.</small></div></div><button class="btn green full" data-a="sub" data-s="Turnos">Buscar rival</button></section></div></div><div class="speedNote">Interfaz optimizada: datos clave en paralelo y actualizaciones agrupadas para evitar recargas innecesarias.</div>`
}'''
s = s[:start] + new_home + s[end:]

needle = " window.setRankMode=v=>{rankMode=v;render()};window.setDuelA=v=>{duelA=v;render()};window.setDuelB=v=>{duelB=v;render()};"
if needle not in s:
    raise SystemExit('No se encontró el ancla del ranking')
insert = r''' const myBoardRow=rows.find(x=>x.member_id===me.id),myBoardPos=myBoardRow?(Number(myBoardRow.rank_position)||rows.findIndex(x=>x.member_id===me.id)+1):null,boardLeader=rows[0],myGap=myBoardRow&&boardLeader&&myBoardRow.member_id!==boardLeader.member_id?Math.max(0,Number(boardLeader.win_pct||0)-Number(myBoardRow.win_pct||0)):0;
 const personalPulse=myBoardRow?`<div class="pizarraPersonal"><div class="rankBall">#${myBoardPos}</div><div class="grow"><small class="muted">TU POSICIÓN AHORA</small><strong>${esc(myBoardRow.player_name||nm(me))} · ${pct(myBoardRow.win_pct)}</strong><div class="small">${myBoardPos===1?'👑 Eres el líder. Todos vienen detrás de ti.':`🔥 Estás a ${myGap.toFixed(1)} puntos de average del #1.`}</div></div><span class="periodPill"><span class="liveSpark"></span>EN VIVO</span></div>`:'';
 window.setRankMode=v=>{rankMode=v;render()};window.setDuelA=v=>{duelA=v;render()};window.setDuelB=v=>{duelB=v;render()};'''
s = s.replace(needle, insert, 1)
s = s.replace('🏆 SALÓN DE RIVALIDAD', '📊 PIZARRA EN VIVO', 1)
s = s.replace('¿Quién manda en Titanes?', 'La tabla que todos quieren conquistar', 1)
s = s.replace('${rankMode===\'semana\'?podium', '${personalPulse}${rankMode===\'semana\'?podium', 1)

ending_start = s.index('let z=await sb.auth.getSession();')
ending_end = s.index('</script>', ending_start)
new_ending = r'''let z=await sb.auth.getSession();session=z.data.session;await render();sb.auth.onAuthStateChange(async(_,s)=>{session=s;await loadMe();scheduleRender(50);if(s)realtime()});
let rtChannel=null;function realtime(){if(!session||rtChannel)return;rtChannel=sb.channel('titanes-live-v4').on('postgres_changes',{event:'*',schema:'public',table:'games'},()=>{if(page==='Partidas'||page==='Inicio'||page==='Ranking')scheduleRender()}).on('postgres_changes',{event:'*',schema:'public',table:'score_events'},()=>{if(page==='Partidas'||page==='Inicio'||page==='Ranking')scheduleRender()}).on('postgres_changes',{event:'INSERT',schema:'public',table:'club_chat'},onClubChatRealtime).on('postgres_changes',{event:'*',schema:'public',table:'live_game_chat'},()=>{if(openGame)scheduleRender()}).on('postgres_changes',{event:'*',schema:'public',table:'challenger_queue'},()=>{if(sub==='Turnos'||page==='Inicio')scheduleRender()}).subscribe()}
realtime();
'''
s = s[:ending_start] + new_ending + s[ending_end:]

s = s.replace('<!--TITANES_FULL_MARKER_0830-->', '<!--TITANES_FULL_MARKER_0830--><!--TITANES_DASHBOARD_V4-->')

required = ['PIZARRA EN VIVO','chatBadge','scheduleRender','TITANES_DASHBOARD_V4','async function home()']
missing = [x for x in required if x not in s]
if missing:
    raise SystemExit('Validación falló: ' + ', '.join(missing))

p.write_text(s, encoding='utf-8')
print('Mejoras Titanes V4 aplicadas correctamente')

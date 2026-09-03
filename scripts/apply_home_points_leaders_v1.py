from pathlib import Path
import re

p=Path('index.html')
s=p.read_text(encoding='utf-8')
marker='<!--HOME_POINTS_LEADERS_V1-->'
if marker in s:
    print('Patch already applied')
    raise SystemExit(0)

# 1) CSS
css='''\n/* === HOME_POINTS_LEADERS_V1 === */\n.homeStatsNew{grid-template-columns:.75fr .85fr 1.7fr}.homeGamesCard{padding:9px 10px}.homeGameTriplet{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:6px}.homeGameTriplet span{display:block;background:#050a12;border:1px solid #1d2a40;border-radius:11px;padding:7px 4px}.homeGameTriplet b{font-size:17px!important}.homeGameTriplet span:nth-child(1) b{color:#58ff18}.homeGameTriplet span:nth-child(2) b{color:#ff6262}.homeGameTriplet span:nth-child(3) b{color:#ffcc33}.pointLeadersCard{border:1px solid #6f2cff;background:linear-gradient(180deg,#0c101b,#050810);border-radius:18px;padding:13px;margin:10px 0;box-shadow:0 0 24px #7c2dff22}.pointLeadersTitle{display:flex;align-items:center;gap:8px;margin-bottom:8px}.pointLeadersTitle h2{margin:0;flex:1;color:#d99cff;font-size:16px}.pointLeaderRow{display:grid;grid-template-columns:38px 42px 1fr auto;gap:8px;align-items:center;border:1px solid #1d2a40;background:#050a12;border-radius:13px;padding:8px;margin:6px 0}.pointLeaderMedal{font-size:22px;text-align:center}.pointLeaderPhoto,.pointLeaderInitials{width:40px;height:40px;border-radius:50%;object-fit:cover;border:2px solid #334863}.pointLeaderInitials{display:grid;place-items:center;font-weight:1000;background:#13283e}.pointLeaderName{font-weight:1000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pointLeaderPts{font-size:18px;font-weight:1000}.pointLeaderRow.p1 .pointLeaderPts{color:#ffcc33}.pointLeaderRow.p2 .pointLeaderPts{color:#42a5ff}.pointLeaderRow.p3 .pointLeaderPts{color:#ff7a32}.pointLeaderSub{font-size:9px;color:#8795aa}.pointsFullList .pointLeaderRow{grid-template-columns:42px 44px 1fr auto}.pointsBreakdown{display:block;font-size:9px;color:#8795aa;margin-top:3px}.pointsRule{font-size:10px;color:#aebbd0;border-top:1px solid #ffffff12;margin-top:8px;padding-top:8px}.pointPenalty{color:#ff6262}.pointGross{color:#79ff42}@media(max-width:520px){.homeStatsNew{grid-template-columns:1fr 1fr}.homeGamesCard{grid-column:1/-1}.pointLeaderRow{grid-template-columns:34px 38px 1fr auto}.pointLeaderPhoto,.pointLeaderInitials{width:36px;height:36px}.pointLeaderPts{font-size:16px}}\n'''
s=s.replace('</style></head>',css+'</style></head>',1)

# 2) helper cards/functions before home()
needle='async function home(){'
helpers=r'''function pointInitials(x){return String(x?.nickname||x?.full_name||'?').trim().split(/\s+/).slice(0,2).map(v=>v[0]||'').join('').toUpperCase()}
function pointLeadersCard(rows){let a=(rows||[]).slice(0,3),med=['🥇','🥈','🥉'];return`<section class="pointLeadersCard"><div class="pointLeadersTitle"><h2>🏆 LÍDERES EN PUNTOS</h2><span class="statPill"><span class="liveSpark"></span>Club</span></div>${a.map((x,i)=>`<div class="pointLeaderRow p${i+1}"><div class="pointLeaderMedal">${med[i]}</div>${x.photo_url?`<img class="pointLeaderPhoto" src="${esc(x.photo_url)}" alt="${esc(x.nickname||x.full_name||'Jugador')}">`:`<div class="pointLeaderInitials">${esc(pointInitials(x))}</div>`}<div><div class="pointLeaderName">${esc(x.nickname||x.full_name||'Jugador')}</div><div class="pointLeaderSub">Puntos netos individuales</div></div><div class="pointLeaderPts">${Number(x.net_points||0).toLocaleString(undefined,{maximumFractionDigits:1})}</div></div>`).join('')||'<p class="muted">Todavía no hay puntos registrados.</p>'}<button class="btn purple full" data-a="sub" data-s="Estadísticas">VER RANKING COMPLETO</button></section>`}
function pointsRankingPanel(rows){let a=rows||[],med=['🥇','🥈','🥉'];return`<section class="card pointsFullList"><div class="rSectionHead"><h2>🏆 Ranking de Puntos Individuales</h2><span class="periodPill">Puntos netos</span></div><p class="small muted">Puntos obtenidos 50/50 por pareja menos las faltas personales: Chivo −100, Pase con ficha −100 y Multa −30.</p>${a.map((x,i)=>`<div class="pointLeaderRow p${i+1}"><div class="pointLeaderMedal">${i<3?med[i]:'#'+(i+1)}</div>${x.photo_url?`<img class="pointLeaderPhoto" src="${esc(x.photo_url)}" alt="${esc(x.nickname||x.full_name||'Jugador')}">`:`<div class="pointLeaderInitials">${esc(pointInitials(x))}</div>`}<div><div class="pointLeaderName">${esc(x.nickname||x.full_name||'Jugador')}</div><span class="pointsBreakdown"><span class="pointGross">Ganados ${Number(x.gross_points||0).toLocaleString(undefined,{maximumFractionDigits:1})}</span> · <span class="pointPenalty">Penalización −${Number(x.penalty_points||0).toLocaleString(undefined,{maximumFractionDigits:1})}</span><br>🐐 ${x.chivos||0} · 🁣 ${x.pases_con_ficha||0} · ⚠️ ${x.multas||0}</span></div><div class="pointLeaderPts">${Number(x.net_points||0).toLocaleString(undefined,{maximumFractionDigits:1})}</div></div>`).join('')||'<p class="muted">Sin datos todavía.</p>'}<div class="pointsRule">Puntos netos = puntos individuales ganados − penalizaciones del jugador responsable.</div></section>`}
'''
if needle not in s: raise SystemExit('home function anchor missing')
s=s.replace(needle,helpers+needle,1)

# 3) Home PromiseAll + point leaders query
old="let[live,week,chat,q,awardHistory]=await Promise.all([sb.from('live_games_feed').select('*'),sb.rpc('titanes_ranking_v2_compat',{p_from:weekFrom.toISOString(),p_to:now.toISOString(),p_min_games:0}),sb.from('club_chat').select('id,message,created_at,member_id,members(full_name,nickname)').order('created_at',{ascending:false}).limit(5),sb.from('active_challenger_queue').select('*'),sb.from('titan_awards').select('award_type,period_start,period_end,win_pct,games_played,wins,members(full_name,nickname)').order('period_end',{ascending:false}).limit(1)]);window.HOME_AWARDS=awardHistory.data||[];"
new="let[live,week,chat,q,awardHistory,pointLeaders]=await Promise.all([sb.from('live_games_feed').select('*'),sb.rpc('titanes_ranking_v2_compat',{p_from:weekFrom.toISOString(),p_to:now.toISOString(),p_min_games:0}),sb.from('club_chat').select('id,message,created_at,member_id,members(full_name,nickname)').order('created_at',{ascending:false}).limit(5),sb.from('active_challenger_queue').select('*'),sb.from('titan_awards').select('award_type,period_start,period_end,win_pct,games_played,wins,members(full_name,nickname)').order('period_end',{ascending:false}).limit(1),sb.from('player_net_points_v1').select('member_id,full_name,nickname,photo_url,gross_points,penalty_points,net_points,chivos,pases_con_ficha,multas').order('net_points',{ascending:false}).order('gross_points',{ascending:false}).limit(3)]);window.HOME_AWARDS=awardHistory.data||[];"
if old not in s: raise SystemExit('home PromiseAll anchor missing')
s=s.replace(old,new,1)

# 4) Home stats variables + card
old="const total=Number(mine?.games_played||0),wins=Number(mine?.wins||mine?.games_won||0),pct=Number(mine?.win_pct||0),pts=Number(mine?.total_points||0);"
new="const total=Number(mine?.games_played||0),wins=Number(mine?.wins||mine?.games_won||0),losses=Number(mine?.losses||mine?.games_lost||Math.max(0,total-wins)),pct=Number(mine?.win_pct||0),pts=Number(mine?.total_points||0);"
if old not in s: raise SystemExit('home stat variables anchor missing')
s=s.replace(old,new,1)

pattern=re.compile(r'<div class="homeStats"><div class="homeStat"><b>\$\{myPos\?\'\#\'\+myPos:\'—\'\}</b><small>RANKING SEMANAL</small></div><div class="homeStat"><b>\$\{pct\.toFixed\(1\)\}%</b><small>VICTORIAS</small></div><div class="homeStat"><b>\$\{total\}</b><small>PARTIDAS</small></div><div class="homeStat"><b>\$\{pts\.toLocaleString\(\)\}</b><small>PUNTOS</small></div></div>')
replacement='<div class="homeStats homeStatsNew"><div class="homeStat"><b>${myPos?\'#\'+myPos:\'—\'}</b><small>RANKING SEMANAL</small></div><div class="homeStat"><b>${pct.toFixed(1)}%</b><small>AVERAGE</small></div><div class="homeStat homeGamesCard"><small>PARTIDAS</small><div class="homeGameTriplet"><span><b>${wins}</b><small>GANADAS</small></span><span><b>${losses}</b><small>PERDIDAS</small></span><span><b>${total}</b><small>TOTALES</small></span></div></div></div>'
s,n=pattern.subn(replacement,s,count=1)
if n!=1: raise SystemExit(f'homeStats replacement failed: {n}')

# 5) Remove ESTADO GENERAL card, preserve progress card
pat=re.compile(r'<section class="dashPanel"><h2>ESTADO GENERAL</h2>.*?</section><section class="dashPanel"><h2>TU PROGRESO ESTA SEMANA</h2>',re.S)
s,n=pat.subn('<section class="dashPanel"><h2>TU PROGRESO ESTA SEMANA</h2>',s,count=1)
if n!=1: raise SystemExit(f'Estado General removal failed: {n}')

# 6) Insert leader card immediately under Top 10 weekly
old=".join('')||'<p class=\"muted\">Sin datos todavía.</p>'}</section><div class=\"grid2\">"
new=".join('')||'<p class=\"muted\">Sin datos todavía.</p>'}</section>${pointLeadersCard(pointLeaders.data||[])}<div class=\"grid2\">"
if old not in s: raise SystemExit('Top10 insertion anchor missing')
s=s.replace(old,new,1)

# 7) Full points ranking inside Estadísticas
old="async function playerStats(){let now=new Date(),today=new Date(now),day=now.getDay()||7,week=new Date(now),month=new Date(now.getFullYear(),now.getMonth(),1);today.setHours(0,0,0,0);week.setDate(now.getDate()-day+1);week.setHours(0,0,0,0);let[d,w,m,members]=await Promise.all(["
new="async function playerStats(){let now=new Date(),today=new Date(now),day=now.getDay()||7,week=new Date(now),month=new Date(now.getFullYear(),now.getMonth(),1);today.setHours(0,0,0,0);week.setDate(now.getDate()-day+1);week.setHours(0,0,0,0);let[d,w,m,members,net]=await Promise.all(["
if old not in s: raise SystemExit('playerStats destructuring anchor missing')
s=s.replace(old,new,1)
old="sb.from('members').select('id,full_name,nickname,photo_url,login_username').eq('active',true).is('deleted_at',null).order('nickname')]);let maps="
new="sb.from('members').select('id,full_name,nickname,photo_url,login_username').eq('active',true).is('deleted_at',null).order('nickname'),sb.from('player_net_points_v1').select('member_id,full_name,nickname,photo_url,gross_points,penalty_points,net_points,chivos,pases_con_ficha,multas').order('net_points',{ascending:false}).order('gross_points',{ascending:false})]);let netRows=net.data||[],maps="
if old not in s: raise SystemExit('playerStats query anchor missing')
s=s.replace(old,new,1)
old='<p>Ganadas, perdidas, partidas jugadas y puntos de hoy, la semana y el mes.</p></div><input class="field" placeholder="🔎 Buscar por nombre, apodo o usuario"'
new='<p>Ganadas, perdidas, partidas jugadas y puntos de hoy, la semana y el mes.</p></div>${pointsRankingPanel(netRows)}<input class="field" placeholder="🔎 Buscar por nombre, apodo o usuario"'
if old not in s: raise SystemExit('playerStats output anchor missing')
s=s.replace(old,new,1)

s=s.replace('</body></html>',marker+'</body></html>',1)
p.write_text(s,encoding='utf-8')
print('HOME_POINTS_LEADERS_V1 applied successfully',len(s))

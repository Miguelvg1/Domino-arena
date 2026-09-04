// Titanes Dominó · Inicio y Retadores V2
// Top 10 semanal oficial (mínimo 10 PJ), Jugador del Día (mínimo 3 PJ) y cola global sin mesa.
import{createClient}from'https://esm.sh/@supabase/supabase-js@2.57.4';
const sb=createClient('https://hvpyngkqtqzvmweavego.supabase.co','sb_publishable_fZbTJCeuM8otLDnnoxRc9w_OGdZIXhX');
let busyTop=false,busyDay=false;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function localDayStart(){let d=new Date();d.setHours(0,0,0,0);return d}
async function fixTop10(){
 const head=[...document.querySelectorAll('h2')].find(x=>x.textContent.trim().toUpperCase()==='TOP 10 SEMANAL');
 if(!head||busyTop||head.parentElement?.dataset.officialTop==='1')return;
 busyTop=true;
 try{
  const now=new Date(),day=now.getDay()||7,from=new Date(now);from.setDate(now.getDate()-day+1);from.setHours(0,0,0,0);
  const r=await sb.rpc('titanes_ranking_v2_compat',{p_from:from.toISOString(),p_to:now.toISOString(),p_min_games:10});
  if(r.error)throw r.error;
  const rows=(r.data||[]).filter(x=>x.eligible).slice(0,10),panel=head.parentElement;
  panel.dataset.officialTop='1';
  panel.innerHTML=`<div class="row"><h2 class="grow">TOP 10 SEMANAL</h2><span class="statPill">mín. 10 PJ</span></div>${rows.map((x,i)=>`<div class="rivalListItem ${i<3?'top'+(i+1):''}"><b style="width:24px">${i+1}</b><div class="grow"><b>${esc(x.player_name)}</b></div><strong>${Number(x.win_pct||0).toFixed(1)}%</strong><span class="small muted">${x.games_played||0} PJ</span></div>`).join('')||'<p class="muted">Todavía no hay jugadores con 10 partidas esta semana.</p>'}`;
 }catch(e){console.warn('Top 10 oficial',e)}finally{busyTop=false}
}
async function playerOfDay(){
 const welcome=document.querySelector('.appWelcome');
 if(!welcome||busyDay||document.querySelector('.playerDayCard'))return;
 busyDay=true;
 try{
  const now=new Date(),r=await sb.rpc('titanes_ranking_v2_compat',{p_from:localDayStart().toISOString(),p_to:now.toISOString(),p_min_games:3});
  if(r.error)throw r.error;
  // El Jugador del Día usa exactamente el mismo motor/criterio oficial del ranking semanal y mensual,
  // cambiando únicamente el período a hoy (00:00 -> ahora) y la elegibilidad mínima a 3 partidas.
  const x=(r.data||[]).filter(v=>v.eligible)[0];
  const card=document.createElement('section');card.className='playerDayCard';
  if(!x){
   card.innerHTML=`<div class="playerDayCrown">👑</div><div class="playerDayMain"><small>JUGADOR DEL DÍA · MÍN. 3 PJ</small><h2>Aún por definir</h2><div class="playerDayPending">Se aplican los mismos criterios del ranking oficial semanal y mensual, pero contando solamente lo ocurrido hoy. El jugador debe completar al menos 3 partidas.</div></div>`;
  }else{
   card.innerHTML=`<div class="playerDayCrown">👑</div><div class="playerDayMain"><div class="playerDayTitle"><small>JUGADOR DEL DÍA</small><span class="statPill">mín. 3 PJ</span></div><h2>${esc(x.player_name)}</h2><div class="playerDayStats"><span><b>${x.games_won||0}</b>Ganadas</span><span><b>${x.games_lost||0}</b>Perdidas</span><span><b>${x.games_played||0}</b>Partidas</span><span><b>${Number(x.win_pct||0).toFixed(1)}%</b>Average</span><span><b>${Number(x.total_points||0).toLocaleString()}</b>Puntos</span></div><div class="playerDayRule">Mismo criterio oficial de semana/mes · cálculo exclusivo de hoy</div></div>`;
  }
  welcome.insertAdjacentElement('afterend',card);
 }catch(e){console.warn('Jugador del día',e)}finally{busyDay=false}
}
function globalTurns(){
 const h=[...document.querySelectorAll('.hero h1')].find(x=>x.textContent.includes('¿Quién quiere mesa?'));
 if(!h)return;
 h.textContent='¿Quién tiene el próximo turno?';
 const p=h.parentElement?.querySelector('p');if(p)p.textContent='Una sola fila para el club: la pareja #1 entra en la primera de las dos mesas que termine.';
 const qt=document.querySelector('#qt');
 if(qt){qt.value='';qt.style.display='none';if(!document.querySelector('.globalTurnInfo')){let d=document.createElement('div');d.className='globalTurnInfo';d.innerHTML='<b>🔄 TURNO GLOBAL</b><span>Sin elegir mesa. Cuando termine cualquiera de las 2 mesas, juega la pareja que esté #1.</span>';qt.insertAdjacentElement('beforebegin',d)}}
 const title=[...document.querySelectorAll('.card h2')].find(x=>x.textContent.includes('Cola actual'));if(title)title.textContent='👥 Orden global de retadores';
}
function addStyles(){if(document.querySelector('#homeTurnosV2Style'))return;let s=document.createElement('style');s.id='homeTurnosV2Style';s.textContent=`.playerDayCard{display:flex;gap:14px;align-items:center;border:1px solid #ffcc33;background:radial-gradient(circle at 15% 10%,#5a3900,#0a1019 55%);border-radius:20px;padding:14px;margin:10px 0;box-shadow:0 0 28px #ffcc332b,0 12px 32px #0008}.playerDayCrown{font-size:48px;filter:drop-shadow(0 0 10px #ffcc33)}.playerDayMain{min-width:0;flex:1}.playerDayMain small{color:#ffcc33;font-weight:1000;letter-spacing:.7px}.playerDayMain h2{margin:3px 0 8px;font-size:23px}.playerDayTitle{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.playerDayStats{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}.playerDayStats span{background:#040a12;border:1px solid #26354d;border-radius:11px;padding:7px 5px;text-align:center;font-size:9px;color:#8795aa}.playerDayStats b{display:block;color:#fff;font-size:15px}.playerDayRule,.playerDayPending{margin-top:8px;font-size:10px;color:#aeb8c8}.globalTurnInfo{display:flex;flex-direction:column;gap:4px;border:1px solid #58ff18;background:linear-gradient(135deg,#0b2a16,#08131d);border-radius:14px;padding:12px;margin:8px 0;color:#dfffd5}.globalTurnInfo b{color:#58ff18}.globalTurnInfo span{font-size:12px}@media(max-width:520px){.playerDayCard{align-items:flex-start}.playerDayCrown{font-size:38px}.playerDayStats{grid-template-columns:repeat(3,1fr)}.playerDayStats span:nth-child(4),.playerDayStats span:nth-child(5){grid-column:auto}}`;document.head.appendChild(s)}
async function apply(){addStyles();globalTurns();await Promise.allSettled([fixTop10(),playerOfDay()])}
const mo=new MutationObserver(()=>{clearTimeout(window.__htv2);window.__htv2=setTimeout(apply,80)});mo.observe(document.documentElement,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);else apply();

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const sb=createClient('https://hvpyngkqtqzvmweavego.supabase.co','sb_publishable_fZbTJCeuM8otLDnnoxRc9w_OGdZIXhX');
const MODES={
 strict_order:['Turno Global Estricto','El sistema forma parejas por orden: 1+2, 3+4, 5+6.'],
 preformed_pairs:['Parejas por orden','Se registran dos jugadores juntos y las parejas entran por orden.'],
 free_partner:['Pareja libre','Se registra la pareja elegida y entra respetando el orden global.'],
 random_pairs:['Sorteo automático','Los jugadores entran individualmente y el sistema sortea las parejas.'],
 king_table:['Rey de la Mesa','Los jugadores entran individualmente; los ganadores permanecen y entra la próxima pareja.']
};
let members=[],queue=[],status=null,busy=false,lastRoot=null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nm=x=>x?.nickname||x?.full_name||'Jugador';

function isTurnsPage(){
 const root=document.querySelector('.wrap');
 if(!root)return false;
 const txt=(root.textContent||'').toUpperCase();
 return txt.includes('RETADORES')&&(txt.includes('TURNO')||txt.includes('MESA'));
}
function modeNeedsPair(){return ['preformed_pairs','free_partner'].includes(status?.mode)}

async function loadData(){
 const [st,mm,qq]=await Promise.all([
   sb.rpc('turn_system_status'),
   sb.from('members').select('id,full_name,nickname,photo_url').eq('active',true).eq('access_status','activo').is('deleted_at',null).eq('is_guest',false).order('nickname'),
   sb.from('turn_waitlist_live').select('*').order('display_position')
 ]);
 if(st.error)throw st.error;
 status=st.data; members=mm.data||[]; queue=qq.data||[];
}

function memberOptions(selected=''){
 return `<option value="">Selecciona miembro</option>${members.map(m=>`<option value="${m.id}" ${m.id===selected?'selected':''}>${esc(nm(m))}</option>`).join('')}`;
}
function participantBox(prefix,label){
 return `<div class="tsPersonBox"><b>${label}</b><select id="${prefix}Member" class="field">${memberOptions()}</select><div class="tsOr">o</div><input id="${prefix}Guest" class="field" placeholder="Nombre del invitado"></div>`;
}
function queueBlocks(){
 if(!queue.length)return '<div class="tsEmpty">No hay jugadores esperando.</div>';
 if(status.mode==='random_pairs')return queue.map((q,i)=>row(q,i+1)).join('');
 if(modeNeedsPair()){
   const groups=[]; const map=new Map();
   for(const q of queue){const k=q.pair_token||q.id;if(!map.has(k)){map.set(k,[]);groups.push(map.get(k))}map.get(k).push(q)}
   return groups.map((g,i)=>`<div class="tsPair"><div class="tsPairTitle">Pareja #${i+1}${i===0?' · PRÓXIMOS':''}</div>${g.map((q,j)=>row(q,j+1,false)).join('')}</div>`).join('');
 }
 let out='';
 for(let i=0;i<queue.length;i+=2){
   const g=queue.slice(i,i+2);
   out+=`<div class="tsPair"><div class="tsPairTitle">${i===0?'🔥 PRÓXIMA PAREJA':'Pareja #'+(Math.floor(i/2)+1)}</div>${g.map((q,j)=>row(q,i+j+1,false)).join('')}${g.length===1?'<div class="tsWaitingMate">Esperando al siguiente jugador…</div>':''}</div>`;
 }
 return out;
}
function row(q,pos,showPos=true){
 const photo=q.photo_url?`<img src="${esc(q.photo_url)}" class="tsAvatar">`:`<div class="tsAvatar tsInitial">${esc((q.nickname||q.full_name||'?')[0]?.toUpperCase()||'?')}</div>`;
 return `<div class="tsRow">${showPos?`<b class="tsPos">#${pos}</b>`:''}${photo}<div class="grow"><b>${esc(q.nickname||q.full_name)}</b><div class="small muted">${q.is_guest?'🎟️ INVITADO · sin estadísticas':'Miembro del club'}</div></div><button class="tsRemove" data-ts-remove="${q.id}" title="Quitar">✕</button></div>`;
}

function render(){
 const root=document.querySelector('.wrap');
 if(!root||!isTurnsPage())return;
 lastRoot=root;
 const [modeTitle,modeDesc]=MODES[status?.mode]||MODES.strict_order;
 const addForm=modeNeedsPair()
   ? `<div class="card tsAdd"><h2>➕ Agregar pareja al turno</h2><p class="muted">Cualquier miembro con celular puede registrar a los jugadores.</p><div class="grid2 tsGrid">${participantBox('a','Jugador 1')}${participantBox('b','Jugador 2')}</div><button class="btn green full" id="tsAddPair">⚔️ AGREGAR PAREJA</button></div>`
   : `<div class="card tsAdd"><h2>⚔️ Poner jugador en turno</h2><p class="muted">No necesita celular. Cualquier miembro puede agregarlo.</p><select id="tsMember" class="field">${memberOptions()}</select><button class="btn green full" id="tsAddMember">AGREGAR MIEMBRO</button><div class="tsDivider"><span>INVITADO</span></div><input id="tsGuest" class="field" placeholder="Nombre o apodo del invitado"><button class="btn dark full" id="tsAddGuest">🎟️ AGREGAR INVITADO</button></div>`;
 const admin=status?.is_admin?`<div class="card tsAdmin"><h2>🛡️ Modalidad de turnos</h2><p class="muted">Solo Presidencia cambia la modalidad. Para cambiarla, la fila debe estar vacía.</p><div class="tsModes">${Object.entries(MODES).map(([k,v])=>`<button class="tsMode ${status.mode===k?'on':''}" data-ts-mode="${k}"><b>${esc(v[0])}</b><small>${esc(v[1])}</small></button>`).join('')}</div></div>`:'';
 root.innerHTML=`<style>
 .tsHero{background:linear-gradient(135deg,#112d4e,#4c1d95 60%,#8b2d12);border:1px solid #ffffff22;border-radius:24px;padding:20px;box-shadow:0 16px 40px #0005}.tsHero h1{margin:5px 0;font-size:29px}.tsRule{margin-top:12px;padding:11px;border:1px solid #f7c94866;background:#1e1a08;border-radius:14px;color:#fde68a;font-weight:800}.tsStatus{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.tsPill{border:1px solid #ffffff25;border-radius:999px;padding:6px 10px;font-size:11px;font-weight:900}.tsAdd h2,.tsAdmin h2{margin-top:0}.tsDivider{display:flex;align-items:center;gap:8px;margin:10px 0;color:#9fb0c4;font-size:11px;font-weight:900}.tsDivider:before,.tsDivider:after{content:'';height:1px;background:#294765;flex:1}.tsPair{border:1px solid #38516d;background:#091827;border-radius:16px;padding:8px;margin:9px 0}.tsPair:first-child{border-color:#f7c948;box-shadow:0 0 22px #f7c94818}.tsPairTitle{font-size:11px;font-weight:1000;color:#f7c948;padding:4px 6px}.tsRow{display:flex;gap:9px;align-items:center;padding:8px 4px;border-top:1px solid #ffffff10}.tsRow:first-of-type{border-top:0}.tsAvatar{width:42px;height:42px;border-radius:50%;object-fit:cover;border:2px solid #526f8d;background:#13283e}.tsInitial{display:grid;place-items:center;font-weight:1000}.tsPos{width:28px;color:#f7c948}.tsRemove{width:34px;height:34px;border:0;border-radius:10px;background:#3a1517;color:#fecaca;font-weight:1000}.tsWaitingMate{padding:9px;color:#9fb0c4;font-size:12px;text-align:center;border-top:1px dashed #38516d}.tsEmpty{padding:22px;text-align:center;color:#9fb0c4;border:1px dashed #45637e;border-radius:14px}.tsModes{display:grid;grid-template-columns:1fr;gap:7px}.tsMode{text-align:left;border:1px solid #38516d;background:#091827;color:white;border-radius:14px;padding:11px}.tsMode.on{border-color:#f7c948;background:#2a2108}.tsMode b,.tsMode small{display:block}.tsMode small{color:#9fb0c4;margin-top:3px}.tsOr{text-align:center;font-size:10px;color:#9fb0c4;margin:-2px 0}.tsPersonBox{min-width:0}.tsGrid{align-items:start}@media(max-width:520px){.tsGrid{grid-template-columns:1fr}.tsHero h1{font-size:25px}}
 </style><div class="tsHero"><div class="badge">⚔️ TURNO GLOBAL TITANES</div><h1>El turno manda la mesa</h1><p>${esc(modeTitle)} · ${esc(modeDesc)}</p><div class="tsStatus"><span class="tsPill">👥 ${status.waiting_count||queue.length} esperando</span><span class="tsPill">🤖 Mesas automáticas</span><span class="tsPill">🎟️ Invitados permitidos</span></div><div class="tsRule">Nadie entra a jugar fuera del sistema de turno. Cuando una mesa termina, los ganadores se quedan y Titanes coloca automáticamente a los próximos retadores.</div></div>${addForm}<div class="card"><div class="row"><h2 class="grow">👥 Fila global</h2><button class="btn dark" id="tsRefresh">↻</button></div>${queueBlocks()}</div>${admin}`;
 bind();
}

async function rpc(name,args){
 if(busy)return; busy=true;
 try{
   const r=await sb.rpc(name,args||{}); if(r.error)throw r.error;
   const started=Number(r.data?.games_started||0);
   if(started>0)alert(`🎲 ${started===1?'Mesa armada':'Mesas armadas'} automáticamente. Los jugadores ya fueron colocados.`);
   await loadData(); render();
 }catch(e){alert(e.message||String(e))}finally{busy=false}
}
function pick(prefix){
 const guest=document.getElementById(prefix+'Guest')?.value.trim()||'';
 const member=document.getElementById(prefix+'Member')?.value||null;
 return {member:guest?null:member,guest:guest||null};
}
function bind(){
 document.getElementById('tsAddMember')?.addEventListener('click',()=>{const id=document.getElementById('tsMember')?.value;if(!id)return alert('Selecciona el miembro.');rpc('add_turn_participant',{p_member_id:id,p_guest_name:null})});
 document.getElementById('tsAddGuest')?.addEventListener('click',()=>{const n=document.getElementById('tsGuest')?.value.trim();if(!n)return alert('Escribe el nombre del invitado.');rpc('add_turn_participant',{p_member_id:null,p_guest_name:n})});
 document.getElementById('tsAddPair')?.addEventListener('click',()=>{const a=pick('a'),b=pick('b');if((!a.member&&!a.guest)||(!b.member&&!b.guest))return alert('Completa los dos jugadores.');rpc('add_turn_pair',{p_first_member_id:a.member,p_first_guest_name:a.guest,p_second_member_id:b.member,p_second_guest_name:b.guest})});
 document.querySelectorAll('[data-ts-remove]').forEach(b=>b.addEventListener('click',()=>rpc('remove_turn_entry',{p_entry_id:b.dataset.tsRemove})));
 document.querySelectorAll('[data-ts-mode]').forEach(b=>b.addEventListener('click',()=>status.mode===b.dataset.tsMode?null:rpc('set_turn_system_mode',{p_mode:b.dataset.tsMode})));
 document.getElementById('tsRefresh')?.addEventListener('click',async()=>{await loadData();render()});
}

function patchNewGameCard(){
 const cards=[...document.querySelectorAll('.card')];
 const c=cards.find(x=>(x.querySelector('h2')?.textContent||'').includes('Nueva partida'));
 if(!c||c.dataset.turnPatched)return;
 c.dataset.turnPatched='1';
 c.innerHTML=`<h2>⚔️ Partidas por Turno Global</h2><div class="notice"><b>Las mesas ahora se arman automáticamente.</b><br>Agrega los jugadores en <b>Turnos</b>. Nadie puede iniciar una partida manualmente.</div><p class="muted small">Cuando haya jugadores suficientes, Titanes toma la mesa disponible y coloca los cuatro jugadores. Al terminar, conserva a los ganadores y trae a los próximos retadores.</p>`;
}

let timer=null;
async function sync(){
 try{
   patchNewGameCard();
   if(!isTurnsPage())return;
   await loadData();
   if(isTurnsPage())render();
 }catch(e){console.warn('Turno Global:',e)}
}
const mo=new MutationObserver(()=>{patchNewGameCard(); if(isTurnsPage()&&!document.querySelector('.tsHero'))sync()});
mo.observe(document.documentElement,{childList:true,subtree:true});
setTimeout(sync,700);
timer=setInterval(async()=>{if(isTurnsPage()){try{await loadData();if(isTurnsPage())render()}catch{}}else patchNewGameCard()},4000);

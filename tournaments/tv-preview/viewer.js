/* Public tournament spectator screen. Read-only: renders sanitized snapshot data only. */
(function(){
'use strict';
const $=id=>document.getElementById(id),el=(tag,text)=>{const n=document.createElement(tag);n.textContent=String(text);return n;};
function faceText(name){return String(name||'?').split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase();}
function addFaces(side,players){const row=el('div');row.className='faces';for(const p of players||[]){let face;if(p.photo){face=el('img');face.src=p.photo;face.alt=p.name;face.referrerPolicy='no-referrer';}else{face=el('span',faceText(p.name));face.className='face-fallback';}row.append(face);}if(row.childNodes.length)side.append(row);}
let lastUpdate='',lastCount=1,seenNoticeIds=null,voiceEnabled=true;
function fitGrid(count){
 const grid=$('matches'),n=Math.max(1,count),box=grid.getBoundingClientRect(),width=box.width||innerWidth,height=box.height||innerHeight*.65;
 const columns=n===1?1:n<=4?2:n<=6?3:n<=16?4:6,rows=Math.ceil(n/columns);
 const cellWidth=width/columns,cellHeight=height/rows;
 grid.style.setProperty('--cols',columns);grid.style.setProperty('--rows',rows);
 grid.style.setProperty('--score',Math.max(22,Math.min(88,cellWidth*.22,cellHeight*.30))+'px');
 grid.style.setProperty('--team',Math.max(10,Math.min(23,cellWidth*.065,cellHeight*.105))+'px');
 grid.style.setProperty('--table',Math.max(10,Math.min(19,cellWidth*.055,cellHeight*.085))+'px');
 grid.style.setProperty('--face-size',Math.max(12,Math.min(34,cellWidth*.10,cellHeight*.16))+'px');
 grid.dataset.count=String(count);
 grid.dataset.density=n>=13?'dense':n>=5?'compact':n>1?'multi':'single';
 lastCount=n;
}
function announceNotice(notice){
 const message=typeof notice==='string'?notice:notice.label,banner=$('liza-notice');banner.textContent=message;banner.hidden=false;
 if(Number.isInteger(notice?.table)){const card=$('matches').querySelector('[data-table="'+notice.table+'"]');if(card){card.classList.add('score-change');setTimeout(()=>card.classList.remove('score-change'),3600);}}
 if(!voiceEnabled||!('speechSynthesis' in window)||!window.SpeechSynthesisUtterance)return;
 try{const utterance=new SpeechSynthesisUtterance(message);utterance.lang='es-DO';utterance.rate=.96;const spanish=speechSynthesis.getVoices().find(v=>v.lang&&v.lang.toLowerCase().startsWith('es'));if(spanish)utterance.voice=spanish;utterance.onerror=event=>{if(event.error==='not-allowed'){voiceEnabled=false;const button=$('voice-toggle');button.setAttribute('aria-pressed','false');button.textContent='⚠ Pulsa OK para habilitar voz';}};speechSynthesis.speak(utterance);}catch(_){/* El aviso visual sigue disponible si la TV no ofrece voz. */}
}
function consumeNotices(events){
 const notices=Array.isArray(events)?events:[];
 if(seenNoticeIds===null){seenNoticeIds=new Set(notices.map(e=>e.id));if(notices.length)announceNotice(notices[notices.length-1]);return;}
 for(const notice of notices){if(!notice.id||seenNoticeIds.has(notice.id))continue;seenNoticeIds.add(notice.id);announceNotice(notice);}
 if(seenNoticeIds.size>100)seenNoticeIds=new Set(notices.map(e=>e.id));
}
function render(raw){
 let s;try{s=window.TitanesTvSnapshot.validate(raw);}catch(e){$('status').textContent='Datos inválidos: '+e.message;return;}
 if(s.updatedAt&&lastUpdate&&s.updatedAt<lastUpdate)return;lastUpdate=s.updatedAt;
 $('title').textContent='🏆 '+s.tournament;
 $('status').textContent='● '+(s.updatedAt?'Actualizado '+new Date(s.updatedAt).toLocaleTimeString('es-DO',{hour:'2-digit',minute:'2-digit'}):'Esperando marcador')+' · SOLO LECTURA';
 const grid=$('matches');grid.replaceChildren();
 const strip=$('leader-strip');if(strip){const parts=[];if(s.leaders.mvp)parts.push('👑 MVP: '+s.leaders.mvp.name+' · '+Number(s.leaders.mvp.average).toFixed(2)+'%');if(s.leaders.points)parts.push('🎯 Más puntos: '+s.leaders.points.name+' · '+Number(s.leaders.points.value).toFixed(1));strip.textContent=parts.join('   |   ')||'TITANES DOMINÓ · TORNEO EN VIVO';}
 for(const m of s.matches){
  const card=el('article');card.dataset.table=String(m.table);const title=el('div',(m.round||'Torneo')+' · MESA '+m.table);title.className='table-title';card.append(title);
  const teams=el('div');teams.className='teams';
  for(const [index,name,points,other] of [[0,m.teamA,m.scoreA,m.scoreB],[1,m.teamB,m.scoreB,m.scoreA]]){
   const side=el('div');side.className='team team-'+(index?'b':'a')+(points>other?' leading':'');
   addFaces(side,index?m.teamBPlayers:m.teamAPlayers);const pair=el('div',name);pair.className='team-name';side.append(pair);
   const score=el('div',points);score.className='score';side.append(score);
   const lead=el('div',points>other?'VA GANANDO':points===other?'EMPATE':'');lead.className='lead';side.append(lead);teams.append(side);
  }
  card.append(teams,el('div','Meta: 200 puntos'));const target=card.lastChild;target.className='target';grid.append(card);
 }
 if(!grid.childNodes.length){const empty=el('div','No hay encuentros activos en este momento.');empty.className='empty';grid.append(empty);}
 grid.dataset.count=String(s.matches.length);fitGrid(s.matches.length);
 $('bracket').replaceChildren(...s.bracket.map(b=>el('li',typeof b==='string'?b:b.label)));consumeNotices(s.events);
}
$('back-tv').addEventListener('click',()=>{window.location.href=new URL('/index.html',window.location.origin).href;});
const voiceButton=$('voice-toggle');
if(!('speechSynthesis' in window)||!window.SpeechSynthesisUtterance){voiceEnabled=false;voiceButton.disabled=true;voiceButton.setAttribute('aria-pressed','false');voiceButton.title='Esta TV no ofrece voz del navegador; las notificaciones seguirán apareciendo en pantalla.';voiceButton.textContent='Voz no disponible';}
else{voiceButton.setAttribute('aria-pressed','true');voiceButton.textContent='🔊 Voz automática activa';}
voiceButton.addEventListener('click',()=>{voiceEnabled=!voiceEnabled;voiceButton.setAttribute('aria-pressed',String(voiceEnabled));voiceButton.textContent=voiceEnabled?'🔊 Voz activada':'🔈 Voz desactivada';if(!voiceEnabled&&'speechSynthesis' in window)speechSynthesis.cancel();});
window.addEventListener('resize',()=>fitGrid(lastCount));
/* Remote mode requires operator-configured same-origin HTTPS endpoint.
   The backend must enforce tournament access and return {revision, snapshot}. */
const params=new URLSearchParams(window.location.search),remotePath=params.get('endpoint');
if(remotePath){
 const endpoint=new URL(remotePath,window.location.href);
 const allowedOrigin='https://hvpyngkqtqzvmweavego.supabase.co';
 const safe=endpoint.origin===allowedOrigin&&endpoint.protocol==='https:'&&endpoint.username===''&&endpoint.password===''&&endpoint.search===''&&endpoint.hash===''&&/^\/functions\/v1\/tournament-tv-sync\/[A-Za-z0-9_-]{16,64}$/.test(endpoint.pathname);
 if(!safe){$('status').textContent='Enlace de torneo no válido. Vuelve a copiarlo desde la app.';}
 else{
  const client=window.TitanesRemoteTvClient.create({
   fetchSnapshot:async()=>{
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8000);
    try{const response=await fetch(endpoint.href,{method:'GET',credentials:'omit',cache:'no-store',signal:controller.signal,headers:{Accept:'application/json'}});if(!response.ok)throw Error('HTTP '+response.status);return await response.json();}finally{clearTimeout(timeout);}
   },onSnapshot:render,onStatus:status=>{$('status').textContent=status==='offline'?'Sin conexión · conservando el marcador':'Marcador remoto actualizado · SOLO LECTURA';},intervalMs:5000
  }).start();window.addEventListener('pagehide',()=>client.close());
 }
}else{
 const transport=window.TitanesLocalPreviewSync.create(render),initial=transport.read();if(initial)render(initial);
 window.addEventListener('pagehide',()=>transport.close());
}
})();
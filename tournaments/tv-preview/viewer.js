/* Public tournament spectator screen. Read-only: renders sanitized snapshot data only. */
(function(){
'use strict';
const $=id=>document.getElementById(id),el=(tag,text)=>{const n=document.createElement(tag);n.textContent=String(text);return n;};
let lastUpdate='',lastCount=1,seenNoticeIds=null,voiceEnabled=false;
function fitGrid(count){
 const grid=$('matches'),n=Math.max(1,count),box=grid.getBoundingClientRect(),width=box.width||innerWidth,height=box.height||innerHeight*.65;
 const columns=n===1?1:n<=4?2:n<=6?3:n<=16?4:6,rows=Math.ceil(n/columns);
 grid.style.setProperty('--cols',columns);grid.style.setProperty('--rows',rows);
 grid.style.setProperty('--score',Math.max(24,Math.min(142,width/columns*.27,height/rows*.36))+'px');
 lastCount=n;
}
function announceNotice(notice){
 const banner=$('liza-notice');banner.textContent=notice;banner.hidden=false;
 if(!voiceEnabled||!('speechSynthesis' in window)||!window.SpeechSynthesisUtterance)return;
 try{const utterance=new SpeechSynthesisUtterance(notice);utterance.lang='es-DO';utterance.rate=.96;const spanish=speechSynthesis.getVoices().find(v=>v.lang&&v.lang.toLowerCase().startsWith('es'));if(spanish)utterance.voice=spanish;speechSynthesis.speak(utterance);}catch(_){/* El aviso visual sigue disponible si la TV no ofrece voz. */}
}
function consumeNotices(events){
 const notices=Array.isArray(events)?events:[];
 if(seenNoticeIds===null){seenNoticeIds=new Set(notices.map(e=>e.id));if(notices.length)announceNotice(notices[notices.length-1].label);return;}
 for(const notice of notices){if(!notice.id||seenNoticeIds.has(notice.id))continue;seenNoticeIds.add(notice.id);announceNotice(notice.label);}
 if(seenNoticeIds.size>100)seenNoticeIds=new Set(notices.map(e=>e.id));
}
function render(raw){
 let s;try{s=window.TitanesTvSnapshot.validate(raw);}catch(e){$('status').textContent='Datos inválidos: '+e.message;return;}
 if(s.updatedAt&&lastUpdate&&s.updatedAt<lastUpdate)return;lastUpdate=s.updatedAt;consumeNotices(s.events);
 $('title').textContent='🏆 '+s.tournament;
 $('status').textContent='● '+(s.updatedAt?'Actualizado '+new Date(s.updatedAt).toLocaleTimeString('es-DO',{hour:'2-digit',minute:'2-digit'}):'Esperando marcador')+' · SOLO LECTURA';
 const grid=$('matches');grid.replaceChildren();
 for(const m of s.matches){
  const card=el('article');const title=el('div',(m.round||'Torneo')+' · MESA '+m.table);title.className='table-title';card.append(title);
  const teams=el('div');teams.className='teams';
  for(const [index,name,points,other] of [[0,m.teamA,m.scoreA,m.scoreB],[1,m.teamB,m.scoreB,m.scoreA]]){
   const side=el('div');side.className='team team-'+(index?'b':'a')+(points>other?' leading':'');
   const pair=el('div',name);pair.className='team-name';side.append(pair);
   const score=el('div',points);score.className='score';side.append(score);
   const lead=el('div',points>other?'VA GANANDO':points===other?'EMPATE':'');lead.className='lead';side.append(lead);teams.append(side);
  }
  card.append(teams,el('div','Meta: 200 puntos'));const target=card.lastChild;target.className='target';grid.append(card);
 }
 if(!grid.childNodes.length)grid.append(el('div','No hay encuentros activos en este momento.')).lastChild.className='empty';
 grid.dataset.count=String(s.matches.length);fitGrid(s.matches.length);
 $('bracket').replaceChildren(...s.bracket.map(b=>el('li',typeof b==='string'?b:b.label)));
}
const voiceButton=$('voice-toggle');
if(!('speechSynthesis' in window)||!window.SpeechSynthesisUtterance){voiceButton.disabled=true;voiceButton.title='Esta TV no ofrece voz del navegador; las notificaciones seguirán apareciendo en pantalla.';voiceButton.textContent='Voz no disponible';}
voiceButton.addEventListener('click',()=>{voiceEnabled=!voiceEnabled;voiceButton.setAttribute('aria-pressed',String(voiceEnabled));voiceButton.textContent=voiceEnabled?'🔊 Voz activada':'🔈 Activar voz';if(!voiceEnabled&&'speechSynthesis' in window)speechSynthesis.cancel();});
window.addEventListener('resize',()=>fitGrid(lastCount));
/* Remote mode requires operator-configured same-origin HTTPS endpoint.
   The backend must enforce tournament access and return {revision, snapshot}. */
const params=new URLSearchParams(window.location.search),remotePath=params.get('endpoint');
if(remotePath){
 const endpoint=new URL(remotePath,window.location.href);
 const safe=endpoint.origin===window.location.origin&&endpoint.protocol==='https:'&&endpoint.username===''&&endpoint.password===''&&endpoint.search===''&&endpoint.hash===''&&endpoint.pathname.startsWith('/api/tournaments/');
 if(!safe){$('status').textContent='Endpoint remoto rechazado: usa HTTPS y /api/tournaments/ en el mismo dominio.';}
 else{
  const client=window.TitanesRemoteTvClient.create({
   fetchSnapshot:async()=>{
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8000);
    try{const response=await fetch(endpoint.href,{method:'GET',credentials:'same-origin',cache:'no-store',signal:controller.signal,headers:{Accept:'application/json'}});if(!response.ok)throw Error('HTTP '+response.status);return await response.json();}finally{clearTimeout(timeout);}
   },onSnapshot:render,onStatus:status=>{$('status').textContent=status==='offline'?'Sin conexión · conservando el marcador':'Marcador remoto actualizado · SOLO LECTURA';},intervalMs:10000
  }).start();window.addEventListener('pagehide',()=>client.close());
 }
}else{
 const transport=window.TitanesLocalPreviewSync.create(render),initial=transport.read();if(initial)render(initial);
 window.addEventListener('pagehide',()=>transport.close());
}
})();
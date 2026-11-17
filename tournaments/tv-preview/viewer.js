/* Same-origin preview only. No credentials or production network requests. */
(function(){'use strict';const $=id=>document.getElementById(id);const el=(tag,text)=>{const n=document.createElement(tag);n.textContent=String(text);return n;};let lastUpdate='';
function render(raw){let s;try{s=window.TitanesTvSnapshot.validate(raw);}catch(e){$('status').textContent='Datos inválidos: '+e.message;return;}
if(s.updatedAt&&lastUpdate&&s.updatedAt<lastUpdate)return;lastUpdate=s.updatedAt;
$('title').textContent='🏆 '+s.tournament;$('status').textContent='Vista local · '+(s.updatedAt||'sin fecha');
$('matches').replaceChildren(...s.matches.map(m=>{const card=el('article','');card.append(el('small',m.round+' · Mesa '+m.table));const teams=el('div','');teams.className='teams';for(const [name,points] of [[m.teamA,m.scoreA],[m.teamB,m.scoreB]]){const row=el('div','');row.append(el('p',name),el('div',points));row.lastChild.className='score';teams.append(row);}card.append(teams);return card;}));
$('bracket').replaceChildren(...s.bracket.map(b=>el('li',typeof b==='string'?b:b.label)));
}
/* Remote mode requires an operator-configured same-origin HTTPS endpoint.
   The endpoint must enforce access and return {revision, snapshot}; no secrets in URL. */
const params=new URLSearchParams(window.location.search);
const remotePath=params.get('endpoint');
if(remotePath){
 const endpoint=new URL(remotePath,window.location.href);
 const safe=endpoint.origin===window.location.origin&&endpoint.protocol==='https:'&&endpoint.username===''&&endpoint.password===''&&endpoint.search===''&&endpoint.hash===''&&endpoint.pathname.startsWith('/api/tournaments/');
 if(!safe){$('status').textContent='Endpoint remoto rechazado: usa HTTPS y /api/tournaments/ en el mismo dominio.';}
 else{
  const client=window.TitanesRemoteTvClient.create({
   fetchSnapshot:async()=>{
    const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),8000);
    try{const response=await fetch(endpoint.href,{method:'GET',credentials:'same-origin',cache:'no-store',signal:controller.signal,headers:{Accept:'application/json'}});if(!response.ok)throw Error('HTTP '+response.status);return await response.json();}finally{clearTimeout(timeout);}
   },
   onSnapshot:render,
   onStatus:status=>{if(status==='offline')$('status').textContent='Sin conexión · conservando último marcador';else $('status').textContent='Marcador remoto actualizado';},
   intervalMs:10000
  }).start();
  window.addEventListener('pagehide',()=>client.close());
 }
}else{
 const transport=window.TitanesLocalPreviewSync.create(render);
 const initial=transport.read();if(initial)render(initial);
 window.addEventListener('pagehide',()=>transport.close());
}
})();
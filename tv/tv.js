/* Public spectator board. Only renders sanitized snapshot data; never writes to the app or database. */
(function(){
'use strict';
const DEMO={schemaVersion:1,updatedAt:new Date().toISOString(),matches:[
 {table:1,tableName:'Mesa 1',teamA:'Pareja A · Jugador 1 / Jugador 2',teamB:'Pareja B · Jugador 3 / Jugador 4',scoreA:165,scoreB:130,target:200,status:'activa'},
 {table:2,tableName:'Mesa 2',teamA:'Pareja C · Jugador 5 / Jugador 6',teamB:'Pareja D · Jugador 7 / Jugador 8',scoreA:110,scoreB:110,target:200,status:'activa'}
]};
const el=id=>document.getElementById(id);
const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n;};
const config=window.TITANES_TV_CONFIG||{};
const endpoint=typeof config.snapshotUrl==='string'?config.snapshotUrl:'';
let revision=-1, timer=null, busy=false;
function validate(record){
 const snapshot=record&&record.snapshot?record.snapshot:record;
 if(!snapshot||snapshot.schemaVersion!==1||!Array.isArray(snapshot.matches))throw Error('Formato de marcador no compatible');
 const safeText=(v,max)=>typeof v==='string'?v.slice(0,max):'';
 const score=v=>Number.isSafeInteger(v)&&v>=0&&v<=10000?v:0;
 const matches=snapshot.matches.slice(0,24).map((m,i)=>({
  table:Number.isInteger(m?.table)&&m.table>0&&m.table<=100?m.table:i+1,
  tableName:safeText(m?.tableName,48)||'Mesa '+(i+1),
  teamA:safeText(m?.teamA,100)||'Pareja sin nombre',
  teamB:safeText(m?.teamB,100)||'Pareja sin nombre',
  scoreA:score(m?.scoreA),scoreB:score(m?.scoreB),
  target:Number.isSafeInteger(m?.target)&&m.target>0&&m.target<=10000?m.target:200,
  status:m?.status==='activa'?'activa':''
 })).filter(m=>m.status==='activa');
 return {updatedAt:safeText(snapshot.updatedAt,40),matches,revision:Number.isSafeInteger(record?.revision)?record.revision:null};
}
function render(raw,isDemo){
 let data;try{data=validate(raw);}catch(error){el('connection').textContent='DATOS NO VÁLIDOS';el('updated').textContent=error.message;return;}
 el('connection').textContent=isDemo?'● DEMOSTRACIÓN · DATOS FICTICIOS':'● PARTIDAS EN VIVO · SOLO LECTURA';
 el('updated').textContent=data.updatedAt?'Actualizado: '+new Date(data.updatedAt).toLocaleTimeString('es-DO',{hour:'2-digit',minute:'2-digit',second:'2-digit'}):'Esperando actualización';
 const matches=el('matches');matches.replaceChildren();
 for(const m of data.matches){
  const card=node('article','match');
  card.append(node('div','table-name',m.tableName+' · MESA '+m.table));
  const teams=node('div','teams');
  for(const [name,score,other] of [[m.teamA,m.scoreA,m.scoreB],[m.teamB,m.scoreB,m.scoreA]]){
   const team=node('div','team-card'+(score>other?' leading':''));
   team.append(node('div','team-name',name),node('div','score',score));
   team.append(node('div','lead-label',score>other?'VA GANANDO':score===other?'EMPATE':''));
   teams.append(team);
  }
  card.append(teams);
  const remaining=Math.max(0,m.target-Math.max(m.scoreA,m.scoreB));
  card.append(node('div','target','Meta: '+m.target+' puntos · '+(remaining?remaining+' para llegar':'meta alcanzada')));
  matches.append(card);
 }
 if(!matches.childNodes.length)matches.replaceChildren(node('div','empty','No hay partidas activas en este momento.'));
}
async function refresh(){
 if(busy)return;busy=true;
 if(!endpoint){render(DEMO,true);busy=false;return;}
 try{
  const url=new URL(endpoint);
  if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash)throw Error('Configura una URL HTTPS segura para el marcador.');
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8000);
  let response;
  try{response=await fetch(url.href,{method:'GET',cache:'no-store',credentials:'omit',signal:controller.signal,headers:{Accept:'application/json'}});}finally{clearTimeout(timeout);}
  if(!response.ok)throw Error('Servicio de marcador no disponible ('+response.status+').');
  const record=await response.json();
  if(!Number.isSafeInteger(record?.revision)||record.revision<0||record.revision<=revision)throw Error('No llegó una revisión nueva del marcador.');
  revision=record.revision;render(record,false);
 }catch(error){
  el('connection').textContent='SIN CONEXIÓN · MOSTRANDO ÚLTIMO MARCADOR';
  el('updated').textContent='Se reintentará automáticamente. '+error.message;
 }finally{busy=false;}
}
function updateClock(){el('clock').textContent=new Date().toLocaleTimeString('es-DO',{hour:'2-digit',minute:'2-digit'});}
el('fullscreen').addEventListener('click',()=>{if(document.documentElement.requestFullscreen)document.documentElement.requestFullscreen().catch(()=>{});});
el('refresh').addEventListener('click',()=>refresh());
document.addEventListener('keydown',event=>{if(event.key==='Enter'&&document.activeElement===document.body)el('refresh').focus();});
render(DEMO,true);updateClock();refresh();timer=setInterval(refresh,10000);setInterval(updateClock,30000);
window.addEventListener('pagehide',()=>{if(timer)clearInterval(timer);});
})();

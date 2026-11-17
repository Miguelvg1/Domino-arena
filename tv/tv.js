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
let revision=-1,timer=null,busy=false,lastCount=1;
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
function fitGrid(count){
 const grid=el('matches'),n=Math.max(1,count);
 const box=grid.getBoundingClientRect();
 const width=box.width||window.innerWidth;
 const height=box.height||window.innerHeight*.7;
 const ratio=width/Math.max(1,height);
 let columns=1,best=Infinity;
 for(let c=1;c<=Math.min(6,n);c++){
  const rows=Math.ceil(n/c),cellRatio=ratio*rows/c,empty=c*rows-n;
  const cost=Math.abs(Math.log(cellRatio/1.58))+empty*.18;
  if(cost<best){best=cost;columns=c;}
 }
 const rows=Math.ceil(n/columns),cellWidth=width/columns,cellHeight=height/rows;
 grid.style.setProperty('--cols',columns);
 grid.style.setProperty('--rows',rows);
 grid.style.setProperty('--score-size',Math.max(24,Math.min(142,cellWidth*.27,cellHeight*.36))+'px');
 grid.style.setProperty('--team-size',Math.max(12,Math.min(34,cellWidth*.08,cellHeight*.16))+'px');
 grid.style.setProperty('--table-size',Math.max(12,Math.min(32,cellWidth*.075,cellHeight*.14))+'px');
 grid.dataset.count=String(count);
 grid.dataset.density=count>=13?'dense':count>=5?'compact':count>1?'multi':'single';
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
  for(const [index,name,score,other] of [[0,m.teamA,m.scoreA,m.scoreB],[1,m.teamB,m.scoreB,m.scoreA]]){
   const team=node('div','team-card team-'+(index===0?'a':'b')+(score>other?' leading':''));
   team.append(node('div','team-name',name),node('div','score',score));
   team.append(node('div','lead-label',score>other?'VA GANANDO':score===other?'EMPATE':''));
   teams.append(team);
  }
  card.append(teams);
  const remaining=Math.max(0,m.target-Math.max(m.scoreA,m.scoreB));
  card.append(node('div','target','Meta: '+m.target+' puntos · '+(remaining?remaining+' para llegar':'meta alcanzada')));
  matches.append(card);
 }
 lastCount=data.matches.length||1;
 if(!matches.childNodes.length)matches.replaceChildren(node('div','empty','No hay partidas activas en este momento.'));
 fitGrid(data.matches.length);
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
  if(!Number.isSafeInteger(record?.revision)||record.revision<0)throw Error('La respuesta no incluye una revisión válida.');
  if(record.revision<revision)throw Error('El marcador remoto está desactualizado.');
  if(record.revision===revision){el('connection').textContent='● PARTIDAS EN VIVO · SOLO LECTURA';return;}
  revision=record.revision;render(record,false);
 }catch(error){
  if(revision<0){
   el('connection').textContent='MARCADOR NO DISPONIBLE';
   el('updated').textContent='Se reintentará automáticamente. '+error.message;
   el('matches').replaceChildren(node('div','empty','No se pudo cargar el marcador en vivo.'));
  }else{
   el('connection').textContent='SIN CONEXIÓN · MOSTRANDO ÚLTIMO MARCADOR';
   el('updated').textContent='Se reintentará automáticamente. '+error.message;
  }
 }finally{busy=false;}
}
function updateClock(){el('clock').textContent=new Date().toLocaleTimeString('es-DO',{hour:'2-digit',minute:'2-digit'});}
el('fullscreen').addEventListener('click',()=>{if(document.documentElement.requestFullscreen)document.documentElement.requestFullscreen().catch(()=>{});});
el('refresh').addEventListener('click',()=>refresh());
document.addEventListener('keydown',event=>{if(event.key==='Enter'&&document.activeElement===document.body)el('refresh').focus();});
window.addEventListener('resize',()=>fitGrid(lastCount));
render(DEMO,true);updateClock();refresh();timer=setInterval(refresh,10000);setInterval(updateClock,30000);
window.addEventListener('pagehide',()=>{if(timer)clearInterval(timer);});
})();

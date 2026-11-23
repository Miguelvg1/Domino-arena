/* Authenticated organizer writes and public read-only tournament feed. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TitanesRemoteTournamentSync=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function create({baseUrl,getAccessToken,onStatus=()=>{}}){
 let closed=false,queue=Promise.resolve();
 const revisions=new Map();
 const base=new URL(baseUrl);
 if(base.protocol!=='https:'||base.search||base.hash)throw Error('Endpoint remoto inseguro');
 async function read(id){
  const response=await fetch(base.href.replace(/\/$/,'')+'/'+encodeURIComponent(id),{method:'GET',cache:'no-store',credentials:'omit',headers:{Accept:'application/json'}});
  if(!response.ok)throw Error('No se pudo leer el marcador ('+response.status+')');
  return response.json();
 }
 async function send(id,snapshot,expectedRevision,operationId){
  const token=await getAccessToken();
  if(!token)throw Error('Inicia sesión en la app Titanes Dominó para transmitir el torneo.');
  const url=base.href.replace(/\/$/,'')+'/'+encodeURIComponent(id);
  const response=await fetch(url,{method:'PUT',cache:'no-store',credentials:'omit',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({expectedRevision,operationId,snapshot})});
  const body=await response.json().catch(()=>({}));
  if(response.status===409)return {conflict:true};
  if(!response.ok)throw Error(body.error||'No se pudo sincronizar el torneo ('+response.status+').');
  if(!Number.isSafeInteger(body.revision))throw Error('El servidor no confirmó la revisión del marcador.');
  return {revision:body.revision};
 }
 function publish(id,snapshot,revision=0){
  const operation=queue.then(async()=>{
   if(closed)throw Error('Sincronización cerrada');
   let opId=globalThis.crypto?.randomUUID?.().replace(/-/g,'');
   if(!opId)throw Error('Este dispositivo no permite crear un identificador seguro.');
   const expected=Math.max(revision,revisions.get(id)||0);
   const result=await send(id,snapshot,expected,opId);
   if(result.conflict)throw Error('Otra sesión publicó un marcador más reciente. Vuelve a conectar con un código nuevo.');
   revisions.set(id,result.revision);
   onStatus('updated',result.revision);
   return result.revision;
  });
  queue=operation.catch(error=>{onStatus('offline',error.message);});
  return operation;
 }
 return {publish,read,close(){closed=true;}};
}
return {create};
});

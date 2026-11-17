/* Read-only remote TV transport. Requires a server-authorized public snapshot endpoint. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TitanesRemoteTvClient=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function create({fetchSnapshot,subscribe,onSnapshot,onStatus=()=>{},intervalMs=10000}){
 if(typeof fetchSnapshot!=='function'||typeof onSnapshot!=='function')throw Error('Faltan funciones de lectura');
 let stopped=false,revision=-1,stopSubscription=()=>{},timer=null,busy=false;
 const accept=record=>{if(!record||!Number.isSafeInteger(record.revision)||record.revision<0||!record.snapshot)throw Error('Respuesta de marcador inválida');if(record.revision<=revision)return;revision=record.revision;onSnapshot(record.snapshot);onStatus('updated');};
 async function refresh(){if(stopped||busy)return;busy=true;try{accept(await fetchSnapshot());}catch(e){onStatus('offline');}finally{busy=false;}}
 function start(){if(stopped)throw Error('Cliente cerrado');refresh();if(typeof subscribe==='function'){try{stopSubscription=subscribe(()=>refresh())||(()=>{});}catch(e){onStatus('offline');}}timer=setInterval(refresh,Math.max(2000,intervalMs));return api;}
 function close(){stopped=true;if(timer!==null)clearInterval(timer);stopSubscription();}
 const api={start,refresh,close,getRevision:()=>revision};return api;
}
return {create};
});
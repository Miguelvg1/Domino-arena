/* Local preview transport only: same browser origin; NOT internet or multi-device sync. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TitanesLocalPreviewSync=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const KEY='titanes-torneo-tv-preview-v1',CHANNEL='titanes-torneo-preview-v1';
function create(onSnapshot,options={}){
 const storage=options.storage??(typeof localStorage!=='undefined'?localStorage:null);
 const Channel=options.Channel??(typeof BroadcastChannel!=='undefined'?BroadcastChannel:null);
 let channel=null;
 const deliver=(payload)=>{if(!payload||payload.schemaVersion!==1)return;try{onSnapshot(payload);}catch(_){/* UI errors must not crash transport */}};
 if(Channel){channel=new Channel(CHANNEL);channel.onmessage=e=>deliver(e.data);}
 const onStorage=e=>{if(e.key!==KEY||!e.newValue)return;try{deliver(JSON.parse(e.newValue));}catch(_){}};
 if(typeof window!=='undefined')window.addEventListener('storage',onStorage);
 function publish(snapshot){if(!snapshot||snapshot.schemaVersion!==1)throw Error('Snapshot inválido');if(storage)storage.setItem(KEY,JSON.stringify(snapshot));if(channel)channel.postMessage(snapshot);}
 function read(){if(!storage)return null;try{return JSON.parse(storage.getItem(KEY)||'null');}catch(_){return null;}}
 function close(){if(channel)channel.close();if(typeof window!=='undefined')window.removeEventListener('storage',onStorage);}
 return {publish,read,close};
}
return {create};
});
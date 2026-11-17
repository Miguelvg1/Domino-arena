/* Isolated laboratory snapshot service. No production tables or credentials. */
'use strict';
const {validate}=require('./tv-snapshot.js');
function createStore({authorizeRead,authorizeWrite}={}){
 if(typeof authorizeRead!=='function'||typeof authorizeWrite!=='function')throw Error('Authorization callbacks required');
 const records=new Map();
 const validId=id=>typeof id==='string'&&/^[a-zA-Z0-9_-]{1,64}$/.test(id);
 const requireId=id=>{if(!validId(id))throw Error('Invalid tournament ID');};
 function read({id,principal}){requireId(id);if(!authorizeRead(principal,id))throw Error('Forbidden');const row=records.get(id);if(!row)throw Error('Not found');return structuredClone(row);}
 function publish({id,principal,operationId,expectedRevision,snapshot}){
  requireId(id);
  if(!authorizeWrite(principal,id))throw Error('Forbidden');
  if(typeof operationId!=='string'||!/^[a-zA-Z0-9_-]{8,128}$/.test(operationId))throw Error('Invalid operation ID');
  if(!Number.isSafeInteger(expectedRevision)||expectedRevision<0)throw Error('Invalid expected revision');
  const previous=records.get(id),current=previous?.revision??0;
  if(previous?.operations.has(operationId))return structuredClone({revision:previous.revision,snapshot:previous.snapshot});
  if(current!==expectedRevision)throw Error('Revision conflict');
  const sanitized=validate(snapshot);
  const row={revision:current+1,snapshot:sanitized,operations:new Set(previous?.operations||[])};
  row.operations.add(operationId);
  records.set(id,row);
  return structuredClone({revision:row.revision,snapshot:row.snapshot});
 }
 return {read:({id,principal})=>{const {revision,snapshot}=read({id,principal});return {revision,snapshot};},publish};
}
module.exports={createStore};

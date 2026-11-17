/* Laboratory-only HTTP adapter. Authentication is supplied by trusted server middleware. */
'use strict';
const http=require('node:http');
const {createStore}=require('./snapshot-store.cjs');
function createHandler({store,authenticate}){
 if(!store||typeof store.read!=='function'||typeof store.publish!=='function'||typeof authenticate!=='function')throw Error('Store and trusted authentication required');
 return async(req,res)=>{
  const send=(status,body)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(body));};
  const match=/^\/api\/tournaments\/([A-Za-z0-9_-]{1,64})\/snapshot$/.exec((req.url||'').split('?')[0]);
  if(!match)return send(404,{error:'Not found'});
  if(req.method!=='GET'&&req.method!=='PUT')return send(405,{error:'Method not allowed'});
  try{
   const principal=await authenticate(req);
   if(!principal)return send(401,{error:'Unauthorized'});
   if(req.method==='GET')return send(200,store.read({id:match[1],principal}));
   if(req.headers['content-type']?.split(';')[0]?.trim()!=='application/json')return send(415,{error:'JSON required'});
   let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>131072)return send(413,{error:'Payload too large'});}
   let payload;try{payload=JSON.parse(raw);}catch{return send(400,{error:'Invalid JSON'});}
   const result=store.publish({id:match[1],principal,operationId:payload.operationId,expectedRevision:payload.expectedRevision,snapshot:payload.snapshot});
   return send(200,result);
  }catch(e){
   const status=e.message==='Forbidden'?403:e.message==='Not found'?404:e.message==='Revision conflict'?409:400;
   return send(status,{error:status===400?'Invalid request':e.message});
  }
 };
}
module.exports={createHandler,createStore,createServer:options=>http.createServer(createHandler(options))};

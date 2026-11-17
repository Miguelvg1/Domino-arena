/* Serverless laboratory handler: editor-only writes and TV-only reads. */
'use strict';
const crypto=require('node:crypto');
const {Pool}=require('pg');
const {createPostgresStore}=require('./postgres-store.cjs');
const {validate}=require('./tv-snapshot.js');
const same=(a,b)=>{if(typeof a!=='string'||typeof b!=='string'||!b)return false;return crypto.timingSafeEqual(crypto.createHash('sha256').update(a).digest(),crypto.createHash('sha256').update(b).digest());};
function createLabHandler({env=process.env,pool}={}){
 const {DATABASE_URL,LAB_EDITOR_TOKEN,LAB_VIEWER_TOKEN}=env;
 if(!DATABASE_URL||!LAB_EDITOR_TOKEN||!LAB_VIEWER_TOKEN||LAB_EDITOR_TOKEN===LAB_VIEWER_TOKEN)throw Error('Laboratory credentials not configured');
 if(!/^postgres(?:ql)?:\/\//.test(DATABASE_URL))throw Error('Invalid PostgreSQL URL');
 const db=pool||new Pool({connectionString:DATABASE_URL,ssl:{rejectUnauthorized:true},max:2,connectionTimeoutMillis:5000});
 const store=createPostgresStore({pool:db,authorizeRead:p=>p?.role==='editor'||p?.role==='viewer',authorizeWrite:p=>p?.role==='editor'});
 return async(req,res)=>{
  const send=(status,body)=>res.status(status).setHeader('cache-control','no-store').json(body);
  const url=new URL(req.url,'https://lab.invalid');
  const match=/^\/api\/tournaments\/([A-Za-z0-9_-]{1,64})\/snapshot$/.exec(url.pathname);
  if(!match)return send(404,{error:'Not found'});
  if(req.method!=='GET'&&req.method!=='PUT')return send(405,{error:'Method not allowed'});
  const token=/^Bearer (.+)$/.exec(req.headers.authorization||'')?.[1];
  const principal=same(token,LAB_EDITOR_TOKEN)?{role:'editor'}:same(token,LAB_VIEWER_TOKEN)?{role:'viewer'}:null;
  if(!principal)return send(401,{error:'Unauthorized'});
  if(req.method==='PUT'&&principal.role!=='editor')return send(403,{error:'Forbidden'});
  try{
   if(req.method==='GET')return send(200,await store.read({id:match[1],principal}));
   if(!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type']||''))return send(415,{error:'JSON required'});
   const body=typeof req.body==='string'?JSON.parse(req.body):req.body;
   if(!body||typeof body!=='object'||JSON.stringify(body).length>131072)return send(400,{error:'Invalid request'});
   const snapshot=validate(body.snapshot);
   return send(200,await store.publish({id:match[1],principal,operationId:body.operationId,expectedRevision:body.expectedRevision,snapshot}));
  }catch(e){
   const status=e.message==='Forbidden'?403:e.message==='Not found'?404:e.message==='Revision conflict'?409:400;
   return send(status,{error:status===400?'Invalid request':e.message});
  }
 };
}
module.exports={createLabHandler};

/* Isolated TV laboratory server. Secrets belong in server environment only. */
'use strict';
const crypto=require('node:crypto');
const {Pool}=require('pg');
const {createServer}=require('./http-adapter.cjs');
const {createPostgresStore}=require('./postgres-store.cjs');
function equalToken(value,expected){
 if(typeof value!=='string'||typeof expected!=='string'||!expected)return false;
 const a=crypto.createHash('sha256').update(value).digest();
 const b=crypto.createHash('sha256').update(expected).digest();
 return crypto.timingSafeEqual(a,b);
}
function createLabServer({env=process.env,PoolClass=Pool}={}){
 const {DATABASE_URL,LAB_EDITOR_TOKEN,LAB_VIEWER_TOKEN}=env;
 if(!DATABASE_URL||!LAB_EDITOR_TOKEN||!LAB_VIEWER_TOKEN||LAB_EDITOR_TOKEN===LAB_VIEWER_TOKEN)throw Error('Missing or duplicate laboratory secrets');
 if(!/^postgres(?:ql)?:\/\//.test(DATABASE_URL))throw Error('DATABASE_URL must be a PostgreSQL URL');
 const pool=new PoolClass({connectionString:DATABASE_URL,ssl:{rejectUnauthorized:true},max:5,connectionTimeoutMillis:5000});
 const authenticate=req=>{
  const authorization=req.headers.authorization;
  if(typeof authorization!=='string'||!authorization.startsWith('Bearer '))return null;
  const token=authorization.slice(7);
  if(equalToken(token,LAB_EDITOR_TOKEN))return {role:'editor',deviceType:'mobile'};
  if(equalToken(token,LAB_VIEWER_TOKEN))return {role:'viewer',deviceType:'tv'};
  return null;
 };
 const store=createPostgresStore({pool,authorizeRead:p=>p?.role==='viewer'||p?.role==='editor',authorizeWrite:p=>p?.role==='editor'&&p?.deviceType==='mobile'});
 const server=createServer({store,authenticate});
 server.on('close',()=>{void pool.end();});
 return {server,pool};
}
if(require.main===module){
 const {server}=createLabServer();
 const port=Number(process.env.PORT||8080);
 server.listen(port,'127.0.0.1',()=>console.log('Titanes TV laboratory listening on localhost:'+port));
}
module.exports={createLabServer,equalToken};

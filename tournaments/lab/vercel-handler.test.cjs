'use strict';
const assert=require('node:assert/strict');
const {createLabHandler}=require('./vercel-handler.cjs');
const env={DATABASE_URL:'postgresql://example.invalid/lab',LAB_EDITOR_TOKEN:'editor-lab-secret',LAB_VIEWER_TOKEN:'viewer-lab-secret'};
const pool={query:async()=>({rows:[]}),connect:async()=>{throw Error('Viewer must never write');}};
const handler=createLabHandler({env,pool});
async function request(method,token,body){
 const req={url:'/api/tournaments/demo/snapshot',method,headers:{authorization:'Bearer '+token,'content-type':'application/json'},body};
 const res={statusCode:200,headers:{},status(n){this.statusCode=n;return this;},setHeader(k,v){this.headers[k]=v;return this;},json(data){this.data=data;return this;}};
 await handler(req,res);return res;
}
(async()=>{
 assert.equal((await request('GET','invalid')).statusCode,401);
 assert.equal((await request('GET',env.LAB_VIEWER_TOKEN)).statusCode,404);
 assert.equal((await request('PUT',env.LAB_VIEWER_TOKEN,{})).statusCode,403);
 assert.equal((await request('PUT',env.LAB_EDITOR_TOKEN,{})).statusCode,400);
 assert.equal((await request('POST',env.LAB_EDITOR_TOKEN,{})).statusCode,405);
 const failing=createLabHandler({env,pool:{query:async()=>{throw Error('database password must not leak');},connect:pool.connect}});
 const req={url:'/api/tournaments/demo/snapshot',method:'GET',headers:{authorization:'Bearer '+env.LAB_VIEWER_TOKEN}};
 const res={statusCode:200,status(n){this.statusCode=n;return this;},setHeader(){return this;},json(data){this.data=data;return this;}};
 await failing(req,res);
 assert.equal(res.statusCode,503);
 assert.equal(res.data.error,'Service temporarily unavailable');
 console.log('Vercel TV handler read-only and database outage regression passed');
})().catch(e=>{console.error(e);process.exitCode=1;});

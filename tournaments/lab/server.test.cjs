const assert=require('node:assert/strict');
const {createLabServer,equalToken}=require('./server.cjs');
(async()=>{
 assert.equal(equalToken('viewer-secret','viewer-secret'),true);
 assert.equal(equalToken('editor-secret','viewer-secret'),false);
 class FakePool{
  constructor(options){this.options=options;this.rows=[];}
  async query(){return {rows:[]};}
  async end(){}
  async connect(){throw Error('Write should never reach database');}
 }
 const env={DATABASE_URL:'postgresql://example.invalid/lab',LAB_EDITOR_TOKEN:'editor-secret',LAB_VIEWER_TOKEN:'viewer-secret'};
 assert.throws(()=>createLabServer({env:{...env,LAB_EDITOR_TOKEN:'viewer-secret'},PoolClass:FakePool}),/duplicate/);
 const {server,pool}=createLabServer({env,PoolClass:FakePool});
 assert.equal(pool.options.ssl.rejectUnauthorized,true);
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const url='http://127.0.0.1:'+server.address().port+'/api/tournaments/demo/snapshot';
  const request=(method,token)=>fetch(url,{method,headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:method==='PUT'?'{}':undefined});
  assert.equal((await request('GET','bad-secret')).status,401);
  assert.equal((await request('GET','viewer-secret')).status,404);
  assert.equal((await request('PUT','viewer-secret')).status,403);
  assert.equal((await request('PUT','editor-secret')).status,400);
  console.log('TV laboratory server access controls passed');
 }finally{await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});

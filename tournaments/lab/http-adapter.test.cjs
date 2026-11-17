const assert=require('node:assert/strict');
const {createServer,createStore}=require('./http-adapter.cjs');
(async()=>{
 const store=createStore({authorizeRead:p=>p==='viewer'||p==='editor',authorizeWrite:p=>p==='editor'});
 const server=createServer({store,authenticate:req=>req.headers.authorization==='Bearer lab-editor'?'editor':req.headers.authorization==='Bearer lab-viewer'?'viewer':null});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const url='http://127.0.0.1:'+server.address().port+'/api/tournaments/demo/snapshot';
  const get=token=>fetch(url,{headers:token?{authorization:'Bearer '+token}:{}});
  assert.equal((await get()).status,401);
  assert.equal((await get('lab-viewer')).status,404);
  const payload={operationId:'operation_123',expectedRevision:0,snapshot:{schemaVersion:1,tournament:'Titanes',matches:[{teamA:'A',teamB:'B',scoreA:200,scoreB:40}],adminToken:'secret'}};
  const put=(token,data)=>fetch(url,{method:'PUT',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify(data)});
  assert.equal((await put('lab-viewer',payload)).status,403);
  // Even a permissive storage authorization cannot grant TV write access.
  const {createServer:makeServer}=require('./http-adapter.cjs');
  const permissive=makeServer({store:createStore({authorizeRead:()=>true,authorizeWrite:()=>true}),authenticate:req=>req.headers.authorization==='Bearer tv-device'?{role:'editor',deviceType:'tv'}:'viewer'});
  await new Promise(resolve=>permissive.listen(0,'127.0.0.1',resolve));
  try{
   const tvUrl='http://127.0.0.1:'+permissive.address().port+'/api/tournaments/demo/snapshot';
   for(const authorization of ['Bearer tv-device','Bearer lab-viewer']){
    const response=await fetch(tvUrl,{method:'PUT',headers:{authorization,'content-type':'application/json'},body:JSON.stringify(payload)});
    assert.equal(response.status,403);
   }
  }finally{await new Promise(resolve=>permissive.close(resolve));}
  const created=await put('lab-editor',payload);assert.equal(created.status,200);
  const first=await created.json();assert.equal(first.revision,1);assert.equal(first.snapshot.adminToken,undefined);
  assert.equal((await put('lab-editor',payload)).status,200);
  assert.equal((await put('lab-editor',{...payload,operationId:'operation_456'})).status,409);
  const visible=await get('lab-viewer');assert.equal(visible.status,200);
  assert.equal((await visible.json()).snapshot.matches[0].scoreA,200);
  assert.equal((await fetch(url,{method:'POST'})).status,405);
  console.log('Laboratory HTTP snapshot checks passed');
 }finally{await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});

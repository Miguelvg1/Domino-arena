const assert=require('node:assert/strict');
const {webcrypto}=require('node:crypto');
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const {create}=require('./remote-tournament-sync.js');
const originalFetch=global.fetch;
const response=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});
(async()=>{
 const calls=[];
 const queue=[response({revision:1,snapshot:{schemaVersion:1}})];
 global.fetch=async(url,init)=>{calls.push({url:String(url),init});return queue.shift();};
 let status;
 const client=create({baseUrl:'https://lab.example/functions/v1/tournament-tv-sync',getAccessToken:async()=>'lab-user-jwt',onStatus:(s,d)=>status=[s,d]});
 const revision=await client.publish('a'.repeat(32),{schemaVersion:1,matches:[]},0);
 assert.equal(revision,1);
 assert.equal(calls.length,1);
 assert.equal(calls[0].init.method,'PUT');
 assert.equal(calls[0].init.headers.Authorization,'Bearer lab-user-jwt');
 assert.equal(JSON.parse(calls[0].init.body).expectedRevision,0);
 assert.equal(status[0],'updated');

 calls.length=0;
 queue.push(response({error:'conflict'},409));
 await assert.rejects(()=>client.publish('a'.repeat(32),{schemaVersion:1,matches:[{scoreA:10}]},0),/Otra sesión/);
 assert.deepEqual(calls.map(x=>x.init.method),['PUT']);
 assert.equal(JSON.parse(calls[0].init.body).expectedRevision,1);

 calls.length=0;
 global.fetch=async(url,init)=>{calls.push({url:String(url),init});return response({revision:9,snapshot:{schemaVersion:1}});};
 const read=await client.read('a'.repeat(32));
 assert.equal(read.revision,9);
 assert.equal(calls[0].init.method,'GET');
 assert.equal(calls[0].init.headers.Authorization,undefined);
 assert.equal(calls[0].init.credentials,'omit');

 const missing=create({baseUrl:'https://lab.example/functions/v1/tournament-tv-sync',getAccessToken:async()=>null});
 await assert.rejects(()=>missing.publish('a'.repeat(32),{schemaVersion:1,matches:[]},0),/Inicia sesión/);
 assert.throws(()=>create({baseUrl:'http://lab.example',getAccessToken:async()=>''}),/inseguro/);
 client.close();missing.close();
 global.fetch=originalFetch;
 console.log('Remote tournament transport: organizer authorization, read-only TV GET and stale revision rejection passed.');
})().catch(error=>{global.fetch=originalFetch;console.error(error);process.exitCode=1;});

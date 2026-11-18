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
 const client=create({baseUrl:'https://lab.example/functions/v1/tournament-tv-sync',getAccessToken:async()=>'official-user-jwt',onStatus:(s,d)=>status=[s,d]});
 const revision=await client.publish('a'.repeat(32),{schemaVersion:1,matches:[]},0);
 assert.equal(revision,1);
 assert.equal(calls.length,1);
 assert.equal(calls[0].init.method,'PUT');
 assert.equal(calls[0].init.headers.Authorization,'Bearer official-user-jwt');
 assert.equal(JSON.parse(calls[0].init.body).expectedRevision,0);
 assert.equal(status[0],'updated');

 calls.length=0;
 queue.push(response({error:'conflict'},409),response({revision:7,snapshot:{schemaVersion:1}}),response({revision:8,snapshot:{schemaVersion:1}}));
 const next=await client.publish('a'.repeat(32),{schemaVersion:1,matches:[{scoreA:10}]},1);
 assert.equal(next,8);
 assert.deepEqual(calls.map(x=>x.init.method),['PUT','GET','PUT']);
 assert.equal(JSON.parse(calls[2].init.body).expectedRevision,7);
 assert.equal(calls[2].init.headers.Authorization,'Bearer official-user-jwt');

 calls.length=0;
 global.fetch=async(url,init)=>{calls.push({url:String(url),init});return response({revision:9,snapshot:{schemaVersion:1}});};
 const read=await client.read('a'.repeat(32));
 assert.equal(read.revision,9);
 assert.equal(calls[0].init.method,'GET');
 assert.equal(calls[0].init.headers.Authorization,undefined);
 assert.equal(calls[0].init.credentials,'omit');

 const missing=create({baseUrl:'https://lab.example/functions/v1/tournament-tv-sync',getAccessToken:async()=>null});
 await assert.rejects(()=>missing.publish('a'.repeat(32),{schemaVersion:1,matches:[]},0),/Inicia sesión/);
 assert.throws(()=>create({baseUrl:'http://lab.example',getAccessToken:async()=>''}),/HTTPS/);
 client.close();missing.close();
 global.fetch=originalFetch;
 console.log('Remote tournament transport: organizer authorization, read-only TV GET and revision conflict recovery passed.');
})().catch(error=>{global.fetch=originalFetch;console.error(error);process.exitCode=1;});

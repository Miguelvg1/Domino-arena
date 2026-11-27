const assert=require('node:assert/strict');
const {createPostgresStore}=require('./postgres-store.cjs');
(async()=>{
 let row=null,operations=new Map(),released=0,commits=0,rollbacks=0;
 const query=async(sql,args=[])=>{
  if(sql==='BEGIN'||sql.includes('pg_advisory_xact_lock'))return {rows:[]};
  if(sql==='COMMIT'){commits++;return {rows:[]};}
  if(sql==='ROLLBACK'){rollbacks++;return {rows:[]};}
  if(sql.startsWith('select revision,snapshot'))return {rows:row?[row]:[]};
  if(sql.startsWith('select revision from titanes_tv_lab.operations'))return {rows:operations.has(args[1])?[{revision:operations.get(args[1])}]:[]};
  if(sql.startsWith('insert into titanes_tv_lab.snapshots')){row={revision:args[1],snapshot:JSON.parse(args[2])};return {rows:[]};}
  if(sql.startsWith('insert into titanes_tv_lab.operations')){operations.set(args[1],args[2]);return {rows:[]};}
  throw Error('Unexpected SQL: '+sql);
 };
 const pool={query,connect:async()=>({query,release:()=>released++})};
 const store=createPostgresStore({pool,authorizeRead:p=>p==='viewer'||p==='editor',authorizeWrite:p=>p==='editor'});
 const snapshot={schemaVersion:1,tournament:'Titanes',matches:[{scoreA:200,scoreB:50,secret:'no'}],adminToken:'no'};
 const req={id:'demo',principal:'editor',operationId:'operation_123',expectedRevision:0,snapshot};
 assert.equal((await store.publish(req)).revision,1);
 assert.equal((await store.publish(req)).revision,1);
 assert.equal((await store.read({id:'demo',principal:'viewer'})).snapshot.adminToken,undefined);
 assert.equal((await store.read({id:'demo',principal:'viewer'})).snapshot.matches[0].secret,undefined);
 await assert.rejects(store.publish({...req,operationId:'operation_456'}),/Revision conflict/);
 await assert.rejects(store.publish({...req,principal:'viewer'}),/Forbidden/);
 assert.equal((await store.publish({...req,operationId:'operation_456',expectedRevision:1})).revision,2);
 assert.equal(commits,3);assert.equal(rollbacks,1);assert.equal(released,4);
 console.log('PostgreSQL laboratory snapshot checks passed');
})().catch(e=>{console.error(e);process.exitCode=1;});

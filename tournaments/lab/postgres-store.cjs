/* PostgreSQL-backed laboratory tournament snapshots. Requires a server-side pg Pool. */
'use strict';
const {validate}=require('../shared/tv-snapshot.js');
function createPostgresStore({pool,authorizeRead,authorizeWrite}={}){
 if(!pool||typeof pool.connect!=='function'||typeof authorizeRead!=='function'||typeof authorizeWrite!=='function')throw Error('Pool and authorization callbacks required');
 const checkId=id=>{if(typeof id!=='string'||!/^[A-Za-z0-9_-]{1,64}$/.test(id))throw Error('Invalid tournament ID');};
 async function read({id,principal}){
  checkId(id);if(!authorizeRead(principal,id))throw Error('Forbidden');
  const result=await pool.query('select revision,snapshot from titanes_tv_lab.snapshots where tournament_id=$1',[id]);
  if(!result.rows.length)throw Error('Not found');
  return {revision:Number(result.rows[0].revision),snapshot:validate(result.rows[0].snapshot)};
 }
 async function publish({id,principal,operationId,expectedRevision,snapshot}){
  checkId(id);if(!authorizeWrite(principal,id))throw Error('Forbidden');
  if(typeof operationId!=='string'||!/^[A-Za-z0-9_-]{8,128}$/.test(operationId))throw Error('Invalid operation ID');
  if(!Number.isSafeInteger(expectedRevision)||expectedRevision<0)throw Error('Invalid expected revision');
  const safe=validate(snapshot);
  const client=await pool.connect();
  try{
   await client.query('BEGIN');
   // Serialize writes to this tournament, including its first creation.
   await client.query('select pg_advisory_xact_lock(hashtext($1))',[id]);
   const existing=await client.query('select revision,snapshot from titanes_tv_lab.snapshots where tournament_id=$1 for update',[id]);
   const current=existing.rows.length?Number(existing.rows[0].revision):0;
   const repeated=await client.query('select revision from titanes_tv_lab.operations where tournament_id=$1 and operation_id=$2',[id,operationId]);
   if(repeated.rows.length){
    await client.query('COMMIT');
    return {revision:current,snapshot:validate(existing.rows[0].snapshot)};
   }
   if(current!==expectedRevision)throw Error('Revision conflict');
   const next=current+1;
   await client.query(`insert into titanes_tv_lab.snapshots(tournament_id,revision,snapshot,updated_at)
    values($1,$2,$3::jsonb,now()) on conflict(tournament_id) do update
    set revision=excluded.revision,snapshot=excluded.snapshot,updated_at=excluded.updated_at`,[id,next,JSON.stringify(safe)]);
   await client.query('insert into titanes_tv_lab.operations(tournament_id,operation_id,revision) values($1,$2,$3)',[id,operationId,next]);
   await client.query('COMMIT');
   return {revision:next,snapshot:safe};
  }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
 }
 return {read,publish};
}
module.exports={createPostgresStore};

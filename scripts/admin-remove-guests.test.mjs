import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const start=html.indexOf('async function removeGuest(');
const end=html.indexOf('async function adminCreateMember(',start);
assert.ok(start>=0&&end>start,'Guest removal handler missing');
const source=html.slice(start,end);
function setup({role='admin',isGuest=true,deletedAt=null,confirmed=true,error=null}={}){
 const calls=[],alerts=[];
 const ctx={me:{role},alert:x=>alerts.push(x),confirm:()=>confirmed,render:async()=>{},
 sb:{from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:{id:'guest-1',is_guest:isGuest,deleted_at:deletedAt},error:null})})})}),
 rpc:async(name,args)=>{calls.push({name,args});return {error}}}};
 vm.createContext(ctx);vm.runInContext(source,ctx);
 return {ctx,calls,alerts};
}
test('president may remove verified guest after confirmation',async()=>{
 const {ctx,calls}=setup();await ctx.removeGuest('guest-1','Invitado');
 assert.equal(calls.length,1);assert.equal(calls[0].name,'admin_soft_delete_member');
 assert.equal(calls[0].args.p_member_id,'guest-1');
});
test('regular member cannot remove guests',async()=>{
 const {ctx,calls}=setup({role:'member'});await ctx.removeGuest('guest-1','Invitado');assert.equal(calls.length,0);
});
test('official member is protected',async()=>{
 const {ctx,calls}=setup({isGuest:false});await ctx.removeGuest('guest-1','Titán');assert.equal(calls.length,0);
});
test('already removed guest is protected',async()=>{
 const {ctx,calls}=setup({deletedAt:'2026-10-19'});await ctx.removeGuest('guest-1','Invitado');assert.equal(calls.length,0);
});
test('cancellation does not call deletion RPC',async()=>{
 const {ctx,calls}=setup({confirmed:false});await ctx.removeGuest('guest-1','Invitado');assert.equal(calls.length,0);
});
test('RPC error is shown without reporting success',async()=>{
 const {ctx,alerts}=setup({error:{message:'denied'}});await ctx.removeGuest('guest-1','Invitado');
 assert.ok(alerts.some(x=>x.includes('denied')));assert.ok(!alerts.some(x=>x==='Invitado retirado de la lista.'));
});

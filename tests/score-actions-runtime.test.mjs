import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
function extract(name,next){const start=html.indexOf('async function '+name+'(');assert.ok(start>=0,name+' missing');const end=html.indexOf(next,start);assert.ok(end>start,name+' end missing');return html.slice(start,end)}
const source=extract('voidScore','async function correctScoreV2')+extract('correctScoreV2','async function correctScore(');
const calls=[];let renders=0;let toast=[];let alerts=[];let error=null;
const ctx={GP:[{team:'L',member_id:'player-a'},{team:'L',member_id:'player-b'}],sb:{rpc:async(name,args)=>{calls.push({name,args});return {error}}},titanScoreDialog:async(title)=>title.startsWith('Anular')?{reason:'duplicate'}:{team:'L',points:'25',reason:'incorrect'},confirm:()=>true,scoreToast:(x)=>toast.push(x),render:async()=>{renders++},alert:(x)=>alerts.push(x),prompt:()=>null,console};
vm.createContext(ctx);vm.runInContext(source,ctx);
await ctx.correctScoreV2({dataset:{type:'normal',team:'L',points:'34',credit:'player-a',id:'event-1'}});
assert.equal(calls[0].name,'correct_score_event_v2');assert.equal(calls[0].args.p_new_points,25);assert.equal(calls[0].args.p_event_id,'event-1');assert.equal(renders,1);
await ctx.voidScore('event-1',25);assert.equal(calls[1].name,'void_score_event');assert.equal(calls[1].args.p_event_id,'event-1');assert.equal(renders,2);
error={message:'Permission denied'};await ctx.voidScore('event-2',25);assert.equal(renders,2);assert.ok(alerts.some(x=>x.includes('Permission denied')));
console.log('PASS: correction, void, and RPC error handling using mocked client (no database writes)');

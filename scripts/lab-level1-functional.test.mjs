import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const start=html.indexOf('async function addScore(');
const end=html.indexOf('async function correctScoreV2(',start);
assert.ok(start>=0&&end>start,'Cannot locate addScore');
const source=html.slice(start,end).trim();

test('correction changes team, clears player, preserves points and records only after selecting Carlos',async()=>{
 const alerts=[],rpcCalls=[],scorePaints=[],selected=[{classList:{remove(){}}}];
 let decision='correct';
 const db={largos_score:185,cortos_score:130,status:'activa'};
 const ctx={
  scoreSaving:false,scoreWin:'juan',scoreResp:'luis',scoreType:'normal',scoreTeam:'L',
  fixed:{},GP:[{member_id:'juan',members:{full_name:'Juan'}},{member_id:'carlos',members:{full_name:'Carlos'}}],
  GAME:{...db},openGame:'game-1',lastLocalScoreAt:0,
  $:()=>({value:'25'}),nm:m=>m?.full_name||'',
  document:{querySelectorAll:()=>selected,body:{contains:()=>false}},
  alert:m=>alerts.push(m),scoreToast:()=>{},confirmVictoryChoice:async()=>decision,
  paintScore:x=>scorePaints.push({...x}),addHistoryRow:()=>null,resetScoreEntry:()=>{},
  render:async()=>{},Date,Number,
  sb:{
   from:()=>({select:()=>({eq:()=>({single:async()=>({data:{...db},error:null})})})}),
   rpc:async(name,args)=>{rpcCalls.push({name,args});db.cortos_score+=args.p_points;return {error:null}}
  }
 };
 vm.createContext(ctx);
 vm.runInContext(source,ctx);
 await ctx.addScore(null);
 assert.equal(ctx.scoreTeam,'C');
 assert.equal(ctx.scoreWin,'');
 assert.equal(ctx.scoreResp,'');
 assert.equal(ctx.$().value,'25');
 assert.equal(rpcCalls.length,0,'Correction must not submit score');
 await ctx.addScore(null);
 assert.equal(rpcCalls.length,0,'No player: no RPC');
 assert.ok(alerts.some(x=>x.includes('jugador')));
 ctx.scoreWin='carlos';
 await ctx.addScore(null);
 assert.equal(rpcCalls.length,1);
 assert.equal(rpcCalls[0].name,'add_score_event');
 assert.equal(rpcCalls[0].args.p_team,'C');
 assert.equal(rpcCalls[0].args.p_points,25);
 assert.equal(rpcCalls[0].args.p_credited_member_id,'carlos');
 assert.equal(rpcCalls[0].args.p_responsible_member_id,null);
 assert.equal(db.largos_score,185);
 assert.equal(db.cortos_score,155);
 assert.equal(db.status,'activa');
});

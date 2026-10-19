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

test('cancelling victory confirmation never records points',async()=>{
 const calls=[];
 const ctx={
  scoreSaving:false,scoreWin:'juan',scoreResp:'',scoreType:'normal',scoreTeam:'L',
  fixed:{},GP:[{member_id:'juan',members:{full_name:'Juan'}}],
  GAME:{largos_score:190,cortos_score:150,status:'activa'},openGame:'game-2',
  $:()=>({value:'15'}),nm:m=>m?.full_name||'',alert:()=>{},
  confirmVictoryChoice:async()=> 'cancel',
  sb:{from:()=>({select:()=>({eq:()=>({single:async()=>({data:{largos_score:190,cortos_score:150,status:'activa'},error:null})})})}),rpc:async(...args)=>{calls.push(args);return {error:null}}},
  Date,Number
 };
 vm.createContext(ctx);vm.runInContext(source,ctx);
 await ctx.addScore(null);
 assert.equal(calls.length,0,'Cancel must not call add_score_event');
 assert.equal(ctx.scoreWin,'juan','Cancel preserves selection');
});

test('stale scoreboard blocks recording and requests refresh',async()=>{
 const calls=[],alerts=[];
 const ctx={
  scoreSaving:false,scoreWin:'juan',scoreResp:'',scoreType:'normal',scoreTeam:'L',
  fixed:{},GP:[{member_id:'juan',members:{full_name:'Juan'}}],
  GAME:{largos_score:190,cortos_score:150,status:'activa'},openGame:'game-3',
  $:()=>({value:'15'}),nm:m=>m?.full_name||'',alert:m=>alerts.push(m),
  render:async()=>{},confirmVictoryChoice:async()=>{throw Error('Must not prompt on stale scoreboard')},
  sb:{from:()=>({select:()=>({eq:()=>({single:async()=>({data:{largos_score:195,cortos_score:150,status:'activa'},error:null})})})}),rpc:async(...args)=>{calls.push(args);return {error:null}}},
  Date,Number
 };
 vm.createContext(ctx);vm.runInContext(source,ctx);
 await ctx.addScore(null);
 assert.equal(calls.length,0);
 assert.ok(alerts.some(x=>x.includes('marcador cambió')));
});

test('special event correction requires a newly selected responsible player',async()=>{
 const calls=[],alerts=[];
 const ctx={
  scoreSaving:false,scoreWin:'juan',scoreResp:'luis',scoreType:'chivo',scoreTeam:'L',
  fixed:{chivo:100},GP:[{member_id:'juan',members:{full_name:'Juan'}},{member_id:'carlos',members:{full_name:'Carlos'}}],
  GAME:{largos_score:150,cortos_score:90,status:'activa'},openGame:'game-4',
  $:()=>({value:''}),nm:m=>m?.full_name||'',alert:m=>alerts.push(m),
  document:{querySelectorAll:()=>[{classList:{remove(){}}}]},
  scoreToast:()=>{},confirmVictoryChoice:async()=> 'correct',
  sb:{from:()=>({select:()=>({eq:()=>({single:async()=>({data:{largos_score:150,cortos_score:90,status:'activa'},error:null})})})}),rpc:async(...args)=>{calls.push(args);return {error:null}}},
  Date,Number
 };
 vm.createContext(ctx);vm.runInContext(source,ctx);
 await ctx.addScore(null);
 assert.equal(ctx.scoreTeam,'C');
 assert.equal(ctx.scoreWin,'');
 assert.equal(ctx.scoreResp,'');
 await ctx.addScore(null);
 ctx.scoreWin='carlos';
 await ctx.addScore(null);
 assert.equal(calls.length,0);
 assert.ok(alerts.some(x=>x.includes('responsable')));
});

test('confirmed victory sends exactly one event and reports winner',async()=>{
 const calls=[],alerts=[],paints=[];
 const db={largos_score:190,cortos_score:150,status:'activa',winner:null};
 const ctx={
  scoreSaving:false,scoreWin:'juan',scoreResp:'',scoreType:'normal',scoreTeam:'L',
  fixed:{},GP:[{member_id:'juan',members:{full_name:'Juan'}}],
  GAME:{...db},openGame:'game-victory',lastLocalScoreAt:0,
  $:()=>({value:'15'}),nm:m=>m?.full_name||'',
  alert:m=>alerts.push(m),scoreToast:()=>{},confirmVictoryChoice:async()=> 'confirm',
  paintScore:x=>paints.push({...x}),addHistoryRow:()=>null,resetScoreEntry:()=>{},
  render:async()=>{},Date,Number,
  sb:{
   from:()=>({select:()=>({eq:()=>({single:async()=>({data:{...db},error:null})})})}),
   rpc:async(name,args)=>{calls.push({name,args});db.largos_score+=args.p_points;db.status='finalizada';db.winner='L';return {error:null}}
  }
 };
 vm.createContext(ctx);vm.runInContext(source,ctx);
 await ctx.addScore(null);
 assert.equal(calls.length,1);
 assert.equal(calls[0].args.p_team,'L');
 assert.equal(calls[0].args.p_credited_member_id,'juan');
 assert.equal(db.largos_score,205);
 assert.equal(db.status,'finalizada');
 assert.equal(db.winner,'L');
 assert.ok(alerts.some(x=>x.includes('PARTIDA FINALIZADA')));
});

test('server rejects scoring after finished game and sends no event',async()=>{
 const calls=[],alerts=[];
 const ctx={
  scoreSaving:false,scoreWin:'juan',scoreResp:'',scoreType:'normal',scoreTeam:'L',
  fixed:{},GP:[{member_id:'juan',members:{full_name:'Juan'}}],
  GAME:{largos_score:190,cortos_score:150,status:'activa'},openGame:'game-finished',
  $:()=>({value:'15'}),nm:m=>m?.full_name||'',alert:m=>alerts.push(m),
  confirmVictoryChoice:async()=>{throw Error('Should not prompt for completed game')},
  sb:{from:()=>({select:()=>({eq:()=>({single:async()=>({data:{largos_score:205,cortos_score:150,status:'finalizada'},error:null})})})}),rpc:async(...args)=>{calls.push(args);return {error:null}}},
  Date,Number
 };
 vm.createContext(ctx);vm.runInContext(source,ctx);
 await ctx.addScore(null);
 assert.equal(calls.length,0);
 assert.ok(alerts.some(x=>x.includes('finalizada')));
});

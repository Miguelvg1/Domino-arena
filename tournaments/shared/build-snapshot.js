/* Build public, display-only tournament data from the isolated tournament model. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./tv-snapshot.js'):root.TitanesTvSnapshot);if(typeof module==='object'&&module.exports)module.exports=api;else root.TitanesBuildTvSnapshot=api;})(typeof globalThis!=='undefined'?globalThis:this,function(tv){
'use strict';
function build(state,updatedAt=new Date().toISOString()){
 if(!state||!Array.isArray(state.matches)||!Array.isArray(state.pairs))throw Error('Estado de torneo inválido');
 const pairs=new Map(state.pairs.map(p=>[p.id,p]));
 const pairPlayers=id=>{const pair=pairs.get(id);return pair?(pair.players||[]).slice(0,2).map(p=>({name:String(p.name||'Jugador').slice(0,40),photo:typeof p.photo==='string'&&p.photo.startsWith('data:image/jpeg;base64,')&&p.photo.length<=10000?p.photo:''})):[];};
 const name=id=>{const p=pairs.get(id);return p?p.players.map(x=>String(x.name||'').slice(0,40)).join(' / '):id?'Pareja pendiente':'Pase';};
 const matches=state.matches.filter(m=>m.type==='match').map((m,i)=>{
  const gameId=m.games||state.tables ? m.winner ? m.games?.at(-1)?.id : m.id+':partida-'+((m.games?.length||0)+1) : m.id;
  const events=state.events?.[gameId]||[];
  if(!m.pairA||!m.pairB||m.pairA===m.pairB)throw Error('Parejas del encuentro inválidas');
  const score=new Map([[m.pairA,0],[m.pairB,0]]);
  for(const e of events){if(e.matchId!==gameId)throw Error('Evento asignado a otro encuentro');if(e.voided)continue;if(!score.has(e.pairId)||!Number.isInteger(e.points)||e.points<1||e.points>250)throw Error('Historial de puntuación inválido');score.set(e.pairId,score.get(e.pairId)+e.points);}
  return {table:m.table||(i%(state.tables||32)+1),round:String(m.round||state.phase||'Eliminatoria'),teamA:name(m.pairA),teamB:name(m.pairB),teamAPlayers:pairPlayers(m.pairA),teamBPlayers:pairPlayers(m.pairB),scoreA:score.get(m.pairA),scoreB:score.get(m.pairB)};
 });
 const bracket=[...(state.completedMatches||[]),...state.matches].map(m=>({label:m.type==='bye'?'Pase: '+name(m.winner):name(m.pairA)+' vs '+name(m.pairB)+(m.winner?' · Ganó '+name(m.winner):'')}));
 const events=(Array.isArray(state.notifications)?state.notifications:[]).slice(-20).map((event,i)=>({id:String(event.id||'notice-'+i).slice(0,120),label:String(event.label||'').slice(0,200),points:Number.isSafeInteger(event.points)?event.points:0,table:Number.isInteger(event.table)?event.table:null,createdAt:String(event.createdAt||'').slice(0,40)}));
 const ranking=Array.isArray(state.leaderboard)?state.leaderboard:[];
 const mvp=ranking[0],pointsLeader=[...ranking].sort((a,b)=>Number(b.individualPoints||0)-Number(a.individualPoints||0)||Number(b.average||0)-Number(a.average||0))[0];
 const leaders={mvp:mvp?{name:String(mvp.name||'').slice(0,60),average:Number(mvp.average)||0}:null,points:pointsLeader?{name:String(pointsLeader.name||'').slice(0,60),value:Number(pointsLeader.individualPoints)||0}:null};
 return tv.validate({schemaVersion:1,tournament:String(state.name||'Torneo Titanes'),updatedAt,matches,bracket,events,leaders});
}
return {build};
});
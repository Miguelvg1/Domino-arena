/* Build public, display-only tournament data from the isolated tournament model. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./tv-snapshot.js'):root.TitanesTvSnapshot);if(typeof module==='object'&&module.exports)module.exports=api;else root.TitanesBuildTvSnapshot=api;})(typeof globalThis!=='undefined'?globalThis:this,function(tv){
'use strict';
function build(state,updatedAt=new Date().toISOString()){
 if(!state||!Array.isArray(state.matches)||!Array.isArray(state.pairs))throw Error('Estado de torneo inválido');
 const pairs=new Map(state.pairs.map(p=>[p.id,p]));
 const name=id=>{const p=pairs.get(id);return p? p.players.map(x=>String(x.name||'').slice(0,40)).join(' / '):id?'Pareja pendiente':'Pase';};
 const matches=state.matches.filter(m=>m.type==='match').map((m,i)=>{
  const events=state.events?.[m.id]||[];
  if(!m.pairA||!m.pairB||m.pairA===m.pairB)throw Error('Parejas del encuentro inválidas');
  const score=new Map([[m.pairA,0],[m.pairB,0]]);
  for(const e of events){if(e.matchId!==m.id||e.voided)continue;if(!score.has(e.pairId)||!Number.isInteger(e.points)||e.points<1||e.points>250)throw Error('Historial de puntuación inválido');score.set(e.pairId,score.get(e.pairId)+e.points);}
  return {table:i+1,round:String(m.round||state.phase||'Eliminatoria'),teamA:name(m.pairA),teamB:name(m.pairB),scoreA:score.get(m.pairA),scoreB:score.get(m.pairB)};
 });
 const bracket=state.matches.map(m=>({label:m.type==='bye'?'Pase: '+name(m.winner):name(m.pairA)+' vs '+name(m.pairB)+(m.winner?' · Ganó '+name(m.winner):'')}));
 return tv.validate({schemaVersion:1,tournament:String(state.name||'Torneo Titanes'),updatedAt,matches,bracket,events:[]});
}
return {build};
});
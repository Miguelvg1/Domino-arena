const assert=require('node:assert/strict');const t=require('./tournament-engine.js');
const players=Array.from({length:32},(_,i)=>({id:'p'+i,name:'Jugador '+i}));
const pairs=t.pairPlayers(players,()=>0.5);assert.equal(pairs.length,16);assert.equal(new Set(pairs.flatMap(p=>p.players.map(x=>x.id))).size,32);
let draw=t.matchesFromPairs(pairs,()=>0.5);assert.equal(draw.first.length,8);assert.equal(draw.byes,0);
let round=draw.first.map(m=>t.recordResult(m,m.pairA,'presidencia'));round=t.nextRound(round,'eliminatoria-2').map(m=>t.recordResult(m,m.pairA,'presidencia'));
const semi=t.nextRound(round,'semifinal');assert.equal(semi.length,2);const finished=semi.map(m=>t.recordResult(m,m.pairB,'presidencia'));const medals=t.medalMatches(finished);assert.notEqual(medals.final.pairA,medals.final.pairB);assert.notEqual(medals.third.pairA,medals.third.pairB);
assert.equal(t.matchesFromPairs(pairs.slice(0,13),()=>0.5).byes,3);assert.throws(()=>t.recordResult(semi[0],'unknown','presidencia'));assert.throws(()=>t.scheduleMatch(semi[0],'2026-12-13T17:00:00-04:00',null));assert.equal(t.scheduleMatch(semi[0],'2026-12-13T17:00:00-04:00','presidencia').scheduleApprovedBy,'presidencia');
for(const count of [4,5,6,7,8,9,13,16,17,24,32]){
 const entrants=Array.from({length:count},(_,i)=>({id:'team-'+i}));
 const opening=t.matchesFromPairs(entrants,()=>0.5);
 assert.equal(opening.first.length,2**Math.ceil(Math.log2(count))/2);
 assert.equal(opening.first.filter(m=>m.type==='bye').length,opening.byes);
 let current=opening.first.map(m=>m.type==='bye'?m:t.recordResult(m,m.pairA,'presidencia'));
 while(current.length>2){current=t.nextRound(current,'round-'+current.length).map(m=>t.recordResult(m,m.pairA,'presidencia'));}
 const medal=t.medalMatches(current);
 const distinct=[medal.final.pairA,medal.final.pairB,medal.third.pairA,medal.third.pairB];
 assert.equal(new Set(distinct).size,4,'Finalistas y terceros no deben repetirse');
}
console.log('Tournament engine checks passed');
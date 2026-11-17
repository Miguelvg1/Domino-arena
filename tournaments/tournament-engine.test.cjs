const assert=require('node:assert/strict');const t=require('./tournament-engine.js');
const players=Array.from({length:32},(_,i)=>({id:'p'+i,name:'Jugador '+i}));
const pairs=t.pairPlayers(players,()=>0.5);assert.equal(pairs.length,16);assert.equal(new Set(pairs.flatMap(p=>p.players.map(x=>x.id))).size,32);
let draw=t.matchesFromPairs(pairs,()=>0.5);assert.equal(draw.first.length,8);assert.equal(draw.byes,0);
let round=draw.first.map(m=>t.recordResult(m,m.pairA,'presidencia'));round=t.nextRound(round,'eliminatoria-2').map(m=>t.recordResult(m,m.pairA,'presidencia'));
const semi=t.nextRound(round,'semifinal');assert.equal(semi.length,2);const finished=semi.map(m=>t.recordResult(m,m.pairB,'presidencia'));const medals=t.medalMatches(finished);assert.notEqual(medals.final.pairA,medals.final.pairB);assert.notEqual(medals.third.pairA,medals.third.pairB);
assert.equal(t.matchesFromPairs(pairs.slice(0,13),()=>0.5).byes,3);assert.throws(()=>t.recordResult(semi[0],'unknown','presidencia'));assert.throws(()=>t.scheduleMatch(semi[0],'2026-12-13T17:00:00-04:00',null));assert.equal(t.scheduleMatch(semi[0],'2026-12-13T17:00:00-04:00','presidencia').scheduleApprovedBy,'presidencia');
console.log('Tournament engine checks passed');
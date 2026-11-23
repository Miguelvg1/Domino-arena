/* Tournament bracket engine. Pure functions; no production tables, permissions or network writes. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TitanesTournament=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function assert(condition,message){if(!condition)throw new Error(message);}
function shuffle(input,random=Math.random){const arr=[...input];for(let i=arr.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}return arr;}
function plan(count){assert(Number.isInteger(count)&&count>=4,'Se requieren al menos cuatro parejas');const target=4;const preliminary=count>target?Math.max(0,count-2**Math.floor(Math.log2(count))):0;const firstRoundSize=2**Math.floor(Math.log2(count));const byes=firstRoundSize-preliminary;return {entrants:count,preliminaryMatches:preliminary,preliminaryByes:count-2*preliminary,firstRoundSize,firstRoundMatches:firstRoundSize/2,semifinalists:4,notes:count===16?'Dos eliminatorias completas y semifinales': 'El formato exacto de dos eliminatorias requiere aprobación de pases o rondas preliminares'};}
function pairPlayers(players,random=Math.random){assert(Array.isArray(players)&&players.length>=8&&players.length%2===0,'Se requiere un número par de jugadores, al menos ocho');const ids=players.map(p=>p.id);assert(ids.every(Boolean)&&new Set(ids).size===ids.length,'Jugadores duplicados o sin identificador');const mixed=shuffle(players,random),pairs=[];for(let i=0;i<mixed.length;i+=2)pairs.push({id:'pair-'+(i/2+1),players:[mixed[i],mixed[i+1]]});return pairs;}
function roundName(slots){
 return {2:'Semifinales',4:'Cuartos',8:'Octavos',16:'Dieciseisavos'}[slots]||'Ronda de '+2*slots+' parejas';
}
function matchesFromPairs(pairs,random=Math.random){
 assert(Array.isArray(pairs)&&pairs.length>=4,'Se requieren al menos cuatro parejas');
 const ids=pairs.map(p=>p.id);
 assert(ids.every(Boolean)&&new Set(ids).size===ids.length,'Parejas duplicadas');
 const mixed=shuffle(pairs,random);
 const slots=2**Math.ceil(Math.log2(mixed.length))/2;
 const byes=2*slots-mixed.length;
 const round=roundName(slots);
 const first=Array(slots);
 const matchCount=slots-byes;
 for(let i=0;i<slots;i++){
  const position=i<slots/2 ? i*2 : (i-slots/2)*2+1;
  if(i<matchCount){
   const offset=byes+i*2;
   first[position]={id:'match-'+(i+1),type:'match',round,pairA:mixed[offset].id,pairB:mixed[offset+1].id,winner:null,status:'pending',scheduledAt:null};
  }else{
   const number=i-matchCount;
   const pairA=mixed[number].id;
   first[position]={id:'bye-'+(number+1),type:'bye',round,pairA,pairB:null,winner:pairA,status:'advanced'};
  }
 }
 return {entrants:mixed.length,byes,first,approvalRequired:byes>0};
}
function recordResult(match,winner,approvedBy){assert(match&&match.type==='match','El encuentro debe ser disputado');assert(match.status!=='finished','El resultado ya fue cerrado');assert(winner===match.pairA||winner===match.pairB,'La pareja ganadora no pertenece al encuentro');assert(approvedBy,'Se requiere validación del organizador');return {...match,winner,status:'finished',approvedBy};}
function scheduleMatch(match,isoTime,approvedBy){assert(match&&match.type==='match','Encuentro inválido');assert(!match.winner,'No se programa un encuentro cerrado');assert(approvedBy,'Presidencia debe aprobar el horario');const dt=new Date(isoTime);assert(Number.isFinite(dt.getTime()),'Horario inválido');return {...match,scheduledAt:dt.toISOString(),scheduleApprovedBy:approvedBy};}
function nextRound(matches,roundName){assert(matches.length>0&&matches.every(m=>m.winner),'Faltan resultados confirmados');const winners=matches.map(m=>m.winner);assert(winners.length%2===0,'Cantidad impar: se requiere resolución aprobada');return Array.from({length:winners.length/2},(_,i)=>({id:roundName+'-'+(i+1),type:'match',round:roundName,pairA:winners[i*2],pairB:winners[i*2+1],winner:null,status:'pending',scheduledAt:null}));}
function medalMatches(semifinals){assert(semifinals.length===2&&semifinals.every(m=>m.winner),'Deben finalizar ambas semifinales');const losers=semifinals.map(m=>m.winner===m.pairA?m.pairB:m.pairA);return {final:{id:'final',type:'match',pairA:semifinals[0].winner,pairB:semifinals[1].winner,winner:null,status:'pending'},third:{id:'third',type:'match',pairA:losers[0],pairB:losers[1],winner:null,status:'pending'}};}
return {roundName,plan,pairPlayers,matchesFromPairs,recordResult,scheduleMatch,nextRound,medalMatches};
});
/* Tournament scoring mirrors Titanes points and adjusted average; isolated from production writes. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TitanesTournamentScoring=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const TARGET=200;
const POINT_TYPES=Object.freeze({normal:{label:'Puntos manuales',points:null},dominada:{label:'Dominada',points:30},multa:{label:'Multa',points:30},capicua:{label:'Capicúa',points:30},paso_corrido:{label:'Paso corrido',points:30},paso_salida_doble:{label:'Salida doble',points:30},dos_carotas:{label:'Salida a dos caritas',points:60},chivo:{label:'Chivo',points:100},pase_con_ficha:{label:'Pase con ficha',points:100}});
const RESPONSIBLE_TYPES=new Set(['multa','chivo','pase_con_ficha']);
function requireMatch(match){if(!match||!match.id||!match.pairA||!match.pairB||match.pairA===match.pairB)throw Error('Encuentro inválido');}
function validPoints(points){return Number.isInteger(points)&&points>=1&&points<=250;}
function pointsFor(reason){if(!Object.hasOwn(POINT_TYPES,reason))throw Error('Causa de anotación inválida');return POINT_TYPES[reason].points;}
function score(match,events=[]){requireMatch(match);const total={[match.pairA]:0,[match.pairB]:0};for(const e of events){if(e.matchId!==match.id)throw Error('Anotación de otro encuentro');if(e.voided)continue;if(!Object.hasOwn(total,e.pairId)||!validPoints(e.points))throw Error('Anotación inválida');total[e.pairId]+=e.points;}return total;}
function add(match,events,pairId,points,reason,actor,responsiblePlayerId=null){
 requireMatch(match);if(match.status==='finished'||match.winner)throw Error('Encuentro cerrado');if(pairId!==match.pairA&&pairId!==match.pairB)throw Error('Pareja incorrecta');
 if(!validPoints(points))throw Error('Los puntos deben estar entre 1 y 250');if(!actor)throw Error('Se requiere anotador identificado');if(!Array.isArray(events))throw Error('Historial inválido');
 const expected=pointsFor(reason);if(expected!==null&&expected!==points)throw Error(POINT_TYPES[reason].label+' debe sumar '+expected+' puntos');
 if(RESPONSIBLE_TYPES.has(reason)&&!responsiblePlayerId)throw Error('Selecciona el jugador responsable');
 const current=score(match,events);if(Math.max(...Object.values(current))>=TARGET)throw Error('Partida llegó a 200: confirmar cierre antes de seguir');
 const id='event-'+(events.length+1);return [...events,{id,matchId:match.id,pairId,points,reason,actor,responsiblePlayerId:RESPONSIBLE_TYPES.has(reason)?responsiblePlayerId:null,createdAt:new Date().toISOString(),voided:false}];
}
function voidEvent(match,events,eventId,actor,reason){if(match.status==='finished'||match.winner)throw Error('Encuentro cerrado');if(!actor||!String(reason||'').trim())throw Error('Corrección requiere responsable y motivo');if(!events.some(e=>e.id===eventId&&!e.voided))throw Error('Anotación no encontrada o ya anulada');return events.map(e=>e.id===eventId?{...e,voided:true,voidedBy:actor,voidReason:String(reason).slice(0,120)}:e);}
function finish(match,events,actor){if(match.status==='finished'||match.winner)throw Error('Ya cerrado');if(!actor)throw Error('Confirmación requerida');const totals=score(match,events);const a=totals[match.pairA],b=totals[match.pairB];if(Math.max(a,b)<TARGET)throw Error('Ninguna pareja llegó a 200');if(a===b)throw Error('Empate: revisar anotaciones');return {...match,status:'finished',winner:a>b?match.pairA:match.pairB,finalScores:totals,approvedBy:actor};}
function rankPlayers(matches,pairs,eventsByMatch={}){
 const teams=new Map((pairs||[]).map(pair=>[pair.id,pair])),players=new Map();
 for(const pair of pairs||[])for(const player of pair.players||[])if(player&&player.id&&!players.has(player.id))players.set(player.id,{id:player.id,name:String(player.name||'Jugador'),photo:player.photo||'',gamesPlayed:0,gamesWon:0,gamesLost:0,individualPoints:0,multas:0,chivos:0,pasesConFicha:0,lizaWins:0,lizaLosses:0});
 for(const match of matches||[]){
  if(!match||match.type!=='match'||!match.winner)continue;requireMatch(match);const totals=score(match,eventsByMatch[match.id]||[]);
  if(match.winner!==match.pairA&&match.winner!==match.pairB)throw Error('Ganador inválido en torneo');
  for(const pairId of [match.pairA,match.pairB]){const pair=teams.get(pairId);if(!pair)continue;for(const player of pair.players||[]){const stat=players.get(player.id);if(!stat)continue;stat.gamesPlayed++;if(pairId===match.winner)stat.gamesWon++;else stat.gamesLost++;stat.individualPoints+=totals[pairId]/2;}}
  const loser=match.winner===match.pairA?match.pairB:match.pairA;
  const validEvents=(eventsByMatch[match.id]||[]).filter(event=>!event.voided);
  if(totals[match.winner]>=TARGET&&validEvents.length&&!validEvents.some(event=>event.pairId===loser&&['normal','dominada'].includes(event.reason))){
   for(const player of teams.get(match.winner)?.players||[])players.get(player.id).lizaWins++;
   for(const player of teams.get(loser)?.players||[])players.get(player.id).lizaLosses++;
  }
  for(const event of eventsByMatch[match.id]||[]){if(event.voided||!event.responsiblePlayerId)continue;const stat=players.get(event.responsiblePlayerId);if(!stat)continue;if(event.reason==='multa')stat.multas++;if(event.reason==='chivo')stat.chivos++;if(event.reason==='pase_con_ficha')stat.pasesConFicha++;}
 }
 return [...players.values()].filter(x=>x.gamesPlayed>0).map(x=>{const rawWinPct=100*x.gamesWon/x.gamesPlayed,penaltyFactor=Math.pow(.97,x.multas)*Math.pow(.90,x.chivos+x.pasesConFicha),bonusFactor=Math.pow(1.05,x.lizaWins);return {...x,rawWinPct:Math.round(rawWinPct*100)/100,penaltyFactor:Math.round(penaltyFactor*1e6)/1e6,average:Math.round(rawWinPct*penaltyFactor*bonusFactor*100)/100,individualPoints:Math.round(x.individualPoints*100)/100};}).sort((a,b)=>b.average-a.average||b.gamesWon-a.gamesWon||b.individualPoints-a.individualPoints||a.gamesLost-b.gamesLost||a.name.localeCompare(b.name,'es'));
}
return {TARGET,POINT_TYPES,RESPONSIBLE_TYPES,pointsFor,score,add,voidEvent,finish,rankPlayers};
});

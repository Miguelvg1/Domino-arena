/* Independent tournament scoring. Isolated from daily matches and production writes. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TitanesTournamentScoring=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const TARGET=200;
const POINT_TYPES=Object.freeze({
 normal:{label:'Puntos manuales',points:null},
 dominada:{label:'Dominada',points:30},
 multa:{label:'Multa',points:30},
 capicua:{label:'Capicúa',points:30},
 paso_corrido:{label:'Paso corrido',points:30},
 paso_salida_doble:{label:'Salida doble',points:30},
 dos_carotas:{label:'Salida a dos caritas',points:60},
 chivo:{label:'Chivo',points:100},
 pase_con_ficha:{label:'Pase con ficha',points:100}
});
function requireMatch(match){if(!match||!match.id||!match.pairA||!match.pairB||match.pairA===match.pairB)throw Error('Encuentro inválido');}
function validPoints(points){return Number.isInteger(points)&&points>=1&&points<=250;}
function pointsFor(reason){if(!Object.hasOwn(POINT_TYPES,reason))throw Error('Causa de anotación inválida');return POINT_TYPES[reason].points;}
function score(match,events=[]){requireMatch(match);const total={[match.pairA]:0,[match.pairB]:0};for(const e of events){if(e.matchId!==match.id)throw Error('Anotación de otro encuentro');if(e.voided)continue;if(!Object.hasOwn(total,e.pairId)||!validPoints(e.points))throw Error('Anotación inválida');total[e.pairId]+=e.points;}return total;}
function add(match,events,pairId,points,reason,actor){
 requireMatch(match);if(match.status==='finished')throw Error('Encuentro cerrado');if(pairId!==match.pairA&&pairId!==match.pairB)throw Error('Pareja incorrecta');
 if(!validPoints(points))throw Error('Los puntos deben estar entre 1 y 250');if(!actor)throw Error('Se requiere anotador identificado');if(!Array.isArray(events))throw Error('Historial inválido');
 const expected=pointsFor(reason);if(expected!==null&&expected!==points)throw Error(POINT_TYPES[reason].label+' debe sumar '+expected+' puntos');
 const current=score(match,events);if(Math.max(...Object.values(current))>=TARGET)throw Error('Partida llegó a 200: confirmar cierre antes de seguir');
 const id='event-'+(events.length+1);return [...events,{id,matchId:match.id,pairId,points,reason,actor,createdAt:new Date().toISOString(),voided:false}];
}
function voidEvent(match,events,eventId,actor,reason){if(match.status==='finished')throw Error('Encuentro cerrado');if(!actor||!String(reason||'').trim())throw Error('Corrección requiere responsable y motivo');if(!events.some(e=>e.id===eventId&&!e.voided))throw Error('Anotación no encontrada o ya anulada');return events.map(e=>e.id===eventId?{...e,voided:true,voidedBy:actor,voidReason:String(reason).slice(0,120)}:e);}
function finish(match,events,actor){if(match.status==='finished')throw Error('Ya cerrado');if(!actor)throw Error('Confirmación requerida');const totals=score(match,events);const a=totals[match.pairA],b=totals[match.pairB];if(Math.max(a,b)<TARGET)throw Error('Ninguna pareja llegó a 200');if(a===b)throw Error('Empate: revisar anotaciones');return {...match,status:'finished',winner:a>b?match.pairA:match.pairB,finalScores:totals,approvedBy:actor};}
return {TARGET,POINT_TYPES,pointsFor,score,add,voidEvent,finish};
});
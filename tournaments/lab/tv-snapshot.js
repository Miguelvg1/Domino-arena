/* Public TV snapshot validator; only display-safe tournament fields. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TitanesTvSnapshot=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function text(v,max=100){return typeof v==='string'?v.slice(0,max):'';}
function score(v){return Number.isSafeInteger(v)&&v>=0&&v<=10000?v:0;}
function tableNumber(v,fallback){return Number.isInteger(v)&&v>=1&&v<=100?v:fallback;}
function safeArray(v,max){return Array.isArray(v)?v.slice(0,max):[];}
function validate(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Formato de marcador inválido');
 if(input.schemaVersion!==1)throw Error('Versión de marcador no compatible');
 if(!Array.isArray(input.matches))throw Error('Faltan los encuentros');
 return {schemaVersion:1,tournament:text(input.tournament,120),updatedAt:text(input.updatedAt,40),
 matches:safeArray(input.matches,32).map((m,i)=>({table:tableNumber(m?.table,i+1),round:text(m?.round,50),teamA:text(m?.teamA,90),teamB:text(m?.teamB,90),scoreA:score(m?.scoreA),scoreB:score(m?.scoreB)})),
 events:safeArray(input.events,20).map(e=>({label:text(e?.label,140),points:score(e?.points)})),
 bracket:safeArray(input.bracket,40).map(b=>typeof b==='string'?text(b,140):{label:text(b?.label,140)})};
}
return {validate};
});
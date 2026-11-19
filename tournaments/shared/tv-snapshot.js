/* Public TV snapshot validator; only display-safe tournament fields. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TitanesTvSnapshot=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function text(v,max=100){return typeof v==='string'?v.slice(0,max):'';}
function score(v){return Number.isSafeInteger(v)&&v>=0&&v<=10000?v:0;}
function tableNumber(v,fallback){return Number.isInteger(v)&&v>=1&&v<=100?v:fallback;}
function safeArray(v,max){return Array.isArray(v)?v.slice(0,max):[];}
function photo(v){return typeof v==='string'&&v.length<=10000&&/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(v)?v:'';}
function people(v){return safeArray(v,2).map(p=>({name:text(p?.name,40),photo:photo(p?.photo)}));}
function numeric(v){return typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=100000?Math.round(v*100)/100:0;}
function validate(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Formato de marcador inválido');
 if(input.schemaVersion!==1)throw Error('Versión de marcador no compatible');
 if(!Array.isArray(input.matches))throw Error('Faltan los encuentros');
 const leaders=input.leaders&&typeof input.leaders==='object'?input.leaders:{};
 return {schemaVersion:1,tournament:text(input.tournament,120),updatedAt:text(input.updatedAt,40),
 matches:safeArray(input.matches,32).map((m,i)=>({table:tableNumber(m?.table,i+1),round:text(m?.round,50),teamA:text(m?.teamA,90),teamB:text(m?.teamB,90),teamAPlayers:people(m?.teamAPlayers),teamBPlayers:people(m?.teamBPlayers),scoreA:score(m?.scoreA),scoreB:score(m?.scoreB)})),
 events:safeArray(input.events,20).map((e,i)=>({id:text(e?.id,120)||'legacy-'+i,label:text(e?.label,200),points:score(e?.points),table:Number.isInteger(e?.table)?tableNumber(e.table,1):null,createdAt:text(e?.createdAt,40)})),
 bracket:safeArray(input.bracket,40).map(b=>typeof b==='string'?text(b,140):{label:text(b?.label,140)}),
 leaders:{mvp:leaders.mvp&&typeof leaders.mvp==='object'?{name:text(leaders.mvp.name,60),average:numeric(leaders.mvp.average)}:null,points:leaders.points&&typeof leaders.points==='object'?{name:text(leaders.points.name,60),value:numeric(leaders.points.value)}:null}};
}
return {validate};
});
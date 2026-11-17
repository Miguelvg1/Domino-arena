/* Isolated mobile tournament laboratory. Local memory only; no network or production writes. */
(function(){
'use strict';
const engine=window.TitanesTournament;
const state={players:[],pairs:[],matches:[],round:1};
const el=id=>document.getElementById(id);
const element=(tag,text)=>{const x=document.createElement(tag);if(text!==undefined)x.textContent=String(text);return x;};
function notify(msg){el('message').textContent=msg;}
function playerName(id){return state.players.find(p=>p.id===id)?.name||id;}
function pairName(id){const pair=state.pairs.find(p=>p.id===id);return pair?pair.players.map(p=>p.name).join(' / '):id;}
function show(){
 el('count').textContent=state.players.length+' jugadores inscritos';el('draw').disabled=state.players.length<8||state.players.length%2!==0||state.pairs.length>0;
 const players=el('players');players.replaceChildren(...state.players.map(p=>element('li',p.name)));
 const pairs=el('pairs');pairs.replaceChildren(...state.pairs.map(p=>element('li',p.players.map(x=>x.name).join(' / '))));
 const matches=el('matches');matches.replaceChildren();
 for(const match of state.matches){
 const card=element('article');card.className='match';
 card.append(element('strong',match.type==='bye'?'Pase automático':'Encuentro '+match.id));
 card.append(element('div',pairName(match.pairA)+' vs '+(match.pairB?pairName(match.pairB):'Pase')));
 if(match.type==='match'&&!match.winner){
  for(const id of [match.pairA,match.pairB]){const btn=element('button','Ganó '+pairName(id));btn.addEventListener('click',()=>{if(!window.confirm('¿Confirmas el resultado del encuentro?'))return;try{const updated=engine.recordResult(match,id,'organizador-demo');state.matches=state.matches.map(m=>m.id===match.id?updated:m);show();}catch(err){notify(err.message);}});card.append(btn);}
 }else{const status=element('p','Avanza: '+pairName(match.winner));status.className='success';card.append(status);}
 matches.append(card);
 }
 if(state.matches.length&&state.matches.every(m=>m.winner)&&state.matches.filter(m=>m.type==='match').length){
 const next=element('button','Preparar siguiente ronda');
 next.addEventListener('click',()=>{try{if(state.matches.length===2){const finals=engine.medalMatches(state.matches);state.matches=[finals.final,finals.third];notify('Final y tercer lugar preparados.');}else if(state.matches.length===1){notify('El torneo ha terminado.');return;}else{state.round++;state.matches=engine.nextRound(state.matches,'ronda-'+state.round);notify('Siguiente ronda preparada.');}show();}catch(err){notify(err.message);}});
 matches.append(next);
 }
}
el('register').addEventListener('submit',event=>{event.preventDefault();if(state.pairs.length){notify('Reinicia el laboratorio para modificar inscritos.');return;}const name=el('name').value.trim();if(name.length<2)return;if(state.players.some(p=>p.name.toLocaleLowerCase('es')===name.toLocaleLowerCase('es'))){notify('Ese nombre ya está inscrito.');return;}state.players.push({id:'player-'+(state.players.length+1),name});el('name').value='';notify('Jugador agregado.');show();});
el('draw').addEventListener('click',()=>{try{state.pairs=engine.pairPlayers(state.players);const draw=engine.matchesFromPairs(state.pairs);state.matches=draw.first;notify(draw.byes?'Sorteo listo: '+draw.byes+' pases automáticos (pendientes de aprobación real).':'Sorteo realizado.');show();}catch(err){notify(err.message);}});
el('reset').addEventListener('click',()=>{if(!window.confirm('¿Borrar los datos de este laboratorio?'))return;state.players=[];state.pairs=[];state.matches=[];state.round=1;notify('Laboratorio reiniciado.');show();});
show();
})();
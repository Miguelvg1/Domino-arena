/* Isolated mobile tournament laboratory. Local memory only; no network or production writes. */
(function(){
'use strict';
const engine=window.TitanesTournament;
const scoring=window.TitanesTournamentScoring;
const state={players:[],pairs:[],matches:[],events:{},round:1,phase:'registration',champion:null};
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
  const history=state.events[match.id]||[];
  const totals=scoring.score(match,history);
  card.append(element('p',pairName(match.pairA)+': '+totals[match.pairA]+' | '+pairName(match.pairB)+': '+totals[match.pairB]));
  if(Math.max(...Object.values(totals))>=200){
    const close=element('button','Confirmar cierre a 200');
    close.addEventListener('click',()=>{if(!window.confirm('¿Confirmar el resultado final del encuentro?'))return;try{const updated=scoring.finish(match,history,'organizador-demo');state.matches=state.matches.map(m=>m.id===match.id?updated:m);notify('Encuentro cerrado.');show();}catch(err){notify(err.message);}});
    card.append(close);
  }else{
    for(const id of [match.pairA,match.pairB]){
      const form=element('form');form.style.display='flex';form.style.flexWrap='wrap';form.style.alignItems='center';
      form.append(element('span',pairName(id)+' '));
      const input=element('input');input.type='number';input.min='1';input.max='250';input.step='1';input.required=true;input.placeholder='Puntos';input.style.maxWidth='110px';form.append(input);
      const reason=element('select');for(const value of ['Manual','Dominada','Multa','Paso corrido','Capicúa','Chivo','Pase con ficha','Salida doble','Salida a dos caritas']){const opt=element('option',value);opt.value=value;reason.append(opt);}form.append(reason);
      const btn=element('button','Anotar');btn.type='submit';form.append(btn);
      form.addEventListener('submit',e=>{e.preventDefault();try{state.events[match.id]=scoring.add(match,state.events[match.id]||[],id,Number(input.value),reason.value,'anotador-demo');notify('Puntos anotados en torneo (solo laboratorio).');show();}catch(err){notify(err.message);}});card.append(form);
    }
    const active=history.filter(e=>!e.voided);
    if(active.length){const latest=active[active.length-1];const correction=element('button','Anular última anotación ('+latest.points+')');correction.className='secondary';correction.addEventListener('click',()=>{const reason=window.prompt('Motivo obligatorio de corrección:');if(reason===null)return;try{state.events[match.id]=scoring.voidEvent(match,history,latest.id,'organizador-demo',reason);notify('Anotación anulada; se conserva el historial.');show();}catch(err){notify(err.message);}});card.append(correction);}
  }
 }else{const status=element('p','Avanza: '+pairName(match.winner));status.className='success';card.append(status);}

 matches.append(card);
 }
 if(state.phase==='medals'&&state.matches.length===2&&state.matches.every(m=>m.winner)){
  const result=element('section');result.className='success';result.append(element('h2','🏆 Campeones: '+pairName(state.matches[0].winner)));result.append(element('p','🥈 Subcampeones: '+pairName(state.matches[0].winner===state.matches[0].pairA?state.matches[0].pairB:state.matches[0].pairA)));result.append(element('p','🥉 Tercer lugar: '+pairName(state.matches[1].winner)));matches.append(result);
 }
 if(state.phase!=='medals'&&state.matches.length&&state.matches.every(m=>m.winner)&&state.matches.filter(m=>m.type==='match').length){
 const next=element('button','Preparar siguiente ronda');
 next.addEventListener('click',()=>{try{
   if(state.matches.length===2){
    const finals=engine.medalMatches(state.matches);state.matches=[finals.final,finals.third];state.phase='medals';notify('Final y tercer lugar preparados.');
   }else{
    state.round++;state.matches=engine.nextRound(state.matches,'ronda-'+state.round);state.phase='elimination';notify('Siguiente ronda preparada.');
   }show();
  }catch(err){notify(err.message);}});
 matches.append(next);
 }
}
el('register').addEventListener('submit',event=>{event.preventDefault();if(state.pairs.length){notify('Reinicia el laboratorio para modificar inscritos.');return;}const name=el('name').value.trim();if(name.length<2)return;if(state.players.some(p=>p.name.toLocaleLowerCase('es')===name.toLocaleLowerCase('es'))){notify('Ese nombre ya está inscrito.');return;}state.players.push({id:'player-'+(state.players.length+1),name});el('name').value='';notify('Jugador agregado.');show();});
el('draw').addEventListener('click',()=>{try{state.pairs=engine.pairPlayers(state.players);const draw=engine.matchesFromPairs(state.pairs);state.matches=draw.first;state.phase='elimination';notify(draw.byes?'Sorteo listo: '+draw.byes+' pases automáticos (pendientes de aprobación real).':'Sorteo realizado.');show();}catch(err){notify(err.message);}});
el('reset').addEventListener('click',()=>{if(!window.confirm('¿Borrar los datos de este laboratorio?'))return;state.players=[];state.pairs=[];state.matches=[];state.events={};state.round=1;state.phase='registration';state.champion=null;notify('Laboratorio reiniciado.');show();});
show();
})();
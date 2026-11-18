/* Tournament laboratory mirrors Titanes scoring while remaining isolated from production. */
(function(){
'use strict';
const engine=window.TitanesTournament,scoring=window.TitanesTournamentScoring;
const preview=window.TitanesLocalPreviewSync.create(()=>{});
const STORAGE_KEY='titanes_tournament_lab_v1';
const TV_VIEWER_BASE='https://titanes-domino-app-v21-git-feature-to-4570ea-titanes-domino-app.vercel.app/tournaments/tv-preview/index.html';
const remote=window.TitanesRemoteTournamentSync.create({
 baseUrl:'https://ybtdxjqodcjoccyuauzv.supabase.co/functions/v1/tournament-tv-sync',
 getAccessToken:async()=>{if(!window.TitanesTournamentAuth)await new Promise(resolve=>window.addEventListener('titanes-auth-ready',resolve,{once:true}));return window.TitanesTournamentAuth.getAccessToken();},
 onStatus:(status,detail)=>{const box=el('remote-status');if(!box)return;box.textContent=status==='updated'?'✅ En TV · revisión '+detail:'⚠ Sin sincronizar · '+detail;}
});
const DEFAULT_STATE={name:'Torneo Titanes',players:[],pairs:[],matches:[],completedMatches:[],leaderboard:[],events:{},notifications:[],round:1,phase:'registration',champion:null,remoteTournamentId:null,remoteRevision:0};
const state=(()=>{try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');if(saved&&Array.isArray(saved.players)&&Array.isArray(saved.pairs)&&Array.isArray(saved.matches)&&saved.events&&typeof saved.events==='object')return {...DEFAULT_STATE,...saved};}catch(_){}return {...DEFAULT_STATE};})();
function persistState(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch(error){console.warn('No se pudo guardar el torneo en este dispositivo:',error);}}
const el=id=>document.getElementById(id);
const element=(tag,text)=>{const x=document.createElement(tag);if(text!==undefined)x.textContent=String(text);return x;};
function notify(msg){el('message').textContent=msg;}
function pairName(id){const pair=state.pairs.find(p=>p.id===id);return pair?pair.players.map(p=>p.name).join(' / '):id;}
function archiveRound(){state.completedMatches=state.completedMatches||[];for(const match of state.matches){if(match.type==='match'&&match.winner&&!state.completedMatches.some(saved=>saved.id===match.id))state.completedMatches.push(match);}}
function notify200(pairId){notify('¡'+pairName(pairId)+' llegó a 200! Confirma el cierre del encuentro.');try{if(navigator.vibrate)navigator.vibrate([140,70,140]);}catch(_){}}
function makeScoreForm(match,pairId){
 const form=element('form');form.className='score-form';
 const name=element('span',pairName(pairId));name.className='score-form-name';form.append(name);
 const kind=element('select');kind.setAttribute('aria-label','Tipo de anotación para '+pairName(pairId));
 Object.entries(scoring.POINT_TYPES).forEach(([key,type])=>{const option=element('option');option.value=key;option.textContent=type.label+(type.points?' +'+type.points:' (1–250)');kind.append(option);});
 form.append(kind);
 const input=element('input');input.type='number';input.min='1';input.max='250';input.step='1';input.required=true;input.placeholder='Puntos';input.setAttribute('aria-label','Cantidad de puntos');form.append(input);
 const responsible=element('select');responsible.className='responsible-player';responsible.setAttribute('aria-label','Jugador responsable del chivo, pase o multa');
 const updateResponsible=()=>{const required=scoring.RESPONSIBLE_TYPES.has(kind.value);responsible.hidden=!required;responsible.required=required;responsible.replaceChildren();const placeholder=element('option','Selecciona quién cometió la falta');placeholder.value='';responsible.append(placeholder);const opponentId=pairId===match.pairA?match.pairB:match.pairA;const opponent=state.pairs.find(p=>p.id===opponentId);for(const player of opponent?.players||[]){const option=element('option',player.name);option.value=player.id;responsible.append(option);}};
 form.append(responsible);
 const updateInput=()=>{const value=scoring.pointsFor(kind.value);const manual=value===null;input.readOnly=!manual;input.value=manual?'':String(value);input.placeholder=manual?'Puntos (1–250)':'Puntos fijos';input.classList.toggle('fixed-points',!manual);updateResponsible();};
 kind.addEventListener('change',updateInput);updateInput();
 const submit=element('button','Anotar puntos');submit.type='submit';form.append(submit);
 form.addEventListener('submit',event=>{
  event.preventDefault();
  try{
   const before=scoring.score(match,state.events[match.id]||[]),points=scoring.pointsFor(kind.value)??Number(input.value);
   const responsiblePlayerId=responsible.hidden?null:responsible.value;
   state.events[match.id]=scoring.add(match,state.events[match.id]||[],pairId,points,kind.value,'organizador-local',responsiblePlayerId);
   const after=scoring.score(match,state.events[match.id]),tableNumber=state.matches.filter(m=>m.type==='match').findIndex(m=>m.id===match.id)+1;
   const cause=scoring.POINT_TYPES[kind.value].label,offender=state.players.find(p=>p.id===responsiblePlayerId);
   let notice='Liza actualizada en Mesa '+tableNumber+': '+pairName(pairId)+' anotó '+points+' puntos por '+cause+'. Marcador '+after[match.pairA]+' a '+after[match.pairB]+'.';
   if(kind.value==='chivo')notice='¡CHIVO! '+(offender?.name||'Jugador sin identificar')+' cometió chivo. +100 puntos para '+pairName(pairId)+'. Marcador '+after[match.pairA]+' a '+after[match.pairB]+'.';
   if(kind.value==='pase_con_ficha')notice='¡WOW, QUÉ DIFÍCIL! '+(offender?.name||'Jugador sin identificar')+' pasó con ficha. +100 puntos para '+pairName(pairId)+'. Marcador '+after[match.pairA]+' a '+after[match.pairB]+'.';
   if(kind.value==='multa')notice='¡MULTA! '+(offender?.name||'Jugador sin identificar')+' cometió una multa. +30 puntos para '+pairName(pairId)+'. Marcador '+after[match.pairA]+' a '+after[match.pairB]+'.';
   const annotation=state.events[match.id][state.events[match.id].length-1];
   state.notifications.push({id:match.id+':'+annotation.id,label:notice,points,table:tableNumber,createdAt:annotation.createdAt});
   if(state.notifications.length>20)state.notifications=state.notifications.slice(-20);
   const hit=[match.pairA,match.pairB].find(id=>before[id]<scoring.TARGET&&after[id]>=scoring.TARGET);
   if(hit){notify200(hit);state.notifications[state.notifications.length-1].label+=' '+pairName(hit)+' llegó a 200; cierre pendiente de confirmación.';}else notify(notice);
   show();
  }catch(error){notify(error.message);}
 });
 return form;
}
function remoteEndpoint(){return 'https://ybtdxjqodcjoccyuauzv.supabase.co/functions/v1/tournament-tv-sync/'+state.remoteTournamentId;}
function renderTvLink(){
 const link=el('tv-link'),copy=el('copy-tv-link'),status=el('remote-status');
 if(!link||!copy||!state.remoteTournamentId)return;
 const url=new URL(TV_VIEWER_BASE);url.searchParams.set('endpoint',remoteEndpoint());link.href=url.href;link.hidden=false;copy.hidden=false;
 if(!state.remoteRevision&&status)status.textContent='Preparando transmisión segura…';
}
el('connect-tv').addEventListener('click',async()=>{
 try{
  if(!state.matches.some(match=>match.type==='match')){notify('Primero sortea las parejas y prepara los encuentros.');return;}
  if(!state.remoteTournamentId){state.remoteTournamentId=crypto.randomUUID().replace(/-/g,'');state.remoteRevision=0;persistState();}
  el('remote-status').textContent='Conectando con la cuenta de Presidencia o directiva…';
  const snapshot=window.TitanesBuildTvSnapshot.build(state);
  const revision=await remote.publish(state.remoteTournamentId,snapshot,Number(state.remoteRevision)||0);
  state.remoteRevision=revision;persistState();renderTvLink();notify('Torneo transmitiéndose en vivo. Comparte el enlace de la pantalla TV.');
 }catch(error){el('remote-status').textContent='No se pudo conectar · '+error.message;}
});
el('copy-tv-link').addEventListener('click',async()=>{
 try{await navigator.clipboard.writeText(el('tv-link').href);notify('Enlace de TV copiado. Envíalo o ábrelo en el navegador del televisor.');}
 catch(_){window.prompt('Copia este enlace para abrirlo en el navegador de la TV:',el('tv-link').href);}
});
function show(){
 state.completedMatches=state.completedMatches||[];
 state.leaderboard=scoring.rankPlayers([...state.completedMatches,...state.matches],state.pairs,state.events);
 persistState();
 try{preview.publish(window.TitanesBuildTvSnapshot.build(state));}catch(error){console.warn('Vista TV no disponible:',error.message);}
 renderTvLink();
 if(state.remoteTournamentId){
  try{const snapshot=window.TitanesBuildTvSnapshot.build(state);remote.publish(state.remoteTournamentId,snapshot,Number(state.remoteRevision)||0).then(revision=>{state.remoteRevision=revision;persistState();renderTvLink();}).catch(error=>{const box=el('remote-status');if(box)box.textContent='⚠ Sin sincronizar · '+error.message;});}catch(error){const box=el('remote-status');if(box)box.textContent='⚠ No se pudo preparar el marcador · '+error.message;}
 }
 el('count').textContent=state.players.length+' jugadores inscritos';
 el('draw').disabled=state.players.length<8||state.players.length%2!==0||state.pairs.length>0;
 const players=el('players');players.replaceChildren(...state.players.map(p=>{const li=element('li');if(p.photo){const img=element('img');img.src=p.photo;img.alt='';img.className='player-photo-thumb';li.append(img);}li.append(element('span',p.name));return li;}));
 const pairs=el('pairs');pairs.replaceChildren(...state.pairs.map(p=>element('li',p.players.map(x=>x.name).join(' / '))));
 const matches=el('matches');matches.replaceChildren();
 for(const match of state.matches){
  const card=element('article');card.className='match';
  const title=element('strong',(match.round||'Ronda '+state.round)+' · '+(match.type==='bye'?'Pase automático':'Encuentro '+match.id));card.append(title);
  card.append(element('div',pairName(match.pairA)+' vs '+(match.pairB?pairName(match.pairB):'Pase')));
  if(match.type==='match'){
   const history=state.events[match.id]||[],totals=scoring.score(match,history);
   const board=element('div');board.className='tournament-scoreboard';
   for(const [index,id] of [match.pairA,match.pairB].entries()){
    const side=element('div');side.className='score-side score-side-'+(index?'b':'a')+(totals[id]>totals[index?match.pairA:match.pairB]?' is-leading':'');
    side.append(element('span',pairName(id)),element('b',totals[id]),element('small',totals[id]>totals[index?match.pairA:match.pairB]?'VA GANANDO':totals[id]===totals[index?match.pairA:match.pairB]?'EMPATE':''));
    board.append(side);
   }
   card.append(board,element('p','Meta: '+scoring.TARGET+' puntos'));
   if(!match.winner&&Math.max(...Object.values(totals))>=scoring.TARGET){
    const close=element('button','Confirmar cierre a 200');close.className='close-match';
    close.addEventListener('click',()=>{if(!window.confirm('¿Confirmar el resultado final del encuentro?'))return;try{const updated=scoring.finish(match,history,'organizador-demo');state.matches=state.matches.map(m=>m.id===match.id?updated:m);notify('Encuentro cerrado. Ganó '+pairName(updated.winner)+'.');show();}catch(error){notify(error.message);}});
    card.append(close);
   }else if(!match.winner){
    for(const id of [match.pairA,match.pairB])card.append(makeScoreForm(match,id));
   }
   const active=history.filter(event=>!event.voided),voided=history.filter(event=>event.voided);
   if(active.length||voided.length){
    const log=element('details');log.className='score-history';const summary=element('summary','Historial de anotaciones ('+history.length+')');log.append(summary);
    const list=element('ul');
    for(const event of history){
     const type=scoring.POINT_TYPES[event.reason];const label=type?type.label:(event.reason||'Manual');
     const row=element('li',pairName(event.pairId)+' +'+event.points+' · '+label+(event.actor?' · '+event.actor:'' )+(event.voided?' · ANULADA'+(event.voidReason?' · '+event.voidReason:'' ):'' ));
     if(!event.voided&&!match.winner){
      const correction=element('button','Corregir');correction.className='secondary small-button';
      correction.addEventListener('click',()=>{const reason=window.prompt('Escribe el motivo de la corrección:');if(reason===null)return;try{state.events[match.id]=scoring.voidEvent(match,state.events[match.id],event.id,'organizador-demo',reason);notify('Anotación corregida; se conserva el historial.');show();}catch(error){notify(error.message);}});
      row.append(correction);
     }
     list.append(row);
    }
    log.append(list);card.append(log);
   }
   if(match.winner)card.append(element('p','Resultado confirmado: '+pairName(match.winner)));
  }else{
   const bye=element('p','Avanza: '+pairName(match.winner));bye.className='success';card.append(bye);
  }
  matches.append(card);
 }
 if(state.phase==='medals'&&state.matches.length===2&&state.matches.every(m=>m.winner)){
  const result=element('section');result.className='tournament-result';result.append(element('h2','🏆 Campeones: '+pairName(state.matches[0].winner)));
  result.append(element('p','🥈 Subcampeones: '+pairName(state.matches[0].winner===state.matches[0].pairA?state.matches[0].pairB:state.matches[0].pairA)));
  result.append(element('p','🥉 Tercer lugar: '+pairName(state.matches[1].winner)));matches.append(result);
 }
 if(state.leaderboard.length){
  const mvp=state.leaderboard[0],pointsLeader=[...state.leaderboard].sort((a,b)=>b.individualPoints-a.individualPoints||b.average-a.average)[0];
  const award=element('section');award.className='tournament-result';
  award.append(element('h2',(state.phase==='medals'&&state.matches.length===2&&state.matches.every(m=>m.winner)?'👑 MVP del torneo':'👑 MVP provisional')));
  award.append(element('p',mvp.name+' · Average Titanes '+mvp.average.toFixed(2)+'% · '+mvp.gamesWon+'/'+mvp.gamesPlayed+' partidas ganadas'));
  if(mvp.photo){const img=element('img');img.src=mvp.photo;img.alt='Foto de '+mvp.name;img.className='mvp-photo';award.prepend(img);}
  award.append(element('p','🎯 Líder individual en puntos: '+pointsLeader.name+' · '+pointsLeader.individualPoints.toFixed(1)+' puntos'));
  matches.append(award);
 }
 if(state.phase!=='medals'&&state.matches.length&&state.matches.every(m=>m.winner)&&state.matches.some(m=>m.type==='match')){
  const next=element('button','Preparar siguiente ronda');next.className='primary-action';
  next.addEventListener('click',()=>{try{
   if(state.matches.length===2){archiveRound();const finals=engine.medalMatches(state.matches);state.matches=[finals.final,finals.third];state.phase='medals';notify('Final y tercer lugar preparados.');}
   else{archiveRound();state.round++;state.matches=engine.nextRound(state.matches,'ronda-'+state.round);state.phase='elimination';notify('Siguiente ronda preparada.');}
   show();
  }catch(error){notify(error.message);}});
  matches.append(next);
 }
}
async function compressPhoto(file){
 if(!file)return '';if(!file.type||!file.type.startsWith('image/'))throw Error('El archivo debe ser una imagen.');if(file.size>8*1024*1024)throw Error('La foto debe pesar menos de 8 MB.');
 const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('No se pudo leer la foto.'));reader.readAsDataURL(file);});
 const image=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('La foto no se pudo abrir.'));img.src=data;});
 const canvas=document.createElement('canvas'),size=64,scale=Math.min(size/image.width,size/image.height);canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);return canvas.toDataURL('image/jpeg',.55);
}
el('register').addEventListener('submit',async event=>{
 event.preventDefault();if(state.pairs.length){notify('Reinicia el torneo para modificar inscritos.');return;}
 const name=el('name').value.trim();if(name.length<2)return;
 if(state.players.some(p=>p.name.toLocaleLowerCase('es')===name.toLocaleLowerCase('es'))){notify('Ese nombre ya está inscrito.');return;}
 try{const photo=await compressPhoto(el('photo').files[0]);state.players.push({id:'player-'+(Date.now())+'-'+(state.players.length+1),name,photo});el('name').value='';el('photo').value='';notify('Jugador agregado.');show();}catch(error){notify(error.message);}
});
el('draw').addEventListener('click',()=>{try{
 state.pairs=engine.pairPlayers(state.players);const draw=engine.matchesFromPairs(state.pairs);state.matches=draw.first;state.phase='elimination';
 notify(draw.byes?'Sorteo listo: '+draw.byes+' pases automáticos pendientes de aprobación.':'Sorteo realizado.');show();
}catch(error){notify(error.message);}});
el('reset').addEventListener('click',()=>{if(!window.confirm('¿Borrar los datos de este laboratorio?'))return;state.players=[];state.pairs=[];state.matches=[];state.completedMatches=[];state.leaderboard=[];state.events={};state.notifications=[];state.round=1;state.phase='registration';state.champion=null;notify('Laboratorio reiniciado.');show();});
show();
})();
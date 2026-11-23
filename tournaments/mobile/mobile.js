/* Tournament laboratory mirrors Titanes scoring while remaining isolated from production. */
(function(){
'use strict';
const engine=window.TitanesTournament,scoring=window.TitanesTournamentScoring;
const series=window.TitanesSeries;
const preview=window.TitanesLocalPreviewSync.create(()=>{});
const STORAGE_KEY='titanes_tournament_lab_v2';
const TV_VIEWER_BASE=new URL('../tv-preview/index.html',location.href);
const TV_CODE_ALPHABET='0123456789ABCDEFGHJKMNPQRSTVWXYZ';
function createTournamentTvCode(){const bytes=crypto.getRandomValues(new Uint8Array(16));return Array.from(bytes,byte=>TV_CODE_ALPHABET[byte&31]).join('');}
const remote=window.TitanesRemoteTournamentSync.create({
 baseUrl:'https://ybtdxjqodcjoccyuauzv.supabase.co/functions/v1/tournament-tv-sync-lab',
 getAccessToken:async()=>{if(!window.TitanesTournamentAuth)await new Promise(resolve=>window.addEventListener('titanes-auth-ready',resolve,{once:true}));return window.TitanesTournamentAuth.getAccessToken();},
 onStatus:(status,detail)=>{const box=el('remote-status');if(!box)return;box.textContent=status==='updated'?'✅ En TV · revisión '+detail:'⚠ Sin sincronizar · '+detail;}
});
const DEFAULT_STATE={name:'Torneo comunitario Los Titanes de Los Guandules',date:'2026-12-13',tables:8,rules:'Mejor de tres partidas a 200 puntos',players:[],pairs:[],matches:[],completedMatches:[],leaderboard:[],events:{},notifications:[],round:1,phase:'registration',champion:null,remoteTournamentId:null,remoteRevision:0};
const tournamentId=new URLSearchParams(location.search).get('torneo')||'comunitario-2026';
const tournamentKey=id=>STORAGE_KEY+':'+id;
const state=(()=>{try{const saved=JSON.parse(localStorage.getItem(tournamentKey(tournamentId))||'null');if(saved&&Array.isArray(saved.players)&&Array.isArray(saved.pairs)&&Array.isArray(saved.matches)&&saved.events&&typeof saved.events==='object')return {...DEFAULT_STATE,...saved};}catch(_){}return tournamentId==='comunitario-2026'?{...DEFAULT_STATE}:{...DEFAULT_STATE,name:'Nuevo torneo',date:new Date().toLocaleDateString('en-CA',{timeZone:'America/Santo_Domingo'})};})();
function tournamentUrl(id){
 const url=new URL(location.href);
 url.searchParams.set('torneo',id);
 return url.href;
}
function renderTournamentList(){
 const select=el('tournament-list');
 const ids=new Set(['comunitario-2026',tournamentId]);
 for(let index=0;index<localStorage.length;index++){
  const key=localStorage.key(index);
  if(key?.startsWith(STORAGE_KEY+':'))ids.add(key.slice(STORAGE_KEY.length+1));
 }
 select.replaceChildren(...Array.from(ids,id=>{
  const item=element('option',id===tournamentId?state.name:JSON.parse(localStorage.getItem(tournamentKey(id))||'null')?.name||DEFAULT_STATE.name);
  item.value=id;
  item.selected=id===tournamentId;
  return item;
 }));
}
function persistState(){try{localStorage.setItem(tournamentKey(tournamentId),JSON.stringify(state));const status=document.getElementById('save-status');if(status)status.textContent='Guardado automáticamente en este navegador · '+new Date().toLocaleTimeString('es-DO',{hour:'2-digit',minute:'2-digit'});}catch(error){console.warn('No se pudo guardar el torneo en este dispositivo:',error);const status=document.getElementById('save-status');if(status)status.textContent='⚠ No se pudo guardar en este navegador. No cierres esta página y exporta los datos antes de salir.';}}
const el=id=>document.getElementById(id);
const element=(tag,text)=>{const x=document.createElement(tag);if(text!==undefined)x.textContent=String(text);return x;};
function notify(msg){el('message').textContent=msg;}
function pairName(id){const pair=state.pairs.find(p=>p.id===id);return pair?pair.players.map(p=>p.name).join(' / '):id;}
function notify200(pairId){notify('¡'+pairName(pairId)+' llegó a 200! Confirma el cierre de la partida.');try{if(navigator.vibrate)navigator.vibrate([140,70,140]);}catch(_){}}
function makeScoreForm(match,pairId,tableNumber){
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
   state.events[match.id]=scoring.add(match,state.events[match.id]||[],pairId,points,kind.value,actor,responsiblePlayerId);
   const after=scoring.score(match,state.events[match.id]);
   const cause=scoring.POINT_TYPES[kind.value].label,offender=state.players.find(p=>p.id===responsiblePlayerId);
   let notice='Marcador actualizado en Mesa '+tableNumber+': '+pairName(pairId)+' anotó '+points+' puntos por '+cause+'. Marcador '+after[match.pairA]+' a '+after[match.pairB]+'.';
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
function remoteEndpoint(){return 'https://ybtdxjqodcjoccyuauzv.supabase.co/functions/v1/tournament-tv-sync-lab/'+state.remoteTournamentId;}
function renderTvLink(){
 const link=el('tv-link'),copy=el('copy-tv-link'),status=el('remote-status'),code=el('remote-code');
 if(!link||!copy||!state.remoteTournamentId)return;
 if(code)code.textContent=(state.remoteTournamentId.match(/.{1,4}/g)||[state.remoteTournamentId]).join('-');
 if(location.hostname==='localhost'){link.hidden=true;copy.hidden=true;return;}
 const url=new URL(TV_VIEWER_BASE);url.searchParams.set('endpoint',remoteEndpoint());link.href=url.href;link.hidden=false;copy.hidden=false;
 if(!state.remoteRevision&&status)status.textContent='Preparando transmisión segura…';
}
el('connect-tv').addEventListener('click',async()=>{
 try{
  if(!state.matches.some(match=>match.type==='match')){notify('Primero sortea las parejas y prepara los encuentros.');return;}
  if(!state.remoteTournamentId||el('remote-status').textContent.includes('Otra sesión')){state.remoteTournamentId=createTournamentTvCode();state.remoteRevision=0;persistState();}
  el('remote-status').textContent='Conectando con la cuenta del laboratorio…';
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
 const allMatches=[...state.completedMatches,...state.matches];
 state.leaderboard=scoring.rankPlayers(allMatches.flatMap(match=>match.games||[]),state.pairs,state.events);
 persistState();
 renderTournamentList();
 try{preview.publish(window.TitanesBuildTvSnapshot.build(state));}catch(error){console.warn('Vista TV no disponible:',error.message);}
 renderTvLink();
 if(state.remoteTournamentId){
  try{const snapshot=window.TitanesBuildTvSnapshot.build(state);remote.publish(state.remoteTournamentId,snapshot,Number(state.remoteRevision)||0).then(revision=>{state.remoteRevision=revision;persistState();renderTvLink();}).catch(error=>{const box=el('remote-status');if(box)box.textContent='⚠ Sin sincronizar · '+error.message;});}catch(error){const box=el('remote-status');if(box)box.textContent='⚠ No se pudo preparar el marcador · '+error.message;}
 }
 el('count').textContent=state.players.length+'/32 inscritos · '+state.players.filter(player=>player.confirmed).length+' validados';
 el('draw').disabled=state.players.length!==32||!state.players.every(player=>player.confirmed)||state.pairs.length>0;
 el('draw-matches').disabled=state.pairs.length!==16||state.matches.length>0;
 el('individual-rank').replaceChildren(...state.leaderboard.map(row=>element('li',row.name+' · Average '+row.average.toFixed(2)+'% · '+row.gamesWon+'/'+row.gamesPlayed+' partidas · '+row.lizaWins+' lizas propinadas · '+row.lizaLosses+' recibidas')));
 el('pair-rank').replaceChildren(...series.rankPairs(allMatches,state.pairs,state.events).map(row=>
  element('li',pairName(row.pair.id)+' · '+row.seriesWon+' series ganadas · '+row.gamesWon+'/'+row.gamesPlayed+' partidas · '+row.points+' puntos')));
 el('bracket').replaceChildren(...allMatches.map(match=>element('li',match.round+' · '+pairName(match.pairA)+' vs '+pairName(match.pairB)+(match.winner?' · Ganó '+pairName(match.winner):''))));
 const players=el('players');players.replaceChildren(...state.players.map(p=>{const li=element('li');if(p.photo){const img=element('img');img.src=p.photo;img.alt='';img.className='player-photo-thumb';li.append(img);}li.append(element('span',p.name));
 if(!state.pairs.length){
  const verify=element('button',p.confirmed?'Quitar validación':'Validar asistencia');
  verify.type='button';
  verify.addEventListener('click',()=>{p.confirmed=!p.confirmed;show();});
  const remove=element('button','Retirar');
  remove.type='button';
  remove.addEventListener('click',()=>{state.players=state.players.filter(player=>player.id!==p.id);show();});
  li.append(verify,remove);
 }else if(p.confirmed)li.append(element('small','Validado'));
 return li;}));
 const pairs=el('pairs');pairs.replaceChildren(...state.pairs.map(p=>element('li',p.players.map(x=>x.name).join(' / '))));
 const matches=el('matches');matches.replaceChildren();
 for(const encounter of state.matches){
  const match=series.current(encounter);
  const number=state.matches.indexOf(encounter)+1;
  const table=encounter.table||((number-1)%state.tables+1);
  const available=!state.matches.slice(0,number-1).some((previous,index)=>!previous.winner&&(previous.table||index%state.tables+1)===table);
  const card=element('article');card.className='match';
  const title=element('strong',(match.round||'Ronda '+state.round)+' · '+(match.type==='bye'?'Pase automático':'Mesa '+table));card.append(title);
  card.append(element('div',pairName(match.pairA)+' vs '+(match.pairB?pairName(match.pairB):'Pase')));
  if(match.type==='match'){
   const history=state.events[match.id]||[],totals=scoring.score(match,history);
   const board=element('div');board.className='tournament-scoreboard';
   for(const [index,id] of [match.pairA,match.pairB].entries()){
    const side=element('div');side.className='score-side score-side-'+(index?'b':'a')+(totals[id]>totals[index?match.pairA:match.pairB]?' is-leading':'');
    side.append(element('span',pairName(id)),element('b',totals[id]),element('small',totals[id]>totals[index?match.pairA:match.pairB]?'VA GANANDO':totals[id]===totals[index?match.pairA:match.pairB]?'EMPATE':''));
    board.append(side);
   }
   const games=encounter.games||[];
   const seriesScore=[encounter.pairA,encounter.pairB].map(id=>games.filter(game=>game.winner===id).length).join('–');
   card.append(board,element('p','Serie '+seriesScore+' · '+(match.winner?'Finalizada':'Partida '+(games.length+1)+' a '+scoring.TARGET)));
   if(encounter.scheduledAt)card.append(element('p',new Date(encounter.scheduledAt).toLocaleString('es-DO',{timeZone:'America/Santo_Domingo'})));
   if(!encounter.winner){
    const schedule=element('form');
    const date=element('input');
    date.type='datetime-local';
    date.required=true;
    date.setAttribute('aria-label','Horario de Santo Domingo');
    if(encounter.scheduledAt)date.value=new Date(Date.parse(encounter.scheduledAt)-4*3600000).toISOString().slice(0,16);
    const submit=element('button',encounter.scheduledAt?'Solicitar reprogramación':'Proponer horario');
    schedule.append(date,submit);
    schedule.addEventListener('submit',event=>{
     event.preventDefault();
     const requestedAt=new Date(date.value+'-04:00').toISOString();
     encounter.scheduleRequest={requestedAt,requestedBy:actor};
     show();
    });
    card.append(schedule);
    if(encounter.scheduleRequest){
     const request=encounter.scheduleRequest;
     card.append(element('p','Solicitud pendiente · '+new Date(request.requestedAt).toLocaleString('es-DO',{timeZone:'America/Santo_Domingo'})));
     if(role==='admin'){
      const approve=element('button','Autorizar horario');
      approve.addEventListener('click',()=>{
       const conflict=state.matches.some((other,index)=>other.id!==encounter.id&&!other.winner&&(other.table||index%state.tables+1)===table&&other.scheduledAt===request.requestedAt);
       if(conflict){notify('Ya hay un encuentro en esta mesa a esa hora.');return;}
       Object.assign(encounter,engine.scheduleMatch(encounter,request.requestedAt,actor),{scheduleRequest:null});
       show();
      });
      card.append(approve);
     }
    }
   }
   if(!match.winner&&!available)card.append(element('p','En espera de mesa'));
   if(!match.winner&&available&&Math.max(...Object.values(totals))>=scoring.TARGET){
    const close=element('button','Confirmar cierre a 200');close.className='close-match';
    close.addEventListener('click',()=>{if(!window.confirm('¿Confirmar el resultado de esta partida?'))return;try{Object.assign(state,series.confirm(state,encounter.id,actor));notify('Resultado confirmado.');show();}catch(error){notify(error.message);}});
    card.append(close);
   }else if(!match.winner&&available){
    for(const id of [match.pairA,match.pairB])card.append(makeScoreForm(match,id,table));
   }
   for(const game of games){
    const played=element('details');
    played.append(element('summary','Partida '+(games.indexOf(game)+1)+' · '+pairName(game.winner)+' · '+game.finalScores[game.pairA]+'–'+game.finalScores[game.pairB]));
    for(const annotation of state.events[game.id]||[])played.append(element('p',pairName(annotation.pairId)+' +'+annotation.points+' · '+scoring.POINT_TYPES[annotation.reason].label+(annotation.voided?' · Anulada: '+annotation.voidReason:'')));
    card.append(played);
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
      correction.addEventListener('click',()=>{const reason=window.prompt('Escribe el motivo de la corrección:');if(reason===null)return;try{state.events[match.id]=scoring.voidEvent(match,state.events[match.id],event.id,actor,reason);notify('Anotación corregida; se conserva el historial.');show();}catch(error){notify(error.message);}});
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
 if(state.phase==='finished'){
  const result=element('section');result.className='tournament-result';result.append(element('h2','🏆 Campeones: '+pairName(state.matches[0].winner)));
  result.append(element('p','🥈 Subcampeones: '+pairName(state.matches[0].winner===state.matches[0].pairA?state.matches[0].pairB:state.matches[0].pairA)));
  result.append(element('p','🥉 Tercer lugar: '+pairName(state.matches[1].winner)));matches.append(result);
 }
 if(state.leaderboard.length){
  const mvp=state.leaderboard[0],pointsLeader=[...state.leaderboard].sort((a,b)=>b.individualPoints-a.individualPoints||b.average-a.average)[0];
  const award=element('section');award.className='tournament-result';
  award.append(element('h2',(state.phase==='finished'?'👑 MVP del torneo':'👑 MVP provisional')));
  award.append(element('p',mvp.name+' · Average Titanes '+mvp.average.toFixed(2)+'% · '+mvp.gamesWon+'/'+mvp.gamesPlayed+' partidas ganadas'));
  if(mvp.photo){const img=element('img');img.src=mvp.photo;img.alt='Foto de '+mvp.name;img.className='mvp-photo';award.prepend(img);}
  award.append(element('p','🎯 Líder individual en puntos: '+pointsLeader.name+' · '+pointsLeader.individualPoints.toFixed(1)+' puntos'));
  matches.append(award);
 }
}
async function compressPhoto(file){
 if(!file)return '';if(!file.type||!file.type.startsWith('image/'))throw Error('El archivo debe ser una imagen.');if(file.size>8*1024*1024)throw Error('La foto debe pesar menos de 8 MB.');
 const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('No se pudo leer la foto.'));reader.readAsDataURL(file);});
 const image=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('La foto no se pudo abrir.'));img.src=data;});
 const canvas=document.createElement('canvas'),size=64,scale=Math.min(size/image.width,size/image.height);canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);return canvas.toDataURL('image/jpeg',.55);
}
el('register').addEventListener('submit',async event=>{
 event.preventDefault();if(state.pairs.length||state.players.length>=32){notify('Inscripciones cerradas.');return;}
 const option=el('members').selectedOptions[0];
 const memberId=option?.value;
 const name=memberId?option.textContent:el('name').value.trim();if(name.length<2)return;
 if(state.players.some(p=>p.name.toLocaleLowerCase('es')===name.toLocaleLowerCase('es'))){notify('Ese nombre ya está inscrito.');return;}
 try{const photo=await compressPhoto(el('photo').files[0]);if(state.players.length>=32||state.pairs.length||state.players.some(p=>p.id===memberId||p.name.toLocaleLowerCase('es')===name.toLocaleLowerCase('es')))return;state.players.push({id:memberId||crypto.randomUUID(),name,photo,confirmed:false});el('members').value='';el('name').required=true;el('name').value='';el('photo').value='';notify('Jugador agregado.');show();}catch(error){notify(error.message);}
});
function animateDraw(button, run){
 button.disabled=true;
 button.classList.add('drawing');
 setTimeout(()=>{
  try{run();show();}catch(error){notify(error.message);}
  finally{button.classList.remove('drawing');}
 },matchMedia('(prefers-reduced-motion: reduce)').matches?0:650);
}
el('draw').addEventListener('click',()=>animateDraw(el('draw'),()=>{
 if(state.players.length!==32||!state.players.every(player=>player.confirmed)||state.pairs.length)throw Error('Valida 32 jugadores antes del sorteo.');
 state.pairs=engine.pairPlayers(state.players);
 notify('16 parejas sorteadas. Ya puedes sortear sus enfrentamientos.');
}));
el('draw-matches').addEventListener('click',()=>animateDraw(el('draw-matches'),()=>{
 if(state.pairs.length!==16||state.matches.length)throw Error('Se necesitan 16 parejas sorteadas.');
 state.matches=engine.matchesFromPairs(state.pairs).first.map(match=>({...match,round:'Octavos'}));
 state.phase='elimination';
 notify('Octavos de final preparados.');
}));
for(const key of ['name','date','tables','rules'])el('config-'+key).value=state[key];
el('configuration').addEventListener('submit',event=>{
 event.preventDefault();
 state.name=el('config-name').value.trim();
 state.date=el('config-date').value;
 state.tables=Number(el('config-tables').value);
 state.rules=el('config-rules').value.trim();
 show();
 notify('Configuración guardada.');
});
el('tournament-list').addEventListener('change',event=>{location.href=tournamentUrl(event.target.value);});
el('new-tournament').addEventListener('click',()=>{location.href=tournamentUrl(crypto.randomUUID());});
el('members').addEventListener('change',()=>{el('name').required=!el('members').value;});
let actor, role;
window.addEventListener('titanes-auth-ready',async()=>{
 try{
  const session=await window.TitanesTournamentAuth.organizer();
  actor=session.id;
  role=session.role;
  for(const member of session.members){
   const option=element('option',member.nickname||member.full_name||'Jugador');
   option.value=member.id;
   el('members').append(option);
  }
  el('manager').hidden=false;
  el('access').hidden=true;
  show();
 }catch(error){el('access').textContent=error.message;}
},{once:true});
})();

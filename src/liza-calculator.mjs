/** Pure calculation only; requires classified scoring events before use in production. */
const ZONE='America/Santo_Domingo';
const formatter=new Intl.DateTimeFormat('en-CA',{timeZone:ZONE,year:'numeric',month:'2-digit',day:'2-digit'});
function dateParts(date){const p=Object.fromEntries(formatter.formatToParts(new Date(date)).map(x=>[x.type,x.value]));return [Number(p.year),Number(p.month),Number(p.day)];}
function dayNumber([y,m,d]){return Math.floor(Date.UTC(y,m-1,d)/86400000);}
export function periodBounds(period,now=new Date()){
 const parts=dateParts(now),n=dayNumber(parts),weekday=(new Date(n*86400000).getUTCDay()+6)%7;
 let start,end;
 if(period==='dia'){start=n;end=n+1;}
 else if(period==='semana'){start=n-weekday;end=start+7;}
 else if(period==='mes'){start=dayNumber([parts[0],parts[1],1]);end=dayNumber(parts[1]===12?[parts[0]+1,1,1]:[parts[0],parts[1]+1,1]);}
 else throw new Error('Período inválido');
 const iso=v=>new Date(v*86400000+4*3600000).toISOString();
 return {from:iso(start),to:iso(end)};
}
export function classifyLiza(game,events){
 if(game?.status!=='finalizada'||!['L','C'].includes(game?.winner))return 'not_applicable';
 const loser=game.winner==='L'?'C':'L';
 const valid=events.filter(e=>e.voided!==true);
 if(!valid.length)return 'indeterminate';
 const active=valid.filter(e=>e.team===loser);

 // A liza requires a valid 200-point win; never certify an unfinished or tied scoreboard.
 if(game.largos_score==null||game.cortos_score==null)return 'indeterminate';
 {
  const winnerScore=Number(game.winner==='L'?game.largos_score:game.cortos_score);
  const loserScore=Number(game.winner==='L'?game.cortos_score:game.largos_score);
  if(!Number.isFinite(winnerScore)||!Number.isFinite(loserScore)||winnerScore<200||loserScore>=200||loserScore<0)return 'indeterminate';
  const totals={L:0,C:0};
  const knownTypes=new Set(['normal','multa','capicua','paso_corrido','chivo','pase_con_ficha','paso_salida_doble','dos_carotas']);
  for(const e of valid){
   if(!knownTypes.has(e.event_type))return 'indeterminate';
   if(!Object.hasOwn(totals,e.team)||e.points==null||!Number.isFinite(Number(e.points))||Number(e.points)<=0)return 'indeterminate';
   totals[e.team]+=Number(e.points);
  }
  if(totals.L!==Number(game.largos_score)||totals.C!==Number(game.cortos_score))return 'indeterminate';
 }
 if(valid.some(e=>e.event_type==='normal'&&!e.concept&&!e.score_concept))return 'indeterminate';
 if(active.some(e=>e.event_type==='normal'&&(e.concept==='dominada'||e.score_concept==='dominada')))return 'no';
 return 'yes';
}
export function lizaTotals(games,players,events,from,to){
 const result=new Map(),seen=new Set();
 const ensure=id=>{if(!result.has(id))result.set(id,{propinadas:0,recibidas:0,indeterminadas:0});return result.get(id);};
 for(const game of games){
  if(seen.has(game.id))continue;seen.add(game.id);
  if(!game.finished_at||new Date(game.finished_at)<new Date(from)||new Date(game.finished_at)>=new Date(to))continue;
  const status=classifyLiza(game,events.filter(e=>e.game_id===game.id));
  if(status==='not_applicable'||status==='no')continue;
  const gamePlayers=players.filter(p=>p.game_id===game.id);
  if(gamePlayers.length!==4||new Set(gamePlayers.map(p=>p.member_id)).size!==4||gamePlayers.filter(p=>p.team==='L').length!==2||gamePlayers.filter(p=>p.team==='C').length!==2)continue;
  const unique=new Set();
  for(const p of gamePlayers){
   if(!p.member_id||unique.has(p.member_id))continue;unique.add(p.member_id);
   const total=ensure(p.member_id);
   if(status==='indeterminate')total.indeterminadas++;
   else if(p.team===game.winner)total.propinadas++;
   else if(['L','C'].includes(p.team))total.recibidas++;
  }
 }
 return result;
}

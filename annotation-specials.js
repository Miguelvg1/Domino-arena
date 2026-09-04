import{createClient}from'https://esm.sh/@supabase/supabase-js@2.57.4';
const sb=createClient('https://hvpyngkqtqzvmweavego.supabase.co','sb_publishable_fZbTJCeuM8otLDnnoxRc9w_OGdZIXhX');
let currentGameId=null,currentTeam='L',busy=false;
const defs={
 paso_corrido:{label:'🔄 PASO CORRIDO',points:30},
 capicua:{label:'🎯 CAPICÚA',points:30},
 dos_carotas:{label:'🁣 2 CARITA',points:60}
};
function style(){if(document.querySelector('#annSpecialStyle'))return;const s=document.createElement('style');s.id='annSpecialStyle';s.textContent=`.special.extraSpecial{background:linear-gradient(135deg,#0f5f68,#2563eb)}.special.extraSpecial[data-extra-special="capicua"]{background:linear-gradient(135deg,#166534,#22c55e)}.special.extraSpecial[data-extra-special="dos_carotas"]{background:linear-gradient(135deg,#7c2d12,#f97316)}`;document.head.appendChild(s)}
async function firstPlayer(gameId,team){const r=await sb.from('game_players').select('member_id,seat').eq('game_id',gameId).eq('team',team).order('seat').limit(1);if(r.error)throw r.error;return r.data?.[0]?.member_id||null}
async function add(type){if(busy)return;if(!currentGameId)return alert('Selecciona primero una partida.');const d=defs[type];if(!d)return;const name=currentTeam==='L'?'Largos':'Cortos';if(!confirm(`Confirmar ${d.label.replace(/^[^ ]+ /,'')}: +${d.points} para ${name}?`))return;busy=true;try{const credited=await firstPlayer(currentGameId,currentTeam);if(!credited)throw new Error('No se encontró un jugador del equipo seleccionado.');const{error}=await sb.rpc('add_score_event',{p_game_id:currentGameId,p_team:currentTeam,p_event_type:type,p_points:d.points,p_credited_member_id:credited,p_responsible_member_id:null});if(error)throw error;const reload=document.querySelector('#reload');if(reload)reload.click();else location.reload()}catch(e){alert(e.message||'No se pudo registrar la jugada.')}finally{busy=false}}
function inject(){style();const grid=document.querySelector('.specialGrid');if(!grid)return;if(!grid.querySelector('[data-extra-special="paso_corrido"]')){Object.entries(defs).forEach(([type,d])=>{const b=document.createElement('button');b.className='special extraSpecial';b.dataset.extraSpecial=type;b.innerHTML=`${d.label}<b>+${d.points}</b>`;b.onclick=()=>add(type);grid.appendChild(b)})}
 document.querySelectorAll('.entry b').forEach(el=>{el.childNodes.forEach(n=>{if(n.nodeType===3)n.nodeValue=n.nodeValue.replace(/Salida doble/gi,'2 Carita').replace(/2 caritas/gi,'2 Carita')})});
 const note=grid.nextElementSibling;if(note&&note.classList.contains('small')&&!note.dataset.lizaNote){note.dataset.lizaNote='1';note.insertAdjacentHTML('beforeend','<br><b>Para la Liza:</b> solo la Dominación normal rompe el cero; Paso corrido, Multa, Capicúa, Chivo, Pase con ficha y 2 Carita son puntos especiales.')}
}
document.addEventListener('click',e=>{const g=e.target.closest?.('[data-game]');if(g?.dataset.game)currentGameId=g.dataset.game;if(e.target.closest?.('#pickL'))currentTeam='L';if(e.target.closest?.('#pickC'))currentTeam='C'},true);
const mo=new MutationObserver(()=>inject());mo.observe(document.documentElement,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inject);else inject();
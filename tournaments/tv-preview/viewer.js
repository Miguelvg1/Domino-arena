/* Same-origin preview only. No credentials or production network requests. */
(function(){'use strict';const $=id=>document.getElementById(id);const el=(tag,text)=>{const n=document.createElement(tag);n.textContent=String(text);return n;};let lastUpdate='';
function render(raw){let s;try{s=window.TitanesTvSnapshot.validate(raw);}catch(e){$('status').textContent='Datos inválidos: '+e.message;return;}
if(s.updatedAt&&lastUpdate&&s.updatedAt<lastUpdate)return;lastUpdate=s.updatedAt;
$('title').textContent='🏆 '+s.tournament;$('status').textContent='Vista local · '+(s.updatedAt||'sin fecha');
$('matches').replaceChildren(...s.matches.map(m=>{const card=el('article','');card.append(el('small',m.round+' · Mesa '+m.table));const teams=el('div','');teams.className='teams';for(const [name,points] of [[m.teamA,m.scoreA],[m.teamB,m.scoreB]]){const row=el('div','');row.append(el('p',name),el('div',points));row.lastChild.className='score';teams.append(row);}card.append(teams);return card;}));
$('bracket').replaceChildren(...s.bracket.map(b=>el('li',typeof b==='string'?b:b.label)));
}
const transport=window.TitanesLocalPreviewSync.create(render);const initial=transport.read();if(initial)render(initial);window.addEventListener('pagehide',()=>transport.close());})();
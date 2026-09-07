import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const sb=createClient('https://hvpyngkqtqzvmweavego.supabase.co','sb_publishable_fZbTJCeuM8otLDnnoxRc9w_OGdZIXhX');
let busy=false, timer=null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const order=(a,b)=>Number((String(a.name).match(/\d+/)||['9999'])[0])-Number((String(b.name).match(/\d+/)||['9999'])[0])||String(a.name).localeCompare(String(b.name));

function turnsHost(){return document.querySelector('.tsAdmin')}
function interacting(){const e=document.activeElement;return !!(e&&e.closest&&e.closest('.tcSafeCard'))}

async function load(){
  const [st,tb]=await Promise.all([
    sb.rpc('turn_system_status'),
    sb.from('club_tables').select('id,name,active,created_at').order('created_at')
  ]);
  if(st.error)throw st.error;
  if(tb.error)throw tb.error;
  return {status:st.data,tables:(tb.data||[]).sort(order)};
}

function html(data){
  const active=data.tables.filter(t=>t.active).length;
  const rows=data.tables.map(t=>`<div class="tcSafeRow"><div class="grow"><b>${esc(t.name)}</b><small>${t.active?'🟢 Activa hoy':'⚫ Disponible, pero cerrada'}</small></div><button class="btn ${t.active?'red':'green'}" data-tc-id="${t.id}" data-tc-next="${t.active?'0':'1'}">${t.active?'DESACTIVAR':'ACTIVAR'}</button></div>`).join('');
  const presets=[2,4,6,8,10].filter(n=>n<=data.tables.length).map(n=>`<button class="btn ${n===10?'purple':'dark'}" data-tc-cap="${n}">${n===10?'🚀':'🪑'} ${n} MESAS</button>`).join('');
  return `<section class="card tcSafeCard"><style>.tcSafeCard{border-color:#00e5ff;box-shadow:0 0 24px #00e5ff18}.tcSafeHead{display:flex;gap:10px;align-items:center}.tcSafeCount{font-size:32px;font-weight:1000;color:#72ff3f}.tcSafePresets{display:grid;grid-template-columns:repeat(2,1fr);gap:7px;margin:10px 0}.tcSafePresets .btn{min-height:54px}.tcSafeRow{display:flex;align-items:center;gap:8px;padding:9px 0;border-top:1px solid #ffffff10}.tcSafeRow small{display:block;color:#9fb0c4;margin-top:3px}.tcSafeNote{padding:10px;border:1px solid #294765;background:#07111f;border-radius:13px;color:#cbd5e1;font-size:12px}@media(max-width:430px){.tcSafePresets{grid-template-columns:1fr 1fr}}</style><div class="tcSafeHead"><div class="grow"><small class="gold"><b>🪑 CAPACIDAD DEL CLUB</b></small><h2 style="margin:3px 0">Mesas disponibles hoy</h2></div><div class="tcSafeCount">${active}</div></div><div class="tcSafeNote">Puedes usar desde 2 hasta ${data.tables.length} mesas. Titanes toma automáticamente las mesas activas y reparte la fila global por orden. Al terminar una partida, los ganadores permanecen y entran los próximos retadores.</div><div class="tcSafePresets">${presets}</div>${rows}<button class="btn purple full" id="tcSafeAdd">➕ AGREGAR OTRA MESA</button></section>`;
}

async function render(){
  const host=turnsHost();
  if(!host||interacting()||busy)return;
  try{
    const data=await load();
    const old=document.querySelector('.tcSafeCard');
    if(!data.status?.is_admin){old?.remove();return}
    if(old) old.outerHTML=html(data); else host.insertAdjacentHTML('afterend',html(data));
    bind();
  }catch(e){console.warn('Capacidad mesas:',e)}
}

async function setCapacity(n){
  if(busy)return;busy=true;
  try{
    const data=await load();
    const target=Math.max(1,Math.min(Number(n),data.tables.length));
    let started=0, warnings=[];
    for(let i=0;i<data.tables.length;i++){
      const t=data.tables[i], next=i<target;
      if(t.active===next)continue;
      try{
        const r=await sb.rpc('admin_set_club_table_active',{p_table_id:t.id,p_active:next});
        if(r.error)throw r.error;
        started+=Number(r.data?.games_started||0);
      }catch(e){warnings.push(`${t.name}: ${e.message||e}`)}
    }
    let msg=`✅ Capacidad configurada para ${target} mesas.`;
    if(started)msg+=`\n🎲 ${started} ${started===1?'partida armada':'partidas armadas'} automáticamente.`;
    if(warnings.length)msg+=`\n\n⚠️ ${warnings.join('\n')}`;
    alert(msg);
  }catch(e){alert(e.message||String(e))}
  finally{busy=false;await render()}
}

async function toggle(btn){
  if(busy)return;busy=true;
  try{
    const r=await sb.rpc('admin_set_club_table_active',{p_table_id:btn.dataset.tcId,p_active:btn.dataset.tcNext==='1'});
    if(r.error)throw r.error;
    const started=Number(r.data?.games_started||0);
    if(started)alert(`🎲 ${started} ${started===1?'partida armada':'partidas armadas'} automáticamente.`);
  }catch(e){alert(e.message||String(e))}
  finally{busy=false;await render()}
}

function bind(){
  document.querySelectorAll('[data-tc-cap]').forEach(b=>b.onclick=()=>setCapacity(b.dataset.tcCap));
  document.querySelectorAll('[data-tc-id]').forEach(b=>b.onclick=()=>toggle(b));
  const add=document.getElementById('tcSafeAdd');
  if(add)add.onclick=async()=>{
    if(busy)return;
    const name=prompt('Nombre de la nueva mesa. Déjalo vacío para asignar el próximo número:','');
    if(name===null)return;busy=true;
    try{
      const r=await sb.rpc('admin_add_club_table',{p_name:name.trim()||null});
      if(r.error)throw r.error;
      alert(`✅ ${r.data?.name||'Nueva mesa'} creada y activada.`);
    }catch(e){alert(e.message||String(e))}
    finally{busy=false;await render()}
  };
}

function schedule(){clearTimeout(timer);timer=setTimeout(()=>{if(turnsHost()&&!document.querySelector('.tcSafeCard'))render()},250)}
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
setTimeout(render,900);
setInterval(()=>{if(turnsHost()&&!interacting()&&!busy)render()},10000);

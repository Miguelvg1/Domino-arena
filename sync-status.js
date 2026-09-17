/* Titanes Dominó: indicador de conectividad. No modifica datos ni reglas. */
(()=>{
  if(window.__titanesSyncIndicator)return;
  window.__titanesSyncIndicator=true;
  const style=document.createElement('style');
  style.textContent='#titanes-sync-status{position:fixed;top:calc(env(safe-area-inset-top,0px) + 6px);right:8px;z-index:9999;padding:5px 9px;border-radius:999px;font:700 11px system-ui,sans-serif;color:#fff;background:#7f1d1d;box-shadow:0 2px 8px #0006;pointer-events:none}#titanes-sync-status[data-state="checking"]{background:#92400e}#titanes-sync-status[data-state="connected"]{background:#166534}';
  document.head.appendChild(style);
  const badge=document.createElement('div');badge.id='titanes-sync-status';badge.setAttribute('role','status');badge.setAttribute('aria-live','polite');
  function mount(){if(!badge.isConnected&&document.body)document.body.appendChild(badge)}
  function show(state,message){mount();badge.dataset.state=state;badge.textContent=message}
  let sequence=0;
  async function check(){
    const id=++sequence;
    if(!navigator.onLine){show('offline','🔴 Sin conexión');return}
    show('checking','🟡 Comprobando conexión…');
    const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),7000);
    try{
      const response=await fetch('/manifest.webmanifest',{method:'GET',cache:'no-store',signal:controller.signal});
      if(id!==sequence)return;
      if(response.ok)show('connected','🟢 Conexión disponible');
      else show('checking','🟡 Sin confirmar conexión');
    }catch(_){if(id===sequence)show(navigator.onLine?'checking':'offline',navigator.onLine?'🟡 Sin confirmar conexión':'🔴 Sin conexión')}
    finally{clearTimeout(timeout)}
  }
  document.addEventListener('DOMContentLoaded',()=>{mount();check()},{once:true});
  if(document.readyState!=='loading'){mount();check()}
  window.addEventListener('online',check);
  window.addEventListener('offline',()=>{sequence++;show('offline','🔴 Sin conexión')});
  window.addEventListener('pageshow',check);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)check()});
  setInterval(()=>{if(!document.hidden)check()},60000);
})();

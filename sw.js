const CACHE='titanes-shell-v1';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||event.request.mode==='navigate') return;
  event.respondWith(fetch(event.request).catch(()=>caches.match(event.request)));
});
self.addEventListener('push',event=>{
  let data={};
  try{data=event.data?event.data.json():{};}catch(_){data={body:event.data?event.data.text():''};}
  const title=data.title||'Titanes Dominó';
  const options={body:data.body||'Tienes una actualización en Titanes Dominó.',data:{url:data.url||'/'}};
  event.waitUntil(self.registration.showNotification(title,options));
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const requested=(event.notification.data&&event.notification.data.url)||'/';
  let url='/';
  try { const target=new URL(requested,self.location.origin); if(target.origin===self.location.origin && /^https?:$/.test(target.protocol)) url=target.pathname+target.search+target.hash; } catch(_) {}
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
    const destination=new URL(url,self.location.origin);
    for(const client of list){
      try {
        const current=new URL(client.url);
        if(current.origin===destination.origin && current.pathname===destination.pathname && current.search===destination.search && current.hash===destination.hash && 'focus' in client){
          return client.focus();
        }
      } catch(_) {}
    }
    return clients.openWindow?clients.openWindow(url):undefined;
  }));
});

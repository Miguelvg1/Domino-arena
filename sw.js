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
    for(const client of list){if('focus' in client){client.navigate(url);return client.focus();}}
    return clients.openWindow?clients.openWindow(url):undefined;
  }));
});

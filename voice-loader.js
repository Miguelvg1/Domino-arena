// Loader de voz Titanes V1: se activa sin modificar el núcleo de la app.
(function(){
  const load=()=>{
    if(document.querySelector('script[data-titanes-voice]'))return;
    const s=document.createElement('script');
    s.src='/voice-control.js?v=1';s.defer=true;s.dataset.titanesVoice='1';
    document.head.appendChild(s);
  };
  load();
})();

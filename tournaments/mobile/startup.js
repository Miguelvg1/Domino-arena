(function () {
  'use strict';
  const status = document.getElementById('access');
  const retry = document.getElementById('retry-access');

  async function resolveAuth() {
    if (window.parent !== window) {
      const auth = window.parent.TitanesTournamentAuth;
      if (!auth) throw new Error('No se pudo recuperar la sesión de la app.');
      return auth;
    }
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.57.4');
    return window.createTitanesTournamentAuth(createClient(
      'https://ybtdxjqodcjoccyuauzv.supabase.co',
      'sb_publishable_kwqHU1p_F_C_u7J_nWau9Q_9xq2sbuk'
    ));
  }

  async function openTournament() {
    const attempt = new AbortController();
    let timer;
    status.hidden = false;
    retry.hidden = true;
    status.textContent = 'Verificando acceso al laboratorio…';

    try {
      await Promise.race([
        resolveAuth().then(auth => {
          if (!attempt.signal.aborted) return window.loadTitanesTournament(auth, attempt.signal);
        }),
        new Promise((_, reject) => {
          timer = setTimeout(() => {
            attempt.abort();
            reject(new Error('La verificación tardó demasiado. Revisa la conexión e inténtalo otra vez.'));
          }, 12000);
        })
      ]);
    } catch (error) {
      attempt.abort();
      status.hidden = false;
      status.textContent = error.message || 'No se pudo abrir el gestor.';
      retry.hidden = false;
    } finally {
      clearTimeout(timer);
    }
  }

  retry.addEventListener('click', openTournament);
  void openTournament();
})();

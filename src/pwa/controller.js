export function detectPwaEnvironment(win, nav) {
  const ios =
    /iPad|iPhone|iPod/.test(nav.userAgent || '') ||
    (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1);
  return {
    ios,
    standalone: nav.standalone === true || !!win.matchMedia?.('(display-mode: standalone)').matches,
    secure: win.isSecureContext === true,
    supported: 'serviceWorker' in nav,
  };
}

export function createPwaController({ win, nav, native = false, enabled = true }) {
  const environment = detectPwaEnvironment(win, nav);
  let state = {
    ...environment,
    native,
    online: nav.onLine !== false,
    worker: 'idle',
    updateReady: false,
    installAvailable: false,
    installed: environment.standalone,
    busy: false,
    message: '',
    error: '',
    storage: null,
  };
  const subscribers = new Set();
  let registration,
    installEvent,
    started = false,
    lastCheck = 0;
  const notify = (patch) => {
    state = { ...state, ...patch };
    subscribers.forEach((fn) => fn({ ...state }));
  };
  const updateStatus = () =>
    notify({
      worker: registration?.active ? 'ready' : 'preparing',
      updateReady: !!registration?.waiting,
    });
  async function refreshStorage() {
    try {
      const [estimate, persistent] = await Promise.all([
        nav.storage?.estimate?.(),
        nav.storage?.persisted?.(),
      ]);
      notify({
        storage: {
          usage: estimate?.usage ?? null,
          quota: estimate?.quota ?? null,
          persistent: persistent === true,
          canRequest: typeof nav.storage?.persist === 'function',
        },
      });
    } catch {
      notify({ storage: { usage: null, quota: null, persistent: false, canRequest: false } });
    }
  }
  async function checkUpdate() {
    if (!registration || nav.onLine === false) {
      notify({ message: 'Conecte-se à internet para verificar uma nova versão.' });
      return;
    }
    notify({ busy: true, error: '', message: '' });
    try {
      lastCheck = Date.now();
      await registration.update();
      updateStatus();
      notify({
        message: registration.waiting
          ? 'Nova versão pronta. Salve o que estiver editando, feche todas as janelas do MeuAgro e abra novamente.'
          : 'Verificação concluída. Se houver uma versão nova, o preparo pode levar alguns instantes.',
      });
    } catch {
      notify({
        error: 'Não foi possível verificar atualizações. Confira a conexão e tente novamente.',
      });
    } finally {
      notify({ busy: false });
    }
  }
  async function start() {
    if (started || native || !enabled) return;
    started = true;
    win.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      installEvent = event;
      notify({ installAvailable: true });
    });
    win.addEventListener('appinstalled', () => {
      installEvent = null;
      notify({
        installed: true,
        installAvailable: false,
        message: 'MeuAgro adicionado ao dispositivo.',
      });
    });
    win.addEventListener('online', () => {
      notify({ online: true });
    });
    win.addEventListener('offline', () => {
      notify({ online: false });
    });
    win.document?.addEventListener('visibilitychange', () => {
      if (!win.document.hidden && nav.onLine !== false && Date.now() - lastCheck > 60000)
        void checkUpdate();
    });
    if (!environment.secure || !environment.supported) {
      notify({
        worker: 'unavailable',
        error: !environment.secure
          ? 'Abra o endereço HTTPS publicado para instalar o MeuAgro e preparar a abertura offline.'
          : 'Este navegador não oferece abertura offline. Tente no Safari ou em outro navegador atualizado.',
      });
      return;
    }
    notify({ worker: 'preparing' });
    try {
      registration = await nav.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      });
      updateStatus();
      const watchWorker = (worker) =>
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'redundant' && !registration.active)
            notify({
              worker: 'error',
              error:
                'Não foi possível preparar a abertura offline. Confira espaço e conexão e tente novamente.',
            });
          else updateStatus();
        });
      watchWorker(registration.installing);
      registration.addEventListener('updatefound', () => watchWorker(registration.installing));
      nav.serviceWorker.addEventListener('controllerchange', updateStatus);
      // Do not reload or activate a waiting worker. Keep forms and all tabs intact.
      void refreshStorage();
    } catch {
      notify({
        worker: 'error',
        error:
          'Não foi possível preparar o aplicativo offline. Confira espaço, permissões e conexão.',
      });
    }
  }
  async function install() {
    const event = installEvent;
    if (!event || state.busy) return;
    installEvent = null;
    notify({ busy: true, error: '', installAvailable: false });
    try {
      await event.prompt();
      const choice = await event.userChoice;
      notify({
        message:
          choice?.outcome === 'accepted'
            ? 'Conclua a instalação no navegador e abra o ícone do MeuAgro.'
            : 'Você pode instalar depois pelo menu do navegador.',
      });
    } catch {
      notify({ error: 'Use o menu do navegador para adicionar o MeuAgro à tela inicial.' });
    } finally {
      notify({ busy: false });
    }
  }
  async function protectStorage() {
    notify({ error: '', message: '' });
    try {
      const allowed = await nav.storage?.persist?.();
      await refreshStorage();
      notify({
        message: allowed
          ? 'O navegador concedeu armazenamento persistente. Continue sincronizando seus registros.'
          : 'O navegador não confirmou proteção adicional. Sincronize antes de limpar dados ou remover o aplicativo.',
      });
    } catch {
      notify({
        error: 'Não foi possível solicitar proteção adicional. Seus registros não foram apagados.',
      });
    }
  }
  return {
    start,
    checkUpdate,
    install,
    protectStorage,
    refreshStorage,
    getState: () => ({ ...state }),
    subscribe(fn) {
      subscribers.add(fn);
      fn({ ...state });
      return () => subscribers.delete(fn);
    },
  };
}

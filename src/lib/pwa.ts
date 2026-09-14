export async function registerSW() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              if (confirm('A new version of QR Studio is available. Reload to update?')) {
                window.location.reload();
              }
            }
          });
        }
      });

      console.log('[SW] Service Worker registered:', registration.scope);
      return registration;
    } catch (error) {
      console.error('[SW] Service Worker registration failed:', error);
    }
  }
}

export function unregisterSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      registration.unregister();
    });
  }
}

export function checkForUpdate() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      registration.update();
    });
  }
}

export function onSWUpdate(callback: (registration: ServiceWorkerRegistration) => void) {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (navigator.serviceWorker.controller) {
        callback(navigator.serviceWorker.controller);
      }
    });
  }
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Registro mejorado del Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Permitir localhost para pruebas de PWA o HTTPS en producción
    const isLocalhost = Boolean(
      window.location.hostname === 'localhost' ||
      window.location.hostname === '[::1]' ||
      window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
    );

    if (window.location.protocol === 'https:' || isLocalhost) {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => {
          console.log('SW: Registrado correctamente');
          
          // Detectar actualizaciones de la app
          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    console.log('SW: Nueva versión disponible. Recarga para actualizar.');
                  }
                }
              };
            }
          };
        })
        .catch(err => console.error('SW: Error en el registro', err));
    }
  });
}

const root = ReactDOM.createRoot(rootElement);
root.render(<App />);

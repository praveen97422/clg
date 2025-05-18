import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

import { resetAllCaches } from './utils/resetCache.js';

resetAllCaches();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js', {
      scope: '/'
    })
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available, reload the page
              window.location.reload();
            }
          });
        });
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });

    // Handle updates
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('New service worker activated');
    });
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

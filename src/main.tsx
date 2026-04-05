import * as React from 'react';
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// Версия билда — при несовпадении сбрасываем кэш и перезагружаем
const BUILD = '6110f99';
const stored = localStorage.getItem('app_build');
if (stored && stored !== BUILD) {
  localStorage.setItem('app_build', BUILD);
  // Сбрасываем все кэши и перезагружаем
  if ('caches' in window) {
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))));
  }
  window.location.reload();
} else {
  localStorage.setItem('app_build', BUILD);
}

createRoot(document.getElementById("root")!).render(<App />);
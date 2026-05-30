import React from 'react';
import ReactDOM from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import App from './App';
import './styles/globals.css';

async function clearNativePwaCache() {
  if (!Capacitor.isNativePlatform()) return;

  const reloadKey = 'acusound-native-cache-cleared';
  const registrations = navigator.serviceWorker
    ? await navigator.serviceWorker.getRegistrations().catch(() => [])
    : [];
  const cacheKeys = window.caches ? await caches.keys().catch(() => []) : [];

  await Promise.all([
    ...registrations.map((registration) => registration.unregister()),
    ...cacheKeys.map((key) => caches.delete(key)),
  ]);

  if ((registrations.length > 0 || cacheKeys.length > 0) && !sessionStorage.getItem(reloadKey)) {
    sessionStorage.setItem(reloadKey, 'true');
    window.location.reload();
  }
}

void clearNativePwaCache();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

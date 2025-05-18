const CACHE_RESET_INTERVAL_DAYS = 10; // Number of days after which caches will be reset
const LAST_RESET_KEY = 'lastCacheResetTimestamp';

export async function resetAllCaches() {
  try {
    const now = Date.now();
    const lastReset = localStorage.getItem(LAST_RESET_KEY);
    if (lastReset) {
      const elapsedDays = (now - parseInt(lastReset, 10)) / (1000 * 60 * 60 * 24);
      if (elapsedDays < CACHE_RESET_INTERVAL_DAYS) {
        console.log(`Cache reset skipped. Last reset was ${elapsedDays.toFixed(2)} days ago.`);
        return;
      }
    }

    // Clear all caches in Cache Storage
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
      console.log('All caches cleared.');
    }

    // Clear localStorage and sessionStorage
    localStorage.clear();
    sessionStorage.clear();
    console.log('localStorage and sessionStorage cleared.');

    // Unregister service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(registration => registration.unregister()));
      console.log('Service workers unregistered.');
    }

    // Update last reset timestamp
    localStorage.setItem(LAST_RESET_KEY, now.toString());

    // Optionally reload the page to apply changes
    // window.location.reload();

  } catch (error) {
    console.error('Error resetting caches:', error);
  }
}

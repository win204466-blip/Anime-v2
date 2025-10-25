const NOTIFICATION_PERMISSION_KEY = 'notificationPermission';
const LAST_ANIME_CHECK_KEY = 'lastAnimeCheck';
const CHECK_INTERVAL = 30 * 60 * 1000;

async function requestNotificationPermission() {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    console.log('Browser tidak mendukung notifikasi push');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    localStorage.setItem(NOTIFICATION_PERMISSION_KEY, permission);

    if (permission === 'granted') {
      await registerServiceWorker();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error meminta izin notifikasi:', error);
    return false;
  }
}

async function registerServiceWorker() {
  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker berhasil didaftarkan:', registration);
      return registration;
    }
  } catch (error) {
    console.error('Error mendaftarkan service worker:', error);
  }
}

async function checkNewAnime() {
  const lastCheck = localStorage.getItem(LAST_ANIME_CHECK_KEY);
  const now = Date.now();

  if (lastCheck && (now - parseInt(lastCheck)) < CHECK_INTERVAL) {
    return;
  }

  try {
    const response = await fetch(`${window.location.origin}/api/home`);
    const result = await response.json();

    if (result.success && result.data && result.data.length > 0) {
      const storedAnime = JSON.parse(localStorage.getItem('knownAnime') || '[]');
      const newAnime = result.data.slice(0, 5).filter(anime => 
        !storedAnime.find(stored => stored.id === anime.id)
      );

      if (newAnime.length > 0 && storedAnime.length > 0) {
        await sendNotification({
          title: `🎬 ${newAnime.length} Anime Baru!`,
          body: `${newAnime[0].name} dan anime lainnya sudah tersedia!`,
          url: '/',
          tag: 'new-anime-' + Date.now()
        });
      }

      localStorage.setItem('knownAnime', JSON.stringify(result.data.slice(0, 20)));
    }

    localStorage.setItem(LAST_ANIME_CHECK_KEY, now.toString());
  } catch (error) {
    console.error('Error mengecek anime baru:', error);
  }
}

async function sendNotification(data) {
  if (Notification.permission !== 'granted') {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    if ('showNotification' in registration) {
      await registration.showNotification(data.title, {
        body: data.body,
        icon: data.icon || '/icon-192x192.png',
        badge: '/badge-72x72.png',
        vibrate: [200, 100, 200],
        tag: data.tag || 'zeeniatt-notification',
        requireInteraction: false,
        data: {
          url: data.url || '/'
        }
      });
    }
  } catch (error) {
    console.error('Error mengirim notifikasi:', error);
  }
}

function initNotifications() {
  const permission = localStorage.getItem(NOTIFICATION_PERMISSION_KEY);

  if (permission === 'granted' && 'serviceWorker' in navigator) {
    registerServiceWorker();
    checkNewAnime();
    setInterval(checkNewAnime, CHECK_INTERVAL);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNotifications);
} else {
  initNotifications();
}

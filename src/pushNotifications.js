// Push Notifications Client
const VAPID_PUBLIC_KEY_STORAGE = 'vapidPublicKey';

async function getVapidPublicKey() {
  try {
    const cached = localStorage.getItem(VAPID_PUBLIC_KEY_STORAGE);
    if (cached) return cached;

    const response = await fetch('/api/push/vapid-public-key');
    const data = await response.json();
    if (data.publicKey) {
      localStorage.setItem(VAPID_PUBLIC_KEY_STORAGE, data.publicKey);
      return data.publicKey;
    }
    return null;
  } catch (error) {
    console.error('Failed to get VAPID public key:', error);
    return null;
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered:', registration);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

async function subscribeToPushNotifications() {
  if (!('PushManager' in window)) {
    console.log('Push notifications not supported');
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.log('Push notification permission denied');
    return null;
  }

  const registration = await registerServiceWorker();
  if (!registration) return null;

  const vapidPublicKey = await getVapidPublicKey();
  if (!vapidPublicKey) {
    console.error('VAPID public key not available');
    return null;
  }

  try {
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });
    }

    // Send subscription to server
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        deviceInfo: navigator.userAgent
      })
    });

    if (response.ok) {
      console.log('Push subscription saved to server');
      localStorage.setItem('pushEnabled', 'true');
      return subscription;
    } else {
      console.error('Failed to save subscription to server');
      return null;
    }
  } catch (error) {
    console.error('Push subscription failed:', error);
    return null;
  }
}

async function unsubscribeFromPushNotifications() {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  
  if (subscription) {
    await subscription.unsubscribe();
    
    await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        endpoint: subscription.endpoint
      })
    });
    
    localStorage.removeItem('pushEnabled');
    console.log('Unsubscribed from push notifications');
  }
}

async function checkPushSubscription() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  return !!subscription;
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  // Register service worker
  await registerServiceWorker();
  
  // Check if user is logged in and hasn't enabled push yet
  const isLoggedIn = document.cookie.includes('token=');
  const pushEnabled = localStorage.getItem('pushEnabled') === 'true';
  
  if (isLoggedIn && !pushEnabled) {
    // Show prompt to enable notifications after a delay
    setTimeout(() => {
      showNotificationPrompt();
    }, 3000);
  }
});

function showNotificationPrompt() {
  // Only show if not already dismissed
  if (localStorage.getItem('notificationPromptDismissed')) return;
  
  const prompt = document.createElement('div');
  prompt.id = 'notification-prompt';
  prompt.className = 'fixed bottom-4 right-4 bg-white rounded-lg shadow-xl p-4 max-w-sm z-50 border-l-4 border-pink-500';
  prompt.innerHTML = `
    <div class="flex items-start gap-3">
      <div class="text-2xl">🔔</div>
      <div class="flex-1">
        <h3 class="font-bold text-gray-800 mb-1">Enable Notifications</h3>
        <p class="text-sm text-gray-600 mb-3">Get notified instantly when you receive messages or calls.</p>
        <div class="flex gap-2">
          <button id="enableNotifications" class="px-4 py-2 bg-pink-500 text-white rounded-md text-sm font-medium hover:bg-pink-600">
            Enable
          </button>
          <button id="dismissNotifications" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200">
            Later
          </button>
        </div>
      </div>
      <button id="closeNotificationPrompt" class="text-gray-400 hover:text-gray-600">&times;</button>
    </div>
  `;
  
  document.body.appendChild(prompt);
  
  document.getElementById('enableNotifications').addEventListener('click', async () => {
    prompt.remove();
    await subscribeToPushNotifications();
  });
  
  document.getElementById('dismissNotifications').addEventListener('click', () => {
    prompt.remove();
    localStorage.setItem('notificationPromptDismissed', 'true');
  });
  
  document.getElementById('closeNotificationPrompt').addEventListener('click', () => {
    prompt.remove();
  });
}

// Export for use in other scripts
window.PushNotifications = {
  subscribe: subscribeToPushNotifications,
  unsubscribe: unsubscribeFromPushNotifications,
  checkSubscription: checkPushSubscription,
  showPrompt: showNotificationPrompt
};

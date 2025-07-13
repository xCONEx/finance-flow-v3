const CACHE_NAME = 'financeflow-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/web-app-manifest-192x192.png',
  '/web-app-manifest-512x512.png',
  '/favicon-96x96.png',
  '/apple-touch-icon.png'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('🔔 Service Worker: Cache aberto');
        return cache.addAll(urlsToCache).catch((error) => {
          console.error('❌ Erro ao adicionar recursos ao cache:', error);
          // Continua mesmo se alguns recursos falharem
          return Promise.resolve();
        });
      })
  );
});

// Interceptação de requisições
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retorna cache se encontrado, senão faz requisição
        return response || fetch(event.request).catch((error) => {
          console.error('❌ Erro na requisição:', error);
          // Retorna uma resposta de fallback para páginas
          if (event.request.destination === 'document') {
            return caches.match('/');
          }
          return new Response('Erro de rede', { status: 503 });
        });
      })
  );
});

// Atualização do Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Manipulação de notificações push
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  let notificationData = {
    title: 'FinanceFlow',
    body: 'Nova notificação',
    icon: '/web-app-manifest-192x192.png',
    badge: '/favicon-96x96.png',
    tag: 'financeflow-notification',
    data: {}
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        ...data
      };
    } catch (error) {
      console.error('Error parsing push data:', error);
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    data: notificationData.data,
    requireInteraction: false,
    silent: false,
    actions: [
      {
        action: 'open',
        title: 'Abrir',
        icon: '/favicon-96x96.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/favicon-96x96.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Manipulação de cliques em notificações
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Se já existe uma janela aberta, foca nela
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Se não existe, abre uma nova janela
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Manipulação de fechamento de notificações
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
}); 

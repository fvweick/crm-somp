const CACHE_NAME = 'crm-somp-cache-v2'; // Mudei a versão para v2 para forçar a atualização

// Arquivos essenciais do "App Shell" que formam a interface básica.
const CORE_ASSETS = [
  '/',
  'index.html',
  'manifest.json',
  'icon-192x192.png',
  'icon-512x512.png',
  'https://cdn.tailwindcss.com' // Mantemos os essenciais
];

// --- INSTALAÇÃO: Cacheia o App Shell ---
self.addEventListener('install', event => {
  console.log('Service Worker: Instalando v2...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Service Worker: Cacheando o App Shell Core.');
      return cache.addAll(CORE_ASSETS);
    })
  );
  self.skipWaiting(); // Força o novo service worker a ativar imediatamente
});


// --- ATIVAÇÃO: Limpa caches antigos ---
self.addEventListener('activate', event => {
  console.log('Service Worker: Ativando v2...');
  const cacheWhitelist = [CACHE_NAME]; // Apenas o nosso cache atual deve ser mantido
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Deletando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim(); // Garante que o SW controle a página imediatamente
});

// --- FETCH: Estratégia "Network falling back to cache" ---
self.addEventListener('fetch', event => {
  // Ignora requisições que não são GET (ex: POST para o Firestore)
  if (event.request.method !== 'GET') {
    return;
  }

  // Ignora requisições para o Chrome Extensions
  if (event.request.url.startsWith('chrome-extension://')) {
      return;
  }

  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // Se a requisição de rede funcionou, ótimo!
        // Vamos clonar a resposta e salvá-la no cache para uso futuro (offline).
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseToCache);
          });
        // E retornamos a resposta original para o navegador.
        return networkResponse;
      })
      .catch(() => {
        // Se a requisição de rede falhou (offline), tentamos pegar do cache.
        return caches.match(event.request)
          .then(cachedResponse => {
            // Se tivermos uma resposta no cache, a retornamos.
            // Se não, o erro de rede continua (não há nada que possamos fazer).
            return cachedResponse;
          });
      })
  );
});

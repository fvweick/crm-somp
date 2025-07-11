// Define um nome e uma versão para o nosso cache.
// Se você atualizar os arquivos do seu app, mude a versão (ex: 'v2') para forçar a atualização do cache.
const CACHE_NAME = 'crm-somp-cache-v1';

// Lista dos arquivos essenciais para o funcionamento offline do App Shell.
const urlsToCache = [
  '/',
  'index.html',
  'manifest.json',
  'icon-192x192.png',
  'icon-512x512.png',
  // URLs dos scripts que usamos via CDN
  'https://unpkg.com/react@18/umd/react.development.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.development.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://cdn.tailwindcss.com'
];

// Evento 'install': é disparado quando o navegador registra o service worker pela primeira vez.
self.addEventListener('install', event => {
  console.log('Service Worker: Instalando...');
  // O `event.waitUntil` garante que o service worker não será instalado até que o código dentro dele seja executado.
  event.waitUntil(
    // Abrimos o cache com o nome que definimos.
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Cache aberto. Adicionando arquivos do App Shell.');
        // Adicionamos todos os arquivos da nossa lista ao cache.
        return cache.addAll(urlsToCache);
      })
  );
});

// Evento 'fetch': é disparado toda vez que o seu app faz uma requisição de rede.
// Estratégia: Cache-First. Tenta servir do cache primeiro, se falhar, vai para a rede.
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Se encontrarmos uma resposta no cache, a retornamos imediatamente.
        if (response) {
          return response;
        }
        // Se a requisição não estiver no cache, nós a fazemos normalmente pela rede.
        return fetch(event.request);
      }
    )
  );
});

// Evento 'activate': é disparado depois da instalação e é o momento ideal para limpar caches antigos.
self.addEventListener('activate', event => {
  console.log('Service Worker: Ativando...');
  const cacheWhitelist = [CACHE_NAME]; // Lista de caches que queremos manter.

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Se um nome de cache não estiver na nossa lista, ele é um cache antigo e nós o deletamos.
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Deletando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});


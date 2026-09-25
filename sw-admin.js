// ==========================================================================
// SERVICE WORKER — USE GEMAS ADMIN
// Estratégia:
//   - Assets estáticos (CSS, JS, fontes, ícones): cache-first
//   - Chamadas ao Supabase: network-only (sempre fresco)
//   - Navegação HTML: network-first com fallback pro cache
// ==========================================================================

const CACHE_NAME = 'ug-admin-v1';
const CACHE_URLS = [
    '/admin.html',
    '/estilo/midias/favicon.png',
    '/estilo/midias/icone-admin-192.png',
    '/estilo/midias/icone-admin-512.png'
];

// ==========================================================================
// INSTALL — pré-cache dos assets críticos
// ==========================================================================
self.addEventListener('install', (event) => {
    console.log('[SW Admin] Instalando...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW Admin] Pré-cacheando assets iniciais');
                return cache.addAll(CACHE_URLS);
            })
            .then(() => self.skipWaiting()) // Ativa imediatamente, sem esperar
    );
});

// ==========================================================================
// ACTIVATE — limpa caches antigos quando a versão muda
// ==========================================================================
self.addEventListener('activate', (event) => {
    console.log('[SW Admin] Ativando...');
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => {
                            console.log('[SW Admin] Removendo cache antigo:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => self.clients.claim()) // Assume controle imediatamente
    );
});

// ==========================================================================
// FETCH — intercepta requisições
// ==========================================================================
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Não intercepta métodos que não sejam GET
    if (request.method !== 'GET') return;

    // Não intercepta chamadas ao Supabase (sempre network-only)
    if (url.hostname.includes('supabase.co')) {
        return; // deixa passar direto, sem cache
    }

    // Não intercepta CDNs externas (Chart.js, Supabase SDK, Google Fonts)
    if (url.hostname.includes('cdn.jsdelivr.net') ||
        url.hostname.includes('fonts.googleapis.com') ||
        url.hostname.includes('fonts.gstatic.com')) {
        // Estratégia: cache-first para essas libs
        event.respondWith(
            caches.match(request).then((cached) => {
                if (cached) return cached;
                return fetch(request).then((response) => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, clone);
                        });
                    }
                    return response;
                });
            })
        );
        return;
    }

    // Assets locais (estilo, midias)
    if (url.origin === self.location.origin) {
        // Navegação HTML: network-first com fallback pro cache
        if (request.mode === 'navigate') {
            event.respondWith(
                fetch(request)
                    .then((response) => {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, clone);
                        });
                        return response;
                    })
                    .catch(() => {
                        // Offline: serve do cache
                        return caches.match(request).then((cached) => {
                            if (cached) return cached;
                            // Fallback: serve o admin.html cacheado
                            return caches.match('/admin.html');
                        });
                    })
            );
            return;
        }

        // Assets estáticos: cache-first
        event.respondWith(
            caches.match(request).then((cached) => {
                if (cached) return cached;
                return fetch(request).then((response) => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, clone);
                        });
                    }
                    return response;
                });
            })
        );
    }
});

// ==========================================================================
// MESSAGE — permite que a página force atualização do SW
// ==========================================================================
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
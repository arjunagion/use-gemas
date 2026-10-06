// ==========================================================================
// SERVICE WORKER — USE GEMAS (CLIENTE)
//
// Estratégia HÍBRIDA:
// - HTML/CSS/JS/fontes: cache-first (rápido, muda pouco)
// - Supabase API: network-only (dados sempre frescos)
// - Imagens de produto: cache-first com limite de 50 imagens
// ==========================================================================

const CACHE_VERSION = 'ug-cliente-v3';
const CACHE_STATIC = `${CACHE_VERSION}-static`;
const CACHE_IMAGES = `${CACHE_VERSION}-images`;

const MAX_IMAGES = 50;

// Assets pré-cacheados na instalação
const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/minha-conta.html',
    '/reset-password.html',
    '/politica-troca.html',
    '/politica-privacidade.html',
    '/estilo/perfil.css',
    '/estilo/paginas-legais.css',
    '/estilo/midias/favicon.png',
    '/estilo/midias/icone-admin-192.png',
    '/estilo/midias/icone-admin-512.png'
];

// Domínios que NUNCA são cacheados (API sempre fresca)
const NETWORK_ONLY_HOSTS = [
    'supabase.co',
    'google-analytics.com',
    'googletagmanager.com',
    'connect.facebook.net',
    'facebook.com',
    'viacep.com.br'
];

// ==========================================================================
// INSTALL
// ==========================================================================
self.addEventListener('install', (event) => {
    console.log('[SW Cliente] Instalando...');

    event.waitUntil(
        caches.open(CACHE_STATIC)
            .then((cache) => {
                console.log('[SW Cliente] Pré-cacheando assets iniciais');
                return cache.addAll(PRECACHE_URLS);
            })
            .then(() => self.skipWaiting())
            .catch((err) => {
                console.warn('[SW Cliente] Erro no pré-cache:', err);
            })
    );
});

// ==========================================================================
// ACTIVATE — limpa caches antigos
// ==========================================================================
self.addEventListener('activate', (event) => {
    console.log('[SW Cliente] Ativando...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => !name.startsWith(CACHE_VERSION))
                        .map((name) => {
                            console.log('[SW Cliente] Removendo cache antigo:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

// ==========================================================================
// HELPERS
// ==========================================================================
function isImageRequest(url, request) {
    // Por extensão
    if (/\.(png|jpe?g|webp|gif|svg|avif)$/i.test(url.pathname)) return true;
    // Por destination
    if (request.destination === 'image') return true;
    return false;
}

async function limitImageCache(cacheName) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();

    if (keys.length > MAX_IMAGES) {
        // Remove os mais antigos (FIFO)
        const toDelete = keys.slice(0, keys.length - MAX_IMAGES);
        await Promise.all(toDelete.map(k => cache.delete(k)));
    }
}

// ==========================================================================
// FETCH — estratégia híbrida
// ==========================================================================
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // ⚠️ Ignora: métodos não-GET, requests com Range, extensões de browser
    if (request.method !== 'GET') return;
    if (request.headers.has('range')) return;
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
    if (url.pathname.startsWith('/chrome-extension')) return;

    // ⚠️ Ignora: domínios network-only (Supabase, analytics, pixels, ViaCEP)
    const isNetworkOnly = NETWORK_ONLY_HOSTS.some(host => url.hostname.includes(host));
    if (isNetworkOnly) return;

    // ⚠️ Ignora: CDNs externas (jsDelivr, Google Fonts, PhotoSwipe)
    const isCDN =
        url.hostname.includes('cdn.jsdelivr.net') ||
        url.hostname.includes('fonts.googleapis.com') ||
        url.hostname.includes('fonts.gstatic.com');

    if (isCDN) {
        // Cache-first pra CDNs (libs mudam pouco)
        event.respondWith(
            caches.match(request).then((cached) => {
                if (cached) return cached;
                return fetch(request).then((response) => {
                    if (response.status === 200) {
                        const clone = response.clone();
                        caches.open(CACHE_STATIC).then((cache) => {
                            cache.put(request, clone).catch(() => {});
                        });
                    }
                    return response;
                });
            })
        );
        return;
    }

    // ⚠️ Ignora: outras origens (Google, Instagram, etc)
    if (url.origin !== self.location.origin) return;

    // ==========================================================================
    // A) Imagens (locais) — cache-first com limite
    // ==========================================================================
    if (isImageRequest(url, request)) {
        event.respondWith(
            caches.match(request).then((cached) => {
                if (cached) return cached;
                return fetch(request).then((response) => {
                    if (response.status === 200) {
                        const clone = response.clone();
                        caches.open(CACHE_IMAGES).then((cache) => {
                            cache.put(request, clone)
                                .then(() => limitImageCache(CACHE_IMAGES))
                                .catch(() => {});
                        });
                    }
                    return response;
                });
            })
        );
        return;
    }

    // ==========================================================================
    // B) Navegação HTML — network-first com fallback pro cache
    // ==========================================================================
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.status === 200) {
                        const clone = response.clone();
                        caches.open(CACHE_STATIC).then((cache) => {
                            cache.put(request, clone).catch(() => {});
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Offline: tenta o cache
                    return caches.match(request).then((cached) => {
                        if (cached) return cached;
                        // Fallback pro index.html cacheado
                        return caches.match('/index.html');
                    });
                })
        );
        return;
    }

    // ==========================================================================
    // C — Assets locais (CSS, JS, fontes) — network-first com fallback pro cache
    // Isso garante que mudanças sejam pegas na primeira visita após deploy.
    // ==========================================================================
    event.respondWith(
        fetch(request)
            .then((response) => {
                if (response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_STATIC).then((cache) => {
                        cache.put(request, clone).catch(() => {});
                    });
                }
                return response;
            })
            .catch(() => {
                // Offline: serve do cache
                return caches.match(request);
            })
    );
});

// ==========================================================================
// MESSAGE — permite página forçar update do SW
// ==========================================================================
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

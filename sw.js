// Service worker do Rayman Jungle Run.
// Rede primeiro (sempre pega a versão mais nova quando o servidor do Koder está
// aberto) e, se o servidor não responder, usa a cópia guardada no aparelho.
const CACHE = 'rayman-jungle-run-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

function withTimeout(promise, ms) {
    return new Promise((resolve, reject) => {
        const t = setTimeout(() => reject(new Error('timeout')), ms);
        promise.then(v => { clearTimeout(t); resolve(v); },
                     err => { clearTimeout(t); reject(err); });
    });
}

async function networkFirst(req) {
    const cache = await caches.open(CACHE);
    try {
        const res = await withTimeout(fetch(req), 3000);
        if (res && res.ok) cache.put(req, res.clone()).catch(() => {});
        return res;
    } catch (err) {
        const hit = await cache.match(req, { ignoreSearch: true });
        if (hit) return hit;
        throw err;
    }
}

self.addEventListener('fetch', e => {
    const req = e.request;
    // Pedidos parciais (Range) de áudio/vídeo ficam com o navegador.
    if (req.method !== 'GET' || req.headers.has('range')) return;
    if (new URL(req.url).origin !== self.location.origin) return;
    e.respondWith(networkFirst(req));
});

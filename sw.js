const CACHE_NAME = 'cafe-hermes-v4'
const CORE_ASSETS = [
    './',
    './index.html',
    './menu.html',
    './about.html',
    './manifest.json',
    './css/style.css',
    './css/apple.css',
    './js/effects.js',
    './js/config.js',
    './js/menu.js',
    './assets/logo.png',
    './assets/banner.png',
    './assets/icon-192.png',
    './assets/icon-512.png'
]

// پاسخ ریدایرکت‌شده (مثل menu.html ← /menu روی Cloudflare) رو نمی‌شه برای navigation برگردوند؛ نسخه‌ی تمیزش رو ذخیره می‌کنیم
function clean(res) {
    if (!res || !res.redirected) return res
    return new Response(res.body, { status: 200, statusText: 'OK', headers: res.headers })
}

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => Promise.all(CORE_ASSETS.map((u) =>
                fetch(u).then((res) => res.ok ? cache.put(u, clean(res)) : null).catch(() => null))))
            .then(() => self.skipWaiting())
    )
})

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(
                keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
            ))
            .then(() => self.clients.claim())
    )
})

self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url)

    if (url.origin !== location.origin) {
        if (e.request.method === 'GET' && e.request.mode === 'no-cors') {
            e.respondWith(fetch(e.request).then((res) => {
                const copy = res.clone()
                caches.open(CACHE_NAME).then((cache) => cache.put(e.request, copy)).catch(() => { })
                return res
            }).catch(() => caches.match(e.request)))
        }
        return
    }

    if (url.pathname.startsWith('/api/')) return

    if (e.request.method !== 'GET') return

    const isPage = e.request.mode === 'navigate'

    e.respondWith(
        caches.match(e.request).then((cached) => {
            if (cached && !isPage) return cached

            const network = fetch(e.request)
                .then((res) => {
                    if (res && res.ok) {
                        const copy = clean(res.clone())
                        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, copy)).catch(() => { })
                    }
                    return res
                })
                .catch(() => {
                    if (isPage) return caches.match('./index.html')
                    return cached
                })

            return network
        })
    )
})

self.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting()
})

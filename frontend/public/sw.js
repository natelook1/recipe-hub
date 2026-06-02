const CACHE = 'recipe-hub-v1'
const STATIC = ['/','./index.html']

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)))
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ))
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  const { request } = e
  const url = new URL(request.url)

  // Recipe images — cache first
  if (url.pathname.includes('/api/recipes/') && url.pathname.endsWith('/image')) {
    e.respondWith(
      caches.open('recipe-images').then(async cache => {
        const cached = await cache.match(request)
        if (cached) return cached
        const resp = await fetch(request)
        if (resp.ok) cache.put(request, resp.clone())
        return resp
      })
    )
    return
  }

  // API calls — network first, fall back to cache
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(
      fetch(request)
        .then(resp => {
          if (resp.ok) {
            caches.open('api-cache').then(c => c.put(request, resp.clone()))
          }
          return resp
        })
        .catch(() => caches.match(request))
    )
    return
  }

  // App shell — cache first
  e.respondWith(
    caches.match(request).then(cached => cached || fetch(request))
  )
})

const staticCacheName = "cascade-cache@0.0.1";

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches
            .open(staticCacheName)
            .then((cache) => {
                return cache.addAll([
                    "/cascade/", // This caches index.html at the root
                    "/cascade/styles.css",
                    "/cascade/script.js",
                    "/cascade/icons/favicon.ico",
                    "/cascade/audio/notification_sound.mp3",
                    "/cascade/icons/cascade-192x192.png",
                    "/cascade/icons/cascade-180x180.png",
                    "/cascade/icons/cascade-32x32.png",
                    "/cascade/icons/cascade-512x512.png",
                    "/cascade/serviceworker.js",
                ]);
            })
    );
});

self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request);
        })
    );
});

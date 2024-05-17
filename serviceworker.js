const staticCacheName = "cascade-cache@0.0.1"; // You can change this name if needed

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches
            .open(staticCacheName)
            .then((cache) => {
                return cache.addAll([
                    "/", // This caches index.html at the root
                    "./styles.css",
                    "./script.js",
                    "./icons/favicon.ico",
                    "./audio/notification_sound.mp3",
                    "./icons/cascade-192x192.png",
                    "./icons/cascade-180x180.png",
                    "./icons/cascade-32x32.png",
                    "./icons/cascade-512x512.png",
                    "./serviceworker.js",
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

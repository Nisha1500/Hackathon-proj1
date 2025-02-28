// Cache Name
const CACHE_NAME = "app-cache-v1";
const ASSETS_TO_CACHE = [ "index.html",            // The main HTML file
    "manifest.json",         // The manifest file
    "service-worker.js",     // The service worker itself (if you want it cached)
    "img/ikon-pwa.png",      // The icon image used in your app and notifications
    
  ];
 
// Install Service Worker & Cache Files
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log("Caching assets...");
            return cache.addAll(ASSETS_TO_CACHE);
        }).catch(error => {
            console.error("Caching failed:", error);
        })
    );
    self.skipWaiting();
});
// Fetch Resources from Cache (Offline Support)
self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") {
        // Don't try to cache non-GET requests (like POST, PUT, DELETE)
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || fetch(event.request).then((networkResponse) => {
                return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, networkResponse.clone()); // ✅ Cache only GET requests
                    return networkResponse;
                });
            }).catch((error) => {
                console.error("Fetch failed:", error);
                return new Response("Oops! Something went wrong!", { status: 500 });
            });
        })
    );
});


// Push Notification Event
self.addEventListener("push", (event) => {
    const options = {
        body: event.data ? event.data.text() : "Trigger word detected!",
        icon: "/img/ikon-pwa.png",// For the notification icon
        vibrate: [200, 100, 200],
        badge: "/img/ikon-pwa.png"  // For the notification badge
      
    };

    event.waitUntil(
        self.registration.showNotification("Speech Alert", options)
    );
});

// Handle Notification Click (Opens App)
self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow("/") // Opens the main page when clicked
    );
});

// Activate Event (Clean Old Caches)
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        }).catch(error => {
            console.error("Cache cleanup failed:", error);
        })
    );
});



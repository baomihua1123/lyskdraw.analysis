// ════════════════════════════════════════════════════════════
//  service-worker.js — PWA 離線快取
//
//  策略：Network First, Cache Fallback
//  ─ 有網路時：一律直接向伺服器要最新版本（確保你更新網站後，
//    使用者不會卡在舊版本），同時把最新版本存進快取。
//  ─ 沒網路時：改用快取裡最後一次成功取得的版本，
//    讓使用者至少能開啟 App、查看先前的抽卡紀錄。
//
//  ⚠️ 之後若新增/刪除網站的檔案，記得同步更新下方 PRECACHE_URLS，
//     並把 CACHE_NAME 的版本號 +1，才會讓所有使用者更新到新的快取清單。
// ════════════════════════════════════════════════════════════

const CACHE_NAME = 'lysk-draw-cache-v1';

const PRECACHE_URLS = [
    './',
    './index.html',
    './style.css',
    './manifest.json',
    './love_and_deepspace_events.js',
    './love_and_deepspace_standard.js',
    './custom-pools.js',
    './ocr_parser.js',
    './luck_data.js',
    './storage.js',
    './pool-logic.js',
    './records.js',
    './render.js',
    './data_sync.js',
    './pool-editor-ui.js',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './icons/icon-maskable-512.png',
    './icons/apple-touch-icon.png',
];

// ── 安裝：預先快取核心檔案 ─────────────────────────────────
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // 用 addAll 的話，只要有一個檔案 404 就會讓整個安裝失敗，
            // 改用逐一 add 並吞掉個別錯誤，避免因為單一檔案路徑不對
            // 就導致整個離線快取失效。
            return Promise.all(
                PRECACHE_URLS.map((url) =>
                    cache.add(url).catch((err) => {
                        console.warn('[Service Worker] 預先快取失敗，略過：', url, err);
                    })
                )
            );
        })
    );
    self.skipWaiting();
});

// ── 啟用：清掉舊版本快取 ───────────────────────────────────
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

// ── 攔截請求：Network First, Cache Fallback ───────────────
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);
    // 外部資源（例如 tesseract.js CDN、Google Analytics）不攔截，
    // 交給瀏覽器自己處理，避免跨網域快取的複雜狀況。
    if (url.origin !== self.location.origin) return;

    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseClone);
                });
                return networkResponse;
            })
            .catch(() => caches.match(event.request))
    );
});

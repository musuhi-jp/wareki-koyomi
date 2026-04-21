// 和暦こよみ Service Worker
// バージョンを上げると古いキャッシュが自動削除されます
const CACHE_NAME = 'wareki-koyomi-v1';

const CACHE_FILES = [
  './',
  './index.html',
  './manifest.json',
];

// インストール：ファイルをキャッシュに保存
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CACHE_FILES))
  );
  self.skipWaiting();
});

// アクティベート：古いキャッシュを削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// フェッチ：ネットワーク優先、失敗時にキャッシュから返す
self.addEventListener('fetch', event => {
  // 外部API（天気・位置情報）はキャッシュしない
  const url = event.request.url;
  if (
    url.includes('api.open-meteo.com') ||
    url.includes('nominatim.openstreetmap.org') ||
    url.includes('fonts.googleapis.com')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 取得成功 → キャッシュを最新版に更新して返す
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => {
        // ネットワーク失敗 → キャッシュから返す
        return caches.match(event.request);
      })
  );
});

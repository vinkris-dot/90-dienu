/* 90 dienų — veikimas be interneto.
   Puslapis: pirma tinklas (kad visada gautum naujausią), nesant ryšio — kopija.
   Šriftai: pirma kopija, nesant — tinklas. */
var KOPIJA = "90-dienu-v9";
var PAGRINDAS = ["./", "./index.html"];

self.addEventListener("install", function(ev){
  ev.waitUntil(
    caches.open(KOPIJA).then(function(c){ return c.addAll(PAGRINDAS); }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(ev){
  ev.waitUntil(
    caches.keys().then(function(raktai){
      return Promise.all(raktai.map(function(k){ if (k !== KOPIJA) return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(ev){
  var req = ev.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  var sriftas = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);

  if (sriftas){
    ev.respondWith(
      caches.match(req).then(function(k){
        return k || fetch(req).then(function(r){
          var kopija = r.clone();
          caches.open(KOPIJA).then(function(c){ c.put(req, kopija); });
          return r;
        });
      })
    );
    return;
  }

  if (url.origin === self.location.origin){
    ev.respondWith(
      fetch(req).then(function(r){
        if (r && r.ok){
          var kopija = r.clone();
          caches.open(KOPIJA).then(function(c){ c.put(req, kopija); });
        }
        return r;
      }).catch(function(){
        return caches.match(req).then(function(k){ return k || caches.match("./index.html"); });
      })
    );
  }
});

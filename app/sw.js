/* Service worker de l’app Impact-NVA.
   Reseau d’abord, cache en secours : la page affichee est toujours la derniere
   quand la connexion est la, et reste ouvrable sur un chantier sans reseau.
   Ne touche QUE les fichiers de /app/ : n8n, Google Fonts et tout le reste passent
   directement au reseau. */
var CACHE='impact-nva-app-3c1ecd0ee8';
var ESSENTIELS=['./','./index.html','./manifest.webmanifest','./icone-192.png','./icone-512.png','./icone-maskable-512.png'];

self.addEventListener('install',function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(ESSENTIELS)}).catch(function(){}));
});

self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(noms){
    return Promise.all(noms.map(function(n){
      if(n!==CACHE && n.indexOf('impact-nva-app-')===0)return caches.delete(n);
    }));
  }).then(function(){return self.clients.claim()}));
});

self.addEventListener('fetch',function(e){
  var r=e.request;
  if(r.method!=='GET')return;
  var u=new URL(r.url);
  if(u.origin!==self.location.origin)return;
  if(u.pathname.indexOf('/app/')!==0)return;
  /* GitHub Pages sert la page avec Cache-Control: max-age=600. Un fetch() ordinaire
     passe par le cache HTTP du navigateur : « reseau d’abord » pouvait donc rendre
     une page vieille de dix minutes, et la recopier dans le cache hors-ligne.
     Verifie le 07/11/2026 : la page affichee etait l’ancienne. Pour le document
     lui-meme, on court-circuite le cache HTTP. */
  var doc=(r.mode==='navigate'||r.destination==='document');
  var vers=doc?new Request(r.url,{cache:'no-store',credentials:'same-origin'}):r;
  e.respondWith(
    fetch(vers).then(function(rep){
      if(rep && rep.ok){var copie=rep.clone();caches.open(CACHE).then(function(c){c.put(r,copie)}).catch(function(){});}
      return rep;
    }).catch(function(){
      return caches.match(r).then(function(rep){
        return rep || caches.match('./index.html');
      });
    })
  );
});

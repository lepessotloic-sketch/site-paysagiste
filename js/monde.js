/* Impact-NVA — le logo IM en éclats 3D, vivant sur toute la page (moteur Prismatik, js/moteur-eclats.js).
   Ordre voulu par Loïc : d'abord l'ouverture de la Signature (la nuit, l'étincelle, la révélation),
   et seulement ensuite le logo qui éclate et se recompose, comme sur Prismatik.
   Rien ici n'est indispensable : si la 3D ne démarre pas, les logos fixes restent en place. */
(function () {
  'use strict';

  var d = document, racine = d.documentElement;
  var anime = racine.classList.contains('anime');
  var tactile = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
  var borne = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var entre = function (p, a, b) { return borne((p - a) / (b - a)); };
  var doux = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var hasard = function (i, k) { var x = Math.sin((i + 1) * 12.9898 * k + k * 78.233) * 43758.5453; return x - Math.floor(x); };

  function monde() {
    var M = window.NVA3D, toile = d.getElementById('mondeToile');
    if (!anime || !M || !toile || !window.NVA_LOGO_IM) return;
    var haut = d.getElementById('haut'), histoire = d.getElementById('histoire'), pied = d.querySelector('.pied');
    var ancres = {};
    Array.prototype.forEach.call(d.querySelectorAll('[data-logo3d]'), function (el) { ancres[el.getAttribute('data-logo3d')] = el; });
    if (!haut || !histoire || !ancres.haut || !ancres.marque) return;

    var essai = d.createElement('canvas');
    if (!(essai.getContext('webgl2') || essai.getContext('webgl'))) return;

    M.chargeTrois().then(function (T) {
      return M.chargeImage(window.NVA_LOGO_IM).then(function (img) { demarrer(T, img); });
    }).catch(function (e) { window.__monde = { etat: 'image', raison: String(e && e.message || e) }; });

    function demarrer(T, img) {
      var studio = M.creerStudio(toile);
      var renderer = studio.renderer, scene = studio.scene, camera = studio.camera, groupe = studio.groupe, SWEEP = studio.SWEEP;
      var info = M.analyse(img, { cellules: tactile ? 48 : 70 });
      if (!info.morceaux.length) throw new Error('logo illisible');
      var jeu = M.fabriquerPieces(studio, info, img, {});
      var pieces = jeu.pieces;
      M.prepareEclats(pieces, jeu.centre);

      var D = 10, TAN = Math.tan(15 * Math.PI / 180), hh = D * TAN, hw = hh, L = 0, H = 0;
      camera.position.set(0, 0, D);
      scene.fog = new T.Fog(0x050b08, 11, 22);
      if (tactile) renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

      /* où flotte chaque éclat quand le logo est défait : de gros éclats sur les bords, une poussière lointaine ailleurs */
      pieces.forEach(function (p, i) {
        var cote = hasard(i, 1.3) < 0.5 ? -1 : 1, bord = hasard(i, 2.1) < 0.62;
        p.sx = cote * (bord ? 0.74 + hasard(i, 3.7) * 0.4 : hasard(i, 3.7) * 1.05);
        p.sy = (hasard(i, 4.9) * 2 - 1) * 1.12;
        p.sz = bord ? -3.4 + hasard(i, 5.3) * 5.6 : -9.5 + hasard(i, 5.3) * 4.2;
        p.par = 0.16 + ((p.sz + 9.5) / 11.7) * 0.7;
        p.ph = hasard(i, 6.1) * 6.283;
        p.vr = (hasard(i, 7.7) - 0.5) * 0.46;
        p.ordre = hasard(i, 8.9);
        p.aim = 0;
        p.face.opacity = p.cote.opacity = 1;
        p.face.transparent = p.cote.transparent = false;
      });

      function cadre() {
        L = toile.clientWidth || 1; H = toile.clientHeight || 1;
        camera.aspect = L / H; camera.updateProjectionMatrix();
        renderer.setSize(L, H, false);
        hw = hh * camera.aspect;
      }
      cadre();
      window.addEventListener('resize', cadre);

      var pointeur = { cx: -9999, cy: -9999, actif: false };
      if (!tactile) {
        window.addEventListener('pointermove', function (ev) { pointeur.cx = ev.clientX; pointeur.cy = ev.clientY; pointeur.actif = true; }, { passive: true });
        racine.addEventListener('mouseleave', function () { pointeur.actif = false; });
      }

      var enIntro = racine.classList.contains('intro-en-cours') && !!ancres.intro, avaitIntro = enIntro;
      var etat = { images: 0, E: 0, zone: null, souffle: -99, ampleur: 2.7, trait: -99, derive: 0, defile: window.pageYOffset, incl: { x: 0, y: 0 }, vu: 0, pret: false, transit: -99, de: null, pose: null, i1: false, i2: false };
      var tPrec = 0, mesures = [], palier = window.__mondeSansGarde ? 2 : 0, arrete = false;
      var mv = { etat: 'vivant', pieces: pieces.length, temps: null, tempsIntro: null, forcer: null, interne: etat, eclats: pieces };
      window.__monde = mv;
      if (enIntro) { toile.style.transition = 'none'; toile.style.opacity = '0'; }
      /* « Revoir l'ouverture » : la page a remis l'ouverture en place, on reprend le minutage depuis le début */
      window.addEventListener('nva-intro', function () {
        ancres.intro = d.querySelector('[data-logo3d="intro"]');
        if (!ancres.intro) return;
        enIntro = true; avaitIntro = true;
        etat.i1 = etat.i2 = false; etat.de = null; etat.transit = -99; etat.souffle = -99; etat.zone = null;
        toile.style.transition = 'none'; toile.style.opacity = '0';
      });

      function eclater(t, ampleur) { etat.souffle = t; etat.ampleur = ampleur || 2.7; }
      /* un clic (ou Entrée) sur un logo le fait éclater et revenir */
      Object.keys(ancres).forEach(function (cle) {
        if (cle === 'intro') return;
        var el = ancres[cle];
        el.setAttribute('role', 'button'); el.setAttribute('tabindex', '0');
        el.setAttribute('aria-label', 'Faire éclater le logo Impact-NVA');
        el.classList.add('vivant');
        var agir = function () { if (etat.E < 0.2) eclater(performance.now() / 1000); };
        el.addEventListener('click', agir);
        el.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); agir(); } });
      });

      function image(ms) {
        if (arrete) return;
        requestAnimationFrame(image);
        if (d.hidden) return;
        var t = mv.temps != null ? mv.temps : ms / 1000, dt = Math.min(0.05, Math.max(0.001, t - tPrec)); tPrec = t;
        if (toile.clientWidth !== L || toile.clientHeight !== H) cadre();
        var vh = window.innerHeight;
        var rH = haut.getBoundingClientRect(), rS = histoire.getBoundingClientRect();
        var rP = pied ? pied.getBoundingClientRect() : null;

        /* dans quelle partie de la page sommes-nous, et le logo doit-il être entier (0) ou défait (1) ? */
        /* hors des zones du logo, il reste entier : il ne se défait plus en quittant l'histoire (retour de Loïc, 14/10) */
        var zone = null, cible = 0, ancre = null, coupe = 0, mul = 1, vuHistoire = 1;
        if (enIntro && !racine.classList.contains('intro-en-cours')) {
          /* l'ouverture se termine : le logo quitte le centre de l'écran pour sa place dans la page */
          enIntro = false; etat.transit = t; etat.de = etat.pose;
          toile.style.filter = ''; toile.style.opacity = '1'; toile.style.transition = '';
        }
        if (enIntro) {
          zone = 'intro'; ancre = ancres.intro; cible = 0;
          var ti = mv.tempsIntro != null ? mv.tempsIntro : (performance.now() - (window.__introT0 || 0)) / 1000;
          var m = entre(ti, 3.6, 5.2), so = 1 - Math.pow(1 - m, 3);
          mul = 0.35 + 0.65 * so * (1 + 0.08 * Math.sin(Math.PI * m));
          toile.style.opacity = so.toFixed(3);
          toile.style.filter = m < 1 ? 'blur(' + ((1 - so) * 14).toFixed(1) + 'px) brightness(' + (1 + (1 - so) * 1.4).toFixed(2) + ')' : '';
          if (!etat.i1 && ti > 5.2) { etat.i1 = true; etat.trait = -99; }                     /* le logo est construit : un court silence, rien ne bouge */
          if (!etat.i2 && ti > 6.9) { etat.i2 = true; if (ti < 7.8) eclater(t, 3.5); }           /* puis le logo éclate, façon Prismatik */
        } else if (rS.top > vh * 0.6) {
          /* un seul éclatement, celui de l'ouverture (choix de Loïc, 14/10) : ici le logo reste entier */
          if (rH.bottom > 0) { zone = 'haut'; ancre = ancres.haut; cible = 0; }
        } else if (rS.bottom > 0) {
          /* l'histoire : le logo n'apparaît qu'au chapitre III, entier, en fondu */
          zone = 'histoire'; ancre = ancres.marque; cible = 0;
          vuHistoire = entre(-rS.top / Math.max(1, rS.height - vh), 0.68, 0.76);
        } else if (rP && ancres.pied && rP.top < vh && rP.bottom > 0) {
          zone = 'pied'; ancre = ancres.pied; cible = 0; coupe = Math.max(0, rP.top);
        }
        if (mv.forcer) { zone = mv.forcer.zone; ancre = ancres[zone === 'histoire' ? 'marque' : zone]; cible = mv.forcer.E; }

        if (zone !== etat.zone) {
          if (zone === 'pied') etat.E = 0;   /* plus d'éclatement au pied de page : un seul, celui de l'ouverture */
          else if (etat.zone === 'pied' || etat.zone === null) etat.E = cible;
          etat.zone = zone;
          if (zone !== 'intro') toile.style.opacity = zone ? '1' : '0';
        }
        if (zone === 'histoire') { toile.style.transition = 'none'; toile.style.opacity = vuHistoire.toFixed(3); }   /* pas de fondu en retard : le logo ne doit pas traverser les chapitres I et II */
        else if (zone !== 'intro' && toile.style.transition === 'none') toile.style.transition = '';
        if (!zone) { etat.vu += dt; if (etat.vu > 0.7) return; } else etat.vu = 0;
        toile.style.clipPath = coupe ? 'inset(' + Math.round(coupe) + 'px 0 0 0)' : '';

        etat.E += (cible - etat.E) * (mv.forcer ? 1 : 1 - Math.exp(-dt * 7));
        if (Math.abs(cible - etat.E) < 0.0006) etat.E = cible;
        var E = etat.E;

        /* les éclats suivent le défilement, mais seulement quand le logo est entièrement défait */
        var y = window.pageYOffset, upp = 2 * hh / H;
        if (E > 0.985) etat.derive += (y - etat.defile) * upp;
        etat.defile = y;

        /* le logo se pose dans son emplacement de la page */
        var r = (ancre || ancres.haut).getBoundingClientRect();
        var s = Math.max(0.05, Math.min(r.width * upp / jeu.largeur, r.height * upp / jeu.hauteur)) * mul;
        var gx = (r.left + r.width / 2 - L / 2) * upp, gy = -(r.top + r.height / 2 - H / 2) * upp;
        var u = (t - etat.transit) / 1.2;
        if (etat.de && u < 1) {
          var k1 = doux(borne(u));
          gx = etat.de.gx + (gx - etat.de.gx) * k1; gy = etat.de.gy + (gy - etat.de.gy) * k1; s = etat.de.s + (s - etat.de.s) * k1;
        }
        etat.pose = { gx: gx, gy: gy, s: s };
        groupe.position.set(gx, gy, 0); groupe.scale.setScalar(s);

        var repos = 1 - E, pres = pointeur.actif && zone !== 'intro' && pointeur.cy > r.top - 260 && pointeur.cy < r.bottom + 260;
        var ix = pres ? borne((pointeur.cy - r.top) / Math.max(1, r.height) * 0.5 + 0.25) * 2 - 1 : Math.sin(t * 0.5) * 0.4;
        var iy = pres ? Math.max(-1, Math.min(1, (pointeur.cx - (r.left + r.width / 2)) / (L * 0.4))) : Math.sin(t * 0.33) * 0.5;
        etat.incl.x += (ix * 0.13 * repos - etat.incl.x) * 0.06;
        etat.incl.y += (iy * 0.32 * repos - etat.incl.y) * 0.06;
        groupe.rotation.set(etat.incl.x, etat.incl.y, 0);

        /* la souris, dans le repère du logo : les éclats proches se soulèvent */
        var lx = ((pointeur.cx - L / 2) * upp - gx) / s, ly = (-(pointeur.cy - H / 2) * upp - gy) / s;
        var aimant = pres && E < 0.06 ? 1 : 0;
        var b = (t - etat.souffle) / 1.5, sEclat = Math.min(0.82, Math.max(0.5, hw * 0.3));

        for (var i = 0; i < pieces.length; i++) {
          var p = pieces[i], e = doux(borne(E * 1.35 - p.ordre * 0.35));
          var k = (D - p.sz) / D, R = 1.32 * hh * k;
          var wx = p.sx * hw * k + Math.sin(t * 0.21 + p.ph) * 0.14;
          var wy = p.sy * hh * k + etat.derive * p.par + Math.cos(t * 0.17 + p.ph * 1.7) * 0.11;
          wy = ((wy + R) % (2 * R) + 2 * R) % (2 * R) - R;
          var ex = (wx - gx) / s, ey = (wy - gy) / s, ez = p.sz / s;
          var px = p.home.x + (ex - p.home.x) * e, py = p.home.y + (ey - p.home.y) * e, pz = p.home.z + (ez - p.home.z) * e;
          var rx = (p.rot.x + t * p.vr) * e, ry = (p.rot.y + t * p.vr * 0.8) * e, rz = p.rot.z * e;

          var dx = p.home.x - lx, dy = p.home.y - ly, dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
          p.aim += (Math.exp(-(dist * dist) / 0.5) * aimant - p.aim) * 0.14;
          if (p.aim > 0.002) {
            px += dx / dist * p.aim * 0.16; py += dy / dist * p.aim * 0.16; pz += p.aim * 0.62;
            rx += p.rot.x * p.aim * 0.05; ry += p.rot.y * p.aim * 0.05;
          }
          var sf = e < 0.999 ? M.souffle(p, b, etat.ampleur) : null;
          if (sf) { var q = 1 - e; px += sf.x * q; py += sf.y * q; pz += sf.z * q; rx += sf.rx * q; ry += sf.ry * q; rz += sf.rz * q; }

          p.mesh.position.set(px, py, pz); p.mesh.rotation.set(rx, ry, rz);
          var ech = 1 + (sEclat / s - 1) * e;
          p.mesh.scale.set(ech, ech, ech);
        }

        /* le trait de lumière : quand le logo vient de se recomposer */
        if (etat.entier === false && E < 0.02) etat.trait = t;
        etat.entier = E < 0.02;
        if (b > 1.05 && b - dt / 1.5 <= 1.05) etat.trait = t;
        var v = (t - etat.trait) / 1.25;
        if (v > 0 && v < 1) {
          var c = gx + gy * 0.45, demi = (jeu.largeur + jeu.hauteur * 0.45) * s / 2 + 0.5;
          SWEEP.value = c - demi + 2 * demi * v;
        } else SWEEP.value = -99;

        renderer.render(scene, camera);

        if (!etat.pret) { etat.pret = true; racine.classList.add('monde-vivant'); }
        /* sans ouverture (lien direct, page rechargée plus bas) : le logo éclate une fois à l'arrivée.
           On attend la 3e image : la toute première est ralentie par la mise en route de la carte graphique. */
        if (++etat.images === 3 && !avaitIntro && zone === 'haut' && E < 0.05) eclater(t + 0.12);

        /* garde-fou : si l'appareil peine, on allège, puis on rend la main aux logos fixes */
        if (mv.temps == null && zone && zone !== 'intro' && palier < 2) {
          mesures.push(dt);
          if (mesures.length >= 70) {
            var tri = mesures.slice(10).sort(function (a, c2) { return a - c2; }), med = tri[tri.length >> 1];
            mesures = [];
            mv.fluidite = Math.round(1 / med) + ' img/s';
            if (med > 0.048) {
              palier++;
              if (palier === 1) { renderer.setPixelRatio(1); cadre(); }
              else { arrete = true; mv.etat = 'image'; racine.classList.remove('monde-vivant'); toile.style.opacity = '0'; }
            } else palier = 2;
          }
        }
      }
      requestAnimationFrame(image);
    }
  }
  try { monde(); } catch (e) { racine.classList.remove('monde-vivant'); }
})();

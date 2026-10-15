/* Impact-NVA — version 5
   Chaque bloc est isolé : si l'un échoue, le reste de la page continue de fonctionner. */
(function () {
  'use strict';

  var d = document, racine = d.documentElement;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var borne = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var entre = function (p, a, b) { return borne((p - a) / (b - a)); };
  var doux = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var sortie = function (t) { return 1 - Math.pow(1 - t, 4); };
  var anime = racine.classList.contains('anime');
  var tactile = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);

  /* ------------------------------------------------------------
     1. Apparition douce — installée en premier, avec filets de sécurité
     ------------------------------------------------------------ */
  try {
    var aMonter = $$('[data-monte]');
    if (anime && !tactile && 'IntersectionObserver' in window) {
      var montrer = function (el) { el.classList.remove('attente'); };
      var hauteur = window.innerHeight;
      aMonter.forEach(function (el) {
        if (el.getBoundingClientRect().top > hauteur * 0.92) el.classList.add('monte', 'attente');
      });
      var veille = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { montrer(e.target); veille.unobserve(e.target); } });
      }, { rootMargin: '0px 0px 20% 0px', threshold: 0.01 });
      aMonter.forEach(function (el) { if (el.classList.contains('attente')) veille.observe(el); });
      var secours = function () {
        var h = window.innerHeight;
        aMonter.forEach(function (el) {
          if (el.classList.contains('attente') && el.getBoundingClientRect().top < h * 0.95) montrer(el);
        });
      };
      window.addEventListener('scroll', secours, { passive: true });
      setInterval(secours, 1500);
    }
  } catch (e) { $$('.attente').forEach(function (el) { el.classList.remove('attente'); }); }

  window.__nvaPret = true;

  /* ------------------------------------------------------------
     1 bis. L'ouverture : celle de la Signature (la nuit, l'étincelle, la révélation), puis le logo éclate.
            Le minutage 3D est dans js/monde.js ; ici, les particules, « Passer », la fin, et « Revoir l'ouverture ».
     ------------------------------------------------------------ */
  var lancerIntro = function () {};
  try {
    var intro0 = $('#intro'), modeleIntro = intro0 ? intro0.outerHTML : null;   /* copié avant les particules, pour pouvoir la rejouer */
    var enIntro = false, introEl = null, minuterieIntro = null;
    var finIntro = function (vite) {
      if (!enIntro) return;
      enIntro = false; clearTimeout(minuterieIntro);
      racine.classList.remove('intro-en-cours'); racine.classList.add('intro-sortie', 'intro-finie');
      var el = introEl;
      if (el && vite) el.classList.add('passe');
      setTimeout(function () {
        if (!enIntro) racine.classList.remove('intro-sortie');
        if (el && el.parentNode) el.parentNode.removeChild(el);
      }, vite ? 600 : 1300);
    };
    var demarrerIntro = function () {
      introEl = $('#intro');
      if (!introEl) return;
      enIntro = true;
      var ecoule = (performance.now() - (window.__introT0 || performance.now())) / 1000;
      var gerbe = $('#introBurst', introEl);
      if (gerbe) for (var gi = 0; gi < 30; gi++) {
        var grain = d.createElement('div'), angle = Math.PI * 2 * gi / 30 + Math.random() * 0.4, loin = 120 + Math.random() * 220, taille = 3 + Math.random() * 4;
        grain.className = 'p';
        grain.style.setProperty('--dx', Math.cos(angle) * loin + 'px');
        grain.style.setProperty('--dy', Math.sin(angle) * loin + 'px');
        grain.style.background = Math.random() < 0.4 ? 'radial-gradient(circle,#eafff3,#8fe0b3)' : 'radial-gradient(circle,#fff,#e7cc86)';
        grain.style.width = grain.style.height = taille + 'px';
        grain.style.animationDelay = Math.max(0, 3.38 + Math.random() * 0.14 - ecoule) + 's';
        gerbe.appendChild(grain);
      }
      $('#introSkip', introEl).addEventListener('click', function () { finIntro(true); });
      minuterieIntro = setTimeout(function () { finIntro(false); }, Math.max(0, (9.6 - ecoule) * 1000));
    };
    d.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') finIntro(true); });
    if (racine.classList.contains('intro-en-cours')) {
      if (!intro0 || window.pageYOffset > 40) { enIntro = true; introEl = intro0; finIntro(true); }   /* page rechargée plus bas : pas d'ouverture */
      else demarrerIntro();
    } else if (intro0 && intro0.parentNode) intro0.parentNode.removeChild(intro0);

    /* « Revoir l'ouverture » : la nuit, l'étincelle et la révélation reviennent, depuis le haut de la page */
    lancerIntro = function () {
      if (!anime || !modeleIntro || enIntro) return;
      var vieux = $('#intro'); if (vieux && vieux.parentNode) vieux.parentNode.removeChild(vieux);
      try { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); } catch (e) { window.scrollTo(0, 0); }
      d.body.insertAdjacentHTML('afterbegin', modeleIntro);
      racine.classList.remove('intro-finie', 'intro-sortie');
      void racine.offsetWidth;
      window.__introT0 = performance.now();
      var jeton = window.__introJeton = (window.__introJeton || 1) + 1;   /* le filet de sécurité du chargement ne coupe pas une ouverture rejouée */
      racine.classList.add('intro-en-cours');
      try { window.dispatchEvent(new CustomEvent('nva-intro')); } catch (e) {}
      demarrerIntro();
      setTimeout(function () { if (window.__introJeton === jeton && enIntro) finIntro(true); }, 9800);
    };
    $$('[data-revoir-intro]').forEach(function (b) {
      if (!anime) { b.hidden = true; return; }
      b.addEventListener('click', function (ev) { ev.preventDefault(); lancerIntro(); });
    });
  } catch (e) { racine.classList.remove('intro-en-cours'); }

  /* le fond suit le défilement d'un bout à l'autre de la page ; la barre du haut se pose dès qu'on descend */
  try {
    var navEl = $('#nav'), attenteFond = false;
    var majFond = function () {
      attenteFond = false;
      var course = racine.scrollHeight - window.innerHeight;
      racine.style.setProperty('--sy', (course > 0 ? window.pageYOffset / course : 0).toFixed(4));
      if (navEl) navEl.classList.toggle('descendu', window.pageYOffset > 40);
    };
    window.addEventListener('scroll', function () { if (!attenteFond) { attenteFond = true; requestAnimationFrame(majFond); } }, { passive: true });
    window.addEventListener('resize', majFond);
    majFond();
  } catch (e) {}


  /* ------------------------------------------------------------
     2. Le nom du visiteur, partagé par toute la page
     ------------------------------------------------------------ */
  var q = $('#q'), q2 = $('#q2'), griffe = $('#griffe'), griffeTxt = $('#griffeTxt');
  var nom = '', orNom = null;

  function nettoyer(s) { return (s || '').replace(/\s+/g, ' ').trim().slice(0, 34); }
  /* « MAC PRESTA » s'écrit « Mac Presta » à la main */
  function manuscrit(s) {
    if (s === s.toUpperCase() && /[A-ZÀ-Ý]/.test(s)) {
      return s.toLowerCase().replace(/(^|[\s\-'’&.])([a-zà-ÿ])/g, function (m, a, b) { return a + b.toUpperCase(); });
    }
    return s;
  }
  function ajusterGriffe() {
    if (!griffeTxt) return;
    griffeTxt.style.fontSize = '';
    var boite = griffe.parentNode;
    var dispo = Math.min(boite.clientWidth - 2 * parseFloat(getComputedStyle(boite).paddingLeft || 0), 1180);
    var large = griffeTxt.getBoundingClientRect().width;
    if (dispo > 0 && large > dispo) {
      var base = parseFloat(getComputedStyle(griffeTxt).fontSize);
      var taille = Math.max(30, Math.floor(base * dispo / large));
      griffeTxt.style.fontSize = taille + 'px';
      var paraphe = $('.paraphe', griffe); if (paraphe) paraphe.style.fontSize = taille + 'px';
    } else {
      var p2 = $('.paraphe', griffe); if (p2) p2.style.fontSize = '';
    }
    if (orNom) orNom.redessiner();
  }
  function poserNom(v, source) {
    nom = nettoyer(v);
    try { if (nom) sessionStorage.setItem('nva-nom', nom); else sessionStorage.removeItem('nva-nom'); } catch (e) {}
    $$('[data-nom-griffe]').forEach(function (el) { el.textContent = nom ? manuscrit(nom) : el.getAttribute('data-defaut'); });
    $$('[data-nom-phrase]').forEach(function (el) {
      el.textContent = nom ? manuscrit(nom) + ', révélez la vôtre.' : el.getAttribute('data-defaut');
    });
    $$('[data-nom-champ]').forEach(function (el) { if (!el.getAttribute('data-touche')) el.value = nom; });
    if (source !== 'q' && q && q.value !== nom) q.value = nom;
    if (source !== 'q2' && q2 && q2.value !== nom) q2.value = nom;
    ajusterGriffe();
    majFantome();
  }
  var majFantome = function () {};

  /* ------------------------------------------------------------
     3. Moteur de défilement : chaque scène reçoit --p (parcours) et --q (approche)
     ------------------------------------------------------------ */
  var scenes = [], enCours = false, apresImage = [];
  function mesurer(s) {
    var r = s.el.getBoundingClientRect(), h = window.innerHeight, course = r.height - h;
    s.qc = borne((h - r.top) / h);
    s.pc = course > h * 0.25 ? borne(-r.top / course) : borne((h - r.top) / (h + r.height));
  }
  function boucle() {
    var actif = false, k = tactile ? 1 : 0.17;
    for (var i = 0; i < scenes.length; i++) {
      var s = scenes[i]; mesurer(s);
      var np = s.p < 0 ? s.pc : s.p + (s.pc - s.p) * k, nq = s.q < 0 ? s.qc : s.q + (s.qc - s.q) * k;
      if (Math.abs(s.pc - np) < 0.0005) np = s.pc;
      if (Math.abs(s.qc - nq) < 0.0005) nq = s.qc;
      if (np !== s.p || nq !== s.q) {
        s.p = np; s.q = nq; actif = true;
        s.el.style.setProperty('--p', np.toFixed(4));
        s.el.style.setProperty('--q', nq.toFixed(4));
        if (s.maj) { try { s.maj(np, nq); } catch (e) {} }
      }
    }
    for (var j = 0; j < apresImage.length; j++) { try { apresImage[j](); } catch (e) {} }
    if (actif) requestAnimationFrame(boucle); else enCours = false;
  }
  function reveiller() { if (!enCours) { enCours = true; requestAnimationFrame(boucle); } }
  function scene(el, maj) {
    var s = { el: el, p: -1, q: -1, pc: 0, qc: 0, maj: maj };
    scenes.push(s); return s;
  }
  if (anime) {
    window.addEventListener('scroll', reveiller, { passive: true });
    window.addEventListener('resize', reveiller);
    window.addEventListener('load', reveiller);
  }

  /* ------------------------------------------------------------
     4. La recherche : du métier au nom
     ------------------------------------------------------------ */
  var sceneRecherche = null;
  try {
    var hero = $('#recherche'), pin = $('#recherchePin'), m1 = $('#m1'), m2 = $('#m2'), bloc = $('#m1Bloc');
    var barre = $('#barre'), envoi = $('.barre-envoi', barre), fantome = $('#fantome'), fantomeBoite = $('#fantomeBoite');
    var aide = $('#barreAide'), lignes = $$('.res', hero), titres = $$('.res-t', hero);

    var requetes = [
      { q: 'paysagiste près de chez moi', m: 'Paysagiste' },
      { q: 'couturière sur mesure', m: 'Couturière' },
      { q: 'chauffeur d’engins de chantier', m: 'Chauffeur d’engins' },
      { q: 'menuisier pas cher', m: 'Menuisier' }
    ];
    var gabarits = ['{m} : devis gratuit', '{m} pas cher, près de chez vous', '{m} : comparez les prix', '{m}, tarifs imbattables',
      '{m} disponible rapidement', '{m} : meilleur prix garanti', '{m}, devis en ligne', '{m} : promotions du mois'];
    var iReq = 0, minuterie = null, libre = true, texteFantome = requetes[0].q;

    var poserMetier = function (i) {
      titres.forEach(function (t, n) { t.textContent = gabarits[n % gabarits.length].replace('{m}', requetes[i].m); });
    };
    var ecrireFantome = function (t) { texteFantome = t; fantome.textContent = t; };
    poserMetier(0);

    majFantome = function () {
      var cache = !!q.value || d.activeElement === q;
      fantomeBoite.classList.toggle('cache', cache);
    };
    q.setAttribute('placeholder', 'Le nom de votre entreprise');
    q.addEventListener('focus', majFantome);
    q.addEventListener('blur', majFantome);
    q.addEventListener('input', majFantome);

    /* frappe libre, tant qu'on n'a pas commencé à défiler */
    var etape = function (mode, n) {
      if (!libre) return;
      var cible = requetes[iReq].q;
      if (mode === 'efface') {
        if (n > 0) { ecrireFantome(cible.slice(0, n - 1)); minuterie = setTimeout(etape, 28, 'efface', n - 1); }
        else { iReq = (iReq + 1) % requetes.length; poserMetier(iReq); minuterie = setTimeout(etape, 260, 'ecrit', 0); }
      } else {
        if (n < cible.length) { ecrireFantome(cible.slice(0, n + 1)); minuterie = setTimeout(etape, 55 + Math.random() * 50, 'ecrit', n + 1); }
        else { minuterie = setTimeout(etape, 2600, 'efface', cible.length); }
      }
    };
    var lancerLibre = function () {
      clearTimeout(minuterie); libre = true;
      minuterie = setTimeout(etape, 2600, 'efface', requetes[iReq].q.length);
    };
    var figer = function () {
      if (!libre) return;
      libre = false; clearTimeout(minuterie);
      ecrireFantome(requetes[iReq].q); poserMetier(iReq);
    };
    if (anime) lancerLibre();

    /* les résultats échangent leurs places : ils sont interchangeables */
    var rangs = lignes.map(function (_, i) { return i; });
    var hauteurLigne = function () { return lignes[0] ? lignes[0].offsetHeight : 78; };
    var poserRangs = function () {
      var h = hauteurLigne();
      lignes.forEach(function (l, i) { l.style.translate = '0 ' + ((rangs[i] - i) * h) + 'px'; });
    };
    if (anime) setInterval(function () {
      if (!libre || d.hidden) return;
      var a = Math.floor(Math.random() * 4);            /* parmi les lignes visibles en haut */
      var ia = rangs.indexOf(a), ib = rangs.indexOf(a + 1);
      rangs[ia] = a + 1; rangs[ib] = a; poserRangs();
    }, 2100);

    /* géométrie : de combien la barre remonte, et d'où part l'encre */
    var geometrie = function () {
      if (!anime) return;
      var cible = window.innerWidth <= 560 ? 80 : 92;
      var repos = barre.offsetTop + bloc.offsetTop + m1.offsetTop;
      var monte = Math.max(0, repos - cible);
      pin.style.setProperty('--lift', monte + 'px');
      var fx = bloc.offsetLeft + barre.offsetLeft + envoi.offsetLeft + envoi.offsetWidth / 2;
      var fy = repos - monte + barre.offsetHeight / 2;
      pin.style.setProperty('--fx', fx + 'px');
      pin.style.setProperty('--fy', fy + 'px');
      ajusterGriffe();
    };

    var dernierTexte = null;
    var majRecherche = function (p) {
      var a = doux(entre(p, 0, 0.18)), b = entre(p, 0.18, 0.36), c = entre(p, 0.34, 0.56);
      var dd = doux(entre(p, 0.42, 0.58)), e1 = sortie(entre(p, 0.48, 0.56));
      var w = entre(p, 0.50, 0.64), k = sortie(entre(p, 0.56, 0.66)), e3 = sortie(entre(p, 0.58, 0.70));
      var st = pin.style;
      st.setProperty('--a', a.toFixed(4)); st.setProperty('--d', dd.toFixed(4)); st.setProperty('--e1', e1.toFixed(4));
      st.setProperty('--w', w.toFixed(4)); st.setProperty('--k', k.toFixed(4)); st.setProperty('--e3', e3.toFixed(4));
      st.setProperty('--lb', entre(p, 0.38, 0.46).toFixed(4));

      var n = lignes.length;
      for (var i = 0; i < n; i++) {
        var r = entre(c, (n - 1 - rangs[i]) * 0.075, (n - 1 - rangs[i]) * 0.075 + 0.4);
        lignes[i].style.setProperty('--s', borne(r * 2).toFixed(3));
        lignes[i].style.setProperty('--o', (1 - borne((r - 0.45) * 2)).toFixed(3));
      }

      if (p < 0.02) { if (!libre && !q.value) lancerLibre(); }
      else {
        figer();
        if (!q.value) {
          var base = requetes[iReq].q, cible = 'votre nom', t;
          if (b <= 0) t = base;
          else if (b < 0.45) t = base.slice(0, Math.round(base.length * (1 - b / 0.45)));
          else if (b < 0.55) t = '';
          else t = cible.slice(0, Math.round(cible.length * ((b - 0.55) / 0.45)));
          if (t !== dernierTexte) { dernierTexte = t; fantome.textContent = t; }
        }
      }
      var passe = dd > 0.5;
      if (m1.inert !== passe) m1.inert = passe;
      if (m2.inert !== !passe) m2.inert = !passe;
      m2.classList.toggle('actif', dd > 0.92);
      if (orNom) { orNom.reveler(w, k); orNom.voir(dd > 0.15); }
    };

    /* défilement accompagné jusqu'à la révélation */
    var trajet = null;
    var arreter = function () { trajet = null; };
    ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(function (ev) { window.addEventListener(ev, arreter, { passive: true }); });
    var defilerVers = function (cible, duree) {
      var depart = window.pageYOffset, t0 = null, moi = {};
      trajet = moi;
      var pas = function (t) {
        if (trajet !== moi) return;
        if (t0 === null) t0 = t;
        var x = borne((t - t0) / duree);
        window.scrollTo({ top: depart + (cible - depart) * doux(x), behavior: 'instant' });
        if (x < 1) requestAnimationFrame(pas); else trajet = null;
      };
      requestAnimationFrame(pas);
    };
    var reveler = function () {
      if (!anime) { m2.scrollIntoView(); return; }
      var haut = hero.getBoundingClientRect().top + window.pageYOffset;
      var course = hero.offsetHeight - window.innerHeight;
      var cible = haut + course * 0.94;
      var reste = Math.abs(cible - window.pageYOffset) / Math.max(1, course);
      if (reste < 0.03) return;
      setTimeout(function () { defilerVers(cible, 1200 + 2600 * reste); }, 60);
    };

    barre.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var v = nettoyer(q.value);
      if (!v) {
        barre.classList.remove('refus'); void barre.offsetWidth; barre.classList.add('refus');
        aide.textContent = 'Écrivez d’abord le nom de votre entreprise, puis Entrée.';
        q.focus(); return;
      }
      poserNom(v, 'q'); q.blur(); reveler();
    });

    /* « Essayez avec le vôtre » : la griffe se réécrit en direct */
    var attente = null;
    var rejouer = function () {
      if (orNom) { orNom.fondre(1100); return; }
      if (!anime || !griffeTxt.animate) return;
      griffeTxt.animate([{ clipPath: 'inset(-30% 100% -30% -10%)' }, { clipPath: 'inset(-30% 0% -30% -10%)' }],
        { duration: 750, easing: 'cubic-bezier(.2,.7,.2,1)' });
    };
    if (q2) q2.addEventListener('input', function () {
      poserNom(q2.value, 'q2');
      clearTimeout(attente); attente = setTimeout(rejouer, 280);
    });
    if ($('#essai')) $('#essai').addEventListener('submit', function (ev) { ev.preventDefault(); poserNom(q2.value, 'q2'); q2.blur(); });

    if (anime) {
      sceneRecherche = scene(hero, majRecherche);
      geometrie();
      window.addEventListener('resize', geometrie);
      window.addEventListener('load', geometrie);
      if (d.fonts && d.fonts.ready) d.fonts.ready.then(geometrie);
    } else {
      window.addEventListener('resize', ajusterGriffe);
      if (d.fonts && d.fonts.ready) d.fonts.ready.then(ajusterGriffe);
    }
  } catch (e) {
    /* la scène n'a pas pu se monter : on revient à la page simple, entièrement lisible */
    racine.classList.remove('anime'); anime = false;
  }

  /* la petite vidéo de l'option Prismatik ne tourne que lorsqu'elle est à l'écran */
  try {
    var petites = $$('[data-joue-a-l-ecran]');
    if (anime && petites.length && 'IntersectionObserver' in window) {
      var veilleVideo = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          try { if (e.isIntersecting) { var r = e.target.play(); if (r && r.catch) r.catch(function () {}); } else e.target.pause(); } catch (err) {}
        });
      }, { threshold: 0.35 });
      petites.forEach(function (v) {
        v.addEventListener('timeupdate', function () { if (v.currentTime > 0.05) v.parentNode.classList.add('joue'); });
        veilleVideo.observe(v);
      });
    }
  } catch (e) {}

  /* nom déjà saisi pendant cette visite */
  try { var garde = sessionStorage.getItem('nva-nom'); if (garde) poserNom(garde); } catch (e) {}

  /* ------------------------------------------------------------
     5. L'ouverture et l'histoire : deux mouvements qui se succèdent au même endroit
     ------------------------------------------------------------ */
  try {
    if (anime) {
      var ouverture = $('#haut');
      if (ouverture) scene(ouverture);

      var histoire = $('#histoire'), plans = $$('[data-plan]', histoire), fil = $$('#histoireFil li');
      var phrase = $('#pourquoiPhrase'), mots = [], planPhrase = phrase ? phrase.closest('[data-plan]') : null;
      if (phrase) {
        Array.prototype.slice.call(phrase.childNodes).forEach(function (n) {
          if (n.nodeType !== 3) return;
          var frag = d.createDocumentFragment();
          n.nodeValue.split(/(\s+)/).forEach(function (bout) {
            if (!bout) return;
            if (/^\s+$/.test(bout)) { frag.appendChild(d.createTextNode(' ')); return; }
            var s = d.createElement('span'); s.className = 'mot'; s.textContent = bout; frag.appendChild(s);
          });
          phrase.replaceChild(frag, n);
        });
        mots = $$('.mot', phrase);
      }
      var courantPrec = -1;
      if (histoire && plans.length) scene(histoire, function (p) {
        var n = plans.length, courant = 0;
        for (var i = 0; i < n; i++) {
          var l = p * n - i;                                   /* 0 → 1 pendant ce chapitre */
          var arrive = i === 0 ? 1 : doux(borne((l + 0.02) / 0.12)), part = i === n - 1 ? 0 : doux(borne((l - 0.86) / 0.12));
          var v = l < -0.02 ? (i === 0 ? 1 : 0) : Math.min(arrive, 1 - part);
          var s = (1 - arrive) - part;
          var pl = plans[i], vs = v.toFixed(3);
          if (pl.__v !== vs) {
            pl.__v = vs; pl.style.setProperty('--v', vs); pl.style.setProperty('--s', s.toFixed(3));
            pl.classList.toggle('vu', v > 0.01);
          }
          if (l >= 0.1) courant = i;
          if (pl === planPhrase) {
            var f = entre(l, 0.14, 0.66) * (mots.length + 2);
            for (var m = 0; m < mots.length; m++) {
              var o = (0.26 + 0.74 * borne(f - m)).toFixed(2);
              if (mots[m].__o !== o) { mots[m].__o = o; mots[m].style.setProperty('--o', o); }
            }
          }
        }
        if (courant !== courantPrec) {
          courantPrec = courant;
          fil.forEach(function (li, k) { li.classList.toggle('actif', k === courant); });
        }
      });
    }
  } catch (e) { $$('[data-plan]').forEach(function (pl) { pl.classList.add('vu'); pl.style.setProperty('--v', 1); }); }

  /* ------------------------------------------------------------
     6. Réalisations, courbe, piliers
     ------------------------------------------------------------ */
  try {
    if (anime) {
      $$('.cas[data-scene]').forEach(function (el) { scene(el); });
      var mesure = $('#mesure');
      if (mesure) scene(mesure, function (p) {
        var k = entre(p, 0.2, 0.52);
        mesure.style.setProperty('--k', k.toFixed(4));
        mesure.style.setProperty('--pt', k > 0.985 ? 1 : 0);
      });
      var piliers = $$('[data-pilier]');
      apresImage.push(function () {
        var h = window.innerHeight;
        for (var i = 0; i < piliers.length; i++) {
          var r = piliers[i].getBoundingClientRect();
          if (r.bottom < -h || r.top > 2 * h) continue;
          var ecart = Math.abs(r.top + r.height * 0.4 - h * 0.5);
          var f = 1 - borne((ecart - h * 0.1) / (h * 0.36));
          f = (f * f * (3 - 2 * f)).toFixed(3);
          if (piliers[i].__f !== f) { piliers[i].__f = f; piliers[i].style.setProperty('--f', f); }
        }
      });
    }
  } catch (e) {}

  /* ------------------------------------------------------------
     7. Avant / après
     ------------------------------------------------------------ */
  try {
    var avap = $('#avap'), reglage = $('#avapReglage'), imgAvant = $('#avapAvant'), imgApres = $('#avapApres'), legendeAvap = $('#avapLegende');
    var poserPos = function () { avap.style.setProperty('--pos', reglage.value + '%'); };
    reglage.addEventListener('input', poserPos); poserPos();
    $$('.avap-onglets button').forEach(function (b) {
      b.addEventListener('click', function () {
        $$('.avap-onglets button').forEach(function (x) { x.classList.remove('actif'); x.setAttribute('aria-pressed', 'false'); });
        b.classList.add('actif'); b.setAttribute('aria-pressed', 'true');
        imgAvant.src = b.getAttribute('data-avant'); imgApres.src = b.getAttribute('data-apres');
        imgAvant.alt = 'Avant : ' + b.textContent.trim().toLowerCase();
        imgApres.alt = 'Après : ' + b.getAttribute('data-legende');
        legendeAvap.textContent = b.getAttribute('data-legende');
        reglage.value = 50; poserPos();
      });
    });
  } catch (e) {}

  /* ------------------------------------------------------------
     8. Location ou propriété : le calcul
     ------------------------------------------------------------ */
  try {
    var loyer = $('#loyer'), loyerVal = $('#loyerVal'), totalLoc = $('#totalLoc'), noteLoc = $('#noteLoc');
    var barreLoc = $('#barreLoc'), barreNva = $('#barreNva'), ECHELLE = 300 * 48;
    var euros = function (n) { return n.toLocaleString('fr-FR').replace(/[  \s]/g, ' ') + ' €'; };
    var calculer = function () {
      var mois = +($('input[name=duree]:checked').value), l = +loyer.value, total = l * mois;
      loyerVal.textContent = euros(l) + ' HT';
      totalLoc.textContent = euros(total) + ' HT';
      noteLoc.textContent = 'payés au bout de ' + mois + ' mois';
      barreLoc.style.transform = 'scaleX(' + Math.max(0.025, total / ECHELLE).toFixed(4) + ')';
      barreNva.style.transform = 'scaleX(' + (1290 / ECHELLE).toFixed(4) + ')';
    };
    loyer.addEventListener('input', calculer);
    $$('input[name=duree]').forEach(function (r) { r.addEventListener('change', calculer); });
    calculer();
  } catch (e) {}

  /* ------------------------------------------------------------
     8. Le store à trois niveaux : la Prestige se déroule du haut sur l'Essentiel,
        puis le store remonte et la Signature descend à son tour.
        v va de 0 à 200 : 0 → 100 la Prestige, 100 → 200 la Signature.
        V5.3 (retour de Loïc, 14/10) : le store suit le défilement de la page. On arrive sur l'Essentiel,
        on descend : le Prestige se déroule, puis la Signature recouvre les deux. Plus de démonstration automatique.
     ------------------------------------------------------------ */
  (function () { try {
    var section = $('#store'), store = $('#cmpSlider'), boutonsNiveau = $$('#cmpNiveaux button'), demos = $$('#store .cmp-demo'), ecart = $('#cmpEcart'), indice = $('#cmpHint');
    var noms = ['Essentiel', 'Prestige', 'Signature'];
    var ecarts = [
      'On vous trouve : une page claire, votre fiche Google reliée, en ligne sous 48 h.',
      'On vous prend au sérieux : plusieurs sections, vos photos retouchées, vos avant/après.',
      'On vous reconnaît : un design qui n’existe qu’une fois, des textes écrits pour vous, et votre logo qui peut prendre vie.'
    ];
    var v = 0, niveau = -1, saisi = false, phase = 0;
    var poserStore = function (nv) {
      v = Math.max(0, Math.min(200, nv));
      var p1 = Math.min(100, v), p2 = Math.max(0, v - 100);
      var st = store.style;
      st.setProperty('--p1', p1 + '%'); st.setProperty('--p2', p2 + '%');
      st.setProperty('--pos', (v < 100 ? p1 : p2) + '%');
      var n = v < 34 ? 0 : v < 134 ? 1 : 2;
      store.setAttribute('aria-valuenow', Math.round(v / 2));
      if (n !== niveau) {
        niveau = n;
        store.setAttribute('aria-valuetext', noms[n]);
        boutonsNiveau.forEach(function (b, i) { b.classList.toggle('actif', i === n); b.setAttribute('aria-pressed', i === n ? 'true' : 'false'); });
        demos.forEach(function (a, i) { a.classList.toggle('show', i === n); });
        if (ecart) ecart.textContent = ecarts[n];
        store.setAttribute('data-niveau', n);
      }
    };

    /* le défilement mène le store : un palier sur chaque niveau, pour avoir le temps de regarder */
    var suit = anime && section && typeof scene === 'function';
    var versV = function (p) {
      if (p < 0.08) return 0;
      if (p < 0.42) return (p - 0.08) / 0.34 * 100;
      if (p < 0.56) return 100;
      if (p < 0.90) return 100 + (p - 0.56) / 0.34 * 100;
      return 200;
    };
    var versP = function (nv) {
      if (nv <= 0) return 0.04;
      if (nv < 100) return 0.08 + 0.34 * nv / 100;
      if (nv === 100) return 0.49;
      if (nv < 200) return 0.56 + 0.34 * (nv - 100) / 100;
      return 0.95;
    };
    var aller = function (nv, doux) {
      nv = Math.max(0, Math.min(200, nv));
      if (!suit) { poserStore(nv); return; }
      var haut = section.getBoundingClientRect().top + window.pageYOffset;
      var course = section.offsetHeight - window.innerHeight;
      try { window.scrollTo({ top: haut + course * versP(nv), behavior: doux ? 'smooth' : 'instant' }); }
      catch (e) { window.scrollTo(0, haut + course * versP(nv)); }
      if (!doux) poserStore(nv);
    };
    if (suit) {
      scene(section, function (p) { if (!saisi) poserStore(versV(p)); });
      if (indice) indice.textContent = 'Continuez à descendre : le store se déroule avec la page';
    }
    poserStore(0);

    var lacher = function () { saisi = false; store.classList.remove('saisi'); };
    var versY = function (y) {
      var r = store.getBoundingClientRect(), f = (y - r.top) / r.height * 100;
      f = Math.max(0, Math.min(100, f));
      if (phase === 0 && f >= 99) { aller(100); lacher(); phase = 1; return; }   /* la Prestige est entière : le store remonte, la Signature attend en haut */
      aller(phase * 100 + f);
    };
    store.addEventListener('pointerdown', function (ev) {
      /* au doigt, seule la poignée tire le store : ailleurs, le doigt fait défiler la page */
      if (ev.pointerType === 'touch' && !ev.target.closest('.cmp-handle')) return;
      phase = v >= 100 ? 1 : 0;
      saisi = true; store.classList.add('saisi');
      try { store.setPointerCapture(ev.pointerId); } catch (e) {}
      versY(ev.clientY);
    });
    store.addEventListener('pointermove', function (ev) { if (saisi) versY(ev.clientY); });
    ['pointerup', 'pointercancel'].forEach(function (n) { store.addEventListener(n, lacher); });
    store.addEventListener('keydown', function (ev) {
      var pas = { ArrowDown: 8, ArrowUp: -8, PageDown: 50, PageUp: -50 }[ev.key];
      if (ev.key === 'Home') pas = -200; else if (ev.key === 'End') pas = 200;
      if (!pas) return;
      ev.preventDefault();
      aller(v + pas);
    });
    boutonsNiveau.forEach(function (b) {
      b.addEventListener('click', function () { aller(+b.getAttribute('data-niveau') * 100, true); });
    });
    /* la boutique, plus bas, ne fait plus remonter la page : le store ne suit son choix que s'il ne suit pas le défilement */
    window.__store = function (p) { if (!suit) poserStore(p); };
  } catch (e) {} })();

  /* Prismatik : « Ajouter à ma Signature » coche l'option dans la boutique (la Signature va avec) */
  try {
    var ajoutP = $('#prismaAjouter'), caseOpt = $('#optPrismatik');
    if (ajoutP && caseOpt) ajoutP.addEventListener('click', function () {
      if (!caseOpt.checked) { caseOpt.checked = true; caseOpt.dispatchEvent(new Event('change', { bubbles: true })); }
    });
  } catch (e) {}

  /* V5.16 : on glisse son logo dans le formulaire. Il est réduit (1 200 px max), gardé en PNG pour garder la transparence,
     puis envoyé avec la demande dans le champ « logo » que le workflow n8n sait déjà lire (photo sur Telegram). */
  try {
    var depot = $('#depot'), fichier = $('#logoFichier'), apercu = $('#depotApercu'), depotNom = $('#depotNom'), retirer = $('#depotRetirer'), depotAide = $('#depotAide');
    if (depot && fichier) {
      var aideDepart = depotAide ? depotAide.innerHTML : '';
      window.__logoDemo = '';
      var dire = function (html) { if (depotAide) depotAide.innerHTML = html; };
      var lire = function (f) {
        if (!f) return;
        if (!/^image\/(png|jpeg|webp|svg\+xml)$/.test(f.type)) { dire('Ce fichier n’est pas une image. Choisissez votre logo en PNG (ou JPG).'); return; }
        if (f.size > 20000000) { dire('Ce fichier est trop lourd (plus de 20 Mo). Envoyez-le plutôt à <a href="mailto:contact@impact-nva.fr">contact@impact-nva.fr</a>.'); return; }
        var url = URL.createObjectURL(f), img = new Image();
        img.onload = function () {
          var w = img.naturalWidth || 800, hh = img.naturalHeight || 800, cote = 1200, data = '', transparent = false;
          do {
            var k = Math.min(1, cote / Math.max(w, hh)), c = d.createElement('canvas');
            c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(hh * k));
            var x = c.getContext('2d'); x.drawImage(img, 0, 0, c.width, c.height);
            try { var px = x.getImageData(0, 0, c.width, c.height).data; for (var i = 3; i < px.length; i += 16) { if (px[i] < 250) { transparent = true; break; } } } catch (e) {}
            data = c.toDataURL('image/png'); cote = Math.round(cote * 0.75);
          } while (data.length > 2700000 && cote > 300);
          URL.revokeObjectURL(url);
          window.__logoDemo = data;
          apercu.src = data; depotNom.textContent = f.name; depot.classList.add('plein');
          dire(transparent
            ? '<strong>Parfait</strong>&nbsp;: votre logo est bien sur fond transparent.'
            : 'Votre logo a un fond (blanc ou en couleur). Si vous avez une version <strong>sur fond transparent</strong>, elle donnera un meilleur résultat. Sinon, on s’en occupe.');
        };
        img.onerror = function () { URL.revokeObjectURL(url); dire('Cette image n’a pas pu être lue. Essayez un fichier PNG.'); };
        img.src = url;
      };
      fichier.addEventListener('change', function () { lire(fichier.files && fichier.files[0]); });
      ['dragenter', 'dragover'].forEach(function (n) { depot.addEventListener(n, function (ev) { ev.preventDefault(); depot.classList.add('survol'); }); });
      ['dragleave', 'drop'].forEach(function (n) { depot.addEventListener(n, function () { depot.classList.remove('survol'); }); });
      depot.addEventListener('drop', function (ev) { ev.preventDefault(); lire(ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files[0]); });
      retirer.addEventListener('click', function () {
        window.__logoDemo = ''; fichier.value = ''; depot.classList.remove('plein'); apercu.removeAttribute('src'); depotNom.textContent = ''; dire(aideDepart);
      });
    }
  } catch (e) {}

  /* V5.10 : le bouton « haut de page » remonte en douceur, sans rejouer l'ouverture */
  try {
    var navHaut = $('#navHaut');
    if (navHaut) navHaut.addEventListener('click', function (ev) {
      ev.preventDefault();
      try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { window.scrollTo(0, 0); }
      try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    });
  } catch (e) {}

  /* V5.7 : le logo-menu. De temps en temps, et au survol, le M éclate et devient N, V, A (comme Prismatik) */
  try {
    var sceau = $('#ouvrirMenu'), sommaire = $('#menu');
    if (sceau) {
      /* V5.8 : une révélation par la lumière ; le retour se fait en fondu (classe « retour ») */
      var ouvert = function () { return !!(sommaire && sommaire.open); };
      var garder = false, minuterieSceau = null, minuterieRetour = null;
      var revenir = function () {
        if (!sceau.classList.contains('nva')) return;
        sceau.classList.remove('nva'); sceau.classList.add('retour');
        clearTimeout(minuterieRetour);
        minuterieRetour = setTimeout(function () { sceau.classList.remove('retour'); }, 1050);
      };
      var transformer = function (duree) {
        if (!sceau.classList.contains('nva')) { sceau.classList.remove('retour'); clearTimeout(minuterieRetour); sceau.classList.add('nva'); }
        clearTimeout(minuterieSceau);
        if (duree) minuterieSceau = setTimeout(function () { if (!garder && !ouvert()) revenir(); }, duree);
      };
      sceau.addEventListener('mouseenter', function () { garder = true; transformer(0); });
      sceau.addEventListener('mouseleave', function () { garder = false; transformer(1200); });
      sceau.addEventListener('click', function () { transformer(0); });
      if (sommaire) sommaire.addEventListener('close', function () { transformer(1600); });
      if (anime) setInterval(function () {
        if (d.hidden || ouvert() || garder || racine.classList.contains('intro-en-cours')) return;
        transformer(2800);
      }, 9000);
    }
  } catch (e) {}

  /* ------------------------------------------------------------
     8 bis. La boutique : on choisit sa formule, la fiche et le total suivent
     ------------------------------------------------------------ */
  try {
    var boutique = $('#boutique'), fiches = $$('.fiche', boutique), radios = $$('input[name=formule]', boutique);
    var opt = $('#optPrismatik'), optBoite = $('#optionBoite');
    var tNom = $('#ticketNom'), tPrix = $('#ticketPrix'), tOpt = $('#ticketOption'), tTotal = $('#ticketTotal');
    var tAction = $('#ticketAction'), tNote = $('#ticketNote'), film = $('#filmPrismatik');
    var LIBELLES = { essentiel: 'Essentiel — 390€', prestige: 'Prestige — 690€', signature: 'Signature — 1 290€' };
    var somme = function (n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' €'; };
    var affiche = 1290, compteur = 0;
    var compter = function (vers) {
      var depuis = affiche, t0 = null, moi = ++compteur;
      if (!anime || depuis === vers) { affiche = vers; tTotal.textContent = somme(vers); return; }
      var pas = function (t) {
        if (moi !== compteur) return;
        if (t0 === null) t0 = t;
        var x = borne((t - t0) / 650);
        affiche = depuis + (vers - depuis) * sortie(x);
        tTotal.textContent = somme(affiche);
        if (x < 1) requestAnimationFrame(pas); else affiche = vers;
      };
      requestAnimationFrame(pas);
    };
    var majBoutique = function (source) {
      var coche = radios.filter(function (r) { return r.checked; })[0] || radios[radios.length - 1];
      /* l'option Prismatik va avec la Signature */
      if (source === 'option' && opt.checked && coche.value !== 'signature') {
        coche = radios.filter(function (r) { return r.value === 'signature'; })[0]; coche.checked = true;
      }
      if (source === 'formule' && coche.value !== 'signature') opt.checked = false;
      var choix = coche.value, avec = opt.checked;
      var fiche = fiches.filter(function (f) { return f.getAttribute('data-fiche') === choix; })[0];
      var prix = +fiche.getAttribute('data-prix');

      fiches.forEach(function (f) {
        var etait = f.classList.contains('actif');
        if (etait && f !== fiche) { f.classList.add('sorti'); setTimeout(function () { f.classList.remove('sorti'); }, 750); }
        f.classList.toggle('actif', f === fiche);
        if (f === fiche) f.classList.remove('sorti');
      });
      radios.forEach(function (r) { r.parentNode.classList.toggle('choisi', r.checked); });
      optBoite.classList.toggle('choisi', avec);
      boutique.classList.toggle('avec-prismatik', avec);

      tNom.textContent = fiche.getAttribute('data-nom'); tPrix.textContent = somme(prix); tOpt.hidden = !avec;
      compter(prix + (avec ? 290 : 0));
      if (avec) {
        tAction.textContent = 'Demander la Signature + Prismatik';
        tAction.setAttribute('href', '#contact'); tAction.removeAttribute('target');
        tNote.textContent = 'Pour cette formule, on échange d’abord quelques minutes. Vous recevez ensuite votre lien de paiement sécurisé.';
      } else {
        tAction.textContent = 'Commander ' + fiche.getAttribute('data-article');
        tAction.setAttribute('href', fiche.getAttribute('data-lien')); tAction.setAttribute('target', '_blank');
        tNote.textContent = 'Paiement sécurisé par Stripe. Aucun abonnement.';
      }
      /* le formulaire de contact reprend le choix fait ici */
      if (source) {
        if (window.__store) window.__store({ essentiel: 0, prestige: 100, signature: 200 }[choix]);
        var offreChamp = $('#offre'), caseP = $('#casePrismatik');
        if (offreChamp) offreChamp.value = LIBELLES[choix];
        if (caseP) caseP.checked = avec;
      }
      if (film) {
        try { if (avec) { var r = film.play(); if (r && r.catch) r.catch(function () {}); } else film.pause(); } catch (e) {}
      }
    };
    radios.forEach(function (r) { r.addEventListener('change', function () { majBoutique('formule'); }); });
    opt.addEventListener('change', function () { majBoutique('option'); });
    if (film) film.addEventListener('timeupdate', function () { if (film.currentTime > 0.05) film.parentNode.classList.add('joue'); });
    majBoutique(null);
  } catch (e) {}

  /* ------------------------------------------------------------
     9. Menu
     ------------------------------------------------------------ */
  try {
    var menu = $('#menu');
    var fermer = function () { if (menu.close) menu.close(); else menu.removeAttribute('open'); };
    $('#ouvrirMenu').addEventListener('click', function () { if (menu.showModal) menu.showModal(); else menu.setAttribute('open', ''); });
    $('#fermerMenu').addEventListener('click', fermer);
    $$('a', menu).forEach(function (a) { a.addEventListener('click', fermer); });
  } catch (e) {}

  /* ------------------------------------------------------------
     9 bis. Le formulaire guidé : trois courtes étapes au lieu d'une longue liste
     ------------------------------------------------------------ */
  var allerEtape = null;
  try {
    var formGuide = $('#formulaire'), etapes = $$('[data-etape]', formGuide), parcours = $$('#parcours li');
    var retour = $('#etapeRetour'), suite = $('#etapeSuite'), boutonEnvoi = $('#envoyer'), iEtape = 0;
    if (etapes.length > 1 && retour && suite) {
      formGuide.classList.add('par-etapes');
      allerEtape = function (i, focus) {
        iEtape = Math.max(0, Math.min(etapes.length - 1, i));
        etapes.forEach(function (e, n) { e.classList.toggle('actif', n === iEtape); });
        parcours.forEach(function (li, n) { li.classList.toggle('actif', n === iEtape); li.classList.toggle('fait', n < iEtape); });
        var fin = iEtape === etapes.length - 1;
        retour.hidden = iEtape === 0; suite.hidden = fin; boutonEnvoi.hidden = !fin;
        if (focus) {
          var premier = $('input:not([tabindex="-1"]),select,textarea', etapes[iEtape]);
          if (premier) { try { premier.focus({ preventScroll: true }); } catch (e) { premier.focus(); } }
        }
      };
      suite.addEventListener('click', function () { allerEtape(iEtape + 1, true); });
      retour.addEventListener('click', function () { allerEtape(iEtape - 1, true); });
      /* Entrée dans un champ d'une étape intermédiaire = « Continuer » */
      formGuide.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' && ev.target.tagName === 'INPUT' && iEtape < etapes.length - 1) { ev.preventDefault(); allerEtape(iEtape + 1, true); }
      });
      allerEtape(0, false);
    }
  } catch (e) { allerEtape = null; try { $('#formulaire').classList.remove('par-etapes'); $('#envoyer').hidden = false; } catch (e2) {} }

  /* ------------------------------------------------------------
     10. Formulaire → même webhook n8n que impact-nva.fr
     ------------------------------------------------------------ */
  try {
    var WEBHOOK = 'https://n8n.srv1677224.hstgr.cloud/webhook/impact-nva-lead';
    var ORIGINE = 'site-impact-nva';
    var f = $('#formulaire'), merci = $('#merci'), echec = $('#echec'), bouton = $('#envoyer');
    var champ = function (id) { return $('#' + id); };
    champ('entreprise').addEventListener('input', function () { this.setAttribute('data-touche', '1'); });

    var regles = {
      nom: function (v) { return v.trim().length > 1; },
      tel: function (v) { return v.replace(/\D/g, '').length >= 8; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }
    };
    var controler = function (id) {
      var el = champ(id), err = champ(id + 'Erreur'), bon = regles[id](el.value);
      el.setAttribute('aria-invalid', bon ? 'false' : 'true');
      if (bon) el.removeAttribute('aria-describedby'); else el.setAttribute('aria-describedby', id + 'Erreur');
      err.hidden = bon; return bon;
    };
    Object.keys(regles).forEach(function (id) {
      champ(id).addEventListener('blur', function () { if (this.value) controler(id); });
      champ(id).addEventListener('input', function () { if (this.getAttribute('aria-invalid') === 'true') controler(id); });
    });

    var afficherMerci = function (html) {
      merci.innerHTML = html; f.hidden = true; merci.hidden = false; merci.focus();
    };
    var propre = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

    f.addEventListener('submit', function (ev) {
      ev.preventDefault(); echec.hidden = true;
      var bons = Object.keys(regles).map(controler);
      if (bons.indexOf(false) !== -1) { if (allerEtape) allerEtape(2, false); var premier = $('[aria-invalid=true]', f); if (premier) premier.focus(); return; }

      var prenom = propre((champ('nom').value || '').trim().replace(/\s+/g, ' '));
      /* champ piège rempli = robot : on n'envoie rien, sans le prévenir */
      if (champ('societe').value.trim() !== '') { afficherMerci('Merci ' + prenom + ' ! Votre demande est bien reçue.'); return; }

      var entreprise = champ('entreprise').value.trim(), message = champ('msg').value.trim();
      var avecPrismatik = !!(champ('casePrismatik') && champ('casePrismatik').checked);
      var data = {
        nom: champ('nom').value.trim(),
        tel: champ('tel').value.trim(),
        email: champ('email').value.trim(),
        metier: champ('activite').value.trim() || 'Non précisé',
        offre: champ('offre').value,
        msg: (entreprise ? 'Entreprise : ' + entreprise + '\n' : '') + (champ('demo') && champ('demo').checked ? 'Démo du futur site demandée\n' : '') + (champ('logoLien') && champ('logoLien').value.trim() ? 'Logo : ' + champ('logoLien').value.trim() + '\n' : '') + (avecPrismatik ? 'Option Prismatik demandée (+290 €)\n' : '') + message,
        origine: ORIGINE,
        logo: window.__logoDemo || '',
        demo: !!(champ('demo') && champ('demo').checked),
        entreprise: entreprise
      };
      var libelle = bouton.textContent;
      bouton.disabled = true; bouton.textContent = 'Envoi en cours…';
      fetch(WEBHOOK, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) {
          if (!r.ok) throw new Error('http ' + r.status);
          var messages = {
            'Essentiel — 390€': 'Merci ' + prenom + ' ! Vous avez choisi l’offre <b>Essentiel</b> (390 €). On vous recontacte sous 24h avec votre lien de paiement et les prochaines étapes.',
            'Prestige — 690€': 'Merci ' + prenom + ' ! Vous avez choisi l’offre <b>Prestige</b> (690 €). On vous recontacte sous 24h avec votre lien de paiement et les prochaines étapes.',
            'Signature — 1 290€': 'Merci ' + prenom + ' ! Vous avez choisi la <b>Signature</b> (1 290 €). On vous recontacte sous 24h pour construire votre site.'
          };
          if (avecPrismatik && data.offre === 'Signature — 1 290€') messages[data.offre] = 'Merci ' + prenom + ' ! Vous avez choisi la <b>Signature</b> avec l’option <b>Prismatik</b> (1 580 €). On vous recontacte sous 24h pour construire votre site.';
          if (data.demo) { afficherMerci('Merci ' + prenom + ' ! Votre <b>démo offerte</b> est en préparation : elle vous arrive sous 48 h ouvrées dès que nous avons votre logo. Vous voyez votre futur site avant tout paiement.'); return; }
          afficherMerci(messages[data.offre] || 'Merci ' + prenom + ' ! On regarde votre besoin et on vous conseille la bonne formule, Essentiel, Prestige ou Signature, sous 24h.');
        })
        .catch(function () { echec.hidden = false; })
        .then(function () { bouton.disabled = false; bouton.textContent = libelle; });
    });
  } catch (e) {}

  if (anime) reveiller();
})();

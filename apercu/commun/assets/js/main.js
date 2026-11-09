/* Modele client Impact-NVA — V1 Essentiel
   Script unique, sans dependance. Aucun marqueur ici : le mode du site est lu
   sur l'attribut data-mode de la balise <html>. */
(function () {
  'use strict';

  var html = document.documentElement;
  var estDemo = html.getAttribute('data-mode') === 'demo';

  /* --- Menu mobile --- */
  var burger = document.querySelector('.burger');
  var nav = document.querySelector('.nav');

  if (burger && nav) {
    burger.addEventListener('click', function () {
      var ouvert = nav.classList.toggle('est-ouvert');
      burger.setAttribute('aria-expanded', ouvert ? 'true' : 'false');
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        nav.classList.remove('est-ouvert');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* --- Formulaire de contact --- */
  var form = document.querySelector('.formulaire form');

  if (form) {
    form.addEventListener('submit', function (e) {
      /* En mode demonstration le formulaire ne part nulle part :
         on previent le visiteur au lieu de perdre son message. */
      if (estDemo || !form.getAttribute('action')) {
        e.preventDefault();
        var note = form.querySelector('.retour-envoi');
        if (!note) {
          note = document.createElement('p');
          note.className = 'retour-envoi mention-rgpd';
          form.appendChild(note);
        }
        note.textContent =
          'Formulaire desactive sur cette demonstration. Il sera relie a votre '
          + 'boite mail et a votre telephone sur le site definitif.';
        return;
      }

      var bouton = form.querySelector('button[type="submit"]');
      if (bouton) {
        bouton.disabled = true;
        bouton.textContent = 'Envoi en cours...';
      }
    });
  }

  /* --- Bouton d appel flottant (mobile) ---
     Il apparait une fois le heros depasse, pour ne pas doubler le bouton
     d appel deja present dans le premier ecran. */
  /* Sur ordinateur, quand le numéro de la section contact est à l'écran,
     le bouton de l'en-tête s'efface : jamais deux numéros visibles. */
  var numeroContact = document.querySelector('#contact a[href^="tel:"]');
  if (numeroContact && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entrees) {
      document.documentElement.classList.toggle('numero-contact-visible', entrees[0].isIntersecting);
    }).observe(numeroContact);
  }

  /* La présentation du client, raccourcie à 3 lignes au téléphone :
     « Lire la suite » déplie le reste (Loïc, 09/11/2026 : « trop chargé »).
     Le bouton n'apparaît que si le texte est vraiment coupé. */
  var pres = document.querySelector('.presentation-texte');
  var suite = document.querySelector('.lire-suite');
  if (pres && suite) {
    var verifier = function () {
      if (!pres.classList.contains('ouvert')) suite.hidden = pres.scrollHeight <= pres.clientHeight + 2;
    };
    verifier();
    window.addEventListener('resize', verifier);
    suite.addEventListener('click', function () {
      var ouvert = pres.classList.toggle('ouvert');
      suite.textContent = ouvert ? 'Réduire' : 'Lire la suite';
    });
  }

  var appel = document.querySelector('.appel-flottant');

  if (appel) {
    var basculer = function () {
      /* Jamais deux numéros à l'écran (Loïc, 09/11/2026) : le bouton
         flottant se cache tant que le numéro du haut de page ou celui de la
         section contact est visible. */
      var vus = document.querySelectorAll('.heros .tel-mobile, #contact a[href^="tel:"]');
      var unVisible = false;
      for (var k = 0; k < vus.length; k++) {
        var r = vus[k].getBoundingClientRect();
        if (r.width && r.bottom > 0 && r.top < window.innerHeight) unVisible = true;
      }
      appel.classList.toggle('est-visible', window.scrollY > 420 && !unVisible);
    };
    basculer();
    window.addEventListener('scroll', basculer, { passive: true });
  }

  /* --- Annee courante dans le pied de page (si la page reste en ligne des annees) --- */
  var annees = document.querySelectorAll('[data-annee]');
  var annee = String(new Date().getFullYear());
  for (var i = 0; i < annees.length; i++) {
    annees[i].textContent = annee;
  }
})();

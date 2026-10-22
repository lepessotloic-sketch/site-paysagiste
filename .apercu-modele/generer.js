#!/usr/bin/env node
/* ==========================================================================
   generer.js — Impact-NVA, offre V1 Essentiel
   --------------------------------------------------------------------------
   Genere un site client a partir du modele et d un fichier de donnees JSON.
   Substitution de texte uniquement : aucune IA, aucun appel reseau.
   Resultat identique a chaque execution pour les memes donnees.

   Utilisation :
     node generer.js donnees.exemple.json ../sorties/mon-client
     node generer.js -  ../sorties/mon-client      (JSON lu sur l entree standard)

   Code de sortie 0 = succes, 1 = erreur (message sur la sortie d erreur).
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');

const RACINE = __dirname;
/* Le site complet, livre au client. */
const PAGES = [
  { source: 'index.html', cible: 'index.html' },
  { source: 'mentions-legales.html', cible: 'mentions-legales.html' },
  { source: 'merci.html', cible: 'merci.html' }
];

/* L apercu envoye a un prospect qui n a pas encore fourni logo ni photos :
   une seule page, servie comme page d accueil du dossier de demo. */
const PAGES_APERCU = [{ source: 'apercu.html', cible: 'index.html' }];
const DOSSIERS_COPIES = ['assets'];

/* En mode apercu, les assets ne sont pas copies dans chaque dossier de
   prospect : ils sont mutualises une fois pour toutes dans apercu/commun/.
   Un apercu ne pese alors que son HTML. Le chemin est relatif, donc il
   fonctionne aussi bien en local qu en ligne. */
const BASE_APERCU = '../commun/';

/* --------------------------------------------------------------------------
   Pictogrammes disponibles pour les services (cle "icone" dans le JSON)
   -------------------------------------------------------------------------- */
const ICONES = {
  tonte:
    '<path d="M3 17h4l2-9 3 11 2.5-7 1.5 5h5"/><circle cx="5" cy="20" r="2"/><circle cx="19" cy="20" r="2"/>',
  taille:
    '<path d="M9.5 9.5 3 3m6.5 6.5L16 16"/><path d="M14.5 9.5 21 3m-6.5 6.5L8 16"/><circle cx="6.5" cy="18.5" r="2.5"/><circle cx="17.5" cy="18.5" r="2.5"/>',
  elagage:
    '<path d="M12 22V9"/><path d="M12 9 7 4h10Z"/><path d="M12 14 6 8h12Z"/>',
  creation:
    '<path d="M3 21h18"/><path d="M5 21V8l7-5 7 5v13"/><path d="M9 21v-6h6v6"/>',
  terrasse:
    '<path d="M3 20h18M5 20V9m4.5 11V9M14 20V9m4.5 11V9"/><path d="M2 6h20l-2-3H4Z"/>',
  cloture:
    '<path d="M4 21V8l2-3 2 3v13M16 21V8l2-3 2 3v13"/><path d="M2 11h20M2 16h20"/>',
  debroussaillage:
    '<path d="M12 22V12"/><path d="M12 12C9 12 6 9 6 5c3 0 6 3 6 7Z"/><path d="M12 12c3 0 6-3 6-7-3 0-6 3-6 7Z"/>',
  arrosage:
    '<path d="M12 21s6-5.5 6-10a6 6 0 0 0-12 0c0 4.5 6 10 6 10Z"/><path d="M12 11v4"/>',
  entretien:
    '<path d="M14.7 6.3a4 4 0 0 1-5.4 5.4L4 17v3h3l5.3-5.3a4 4 0 0 1 5.4-5.4l2-2-3-3Z"/>',
  feuille:
    '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>'
};

/* --------------------------------------------------------------------------
   Outils
   -------------------------------------------------------------------------- */

function echapper(valeur) {
  return String(valeur)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stopper(message) {
  console.error('\n  ERREUR : ' + message + '\n');
  process.exit(1);
}

function telVersLien(telephone) {
  const chiffres = String(telephone).replace(/[^0-9+]/g, '');
  if (chiffres.startsWith('+')) return chiffres;
  if (chiffres.startsWith('0')) return '+33' + chiffres.slice(1);
  return chiffres;
}

function copierDossier(source, cible) {
  fs.mkdirSync(cible, { recursive: true });
  for (const entree of fs.readdirSync(source, { withFileTypes: true })) {
    const de = path.join(source, entree.name);
    const vers = path.join(cible, entree.name);
    if (entree.isDirectory()) copierDossier(de, vers);
    else fs.copyFileSync(de, vers);
  }
}

/* --------------------------------------------------------------------------
   Construction des blocs HTML repetitifs
   -------------------------------------------------------------------------- */

function construireServices(services) {
  if (!Array.isArray(services) || services.length === 0) {
    stopper('la cle SERVICES doit etre une liste non vide.');
  }

  return services
    .map(function (service, i) {
      const nom = service.icone && ICONES[service.icone] ? service.icone : 'feuille';
      if (service.icone && !ICONES[service.icone]) {
        console.warn(
          '  ! icone inconnue "' + service.icone + '" (service ' + (i + 1) + ') : feuille utilisee.' +
          ' Disponibles : ' + Object.keys(ICONES).join(', ')
        );
      }
      return [
        '<article class="service">',
        '  <div class="service__icone">',
        '    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
          'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONES[nom] + '</svg>',
        '  </div>',
        '  <h3>' + echapper(service.titre || '') + '</h3>',
        '  <p>' + echapper(service.texte || '') + '</p>',
        '</article>'
      ].join('\n        ');
    })
    .join('\n        ');
}

function construireCommunes(communes) {
  if (!Array.isArray(communes) || communes.length === 0) {
    stopper('la cle COMMUNES doit etre une liste non vide.');
  }
  return communes
    .map(function (c) {
      return '<li>' + echapper(c) + '</li>';
    })
    .join('\n          ');
}

/* --------------------------------------------------------------------------
   Preparation du jeu de marqueurs
   -------------------------------------------------------------------------- */

function preparerMarqueurs(d, apercu) {
  /* L apercu n affiche pas le telephone du prospect : on ne le lui impose
     pas. Le site complet, lui, ne vaut rien sans numero joignable. */
  const obligatoires = apercu
    ? ['ENTREPRISE', 'VILLE']
    : ['ENTREPRISE', 'VILLE', 'TELEPHONE'];

  for (const cle of obligatoires) {
    if (!d[cle] || !String(d[cle]).trim()) {
      stopper('la cle ' + cle + ' est obligatoire dans le fichier de donnees.');
    }
  }

  const mode = (d.MODE || 'demo').toLowerCase();
  if (mode !== 'demo' && mode !== 'client') {
    stopper('MODE doit valoir "demo" ou "client" (recu : "' + d.MODE + '").');
  }

  const couleur = d.COULEUR || '#2e7d4f';
  if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(couleur)) {
    stopper('COULEUR doit etre un code hexadecimal, par exemple "#2e7d4f" (recu : "' + couleur + '").');
  }

  const domaine = d.DOMAINE || (mode === 'demo' ? 'demo.impact-nva.fr' : '');
  if (mode === 'client' && !domaine) {
    stopper('DOMAINE est obligatoire en MODE=client (exemple : "monclient.fr").');
  }

  /* Photos : si une photo n est pas fournie, on retombe sur les visuels de
     demonstration livres avec le modele. En MODE=client on previent, car un
     client ne doit pas rester avec des photos qui ne sont pas les siennes. */
  const photos = {};
  const base = apercu ? BASE_APERCU : '';
  const defauts = {
    PHOTO_1: base + 'assets/images/demo-1.webp',
    PHOTO_2: base + 'assets/images/demo-2.webp',
    PHOTO_3: base + 'assets/images/demo-3.webp',
    PHOTO_4: base + 'assets/images/demo-4.webp',
    PHOTO_5: base + 'assets/images/demo-5.webp',
    PHOTO_6: base + 'assets/images/demo-6.webp'
  };
  let manquantes = 0;
  for (const cle of Object.keys(defauts)) {
    if (d[cle] && String(d[cle]).trim()) {
      photos[cle] = String(d[cle]).trim();
    } else {
      photos[cle] = defauts[cle];
      manquantes++;
    }
  }
  if (mode === 'client' && manquantes > 0) {
    console.warn(
      '  ! ' + manquantes + ' photo(s) non fournie(s) en MODE=client : ' +
      'les visuels de demonstration sont utilises. A remplacer avant mise en ligne.'
    );
  }

  const marqueurs = {
    ENTREPRISE: echapper(d.ENTREPRISE),
    VILLE: echapper(d.VILLE),
    ZONE: echapper(d.ZONE || d.VILLE + ' et ses alentours'),
    TELEPHONE: echapper(d.TELEPHONE || ''),
    TEL_LIEN: telVersLien(d.TEL_LIEN || d.TELEPHONE || ''),
    EMAIL: echapper(d.EMAIL || ''),
    SERVICES: apercu ? '' : construireServices(d.SERVICES),
    COMMUNES: apercu ? '' : construireCommunes(d.COMMUNES),
    LOGO_URL: echapper(d.LOGO_URL || ''),
    COULEUR: couleur,
    MODE: mode,
    ANNEE: String(d.ANNEE || new Date().getFullYear()),
    DOMAINE: echapper(domaine),
    FORMULAIRE_ACTION: echapper(mode === 'demo' ? '' : d.FORMULAIRE_ACTION || ''),
    SIRET: echapper(d.SIRET || 'a completer avant mise en ligne'),
    /* Derives, pas a renseigner dans le JSON */
    BASE: base,
    ROBOTS: mode === 'demo' ? 'noindex,nofollow' : 'index,follow'
  };

  for (const cle of Object.keys(photos)) marqueurs[cle] = echapper(photos[cle]);

  /* Toute autre cle du JSON devient un marqueur : {{MA_CLE}} */
  for (const cle of Object.keys(d)) {
    if (!(cle in marqueurs) && typeof d[cle] !== 'object') {
      marqueurs[cle] = echapper(d[cle]);
    }
  }

  if (!marqueurs.EMAIL) {
    console.warn(
      '  ! aucun EMAIL fourni : les blocs e-mail sont masques sur le site. ' +
      'Le telephone reste affiche partout.'
    );
  }

  if (mode === 'client' && !marqueurs.FORMULAIRE_ACTION) {
    console.warn('  ! FORMULAIRE_ACTION vide en MODE=client : le formulaire n enverra rien.');
  }

  return marqueurs;
}

/* --------------------------------------------------------------------------
   Remplacement
   -------------------------------------------------------------------------- */

function remplacer(contenu, marqueurs, nomFichier) {
  const inconnus = new Set();

  const resultat = contenu.replace(/\{\{([A-Z0-9_]+)\}\}/g, function (tout, cle) {
    if (cle in marqueurs) return marqueurs[cle];
    inconnus.add(cle);
    return '';
  });

  if (inconnus.size > 0) {
    console.warn(
      '  ! ' + nomFichier + ' : marqueur(s) sans valeur, remplace(s) par du vide -> ' +
      Array.from(inconnus).map(function (c) { return '{{' + c + '}}'; }).join(', ')
    );
  }
  return resultat;
}

/* --------------------------------------------------------------------------
   Fichiers techniques (robots.txt, sitemap.xml)
   -------------------------------------------------------------------------- */

function ecrireFichiersTechniques(sortie, m) {
  if (m.MODE === 'demo') {
    /* Une demonstration ne doit jamais etre indexee. */
    fs.writeFileSync(
      path.join(sortie, 'robots.txt'),
      'User-agent: *\nDisallow: /\n',
      'utf8'
    );
    return;
  }

  fs.writeFileSync(
    path.join(sortie, 'robots.txt'),
    'User-agent: *\nAllow: /\n\nSitemap: https://' + m.DOMAINE + '/sitemap.xml\n',
    'utf8'
  );

  const aujourdhui = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(
    path.join(sortie, 'sitemap.xml'),
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      '  <url><loc>https://' + m.DOMAINE + '/</loc><lastmod>' + aujourdhui +
      '</lastmod><priority>1.0</priority></url>\n' +
      '  <url><loc>https://' + m.DOMAINE + '/mentions-legales.html</loc><lastmod>' +
      aujourdhui + '</lastmod><priority>0.3</priority></url>\n' +
      '</urlset>\n',
    'utf8'
  );
}

/* --------------------------------------------------------------------------
   Programme principal
   -------------------------------------------------------------------------- */

function lireDonnees(source) {
  let brut;
  if (source === '-') {
    brut = fs.readFileSync(0, 'utf8');
  } else {
    if (!fs.existsSync(source)) stopper('fichier de donnees introuvable : ' + source);
    brut = fs.readFileSync(source, 'utf8');
  }
  try {
    return JSON.parse(brut.replace(/^﻿/, ''));
  } catch (e) {
    stopper('JSON invalide (' + e.message + ').');
  }
}

function main() {
  const args = process.argv.slice(2);
  const apercu = args.includes('--apercu');
  const positions = args.filter(function (a) { return a !== '--apercu'; });

  if (positions.length < 2 || args[0] === '--aide' || args[0] === '-h') {
    console.log(
      '\n  Generateur de site client — Impact-NVA V1 Essentiel\n\n' +
      '  node generer.js <donnees.json> <dossier-de-sortie>\n' +
      '  node generer.js -  <dossier-de-sortie>     (JSON sur l entree standard)\n\n' +
      '  --apercu : une seule page d apercu au lieu du site complet\n\n' +
      '  Exemple :\n' +
      '    node generer.js donnees.exemple.json ../sorties/mon-client\n'
    );
    process.exit(positions.length < 2 ? 1 : 0);
  }

  const donnees = lireDonnees(positions[0]);
  const sortie = path.resolve(process.cwd(), positions[1]);

  if (sortie === RACINE) stopper('le dossier de sortie ne peut pas etre le modele lui-meme.');

  const marqueurs = preparerMarqueurs(donnees, apercu);

  /* Dossier de sortie propre : on repart de zero a chaque generation. */
  fs.rmSync(sortie, { recursive: true, force: true });
  fs.mkdirSync(sortie, { recursive: true });

  if (!apercu) {
    for (const dossier of DOSSIERS_COPIES) {
      copierDossier(path.join(RACINE, dossier), path.join(sortie, dossier));
    }
  }

  for (const page of (apercu ? PAGES_APERCU : PAGES)) {
    const chemin = path.join(RACINE, page.source);
    if (!fs.existsSync(chemin)) stopper('page manquante dans le modele : ' + page.source);
    const contenu = remplacer(fs.readFileSync(chemin, 'utf8'), marqueurs, page.source);
    fs.writeFileSync(path.join(sortie, page.cible), contenu, 'utf8');
  }

  ecrireFichiersTechniques(sortie, marqueurs);

  console.log(apercu ? '\n  Apercu genere.' : '\n  Site genere.');
  console.log('  Entreprise : ' + donnees.ENTREPRISE + ' (' + donnees.VILLE + ')');
  console.log('  Mode       : ' + marqueurs.MODE + (marqueurs.MODE === 'demo' ? '  (noindex, formulaire inactif)' : '  (indexable)'));
  console.log('  Couleur    : ' + marqueurs.COULEUR);
  console.log('  Logo       : ' + (marqueurs.LOGO_URL || 'logotype typographique'));
  console.log('  Sortie     : ' + sortie + '\n');
}

main();

#!/usr/bin/env node
/* ==========================================================================
   nouvelle-demo.js — Impact-NVA, offre V1 Essentiel
   --------------------------------------------------------------------------
   Prepare la demonstration d un prospect, prete a publier, et affiche le lien
   a lui envoyer.

   Chaque demo recoit un code aleatoire dans son adresse :

     impact-nva.fr/apercu/les-clayes-du-jardin-77-k3m9xq/

   Pourquoi : deux prospects demarches en meme temps sont souvent concurrents
   sur le meme secteur. Sans ce code, l un peut deviner l adresse de l autre a
   partir de son nom et decouvrir qu on demarche son voisin. Le code rend
   chaque lien introuvable autrement qu en le recevant.

   Utilisation :
     node nouvelle-demo.js ../sorties/les-clayes-du-jardin-77.json
     node nouvelle-demo.js ../sorties/mon-prospect.json --sortie <dossier>

   Le lien n est pas secret pour autant : qui le recoit peut le transmettre.
   Ne jamais mettre dans une demo ce qu on ne pourrait pas montrer a un tiers.
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const RACINE = __dirname;
const GENERATEUR = path.join(RACINE, 'generer.js');
const SORTIE_PAR_DEFAUT = path.join(RACINE, '..', 'site-paysagiste', 'apercu');
const DOMAINE_DEMOS = 'impact-nva.fr/apercu';

/* Alphabet sans caracteres confondables (0/O, 1/l/I) : un lien se relit
   parfois au telephone. */
const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
const LONGUEUR_CODE = 6;

function stopper(message) {
  console.error('\n  ERREUR : ' + message + '\n');
  process.exit(1);
}

function code() {
  let s = '';
  for (let i = 0; i < LONGUEUR_CODE; i++) {
    s += ALPHABET[crypto.randomInt(ALPHABET.length)];
  }
  return s;
}

function slug(texte) {
  return String(texte)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   /* accents */
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function main() {
  const args = process.argv.slice(2);

  if (args.length < 1 || args[0] === '--aide' || args[0] === '-h') {
    console.log(
      '\n  Prepare la demo d un prospect — Impact-NVA V1 Essentiel\n\n' +
      '  node nouvelle-demo.js <donnees.json> [--sortie <dossier-des-demos>]\n\n' +
      '  Exemple :\n' +
      '    node nouvelle-demo.js ../sorties/les-clayes-du-jardin-77.json\n'
    );
    process.exit(args.length < 1 ? 1 : 0);
  }

  const fichier = args[0];
  if (fichier !== '-' && !fs.existsSync(fichier)) {
    stopper('fichier de donnees introuvable : ' + fichier);
  }

  const i = args.indexOf('--sortie');
  const dossierDemos = path.resolve(
    process.cwd(),
    i !== -1 && args[i + 1] ? args[i + 1] : SORTIE_PAR_DEFAUT
  );

  let donnees;
  try {
    /* "-" : le JSON arrive sur l entree standard, comme pour generer.js. */
    const brut = fs.readFileSync(fichier === '-' ? 0 : fichier, 'utf8');
    donnees = JSON.parse(brut.replace(/^﻿/, ''));
  } catch (e) {
    stopper('JSON invalide (' + e.message + ').');
  }

  if (!donnees.ENTREPRISE) stopper('la cle ENTREPRISE est obligatoire.');

  /* --nom impose le dossier au lieu d en tirer un. Sert a la generation
     automatique : n8n tire le code lui-meme pour connaitre le lien avant
     meme que la page soit publiee. Format verrouille : le nom finit dans un
     chemin de fichier, il ne doit jamais pouvoir sortir du dossier. */
  const j = args.indexOf('--nom');
  let nom;
  if (j !== -1 && args[j + 1]) {
    nom = args[j + 1];
    if (!/^[a-z0-9][a-z0-9-]{1,63}$/.test(nom)) {
      stopper('--nom invalide : minuscules, chiffres et tirets seulement (recu : "' + nom + '").');
    }
  } else {
    nom = slug(donnees.ENTREPRISE) + '-' + code();
  }

  /* Une demo reste une demo : le mode et le domaine sont imposes ici, pour
     qu une erreur dans le JSON ne mette pas une page indexable en ligne. */
  donnees.MODE = 'demo';
  donnees.DOMAINE = DOMAINE_DEMOS + '/' + nom;

  const sortie = path.join(dossierDemos, nom);

  execFileSync(process.execPath, [GENERATEUR, '-', sortie, '--apercu'], {
    input: JSON.stringify(donnees),
    stdio: ['pipe', 'inherit', 'inherit']
  });

  /* Un robots.txt de sous-dossier n est jamais lu : seul celui de la racine
     du domaine compte. On le retire pour ne pas laisser croire le contraire. */
  fs.rmSync(path.join(sortie, 'robots.txt'), { force: true });

  console.log('  Lien a envoyer au prospect :');
  console.log('  https://' + donnees.DOMAINE + '/\n');
}

main();

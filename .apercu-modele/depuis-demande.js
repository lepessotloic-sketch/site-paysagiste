#!/usr/bin/env node
/* ==========================================================================
   depuis-demande.js — Impact-NVA, offre V1 Essentiel
   --------------------------------------------------------------------------
   Genere l apercu d un prospect a partir d une demande arrivee par le
   formulaire du site. Lit les valeurs dans l environnement, les valide, puis
   appelle nouvelle-demo.js.

   Concu pour tourner dans une GitHub Action, ou n importe quel automate.

   Variables attendues :
     ENTREPRISE  nom de l entreprise         (obligatoire)
     VILLE       commune                     (obligatoire)
     NOM         dossier de sortie impose    (obligatoire, ex: jardins-x-k3m9xq)
     TELEPHONE   telephone du prospect       (optionnel, pas affiche)
     SORTIE      dossier des apercus         (defaut : ../site-paysagiste/apercu)

   Les valeurs viennent d un formulaire public : elles sont traitees comme
   hostiles. Longueurs bornees, caracteres de controle refuses, et le nom du
   dossier est verrouille par nouvelle-demo.js. L echappement HTML est fait
   par generer.js.
   ========================================================================== */

'use strict';

const path = require('path');
const { execFileSync } = require('child_process');

const RACINE = __dirname;
const LIMITES = { ENTREPRISE: 80, VILLE: 60, TELEPHONE: 25 };

function stopper(message) {
  console.error('\n  ERREUR : ' + message + '\n');
  process.exit(1);
}

/* Une saisie publique peut contenir n importe quoi. On enleve les caracteres
   de controle, on reduit les espaces, on borne la longueur. */
function nettoyer(valeur, limite) {
  return String(valeur || '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, limite);
}

function main() {
  const entreprise = nettoyer(process.env.ENTREPRISE, LIMITES.ENTREPRISE);
  const ville = nettoyer(process.env.VILLE, LIMITES.VILLE);
  const telephone = nettoyer(process.env.TELEPHONE, LIMITES.TELEPHONE);
  const nom = nettoyer(process.env.NOM, 64);

  if (entreprise.length < 2) stopper('ENTREPRISE manquante ou trop courte.');
  if (ville.length < 2) stopper('VILLE manquante ou trop courte.');
  if (!nom) stopper('NOM manquant : le dossier de sortie doit etre impose par l appelant.');

  const sortie = process.env.SORTIE
    ? path.resolve(process.env.SORTIE)
    : path.join(RACINE, '..', 'site-paysagiste', 'apercu');

  /* Un prospect qui demande un apercu n a encore rien fourni : pas de logo,
     pas de photos, pas de communes. La page d apercu est faite pour ca. */
  const donnees = {
    ENTREPRISE: entreprise,
    VILLE: ville,
    TELEPHONE: telephone,
    ZONE: ville + ' et ses alentours'
  };

  execFileSync(
    process.execPath,
    [path.join(RACINE, 'nouvelle-demo.js'), '-', '--sortie', sortie, '--nom', nom],
    { input: JSON.stringify(donnees), stdio: ['pipe', 'inherit', 'inherit'] }
  );
}

main();

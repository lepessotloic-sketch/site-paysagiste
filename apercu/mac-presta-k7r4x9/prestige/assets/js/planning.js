/* MAC PRESTA — planning, demandes et bons de commande (démo : tout reste dans ce navigateur) */
(function () {
  const $ = s => document.querySelector(s);
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  const TARIF = {
    finisseur: { jour: 400, nuit: 550, nom: 'Chauffeur régleur finisseur' },
    cylindre:  { jour: 400, nuit: 550, nom: 'Chauffeur cylindre' }
  };
  const HEURE_PE = 30;
  const auj = new Date(); auj.setHours(0, 0, 0, 0);
  const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const plus = n => { const d = new Date(auj); d.setDate(d.getDate() + n); return iso(d); };
  const fmtDate = j => { const [a, m, dd] = j.split('-').map(Number); return new Date(a, m - 1, dd).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* jours déjà pris (exemple), calculés depuis aujourd'hui pour que la démo reste vivante */
  const prisDemo = [1, 2, 6, 7, 8, 13, 14, 20, 23, 27, 28, 34, 35, 41].map(plus);
  let demandes = store.get('mp-demandes', null) || [
    { id: 1, date: plus(10), presta: 'finisseur', creneau: 'nuit', heure: '21:00', pe: 0, loin: false, adresse: 'A4, aire de Ferrières, 77164 Ferrières-en-Brie', societe: "Routes de l'Est TP", resp: 'J. Martin', tel: '06 11 22 33 44', mail: 'chantier@exemple.fr', desc: 'Finisseur 1900-5 loué, rabotage la veille', statut: 'attente' },
    { id: 2, date: plus(16), presta: 'cylindre', creneau: 'jour', heure: '07:30', pe: 2, loin: false, adresse: 'Rue de la Gare, 77400 Lagny-sur-Marne', societe: 'Voirie 77', resp: 'S. Durand', tel: '06 55 66 77 88', mail: 'contact@exemple.fr', desc: "Cylindre tandem de l'entreprise, accès par l'arrière", statut: 'attente' }
  ];
  let numBC = store.get('mp-num', 1);
  const sauve = () => { store.set('mp-demandes', demandes); store.set('mp-num', numBC); };
  const estPris = j => prisDemo.includes(j) || demandes.some(d => d.statut === 'validee' && d.date === j);
  const prixDe = d => d.loin ? null : TARIF[d.presta][d.creneau] + HEURE_PE * (+d.pe || 0);

  /* ---------- calendrier ---------- */
  const vue = new Date(auj.getFullYear(), auj.getMonth(), 1);
  let choisi = null;
  function cal() {
    const c = $('#cal'); c.innerHTML = '';
    ['L', 'M', 'M', 'J', 'V', 'S', 'D'].forEach(j => c.insertAdjacentHTML('beforeend', '<div class="js" aria-hidden="true">' + j + '</div>'));
    $('#nom-mois').textContent = vue.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const dec = (vue.getDay() + 6) % 7;
    for (let i = 0; i < dec; i++) c.insertAdjacentHTML('beforeend', '<div class="jour vide"></div>');
    const n = new Date(vue.getFullYear(), vue.getMonth() + 1, 0).getDate();
    for (let d = 1; d <= n; d++) {
      const dt = new Date(vue.getFullYear(), vue.getMonth(), d), j = iso(dt);
      const b = document.createElement('button'); b.type = 'button'; b.className = 'jour';
      if (dt <= auj) { b.classList.add('passe'); b.disabled = true; b.textContent = d; }
      else if (estPris(j)) { b.classList.add('pris'); b.disabled = true; b.innerHTML = d + '<small>Pris</small>'; b.setAttribute('aria-label', fmtDate(j) + ' : pris'); }
      else {
        b.classList.add('libre'); b.innerHTML = d + '<small>Libre</small>'; b.setAttribute('aria-label', fmtDate(j) + ' : libre');
        if (j === choisi) { b.classList.add('choisi'); b.setAttribute('aria-pressed', 'true'); }
        b.addEventListener('click', () => { choisi = j; cal(); maj(); if (innerWidth < 900) $('#resa-form').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
      }
      c.appendChild(b);
    }
    $('#prec').disabled = vue <= new Date(auj.getFullYear(), auj.getMonth(), 1);
    $('#suiv').disabled = vue >= new Date(auj.getFullYear(), auj.getMonth() + 3, 1);
  }
  $('#prec').addEventListener('click', () => { vue.setMonth(vue.getMonth() - 1); cal(); });
  $('#suiv').addEventListener('click', () => { vue.setMonth(vue.getMonth() + 1); cal(); });

  /* ---------- formulaire ---------- */
  const val = id => $(id).value.trim();
  const lire = () => ({
    date: choisi,
    presta: document.querySelector('[name=presta]:checked').value,
    creneau: document.querySelector('[name=creneau]:checked').value,
    heure: val('#r-heure'), pe: Math.max(0, parseInt($('#r-pe').value, 10) || 0), loin: $('#r-loin').checked,
    adresse: val('#r-adresse'), societe: val('#r-societe'), resp: val('#r-resp'), tel: val('#r-tel'), mail: val('#r-mail'), desc: val('#r-desc')
  });
  function maj() {
    const f = lire();
    $('#recap-date').textContent = f.date ? 'Date choisie : ' + fmtDate(f.date) + (f.creneau === 'nuit' ? ', de nuit' : ', de jour') : "Choisissez d'abord un jour libre dans le planning.";
    const p = prixDe(f); $('#prix').textContent = p === null ? 'Sur devis' : p + ' € net';
    const m = [];
    if (!f.date) m.push('une date'); if (!f.heure) m.push("l'heure"); if (!f.adresse) m.push("l'adresse du chantier");
    if (!f.societe) m.push('la société'); if (!f.resp) m.push('le responsable');
    if (!/\d{6,}/.test(f.tel.replace(/\D/g, ''))) m.push('le téléphone'); if (!/^\S+@\S+\.\S+$/.test(f.mail)) m.push("l'e-mail");
    $('#envoyer').disabled = m.length > 0;
    $('#aide').textContent = m.length ? 'Il manque : ' + m.join(', ') + '.' : 'Tout est prêt : Mickael recevra votre demande sur son téléphone.';
  }
  const form = $('#resa-form');
  form.addEventListener('input', maj); form.addEventListener('change', maj);
  form.addEventListener('submit', e => {
    e.preventDefault(); if ($('#envoyer').disabled) return;
    const f = lire(); f.id = Date.now(); f.statut = 'attente'; f.nouvelle = true;
    demandes.unshift(f); sauve(); app();
    form.style.display = 'none'; $('#envoye').style.display = 'block';
  });
  $('#autre').addEventListener('click', () => { form.reset(); choisi = null; cal(); maj(); $('#envoye').style.display = 'none'; form.style.display = 'block'; });

  /* ---------- espace Mickael ---------- */
  function app() {
    const z = $('#demandes'), att = demandes.filter(d => d.statut === 'attente').length;
    $('#nb-att').textContent = att + (att > 1 ? ' en attente' : ' en attente');
    if (!demandes.length) { z.innerHTML = '<p class="note-demo" style="text-align:center;padding:1rem">Aucune demande pour l\'instant.</p>'; return; }
    z.innerHTML = demandes.map(d => {
      const p = prixDe(d);
      const boutons = d.statut === 'validee'
        ? `<span class="etat">✓ Validée · ${d.num}</span><button class="ghost-button" data-voir="${d.id}">Voir le bon</button>`
        : d.statut === 'refusee' ? '<span class="etat" style="color:var(--ink-3)">Refusée</span>'
        : `<button class="cta-button" data-ok="${d.id}">Valider</button><button class="ghost-button" data-non="${d.id}">Refuser</button>`;
      return `<div class="dem ${d.statut === 'validee' ? 'ok' : ''}"><div>
        <h4>${esc(d.societe)} · ${d.creneau === 'nuit' ? 'nuit' : 'jour'}${d.nouvelle ? '<span class="nouvelle">nouvelle</span>' : ''}</h4>
        <div class="inf"><b>${esc(fmtDate(d.date))}</b> à <b>${esc(d.heure)}</b> · ${TARIF[d.presta].nom}${d.pe ? ' + porte-engins ' + d.pe + ' h' : ''}<br>${esc(d.adresse)}<br>${esc(d.resp)} · ${esc(d.tel)} · ${p === null ? 'sur devis' : p + ' € net'}</div>
        </div><div class="bt">${boutons}</div></div>`;
    }).join('');
    z.querySelectorAll('[data-ok]').forEach(b => b.addEventListener('click', () => {
      const d = demandes.find(x => x.id == b.dataset.ok);
      if (estPris(d.date)) { alert('Cette date est déjà prise dans votre planning.'); return; }
      d.statut = 'validee'; d.nouvelle = false; d.num = 'BC-' + new Date().getFullYear() + '-' + String(numBC++).padStart(4, '0'); d.valideLe = new Date().toLocaleDateString('fr-FR');
      sauve(); app(); cal(); bon(d);
    }));
    z.querySelectorAll('[data-non]').forEach(b => b.addEventListener('click', () => { const d = demandes.find(x => x.id == b.dataset.non); d.statut = 'refusee'; d.nouvelle = false; sauve(); app(); }));
    z.querySelectorAll('[data-voir]').forEach(b => b.addEventListener('click', () => bon(demandes.find(x => x.id == b.dataset.voir))));
  }

  /* ---------- bon de commande ---------- */
  function bon(d) {
    const p = prixDe(d), base = TARIF[d.presta][d.creneau];
    const x = v => `<span class="x">${v ? '✕' : ''}</span>`;
    $('#bc').innerHTML = `<div class="bc-tete"><img src="assets/images/logo-macpresta.png" alt="MAC PRESTA"><div class="num"><h3>Bon de commande</h3><div>N° <b>${d.num}</b></div><div>Validé le ${d.valideLe}</div></div></div>
      <table>
        <tr><td class="l">Intervenant</td><td>MAC PRESTA · Mickael Araujo Costa · 06 20 53 59 57<br>31 D rue du Luxembourg, 77580 Pierre-Levée · SIRET 914 315 528 00010</td></tr>
        <tr><td class="l">Société cliente</td><td>${esc(d.societe)}</td></tr>
        <tr><td class="l">Responsable sur place</td><td>${esc(d.resp)} · ${esc(d.tel)} · ${esc(d.mail)}</td></tr>
        <tr><td class="l">Adresse du chantier</td><td>${esc(d.adresse)}</td></tr>
        <tr><td class="l">Date et heure</td><td><b>${esc(fmtDate(d.date))}</b>, rendez-vous à <b>${esc(d.heure)}</b> · prestation de ${d.creneau} (8 h)</td></tr>
        <tr><td class="l">Machine confiée</td><td>${esc(d.desc || '—')}</td></tr>
      </table>
      <table class="cases"><tr>
        <td>Chauffeur finisseur${x(d.presta === 'finisseur')}</td><td>Régleur finisseur${x(d.presta === 'finisseur')}</td><td>Cylindreur${x(d.presta === 'cylindre')}</td><td>Porte-engins${x(d.pe > 0)}</td>
      </tr></table>
      <table>
        <tr><td class="l">${TARIF[d.presta].nom} · ${d.creneau}</td><td class="droite">${d.loin ? 'sur devis' : base + ' €'}</td></tr>
        ${d.pe ? `<tr><td class="l">Conduite porte-engins · ${d.pe} h × ${HEURE_PE} €</td><td class="droite">${d.pe * HEURE_PE} €</td></tr>` : ''}
        <tr><td class="l">Heures supplémentaires</td><td class="droite">à noter sur place : ____ h</td></tr>
        <tr class="tot"><td>Total</td><td>${p === null ? 'Sur devis' : p + ' € net'}</td></tr>
      </table>
      <div class="sign"><div class="valide">Validé par MAC PRESTA<br><span style="color:#17191C;font-weight:500">Mickael Araujo Costa, le ${d.valideLe}</span></div><div>Nom et signature du responsable de chantier</div></div>
      <p class="pied">Journée de 8 heures sur la machine du client. Déplacement inclus jusqu'à 100 km, au-delà sur devis. Annulation moins de 24 h avant : facturation possible. Prix nets, TVA non applicable, art. 293 B du CGI. La facture est établie après l'intervention.</p>`;
    $('#bc-fond').classList.add('vu'); document.body.style.overflow = 'hidden'; $('#bc-ferme').focus();
  }
  const fermeBC = () => { $('#bc-fond').classList.remove('vu'); document.body.style.overflow = ''; };
  $('#bc-ferme').addEventListener('click', fermeBC);
  $('#bc-fond').addEventListener('click', e => { if (e.target.id === 'bc-fond') fermeBC(); });
  $('#bc-imp').addEventListener('click', () => window.print());
  document.addEventListener('keydown', e => { if (e.key === 'Escape') fermeBC(); });

  cal(); maj(); app();
  window.__mp = { reset() { try { localStorage.removeItem('mp-demandes'); localStorage.removeItem('mp-num'); } catch (e) {} location.reload(); } };
})();

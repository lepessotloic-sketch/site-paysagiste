/* MAC PRESTA — Essentiel : menu, questions, demande de date (démo : rien n'est envoyé) */
document.addEventListener('DOMContentLoaded', () => {
  const $ = s => document.querySelector(s);

  // Menu mobile
  const toggle = $('.nav-toggle'), links = $('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => { const o = links.classList.toggle('open'); toggle.setAttribute('aria-expanded', o); });
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { links.classList.remove('open'); toggle.setAttribute('aria-expanded', false); }));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') links.classList.remove('open'); });
  }

  // Questions en accordéon
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-question'), a = item.querySelector('.faq-answer');
    q.setAttribute('role', 'button'); q.setAttribute('tabindex', '0');
    const bascule = () => {
      const ouvert = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(o => { if (o !== item) { o.classList.remove('open'); o.querySelector('.faq-answer').style.maxHeight = null; } });
      item.classList.toggle('open', !ouvert); a.style.maxHeight = ouvert ? null : a.scrollHeight + 'px';
    };
    q.addEventListener('click', bascule);
    q.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); bascule(); } });
  });

  // Demande de date
  const form = $('#demande-form');
  const demain = new Date(); demain.setDate(demain.getDate() + 1);
  const min = demain.getFullYear() + '-' + String(demain.getMonth() + 1).padStart(2, '0') + '-' + String(demain.getDate()).padStart(2, '0');
  $('#r-date').min = min;
  const v = id => $(id).value.trim();
  function maj() {
    const m = [];
    if (!v('#r-date') || v('#r-date') < min) m.push('une date à venir'); if (!v('#r-heure')) m.push("l'heure");
    if (!v('#r-adresse')) m.push("l'adresse du chantier"); if (!v('#r-societe')) m.push('la société'); if (!v('#r-resp')) m.push('le responsable');
    if (!/\d{6,}/.test(v('#r-tel').replace(/\D/g, ''))) m.push('le téléphone'); if (!/^\S+@\S+\.\S+$/.test(v('#r-mail'))) m.push("l'e-mail");
    $('#envoyer').disabled = m.length > 0;
    $('#aide').className = 'form-status' + (m.length ? '' : ' success');
    $('#aide').textContent = m.length ? 'Il manque : ' + m.join(', ') + '.' : 'Tout est prêt.';
  }
  form.addEventListener('input', maj); form.addEventListener('change', maj);
  form.addEventListener('submit', e => { e.preventDefault(); if ($('#envoyer').disabled) return; form.style.display = 'none'; $('#envoye').style.display = 'block'; });
  $('#autre').addEventListener('click', () => { form.reset(); maj(); $('#envoye').style.display = 'none'; form.style.display = 'block'; });
  maj();
});

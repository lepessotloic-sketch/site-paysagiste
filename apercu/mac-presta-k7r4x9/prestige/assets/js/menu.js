/* MAC PRESTA — barre du menu : lien de la partie en cours souligné, page figée quand le menu téléphone est ouvert */
document.addEventListener('DOMContentLoaded', () => {
  const liens = [...document.querySelectorAll('.nav-links li:not(.nav-extra) a')];
  const cibles = liens.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const marque = () => {
    const y = window.scrollY + window.innerHeight * 0.35;
    let courant = null;
    cibles.forEach(s => { if (s.getBoundingClientRect().top + window.scrollY <= y) courant = s; });
    liens.forEach(a => a.classList.toggle('actif', !!courant && a.getAttribute('href') === '#' + courant.id));
  };
  marque();
  window.addEventListener('scroll', marque, { passive: true });

  const bouton = document.getElementById('nav-toggle');
  if (bouton) new MutationObserver(() => {
    document.documentElement.classList.toggle('menu-ouvert', bouton.getAttribute('aria-expanded') === 'true');
  }).observe(bouton, { attributes: true, attributeFilter: ['aria-expanded'] });
});

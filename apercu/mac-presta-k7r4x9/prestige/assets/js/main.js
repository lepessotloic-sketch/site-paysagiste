/* Impact-NVA — V2 Prestige */
document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Bascule jour / nuit ---------- */
  const themeToggle = document.getElementById('theme-toggle');
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'jour' ? 'nuit' : 'jour';
      root.setAttribute('data-theme', next);
      if (themeMeta) themeMeta.setAttribute('content', next === 'jour' ? '#F4F2EA' : '#0A0F0C');
      try { localStorage.setItem('inva-theme', next); } catch (e) { /* stockage indisponible */ }
    });
    if (themeMeta && root.getAttribute('data-theme') === 'jour') {
      themeMeta.setAttribute('content', '#F4F2EA');
    }
  }

  /* ---------- En-tête condensé au défilement ---------- */
  const header = document.querySelector('.site-header');
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 12);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Menu mobile ---------- */
  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');
  if (navToggle && navLinks) {
    const closeMenu = () => {
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Ouvrir le menu');
    };
    navToggle.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    });
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
  }

  /* ---------- Apparitions au défilement ---------- */
  const revealElements = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reducedMotion) {
    const io = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    revealElements.forEach(el => io.observe(el));
  } else {
    revealElements.forEach(el => el.classList.add('visible'));
  }

  /* ---------- Comparateur Avant / Après ---------- */
  const sliders = document.querySelectorAll('.ba-slider');
  sliders.forEach((slider, index) => {
    const range = slider.querySelector('.ba-range');
    if (!range) return;

    let target = 50;
    let current = 50;
    let rafId = null;

    const apply = (v) => { slider.style.setProperty('--cut', v + '%'); };

    const tick = () => {
      current += (target - current) * 0.16;
      if (Math.abs(target - current) < 0.05) {
        current = target;
        apply(current);
        rafId = null;
        return;
      }
      apply(current);
      rafId = requestAnimationFrame(tick);
    };

    const setTarget = (v) => {
      target = Math.min(100, Math.max(0, v));
      if (reducedMotion) { current = target; apply(current); return; }
      if (!rafId) rafId = requestAnimationFrame(tick);
    };

    range.addEventListener('input', () => setTarget(parseFloat(range.value)));

    /* Petite invite au premier passage : le curseur s'anime une fois */
    if (!reducedMotion && 'IntersectionObserver' in window) {
      const hintIO = new IntersectionObserver((entries, observer) => {
        if (!entries[0].isIntersecting) return;
        observer.disconnect();
        const base = 250 + index * 200;
        const steps = [[base, 66], [base + 600, 38], [base + 1200, 50]];
        steps.forEach(([delay, value]) => {
          setTimeout(() => {
            if (Math.abs(parseFloat(range.value) - 50) < 0.5) {
              setTarget(value);
              range.value = value;
            }
          }, delay);
        });
      }, { threshold: 0.5 });
      hintIO.observe(slider);
    }
  });

  /* ---------- Compteurs animés (statistiques) ---------- */
  const counters = document.querySelectorAll('[data-count-to]');
  if (counters.length && !reducedMotion && 'IntersectionObserver' in window) {
    const countIO = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        const el = entry.target;
        const end = parseFloat(el.dataset.countTo);
        const prefix = el.dataset.countPrefix || '';
        const suffix = el.dataset.countSuffix || '';
        const start = performance.now();
        const duration = 1200;
        const step = (now) => {
          const p = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - p, 4);
          el.textContent = prefix + Math.round(end * eased) + suffix;
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    counters.forEach(el => countIO.observe(el));
  }

  /* ---------- Formulaire de contact → n8n ---------- */
  const form = document.getElementById('contact-form');
  if (form) {
    const status = form.querySelector('.form-status');
    const button = form.querySelector('button[type="submit"]');
    const webhookUrl = form.dataset.webhook;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const data = Object.fromEntries(new FormData(form).entries());

      /* Piège anti-robots : champ caché rempli → on simule un succès sans rien envoyer */
      if (data.site_web) {
        window.location.href = 'merci.html';
        return;
      }
      delete data.site_web;

      button.disabled = true;
      status.textContent = 'Envoi en cours…';
      status.className = 'form-status loading';

      try {
        const res = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Réponse webhook non OK');
        window.location.href = 'merci.html';
      } catch (err) {
        status.textContent = "L'envoi a échoué. Réessayez dans un instant, ou écrivez-nous à contact@impact-nva.fr.";
        status.className = 'form-status error';
        button.disabled = false;
      }
    });
  }
});

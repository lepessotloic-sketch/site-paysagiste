// Apply the configuration values to the HTML via data attributes
document.addEventListener('DOMContentLoaded', () => {
  const cfg = window.siteConfig || {};
  const mapping = {
    'brand': 'brand',
    'slogan': 'slogan',
    'google-rating': 'googleRating',
    'google-count': 'googleCount',
    'google-link': 'googleLink',
    'email': 'email',
    'phone': 'phone',
    'zone': 'zone',
    'stripe-link': 'stripeCheckoutUrl'
  };

  Object.keys(mapping).forEach(attr => {
    const key = mapping[attr];
    const nodes = document.querySelectorAll(`[data-${attr}]`);
    nodes.forEach(node => {
      if (!cfg[key]) return;
      // For links we set both href and text if appropriate
      if (attr === 'google-link') {
        node.setAttribute('href', cfg[key]);
        node.textContent = node.textContent || 'Voir les avis Google';
      } else if (attr === 'stripe-link') {
        if (!cfg[key]) return;
        node.setAttribute('href', cfg[key]);
      } else if (attr === 'email') {
        node.setAttribute('href', `mailto:${cfg[key]}`);
        node.textContent = cfg[key];
      } else if (attr === 'phone') {
        node.setAttribute('href', `tel:${cfg[key].replace(/\s+/g, '')}`);
        node.textContent = cfg[key];
      } else {
        node.textContent = cfg[key];
      }
    });
  });
});
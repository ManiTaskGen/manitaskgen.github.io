/* Enhance the homepage's lazy raster images, leaving SVGs, canvas textures and
   full-resolution links intact. No JS or no VP9 decoder: use the original HTML. */
(() => {
  if (!('IntersectionObserver' in window) || !document.createElement('video').canPlayType('video/webm; codecs="vp9"')) return;
  const nearby = new IntersectionObserver(entries => {
    for (const {target, isIntersecting} of entries) {
      if (!isIntersecting) continue;
      nearby.unobserve(target);
      target.src = target.dataset.still;
    }
  }, {rootMargin: '250px'});
  for (const img of document.querySelectorAll('.outcome-comparison img, img[src^="images/paper/"], .message-image img')) {
    const path = img.getAttribute('src');
    if (!path.endsWith('.png')) continue;
    const original = img.closest('picture') || img;
    const still = document.createElement('video');
    still.className = `${img.className} webm-still`.trim();
    still.dataset.still = path.replace(/^images\//, 'assets/stills/').replace(/\.png$/, '.webm');
    still.muted = true; still.playsInline = true; still.preload = 'auto';
    still.setAttribute('role', 'img'); still.setAttribute('aria-label', img.alt);
    for (const attr of ['width', 'height']) if (img.hasAttribute(attr)) still.setAttribute(attr, img.getAttribute(attr));
    still.addEventListener('error', () => still.replaceWith(original), {once: true});
    original.replaceWith(still);
    nearby.observe(still);
  }
})();

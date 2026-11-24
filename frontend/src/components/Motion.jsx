import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './Motion.css';

/*
  Site-wide motion, added on top of the pre-rendered pages:
  • content rises into view as you scroll (grids stagger card by card),
  • a slim scroll-progress bar under the navbar,
  • primary buttons lean towards the cursor; cards tilt slightly in 3D,
  • each page fades in on navigation.
  Everything is skipped for visitors who prefer reduced motion, and nothing is hidden
  until JavaScript runs, so search engines and slow phones always see the content.
*/

// What rises into view. Grids reveal their children one after another.
const SINGLE = [
  'main section h2', 'main section .eyebrow', 'main section .section-head', 'main .hero-subtitle',
  'main .city-season', 'main .city-prices', 'main .city-faq details', 'main .faq-row', 'main .px-section',
  'main .tools-card', 'main .lib-item', 'main .pd-specs', 'main .only-hero', 'main .founder', 'main .city-hindi',
  'main .dash-card', 'main .benefit-item', 'main .faq-item', 'main blockquote', 'main .photo-frame',
].join(',');
const GRIDS = [
  '.pgrid', '.only-grid', '.city-pests', '.city-perks', '.city-links', '.city-areas', '.pest-grid', '.sector-grid',
  '.hub-cards', '.pillar-grid', '.benefits-grid', '.cities-grid', '.shop-tools', '.lib-list', '.pd-equiv > div',
  '.services-grid', '.service-grid', '.stats', '.stat-grid', '.blog-grid', '.role-list', '.ipm-grid', '.chip-links',
].join(',');
const TILT = '.pcard, .only-card, .city-pest, .pest-card, .sector-card, .hub-card, .blog-card, .pd-equiv a, .shop-tools a';
const MAGNETIC = '.btn-primary, .btn-navy, .btn-white';

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

const Motion = () => {
  const { pathname } = useLocation();

  // Scroll progress bar.
  useEffect(() => {
    if (reduced()) return undefined;
    const bar = document.createElement('div');
    bar.className = 'mo-progress';
    document.body.appendChild(bar);
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
    return () => { window.removeEventListener('scroll', onScroll); bar.remove(); };
  }, []);

  // Magnetic buttons and 3D card tilt (desktop pointers only), via delegated listeners.
  useEffect(() => {
    if (reduced() || !finePointer()) return undefined;
    let active = null;
    const reset = (el) => { if (el) { el.style.transform = ''; el.classList.remove('mo-live'); } };
    const onMove = (e) => {
      const el = e.target.closest?.(`${MAGNETIC}, ${TILT}`);
      if (el !== active) { reset(active); active = el; }
      if (!el || el.disabled) return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.classList.add('mo-live');
      if (el.matches(MAGNETIC)) el.style.transform = `translate(${x * 8}px, ${y * 6}px)`;
      else {
        el.style.transform = `perspective(900px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg) translateY(-3px)`;
        el.style.setProperty('--mo-gx', `${(x + 0.5) * 100}%`);
        el.style.setProperty('--mo-gy', `${(y + 0.5) * 100}%`);
      }
    };
    const onLeave = () => { reset(active); active = null; };
    document.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    window.addEventListener('blur', onLeave);
    return () => { document.removeEventListener('pointermove', onMove); document.removeEventListener('pointerleave', onLeave); window.removeEventListener('blur', onLeave); reset(active); };
  }, []);

  // Reveal on scroll, re-scanned on every page and whenever new content loads.
  useEffect(() => {
    if (reduced() || !('IntersectionObserver' in window)) return undefined;
    const main = document.querySelector('main');
    if (!main) return undefined;
    main.classList.remove('mo-page');
    void main.offsetWidth; // restart the page fade
    main.classList.add('mo-page');

    const io = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        const el = en.target;
        el.classList.add('mo-in');
        io.unobserve(el);
        // Once revealed, drop the reveal styles so hover effects respond instantly.
        const delay = parseInt(el.style.getPropertyValue('--mo-delay'), 10) || 0;
        setTimeout(() => { el.classList.remove('mo-hide', 'mo-in'); el.style.removeProperty('--mo-delay'); }, 1000 + delay);
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    const mark = (el, delay = 0) => {
      if (el.dataset.mo) return;
      el.dataset.mo = '1';
      // Already on screen: leave visible, no flash.
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.92 && r.bottom > 0) return;
      el.classList.add('mo-hide');
      if (delay) el.style.setProperty('--mo-delay', `${delay}ms`);
      io.observe(el);
    };
    const scan = () => {
      main.querySelectorAll(SINGLE).forEach((el) => mark(el));
      main.querySelectorAll(GRIDS).forEach((grid) => {
        [...grid.children].forEach((child, i) => mark(child, Math.min(i % 8, 7) * 70));
      });
    };
    scan();
    let t = 0;
    const mo = new MutationObserver(() => { clearTimeout(t); t = setTimeout(scan, 80); });
    mo.observe(main, { childList: true, subtree: true });
    return () => {
      io.disconnect(); mo.disconnect(); clearTimeout(t);
      // Anything this pass hid but never revealed is shown again and can be picked up by the next pass.
      main.querySelectorAll('[data-mo]').forEach((el) => {
        if (el.classList.contains('mo-hide') && !el.classList.contains('mo-in')) el.classList.remove('mo-hide');
        delete el.dataset.mo;
        el.style.removeProperty('--mo-delay');
      });
    };
  }, [pathname]);

  return null;
};

export default Motion;

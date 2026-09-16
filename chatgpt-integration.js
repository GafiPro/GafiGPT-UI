(() => {
  'use strict';

  const WORDS = {
    search: /search|buscar|pesquis|find|procurar/i,
    composer: /pergunte qualquer coisa|ask anything|message|mensagem|send a message/i,
    account: /resgatar oferta|redeem offer|upgrade|plano|plan|plus|pro|team|business|free|conta|account/i,
    chatgpt: /^chatgpt$/i,
  };

  const MARKERS = ['gafiSearchSurface','gafiChatgptSurface','gafiAccountSurface','gafiComposerSurface'];
  const attrFor = key => `data-${key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)}`;

  function textOf(node) {
    return [node.textContent || '', node.getAttribute?.('aria-label') || '', node.getAttribute?.('title') || '', node.getAttribute?.('placeholder') || '', node.getAttribute?.('data-testid') || '']
      .join(' ').replace(/\s+/g, ' ').trim();
  }

  function clearMarkers() {
    const selector = MARKERS.map(key => `[${attrFor(key)}="true"]`).join(',');
    document.querySelectorAll(selector).forEach(node => MARKERS.forEach(key => node.removeAttribute(attrFor(key))));
    document.querySelectorAll('[data-gafi-search],[data-gafi-composer]').forEach(node => {
      node.removeAttribute('data-gafi-search');
      node.removeAttribute('data-gafi-composer');
    });
  }

  function walkAncestors(node, callback, maxDepth = 10) {
    let current = node instanceof Element ? node : node?.parentElement;
    for (let depth = 0; current && depth < maxDepth; depth += 1, current = current.parentElement) {
      if (!(current instanceof HTMLElement)) continue;
      const rect = current.getBoundingClientRect();
      if (rect.width && rect.height) callback(current, rect, getComputedStyle(current), depth);
    }
  }

  function markComposer() {
    document.querySelectorAll('textarea, [contenteditable="true"], input').forEach(node => {
      const meta = textOf(node);
      if (!WORDS.composer.test(meta)) return;
      node.dataset.gafiComposer = 'true';

      let marked = false;
      walkAncestors(node, (el, rect, style, depth) => {
        if (marked) return;
        const fixedLike = style.position === 'fixed' || style.position === 'sticky';
        const bottomZone = rect.bottom >= window.innerHeight - 320;
        const wideEnough = rect.width >= Math.max(350, window.innerWidth * 0.35);
        if (fixedLike && bottomZone && wideEnough) {
          el.dataset.gafiComposerSurface = 'true';
          marked = true;
        }
      });

      if (!marked) {
        walkAncestors(node, (el, rect, style, depth) => {
          if (marked || depth < 1) return;
          if (rect.bottom >= window.innerHeight - 230 && rect.width >= Math.max(350, window.innerWidth * 0.35) && rect.height >= 55) {
            el.dataset.gafiComposerSurface = 'true';
            marked = true;
          }
        });
      }
    });
  }

  function markSearch() {
    document.querySelectorAll('input, textarea, [contenteditable="true"]').forEach(node => {
      const meta = textOf(node);
      if (!WORDS.search.test(meta) || WORDS.composer.test(meta)) return;
      node.dataset.gafiSearch = 'true';
      walkAncestors(node, (el, rect, style, depth) => {
        if (!el.hasAttribute(attrFor('gafiSearchSurface')) && rect.width >= 180 && rect.height >= 36 && depth <= 5) el.dataset.gafiSearchSurface = 'true';
      }, 5);
      const dialog = node.closest('[role="dialog"]');
      if (dialog) dialog.dataset.gafiSearchSurface = 'true';
    });
  }

  function markShell() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!(node instanceof Element)) continue;
      const text = textOf(node);
      if (!text || text.length > 120) continue;

      if (WORDS.chatgpt.test(text)) {
        let marked = false;
        walkAncestors(node, (el, rect, style, depth) => {
          if (marked) return;
          const topLeft = rect.left <= Math.min(40, window.innerWidth * 0.04) && rect.top <= 90;
          const sensible = rect.height >= 40 && rect.width >= 180 && rect.width < window.innerWidth * 0.5;
          if (topLeft && sensible) {
            el.dataset.gafiChatgptSurface = 'true';
            marked = true;
          }
        }, 10);
      }

      if (WORDS.account.test(text)) {
        let marked = false;
        walkAncestors(node, (el, rect, style, depth) => {
          if (marked) return;
          const bottomLeft = rect.left <= Math.min(40, window.innerWidth * 0.04) && rect.bottom >= window.innerHeight - 45;
          const sensible = rect.width >= 180 && rect.width < window.innerWidth * 0.5 && rect.height >= 70;
          if (bottomLeft && sensible) {
            el.dataset.gafiAccountSurface = 'true';
            marked = true;
          }
        }, 10);
      }
    }
  }

  function repair() {
    if (!document.body) return;
    clearMarkers();
    markComposer();
    markSearch();
    markShell();
  }

  let queued = false;
  function queueRepair() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; repair(); });
  }

  const observer = new MutationObserver(queueRepair);

  function start() {
    repair();
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start, { once: true });
})();

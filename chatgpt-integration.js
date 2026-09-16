(() => {
  'use strict';

  const WORDS = {
    search: /search|buscar|pesquis|find|procurar/i,
    account: /resgatar oferta|redeem offer|upgrade|plano|plan|plus|pro|team|business|free|conta|account/i,
    chatgpt: /^chatgpt$/i,
  };

  function surfaceFor(node) {
    let current = node;
    let best = node.parentElement;
    for (let depth = 0; current && depth < 6; depth += 1, current = current.parentElement) {
      if (current instanceof HTMLElement) {
        const rect = current.getBoundingClientRect();
        const tag = current.tagName.toLowerCase();
        if (['header', 'nav', 'aside'].includes(tag)) return current;
        if (rect.width >= 180 && rect.height >= 36) best = current;
      }
    }
    return best;
  }

  function markSearchSurfaces() {
    const candidates = document.querySelectorAll('input, textarea, [contenteditable="true"]');
    candidates.forEach(node => {
      const text = [
        node.getAttribute('placeholder') || '',
        node.getAttribute('aria-label') || '',
        node.getAttribute('data-testid') || '',
        node.getAttribute('name') || ''
      ].join(' ');
      if (!WORDS.search.test(text)) return;

      node.dataset.gafiSearch = 'true';
      const surface = surfaceFor(node);
      if (surface) surface.dataset.gafiSearchSurface = 'true';
      const dialog = node.closest('[role="dialog"]');
      if (dialog) dialog.dataset.gafiSearchSurface = 'true';
    });
  }

  function markSemanticSurfaces() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!(node instanceof Element)) continue;
      const text = (node.children.length <= 2 ? node.textContent : '').trim();
      if (!text || text.length > 90) continue;

      if (WORDS.chatgpt.test(text)) {
        const surface = surfaceFor(node);
        if (surface) surface.dataset.gafiChatgptSurface = 'true';
      } else if (WORDS.account.test(text)) {
        const surface = surfaceFor(node);
        if (surface) surface.dataset.gafiAccountSurface = 'true';
      }
    }
  }

  function repair() {
    if (!document.body) return;
    markSearchSurfaces();
    markSemanticSurfaces();
  }

  let queued = false;
  function queueRepair() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      repair();
    });
  }

  const observer = new MutationObserver(queueRepair);

  function start() {
    repair();
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'aria-label', 'placeholder', 'data-testid']
    });
  }

  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start, { once: true });
})();

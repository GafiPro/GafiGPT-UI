(() => {
  'use strict';

  const WORDS = {
    search: /search|buscar|pesquis|find|procurar/i,
    composer: /pergunte qualquer coisa|ask anything|message|mensagem|send a message/i,
    account: /resgatar oferta|redeem offer|upgrade|plano|plan|plus|pro|team|business|free|conta|account/i,
    chatgpt: /^chatgpt$/i,
  };

  function textOf(node) {
    return [
      node.textContent || '',
      node.getAttribute?.('aria-label') || '',
      node.getAttribute?.('title') || '',
      node.getAttribute?.('placeholder') || '',
      node.getAttribute?.('data-testid') || ''
    ].join(' ').replace(/\s+/g, ' ').trim();
  }

  function attrFor(key) {
    return `data-${key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)}`;
  }

  function clearMarkers() {
    const selector = [
      'gafiSearchSurface','gafiChatgptSurface','gafiAccountSurface','gafiComposerSurface'
    ].map(attrFor).map(attr => `[${attr}="true"]`).join(',');
    document.querySelectorAll(selector).forEach(node => {
      ['gafiSearchSurface','gafiChatgptSurface','gafiAccountSurface','gafiComposerSurface'].forEach(key => node.removeAttribute(attrFor(key)));
    });
    document.querySelectorAll('[data-gafi-search="true"],[data-gafi-composer="true"]').forEach(node => {
      node.removeAttribute('data-gafi-search');
      node.removeAttribute('data-gafi-composer');
    });
  }

  function surfaceChain(node, predicate, maxDepth = 8) {
    let current = node instanceof Element ? node : node?.parentElement;
    let best = null;
    for (let depth = 0; current && depth < maxDepth; depth += 1, current = current.parentElement) {
      if (!(current instanceof HTMLElement)) continue;
      const rect = current.getBoundingClientRect();
      if (!rect.width || !rect.height) continue;
      const style = getComputedStyle(current);
      const area = rect.width * rect.height;
      const fixedLike = style.position === 'fixed' || style.position === 'sticky';
      if (predicate(current, rect, style, fixedLike, area)) best = current;
      if (['header', 'nav', 'aside'].includes(current.tagName.toLowerCase())) return current;
    }
    return best;
  }

  function markComposer() {
    document.querySelectorAll('textarea, [contenteditable="true"], input').forEach(node => {
      const meta = textOf(node);
      if (!WORDS.composer.test(meta)) return;
      node.dataset.gafiComposer = 'true';
      const surface = surfaceChain(node, (el, rect, style, fixedLike) => {
        if (rect.width < 350 || rect.height < 55) return false;
        return fixedLike && rect.bottom > window.innerHeight - 300 ||
          rect.bottom > window.innerHeight - 230 && rect.width > window.innerWidth * 0.35;
      });
      if (surface) surface.dataset.gafiComposerSurface = 'true';
    });
  }

  function markSearch() {
    document.querySelectorAll('input, textarea, [contenteditable="true"]').forEach(node => {
      const meta = textOf(node);
      if (!WORDS.search.test(meta) || WORDS.composer.test(meta)) return;
      node.dataset.gafiSearch = 'true';
      const surface = surfaceChain(node, (el, rect) => rect.width >= 180 && rect.height >= 36);
      if (surface) surface.dataset.gafiSearchSurface = 'true';
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
        const surface = surfaceChain(node, (el, rect) => {
          return rect.left <= Math.min(40, window.innerWidth * 0.04) &&
            rect.top <= 90 && rect.height >= 40 && rect.width >= 180 && rect.width < window.innerWidth * 0.5;
        });
        if (surface) surface.dataset.gafiChatgptSurface = 'true';
      }

      if (WORDS.account.test(text)) {
        const surface = surfaceChain(node, (el, rect) => {
          return rect.left <= Math.min(40, window.innerWidth * 0.04) &&
            rect.bottom >= window.innerHeight - 45 && rect.width >= 180 && rect.height >= 70 && rect.width < window.innerWidth * 0.5;
        });
        if (surface) surface.dataset.gafiAccountSurface = 'true';
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
    requestAnimationFrame(() => {
      queued = false;
      repair();
    });
  }

  const observer = new MutationObserver(queueRepair);

  function start() {
    repair();
    /* Watch DOM insertion/replacement, not our own data attributes, to avoid observer feedback loops. */
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start, { once: true });
})();

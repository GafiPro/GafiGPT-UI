(() => {
  'use strict';

  const ROOT = () => document.documentElement;
  const WORDS = {
    search: /^(search|buscar|pesquisar|find|procurar)(\s|$)/i,
    account: /(resgatar oferta|redeem offer|upgrade|plano|plan|plus|pro|team|business|free|conta|account)/i,
    chatgpt: /^chatgpt$/i,
  };

  function markSearchSurfaces() {
    const candidates = document.querySelectorAll('input, textarea, [contenteditable="true"]');
    candidates.forEach(node => {
      const text = [
        node.getAttribute('placeholder') || '',
        node.getAttribute('aria-label') || '',
        node.getAttribute('data-testid') || '',
        node.getAttribute('name') || ''
      ].join(' ');
      if (!WORDS.search.test(text.trim()) && !/search|buscar|pesquis/i.test(text)) return;

      node.dataset.gafiSearch = 'true';
      const parent = node.closest('[role="dialog"], form, [class*="rounded"], [class*="surface"], aside, nav, header, main') || node.parentElement;
      if (parent) parent.dataset.gafiSearchSurface = 'true';
    });
  }

  function closestSafeSurface(node) {
    return node.closest('[role="dialog"], button, a, nav, header, aside, [data-state], [class*="surface"], [class*="sidebar"], [class*="header"]') || node.parentElement;
  }

  function markSemanticSurfaces() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
    const matches = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!(node instanceof Element)) continue;
      const text = (node.children.length <= 2 ? node.textContent : '').trim();
      if (!text || text.length > 90) continue;
      if (WORDS.chatgpt.test(text)) matches.push(['header', closestSafeSurface(node)]);
      else if (WORDS.account.test(text)) matches.push(['account', closestSafeSurface(node)]);
    }

    matches.forEach(([kind, node]) => {
      if (!node) return;
      if (kind === 'header') node.dataset.gafiChatgptSurface = 'true';
      if (kind === 'account') node.dataset.gafiAccountSurface = 'true';
    });
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
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'aria-label', 'placeholder', 'data-testid'] });
  }

  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start, { once: true });
})();

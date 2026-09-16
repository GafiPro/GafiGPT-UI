(() => {
  'use strict';

  const WORDS = {
    search: /search|buscar|pesquis|find|procurar/i,
    composer: /pergunte qualquer coisa|ask anything|message|mensagem|send a message/i,
    account: /resgatar oferta|redeem offer|upgrade|plano|plan|plus|pro|team|business|free|conta|account/i,
    topChrome: /oferta gratuita|free offer|resgatar oferta|redeem offer|partilhar|share/i,
    chatgpt: /^chatgpt$/i,
  };

  const MARKERS = ['gafiSearchSurface','gafiChatgptSurface','gafiAccountSurface','gafiComposerSurface','gafiTopChromeSurface'];
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

  function ancestors(node, maxDepth = 16) {
    const result = [];
    let current = node instanceof Element ? node : node?.parentElement;
    for (let depth = 0; current && depth < maxDepth; depth += 1, current = current.parentElement) {
      if (!(current instanceof HTMLElement)) continue;
      const rect = current.getBoundingClientRect();
      if (rect.width && rect.height) result.push({ el: current, rect, style: getComputedStyle(current), depth });
    }
    return result;
  }

  function markComposer() {
    document.querySelectorAll('textarea, [contenteditable="true"], input').forEach(node => {
      const meta = textOf(node);
      if (!WORDS.composer.test(meta)) return;
      node.dataset.gafiComposer = 'true';

      ancestors(node).filter(({ rect, style, depth }) => {
        const nearBottom = rect.bottom >= window.innerHeight - 300;
        const broad = rect.width >= Math.max(450, window.innerWidth * 0.42);
        const plausible = rect.height >= 45 && rect.height <= 260;
        const positioned = style.position === 'fixed' || style.position === 'sticky' || depth <= 9;
        return nearBottom && broad && plausible && positioned;
      }).forEach(({ el }) => { el.setAttribute(attrFor('gafiComposerSurface'), 'true'); });
    });
  }

  function markSearch() {
    document.querySelectorAll('input, textarea, [contenteditable="true"]').forEach(node => {
      const meta = textOf(node);
      if (!WORDS.search.test(meta) || WORDS.composer.test(meta)) return;
      node.dataset.gafiSearch = 'true';
      const candidate = ancestors(node, 7).find(({ rect }) => rect.width >= 180 && rect.height >= 36 && rect.height <= 180);
      if (candidate) candidate.el.setAttribute(attrFor('gafiSearchSurface'), 'true');
      const dialog = node.closest('[role="dialog"]');
      if (dialog) dialog.setAttribute(attrFor('gafiSearchSurface'), 'true');
    });
  }

  function markSemanticTextSurface(regex, marker, predicate) {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!(node instanceof Element)) continue;
      const text = textOf(node);
      if (!text || text.length > 120 || !regex.test(text)) continue;
      const match = ancestors(node).find(({ rect, style, depth }) => predicate(rect, style, depth));
      if (match) match.el.setAttribute(attrFor(marker), 'true');
    }
  }

  function markShell() {
    markSemanticTextSurface(WORDS.chatgpt, 'gafiChatgptSurface', (rect) => {
      return rect.left <= Math.min(40, window.innerWidth * 0.04) &&
        rect.top <= 90 && rect.width >= 180 && rect.width < window.innerWidth * 0.5 &&
        rect.height >= 40 && rect.height <= 180;
    });

    markSemanticTextSurface(WORDS.account, 'gafiAccountSurface', (rect) => {
      return rect.left <= Math.min(40, window.innerWidth * 0.04) &&
        rect.bottom >= window.innerHeight - 35 && rect.width >= 240 && rect.width < window.innerWidth * 0.5 &&
        rect.height >= 65 && rect.height <= 220;
    });

    markSemanticTextSurface(WORDS.topChrome, 'gafiTopChromeSurface', (rect, style) => {
      const nearTop = rect.top <= 110 && rect.bottom >= 35;
      const broad = rect.width >= Math.max(360, window.innerWidth * 0.35);
      const shallow = rect.height >= 36 && rect.height <= 190;
      const positioned = style.position === 'fixed' || style.position === 'sticky' || rect.top < 80;
      return nearTop && broad && shallow && positioned;
    });
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

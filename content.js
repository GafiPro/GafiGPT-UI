(() => {
  'use strict';

  const DEFAULTS = {
    theme: 'midnight',
    customColors: false,
    customBackground: '#10131a',
    customContrast: '#f5f7ff',
    customAccent: '#9b7cff',
    rounded: true,
    glass: true,
    atmosphere: true,
    gradients: true,
    glow: true,
    shadows: true,
    animations: true,
    compact: false,
    highContrast: true,
    focusGlow: true,
    noise: false,
    blur: 18,
    radius: 18,
    density: 100,
    fontScale: 100,
    atmosphereIntensity: 70,
  };

  const THEMES = {
    midnight: ['Midnight Violet', 'Noite violeta com aurora', '#0a0b12', '#121522', '#191d2b', '#f7f8ff', '#b9bed0', '#9b7cff', '#cfbeff', 'aurora', 'Aurora violeta', 'dark'],
    forest: ['Emerald Forest', 'Floresta esmeralda com folhas e névoa', '#06130d', '#0c2116', '#143120', '#f1fff7', '#b7d5c4', '#42d483', '#9af2bc', 'forest', 'Folhas de floresta', 'dark'],
    winter: ['Winter Noel', 'Azul gelado, neve e ambiente natalício', '#0b1622', '#142638', '#1b344a', '#f5fbff', '#c0d5e6', '#a8ddff', '#e9f8ff', 'snow', 'Flocos de neve', 'dark'],
    ocean: ['Deep Ocean', 'Profundezas azuis com bolhas', '#04101b', '#0a1c2b', '#102b40', '#f2f9ff', '#b9d0e1', '#42b8ff', '#8ae2ff', 'bubbles', 'Bolhas subaquáticas', 'dark'],
    cyber: ['Cyber RGB', 'Painéis LED e iluminação RGB', '#080b0d', '#101519', '#172026', '#f5fffd', '#b5c8c7', '#55ffd8', '#ff4dd8', 'rgb-led', 'LED RGB', 'dark'],
    sunset: ['Violet Sunset', 'Pôr do sol neon cor-de-rosa', '#180b17', '#281226', '#371833', '#fff5fb', '#dfbfd3', '#ff85bb', '#ffbf79', 'sunset', 'Horizonte neon', 'dark'],
    sakura: ['Sakura Night', 'Noite japonesa com pétalas', '#160c13', '#24131f', '#331b2b', '#fff7fc', '#dec4d4', '#ff91ca', '#dba4ff', 'petals', 'Pétalas de sakura', 'dark'],
    desert: ['Desert Amber', 'Areia quente com poeira dourada', '#171009', '#28190d', '#382411', '#fff8ed', '#decab0', '#ffb550', '#ffe08e', 'dust', 'Poeira dourada', 'dark'],
    paper: ['Paper & Ink', 'Papel editorial com textura subtil', '#f1eee5', '#fffdf8', '#ebe5d9', '#1f231f', '#5f675f', '#7256d7', '#4c8b69', 'paper', 'Textura de papel', 'light'],
    space: ['Deep Space', 'Espaço profundo com estrelas', '#050712', '#0d1020', '#141933', '#f4f6ff', '#b7bedb', '#8f9cff', '#d1a8ff', 'stars', 'Campo de estrelas', 'dark'],
  };

  const makeTheme = a => ({ name:a[0], vibe:a[1], bg:a[2], surface:a[3], surface2:a[4], text:a[5], muted:a[6], accent:a[7], accent2:a[8], special:a[9], specialLabel:a[10], scheme:a[11] });
  Object.keys(THEMES).forEach(k => { THEMES[k] = makeTheme(THEMES[k]); });

  let state = { ...DEFAULTS };
  let panelOpen = false;
  let applying = false;
  let observerStarted = false;

  const el = (tag, props = {}, children = []) => {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (key === 'class') node.className = value;
      else if (key === 'text') node.textContent = value;
      else if (key === 'checked') node.checked = Boolean(value);
      else if (key === 'value') node.value = value;
      else if (key === 'title') node.title = value;
      else if (key === 'ariaLabel') node.setAttribute('aria-label', value);
      else if (key === 'dataset') Object.assign(node.dataset, value);
      else node.setAttribute(key, value);
    }
    children.forEach(child => node.append(child));
    return node;
  };

  const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value)));
  const validHex = value => /^#[0-9a-f]{6}$/i.test(String(value));

  function hexToRgb(hex) {
    const clean = String(hex || '').replace('#', '');
    const normalized = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean;
    if (!/^[0-9a-f]{6}$/i.test(normalized)) return [0, 0, 0];
    const n = Number.parseInt(normalized, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
  }

  function mix(first, second, amount) {
    const a = hexToRgb(first), b = hexToRgb(second);
    return rgbToHex(a[0] * (1 - amount) + b[0] * amount, a[1] * (1 - amount) + b[1] * amount, a[2] * (1 - amount) + b[2] * amount);
  }

  function getTheme() { return THEMES[state.theme] || THEMES.midnight; }

  function persist() {
    try { chrome.storage.local.set({ gafiGPTUI: state }); } catch (_) {}
  }

  const storage = {
    get() {
      return new Promise(resolve => {
        try {
          chrome.storage.local.get({ gafiGPTUI: DEFAULTS }, result => resolve({ ...DEFAULTS, ...(result?.gafiGPTUI || {}) }));
        } catch (_) { resolve({ ...DEFAULTS }); }
      });
    },
    set(patch) {
      state = { ...state, ...patch };
      persist();
      applyState();
    }
  };

  function setVars() {
    const theme = getTheme();
    const bg = state.customColors && validHex(state.customBackground) ? state.customBackground : theme.bg;
    const contrast = state.customColors && validHex(state.customContrast) ? state.customContrast : theme.text;
    const accent = state.customColors && validHex(state.customAccent) ? state.customAccent : theme.accent;
    const surface = state.customColors ? mix(bg, contrast, 0.07) : theme.surface;
    const surface2 = state.customColors ? mix(bg, contrast, 0.14) : theme.surface2;
    const rgb = hexToRgb(bg);
    const luminance = rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
    const root = document.documentElement;

    const variables = {
      '--gafi-bg': bg,
      '--gafi-surface': surface,
      '--gafi-surface-2': surface2,
      '--gafi-text': contrast,
      '--gafi-muted': state.customColors ? mix(contrast, bg, 0.43) : theme.muted,
      '--gafi-accent': accent,
      '--gafi-accent-2': state.customColors ? mix(accent, contrast, 0.3) : theme.accent2,
      '--gafi-radius': state.rounded ? `${clamp(state.radius, 6, 36)}px` : '0px',
      '--gafi-blur': state.glass ? `${clamp(state.blur, 0, 36)}px` : '0px',
      '--gafi-density': `${clamp(state.density, 75, 125) / 100}`,
      '--gafi-font-scale': `${clamp(state.fontScale, 90, 115) / 100}`,
      '--gafi-atmo-opacity': `${state.atmosphere ? clamp(state.atmosphereIntensity, 0, 100) / 100 : 0}`,
      '--gafi-shadow': state.shadows ? '0 18px 55px rgba(0,0,0,.24)' : 'none',
      '--gafi-glow': state.glow ? '0 0 28px color-mix(in srgb, var(--gafi-accent) 22%, transparent)' : 'none',
      '--gafi-gradient': state.gradients ? 'linear-gradient(135deg, color-mix(in srgb, var(--gafi-accent) 12%, transparent), transparent 58%)' : 'none'
    };
    Object.entries(variables).forEach(([key, value]) => root.style.setProperty(key, value));

    root.dataset.gafiUi = 'on';
    root.dataset.gafiTheme = state.theme;
    root.dataset.gafiScheme = state.customColors ? (luminance > 145 ? 'light' : 'dark') : theme.scheme;
    root.dataset.gafiAtmosphere = String(Boolean(state.atmosphere));
    root.dataset.gafiGlass = String(Boolean(state.glass));
    root.dataset.gafiRounded = String(Boolean(state.rounded));
    root.dataset.gafiGradients = String(Boolean(state.gradients));
    root.dataset.gafiGlow = String(Boolean(state.glow));
    root.dataset.gafiShadows = String(Boolean(state.shadows));
    root.dataset.gafiAnimations = String(Boolean(state.animations));
    root.dataset.gafiCompact = String(Boolean(state.compact));
    root.dataset.gafiHighContrast = String(Boolean(state.highContrast));
    root.dataset.gafiFocusGlow = String(Boolean(state.focusGlow));
    root.dataset.gafiNoise = String(Boolean(state.noise));
    root.dataset.gafiSpecial = state.atmosphere ? theme.special : 'none';
  }

  function applyState() {
    if (applying || !document.documentElement) return;
    applying = true;
    setVars();
    ensureAtmosphereLayer();
    requestAnimationFrame(() => { refreshControls(); applying = false; });
  }

  function addSection(root, title, children) {
    const section = el('section', { class: 'gafi-section' });
    section.append(el('div', { class: 'gafi-section-title', text: title }), ...children);
    root.append(section);
  }

  function toggleRow(label, key, hint) {
    const input = el('input', { type: 'checkbox' });
    input.checked = Boolean(state[key]);
    input.addEventListener('change', () => storage.set({ [key]: input.checked }));
    return el('label', { class: 'gafi-toggle-row', dataset: { key } }, [el('span', { class: 'gafi-toggle-copy' }, [el('strong', { text: label }), el('small', { text: hint || '' })]), el('span', { class: 'gafi-switch' }, [input, el('i')])]);
  }

  function rangeRow(label, key, min, max, step = 1, suffix = '%') {
    const wrap = el('div', { class: 'gafi-range-row', dataset: { key } });
    const value = el('span', { class: 'gafi-value' });
    const input = el('input', { type: 'range', min, max, step, value: state[key] });
    const render = () => { value.textContent = `${Math.round(state[key])}${suffix}`; input.value = state[key]; };
    input.addEventListener('input', () => { state[key] = clamp(input.value, min, max); render(); setVars(); ensureAtmosphereLayer(); });
    input.addEventListener('change', persist);
    wrap.append(el('div', { class: 'gafi-range-head' }, [el('span', { text: label }), value]), input);
    render();
    return wrap;
  }

  function colorRow(label, key) {
    const wrap = el('div', { class: 'gafi-color-row', dataset: { key } });
    const picker = el('input', { type: 'color', value: state[key], ariaLabel: label });
    const hex = el('input', { class: 'gafi-hex', type: 'text', value: state[key], maxlength: 7, ariaLabel: `${label} HEX` });
    const update = raw => {
      const value = String(raw).trim();
      if (!validHex(value)) return false;
      state[key] = value.toUpperCase();
      persist();
      applyState();
      return true;
    };
    picker.addEventListener('input', () => { hex.value = picker.value.toUpperCase(); update(picker.value); });
    hex.addEventListener('change', () => { if (!update(hex.value)) hex.value = state[key]; picker.value = state[key]; });
    wrap.append(el('span', { text: label }), el('span', { class: 'gafi-color-control' }, [picker, hex]));
    return wrap;
  }

  function rgbPanel(title, key) {
    const panel = el('div', { class: 'gafi-rgb-panel', dataset: { colorKey: key } });
    panel.append(el('div', { class: 'gafi-subtitle', text: title }));
    ['R', 'G', 'B'].forEach((channel, index) => {
      const value = el('span', { class: 'gafi-rgb-value' });
      const input = el('input', { type: 'range', min: 0, max: 255, step: 1 });
      input.dataset.channel = String(index);
      input.addEventListener('input', () => {
        const rgb = hexToRgb(state[key]);
        rgb[index] = Number(input.value);
        state[key] = rgbToHex(...rgb);
        persist();
        applyState();
      });
      panel.append(el('div', { class: 'gafi-rgb-line' }, [el('span', { text: channel }), input, value]));
    });
    return panel;
  }

  function themeGrid() {
    const grid = el('div', { class: 'gafi-theme-grid' });
    Object.entries(THEMES).forEach(([id, theme]) => {
      const card = el('button', { class: 'gafi-theme-card', type: 'button', title: `${theme.name}: ${theme.vibe}`, dataset: { theme: id } });
      card.append(el('span', { class: 'gafi-swatch', style: `--swatch-bg:${theme.bg};--swatch-accent:${theme.accent}` }), el('span', { class: 'gafi-theme-copy' }, [el('strong', { text: theme.name }), el('small', { text: theme.specialLabel })]));
      card.addEventListener('click', () => storage.set({ theme: id, customColors: false, customBackground: theme.bg, customContrast: theme.text, customAccent: theme.accent }));
      grid.append(card);
    });
    return grid;
  }

  function buildPanel() {
    if (document.getElementById('gafi-ui-panel')) return;
    const panel = el('aside', { id: 'gafi-ui-panel', class: 'gafi-panel', ariaLabel: 'GafiGPT UI' });
    const close = el('button', { class: 'gafi-close', type: 'button', text: '×', title: 'Fechar painel', ariaLabel: 'Fechar painel' });
    close.addEventListener('click', () => togglePanel(false));
    const header = el('div', { class: 'gafi-panel-header' }, [el('div', { class: 'gafi-brand' }, [el('span', { class: 'gafi-logo', text: 'G' }), el('div', {}, [el('strong', { text: 'GafiGPT UI' }), el('small', { text: 'Personaliza o teu ChatGPT' })])]), close]);
    const scroll = el('div', { class: 'gafi-panel-scroll' });
    addSection(scroll, '10 temas', [themeGrid()]);
    addSection(scroll, 'Atmosfera', [toggleRow('Efeito especial do tema', 'atmosphere', 'Cada tema tem uma atmosfera única.'), rangeRow('Intensidade da atmosfera', 'atmosphereIntensity', 0, 100), el('div', { class: 'gafi-theme-hint' })]);
    addSection(scroll, 'Cores', [toggleRow('Cores personalizadas', 'customColors', 'Fundo, contraste e accent manuais.'), colorRow('Fundo', 'customBackground'), colorRow('Contraste', 'customContrast'), colorRow('Accent / destaque', 'customAccent'), rgbPanel('RGB do fundo', 'customBackground'), rgbPanel('RGB do contraste', 'customContrast'), rgbPanel('RGB do accent', 'customAccent')]);
    addSection(scroll, 'Efeitos', [toggleRow('Glass', 'glass', 'Transparência e blur.'), toggleRow('Cantos arredondados', 'rounded', 'Raio aplicado de forma consistente.'), toggleRow('Gradientes', 'gradients', 'Luz e cor suave no ambiente.'), toggleRow('Glow', 'glow', 'Brilho nos elementos de destaque.'), toggleRow('Sombras', 'shadows', 'Profundidade dos painéis.'), toggleRow('Animações', 'animations', 'Movimento e transições.'), toggleRow('Glow ao focar', 'focusGlow', 'Realce ao escrever e interagir.'), toggleRow('Ruído cinematográfico', 'noise', 'Textura subtil de filme.')]);
    addSection(scroll, 'Interface', [toggleRow('Modo compacto', 'compact', 'Reduz espaçamento da interface.'), toggleRow('Contraste reforçado', 'highContrast', 'Melhora fronteiras e legibilidade.'), rangeRow('Raio dos cantos', 'radius', 6, 36, 1, 'px'), rangeRow('Blur', 'blur', 0, 36, 1, 'px'), rangeRow('Densidade', 'density', 75, 125), rangeRow('Escala do texto', 'fontScale', 90, 115)]);
    const reset = el('button', { class: 'gafi-secondary-btn', type: 'button', text: 'Repor predefinições' });
    reset.addEventListener('click', () => storage.set({ ...DEFAULTS }));
    scroll.append(el('div', { class: 'gafi-actions' }, [reset]));
    panel.append(header, scroll, el('div', { class: 'gafi-panel-footer', text: 'Tudo é opcional. Mistura temas, cores e efeitos livremente.' }));
    document.body.append(panel);
  }

  function refreshControls() {
    const panel = document.getElementById('gafi-ui-panel');
    if (!panel) return;
    panel.querySelectorAll('.gafi-theme-card').forEach(card => card.classList.toggle('is-active', card.dataset.theme === state.theme && !state.customColors));
    const hint = panel.querySelector('.gafi-theme-hint');
    if (hint) hint.textContent = `${getTheme().specialLabel} — ${getTheme().vibe}`;
    panel.querySelectorAll('.gafi-toggle-row[data-key]').forEach(row => { const input = row.querySelector('input[type="checkbox"]'); if (input) input.checked = Boolean(state[row.dataset.key]); });
    panel.querySelectorAll('.gafi-color-row[data-key]').forEach(row => { const key = row.dataset.key; const picker = row.querySelector('input[type="color"]'); const hex = row.querySelector('.gafi-hex'); if (picker) picker.value = state[key]; if (hex) hex.value = state[key]; });
    panel.querySelectorAll('.gafi-rgb-panel[data-color-key]').forEach(node => { const rgb = hexToRgb(state[node.dataset.colorKey]); node.querySelectorAll('input[type="range"]').forEach(input => { const i = Number(input.dataset.channel); input.value = rgb[i]; input.nextElementSibling.textContent = String(rgb[i]); }); });
    panel.querySelectorAll('.gafi-range-row[data-key]').forEach(row => { const key = row.dataset.key; const input = row.querySelector('input[type="range"]'); const value = row.querySelector('.gafi-value'); if (!input || !value) return; input.value = state[key]; value.textContent = `${Math.round(state[key])}${key === 'radius' || key === 'blur' ? 'px' : '%'}`; });
  }

  function ensureAtmosphereLayer() {
    if (!document.body) return;
    const expected = state.atmosphere ? getTheme().special : 'none';
    const current = document.getElementById('gafi-atmosphere-layer');
    if (current?.dataset.special === expected) return;
    current?.remove();
    const layer = el('div', { id: 'gafi-atmosphere-layer', class: 'gafi-atmosphere-layer', dataset: { special: expected }, ariaLabel: '' });
    if (expected !== 'none') {
      const count = { aurora: 14, forest: 22, snow: 34, bubbles: 20, 'rgb-led': 15, sunset: 8, petals: 18, dust: 24, paper: 1, stars: 44 }[expected] || 12;
      const fragment = document.createDocumentFragment();
      for (let i = 0; i < count; i++) {
        const item = el('span', { class: `gafi-atmo-item gafi-atmo-${expected}` });
        item.style.setProperty('--i', i);
        item.style.setProperty('--delay', `${-(i % 11) * 1.7}s`);
        item.style.setProperty('--size', `${8 + (i % 6) * 3}px`);
        item.style.setProperty('--drift', `${-40 + ((i * 29) % 81)}px`);
        item.style.setProperty('--x', `${(i * 17.3) % 103}%`);
        item.style.setProperty('--y', `${(i * 23.7) % 108}%`);
        fragment.append(item);
      }
      layer.append(fragment);
    }
    document.body.prepend(layer);
  }

  function togglePanel(open = !panelOpen) {
    panelOpen = open;
    buildPanel();
    document.documentElement.classList.toggle('gafi-panel-open', open);
    document.getElementById('gafi-ui-toggle')?.classList.toggle('is-open', open);
  }

  function buildToggleButton() {
    if (document.getElementById('gafi-ui-toggle')) return;
    const button = el('button', { id: 'gafi-ui-toggle', type: 'button', text: '✦', title: 'Abrir GafiGPT UI', ariaLabel: 'Abrir GafiGPT UI' });
    button.addEventListener('click', () => togglePanel());
    document.body.append(button);
  }

  function watchDom() {
    if (observerStarted || !document.body) return;
    observerStarted = true;
    const observer = new MutationObserver(() => {
      if (!document.getElementById('gafi-ui-toggle')) buildToggleButton();
      if (!document.getElementById('gafi-ui-panel') && panelOpen) buildPanel();
      if (!document.getElementById('gafi-atmosphere-layer')) ensureAtmosphereLayer();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function watchStorage() {
    try {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== 'local' || !changes.gafiGPTUI?.newValue) return;
        state = { ...DEFAULTS, ...changes.gafiGPTUI.newValue };
        applyState();
      });
    } catch (_) {}
  }

  async function init() {
    state = await storage.get();
    setVars();
    ensureAtmosphereLayer();
    buildToggleButton();
    buildPanel();
    refreshControls();
    watchDom();
    watchStorage();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();

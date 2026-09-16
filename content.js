(() => {
  'use strict';

  const DEFAULTS = {
    theme: 'midnight',
    customBackground: '#10131a',
    customContrast: '#f5f7ff',
    customAccent: '#9b7cff',
    customColors: false,
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
    dockPanel: true,
    blur: 18,
    radius: 18,
    density: 100,
    fontScale: 100,
    atmosphereIntensity: 70,
  };

  const THEMES = {
    midnight: {
      name: 'Midnight Violet', vibe: 'Noite violeta com aurora suave',
      bg: '#0a0b12', surface: '#121522', surface2: '#191d2b', text: '#f7f8ff', muted: '#b9bed0', accent: '#9b7cff', accent2: '#cfbeff', special: 'aurora', specialLabel: 'Aurora violeta'
    },
    forest: {
      name: 'Emerald Forest', vibe: 'Floresta esmeralda com folhas e névoa',
      bg: '#06130d', surface: '#0c2116', surface2: '#143120', text: '#f1fff7', muted: '#b7d5c4', accent: '#42d483', accent2: '#9af2bc', special: 'forest', specialLabel: 'Folhas de floresta'
    },
    winter: {
      name: 'Winter Noel', vibe: 'Azul esbranquiçado, gelo e neve',
      bg: '#0b1622', surface: '#142638', surface2: '#1b344a', text: '#f5fbff', muted: '#c0d5e6', accent: '#a8ddff', accent2: '#e9f8ff', special: 'snow', specialLabel: 'Flocos de neve'
    },
    ocean: {
      name: 'Deep Ocean', vibe: 'Profundezas azuis com bolhas',
      bg: '#04101b', surface: '#0a1c2b', surface2: '#102b40', text: '#f2f9ff', muted: '#b9d0e1', accent: '#42b8ff', accent2: '#8ae2ff', special: 'bubbles', specialLabel: 'Bolhas subaquáticas'
    },
    cyber: {
      name: 'Cyber RGB', vibe: 'Painéis LED e brilho RGB',
      bg: '#080b0d', surface: '#101519', surface2: '#172026', text: '#f5fffd', muted: '#b5c8c7', accent: '#55ffd8', accent2: '#ff4dd8', special: 'rgb-led', specialLabel: 'LED RGB'
    },
    sunset: {
      name: 'Violet Sunset', vibe: 'Pôr do sol neon cor-de-rosa',
      bg: '#180b17', surface: '#281226', surface2: '#371833', text: '#fff5fb', muted: '#dfbfd3', accent: '#ff85bb', accent2: '#ffbf79', special: 'sunset', specialLabel: 'Brilho de pôr do sol'
    },
    sakura: {
      name: 'Sakura Night', vibe: 'Noite japonesa com pétalas',
      bg: '#160c13', surface: '#24131f', surface2: '#331b2b', text: '#fff7fc', muted: '#dec4d4', accent: '#ff91ca', accent2: '#dba4ff', special: 'petals', specialLabel: 'Pétalas de sakura'
    },
    desert: {
      name: 'Desert Amber', vibe: 'Areia quente e partículas de pó',
      bg: '#171009', surface: '#28190d', surface2: '#382411', text: '#fff8ed', muted: '#decab0', accent: '#ffb550', accent2: '#ffe08e', special: 'dust', specialLabel: 'Poeira dourada'
    },
    paper: {
      name: 'Paper & Ink', vibe: 'Papel editorial com textura suave',
      bg: '#f1eee5', surface: '#fffdf8', surface2: '#ebe5d9', text: '#1f231f', muted: '#5f675f', accent: '#7256d7', accent2: '#4c8b69', special: 'paper', specialLabel: 'Textura de papel'
    },
    space: {
      name: 'Deep Space', vibe: 'Espaço profundo com estrelas',
      bg: '#050712', surface: '#0d1020', surface2: '#141933', text: '#f4f6ff', muted: '#b7bedb', accent: '#8f9cff', accent2: '#d1a8ff', special: 'stars', specialLabel: 'Campo de estrelas'
    }
  };

  let state = { ...DEFAULTS };
  let panelOpen = false;
  let applying = false;

  const el = (tag, props = {}, children = []) => {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (key === 'class') node.className = value;
      else if (key === 'text') node.textContent = value;
      else if (key === 'checked') node.checked = value;
      else if (key === 'value') node.value = value;
      else if (key === 'title') node.title = value;
      else node.setAttribute(key, value);
    }
    children.forEach(child => node.append(child));
    return node;
  };

  const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value)));

  function hexToRgb(hex) {
    const clean = String(hex).replace('#', '');
    const normalized = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean;
    const number = Number.parseInt(normalized, 16);
    if (Number.isNaN(number)) return [0, 0, 0];
    return [(number >> 16) & 255, (number >> 8) & 255, number & 255];
  }

  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(value => clamp(value, 0, 255).toString(16).padStart(2, '0')).join('');
  }

  function mix(first, second, amount) {
    const a = hexToRgb(first);
    const b = hexToRgb(second);
    return rgbToHex(
      Math.round(a[0] * (1 - amount) + b[0] * amount),
      Math.round(a[1] * (1 - amount) + b[1] * amount),
      Math.round(a[2] * (1 - amount) + b[2] * amount)
    );
  }

  function getTheme() {
    return THEMES[state.theme] || THEMES.midnight;
  }

  const storage = {
    get() {
      return new Promise(resolve => {
        chrome.storage.local.get({ gafiGPTUI: DEFAULTS }, data => resolve({ ...DEFAULTS, ...(data.gafiGPTUI || {}) }));
      });
    },
    set(patch) {
      state = { ...state, ...patch };
      chrome.storage.local.set({ gafiGPTUI: state });
      applyState();
    }
  };

  function setVars() {
    const theme = getTheme();
    const background = state.customColors ? state.customBackground : theme.bg;
    const contrast = state.customColors ? state.customContrast : theme.text;
    const accent = state.customColors ? state.customAccent : theme.accent;
    const surface = state.customColors ? mix(background, contrast, 0.07) : theme.surface;
    const surface2 = state.customColors ? mix(background, contrast, 0.14) : theme.surface2;

    const variables = {
      '--gafi-bg': background,
      '--gafi-surface': surface,
      '--gafi-surface-2': surface2,
      '--gafi-text': contrast,
      '--gafi-muted': state.customColors ? mix(contrast, background, 0.43) : theme.muted,
      '--gafi-accent': accent,
      '--gafi-accent-2': state.customColors ? mix(accent, contrast, 0.3) : theme.accent2,
      '--gafi-radius': state.rounded ? `${state.radius}px` : '3px',
      '--gafi-blur': state.glass ? `${state.blur}px` : '0px',
      '--gafi-density': `${state.density / 100}`,
      '--gafi-font-scale': `${state.fontScale / 100}`,
      '--gafi-atmo-opacity': `${state.atmosphereIntensity / 100}`,
      '--gafi-shadow': state.shadows ? '0 18px 55px rgba(0,0,0,.24)' : 'none',
      '--gafi-glow': state.glow ? '0 0 28px color-mix(in srgb, var(--gafi-accent) 22%, transparent)' : 'none',
      '--gafi-gradient': state.gradients ? 'linear-gradient(135deg, color-mix(in srgb, var(--gafi-accent) 12%, transparent), transparent 58%)' : 'none'
    };
    Object.entries(variables).forEach(([key, value]) => document.documentElement.style.setProperty(key, value));
    const root = document.documentElement;
    root.dataset.gafiUi = 'on';
    root.dataset.gafiTheme = state.theme;
    root.dataset.gafiAtmosphere = String(state.atmosphere);
    root.dataset.gafiGlass = String(state.glass);
    root.dataset.gafiRounded = String(state.rounded);
    root.dataset.gafiGradients = String(state.gradients);
    root.dataset.gafiGlow = String(state.glow);
    root.dataset.gafiShadows = String(state.shadows);
    root.dataset.gafiAnimations = String(state.animations);
    root.dataset.gafiCompact = String(state.compact);
    root.dataset.gafiHighContrast = String(state.highContrast);
    root.dataset.gafiFocusGlow = String(state.focusGlow);
    root.dataset.gafiNoise = String(state.noise);
    root.dataset.gafiDockPanel = String(state.dockPanel);
    root.dataset.gafiSpecial = state.atmosphere ? theme.special : 'none';
  }

  function applyState() {
    if (applying) return;
    applying = true;
    setVars();
    ensureAtmosphereLayer();
    requestAnimationFrame(() => {
      refreshControls();
      applying = false;
    });
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
    return el('label', { class: 'gafi-toggle-row', title: hint || label }, [
      el('span', { class: 'gafi-toggle-copy' }, [el('strong', { text: label }), hint ? el('small', { text: hint }) : document.createTextNode('')]),
      el('span', { class: 'gafi-switch' }, [input, el('i')])
    ]);
  }

  function rangeRow(label, key, min, max, step = 1, suffix = '%') {
    const wrap = el('div', { class: 'gafi-range-row' });
    const number = el('span', { class: 'gafi-value' });
    const input = el('input', { type: 'range', min, max, step, value: state[key] });
    const render = () => number.textContent = `${Math.round(state[key])}${suffix}`;
    input.addEventListener('input', () => { state[key] = clamp(input.value, min, max); render(); applyState(); });
    input.addEventListener('change', () => chrome.storage.local.set({ gafiGPTUI: state }));
    wrap.append(el('div', { class: 'gafi-range-head' }, [el('span', { text: label }), number]), input);
    render();
    return wrap;
  }

  function colorRow(label, key) {
    const wrap = el('div', { class: 'gafi-color-row' });
    const picker = el('input', { type: 'color', value: state[key] });
    const hex = el('input', { class: 'gafi-hex', type: 'text', value: state[key], maxlength: 7 });
    const update = value => {
      if (!/^#[0-9a-f]{6}$/i.test(value)) return;
      state[key] = value.toUpperCase();
      chrome.storage.local.set({ gafiGPTUI: state });
      applyState();
    };
    picker.addEventListener('input', () => { hex.value = picker.value; update(picker.value); });
    hex.addEventListener('change', () => { update(hex.value); picker.value = state[key]; });
    wrap.append(el('span', { text: label }), el('span', { class: 'gafi-color-control' }, [picker, hex]));
    return wrap;
  }

  function rgbPanel(title, key) {
    const panel = el('div', { class: 'gafi-rgb-panel' });
    panel.append(el('div', { class: 'gafi-subtitle', text: title }));
    ['R', 'G', 'B'].forEach((channel, index) => {
      const value = el('span', { class: 'gafi-rgb-value' });
      const input = el('input', { type: 'range', min: 0, max: 255, value: hexToRgb(state[key])[index] });
      const render = () => value.textContent = String(hexToRgb(state[key])[index]);
      input.addEventListener('input', () => {
        const rgb = hexToRgb(state[key]);
        rgb[index] = Number(input.value);
        state[key] = rgbToHex(...rgb);
        chrome.storage.local.set({ gafiGPTUI: state });
        applyState();
        render();
      });
      panel.append(el('div', { class: 'gafi-rgb-line' }, [el('span', { text: channel }), input, value]));
      render();
    });
    return panel;
  }

  function themeGrid() {
    const grid = el('div', { class: 'gafi-theme-grid' });
    for (const [id, theme] of Object.entries(THEMES)) {
      const card = el('button', { class: 'gafi-theme-card', type: 'button', title: `${theme.name}: ${theme.vibe}` });
      card.dataset.theme = id;
      card.append(
        el('span', { class: 'gafi-swatch', style: `--swatch-bg:${theme.bg};--swatch-accent:${theme.accent}` }),
        el('span', { class: 'gafi-theme-copy' }, [el('strong', { text: theme.name }), el('small', { text: theme.specialLabel })])
      );
      card.addEventListener('click', () => storage.set({ theme: id, customColors: false, customBackground: theme.bg, customContrast: theme.text, customAccent: theme.accent }));
      grid.append(card);
    }
    return grid;
  }

  function buildPanel() {
    if (document.getElementById('gafi-ui-panel')) return;
    const panel = el('aside', { id: 'gafi-ui-panel', class: 'gafi-panel' });
    const close = el('button', { class: 'gafi-close', type: 'button', text: '×', title: 'Fechar' });
    close.addEventListener('click', () => togglePanel(false));
    const header = el('div', { class: 'gafi-panel-header' }, [
      el('div', { class: 'gafi-brand' }, [el('span', { class: 'gafi-logo', text: 'G' }), el('div', {}, [el('strong', { text: 'GafiGPT UI' }), el('small', { text: 'Personaliza o teu ChatGPT' })])]),
      close
    ]);
    const scroll = el('div', { class: 'gafi-panel-scroll' });
    addSection(scroll, '10 temas', [themeGrid()]);
    addSection(scroll, 'Atmosfera', [toggleRow('Efeito especial do tema', 'atmosphere', 'Cada tema tem uma atmosfera diferente.'), rangeRow('Intensidade da atmosfera', 'atmosphereIntensity', 0, 100), el('div', { class: 'gafi-theme-hint', text: `${getTheme().specialLabel} — ${getTheme().vibe}` })]);
    addSection(scroll, 'Cores', [toggleRow('Cores personalizadas', 'customColors', 'Controla fundo, contraste e accent manualmente.'), colorRow('Fundo', 'customBackground'), colorRow('Contraste', 'customContrast'), colorRow('Accent / destaque', 'customAccent'), rgbPanel('RGB do fundo', 'customBackground'), rgbPanel('RGB do contraste', 'customContrast'), rgbPanel('RGB do accent', 'customAccent')]);
    addSection(scroll, 'Efeitos', [toggleRow('Glass', 'glass', 'Transparência + blur.'), toggleRow('Cantos arredondados', 'rounded', 'Mantém os componentes redondos.'), toggleRow('Gradientes', 'gradients', 'Luz e cor suave nas superfícies.'), toggleRow('Glow', 'glow', 'Brilho do accent.'), toggleRow('Sombras', 'shadows', 'Profundidade nos painéis.'), toggleRow('Animações', 'animations', 'Micro-animações e movimento.'), toggleRow('Glow ao focar', 'focusGlow', 'Realce quando escreves ou interages.'), toggleRow('Ruído cinematográfico', 'noise', 'Textura quase impercetível no fundo.')]);
    addSection(scroll, 'Interface', [toggleRow('Painel ancorado à direita', 'dockPanel', 'Mantém o painel na zona direita em vez de flutuar por cima.'), toggleRow('Modo compacto', 'compact', 'Menos espaço entre elementos.'), toggleRow('Contraste reforçado', 'highContrast', 'Aumenta a separação visual entre texto e superfícies.'), rangeRow('Raio dos cantos', 'radius', 6, 36, 1, 'px'), rangeRow('Blur', 'blur', 0, 36, 1, 'px'), rangeRow('Densidade', 'density', 75, 125), rangeRow('Escala do texto', 'fontScale', 90, 115)]);
    const actions = el('div', { class: 'gafi-actions' });
    const reset = el('button', { class: 'gafi-secondary-btn', type: 'button', text: 'Repor tudo' });
    reset.addEventListener('click', () => storage.set({ ...DEFAULTS }));
    actions.append(reset);
    scroll.append(actions);
    const footer = el('div', { class: 'gafi-panel-footer', text: 'Tudo é opcional. Mistura temas, cores e efeitos como quiseres.' });
    panel.append(header, scroll, footer);
    document.body.append(panel);
    refreshControls();
  }

  function refreshControls() {
    const panel = document.getElementById('gafi-ui-panel');
    if (!panel) return;
    panel.querySelectorAll('.gafi-theme-card').forEach(card => card.classList.toggle('is-active', card.dataset.theme === state.theme && !state.customColors));
    panel.querySelectorAll('.gafi-theme-hint').forEach(hint => { hint.textContent = `${getTheme().specialLabel} — ${getTheme().vibe}`; });
    const labels = {
      'Efeito especial do tema': 'atmosphere', 'Cores personalizadas': 'customColors', 'Glass': 'glass', 'Cantos arredondados': 'rounded', 'Gradientes': 'gradients', 'Glow': 'glow', 'Sombras': 'shadows', 'Animações': 'animations', 'Glow ao focar': 'focusGlow', 'Ruído cinematográfico': 'noise', 'Painel ancorado à direita': 'dockPanel', 'Modo compacto': 'compact', 'Contraste reforçado': 'highContrast'
    };
    panel.querySelectorAll('.gafi-toggle-row').forEach(row => {
      const key = labels[row.querySelector('strong')?.textContent];
      const input = row.querySelector('input[type="checkbox"]');
      if (key && input) input.checked = Boolean(state[key]);
    });
    const colorKeys = ['customBackground', 'customContrast', 'customAccent'];
    panel.querySelectorAll('.gafi-hex').forEach((input, index) => { if (colorKeys[index]) input.value = state[colorKeys[index]]; });
    panel.querySelectorAll('input[type="color"]').forEach((input, index) => { if (colorKeys[index]) input.value = state[colorKeys[index]]; });
    panel.querySelectorAll('.gafi-value').forEach((node, index) => {
      const config = [['atmosphereIntensity', '%'], ['radius', 'px'], ['blur', 'px'], ['density', '%'], ['fontScale', '%']][index];
      if (config) node.textContent = `${Math.round(state[config[0]])}${config[1]}`;
    });
  }

  function createAtmosphereLayer() {
    document.getElementById('gafi-atmosphere-layer')?.remove();
    const special = state.atmosphere ? getTheme().special : 'none';
    const layer = el('div', { id: 'gafi-atmosphere-layer', class: 'gafi-atmosphere-layer', 'aria-hidden': 'true' });
    const count = special === 'snow' ? 34 : special === 'stars' ? 44 : special === 'rgb-led' ? 12 : 20;
    for (let i = 0; i < count; i++) {
      const item = el('span', { class: `gafi-atmo-item gafi-atmo-${special}` });
      item.style.setProperty('--i', i);
      item.style.setProperty('--delay', `${-(i % 11) * 1.7}s`);
      item.style.setProperty('--size', `${8 + (i % 6) * 3}px`);
      item.style.setProperty('--drift', `${-40 + ((i * 29) % 81)}px`);
      item.style.setProperty('--x', `${(i * 17.3) % 103}%`);
      item.style.setProperty('--y', `${(i * 23.7) % 108}%`);
      layer.append(item);
    }
    document.body.prepend(layer);
    layer.dataset.special = special;
  }

  function ensureAtmosphereLayer() {
    if (!document.body) return;
    const expected = state.atmosphere ? getTheme().special : 'none';
    const current = document.getElementById('gafi-atmosphere-layer')?.dataset.special;
    if (current !== expected) createAtmosphereLayer();
  }

  function togglePanel(open = !panelOpen) {
    panelOpen = open;
    buildPanel();
    document.documentElement.classList.toggle('gafi-panel-open', open);
    document.documentElement.classList.toggle('gafi-panel-docked', open && state.dockPanel);
    document.getElementById('gafi-ui-toggle')?.classList.toggle('is-open', open);
  }

  function buildToggleButton() {
    if (document.getElementById('gafi-ui-toggle')) return;
    const button = el('button', { id: 'gafi-ui-toggle', type: 'button', title: 'Abrir GafiGPT UI', text: '✦' });
    button.addEventListener('click', () => togglePanel());
    document.body.append(button);
  }

  function watchDom() {
    const observer = new MutationObserver(() => {
      if (!document.getElementById('gafi-ui-toggle')) buildToggleButton();
      if (!document.getElementById('gafi-ui-panel') && panelOpen) buildPanel();
      document.documentElement.classList.toggle('gafi-panel-docked', panelOpen && state.dockPanel);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  async function init() {
    state = await storage.get();
    setVars();
    ensureAtmosphereLayer();
    buildToggleButton();
    buildPanel();
    watchDom();
  }

  init();
})();

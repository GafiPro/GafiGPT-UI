(() => {
  'use strict';

  const DEFAULTS = {
    theme: 'midnight', customBackground: '#10131a', customContrast: '#f5f7ff', customAccent: '#9b7cff',
    glass: true, rounded: true, forest: false, gradients: true, glow: true, shadows: true,
    animations: true, compact: false, highContrast: true, customColors: false,
    blur: 18, radius: 18, density: 100, fontScale: 100,
  };

  const THEMES = {
    midnight: { name: 'Midnight Violet', bg: '#0b0d12', surface: '#131722', surface2: '#1a1f2c', text: '#f7f7fb', muted: '#b7bdd0', accent: '#9b7cff', accent2: '#c6b7ff', forest: false },
    forest: { name: 'Emerald Forest', bg: '#07130e', surface: '#0e2118', surface2: '#143023', text: '#f1fff7', muted: '#b5d4c2', accent: '#45d483', accent2: '#91f0b8', forest: true },
    aurora: { name: 'Arctic Aurora', bg: '#071218', surface: '#10232c', surface2: '#17313c', text: '#effcff', muted: '#b9d8df', accent: '#6fe8ff', accent2: '#b28cff', forest: false },
    ocean: { name: 'Deep Ocean', bg: '#06111e', surface: '#0b1d30', surface2: '#112842', text: '#f2f8ff', muted: '#b5c9df', accent: '#3fb8ff', accent2: '#73e0ff', forest: false },
    sunset: { name: 'Violet Sunset', bg: '#180b15', surface: '#28121f', surface2: '#36182a', text: '#fff5fb', muted: '#ddb9cf', accent: '#ff8bb5', accent2: '#ffbf7a', forest: false },
    cyber: { name: 'Cyber Mint', bg: '#070d0c', surface: '#0d1716', surface2: '#132522', text: '#f2fffb', muted: '#b4d8d0', accent: '#53f5cf', accent2: '#b1ff72', forest: false },
    paper: { name: 'Paper & Ink', bg: '#f3efe6', surface: '#fffdf8', surface2: '#ebe5d8', text: '#1e211f', muted: '#606861', accent: '#7656d6', accent2: '#4c8a67', forest: false },
    sakura: { name: 'Sakura Night', bg: '#160e14', surface: '#24151f', surface2: '#321d2a', text: '#fff7fb', muted: '#dec4d1', accent: '#ff8fc7', accent2: '#d9a6ff', forest: false },
    desert: { name: 'Desert Amber', bg: '#17100a', surface: '#26190d', surface2: '#382312', text: '#fff8ed', muted: '#decbb4', accent: '#ffb454', accent2: '#ffdd8a', forest: false },
    ember: { name: 'Obsidian Ember', bg: '#0d0b0a', surface: '#1b1210', surface2: '#291714', text: '#fff8f4', muted: '#d7bcb1', accent: '#ff6d4d', accent2: '#ffb15f', forest: false },
  };

  let state = { ...DEFAULTS };
  let panelOpen = false;
  let applying = false;

  const storage = {
    get() {
      return new Promise(resolve => chrome.storage.local.get({ gafiGPTUI: DEFAULTS }, data => resolve({ ...DEFAULTS, ...(data.gafiGPTUI || {}) })));
    },
    set(next) {
      state = { ...state, ...next };
      chrome.storage.local.set({ gafiGPTUI: state });
      applyState();
    }
  };

  const hexToRgb = hex => {
    const clean = String(hex).replace('#', '');
    const full = clean.length === 3 ? clean.split('').map(x => x + x).join('') : clean;
    const n = Number.parseInt(full, 16);
    if (Number.isNaN(n)) return [0, 0, 0];
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const rgbToHex = (r, g, b) => '#' + [r, g, b].map(x => Math.max(0, Math.min(255, Number(x))).toString(16).padStart(2, '0')).join('');
  const clamp = (n, min, max) => Math.max(min, Math.min(max, Number(n)));
  const theme = () => THEMES[state.theme] || THEMES.midnight;

  function mix(a, b, amount) {
    const ar = hexToRgb(a), br = hexToRgb(b);
    return rgbToHex(Math.round(ar[0] * (1 - amount) + br[0] * amount), Math.round(ar[1] * (1 - amount) + br[1] * amount), Math.round(ar[2] * (1 - amount) + br[2] * amount));
  }

  function setVars() {
    const t = theme();
    const bg = state.customColors ? state.customBackground : t.bg;
    const text = state.customColors ? state.customContrast : t.text;
    const rgb = hexToRgb(bg);
    const surface = state.customColors ? mix(bg, text, 0.07) : t.surface;
    const surface2 = state.customColors ? mix(bg, text, 0.13) : t.surface2;
    const vars = {
      '--gafi-bg': bg,
      '--gafi-surface': surface,
      '--gafi-surface-2': surface2,
      '--gafi-text': text,
      '--gafi-muted': state.customColors ? mix(text, bg, 0.42) : t.muted,
      '--gafi-accent': state.customColors ? state.customAccent : t.accent,
      '--gafi-accent-2': state.customColors ? mix(state.customAccent, text, 0.3) : t.accent2,
      '--gafi-radius': state.rounded ? `${state.radius}px` : '3px',
      '--gafi-blur': state.glass ? `${state.blur}px` : '0px',
      '--gafi-density': `${state.density / 100}`,
      '--gafi-font-scale': `${state.fontScale / 100}`,
      '--gafi-shadow': state.shadows ? '0 16px 50px rgba(0,0,0,.20)' : 'none',
      '--gafi-glow': state.glow ? '0 0 28px color-mix(in srgb, var(--gafi-accent) 20%, transparent)' : 'none',
      '--gafi-gradient': state.gradients ? `linear-gradient(135deg, color-mix(in srgb, var(--gafi-accent) 12%, transparent), transparent 55%)` : 'none',
      '--gafi-bg-rgb': rgb.join(','),
    };
    Object.entries(vars).forEach(([key, value]) => document.documentElement.style.setProperty(key, value));
    document.documentElement.dataset.gafiTheme = state.theme;
    document.documentElement.dataset.gafiUi = 'on';
    document.documentElement.dataset.gafiGlass = String(state.glass);
    document.documentElement.dataset.gafiRounded = String(state.rounded);
    document.documentElement.dataset.gafiForest = String(state.forest);
    document.documentElement.dataset.gafiGradients = String(state.gradients);
    document.documentElement.dataset.gafiGlow = String(state.glow);
    document.documentElement.dataset.gafiShadows = String(state.shadows);
    document.documentElement.dataset.gafiAnimations = String(state.animations);
    document.documentElement.dataset.gafiCompact = String(state.compact);
    document.documentElement.dataset.gafiHighContrast = String(state.highContrast);
  }

  function applyState() {
    if (applying) return;
    applying = true;
    setVars();
    requestAnimationFrame(() => { updateControls(); applying = false; });
  }

  function make(tag, props = {}, children = []) {
    const el = document.createElement(tag);
    Object.entries(props).forEach(([k, v]) => {
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'checked') el.checked = v;
      else if (k === 'value') el.value = v;
      else if (k === 'title') el.title = v;
      else el.setAttribute(k, v);
    });
    children.forEach(child => el.append(child));
    return el;
  }

  function addSection(root, title, children) {
    const section = make('section', { class: 'gafi-section' });
    section.append(make('div', { class: 'gafi-section-title', text: title }));
    children.forEach(c => section.append(c));
    root.append(section);
    return section;
  }

  function toggleRow(label, key, hint = '') {
    const input = make('input', { type: 'checkbox', checked: !!state[key] });
    input.addEventListener('change', () => storage.set({ [key]: input.checked }));
    return make('label', { class: 'gafi-toggle-row', title: hint }, [
      make('span', { class: 'gafi-toggle-copy' }, [make('strong', { text: label }), hint ? make('small', { text: hint }) : document.createTextNode('')]),
      make('span', { class: 'gafi-switch' }, [input, make('i')]),
    ]);
  }

  function rangeRow(label, key, min, max, step = 1) {
    const wrap = make('div', { class: 'gafi-range-row' });
    const value = make('span', { class: 'gafi-value' });
    const input = make('input', { type: 'range', min, max, step, value: state[key] });
    const render = () => value.textContent = `${Math.round(state[key])}${key === 'radius' || key === 'blur' ? 'px' : '%'}`;
    input.addEventListener('input', () => { state[key] = clamp(input.value, min, max); render(); applyState(); });
    input.addEventListener('change', () => chrome.storage.local.set({ gafiGPTUI: state }));
    wrap.append(make('div', { class: 'gafi-range-head' }, [make('span', { text: label }), value]), input);
    render();
    return wrap;
  }

  function colorRow(label, key) {
    const wrap = make('div', { class: 'gafi-color-row' });
    const picker = make('input', { type: 'color', value: state[key] });
    const hex = make('input', { class: 'gafi-hex', type: 'text', value: state[key], maxlength: 7 });
    const set = v => { if (/^#[0-9a-f]{6}$/i.test(v)) { state[key] = v; chrome.storage.local.set({ gafiGPTUI: state }); applyState(); updateControls(); } };
    picker.addEventListener('input', () => { hex.value = picker.value; set(picker.value); });
    hex.addEventListener('change', () => { set(hex.value); picker.value = state[key]; });
    wrap.append(make('span', { text: label }), make('span', { class: 'gafi-color-control' }, [picker, hex]));
    return wrap;
  }

  function rgbPanel(key, title) {
    const wrap = make('div', { class: 'gafi-rgb-panel' });
    wrap.append(make('div', { class: 'gafi-subtitle', text: title }));
    ['r', 'g', 'b'].forEach((channel, i) => {
      const value = make('span', { class: 'gafi-rgb-value', text: String(hexToRgb(state[key])[i]) });
      const input = make('input', { type: 'range', min: 0, max: 255, value: hexToRgb(state[key])[i] });
      input.addEventListener('input', () => {
        const rgb = hexToRgb(state[key]); rgb[i] = Number(input.value); state[key] = rgbToHex(...rgb);
        chrome.storage.local.set({ gafiGPTUI: state }); applyState(); updateControls();
      });
      wrap.append(make('div', { class: `gafi-rgb-line rgb-${channel}` }, [make('span', { text: channel.toUpperCase() }), input, value]));
    });
    return wrap;
  }

  function themeGrid() {
    const grid = make('div', { class: 'gafi-theme-grid' });
    Object.entries(THEMES).forEach(([id, t]) => {
      const button = make('button', { class: 'gafi-theme-card', type: 'button', title: t.name });
      button.dataset.theme = id;
      button.append(make('span', { class: 'gafi-swatch', style: `--swatch-bg:${t.bg};--swatch-accent:${t.accent}` }), make('strong', { text: t.name }));
      button.addEventListener('click', () => storage.set({ theme: id, customColors: false, customBackground: t.bg, customContrast: t.text, customAccent: t.accent, forest: Boolean(t.forest) }));
      grid.append(button);
    });
    return grid;
  }

  function buildPanel() {
    if (document.getElementById('gafi-ui-panel')) return;
    const root = make('aside', { id: 'gafi-ui-panel', class: 'gafi-panel' });
    const header = make('div', { class: 'gafi-panel-header' }, [
      make('div', { class: 'gafi-brand' }, [make('span', { class: 'gafi-logo', text: 'G' }), make('div', {}, [make('strong', { text: 'GafiGPT UI' }), make('small', { text: 'Design the way you chat.' })])]),
      make('button', { class: 'gafi-close', type: 'button', text: '×', title: 'Fechar painel' }),
    ]);
    header.querySelector('.gafi-close').addEventListener('click', () => togglePanel(false));
    root.append(header);

    const scroll = make('div', { class: 'gafi-panel-scroll' });
    addSection(scroll, 'Temas', [themeGrid()]);
    addSection(scroll, 'Cores & Contraste', [
      toggleRow('Cores personalizadas', 'customColors', 'Ativa o fundo, contraste e accent escolhidos abaixo.'),
      colorRow('Fundo', 'customBackground'), colorRow('Contraste', 'customContrast'), colorRow('Accent', 'customAccent'),
      rgbPanel('customBackground', 'RGB do fundo'), rgbPanel('customContrast', 'RGB do contraste'), rgbPanel('customAccent', 'RGB do accent'),
    ]);
    addSection(scroll, 'Efeitos', [
      toggleRow('Glass', 'glass', 'Vidro translúcido com blur.'),
      toggleRow('Cantos arredondados', 'rounded', 'Aplica raios consistentes a toda a interface.'),
      toggleRow('Gradientes', 'gradients', 'Gradientes suaves em superfícies e áreas vazias.'),
      toggleRow('Glow', 'glow', 'Brilho subtil no accent.'),
      toggleRow('Sombras', 'shadows', 'Profundidade e elevação.'),
      toggleRow('Animações', 'animations', 'Transições e micro-animações.'),
      toggleRow('Folhas de floresta', 'forest', 'Decoração orgânica nos espaços vazios.'),
    ]);
    addSection(scroll, 'Layout', [
      toggleRow('Modo compacto', 'compact', 'Reduz espaços e largura da UI.'),
      toggleRow('Contraste reforçado', 'highContrast', 'Melhora legibilidade em superfícies e texto.'),
      rangeRow('Raio dos cantos', 'radius', 6, 32),
      rangeRow('Intensidade do blur', 'blur', 0, 32),
      rangeRow('Densidade', 'density', 75, 125),
      rangeRow('Escala do texto', 'fontScale', 90, 115),
    ]);

    const actions = make('div', { class: 'gafi-actions' });
    const reset = make('button', { class: 'gafi-secondary-btn', text: 'Repor predefinições' });
    reset.addEventListener('click', () => storage.set({ ...DEFAULTS }));
    actions.append(reset); scroll.append(actions);
    root.append(scroll, make('div', { class: 'gafi-panel-footer', text: 'Tudo aqui é opcional — desliga o que não combina contigo.' }));
    document.body.append(root);
    if (state.forest) ensureForestLayer();
    updateControls();
  }

  function updateControls() {
    const panel = document.getElementById('gafi-ui-panel');
    if (!panel) return;
    panel.querySelectorAll('.gafi-theme-card').forEach(el => el.classList.toggle('is-active', el.dataset.theme === state.theme && !state.customColors));
    const map = {
      'Cores personalizadas': 'customColors', 'Glass': 'glass', 'Cantos arredondados': 'rounded', 'Gradientes': 'gradients',
      'Glow': 'glow', 'Sombras': 'shadows', 'Animações': 'animations', 'Folhas de floresta': 'forest',
      'Modo compacto': 'compact', 'Contraste reforçado': 'highContrast'
    };
    panel.querySelectorAll('.gafi-toggle-row').forEach(row => {
      const label = row.querySelector('strong')?.textContent;
      const key = map[label];
      if (key) row.querySelector('input').checked = !!state[key];
    });
    panel.querySelectorAll('.gafi-hex').forEach((input, i) => input.value = state[['customBackground', 'customContrast', 'customAccent'][i % 3]]);
    panel.querySelectorAll('input[type="color"]').forEach((input, i) => input.value = state[['customBackground', 'customContrast', 'customAccent'][i % 3]]);
    panel.querySelectorAll('.gafi-value').forEach((v, i) => {
      const keys = ['radius', 'blur', 'density', 'fontScale'];
      if (keys[i]) v.textContent = `${Math.round(state[keys[i]])}${keys[i] === 'radius' || keys[i] === 'blur' ? 'px' : '%'}`;
    });
    panel.querySelectorAll('.gafi-rgb-panel').forEach((box, panelIndex) => {
      const key = ['customBackground', 'customContrast', 'customAccent'][panelIndex];
      if (!key) return;
      const rgb = hexToRgb(state[key]);
      box.querySelectorAll('.gafi-rgb-line').forEach((line, i) => {
        const slider = line.querySelector('input');
        const value = line.querySelector('.gafi-rgb-value');
        slider.value = rgb[i]; value.textContent = rgb[i];
      });
    });
    if (state.forest) ensureForestLayer(); else removeForestLayer();
  }

  function ensureForestLayer() {
    if (document.getElementById('gafi-forest-layer')) return;
    const layer = make('div', { id: 'gafi-forest-layer', class: 'gafi-forest-layer', 'aria-hidden': 'true' });
    for (let i = 0; i < 18; i++) layer.append(make('span', { class: 'gafi-leaf', style: `--i:${i};--rot:${(i * 31) % 360}deg;--delay:${(i % 7) * -1.2}s;--size:${18 + (i % 5) * 7}px` }));
    document.body.prepend(layer);
  }
  function removeForestLayer() { document.getElementById('gafi-forest-layer')?.remove(); }
  function togglePanel(open = !panelOpen) {
    panelOpen = open; buildPanel();
    document.documentElement.classList.toggle('gafi-panel-open', open);
    document.getElementById('gafi-ui-toggle')?.classList.toggle('is-open', open);
  }
  function buildToggleButton() {
    if (document.getElementById('gafi-ui-toggle')) return;
    const button = make('button', { id: 'gafi-ui-toggle', class: 'gafi-floating-button', type: 'button', title: 'Abrir GafiGPT UI', text: '✦' });
    button.addEventListener('click', () => togglePanel()); document.body.append(button);
  }
  function guardAgainstRouteChanges() {
    const observer = new MutationObserver(() => {
      if (!document.getElementById('gafi-ui-toggle')) buildToggleButton();
      if (!document.getElementById('gafi-ui-panel') && panelOpen) buildPanel();
      applyState();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
  async function init() {
    state = await storage.get(); setVars(); buildToggleButton(); buildPanel(); guardAgainstRouteChanges();
  }
  init();
})();

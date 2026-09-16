import fs from 'node:fs';

const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
const js = fs.readFileSync('content.js', 'utf8');
const integration = fs.readFileSync('chatgpt-integration.js', 'utf8');
const css = fs.readFileSync('styles.css', 'utf8');
const fixes = fs.readFileSync('fixes.css', 'utf8');

const themes = ['midnight','forest','winter','ocean','cyber','sunset','sakura','desert','paper','space'];
const atmosphereIds = ['aurora','forest','snow','bubbles','rgb-led','sunset','petals','dust','paper','stars'];

const themeKeysMatch = js.match(/const THEMES\s*=\s*\{([\s\S]*?)\n\s*\};/);
if (!themeKeysMatch) throw new Error('THEMES object not found');
const themeBody = themeKeysMatch[1];
for (const theme of themes) {
  if (!new RegExp(`(?:^|[,{])\\s*${theme}:\\s*\\[`).test(themeBody)) throw new Error(`Missing theme: ${theme}`);
}
for (const atmosphere of atmosphereIds) {
  if (!themeBody.includes(`'${atmosphere}'`)) throw new Error(`Missing atmosphere: ${atmosphere}`);
}
const themeArrays = [...themeBody.matchAll(/(?:^|[,])\s*[a-z-]+:\s*(\[[^\n]+\])/g)].map(match => match[1]);
if (themeArrays.length !== themes.length) throw new Error(`Expected ${themes.length} theme definitions, found ${themeArrays.length}`);

const stateKeys = [
  'customColors','customBackground','customContrast','customAccent',
  'rounded','glass','atmosphere','gradients','glow','shadows','animations',
  'compact','highContrast','focusGlow','noise','blur','radius','density',
  'fontScale','atmosphereIntensity'
];
for (const key of stateKeys) {
  if (!new RegExp(`\\b${key}:`).test(js)) throw new Error(`Missing state key: ${key}`);
}

const cssSafeguards = [
  'data-gafi-glass="false"',
  'data-gafi-rounded="false"',
  'data-gafi-noise="true"',
  'data-gafi-scheme="light"',
  'data-gafi-special="snow"',
  '--gafi-atmo-opacity:',
  'data-gafi-animations="false"',
  'data-gafi-compact="true"'
];
for (const selector of cssSafeguards) {
  if (!css.includes(selector)) throw new Error(`Missing CSS safeguard: ${selector}`);
}

const wiringChecks = [
  ["root.dataset.gafiAtmosphere = String(Boolean(state.atmosphere));", 'Atmosphere toggle wiring missing'],
  ["'--gafi-atmo-opacity':", 'Atmosphere opacity variable wiring missing'],
  ['function normalizeState(raw)', 'State normalization missing'],
  ['function toBoolean(value, fallback)', 'Legacy boolean parsing missing'],
  ["if (expected === 'none')", 'Atmosphere disable cleanup missing'],
  ['function scheduleDomRepair()', 'DOM repair scheduling missing'],
  ['refreshQueued = true;', 'Apply coalescing missing'],
  ['box-shadow:var(--gafi-shadow),var(--gafi-glow)', 'Panel shadow must follow shadow toggle']
];
for (const [needle, message] of wiringChecks) if (!(js.includes(needle) || css.includes(needle))) throw new Error(message);

if (!fixes.includes('-webkit-backdrop-filter:none!important')) throw new Error('Native webkit backdrop blur kill-switch missing');
if (!fixes.includes('backdrop-filter:none!important')) throw new Error('Native backdrop blur kill-switch missing');
if (!fixes.includes('[data-gafi-chatgpt-surface="true"]')) throw new Error('ChatGPT header surface safeguard missing');
if (!fixes.includes('[data-gafi-account-surface="true"]')) throw new Error('Account surface safeguard missing');
if (!fixes.includes('[data-gafi-composer-surface="true"]')) throw new Error('Composer surface safeguard missing');
if (!fixes.includes('[data-gafi-composer="true"]')) throw new Error('Composer field safeguard missing');
if (!fixes.includes('[data-gafi-search="true"]')) throw new Error('Search field safeguard missing');
if (!fixes.includes('[data-gafi-search-surface="true"]')) throw new Error('Search surface safeguard missing');
if (!fixes.includes('background:var(--gafi-surface)!important')) throw new Error('Theme surface fallback missing');

/* Blur is forbidden at runtime, including the original glass implementation. */
if (/backdrop-filter\s*:\s*blur\s*\(/i.test(css) || /backdrop-filter\s*:\s*blur\s*\(/i.test(fixes)) {
  throw new Error('Backdrop blur must be completely absent');
}
if (/blur\(var\(--gafi-blur\)\)/i.test(css) || /blur\(var\(--gafi-blur\)\)/i.test(fixes)) {
  throw new Error('Gafi blur variable must not be applied');
}

/* Runtime semantic integration. */
if (!integration.includes('data-gafi-search')) throw new Error('Semantic search integration missing');
if (!integration.includes('data-gafi-chatgpt-surface')) throw new Error('ChatGPT header integration missing');
if (!integration.includes('data-gafi-account-surface')) throw new Error('Account integration missing');
if (!integration.includes('data-gafi-composer-surface')) throw new Error('Composer integration missing');
if (!integration.includes('childList: true')) throw new Error('DOM replacement observer missing');

const forbiddenPatterns = [
  ['if (applying || !document.documentElement)', 'State updates are being dropped behind an apply lock'],
  ['body > :not(#gafi-atmosphere-layer)', 'Global body child z-index hack can break ChatGPT stacking'],
  ['[role="dialog"],[role="menu"],[role="listbox"],textarea,input,select,[contenteditable="true"]', 'Glass must not blanket native menus/dialogs/forms'],
  ['body::after{content:"";position:fixed;inset:0;z-index:1', 'Noise overlay must not sit above ChatGPT content']
];
for (const [needle, message] of forbiddenPatterns) if (css.includes(needle) || fixes.includes(needle)) throw new Error(message);

if (!manifest.permissions?.includes('storage')) throw new Error('storage permission missing');
const script = manifest.content_scripts?.[0];
if (!script?.js?.includes('content.js')) throw new Error('content.js not registered');
if (!script?.js?.includes('chatgpt-integration.js')) throw new Error('chatgpt-integration.js not registered');
if (!script?.css?.includes('styles.css')) throw new Error('styles.css not registered');
if (!script?.css?.includes('fixes.css')) throw new Error('fixes.css not registered');
if (!manifest.host_permissions?.some(value => value.includes('chatgpt.com'))) throw new Error('chatgpt.com host permission missing');

console.log(`PASS: ${themes.length} themes + ${stateKeys.length} state keys + semantic shell/composer guards + zero-backdrop-blur policy + native chrome safeguards + manifest`);

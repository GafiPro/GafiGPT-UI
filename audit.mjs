import fs from 'node:fs';

const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
const js = fs.readFileSync('content.js', 'utf8');
const css = fs.readFileSync('styles.css', 'utf8');
const fixes = fs.readFileSync('fixes.css', 'utf8');

const themes = ['midnight','forest','winter','ocean','cyber','sunset','sakura','desert','paper','space'];

const themeKeysMatch = js.match(/const THEMES\s*=\s*\{([\s\S]*?)\n\s*\};/);
if (!themeKeysMatch) throw new Error('THEMES object not found');
const themeBody = themeKeysMatch[1];
for (const theme of themes) {
  if (!new RegExp(`(?:^|[,{])\\s*${theme}:\\s*\\[`).test(themeBody)) {
    throw new Error(`Missing theme: ${theme}`);
  }
}
const atmosphereIds = ['aurora','forest','snow','bubbles','rgb-led','sunset','petals','dust','paper','stars'];
for (const atmosphere of atmosphereIds) {
  if (!themeBody.includes(`'${atmosphere}'`)) throw new Error(`Missing atmosphere: ${atmosphere}`);
}

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
  'data-gafi-animations="false"'
];
for (const selector of cssSafeguards) {
  if (!css.includes(selector)) throw new Error(`Missing CSS safeguard: ${selector}`);
}
if (!js.includes("root.dataset.gafiAtmosphere = String(Boolean(state.atmosphere));")) {
  throw new Error('Atmosphere toggle wiring missing');
}
if (!js.includes("root.style.setProperty('--gafi-atmo-opacity'")) {
  throw new Error('Atmosphere opacity wiring missing');
}

const fixSafeguards = [
  'body > :not(#gafi-atmosphere-layer)',
  'input:not([type="checkbox"]):not([type="radio"]),textarea,select,[contenteditable="true"]',
  'data-gafi-special="aurora"',
  'data-gafi-scheme="light"'
];
for (const selector of fixSafeguards) {
  if (!fixes.includes(selector)) throw new Error(`Missing integration safeguard: ${selector}`);
}

if (!manifest.permissions?.includes('storage')) throw new Error('storage permission missing');
const script = manifest.content_scripts?.[0];
if (!script?.js?.includes('content.js')) throw new Error('content.js not registered');
if (!script?.css?.includes('styles.css')) throw new Error('styles.css not registered');
if (!script?.css?.includes('fixes.css')) throw new Error('fixes.css not registered');
if (!manifest.host_permissions?.some(value => value.includes('chatgpt.com'))) throw new Error('chatgpt.com host permission missing');

console.log(`PASS: ${themes.length} themes + ${stateKeys.length} state keys + core CSS + integration CSS + manifest`);

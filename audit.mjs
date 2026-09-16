import fs from 'node:fs';

const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
const js = fs.readFileSync('content.js', 'utf8');
const css = fs.readFileSync('styles.css', 'utf8');

const themes = ['midnight','forest','winter','ocean','cyber','sunset','sakura','desert','paper','space'];

// Verify the actual theme object instead of relying on a fragile regex such as `theme: [`.
const themeKeysMatch = js.match(/const THEMES\s*=\s*\{([\s\S]*?)\n\s*\};/);
if (!themeKeysMatch) throw new Error('THEMES object not found');
const themeBody = themeKeysMatch[1];
for (const theme of themes) {
  if (!new RegExp(`(?:^|\\n)\\s*${theme}:\\s*\\{`).test(themeBody)) {
    throw new Error(`Missing theme: ${theme}`);
  }
}
if ((themeBody.match(/specialLabel:/g) || []).length !== themes.length) {
  throw new Error(`Expected ${themes.length} theme atmospheres`);
}

const stateKeys = [
  'customColors','customBackground','customContrast','customAccent',
  'rounded','glass','atmosphere','gradients','glow','shadows','animations',
  'compact','highContrast','focusGlow','noise','dockPanel',
  'blur','radius','density','fontScale','atmosphereIntensity'
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
  'data-gafi-atmosphere="false"',
  'data-gafi-animations="false"'
];
for (const selector of cssSafeguards) {
  if (!css.includes(selector)) throw new Error(`Missing CSS safeguard: ${selector}`);
}

if (!manifest.permissions?.includes('storage')) throw new Error('storage permission missing');
const script = manifest.content_scripts?.[0];
if (!script?.js?.includes('content.js')) throw new Error('content.js not registered');
if (!script?.css?.includes('styles.css')) throw new Error('styles.css not registered');
if (!manifest.host_permissions?.some(value => value.includes('chatgpt.com'))) throw new Error('chatgpt.com host permission missing');

console.log(`PASS: ${themes.length} themes + ${stateKeys.length} state keys + CSS safeguards + manifest`);

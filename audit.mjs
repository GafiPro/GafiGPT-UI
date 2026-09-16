import fs from 'node:fs';

const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
const js = fs.readFileSync('content.js', 'utf8');
const css = fs.readFileSync('styles.css', 'utf8');

const themes = ['midnight','forest','winter','ocean','cyber','sunset','sakura','desert','paper','space'];
for (const theme of themes) {
  if (!new RegExp(`\\b${theme}:\\s*\\[`).test(js)) throw new Error(`Missing theme: ${theme}`);
}
if ((js.match(/specialLabel:/g) || []).length !== 10) throw new Error('Expected 10 theme atmospheres');
for (const key of ['customColors','customBackground','customContrast','customAccent','rounded','glass','atmosphere','gradients','glow','shadows','animations','compact','highContrast','focusGlow','noise','atmosphereIntensity']) {
  if (!new RegExp(`\\b${key}:`).test(js)) throw new Error(`Missing state key: ${key}`);
}
for (const selector of ['data-gafi-glass="false"','data-gafi-rounded="false"','data-gafi-noise="true"','data-gafi-scheme="light"','data-gafi-special="snow"']) {
  if (!css.includes(selector)) throw new Error(`Missing CSS safeguard: ${selector}`);
}
if (!manifest.permissions?.includes('storage')) throw new Error('storage permission missing');
if (!manifest.content_scripts?.[0]?.js?.includes('content.js')) throw new Error('content.js not registered');
if (!manifest.content_scripts?.[0]?.css?.includes('styles.css')) throw new Error('styles.css not registered');
console.log(`PASS: ${themes.length} themes + state/contrast/effect safeguards + manifest`);

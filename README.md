# GafiGPT UI

A browser extension that adds a customizable visual layer to ChatGPT.

## What is included

- 10 built-in themes with intentionally different palettes.
- Automatic readable foreground/contrast colors per theme.
- Custom background, contrast and accent colors.
- HEX color inputs and live RGB sliders for background and contrast.
- Glass / backdrop blur.
- Consistent rounded corners (the default design language).
- Gradients, glow and shadows.
- Optional forest decoration with floating leaves.
- Compact mode, density control and text scaling.
- High-contrast mode.
- Animation toggle.
- Persistent local settings.
- A right-side control panel injected directly into ChatGPT.
- A floating button for opening and closing the panel.

## Themes

1. Midnight Violet
2. Emerald Forest
3. Arctic Aurora
4. Deep Ocean
5. Violet Sunset
6. Cyber Mint
7. Paper & Ink
8. Sakura Night
9. Desert Amber
10. Obsidian Ember

## Install locally in Chrome / Edge

1. Download or clone this repository.
2. Open `chrome://extensions` (or Edge's extensions page).
3. Enable **Developer mode**.
4. Choose **Load unpacked**.
5. Select the repository folder.
6. Open `https://chatgpt.com/` and click the `✦` button.

## Architecture

The extension intentionally keeps the core design system in CSS custom properties. Themes only define palette variables; effects and layout controls are independent switches. This makes the visual features composable and easier to maintain when ChatGPT changes its own markup.

The DOM integration uses broad, defensive selectors and a `MutationObserver` to survive route changes in a single-page app.

## Notes

This project is a client-side visual customization layer. It does not access conversation contents or send user data anywhere. Settings are stored with Chrome's local extension storage.

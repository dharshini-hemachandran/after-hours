# Dharshini Hemachandran — After Hours
Interactive 2D street-exploration portfolio. Plain HTML/CSS/JS: no build step.

## Deploy (GitHub Pages)
1. Push this folder to a repo's `main` branch.
2. Repo → Settings → Pages → Source: **GitHub Actions**. The included workflow deploys on every push.

## Update
- **Gallery:** add `NN.webp` to `assets/gallery/full/` (full size) and `assets/gallery/thumb/` (~520px wide), then add a line in `assets/gallery.js`. Optional caption in `t`.
- **Portrait:** drop `assets/portrait.jpg` (4:5) and it appears in the About panel automatically.
- **Copy/links:** edit the `PANELS` object in `index.html`.
- Local preview: `python3 -m http.server` then open http://localhost:8000
- Deep links: `#gallery`, `#about`, `#arcade`, `#studio`, `#contact`.


`assets/world3d.js` builds the explorable wuxia compound procedurally with Three.js (vendored in `assets/vendor`, MIT). If WebGL is unavailable the earlier 2D street is used. Zones/portfolio mapping: `Z` array in `world3d.js`.

## v4: Ghost King's residence
Third-person avatar, 8 labelled wings, manuscript UI (assets/ui.css, ui.js). Projects embed the live sites via iframe.

## Residence (TGCF-inspired, original)
- `assets/world3d.js`: procedural Three.js world, third-person avatar, wings, signs, map.
- `assets/ui.js` + `assets/ui.css`: manuscript/archive interface system (one layout per wing).
- Wings and zones: `Z` array in `world3d.js`; panel content: `P` object in `ui.js`.
- Project chambers embed the live GitHub Pages projects in iframes (tabs: *Live exhibit* / *Live demonstration*).

## Current build
Ghost-city street, canal, courtyard and tiered manor (procedural Three.js, `assets/world3d.js`), manuscript UI (`assets/ui.js` / `ui.css`), generated resume `assets/Dharshini_Hemachandran_Resume.pdf` (review before use).

## Navigation
All rooms are declared in `assets/nav.js` (id, bounds, entrance, exit, destination, content, trigger) and validated on load. Content for each room lives in `assets/ui.js`. Reference board and credits: `moodboard.html`. Fonts (SIL OFL) in `assets/fonts`.
Append `?lite` to the URL to disable the painterly render pass on slower machines.

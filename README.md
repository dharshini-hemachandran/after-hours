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

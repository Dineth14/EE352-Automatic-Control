# Control Systems Theory — Interactive Textbook

An open-source, fully interactive web-based textbook covering **Automatic Control Systems** from Laplace transforms to modern state-space design. Built with pure HTML/CSS/JS — no build tools, no frameworks — deployable instantly via GitHub Pages.

## Features

- **10 comprehensive chapters** with full theory, derivations, and worked examples
- **30+ interactive simulations** (3 per chapter) using Canvas 2D and Three.js
- **3D hero visualizations** on every page (Three.js r128)
- **KaTeX-rendered mathematics** — publication-quality equations throughout
- **Dark/Light theme** with glassmorphism design
- **Fully responsive** — works on desktop, tablet, and mobile
- **Zero build step** — open `index.html` and go

## Chapters

| #  | Topic | Key Simulations |
|----|-------|-----------------|
| 01 | Laplace Transform & Transfer Functions | Laplace Explorer, Pole-Zero Designer, Second-Order Analyzer |
| 02 | Block Diagram Reduction | Feedback Loop Analyzer, Signal Flow Graph, Multi-Loop Reducer |
| 03 | State Space Analysis | 3D State Trajectory, Controllability Checker, Phase Portrait |
| 04 | Time Response Analysis | Damping Comparison, S-Plane Spec Region, SSE Calculator |
| 05 | Root Locus | Root Locus Explorer, Custom Designer, Gain vs Performance |
| 06 | Frequency Response | Bode Plot Explorer, Nyquist Plot, Margin Calculator |
| 07 | Stability | Routh Array Calculator, Pole Stability Viewer, Sensitivity |
| 08 | PID Controllers | PID Tuner, P/PI/PID Comparison, Ziegler-Nichols Calculator |
| 09 | Digital Control | Sampling & Aliasing, Z-Plane Viewer, s→z Mapping |
| 10 | Modern Control | Pole Placement, Observer Convergence, LQR Q/R Tuning |

## Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| Three.js | r128 | 3D visualizations |
| KaTeX | 0.16.9 | Math rendering |
| Chart.js | 4.x | 2D plots (available) |
| Google Fonts | — | Inter, Syne, JetBrains Mono |

All dependencies loaded via CDN — no `npm install` required.

## Quick Start

```bash
# Clone
git clone https://github.com/your-username/control-systems-theory.git
cd control-systems-theory

# Serve locally (any static server works)
python -m http.server 8000
# or
npx serve .
```

Then open `http://localhost:8000` in your browser.

## Project Structure

```
control-systems-theory/
├── index.html                  # Landing page
├── assets/
│   ├── css/
│   │   ├── main.css            # Global styles, layout, themes
│   │   ├── math.css            # Equation styling
│   │   └── animations.css      # Keyframe animations
│   └── js/
│       ├── utils.js            # Math engine (Complex, ODE, polynomials)
│       ├── theme.js            # Dark/light toggle
│       ├── nav.js              # Sidebar, scroll, collapsibles
│       ├── katex-init.js       # KaTeX auto-render config
│       └── three-setup.js      # Shared Three.js scene factory
└── chapters/
    ├── 01-laplace-transfer-functions/
    ├── 02-block-diagram-reduction/
    ├── 03-state-space/
    ├── 04-time-response/
    ├── 05-root-locus/
    ├── 06-frequency-response/
    ├── 07-stability/
    ├── 08-pid-controllers/
    ├── 09-digital-control/
    └── 10-modern-control/
```

## References

- Ogata, K. *Modern Control Engineering*, 5th Ed.
- Nise, N.S. *Control Systems Engineering*, 8th Ed.
- Dorf, R.C. & Bishop, R.H. *Modern Control Systems*, 14th Ed.
- Franklin, G.F. et al. *Feedback Control of Dynamic Systems*, 8th Ed.

## License

MIT License. Free to use for education and reference.

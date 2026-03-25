<div align="center">

# Control Systems Theory: Interactive Textbook

**A modern, purely client-side, interactive web-based textbook for Automatic Control Systems.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Three.js](https://img.shields.io/badge/Three.js-black?style=flat&logo=three.js&logoColor=white)](https://threejs.org/)
[![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=flat&logo=chartdotjs&logoColor=white)](https://www.chartjs.org/)

*Learn Control Systems not just by reading equations, but by interacting with live simulations right in your browser.*

</div>

## ✨ Features

- **Zero Build Tools**: No React, no Webpack, no Node.js required. Just raw HTML, CSS, and ES Modules. Runs strictly in the browser.
- **High-Performance 3D**: `Three.js` powers the interactive hero scenes at the start of every chapter to provide intuitive geometric intuition of abstract concepts (like the s-plane, root locus, and Lyapunov landscapes).
- **Live Mathematics**: Equations are beautifully rendered client-side using `KaTeX`.
- **30+ Interactive Simulations**: Over 30 custom JavaScript physics/math simulations using HTML5 Canvas and `Chart.js`, demonstrating:
  - Laplace/Transfer Functions
  - Block Diagram Reduction / Signal Flow Graphs
  - State Space Trajectories
  - Transient Response Metrics
  - Root Locus Plotting
  - Bode & Nyquist Frequency Responses
  - Routh-Hurwitz & Lyapunov Stability
  - PID Controller Tuning (Manual & Ziegler-Nichols)
  - Aliasing & Z-transforms
  - LQR Optimization & Kalman Filtering

## 📖 Chapter Outline

1. **Laplace & Transfer Functions:** The math foundation of continuous-time systems.
2. **Block Diagram Reduction:** Algebra and topology of interconnected systems.
3. **State Space:** Modern matrix representation $x' = Ax + Bu$.
4. **Time Response:** Transient specifications (rise time, overshoot) and steady-state error.
5. **Root Locus:** Tracing closed-loop poles as system gain varies.
6. **Frequency Response:** Bode plots, Nyquist criterion, and stability margins.
7. **Stability:** Routh-Hurwitz arrays and Bounded-Input Bounded-Output concepts.
8. **PID Controllers:** Proportional, Integral, and Derivative tuning heuristics.
9. **Digital Control:** Sampling theorem, z-transforms, and aliasing.
10. **Modern Control:** Introduction to LQR and Kalman Filters.

## 🚀 Deployment

This textbook is designed to be hosted cheaply and effortlessly on **GitHub Pages**.

We use a simple GitHub Action to deploy the `main` branch directly to GitHub Pages.
No build step is required—the action simply pushes the static files to the hosting environment.

## 🛠️ Local Development

Clone the repository and serve the files locally. Note: Due to ES module CORS restrictions (`<script type="module">`), you *must* use a local web server (opening `index.html` directly via `file://` will block the scripts).

**Using Python:**
```bash
python -m http.server 8000
# Then visit http://localhost:8000 in your browser
```

**Using Node / npx:**
```bash
npx serve
```

## 🎨 Design Philosophy

This project aims for an "MIT Press / Premium Academic" aesthetic.
- **Colors:** Deep obsidian backgrounds (`#0b1120`), frosted glass panels, and vibrant cyan/violet/orange accents for data representation.
- **Typography:** *Inter* for maximum readability, *Syne* for striking headers, and *JetBrains Mono* for code/data readouts.
- **Engaging UX:** Every single page features a 3D visualization that responds to mouse movement, keeping the reader engaged.

## 📄 License

This project is licensed under the MIT License. Feel free to use this as a template for other interactive textbooks.

/**
 * assets/js/utils.js
 * Core math & utility library for Control Systems simulations.
 * Pure ES module — no external dependencies.
 */

/* ═══════════════════════════════════════════════════════════════
   Complex Arithmetic
   ═══════════════════════════════════════════════════════════════ */
export class Complex {
  constructor(r = 0, i = 0) { this.r = r; this.i = i; }
  static fromPolar(mag, phase) { return new Complex(mag * Math.cos(phase), mag * Math.sin(phase)); }
  get mag() { return Math.sqrt(this.r * this.r + this.i * this.i); }
  get phase() { return Math.atan2(this.i, this.r); }
  get conj() { return new Complex(this.r, -this.i); }
  add(c) { return new Complex(this.r + c.r, this.i + c.i); }
  sub(c) { return new Complex(this.r - c.r, this.i - c.i); }
  mul(c) { return new Complex(this.r * c.r - this.i * c.i, this.r * c.i + this.i * c.r); }
  scale(k) { return new Complex(this.r * k, this.i * k); }
  div(c) {
    const d = c.r * c.r + c.i * c.i;
    if (d === 0) return new Complex(Infinity, Infinity);
    return new Complex((this.r * c.r + this.i * c.i) / d, (this.i * c.r - this.r * c.i) / d);
  }
  neg() { return new Complex(-this.r, -this.i); }
  toString() { return `${this.r.toFixed(3)} ${this.i >= 0 ? '+' : '-'} ${Math.abs(this.i).toFixed(3)}j`; }
}

/* ═══════════════════════════════════════════════════════════════
   ODE Integration
   ═══════════════════════════════════════════════════════════════ */
export const ODE = {
  /** 4th-order Runge-Kutta. f(t, x, u) → dx/dt array. x = state array. */
  rk4(f, x, t, dt, u) {
    const n = x.length;
    const k1 = f(t, x, u);
    const x1 = x.map((xi, i) => xi + 0.5 * dt * k1[i]);
    const k2 = f(t + 0.5 * dt, x1, u);
    const x2 = x.map((xi, i) => xi + 0.5 * dt * k2[i]);
    const k3 = f(t + 0.5 * dt, x2, u);
    const x3 = x.map((xi, i) => xi + dt * k3[i]);
    const k4 = f(t + dt, x3, u);
    return x.map((xi, i) => xi + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
  },

  /** Simulate ODE from t0 to tf, returns {t[], x[][]} */
  simulate(f, x0, t0, tf, dt, uFn) {
    const ts = [t0], xs = [x0.slice()];
    let x = x0.slice(), t = t0;
    while (t < tf - dt * 0.01) {
      const u = uFn ? uFn(t) : 0;
      x = this.rk4(f, x, t, dt, u);
      t += dt;
      ts.push(t);
      xs.push(x.slice());
    }
    return { t: ts, x: xs };
  }
};

/* ═══════════════════════════════════════════════════════════════
   Matrix Operations  (dense, column-major-friendly)
   ═══════════════════════════════════════════════════════════════ */
export const Matrix = {
  zeros(r, c) { return Array.from({ length: r }, () => new Array(c).fill(0)); },
  identity(n) { const m = this.zeros(n, n); for (let i = 0; i < n; i++) m[i][i] = 1; return m; },
  clone(A) { return A.map(row => row.slice()); },

  add(A, B) { return A.map((row, i) => row.map((v, j) => v + B[i][j])); },
  sub(A, B) { return A.map((row, i) => row.map((v, j) => v - B[i][j])); },
  scale(A, k) { return A.map(row => row.map(v => v * k)); },

  mul(A, B) {
    const m = A.length, n = B[0].length, p = B.length;
    const C = this.zeros(m, n);
    for (let i = 0; i < m; i++)
      for (let j = 0; j < n; j++)
        for (let k = 0; k < p; k++)
          C[i][j] += A[i][k] * B[k][j];
    return C;
  },

  mulVec(A, x) { return A.map(row => row.reduce((s, a, i) => s + a * x[i], 0)); },
  vecAdd(a, b) { return a.map((v, i) => v + b[i]); },
  vecSub(a, b) { return a.map((v, i) => v - b[i]); },
  vecScale(a, k) { return a.map(v => v * k); },
  dot(a, b) { return a.reduce((s, v, i) => s + v * b[i], 0); },

  transpose(A) {
    const r = A.length, c = A[0].length, T = this.zeros(c, r);
    for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) T[j][i] = A[i][j];
    return T;
  },

  /** Determinant via LU-like expansion (small matrices) */
  det(A) {
    const n = A.length;
    if (n === 1) return A[0][0];
    if (n === 2) return A[0][0] * A[1][1] - A[0][1] * A[1][0];
    let d = 0;
    for (let j = 0; j < n; j++) {
      const sub = A.slice(1).map(row => [...row.slice(0, j), ...row.slice(j + 1)]);
      d += (j % 2 === 0 ? 1 : -1) * A[0][j] * this.det(sub);
    }
    return d;
  },

  /** Inverse via adjugate (for small matrices up to ~5×5) */
  inv(A) {
    const n = A.length, d = this.det(A);
    if (Math.abs(d) < 1e-14) return null;
    const adj = this.zeros(n, n);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const sub = A.filter((_, r) => r !== i).map(row => row.filter((_, c) => c !== j));
        adj[j][i] = ((i + j) % 2 === 0 ? 1 : -1) * this.det(sub) / d;
      }
    }
    return adj;
  },

  /** Eigenvalues for 2×2 matrix (closed-form) */
  eig2(A) {
    const tr = A[0][0] + A[1][1];
    const det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
    const disc = tr * tr - 4 * det;
    if (disc >= 0) {
      const s = Math.sqrt(disc);
      return [new Complex((tr + s) / 2, 0), new Complex((tr - s) / 2, 0)];
    }
    const s = Math.sqrt(-disc);
    return [new Complex(tr / 2, s / 2), new Complex(tr / 2, -s / 2)];
  },

  /** Rank via SVD-like approach (column reduction) */
  rank(A, tol = 1e-10) {
    const m = A.length, n = A[0].length;
    const B = this.clone(A);
    let r = 0;
    for (let j = 0; j < n && r < m; j++) {
      let pivot = -1, maxVal = tol;
      for (let i = r; i < m; i++) {
        if (Math.abs(B[i][j]) > maxVal) { maxVal = Math.abs(B[i][j]); pivot = i; }
      }
      if (pivot === -1) continue;
      [B[r], B[pivot]] = [B[pivot], B[r]];
      const scale = B[r][j];
      for (let k = j; k < n; k++) B[r][k] /= scale;
      for (let i = 0; i < m; i++) {
        if (i === r) continue;
        const f = B[i][j];
        for (let k = j; k < n; k++) B[i][k] -= f * B[r][k];
      }
      r++;
    }
    return r;
  }
};

/* ═══════════════════════════════════════════════════════════════
   Polynomial Operations
   ═══════════════════════════════════════════════════════════════ */
export const Polynomial = {
  /** Evaluate polynomial p(x) = p[0]*x^n + p[1]*x^(n-1) + ... + p[n] */
  evaluate(coeffs, x) {
    let result = 0;
    for (let i = 0; i < coeffs.length; i++) result = result * x + coeffs[i];
    return result;
  },

  /** Evaluate at complex s */
  evaluateComplex(coeffs, s) {
    let result = new Complex(0, 0);
    for (let i = 0; i < coeffs.length; i++) {
      result = result.mul(s).add(new Complex(coeffs[i], 0));
    }
    return result;
  },

  /** Multiply two polynomials */
  multiply(a, b) {
    const result = new Array(a.length + b.length - 1).fill(0);
    for (let i = 0; i < a.length; i++)
      for (let j = 0; j < b.length; j++)
        result[i + j] += a[i] * b[j];
    return result;
  },

  /** Build polynomial from roots: (s-r1)(s-r2)... Returns real coefficients */
  fromRoots(roots) {
    let poly = [1];
    for (const root of roots) {
      if (typeof root === 'number' || root.i === 0) {
        const r = typeof root === 'number' ? root : root.r;
        poly = this.multiply(poly, [1, -r]);
      } else {
        // Complex conjugate pair: (s - r)(s - r*) = s² - 2Re(r)s + |r|²
        poly = this.multiply(poly, [1, -2 * root.r, root.r * root.r + root.i * root.i]);
      }
    }
    return poly.map(c => Math.abs(c) < 1e-12 ? 0 : c);
  },

  /** Find roots using companion matrix eigenvalues (Aberth-like for small degree) */
  roots(coeffs) {
    const n = coeffs.length - 1;
    if (n <= 0) return [];
    if (n === 1) return [new Complex(-coeffs[1] / coeffs[0], 0)];
    if (n === 2) {
      const a = coeffs[0], b = coeffs[1], c = coeffs[2];
      const disc = b * b - 4 * a * c;
      if (disc >= 0) {
        return [new Complex((-b + Math.sqrt(disc)) / (2 * a), 0),
                new Complex((-b - Math.sqrt(disc)) / (2 * a), 0)];
      }
      const re = -b / (2 * a), im = Math.sqrt(-disc) / (2 * a);
      return [new Complex(re, im), new Complex(re, -im)];
    }
    // Durand-Kerner method for higher degrees
    const a0 = coeffs[0];
    const norm = coeffs.map(c => c / a0);
    let z = [];
    for (let i = 0; i < n; i++) {
      const angle = (2 * Math.PI * i) / n + 0.4;
      z.push(Complex.fromPolar(1 + Math.random() * 0.1, angle));
    }
    for (let iter = 0; iter < 100; iter++) {
      let maxDelta = 0;
      for (let i = 0; i < n; i++) {
        const pz = Polynomial.evaluateComplex(norm, z[i]);
        let denom = new Complex(1, 0);
        for (let j = 0; j < n; j++) {
          if (j !== i) denom = denom.mul(z[i].sub(z[j]));
        }
        const delta = pz.div(denom);
        z[i] = z[i].sub(delta);
        maxDelta = Math.max(maxDelta, delta.mag);
      }
      if (maxDelta < 1e-12) break;
    }
    // Clean up near-real roots
    return z.map(r => Math.abs(r.i) < 1e-8 ? new Complex(r.r, 0) : r);
  }
};

/* ═══════════════════════════════════════════════════════════════
   Transfer Function Utilities
   ═══════════════════════════════════════════════════════════════ */
export const TransferFunction = {
  /** Evaluate H(s) = K * prod(s-z_i) / prod(s-p_i) at complex s */
  evaluate(zeros, poles, K, s) {
    let num = new Complex(K, 0);
    for (const z of zeros) num = num.mul(s.sub(z));
    let den = new Complex(1, 0);
    for (const p of poles) den = den.mul(s.sub(p));
    return num.div(den);
  },

  /** Bode data: returns {omega[], magDB[], phaseDeg[]} */
  bode(zeros, poles, K, omegaRange = [-2, 3], nPoints = 500) {
    const omega = [], magDB = [], phaseDeg = [];
    for (let i = 0; i < nPoints; i++) {
      const w = Math.pow(10, omegaRange[0] + (omegaRange[1] - omegaRange[0]) * i / (nPoints - 1));
      const s = new Complex(0, w);
      const H = this.evaluate(zeros, poles, K, s);
      omega.push(w);
      magDB.push(20 * Math.log10(Math.max(H.mag, 1e-20)));
      let ph = H.phase * 180 / Math.PI;
      // Unwrap phase
      if (i > 0) {
        while (ph - phaseDeg[i - 1] > 180) ph -= 360;
        while (ph - phaseDeg[i - 1] < -180) ph += 360;
      }
      phaseDeg.push(ph);
    }
    return { omega, magDB, phaseDeg };
  },

  /** Nyquist data: returns {re[], im[]} for omega from near-0 to large */
  nyquist(zeros, poles, K, nPoints = 1000, maxOmega = 100) {
    const re = [], im = [];
    for (let i = 0; i < nPoints; i++) {
      const w = maxOmega * i / (nPoints - 1) + 0.001;
      const s = new Complex(0, w);
      const H = this.evaluate(zeros, poles, K, s);
      re.push(H.r);
      im.push(H.i);
    }
    return { re, im };
  },

  /** Step response via ODE simulation. Returns {t[], y[]} */
  stepResponse(zeros, poles, K, tFinal = 10, dt = 0.01) {
    if (poles.length === 0) return { t: [0], y: [K] };
    // Build state-space in controllable canonical form
    const n = poles.length;
    const charPoly = Polynomial.fromRoots(poles);
    const numPoly = Polynomial.fromRoots(zeros);
    // Pad numerator
    const bFull = new Array(n + 1).fill(0);
    const offset = n + 1 - numPoly.length;
    for (let i = 0; i < numPoly.length; i++) bFull[offset + i] = numPoly[i] * K;
    // Companion matrix A
    const A = Matrix.zeros(n, n);
    for (let i = 0; i < n - 1; i++) A[i][i + 1] = 1;
    for (let i = 0; i < n; i++) A[n - 1][i] = -charPoly[n - i] / charPoly[0];
    const B = new Array(n).fill(0); B[n - 1] = 1 / charPoly[0];
    const C = new Array(n).fill(0);
    for (let i = 0; i < n; i++) C[i] = bFull[i + 1] - bFull[0] * charPoly[i + 1] / charPoly[0];
    const D = bFull[0] / charPoly[0];

    const f = (t, x, u) => Matrix.vecAdd(Matrix.mulVec(A, x), Matrix.vecScale(B, u));
    const sim = ODE.simulate(f, new Array(n).fill(0), 0, tFinal, dt, () => 1);
    const y = sim.x.map(xi => Matrix.dot(C, xi) + D);
    return { t: sim.t, y };
  },

  /** Impulse response via ODE simulation */
  impulseResponse(zeros, poles, K, tFinal = 10, dt = 0.01) {
    if (poles.length === 0) return { t: [0], y: [0] };
    const n = poles.length;
    const charPoly = Polynomial.fromRoots(poles);
    const numPoly = Polynomial.fromRoots(zeros);
    const bFull = new Array(n + 1).fill(0);
    const offset = n + 1 - numPoly.length;
    for (let i = 0; i < numPoly.length; i++) bFull[offset + i] = numPoly[i] * K;
    const A = Matrix.zeros(n, n);
    for (let i = 0; i < n - 1; i++) A[i][i + 1] = 1;
    for (let i = 0; i < n; i++) A[n - 1][i] = -charPoly[n - i] / charPoly[0];
    const B = new Array(n).fill(0); B[n - 1] = 1 / charPoly[0];
    const C = new Array(n).fill(0);
    for (let i = 0; i < n; i++) C[i] = bFull[i + 1] - bFull[0] * charPoly[i + 1] / charPoly[0];

    // Impulse: set x(0) = B
    const x0 = B.slice();
    const f = (t, x, u) => Matrix.mulVec(A, x);
    const sim = ODE.simulate(f, x0, 0, tFinal, dt, () => 0);
    const y = sim.x.map(xi => Matrix.dot(C, xi));
    return { t: sim.t, y };
  },

  /** Gain & phase margins */
  margins(zeros, poles, K) {
    const bodeData = this.bode(zeros, poles, K, [-3, 4], 2000);
    let GM = Infinity, PM = Infinity, wpc = NaN, wgc = NaN;
    // Find gain crossover (|H| crosses 0 dB)
    for (let i = 1; i < bodeData.omega.length; i++) {
      if ((bodeData.magDB[i - 1] - 0) * (bodeData.magDB[i] - 0) <= 0) {
        const frac = (0 - bodeData.magDB[i - 1]) / (bodeData.magDB[i] - bodeData.magDB[i - 1]);
        wgc = bodeData.omega[i - 1] + frac * (bodeData.omega[i] - bodeData.omega[i - 1]);
        const ph = bodeData.phaseDeg[i - 1] + frac * (bodeData.phaseDeg[i] - bodeData.phaseDeg[i - 1]);
        PM = 180 + ph;
        break;
      }
    }
    // Find phase crossover (phase crosses -180°)
    for (let i = 1; i < bodeData.omega.length; i++) {
      if ((bodeData.phaseDeg[i - 1] + 180) * (bodeData.phaseDeg[i] + 180) <= 0) {
        const frac = (-180 - bodeData.phaseDeg[i - 1]) / (bodeData.phaseDeg[i] - bodeData.phaseDeg[i - 1]);
        wpc = bodeData.omega[i - 1] + frac * (bodeData.omega[i] - bodeData.omega[i - 1]);
        const mag = bodeData.magDB[i - 1] + frac * (bodeData.magDB[i] - bodeData.magDB[i - 1]);
        GM = -mag;
        break;
      }
    }
    return { GM, PM, wgc, wpc };
  }
};

/* ═══════════════════════════════════════════════════════════════
   Second-Order System Helpers
   ═══════════════════════════════════════════════════════════════ */
export const SecondOrder = {
  /** Transient specifications for standard 2nd-order underdamped system */
  specs(zeta, wn) {
    const wd = wn * Math.sqrt(Math.max(1 - zeta * zeta, 0));
    const sigma = zeta * wn;
    const tp = wd > 0 ? Math.PI / wd : Infinity;
    const Mp = zeta < 1 ? Math.exp(-Math.PI * zeta / Math.sqrt(1 - zeta * zeta)) : 0;
    const ts2 = sigma > 0 ? 4 / sigma : Infinity;     // 2% criterion
    const ts5 = sigma > 0 ? 3 / sigma : Infinity;     // 5% criterion
    const tr = wn > 0 ? (1.76 * zeta * zeta * zeta - 0.417 * zeta * zeta + 1.039 * zeta + 1) / wn : Infinity;
    return { wd, sigma, tp, Mp, MpPercent: Mp * 100, ts2, ts5, tr };
  },

  /** Step response y(t) for standard 2nd-order */
  stepResponse(zeta, wn, tFinal, dt = 0.01) {
    const t = [], y = [];
    const wd = wn * Math.sqrt(Math.max(1 - zeta * zeta, 1e-12));
    for (let ti = 0; ti <= tFinal; ti += dt) {
      t.push(ti);
      if (zeta < 1) {
        const phi = Math.acos(zeta);
        y.push(1 - (Math.exp(-zeta * wn * ti) / Math.sqrt(1 - zeta * zeta)) * Math.sin(wd * ti + phi));
      } else if (Math.abs(zeta - 1) < 1e-6) {
        y.push(1 - (1 + wn * ti) * Math.exp(-wn * ti));
      } else {
        const s1 = -zeta * wn + wn * Math.sqrt(zeta * zeta - 1);
        const s2 = -zeta * wn - wn * Math.sqrt(zeta * zeta - 1);
        y.push(1 + (s1 * Math.exp(s2 * ti) - s2 * Math.exp(s1 * ti)) / (s2 - s1));
      }
    }
    return { t, y };
  }
};

/* ═══════════════════════════════════════════════════════════════
   Routh-Hurwitz
   ═══════════════════════════════════════════════════════════════ */
export const RouthHurwitz = {
  /** Build Routh array from polynomial coefficients [a_n, a_{n-1}, ..., a_0].
      Returns {table: 2D array, stable: boolean, signChanges: number} */
  build(coeffs) {
    const n = coeffs.length;
    const cols = Math.ceil(n / 2);
    const rows = n;
    const table = Array.from({ length: rows }, () => new Array(cols).fill(0));
    // First two rows
    for (let j = 0; j < cols; j++) {
      if (2 * j < n) table[0][j] = coeffs[2 * j];
      if (2 * j + 1 < n) table[1][j] = coeffs[2 * j + 1];
    }
    // Remaining rows
    for (let i = 2; i < rows; i++) {
      const a = table[i - 1][0];
      if (Math.abs(a) < 1e-15) {
        // Zero first column — use epsilon method
        table[i - 1][0] = 1e-6;
      }
      for (let j = 0; j < cols - 1; j++) {
        const num = table[i - 1][0] * table[i - 2][j + 1] - table[i - 2][0] * table[i - 1][j + 1];
        table[i][j] = num / table[i - 1][0];
      }
    }
    // Count sign changes in first column
    let signChanges = 0;
    for (let i = 1; i < rows; i++) {
      if (table[i][0] * table[i - 1][0] < 0) signChanges++;
    }
    return { table, stable: signChanges === 0, signChanges };
  }
};

/* ═══════════════════════════════════════════════════════════════
   Plotting Helpers
   ═══════════════════════════════════════════════════════════════ */
export const PlotUtils = {
  logspace(startPow, endPow, n) {
    const arr = [];
    for (let i = 0; i < n; i++) arr.push(Math.pow(10, startPow + (endPow - startPow) * i / (n - 1)));
    return arr;
  },
  linspace(a, b, n) {
    const arr = [];
    for (let i = 0; i < n; i++) arr.push(a + (b - a) * i / (n - 1));
    return arr;
  }
};

/* ═══════════════════════════════════════════════════════════════
   Canvas 2D Drawing Helpers
   ═══════════════════════════════════════════════════════════════ */
export const Canvas2D = {
  /** Create a canvas that fills its container, handles DPR */
  setup(container, bgColor = '#0b1120') {
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);
    return { canvas, ctx, resize, getSize: () => container.getBoundingClientRect() };
  },

  /** Draw s-plane grid */
  drawSPlane(ctx, w, h, scale = 40, originX, originY) {
    const ox = originX ?? w / 2, oy = originY ?? h / 2;
    ctx.strokeStyle = 'rgba(0,229,255,0.06)';
    ctx.lineWidth = 1;
    // Vertical grid lines
    for (let x = ox % scale; x < w; x += scale) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    // Horizontal grid lines
    for (let y = oy % scale; y < h; y += scale) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    // Axes
    ctx.strokeStyle = 'rgba(0,229,255,0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(w, oy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, h); ctx.stroke();
    // Labels
    ctx.fillStyle = '#8a9bb5';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText('Re', w - 24, oy - 8);
    ctx.fillText('Im', ox + 8, 16);
    return { ox, oy, scale };
  },

  /** Draw a pole marker (×) */
  drawPole(ctx, x, y, size = 8, color = '#7c4dff') {
    ctx.strokeStyle = color; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x - size, y - size); ctx.lineTo(x + size, y + size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + size, y - size); ctx.lineTo(x - size, y + size); ctx.stroke();
  },

  /** Draw a zero marker (○) */
  drawZero(ctx, x, y, size = 7, color = '#00e5ff') {
    ctx.strokeStyle = color; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(x, y, size, 0, 2 * Math.PI); ctx.stroke();
  }
};

/* ═══════════════════════════════════════════════════════════════
   UI Utilities
   ═══════════════════════════════════════════════════════════════ */
export const UIUtils = {
  /** Animated count-up for number display */
  animateValue(el, target, duration = 600, decimals = 2) {
    const start = performance.now();
    const begin = parseFloat(el.textContent) || 0;
    const step = (now) => {
      let p = Math.min((now - start) / duration, 1);
      p = 1 - Math.pow(1 - p, 4); // easeOutQuart
      el.textContent = (begin + (target - begin) * p).toFixed(decimals);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  },

  /** Intersection observer to trigger animations */
  observeReveal(selector = '.reveal') {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.15 });
    document.querySelectorAll(selector).forEach(el => obs.observe(el));
  },

  /** Lazy load simulation modules */
  lazyLoadSim(containerId, modulePath) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const obs = new IntersectionObserver(async (entries) => {
      if (entries[0].isIntersecting) {
        obs.disconnect();
        try {
          const mod = await import(modulePath);
          if (mod.init) mod.init();
        } catch (e) { console.warn('Failed to load sim:', modulePath, e); }
      }
    }, { rootMargin: '200px' });
    obs.observe(container);
  },

  /** Collapsible section toggle */
  initCollapsibles() {
    document.querySelectorAll('.collapsible').forEach(el => {
      el.addEventListener('click', () => {
        el.classList.toggle('open');
        const body = el.nextElementSibling;
        if (body && body.classList.contains('collapsible-body')) {
          body.classList.toggle('open');
        }
      });
    });
  }
};

/* ═══════════════════════════════════════════════════════════════
   Backward compat re-exports
   ═══════════════════════════════════════════════════════════════ */
export const MathUtils = {
  rk4: ODE.rk4.bind(ODE),
  matMul: Matrix.mul.bind(Matrix),
  vecAdd: Matrix.vecAdd,
  matVecMul: Matrix.mulVec.bind(Matrix),
  complexAdd: (a, b) => new Complex(a.r + b.r, a.i + b.i),
  complexSub: (a, b) => new Complex(a.r - b.r, a.i - b.i),
  complexMul: (a, b) => new Complex(a.r * b.r - a.i * b.i, a.r * b.i + a.i * b.r),
  complexDiv: (a, b) => { const d = b.r * b.r + b.i * b.i; return new Complex((a.r * b.r + a.i * b.i) / d, (a.i * b.r - a.r * b.i) / d); },
  complexMag: (c) => Math.sqrt(c.r * c.r + c.i * c.i),
  complexPhase: (c) => Math.atan2(c.i, c.r),
  evaluateTransferFunctionAtS: (zeros, poles, K, s) => TransferFunction.evaluate(zeros, poles, K, s),
  logspace: PlotUtils.logspace
};

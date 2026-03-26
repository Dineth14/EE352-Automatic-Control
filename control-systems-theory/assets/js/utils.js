/* ============================================================
   Control Systems Theory — Shared Math Utilities
   RK4, Matrix Operations, Polynomial Roots, Complex Arithmetic, FFT
   ============================================================ */

/** Complex number class */
export class Complex {
  constructor(re = 0, im = 0) {
    this.re = re;
    this.im = im;
  }
  static fromPolar(r, theta) {
    return new Complex(r * Math.cos(theta), r * Math.sin(theta));
  }
  get mag() { return Math.sqrt(this.re * this.re + this.im * this.im); }
  get phase() { return Math.atan2(this.im, this.re); }
  get conj() { return new Complex(this.re, -this.im); }
  add(b) { return new Complex(this.re + b.re, this.im + b.im); }
  sub(b) { return new Complex(this.re - b.re, this.im - b.im); }
  mul(b) {
    if (typeof b === 'number') return new Complex(this.re * b, this.im * b);
    return new Complex(this.re * b.re - this.im * b.im, this.re * b.im + this.im * b.re);
  }
  div(b) {
    if (typeof b === 'number') return new Complex(this.re / b, this.im / b);
    const d = b.re * b.re + b.im * b.im;
    return new Complex((this.re * b.re + this.im * b.im) / d, (this.im * b.re - this.re * b.im) / d);
  }
  neg() { return new Complex(-this.re, -this.im); }
  toString(dp = 3) {
    const r = this.re.toFixed(dp);
    const i = this.im.toFixed(dp);
    if (Math.abs(this.im) < 1e-10) return r;
    if (Math.abs(this.re) < 1e-10) return `${i}j`;
    return this.im >= 0 ? `${r}+${i}j` : `${r}${i}j`;
  }
}

/** Evaluate polynomial p(s) = p[0]*s^n + p[1]*s^(n-1) + ... + p[n] at complex s */
export function polyEval(coeffs, s) {
  let result = new Complex(0, 0);
  for (let i = 0; i < coeffs.length; i++) {
    const c = typeof coeffs[i] === 'number' ? new Complex(coeffs[i], 0) : coeffs[i];
    result = result.mul(s).add(c);
  }
  return result;
}

/** Evaluate transfer function H(s) = num(s)/den(s) */
export function tfEval(num, den, s) {
  const sComplex = typeof s === 'number' ? new Complex(s, 0) : s;
  return polyEval(num, sComplex).div(polyEval(den, sComplex));
}

/** 4th-Order Runge-Kutta integrator
 *  f: (t, state) => dstate/dt (array)
 *  state: array of numbers
 *  Returns new state after one step dt */
export function rk4Step(f, t, state, dt) {
  const n = state.length;
  const k1 = f(t, state);
  const s2 = new Array(n);
  for (let i = 0; i < n; i++) s2[i] = state[i] + 0.5 * dt * k1[i];
  const k2 = f(t + 0.5 * dt, s2);
  const s3 = new Array(n);
  for (let i = 0; i < n; i++) s3[i] = state[i] + 0.5 * dt * k2[i];
  const k3 = f(t + 0.5 * dt, s3);
  const s4 = new Array(n);
  for (let i = 0; i < n; i++) s4[i] = state[i] + dt * k3[i];
  const k4 = f(t + dt, s4);
  const result = new Array(n);
  for (let i = 0; i < n; i++) {
    result[i] = state[i] + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
  }
  return result;
}

/** Simulate ODE from t0 to tf with step dt, returns {t:[], states:[[]]} */
export function simulateODE(f, state0, t0, tf, dt) {
  const ts = [t0];
  const states = [state0.slice()];
  let t = t0;
  let state = state0.slice();
  while (t < tf - dt * 0.5) {
    state = rk4Step(f, t, state, dt);
    t += dt;
    ts.push(t);
    states.push(state.slice());
  }
  return { t: ts, states };
}

/** State-space simulation: dx/dt = Ax + Bu, y = Cx + Du */
export function simulateStateSpace(A, B, C, D, u, x0, t0, tf, dt) {
  const n = A.length;
  const f = (t, x) => {
    const ut = typeof u === 'function' ? u(t) : u;
    const dx = new Array(n);
    for (let i = 0; i < n; i++) {
      dx[i] = 0;
      for (let j = 0; j < n; j++) dx[i] += A[i][j] * x[j];
      if (B && B[i]) {
        const bRow = Array.isArray(B[i]) ? B[i] : [B[i]];
        const uArr = Array.isArray(ut) ? ut : [ut];
        for (let j = 0; j < bRow.length; j++) dx[i] += bRow[j] * (uArr[j] || 0);
      }
    }
    return dx;
  };
  const sim = simulateODE(f, x0, t0, tf, dt);
  const outputs = [];
  for (let k = 0; k < sim.states.length; k++) {
    const x = sim.states[k];
    const ut = typeof u === 'function' ? u(sim.t[k]) : u;
    const uArr = Array.isArray(ut) ? ut : [ut];
    const y = [];
    if (C) {
      for (let i = 0; i < C.length; i++) {
        let val = 0;
        for (let j = 0; j < n; j++) val += C[i][j] * x[j];
        if (D && D[i]) {
          const dRow = Array.isArray(D[i]) ? D[i] : [D[i]];
          for (let j = 0; j < dRow.length; j++) val += dRow[j] * (uArr[j] || 0);
        }
        y.push(val);
      }
    }
    outputs.push(y);
  }
  return { t: sim.t, states: sim.states, outputs };
}

/* ========== Matrix Operations ========== */

/** Create identity matrix n×n */
export function eye(n) {
  const M = [];
  for (let i = 0; i < n; i++) {
    M[i] = new Array(n).fill(0);
    M[i][i] = 1;
  }
  return M;
}

/** Create zero matrix m×n */
export function zeros(m, n) {
  const M = [];
  for (let i = 0; i < m; i++) M[i] = new Array(n || m).fill(0);
  return M;
}

/** Matrix multiply A*B */
export function matMul(A, B) {
  const m = A.length, n = B[0].length, p = B.length;
  const C = zeros(m, n);
  for (let i = 0; i < m; i++)
    for (let j = 0; j < n; j++)
      for (let k = 0; k < p; k++)
        C[i][j] += A[i][k] * B[k][j];
  return C;
}

/** Matrix-vector multiply A*v */
export function matVecMul(A, v) {
  const n = A.length;
  const r = new Array(n).fill(0);
  for (let i = 0; i < n; i++)
    for (let j = 0; j < v.length; j++)
      r[i] += A[i][j] * v[j];
  return r;
}

/** Matrix addition A+B */
export function matAdd(A, B) {
  return A.map((row, i) => row.map((v, j) => v + B[i][j]));
}

/** Scalar multiply c*A */
export function matScale(A, c) {
  return A.map(row => row.map(v => v * c));
}

/** Matrix transpose */
export function transpose(A) {
  const m = A.length, n = A[0].length;
  const T = zeros(n, m);
  for (let i = 0; i < m; i++)
    for (let j = 0; j < n; j++)
      T[j][i] = A[i][j];
  return T;
}

/** Determinant of square matrix (recursive, small matrices) */
export function det(A) {
  const n = A.length;
  if (n === 1) return A[0][0];
  if (n === 2) return A[0][0] * A[1][1] - A[0][1] * A[1][0];
  let d = 0;
  for (let j = 0; j < n; j++) {
    const minor = [];
    for (let i = 1; i < n; i++) {
      minor.push([...A[i].slice(0, j), ...A[i].slice(j + 1)]);
    }
    d += (j % 2 === 0 ? 1 : -1) * A[0][j] * det(minor);
  }
  return d;
}

/** Inverse of square matrix using Gauss-Jordan */
export function matInv(M) {
  const n = M.length;
  const aug = M.map((row, i) => {
    const r = row.slice();
    for (let j = 0; j < n; j++) r.push(i === j ? 1 : 0);
    return r;
  });
  for (let col = 0; col < n; col++) {
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) maxRow = row;
    }
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];
    const pivot = aug[col][col];
    if (Math.abs(pivot) < 1e-12) return null;
    for (let j = 0; j < 2 * n; j++) aug[col][j] /= pivot;
    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = aug[row][col];
      for (let j = 0; j < 2 * n; j++) aug[row][j] -= factor * aug[col][j];
    }
  }
  return aug.map(row => row.slice(n));
}

/** Compute eigenvalues of 2×2 matrix */
export function eig2x2(A) {
  const tr = A[0][0] + A[1][1];
  const d = det(A);
  const disc = tr * tr - 4 * d;
  if (disc >= 0) {
    return [new Complex((tr + Math.sqrt(disc)) / 2, 0), new Complex((tr - Math.sqrt(disc)) / 2, 0)];
  }
  return [new Complex(tr / 2, Math.sqrt(-disc) / 2), new Complex(tr / 2, -Math.sqrt(-disc) / 2)];
}

/** Rank of matrix via SVD-like approach (uses Gaussian elimination) */
export function matRank(M) {
  const m = M.length, n = M[0].length;
  const A = M.map(r => r.slice());
  let rank = 0;
  for (let col = 0; col < n && rank < m; col++) {
    let maxRow = rank;
    for (let row = rank + 1; row < m; row++) {
      if (Math.abs(A[row][col]) > Math.abs(A[maxRow][col])) maxRow = row;
    }
    if (Math.abs(A[maxRow][col]) < 1e-10) continue;
    [A[rank], A[maxRow]] = [A[maxRow], A[rank]];
    for (let row = rank + 1; row < m; row++) {
      const f = A[row][col] / A[rank][col];
      for (let j = col; j < n; j++) A[row][j] -= f * A[rank][j];
    }
    rank++;
  }
  return rank;
}

/** Controllability matrix [B, AB, A^2B, ... A^(n-1)B] */
export function controllabilityMatrix(A, B) {
  const n = A.length;
  const bCols = Array.isArray(B[0]) ? B[0].length : 1;
  const Bmat = B.map(r => Array.isArray(r) ? r : [r]);
  let current = Bmat;
  const cols = [];
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < bCols; c++) {
      cols.push(current.map(r => r[c]));
    }
    current = matMul(A, current);
  }
  // Transpose: cols[i] is column i
  const result = zeros(n, cols.length);
  for (let j = 0; j < cols.length; j++)
    for (let i = 0; i < n; i++)
      result[i][j] = cols[j][i];
  return result;
}

/** Observability matrix [C; CA; CA^2; ... CA^(n-1)] */
export function observabilityMatrix(A, C) {
  const n = A.length;
  const cRows = C.length;
  const rows = [];
  let CA = C.map(r => r.slice());
  for (let i = 0; i < n; i++) {
    for (let r = 0; r < cRows; r++) rows.push(CA[r].slice());
    CA = matMul(CA, A);
  }
  return rows;
}

/* ========== Polynomial Operations ========== */

/** Polynomial multiplication */
export function polyMul(a, b) {
  const result = new Array(a.length + b.length - 1).fill(0);
  for (let i = 0; i < a.length; i++)
    for (let j = 0; j < b.length; j++)
      result[i + j] += a[i] * b[j];
  return result;
}

/** Polynomial addition (same highest degree) */
export function polyAdd(a, b) {
  const maxLen = Math.max(a.length, b.length);
  const result = new Array(maxLen).fill(0);
  for (let i = 0; i < a.length; i++) result[i + maxLen - a.length] += a[i];
  for (let i = 0; i < b.length; i++) result[i + maxLen - b.length] += b[i];
  return result;
}

/** Find roots of polynomial using Durand-Kerner method
 *  coeffs: [a_n, a_{n-1}, ..., a_1, a_0] (highest degree first) */
export function polyRoots(coeffs) {
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
    return [new Complex(-b / (2 * a), Math.sqrt(-disc) / (2 * a)),
            new Complex(-b / (2 * a), -Math.sqrt(-disc) / (2 * a))];
  }
  // Normalize
  const norm = coeffs.map(c => c / coeffs[0]);
  // Initial guesses
  let roots = [];
  for (let i = 0; i < n; i++) {
    roots.push(Complex.fromPolar(1 + 0.4 * Math.random(), (2 * Math.PI * i) / n + 0.1));
  }
  for (let iter = 0; iter < 1000; iter++) {
    let maxShift = 0;
    for (let i = 0; i < n; i++) {
      let pVal = new Complex(norm[0], 0);
      for (let k = 1; k <= n; k++) {
        pVal = pVal.mul(roots[i]).add(new Complex(norm[k], 0));
      }
      let denom = new Complex(1, 0);
      for (let j = 0; j < n; j++) {
        if (j !== i) denom = denom.mul(roots[i].sub(roots[j]));
      }
      const shift = pVal.div(denom);
      roots[i] = roots[i].sub(shift);
      maxShift = Math.max(maxShift, shift.mag);
    }
    if (maxShift < 1e-12) break;
  }
  // Clean up near-real roots
  return roots.map(r => Math.abs(r.im) < 1e-8 ? new Complex(r.re, 0) : r);
}

/** Build polynomial from roots: (s - r1)(s - r2)... returns real coefficients */
export function polyFromRoots(roots) {
  let p = [1];
  for (const r of roots) {
    if (Math.abs(r.im) < 1e-10) {
      p = polyMul(p, [1, -r.re]);
    } else if (r.im > 0) {
      // conjugate pair
      p = polyMul(p, [1, -2 * r.re, r.re * r.re + r.im * r.im]);
    }
  }
  return p;
}

/* ========== Routh-Hurwitz ========== */

/** Build Routh array from characteristic polynomial coefficients
 *  Returns array of rows */
export function routhArray(coeffs) {
  const n = coeffs.length;
  const numCols = Math.ceil(n / 2);
  const rows = [];
  // First two rows
  const row0 = new Array(numCols).fill(0);
  const row1 = new Array(numCols).fill(0);
  for (let i = 0; i < n; i++) {
    if (i % 2 === 0) row0[i / 2] = coeffs[i];
    else row1[(i - 1) / 2] = coeffs[i];
  }
  rows.push(row0);
  rows.push(row1);
  for (let i = 2; i < n; i++) {
    const row = new Array(numCols).fill(0);
    const prev1 = rows[i - 2];
    const prev2 = rows[i - 1];
    const pivot = prev2[0];
    if (Math.abs(pivot) < 1e-15) {
      // Replace zero with epsilon
      rows[i - 1][0] = 1e-6;
      const epsPivot = 1e-6;
      for (let j = 0; j < numCols - 1; j++) {
        row[j] = (epsPivot * (prev1[j + 1] || 0) - (prev1[0] || 0) * (prev2[j + 1] || 0)) / epsPivot;
      }
    } else {
      for (let j = 0; j < numCols - 1; j++) {
        row[j] = (pivot * (prev1[j + 1] || 0) - (prev1[0] || 0) * (prev2[j + 1] || 0)) / pivot;
      }
    }
    rows.push(row);
  }
  return rows;
}

/** Count sign changes in first column of Routh array */
export function routhSignChanges(routh) {
  let changes = 0;
  for (let i = 1; i < routh.length; i++) {
    if (routh[i][0] * routh[i - 1][0] < 0) changes++;
  }
  return changes;
}

/* ========== FFT ========== */

/** Radix-2 FFT (input length must be power of 2) */
export function fft(re, im) {
  const n = re.length;
  if (n === 1) return { re: [re[0]], im: [im ? im[0] : 0] };
  const outRe = new Array(n);
  const outIm = new Array(n);
  // Bit reversal
  const bits = Math.log2(n);
  for (let i = 0; i < n; i++) {
    let rev = 0;
    for (let j = 0; j < bits; j++) rev = (rev << 1) | ((i >> j) & 1);
    outRe[rev] = re[i];
    outIm[rev] = im ? im[i] : 0;
  }
  for (let size = 2; size <= n; size *= 2) {
    const half = size / 2;
    const angle = -2 * Math.PI / size;
    for (let i = 0; i < n; i += size) {
      for (let j = 0; j < half; j++) {
        const wRe = Math.cos(angle * j);
        const wIm = Math.sin(angle * j);
        const tRe = wRe * outRe[i + j + half] - wIm * outIm[i + j + half];
        const tIm = wRe * outIm[i + j + half] + wIm * outRe[i + j + half];
        outRe[i + j + half] = outRe[i + j] - tRe;
        outIm[i + j + half] = outIm[i + j] - tIm;
        outRe[i + j] += tRe;
        outIm[i + j] += tIm;
      }
    }
  }
  return { re: outRe, im: outIm };
}

/* ========== Frequency Response ========== */

/** Compute Bode data: magnitude (dB) and phase (deg) vs omega */
export function bodeData(num, den, omegaRange, numPoints = 500) {
  const [wMin, wMax] = omegaRange;
  const omegas = [];
  const magDB = [];
  const phaseDeg = [];
  for (let i = 0; i < numPoints; i++) {
    const w = Math.pow(10, Math.log10(wMin) + (Math.log10(wMax) - Math.log10(wMin)) * i / (numPoints - 1));
    omegas.push(w);
    const s = new Complex(0, w);
    const H = tfEval(num, den, s);
    magDB.push(20 * Math.log10(Math.max(H.mag, 1e-20)));
    phaseDeg.push(H.phase * 180 / Math.PI);
  }
  // Unwrap phase
  for (let i = 1; i < phaseDeg.length; i++) {
    while (phaseDeg[i] - phaseDeg[i - 1] > 180) phaseDeg[i] -= 360;
    while (phaseDeg[i] - phaseDeg[i - 1] < -180) phaseDeg[i] += 360;
  }
  return { omega: omegas, magDB, phaseDeg };
}

/** Compute Nyquist plot data */
export function nyquistData(num, den, omegaRange, numPoints = 1000) {
  const [wMin, wMax] = omegaRange;
  const reArr = [], imArr = [], omegas = [];
  for (let i = 0; i < numPoints; i++) {
    const w = Math.pow(10, Math.log10(Math.max(wMin, 0.001)) +
      (Math.log10(wMax) - Math.log10(Math.max(wMin, 0.001))) * i / (numPoints - 1));
    omegas.push(w);
    const s = new Complex(0, w);
    const H = tfEval(num, den, s);
    reArr.push(H.re);
    imArr.push(H.im);
  }
  return { re: reArr, im: imArr, omega: omegas };
}

/** Find gain and phase margins */
export function stabilityMargins(num, den) {
  const bode = bodeData(num, den, [0.001, 1000], 5000);
  let pm = Infinity, gm = Infinity, wpc = NaN, wgc = NaN;
  // Find gain crossover (|G|=0dB)
  for (let i = 1; i < bode.magDB.length; i++) {
    if ((bode.magDB[i - 1] >= 0 && bode.magDB[i] < 0) ||
        (bode.magDB[i - 1] < 0 && bode.magDB[i] >= 0)) {
      const frac = (0 - bode.magDB[i - 1]) / (bode.magDB[i] - bode.magDB[i - 1]);
      wgc = bode.omega[i - 1] + frac * (bode.omega[i] - bode.omega[i - 1]);
      const phaseAtGC = bode.phaseDeg[i - 1] + frac * (bode.phaseDeg[i] - bode.phaseDeg[i - 1]);
      pm = 180 + phaseAtGC;
      break;
    }
  }
  // Find phase crossover (phase = -180)
  for (let i = 1; i < bode.phaseDeg.length; i++) {
    if ((bode.phaseDeg[i - 1] >= -180 && bode.phaseDeg[i] < -180) ||
        (bode.phaseDeg[i - 1] < -180 && bode.phaseDeg[i] >= -180)) {
      const frac = (-180 - bode.phaseDeg[i - 1]) / (bode.phaseDeg[i] - bode.phaseDeg[i - 1]);
      wpc = bode.omega[i - 1] + frac * (bode.omega[i] - bode.omega[i - 1]);
      const magAtPC = bode.magDB[i - 1] + frac * (bode.magDB[i] - bode.magDB[i - 1]);
      gm = -magAtPC;
      break;
    }
  }
  return { pm, gm, wgc, wpc };
}

/* ========== Lyapunov Equation Solver ========== */

/** Solve A'P + PA = -Q for 2×2 using vectorization */
export function solveLyapunov2(A, Q) {
  // vec(A'P + PA) = (I⊗A' + A'⊗I) vec(P) = -vec(Q)
  // For 2×2 this is a 4×4 system
  const n = 2;
  const M = zeros(4, 4);
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++)
      for (let k = 0; k < n; k++) {
        M[i * n + j][k * n + j] += A[k][i]; // I⊗A'
        M[i * n + j][i * n + k] += A[k][j]; // A'⊗I
      }
  const rhs = [-Q[0][0], -Q[0][1], -Q[1][0], -Q[1][1]];
  // Solve using Gauss elimination
  const aug = M.map((row, i) => [...row, rhs[i]]);
  for (let col = 0; col < 4; col++) {
    let maxRow = col;
    for (let row = col + 1; row < 4; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) maxRow = row;
    }
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];
    if (Math.abs(aug[col][col]) < 1e-12) return null;
    for (let row = 0; row < 4; row++) {
      if (row === col) continue;
      const f = aug[row][col] / aug[col][col];
      for (let j = 0; j <= 4; j++) aug[row][j] -= f * aug[col][j];
    }
  }
  const sol = aug.map(row => row[4] / row[aug[0].length - 2]); // wrong, fix:
  const P = [[aug[0][4] / aug[0][0], aug[1][4] / aug[1][1]],
             [aug[2][4] / aug[2][2], aug[3][4] / aug[3][3]]];
  return P;
}

/* ========== Second Order System Utilities ========== */

/** Compute second-order underdamped step response */
export function secondOrderStep(zeta, wn, tArray) {
  if (zeta >= 1) {
    // Overdamped or critically damped
    if (Math.abs(zeta - 1) < 1e-6) {
      return tArray.map(t => 1 - (1 + wn * t) * Math.exp(-wn * t));
    }
    const s1 = -wn * (zeta + Math.sqrt(zeta * zeta - 1));
    const s2 = -wn * (zeta - Math.sqrt(zeta * zeta - 1));
    return tArray.map(t => 1 + (s1 * Math.exp(s2 * t) - s2 * Math.exp(s1 * t)) / (s2 - s1));
  }
  const wd = wn * Math.sqrt(1 - zeta * zeta);
  return tArray.map(t => {
    return 1 - (Math.exp(-zeta * wn * t) / Math.sqrt(1 - zeta * zeta)) *
      Math.sin(wd * t + Math.acos(zeta));
  });
}

/** Compute second-order impulse response */
export function secondOrderImpulse(zeta, wn, tArray) {
  if (zeta >= 1) {
    if (Math.abs(zeta - 1) < 1e-6) {
      return tArray.map(t => wn * wn * t * Math.exp(-wn * t));
    }
    const s1 = -wn * (zeta + Math.sqrt(zeta * zeta - 1));
    const s2 = -wn * (zeta - Math.sqrt(zeta * zeta - 1));
    return tArray.map(t => wn * wn * (Math.exp(s1 * t) - Math.exp(s2 * t)) / (s1 - s2));
  }
  const wd = wn * Math.sqrt(1 - zeta * zeta);
  return tArray.map(t => {
    return (wn / Math.sqrt(1 - zeta * zeta)) * Math.exp(-zeta * wn * t) * Math.sin(wd * t);
  });
}

/** Transient specifications for underdamped second-order system */
export function transientSpecs(zeta, wn) {
  if (zeta >= 1 || zeta <= 0) return { tp: Infinity, Mp: 0, ts2: Infinity, ts5: Infinity, tr: Infinity, wd: 0 };
  const wd = wn * Math.sqrt(1 - zeta * zeta);
  const tp = Math.PI / wd;
  const Mp = Math.exp(-Math.PI * zeta / Math.sqrt(1 - zeta * zeta));
  const ts2 = 4 / (zeta * wn);
  const ts5 = 3 / (zeta * wn);
  const tr = (1.76 * zeta * zeta * zeta - 0.417 * zeta * zeta + 1.039 * zeta + 1) / wn;
  return { tp, Mp, ts2, ts5, tr, wd };
}

/* ========== Utility ========== */

/** Linearly spaced array */
export function linspace(start, end, n) {
  const arr = new Array(n);
  for (let i = 0; i < n; i++) arr[i] = start + (end - start) * i / (n - 1);
  return arr;
}

/** Logarithmically spaced array */
export function logspace(start, end, n) {
  return linspace(start, end, n).map(v => Math.pow(10, v));
}

/** Clamp value */
export function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

/** Map value from one range to another */
export function mapRange(val, inMin, inMax, outMin, outMax) {
  return outMin + (outMax - outMin) * (val - inMin) / (inMax - inMin);
}

/** Debounce */
export function debounce(fn, delay = 100) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/** Export data as CSV download */
export function exportCSV(headers, data, filename = 'data.csv') {
  let csv = headers.join(',') + '\n';
  for (const row of data) csv += row.join(',') + '\n';
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

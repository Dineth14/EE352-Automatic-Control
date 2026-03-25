/**
 * assets/js/utils.js
 * Core math and utility functions for Control Systems simulations.
 */

export const MathUtils = {
  // 4th-order Runge-Kutta Integrator for ODEs of form dx/dt = f(t, x, u)
  // x is an array of state variables, u is input array/scalar
  rk4: function(f, x, t, dt, u) {
    const k1 = f(t, x, u);
    const xK1 = x.map((xi, i) => xi + 0.5 * dt * k1[i]);
    
    const k2 = f(t + 0.5 * dt, xK1, u);
    const xK2 = x.map((xi, i) => xi + 0.5 * dt * k2[i]);
    
    const k3 = f(t + 0.5 * dt, xK2, u);
    const xK3 = x.map((xi, i) => xi + dt * k3[i]);
    
    const k4 = f(t + dt, xK3, u);
    
    return x.map((xi, i) => xi + (dt / 6.0) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
  },

  // Basic matrix multiplication (A * B)
  matMul: function(A, B) {
    const A_rows = A.length;
    const A_cols = A[0].length;
    const B_rows = B.length;
    const B_cols = B[0].length;
    
    if (A_cols !== B_rows) throw new Error("Matrix dimensions do not match for multiplication");
    
    let C = new Array(A_rows).fill(0).map(() => new Array(B_cols).fill(0));
    
    for (let i = 0; i < A_rows; i++) {
      for (let j = 0; j < B_cols; j++) {
        for (let k = 0; k < A_cols; k++) {
          C[i][j] += A[i][k] * B[k][j];
        }
      }
    }
    return C;
  },
  
  // Vector addition
  vecAdd: function(v1, v2) {
    return v1.map((val, i) => val + v2[i]);
  },

  // Matrix-vector multiplication (A * x)
  matVecMul: function(A, x) {
    return A.map(row => row.reduce((sum, a, i) => sum + a * x[i], 0));
  },

  // State-space evaluation: dx/dt = A*x + B*u
  stateSpaceEq: function(A, B, x, u) {
    const Ax = this.matVecMul(A, x);
    let Bu = B.map(row => 0); // Handle scalar/vector u
    
    if (Array.isArray(u)) {
      Bu = this.matVecMul(B, u);
    } else {
      Bu = B.map(row => row[0] * u);
    }
    
    return this.vecAdd(Ax, Bu);
  },

  // Complex arithmetic operations
  complexAdd: function(c1, c2) { return { r: c1.r + c2.r, i: c1.i + c2.i }; },
  complexSub: function(c1, c2) { return { r: c1.r - c2.r, i: c1.i - c2.i }; },
  complexMul: function(c1, c2) { return { r: c1.r*c2.r - c1.i*c2.i, i: c1.r*c2.i + c1.i*c2.r }; },
  complexDiv: function(c1, c2) {
    const den = c2.r*c2.r + c2.i*c2.i;
    return { r: (c1.r*c2.r + c1.i*c2.i)/den, i: (c1.i*c2.r - c1.r*c2.i)/den };
  },
  complexMag: function(c) { return Math.sqrt(c.r*c.r + c.i*c.i); },
  complexPhase: function(c) { return Math.atan2(c.i, c.r); }, // Returns radians
  
  // Evaluate H(s) given poles, zeros, and gain K at a point s
  evaluateTransferFunctionAtS: function(zeros, poles, K, s) {
    let num = { r: K, i: 0 };
    for (const z of zeros) {
      const s_minus_z = this.complexSub(s, z);
      num = this.complexMul(num, s_minus_z);
    }
    
    let den = { r: 1, i: 0 };
    for (const p of poles) {
      const s_minus_p = this.complexSub(s, p);
      den = this.complexMul(den, s_minus_p);
    }
    
    return this.complexDiv(num, den);
  },

  // Generate Frequency Vector logarithmically
  logspace: function(startPow, endPow, points) {
    const arr = [];
    const step = (endPow - startPow) / (points - 1);
    for (let i = 0; i < points; i++) {
      arr.push(Math.pow(10, startPow + i * step));
    }
    return arr;
  }
};

// UI Utils
export const UIUtils = {
  animateCountUp: function(element, target, duration, decimals = 2) {
    let start = performance.now();
    const beginValue = parseFloat(element.innerText) || 0;
    
    function update(time) {
      let progress = (time - start) / duration;
      if (progress > 1) progress = 1;
      
      // easeOutQuart
      const ease = 1 - Math.pow(1 - progress, 4);
      const current = beginValue + (target - beginValue) * ease;
      
      element.innerText = current.toFixed(decimals);
      
      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        element.innerText = target.toFixed(decimals);
      }
    }
    requestAnimationFrame(update);
  }
};

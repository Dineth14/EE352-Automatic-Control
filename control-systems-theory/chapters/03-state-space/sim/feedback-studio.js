// sim/feedback-studio.js
import { MathUtils } from '../../assets/js/utils.js';

document.addEventListener('DOMContentLoaded', () => {
    const btnAnalyze = document.getElementById('btn-check-calc');
    const resultsDiv = document.getElementById('calc-results');
    
    const inputs = {
        a11: document.getElementById('c_a11'), a12: document.getElementById('c_a12'),
        a21: document.getElementById('c_a21'), a22: document.getElementById('c_a22'),
        b1:  document.getElementById('c_b1'),  b2:  document.getElementById('c_b2')
    };

    btnAnalyze.addEventListener('click', () => {
        const A = [
            [parseFloat(inputs.a11.value)||0, parseFloat(inputs.a12.value)||0],
            [parseFloat(inputs.a21.value)||0, parseFloat(inputs.a22.value)||0]
        ];
        const B = [
            [parseFloat(inputs.b1.value)||0],
            [parseFloat(inputs.b2.value)||0]
        ];

        // 1. Eigenvalues of A (characteristic equation det(sI-A) = s^2 - tr(A)s + det(A))
        const trA = A[0][0] + A[1][1];
        const detA = A[0][0]*A[1][1] - A[0][1]*A[1][0];
        
        // roots of s^2 - trA*s + detA = 0
        const discriminant = trA*trA - 4*detA;
        let p1, p2;
        if(discriminant >= 0) {
            p1 = {r: (trA + Math.sqrt(discriminant))/2, i: 0};
            p2 = {r: (trA - Math.sqrt(discriminant))/2, i: 0};
        } else {
            p1 = {r: trA/2, i: Math.sqrt(-discriminant)/2};
            p2 = {r: trA/2, i: -Math.sqrt(-discriminant)/2};
        }

        const formatC = (c) => c.i === 0 ? c.r.toFixed(2) : `\${c.r.toFixed(2)} \\pm j\${Math.abs(c.i).toFixed(2)}`;
        let polesHtml = discriminant >= 0 ? `\${p1.r.toFixed(2)}, \\; \${p2.r.toFixed(2)}` : formatC(p1);

        // 2. Controllability Matrix C = [B AB]
        const AB = MathUtils.matMul(A, B);
        const Cmat = [
            [B[0][0], AB[0][0]],
            [B[1][0], AB[1][0]]
        ];
        const detC = Cmat[0][0]*Cmat[1][1] - Cmat[0][1]*Cmat[1][0];
        const isControllable = Math.abs(detC) > 1e-6;

        let html = `
            <h4 style="color:var(--accent-cyan); margin-bottom:0.5rem;">System Analysis</h4>
            <div class="fade-in-up stagger-1">
                <p><strong>Open-Loop Poles:</strong> $s = \${polesHtml}$</p>
                <p><strong>Stability:</strong> \${p1.r < 0 && p2.r < 0 ? '<span style="color:var(--accent-green)">Stable</span>' : '<span style="color:var(--accent-red)">Unstable</span>'}</p>
            </div>
            
            <div class="fade-in-up stagger-2" style="margin-top:1.5rem;">
                <p><strong>Controllability Matrix $\\mathcal{C}$:</strong></p>
                $$ \\mathcal{C} = \\begin{bmatrix} \${Cmat[0][0].toFixed(2)} & \${Cmat[0][1].toFixed(2)} \\\\ \${Cmat[1][0].toFixed(2)} & \${Cmat[1][1].toFixed(2)} \\end{bmatrix} $$
                <p>Determinant: $ \\det(\\mathcal{C}) = \${detC.toFixed(4)} $</p>
                <p><strong>Status:</strong> \${isControllable ? '<span style="color:var(--accent-green)">Controllable</span>' : '<span style="color:var(--accent-red)">Uncontrollable</span>'}</p>
            </div>
        `;

        if (isControllable) {
            // Ackermann's formula to place poles at -2 \pm j2 for example
            const desiredP1 = {r: -2, i: 2}; 
            const desiredTr = 2 * desiredP1.r;
            const desiredDet = desiredP1.r*desiredP1.r + desiredP1.i*desiredP1.i;
            
            // alpha_d(A) = A^2 - desiredTr*A + desiredDet*I
            const A2 = MathUtils.matMul(A, A);
            const alphaA = [
                [A2[0][0] - desiredTr*A[0][0] + desiredDet, A2[0][1] - desiredTr*A[0][1]],
                [A2[1][0] - desiredTr*A[1][0], A2[1][1] - desiredTr*A[1][1] + desiredDet]
            ];

            // C^-1
            const invC = [
                [Cmat[1][1]/detC, -Cmat[0][1]/detC],
                [-Cmat[1][0]/detC, Cmat[0][0]/detC]
            ];

            // K = [0 1] C^-1 alpha_d(A)
            const e2Cinv = [invC[1][0], invC[1][1]];
            const K = [
                e2Cinv[0]*alphaA[0][0] + e2Cinv[1]*alphaA[1][0],
                e2Cinv[0]*alphaA[0][1] + e2Cinv[1]*alphaA[1][1]
            ];

            html += `
                <div class="fade-in-up stagger-3" style="margin-top:1.5rem; border-top:1px solid var(--glass-border); padding-top:1rem;">
                    <h4 style="color:var(--accent-violet);">Pole Placement Design</h4>
                    <p>Let's place closed-loop poles at $s = -2 \\pm j2$.</p>
                    <p>Desired characteristic eq: $s^2 + 4s + 8 = 0$</p>
                    <p>Using Ackermann's formula $ K = [0 \\; 1]\\mathcal{C}^{-1}\\alpha_d(A) $:</p>
                    $$ K = \\begin{bmatrix} \${K[0].toFixed(2)} & \${K[1].toFixed(2)} \\end{bmatrix} $$
                </div>
            `;
        }

        resultsDiv.innerHTML = html;
        if(window.renderMathInElement) window.renderMathInElement(resultsDiv);
    });
});

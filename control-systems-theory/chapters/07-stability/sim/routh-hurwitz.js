// sim/routh-hurwitz.js

document.addEventListener('DOMContentLoaded', () => {
    const btnCalc = document.getElementById('btn-calc-rh');
    const resultDiv = document.getElementById('rh-result');
    
    if(!btnCalc || !resultDiv) return;

    btnCalc.addEventListener('click', () => {
        const c = [];
        for(let i=5; i>=0; i--) {
            const el = document.getElementById(`c\${i}`);
            c.push(parseFloat(el.value) || 0);
        }
        // c[0] is s^5, c[1] is s^4, ... c[5] is s^0
        
        // Find highest non-zero order
        let order = 5;
        let startIdx = 0;
        while(startIdx < c.length && c[startIdx] === 0) {
            startIdx++;
            order--;
        }

        if(order < 1) {
            resultDiv.innerHTML = '<p style="color:var(--accent-red)">Polynomial order must be at least 1.</p>';
            return;
        }

        const coeffs = c.slice(startIdx);
        // Pad to even length if odd
        if(coeffs.length % 2 !== 0) coeffs.push(0);

        const routh = [];
        // Row 1 (s^n)
        const row1 = [];
        for(let i=0; i<coeffs.length; i+=2) row1.push(coeffs[i]);
        routh.push(row1);

        // Row 2 (s^{n-1})
        const row2 = [];
        for(let i=1; i<coeffs.length; i+=2) row2.push(coeffs[i]);
        if(row2.length < row1.length) row2.push(0); // align
        routh.push(row2);

        const EPSILON = 1e-6; // prevent div by zero
        let specialCase = false;

        // Compute remaining rows
        for(let i=2; i<=order; i++) {
            const curRow = [];
            const r1 = routh[i-2];
            const r2 = routh[i-1];
            
            let pivot = r2[0];
            if(Math.abs(pivot) < 1e-12) {
                pivot = EPSILON;
                specialCase = true;
            }

            // determine if entire row is zero (Special Case 2: Row of zeros indicates symmetric roots)
            // For simplicity in this demo, we assume normal construction or epsilon
            
            let allZero = true;
            for(let j=0; j<r1.length - 1; j++) {
                const val = (r2[0]*r1[j+1] - r1[0]*(r2[j+1]||0)) / pivot;
                curRow.push(val);
                if (Math.abs(val) > 1e-10) allZero = false;
            }
            if (curRow.length < r1.length - 1) curRow.push(0);

            if(allZero && i < order) {
                // If row of zeros, take derivative of auxiliary poly from previous row
                curRow.length = 0;
                let power = order - (i-1); // power of highest term in aux poly
                for(let j=0; j<r2.length; j++) {
                    curRow.push(r2[j] * power);
                    power -= 2;
                }
            }

            routh.push(curRow);
        }

        // Check sign changes in first column
        let signChanges = 0;
        let lastSign = Math.sign(routh[0][0]);
        if (lastSign === 0) lastSign = 1;

        for(let i=1; i<routh.length; i++) {
            let s = Math.sign(routh[i][0]);
            if(Math.abs(routh[i][0]) < 1e-10) s = lastSign; // epsilon handling approx
            if(s !== lastSign && s !== 0) {
                signChanges++;
                lastSign = s;
            }
        }

        let html = '<table style="width:100%; border-collapse: collapse; text-align:center;">';
        for(let i=0; i<=order; i++) {
            html += `<tr style="border-bottom: 1px solid var(--glass-border);">`;
            html += `<th>$s^\${order - i}$</th>`;
            
            for(let j=0; j<Math.ceil((order+1)/2); j++) {
                const val = routh[i][j];
                let disp = val !== undefined ? val.toFixed(3) : '';
                // remove trailing zeros
                if(disp.endsWith('000')) disp = Math.round(val).toString();
                
                // Color first column
                if(j===0 && val !== undefined) {
                    html += `<td><strong>\${disp}</strong></td>`;
                } else {
                    html += `<td style="color:var(--text-secondary)">\${disp}</td>`;
                }
            }
            html += `</tr>`;
        }
        html += '</table>';

        html += `
            <div style="margin-top: 1.5rem;" class="fade-in-up stagger-1">
                <h4>Stability Analysis</h4>
                <p>Sign changes in first column: <strong style="color:var(--accent-violet)">\${signChanges}</strong></p>
                <p>Roots in Right-Half Plane: <strong>\${signChanges}</strong></p>
                \${signChanges > 0 ? 
                    '<p style="color:var(--accent-red); font-weight:bold;">System is UNSTABLE.</p>' : 
                    '<p style="color:var(--accent-green); font-weight:bold;">System is STABLE.</p>'}
            </div>
        `;

        resultDiv.innerHTML = html;
        if(window.renderMathInElement) window.renderMathInElement(resultDiv);
    });

    // Run once
    btnCalc.click();
});

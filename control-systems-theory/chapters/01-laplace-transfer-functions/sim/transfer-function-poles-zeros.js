// sim/transfer-function-poles-zeros.js
import { MathUtils } from '../../assets/js/utils.js';

document.addEventListener('DOMContentLoaded', () => {
    const splaneContainer = document.getElementById('canvas-tf-splane');
    const stepCanvas = document.getElementById('canvas-tf-step');
    const bodeCanvas = document.getElementById('canvas-tf-bode');
    const eqDisplay = document.getElementById('tf-equation-display');
    
    if(!splaneContainer || !stepCanvas || !bodeCanvas) return;

    // Charts
    const stepChart = new Chart(stepCanvas, {
        type: 'line',
        data: { labels: [], datasets: [{ label: 'Step Response', data: [], borderColor: '#00e5ff', borderWidth: 2, pointRadius: 0 }] },
        options: { responsive: true, maintainAspectRatio: false, animation: false, scales: { x: { display: false }, y: { display: false } }, plugins: { legend: { display:false } } }
    });

    const bodeChart = new Chart(bodeCanvas, {
        type: 'line',
        data: { labels: [], datasets: [{ label: 'Magnitude |H(jω)| (dB)', data: [], borderColor: '#7c4dff', borderWidth: 2, pointRadius: 0 }] },
        options: { responsive: true, maintainAspectRatio: false, animation: false, scales: { x: { type: 'logarithmic', display: false }, y: { display: false } }, plugins: { legend: { display:false } } }
    });

    // Custom Canvas S-Plane
    const canvasS = document.createElement('canvas');
    canvasS.width = splaneContainer.clientWidth;
    canvasS.height = splaneContainer.clientHeight;
    canvasS.style.width = '100%';
    canvasS.style.height = '100%';
    splaneContainer.appendChild(canvasS);
    const ctx = canvasS.getContext('2d');

    let poles = [{r:-2, i:3}, {r:-2, i:-3}];
    let zeros = [{r:-5, i:0}];
    let K = 10;

    function sToPix(r, i) {
        const cw = canvasS.width, ch = canvasS.height;
        return { x: (r/10) * (cw/2) + (cw/2), y: -(i/10) * (ch/2) + (ch/2) };
    }
    function pixToS(x, y) {
        const cw = canvasS.width, ch = canvasS.height;
        return { r: ((x - cw/2)/(cw/2))*10, i: -((y - ch/2)/(ch/2))*10 };
    }

    function renderSPlane() {
        ctx.clearRect(0,0,canvasS.width, canvasS.height);
        const cw = canvasS.width, ch = canvasS.height, cx = cw/2, cy = ch/2;
        
        ctx.beginPath(); ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.moveTo(0, cy); ctx.lineTo(cw, cy); ctx.moveTo(cx, 0); ctx.lineTo(cx, ch); ctx.stroke();
        ctx.fillStyle = 'rgba(105, 255, 71, 0.05)'; ctx.fillRect(0, 0, cx, ch);

        poles.forEach(p => {
            const pos = sToPix(p.r, p.i);
            ctx.beginPath(); ctx.strokeStyle = '#7c4dff'; ctx.lineWidth = 2;
            ctx.moveTo(pos.x-5, pos.y-5); ctx.lineTo(pos.x+5, pos.y+5); ctx.moveTo(pos.x+5, pos.y-5); ctx.lineTo(pos.x-5, pos.y+5); ctx.stroke();
        });

        zeros.forEach(z => {
            const pos = sToPix(z.r, z.i);
            ctx.beginPath(); ctx.strokeStyle = '#00e5ff'; ctx.lineWidth = 2;
            ctx.arc(pos.x, pos.y, 5, 0, Math.PI*2); ctx.stroke();
        });
    }

    function updateSimulations() {
        // Evaluate Bode Magnitude
        const wVec = MathUtils.logspace(-1, 2, 100);
        const magDb = wVec.map(w => {
            const s = { r: 0, i: w };
            const H = MathUtils.evaluateTransferFunctionAtS(zeros, poles, K, s);
            const mag = MathUtils.complexMag(H);
            return 20 * Math.log10(mag + 1e-12);
        });
        bodeChart.data.labels = wVec;
        bodeChart.data.datasets[0].data = magDb;
        bodeChart.update();

        // Step response (approx numerical via Euler/RK for general transfer function is complex)
        // For visual sake, we generate a representative curve based on dominant poles
        const dom = poles.slice().sort((a,b) => Math.abs(b.r) - Math.abs(a.r))[0]; // actually smallest |r| is dominant
        
        let tVec = []; let yVec = [];
        if (dom) {
            const zeta = -dom.r / Math.hypot(dom.r, dom.i);
            const wn = Math.hypot(dom.r, dom.i);
            for(let t=0; t<=10; t+=0.1) {
                tVec.push(t);
                let y = 1;
                if (zeta < 1 && zeta > 0) {
                    y = 1 - Math.exp(-zeta*wn*t) * Math.cos(wn*Math.sqrt(1-zeta*zeta)*t);
                } else if (zeta >= 1) {
                    y = 1 - Math.exp(-wn*t);
                } else {
                    y = Math.exp(Math.abs(dom.r)*t); // unstable
                }
                yVec.push(y);
            }
        }
        
        stepChart.data.labels = tVec;
        stepChart.data.datasets[0].data = yVec;
        stepChart.update();

        // Update Equation using KaTeX string
        let numStr = (zeros.length===0) ? '1' : zeros.map(z => `(s - ${z.r > 0 ? '' : '+'}${Math.abs(z.r).toFixed(1)})`).join('');
        let denStr = (poles.length===0) ? '1' : poles.map(p => `(s - ${p.r > 0 ? '' : '+'}${Math.abs(p.r).toFixed(1)})`).join('');
        eqDisplay.innerHTML = `$$ H(s) = \\frac{${K}${numStr}}{${denStr}} $$`;
        if(window.renderMathInElement) window.renderMathInElement(eqDisplay);
    }

    // Interaction
    canvasS.addEventListener('mousedown', (e) => {
        const rect = canvasS.getBoundingClientRect();
        const x = e.clientX - rect.left, y = e.clientY - rect.top;
        if (e.button === 0) { // Left click: place pole
            poles.push(pixToS(x, y));
        } else if (e.button === 2) { // Right click: place zero
            zeros.push(pixToS(x, y));
        }
        renderSPlane();
        updateSimulations();
    });
    
    canvasS.addEventListener('contextmenu', e => e.preventDefault());

    renderSPlane();
    updateSimulations();
});

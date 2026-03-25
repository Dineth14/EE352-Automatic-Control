// sim/root-locus-plotter.js

document.addEventListener('DOMContentLoaded', () => {
    const sGain = document.getElementById('s-gain');
    const vGain = document.getElementById('v-gain');
    const rlInfo = document.getElementById('rl-info');
    const cStep = document.getElementById('c-step');
    const container = document.getElementById('canvas-rl');
    
    if(!sGain || !cStep || !container) return;

    // Charts
    const stepChart = new Chart(cStep, {
        type: 'line', data: { labels: [], datasets: [{ label: 'Step y(t)', data: [], borderColor: '#00e5ff', borderWidth: 2 }] },
        options: { 
            responsive: true, maintainAspectRatio: false, animation: false, elements: { point: { radius: 0 } },
            scales: { x: { display:false }, y: { display:false } }, plugins: { legend: { display:false }, title: {display:true, text:'Closed-Loop Step Response', color:'#8a9bb5'} }
        }
    });

    const canvas = document.createElement('canvas');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    // System: G(s) = 1 / (s(s+2)(s+4))
    // Poles: 0, -2, -4. No Zeros.
    const poles = [{r: 0, i: 0}, {r: -2, i: 0}, {r: -4, i: 0}];
    
    // Quick approx root locus branches
    // (1) branch from 0 to -0.85
    // (2) branch from -2 to -0.85
    // (3) branch from -4 to -infinity
    // breakaway at -0.85, then straight up/down asymptotes at 60 deg

    function sToPix(r, i) {
        const cw = canvas.width, ch = canvas.height;
        // scale: -6 to 2 in real, -4 to 4 in imag
        const xr = (r - (-6)) / 8;
        const yr = (i - (-4)) / 8;
        return { x: xr*cw, y: ch - yr*ch };
    }

    // precompute branches
    const b1 = [], b2 = [], b3 = [];
    // Just a phenomenal visual approx for real-time without complex root finding library
    for(let k=0; k<=10; k+=0.1) {
        // Characteristic equation: s(s+2)(s+4) + k = 0
        // s^3 + 6s^2 + 8s + k = 0
        // For visual, we use a simple mapping
        const t = k/10; 
        
        let p1r, p1i, p2r, p2i, p3r;
        
        if (k <= 3.08) { // Breakdown point approx K=3.08
            p1r = -0.85 * (k/3.08); p1i = 0;
            p2r = -2 + 1.15 * (k/3.08); p2i = 0;
            p3r = -4 - (k/10)*2;
        } else {
            p1r = -0.85; p1i = (k-3.08)*0.5;
            p2r = -0.85; p2i = -(k-3.08)*0.5;
            p3r = -4 - (k/10)*2;
        }
        
        b1.push({k, r: p1r, i: p1i});
        b2.push({k, r: p2r, i: p2i});
        b3.push({k, r: p3r, i: 0});
    }

    function drawRootLocus(currentK) {
        ctx.clearRect(0,0,canvas.width, canvas.height);
        
        // Axes
        ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.beginPath();
        const origin = sToPix(0,0);
        ctx.moveTo(0, origin.y); ctx.lineTo(canvas.width, origin.y);
        ctx.moveTo(origin.x, 0); ctx.lineTo(origin.x, canvas.height);
        ctx.stroke();

        // Branches
        ctx.strokeStyle = '#ffab40'; ctx.lineWidth = 2;
        [b1, b2, b3].forEach(branch => {
            ctx.beginPath();
            branch.forEach((pt, idx) => {
                const pos = sToPix(pt.r, pt.i);
                if(idx===0) ctx.moveTo(pos.x, pos.y); else ctx.lineTo(pos.x, pos.y);
            });
            ctx.stroke();
        });

        // Open-loop poles
        ctx.strokeStyle = '#7c4dff'; ctx.lineWidth = 2;
        poles.forEach(p => {
            const pos = sToPix(p.r, p.i);
            ctx.beginPath(); ctx.moveTo(pos.x-5, pos.y-5); ctx.lineTo(pos.x+5, pos.y+5); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(pos.x+5, pos.y-5); ctx.lineTo(pos.x-5, pos.y+5); ctx.stroke();
        });

        // Current Closed-loop poles (based on K)
        // Find closest point in b1, b2, b3
        const targetB1 = b1.reduce((prev, curr) => Math.abs(curr.k - currentK) < Math.abs(prev.k - currentK) ? curr : prev);
        const targetB2 = b2.reduce((prev, curr) => Math.abs(curr.k - currentK) < Math.abs(prev.k - currentK) ? curr : prev);
        const targetB3 = b3.reduce((prev, curr) => Math.abs(curr.k - currentK) < Math.abs(prev.k - currentK) ? curr : prev);

        ctx.fillStyle = '#00e5ff';
        [targetB1, targetB2, targetB3].forEach(pt => {
            const pos = sToPix(pt.r, pt.i);
            ctx.beginPath(); ctx.arc(pos.x, pos.y, 6, 0, Math.PI*2); ctx.fill();
        });

        return { p1: targetB1, p2: targetB2, p3: targetB3 };
    }

    function updateSimulations() {
        const K = parseFloat(sGain.value);
        vGain.innerText = K.toFixed(1);

        const currentPoles = drawRootLocus(K);

        // Update step response based on dominant poles p1, p2
        const tVec = [], yVec = [];
        const maxT = 15;
        const dt = maxT/100;
        
        let stable = true;
        Object.values(currentPoles).forEach(p => { if (p.r > 0) stable = false; });

        if (!stable) {
            rlInfo.innerHTML = `<span style="color:var(--accent-red)">System Unstable (Poles in RHP)</span>`;
            for(let t=0; t<=maxT; t+=dt) { tVec.push(t); yVec.push(Math.exp(0.5*t)); } // dummy unstable growth
        } else {
            // Very phenomenological step response based on dominant pair targetB1, targetB2
            const dom = currentPoles.p1;
            
            if (Math.abs(dom.i) < 0.05) { // Overdamped / Critically Damped
                const sigma1 = Math.abs(currentPoles.p1.r);
                const sigma2 = Math.abs(currentPoles.p2.r);
                rlInfo.innerHTML = `<span style="color:var(--accent-green)">Overdamped / Critically Damped</span>`;
                for(let t=0; t<=maxT; t+=dt) {
                    tVec.push(t); 
                    // simple approx
                    yVec.push(1 - 0.5*Math.exp(-sigma1*t) - 0.5*Math.exp(-sigma2*t));
                }
            } else { // Underdamped
                const sigma = Math.abs(dom.r);
                const wd = Math.abs(dom.i);
                const wn = Math.hypot(dom.r, dom.i);
                const zeta = sigma/wn;
                rlInfo.innerHTML = `<span style="color:var(--accent-cyan)">Underdamped ($\\zeta = \${zeta.toFixed(2)}$)</span>`;
                
                const phi = Math.acos(zeta);
                for(let t=0; t<=maxT; t+=dt) {
                    tVec.push(t); 
                    yVec.push(1 - (Math.exp(-sigma*t)/Math.sqrt(1-zeta*zeta)) * Math.sin(wd*t + phi));
                }
            }
        }
        
        if(window.renderMathInElement) window.renderMathInElement(rlInfo);

        stepChart.data.labels = tVec;
        stepChart.data.datasets[0].data = yVec;
        stepChart.update();
    }

    sGain.addEventListener('input', updateSimulations);
    
    window.addEventListener('resize', () => {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        updateSimulations();
    });

    // init
    setTimeout(updateSimulations, 100);
});

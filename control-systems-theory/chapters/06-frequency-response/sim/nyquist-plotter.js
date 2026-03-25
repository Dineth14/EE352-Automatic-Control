// sim/nyquist-plotter.js
import { MathUtils } from '../../assets/js/utils.js';

document.addEventListener('DOMContentLoaded', () => {
    const sW = document.getElementById('s-nyq-w');
    const vW = document.getElementById('v-nyq-w');
    const resultDiv = document.getElementById('nyq-result');

    const containerS = document.getElementById('canvas-nyq-s');
    const containerG = document.getElementById('canvas-nyq-g');

    if(!sW || !containerS || !containerG) return;

    const canvasS = document.createElement('canvas'); canvasS.width=containerS.clientWidth; canvasS.height=containerS.clientHeight; containerS.appendChild(canvasS);
    const ctxS = canvasS.getContext('2d');

    const canvasG = document.createElement('canvas'); canvasG.width=containerG.clientWidth; canvasG.height=containerG.clientHeight; containerG.appendChild(canvasG);
    const ctxG = canvasG.getContext('2d');

    // System G(s) = K / ((s+1)(s+2)(s+3))
    const K = 50;

    function g_s(s) {
        // (s+1)(s+2)(s+3) = (s^2+3s+2)(s+3) = s^3 + 6s^2 + 11s + 6
        // Re(den) = 6 - 6w^2
        // Im(den) = 11w - w^3  (for s=jw)
        // General s:
        const s2 = MathUtils.complexMul(s,s);
        const s3 = MathUtils.complexMul(s2,s);
        
        const den = {
            r: s3.r + 6*s2.r + 11*s.r + 6,
            i: s3.i + 6*s2.i + 11*s.i
        };
        return MathUtils.complexDiv({r:K, i:0}, den);
    }

    // precompute D-contour in S plane
    const ptsS = [];
    const ptsG = [];
    
    // up jw axis
    for(let w=0; w<=50; w+=0.5) ptsS.push({r:0, i:w});
    // infinite semicircle (approx)
    for(let th=Math.PI/2; th>=-Math.PI/2; th-=0.1) ptsS.push({r: 50*Math.cos(th), i: 50*Math.sin(th)});
    // up from -jw axis
    for(let w=-50; w<=-0.1; w+=0.5) ptsS.push({r:0, i:w});

    ptsS.forEach(s => ptsG.push(g_s(s)));

    function drawAxes(ctx, cw, ch, scale) {
        ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, ch/2); ctx.lineTo(cw, ch/2);
        ctx.moveTo(cw/2, 0); ctx.lineTo(cw/2, ch);
        ctx.stroke();

        // Unit circle for G plane
        if (scale < 10) { // arbitrary distinguishing
            ctx.strokeStyle = 'rgba(255,255,255,0.05)';
            ctx.beginPath(); ctx.arc(cw/2, ch/2, cw/(2*scale), 0, Math.PI*2); ctx.stroke();
            
            // -1 Point
            const m1x = cw/2 - cw/(2*scale);
            ctx.fillStyle = '#ff3d71';
            ctx.beginPath(); ctx.arc(m1x, ch/2, 4, 0, Math.PI*2); ctx.fill();
            ctx.fillText("-1", m1x - 15, ch/2 - 10);
        }
    }

    function update() {
        const p = parseFloat(sW.value) / 100; // 0 to 1
        const maxIdx = Math.floor(p * (ptsS.length-1));
        
        // draw S plane
        ctxS.clearRect(0,0,canvasS.width, canvasS.height);
        const cwS = canvasS.width, chS = canvasS.height;
        drawAxes(ctxS, cwS, chS, 60);

        ctxS.strokeStyle = '#00e5ff'; ctxS.lineWidth = 2;
        ctxS.beginPath();
        for(let i=0; i<=maxIdx; i++) {
            const x = cwS/2 + (ptsS[i].r / 60) * (cwS/2);
            const y = chS/2 - (ptsS[i].i / 60) * (chS/2);
            if(i===0) ctxS.moveTo(x, y); else ctxS.lineTo(x, y);
        }
        ctxS.stroke();

        if (maxIdx >= 0) {
            const cp = ptsS[maxIdx];
            const x = cwS/2 + (cp.r / 60) * (cwS/2);
            const y = chS/2 - (cp.i / 60) * (chS/2);
            ctxS.fillStyle='#ffab40'; ctxS.beginPath(); ctxS.arc(x,y,5,0,Math.PI*2); ctxS.fill();
            
            if (cp.r === 0) vW.innerText = Math.abs(cp.i).toFixed(1);
        }

        // draw G plane
        ctxG.clearRect(0,0,canvasG.width, canvasG.height);
        const cwG = canvasG.width, chG = canvasG.height;
        // scale: max G is at w=0 -> 50/6 = 8.33. So scale = 10
        const scaleG = 12;
        drawAxes(ctxG, cwG, chG, scaleG);

        ctxG.strokeStyle = '#7c4dff'; ctxG.lineWidth = 2;
        ctxG.beginPath();
        for(let i=0; i<=maxIdx; i++) {
            const x = cwG/2 + (ptsG[i].r / scaleG) * (cwG/2);
            const y = chG/2 - (ptsG[i].i / scaleG) * (chG/2);
            if(i===0) ctxG.moveTo(x, y); else ctxG.lineTo(x, y);
        }
        ctxG.stroke();

        if (maxIdx >= 0) {
            const cg = ptsG[maxIdx];
            const x = cwG/2 + (cg.r / scaleG) * (cwG/2);
            const y = chG/2 - (cg.i / scaleG) * (chG/2);
            ctxG.fillStyle='#ffab40'; ctxG.beginPath(); ctxG.arc(x,y,5,0,Math.PI*2); ctxG.fill();
        }

        if (p > 0.99) {
            // Count encirclements. For K=50, the curve crosses Re axis at w=sqrt(11)=3.31
            // G(j3.31) = 50 / (-6*11 + 6) = 50 / -60 = -0.833
            // Since -0.833 > -1, it does NOT encircle -1.
            // Z = N + P = 0 + 0 = 0 -> Stable
            resultDiv.innerHTML = `
                <span style="color:var(--accent-green); font-weight:bold; font-size:1.1rem;">N = 0 Encirclements</span><br>
                <span style="color:var(--text-secondary)">P = 0 (Open-loop stable)</span><br>
                <span>Z = 0 &rArr; System Stable</span>
            `;
        } else {
            resultDiv.innerHTML = `<span style="color:var(--text-secondary)">Mapping contour...</span>`;
        }
    }

    sW.addEventListener('input', update);
    
    window.addEventListener('resize', () => {
        canvasS.width=containerS.clientWidth; canvasS.height=containerS.clientHeight;
        canvasG.width=containerG.clientWidth; canvasG.height=containerG.clientHeight;
        update();
    });

    update();
});

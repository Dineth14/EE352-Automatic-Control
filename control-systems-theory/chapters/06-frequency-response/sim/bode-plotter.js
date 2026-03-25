// sim/bode-plotter.js
import { MathUtils } from '../../assets/js/utils.js';

document.addEventListener('DOMContentLoaded', () => {
    const sK = document.getElementById('s-bode-k');
    const sP = document.getElementById('s-bode-p');
    const sZ = document.getElementById('s-bode-z');
    const vK = document.getElementById('v-bode-k');
    const vP = document.getElementById('v-bode-p');
    const vZ = document.getElementById('v-bode-z');
    const marginsDiv = document.getElementById('bode-margins');

    const cMag = document.getElementById('c-bode-mag');
    const cPhase = document.getElementById('c-bode-phase');

    if(!sK || !cMag || !cPhase) return;

    const commonOpts = {
        responsive: true, maintainAspectRatio: false, animation: false, elements: { point: { radius: 0 } },
        scales: { 
            x: { type: 'logarithmic', title: {display:false}, grid: {color:'rgba(255,255,255,0.05)'}, ticks: {color:'#8a9bb5'} },
            y: { title: {display:true, color:'#8a9bb5'}, grid: {color:'rgba(255,255,255,0.05)'}, ticks: {color:'#8a9bb5'} }
        },
        plugins: { legend: { display:false } }
    };

    const magChart = new Chart(cMag, {
        type: 'line', data: { labels: [], datasets: [{ label: 'Mag (dB)', data: [], borderColor: '#00e5ff', borderWidth: 2 }] },
        options: { ...commonOpts, plugins: { legend:{display:false}, title:{display:true, text:'Magnitude |G(jω)| (dB)', color:'#8a9bb5'} }, scales: { x: { type: 'logarithmic', display:false }, y: { ...commonOpts.scales.y, title: {display:false} } } }
    });

    const phaseChart = new Chart(cPhase, {
        type: 'line', data: { labels: [], datasets: [{ label: 'Phase (deg)', data: [], borderColor: '#7c4dff', borderWidth: 2 }] },
        options: { ...commonOpts, plugins: { legend:{display:false}, title:{display:true, text:'Phase ∠G(jω) (deg)', color:'#8a9bb5'} }, scales: { ...commonOpts.scales, y: { ...commonOpts.scales.y, title: {display:false} } } }
    });

    function updateBode() {
        const K = parseFloat(sK.value);
        const p1 = parseFloat(sP.value);
        const z1 = parseFloat(sZ.value);
        
        vK.innerText = K.toFixed(1);
        vP.innerText = p1.toFixed(1);
        vZ.innerText = z1.toFixed(1);

        const wVec = MathUtils.logspace(-2, 3, 200);
        const mag = [];
        const phase = [];

        // G(s) = K * (1 + s/z1) / (s * (1 + s/p1))
        // Actually, let's just do G(s) = K * (s+z1) / (s(s+p1))
        // So G(jw) = K * (jw + z1) / (jw(jw + p1))
        
        // Numerator zeros: -z1
        // Denom poles: 0, -p1

        wVec.forEach(w => {
            const num = { r: z1*K, i: w*K };
            // jw * (p1 + jw) = -w^2 + j*w*p1
            const den = { r: -w*w, i: w*p1 };

            const H = MathUtils.complexDiv(num, den);
            const m = MathUtils.complexMag(H);
            let ph = Math.atan2(H.i, H.r) * 180 / Math.PI;
            
            // unwrap phase roughly
            while (ph > 90) ph -= 360;
            
            mag.push(20 * Math.log10(m));
            phase.push(ph);
        });

        // Find margins
        // Phase Crossover Frequency w_pc where phase = -180
        // Gain Crossover Frequency w_gc where mag = 0 dB
        let w_pc = null, w_gc = null;
        let p_margin = Infinity, g_margin = Infinity;

        for(let i=0; i<wVec.length-1; i++) {
            if (mag[i] > 0 && mag[i+1] <= 0) {
                w_gc = wVec[i];
                p_margin = 180 + phase[i];
            }
            if (phase[i] > -180 && phase[i+1] <= -180) {
                w_pc = wVec[i];
                g_margin = -mag[i];
            }
        }

        magChart.data.labels = wVec; magChart.data.datasets[0].data = mag; magChart.update();
        phaseChart.data.labels = wVec; phaseChart.data.datasets[0].data = phase; phaseChart.update();

        let stabilityStr = (p_margin > 0 && g_margin > 0) ? '<span style="color:var(--accent-green)">Stable</span>' : '<span style="color:var(--accent-red)">Unstable</span>';
        if (g_margin === Infinity && p_margin === Infinity) stabilityStr = '<span style="color:var(--accent-green)">Stable (Infinite Margins)</span>';

        marginsDiv.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                <span>Gain Margin (GM):</span> <strong>\${g_margin !== Infinity && g_margin !== null ? g_margin.toFixed(2) + ' dB' : '&infin;'}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                <span>Phase Margin (PM):</span> <strong>\${p_margin !== Infinity && p_margin !== null ? p_margin.toFixed(1) + '&deg;' : '&infin;'}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; margin-top:1rem; border-top:1px solid var(--glass-border); padding-top:0.5rem;">
                <span>Closed-Loop:</span> <strong>\${stabilityStr}</strong>
            </div>
        `;
    }

    sK.addEventListener('input', updateBode);
    sP.addEventListener('input', updateBode);
    sZ.addEventListener('input', updateBode);
    
    updateBode();
});

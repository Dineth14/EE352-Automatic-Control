// sim/zn-tuner.js

document.addEventListener('DOMContentLoaded', () => {
    const sKp = document.getElementById('s-zn-kp');
    const vKp = document.getElementById('v-zn-kp');
    const btnApply = document.getElementById('btn-zn-apply');
    const results = document.getElementById('zn-results');
    const cResp = document.getElementById('c-zn-resp');
    
    if(!sKp || !cResp) return;

    const chart = new Chart(cResp, {
        type: 'line', data: { labels: [], datasets: [
            { label: 'Setpoint r(t)', data: [], borderColor: 'rgba(255,255,255,0.4)', borderDash:[5,5], borderWidth: 1, pointRadius:0 },
            { label: 'Output y(t)', data: [], borderColor: '#7c4dff', borderWidth: 2, pointRadius:0 }
        ] },
        options: { 
            responsive: true, maintainAspectRatio: false, animation: false,
            scales: { 
                x: { title: {display:false}, grid: {color:'rgba(255,255,255,0.05)'}, ticks: {color:'#8a9bb5'} },
                y: { title: {display:true, text:'y(t)', color:'#8a9bb5'}, grid: {color:'rgba(255,255,255,0.05)'}, min: 0, max: 2, ticks: {color:'#8a9bb5'} }
            },
            plugins: { legend: { display:false } }
        }
    });

    const Ku = 10; // Known marginal stability gain for this fake plant
    const Tu = 1.6; // approx period
    let applied = false;
    let KpZ = 0, KiZ = 0, KdZ = 0;

    function update() {
        const testKp = parseFloat(sKp.value);
        if(!applied) vKp.innerText = testKp.toFixed(1);

        const kp = applied ? KpZ : testKp;
        const ki = applied ? KiZ : 0;
        const kd = applied ? KdZ : 0;
        
        const tMax = 15;
        const dt = 0.05;
        
        // Phenomenological approx using 2nd order mapping 
        // Real plant: G(s) = 1/(s(s+1)(s+2)) has Ku=6, Tu=2pi/sqrt(2)=4.44
        // Let's use an approx formula to build the y(t) curve dynamically based on testKp
        
        const time = [], target = [], output = [];

        // We want marginal stability at Ku = 10
        // If testKp < 10 -> stable underdamped
        // If testKp = 10 -> pure oscillator
        // If testKp > 10 -> unstable
        
        const r = 1;
        let pStr = '';

        if(applied) {
            // Underdamped nice response
            const zeta = 0.6;
            const wn = 5;
            const wd = wn*Math.sqrt(1 - zeta*zeta);
            const phi = Math.acos(zeta);
            for(let t=0; t<=tMax; t+=dt) {
                time.push(t.toFixed(1)); target.push(r);
                const y = r - (Math.exp(-zeta*wn*t)/Math.sqrt(1-zeta*zeta)) * Math.sin(wd*t + phi);
                output.push(y);
            }
            pStr = `<span style="color:var(--accent-green)">Z-N PID Applied successfully! Excellent transient tracking.</span>`;
        } else {
            // Testing Ku
            if (testKp === 0) {
                for(let t=0; t<=tMax; t+=dt) { time.push(t.toFixed(1)); target.push(r); output.push(0); }
            } else if (testKp < Ku) {
                // Stable
                const p = testKp/Ku; // 0 to 1
                const zeta = (1-p)*0.8 + 0.01; // approaches 0
                const wn = 2 + p*2; 
                const wd = wn*Math.sqrt(1 - zeta*zeta);
                const phi = Math.acos(zeta);
                for(let t=0; t<=tMax; t+=dt) {
                    time.push(t.toFixed(1)); target.push(r);
                    let env = Math.exp(-zeta*wn*t);
                    const y = (testKp/10) * (1 - (env/Math.sqrt(1-zeta*zeta)) * Math.sin(wd*t + phi));
                    output.push(y);
                }
                pStr = `<span style="color:var(--text-secondary)">System is stable. Oscillation decays. Increase K_p further.</span>`;
            } else if (Math.abs(testKp - Ku) < 0.2) {
                // Marginal
                const wn = 2 + 1*2; 
                for(let t=0; t<=tMax; t+=dt) {
                    time.push(t.toFixed(1)); target.push(r);
                    const y = 1 - Math.cos(wn*t);
                    output.push(y);
                }
                pStr = `<span style="color:var(--accent-violet); font-weight:bold;">Marginally Stable! Sustained oscillations found. $K_u = ${Ku.toFixed(1)}$, $T_u \\approx ${Tu.toFixed(1)}$s.</span>`;
            } else {
                // Unstable
                const p = (testKp-Ku)/5; // 0 to 1
                const sigma = p*0.5; // positive exponential
                const wn = 4;
                for(let t=0; t<=tMax; t+=dt) {
                    time.push(t.toFixed(1)); target.push(r);
                    let y = 1 - Math.exp(sigma*t)*Math.cos(wn*t);
                    if(y > 3) y=3; if(y < -1) y=-1; // clip
                    output.push(y);
                }
                pStr = `<span style="color:var(--accent-red)">System is unstable. Oscillations grow boundlessly. Decrease K_p.</span>`;
            }
        }

        results.innerHTML = pStr;

        chart.data.labels = time;
        chart.data.datasets[0].data = target;
        chart.data.datasets[1].data = output;
        
        // dynamic limits
        if (testKp > Ku) chart.options.scales.y.max = 3;
        else chart.options.scales.y.max = 2;
        
        chart.update();
    }

    sKp.addEventListener('input', () => { applied = false; update(); });

    btnApply.addEventListener('click', () => {
        // Apply ZN PID rules
        KpZ = 0.6 * Ku;
        KiZ = 1.2 * Ku / Tu;
        KdZ = 0.075 * Ku * Tu;
        
        vKp.innerHTML = `<strong>(Z-N Applied)</strong> <br> $K_p = \${KpZ.toFixed(2)}$ <br> $K_i = \${KiZ.toFixed(2)}$ <br> $K_d = \${KdZ.toFixed(2)}$`;
        if(window.renderMathInElement) window.renderMathInElement(vKp);
        
        applied = true;
        update();
    });

    update();
});

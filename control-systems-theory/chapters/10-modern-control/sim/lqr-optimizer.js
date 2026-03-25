// sim/lqr-optimizer.js

document.addEventListener('DOMContentLoaded', () => {
    const sQw = document.getElementById('s-qw');
    const sRw = document.getElementById('s-rw');
    const vQw = document.getElementById('v-qw');
    const vRw = document.getElementById('v-rw');
    const info = document.getElementById('lqr-info');

    const cState = document.getElementById('c-lqr-state');
    const cEffort = document.getElementById('c-lqr-effort');

    if(!sQw || !cState) return;

    const commonOpts = {
        responsive: true, maintainAspectRatio: false, animation: false, elements: { point: { radius: 0 } },
        scales: { 
            x: { title: {display:false}, grid: {color:'rgba(255,255,255,0.05)'}, ticks: {color:'#8a9bb5'} },
            y: { title: {display:false}, grid: {color:'rgba(255,255,255,0.05)'}, ticks: {color:'#8a9bb5'} }
        },
        plugins: { legend: { display:true, labels:{color:'#8a9bb5'} } }
    };

    const stateChart = new Chart(cState, {
        type: 'line', data: { labels: [], datasets: [
            { label: 'Position x1', data: [], borderColor: '#00e5ff', borderWidth: 2 },
            { label: 'Velocity x2', data: [], borderColor: '#7c4dff', borderWidth: 2 },
        ] },
        options: { ...commonOpts, plugins: { ...commonOpts.plugins, title:{display:true, text:'System States (Moving to Origin)', color:'#8a9bb5'} } }
    });

    const effortChart = new Chart(cEffort, {
        type: 'line', data: { labels: [], datasets: [{ label: 'Control Effort u', data: [], borderColor: '#ffab40', borderWidth: 2 }] },
        options: { ...commonOpts, plugins: { ...commonOpts.plugins, title:{display:true, text:'Control Effort u(t)', color:'#8a9bb5'} } }
    });

    function update() {
        const Qw = parseFloat(sQw.value);
        const Rw = parseFloat(sRw.value);
        
        vQw.innerText = Qw.toFixed(1);
        vRw.innerText = Rw.toFixed(1);

        // System: Double integrator (mass block)
        // dx1/dt = x2
        // dx2/dt = u
        // Let's use an approximate phenomenological LQR response
        // For double integrator, the optimal closed loop poles are proportional to (Q/R)^(1/4)
        
        const ratio = Qw / Rw;
        const wn = Math.pow(ratio, 0.25);
        const zeta = 0.707; // LQR on double integrator yields damping ratio ~0.707
        const sigma = zeta * wn;
        const wd = wn * Math.sqrt(1 - zeta*zeta);
        
        const tMax = 10;
        const dt = 0.05;
        
        let x1=5, x2=0; // Initial state
        let totalCost = 0;
        
        const time = [], vX1 = [], vX2 = [], vU = [];

        for(let t=0; t<=tMax; t+=dt) {
            time.push(t.toFixed(1));
            vX1.push(x1);
            vX2.push(x2);
            
            // LQR Feedback Gain approx
            // K1 = wn^2 = sqrt(Q/R)
            // K2 = 2*zeta*wn = sqrt(2)*wn
            const K1 = Math.sqrt(ratio);
            const K2 = Math.sqrt(2)*wn;
            
            const u = -(K1*x1 + K2*x2);
            vU.push(u);

            // Cost accumulation
            totalCost += (Qw*x1*x1 + Qw*x2*x2 + Rw*u*u) * dt;

            // Integration
            x1 += x2 * dt;
            x2 += u * dt;
        }

        stateChart.data.labels = time;
        stateChart.data.datasets[0].data = vX1;
        stateChart.data.datasets[1].data = vX2;
        stateChart.update();

        effortChart.data.labels = time;
        effortChart.data.datasets[0].data = vU;
        
        // Dynamic y axis for effort
        let maxU = 0;
        vU.forEach(u => { if(Math.abs(u)>maxU) maxU=Math.abs(u); });
        effortChart.options.scales.y.max = maxU > 10 ? Math.ceil(maxU) : 10;
        effortChart.options.scales.y.min = -(maxU > 10 ? Math.ceil(maxU) : 10);
        effortChart.update();

        // Info
        const settleIdx = vX1.findIndex(v => Math.abs(v) < 0.25); // 5% of 5
        const settleTime = settleIdx !== -1 ? time[settleIdx] : '> 10.0';

        info.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                <span>Settling Time:</span> <strong>\${settleTime} s</strong>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                <span>Total Cost $J$:</span> <strong>\${totalCost.toFixed(1)}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                <span>Max Control Effort:</span> <strong>\${maxU.toFixed(1)}</strong>
            </div>
            <p style="margin-top:1rem; color:var(--text-secondary)">
                \${Qw > Rw*10 ? 'Aggressive control (High Q): Fast settling, but requires high actuator capacity.' : 
                  Rw > Qw*10 ? 'Sluggish control (High R): Saves energy, but takes very long to reach target.' : 
                  'Balanced tuning.'}
            </p>
        `;
        if(window.renderMathInElement) window.renderMathInElement(info);
    }

    sQw.addEventListener('input', update);
    sRw.addEventListener('input', update);
    update();
});

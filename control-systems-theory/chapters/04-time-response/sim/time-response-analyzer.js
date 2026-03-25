// sim/time-response-analyzer.js

document.addEventListener('DOMContentLoaded', () => {
    const sZeta = document.getElementById('s-zeta');
    const sWn = document.getElementById('s-wn');
    const vZeta = document.getElementById('v-zeta');
    const vWn = document.getElementById('v-wn');
    const specResults = document.getElementById('spec-results');

    const cStep = document.getElementById('c-step');
    const cImpulse = document.getElementById('c-impulse');
    const cRamp = document.getElementById('c-ramp');

    if(!sZeta || !cStep) return;

    const commonOptions = {
        responsive: true, maintainAspectRatio: false, animation: false,
        elements: { point: { radius: 0 } },
        scales: { 
            x: { title: {display:false, color:'#8a9bb5'}, grid: {color:'rgba(255,255,255,0.05)'}, ticks: {color:'#8a9bb5'} },
            y: { title: {display:false, color:'#8a9bb5'}, grid: {color:'rgba(255,255,255,0.05)'}, ticks: {color:'#8a9bb5'} }
        },
        plugins: { legend: { labels: { color:'#e8edf8'} } }
    };

    const stepChart = new Chart(cStep, {
        type: 'line', data: { labels: [], datasets: [{ label: 'Step y(t)', data: [], borderColor: '#00e5ff', borderWidth: 2 }] },
        options: { ...commonOptions, plugins: { legend: { display:false }, title: {display:true, text:'Step Response', color:'#8a9bb5'} } }
    });

    const impulseChart = new Chart(cImpulse, {
        type: 'line', data: { labels: [], datasets: [{ label: 'Impulse h(t)', data: [], borderColor: '#7c4dff', borderWidth: 2 }] },
        options: { ...commonOptions, plugins: { legend: { display:false }, title: {display:true, text:'Impulse Response', color:'#8a9bb5'} } }
    });

    const rampChart = new Chart(cRamp, {
        type: 'line', data: { labels: [], datasets: [{ label: 'Ramp', data: [], borderColor: '#ffab40', borderWidth: 2 }, { label: 'Input r(t)', data:[], borderColor:'rgba(255,255,255,0.2)', borderDash:[5,5]}] },
        options: { ...commonOptions, plugins: { legend: { display:false }, title: {display:true, text:'Ramp Response', color:'#8a9bb5'} } }
    });

    function update() {
        const zeta = parseFloat(sZeta.value);
        const wn = parseFloat(sWn.value);
        
        vZeta.innerText = zeta.toFixed(2);
        vWn.innerText = wn.toFixed(1);

        const tMax = Math.max(10, 8 / (zeta * wn || 0.1));
        const dt = tMax / 200;
        
        const time = [], step = [], impulse = [], ramp = [], r_ramp = [];

        let tp = "N/A", ts = "N/A", os = "N/A", tr = "N/A";

        if (zeta < 1) {
            const wd = wn * Math.sqrt(1 - zeta*zeta);
            const phi = Math.acos(zeta);
            for(let t=0; t<=tMax; t+=dt) {
                time.push(t.toFixed(2));
                const env = Math.exp(-zeta*wn*t) / Math.sqrt(1 - zeta*zeta);
                
                const y_s = 1 - env * Math.sin(wd*t + phi);
                const y_i = (wn / Math.sqrt(1-zeta*zeta)) * Math.exp(-zeta*wn*t) * Math.sin(wd*t);
                const y_r = t - (2*zeta)/wn + (env/wn)*Math.sin(wd*t + 2*phi);

                step.push(y_s); impulse.push(y_i); ramp.push(y_r); r_ramp.push(t);
            }
            tp = (Math.PI / wd).toFixed(2) + "s";
            ts = (4 / (zeta*wn)).toFixed(2) + "s";
            os = (Math.exp(-Math.PI*zeta/Math.sqrt(1-zeta*zeta)) * 100).toFixed(1) + "%";
            tr = ((1.76*Math.pow(zeta,3) - 0.417*Math.pow(zeta,2) + 1.039*zeta + 1)/wn).toFixed(2) + "s";
        } else if (zeta === 1) {
            for(let t=0; t<=tMax; t+=dt) {
                time.push(t.toFixed(2));
                const y_s = 1 - Math.exp(-wn*t)*(1 + wn*t);
                const y_i = wn*wn*t*Math.exp(-wn*t);
                const y_r = t - 2/wn + Math.exp(-wn*t)*(t + 2/wn);
                
                step.push(y_s); impulse.push(y_i); ramp.push(y_r); r_ramp.push(t);
            }
            ts = (4 / wn).toFixed(2) + "s";
            os = "0%";
            tr = (3.36 / wn).toFixed(2) + "s";
        } else {
            const s1 = -zeta*wn + wn*Math.sqrt(zeta*zeta - 1);
            const s2 = -zeta*wn - wn*Math.sqrt(zeta*zeta - 1);
            for(let t=0; t<=tMax; t+=dt) {
                time.push(t.toFixed(2));
                const y_s = 1 + (s2*Math.exp(s1*t) - s1*Math.exp(s2*t)) / (s1 - s2);
                
                // very simple diff for impulse roughly
                const y_i = (wn*wn / (s1-s2)) * (Math.exp(s1*t) - Math.exp(s2*t));
                
                // approx ramp
                const y_r = t - (2*zeta)/wn; // just steady state part for visual simplicity
                
                step.push(y_s); impulse.push(Math.abs(y_i)); ramp.push(y_r); r_ramp.push(t);
            }
            ts = (4 / Math.abs(Math.max(s1,s2))).toFixed(2) + "s";
            os = "0%";
        }

        specResults.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                <span>Overshoot $M_p$:</span> <strong style="color:var(--accent-cyan)">\${os}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                <span>Settling Time $t_s$:</span> <strong style="color:var(--accent-cyan)">\${ts}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                <span>Peak Time $t_p$:</span> <strong style="color:var(--accent-cyan)">\${tp}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                <span>Rise Time $t_r$:</span> <strong style="color:var(--accent-cyan)">\${tr}</strong>
            </div>
        `;
        if(window.renderMathInElement) window.renderMathInElement(specResults);

        stepChart.data.labels = time; stepChart.data.datasets[0].data = step; stepChart.update();
        impulseChart.data.labels = time; impulseChart.data.datasets[0].data = impulse; impulseChart.update();
        rampChart.data.labels = time; rampChart.data.datasets[0].data = ramp; rampChart.data.datasets[1].data = r_ramp; rampChart.update();
    }

    sZeta.addEventListener('input', update);
    sWn.addEventListener('input', update);
    update();
});

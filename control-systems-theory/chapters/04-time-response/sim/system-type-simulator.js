// sim/system-type-simulator.js

document.addEventListener('DOMContentLoaded', () => {
    const sysInput = document.getElementById('sys-input');
    const sysType = document.getElementById('sys-type');
    const sGain = document.getElementById('s-gain');
    const vGain = document.getElementById('v-gain');
    const resultDiv = document.getElementById('error-calc');
    const cError = document.getElementById('c-error');

    if(!sysInput || !cError) return;

    const chart = new Chart(cError, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                { label: 'Input r(t)', data: [], borderColor: 'rgba(255,255,255,0.4)', borderDash: [5,5], borderWidth: 1, pointRadius: 0 },
                { label: 'Output y(t)', data: [], borderColor: '#00e5ff', borderWidth: 2, pointRadius: 0 },
                { label: 'Error e(t)', data: [], borderColor: '#ff3d71', borderWidth: 2, pointRadius: 0 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false, animation: false,
            scales: { 
                x: { title: {display:true, text:'Time (s)', color:'#8a9bb5'}, grid: {color:'rgba(255,255,255,0.05)'}, ticks: {color:'#8a9bb5'} },
                y: { title: {display:true, text:'Amplitude', color:'#8a9bb5'}, grid: {color:'rgba(255,255,255,0.05)'}, ticks: {color:'#8a9bb5'} }
            },
            plugins: { legend: { labels: { color:'#e8edf8'} } }
        }
    });

    function update() {
        const inp = sysInput.value;
        const type = parseInt(sysType.value);
        const K = parseFloat(sGain.value);
        vGain.innerText = K;

        const maxT = 10;
        const dt = 0.1;
        const time = [], target = [], output = [], err = [];

        // Simplified analytical tracking for basic models.
        // Type 0: G(s) = K / (s+1)
        // Type 1: G(s) = K / (s*(s+1))
        // Type 2: G(s) = K / (s^2*(s+1))
        
        // This is a phenomenological simulation to visually demonstrate e_ss.
        let ess = 0;
        let essStr = "";

        if (inp === 'step') {
            if (type === 0) {
                ess = 1 / (1 + K); essStr = `\\frac{1}{1+K_p} = ${ess.toFixed(3)}`;
                for(let t=0; t<=maxT; t+=dt) {
                    time.push(t.toFixed(1)); target.push(1);
                    const y = (K/(K+1)) * (1 - Math.exp(-(K+1)*t)); // Exact for K/(s+1) feedback
                    output.push(y); err.push(1 - y);
                }
            } else {
                ess = 0; essStr = "0";
                for(let t=0; t<=maxT; t+=dt) {
                    time.push(t.toFixed(1)); target.push(1);
                    // Approx response settling to 1
                    const y = 1 - Math.exp(-2*t)*Math.cos(2*t); 
                    output.push(y); err.push(1 - y);
                }
            }
        } 
        else if (inp === 'ramp') {
            if (type === 0) {
                ess = Infinity; essStr = "\\infty";
                for(let t=0; t<=maxT; t+=dt) {
                    time.push(t.toFixed(1)); target.push(t);
                    const y = (K/(K+1)) * t; // Diverges from t
                    output.push(y); err.push(t - y);
                }
            } else if (type === 1) {
                ess = 1 / K; essStr = `\\frac{1}{K_v} = ${ess.toFixed(3)}`;
                for(let t=0; t<=maxT; t+=dt) {
                    time.push(t.toFixed(1)); target.push(t);
                    // Exact steady state is t - 1/K
                    const y = t - 1/K + (1/K)*Math.exp(-K*t); 
                    output.push(y); err.push(t - y);
                }
            } else {
                ess = 0; essStr = "0";
                for(let t=0; t<=maxT; t+=dt) {
                    time.push(t.toFixed(1)); target.push(t);
                    const y = t - Math.exp(-2*t)*Math.sin(2*t);
                    output.push(y); err.push(t - y);
                }
            }
        }
        else if (inp === 'parabola') {
            if (type === 0 || type === 1) {
                ess = Infinity; essStr = "\\infty";
                for(let t=0; t<=maxT; t+=dt) {
                    time.push(t.toFixed(1)); target.push(0.5*t*t);
                    const y = type===0 ? (K/(K+1))*0.5*t*t : 0.5*t*t - t/K; // Both diverge
                    output.push(y); err.push(0.5*t*t - y);
                }
            } else if (type === 2) {
                ess = 1 / K; essStr = `\\frac{1}{K_a} = ${ess.toFixed(3)}`;
                for(let t=0; t<=maxT; t+=dt) {
                    time.push(t.toFixed(1)); target.push(0.5*t*t);
                    const y = 0.5*t*t - 1/K + (1/K)*Math.exp(-K*t); 
                    output.push(y); err.push(0.5*t*t - y);
                }
            } else {
                ess = 0; essStr = "0";
            }
        }

        resultDiv.innerHTML = `
            <p><strong>Predicted Steady-State Error:</strong></p>
            <div style="font-size: 1.2rem; margin: 1rem 0; text-align:center;">
                $$ e_{ss} = ${essStr} $$
            </div>
            <p style="color:var(--text-secondary)">
                ${ess === Infinity ? 'The system cannot track this input. The error grows out of bounds.' : 
                  ess === 0 ? 'The system tracks the input perfectly with zero steady-state error.' : 
                  'The system tracks the input but with a constant offset error.'}
            </p>
        `;
        if(window.renderMathInElement) window.renderMathInElement(resultDiv);

        chart.data.labels = time;
        chart.data.datasets[0].data = target;
        chart.data.datasets[1].data = output;
        chart.data.datasets[2].data = err;
        chart.update();
    }

    sysInput.addEventListener('change', update);
    sysType.addEventListener('change', update);
    sGain.addEventListener('input', update);
    update();
});

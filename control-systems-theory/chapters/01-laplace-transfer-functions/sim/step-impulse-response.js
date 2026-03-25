// sim/step-impulse-response.js

document.addEventListener('DOMContentLoaded', () => {
    const ctx = document.getElementById('canvas-step-resp');
    if(!ctx) return;

    let chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Step Response y(t)',
                data: [],
                borderColor: '#00e5ff',
                backgroundColor: 'rgba(0, 229, 255, 0.1)',
                borderWidth: 2,
                fill: true,
                pointRadius: 0,
                tension: 0.1
            }, {
                label: 'Target (1.0)',
                data: [],
                borderColor: '#e8edf8',
                borderWidth: 1,
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            interaction: {
                intersect: false,
                mode: 'index',
            },
            scales: {
                x: { title: { display: true, text: 'Time (s)', color: '#8a9bb5' }, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8a9bb5' } },
                y: { title: { display: true, text: 'Amplitude', color: '#8a9bb5' }, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8a9bb5' } }
            },
            plugins: {
                legend: { labels: { color: '#e8edf8' } }
            }
        }
    });

    const sliderZeta = document.getElementById('slider-zeta');
    const sliderWn = document.getElementById('slider-wn');
    const valZeta = document.getElementById('val-zeta');
    const valWn = document.getElementById('val-wn');
    
    const specOs = document.getElementById('spec-os');
    const specTs = document.getElementById('spec-ts');
    const specTp = document.getElementById('spec-tp');

    function updateSim() {
        const zeta = parseFloat(sliderZeta.value);
        const wn = parseFloat(sliderWn.value);
        
        valZeta.innerText = zeta.toFixed(2);
        valWn.innerText = wn.toFixed(1);

        // Time vector
        const tMax = Math.max(10, 8 / (zeta * wn || 0.1));
        const dt = tMax / 200;
        const time = [];
        const resp = [];
        const target = [];

        let tp = "N/A", ts = "N/A", os = "N/A";

        if (zeta < 1) { // Underdamped
            const wd = wn * Math.sqrt(1 - zeta*zeta);
            const phi = Math.acos(zeta);
            for(let t=0; t<=tMax; t+=dt) {
                time.push(t.toFixed(2));
                const y = 1 - (Math.exp(-zeta*wn*t) / Math.sqrt(1-zeta*zeta)) * Math.sin(wd*t + phi);
                resp.push(y);
                target.push(1.0);
            }
            tp = (Math.PI / wd).toFixed(2) + "s";
            ts = (4 / (zeta*wn)).toFixed(2) + "s";
            os = (Math.exp(-Math.PI*zeta/Math.sqrt(1-zeta*zeta)) * 100).toFixed(1) + "%";
        } else if (zeta === 1) { // Critically damped
            for(let t=0; t<=tMax; t+=dt) {
                time.push(t.toFixed(2));
                const y = 1 - Math.exp(-wn*t)*(1 + wn*t);
                resp.push(y);
                target.push(1.0);
            }
            tp = "N/A";
            ts = (4 / wn).toFixed(2) + "s";
            os = "0%";
        } else { // Overdamped
            const s1 = -zeta*wn + wn*Math.sqrt(zeta*zeta - 1);
            const s2 = -zeta*wn - wn*Math.sqrt(zeta*zeta - 1);
            for(let t=0; t<=tMax; t+=dt) {
                time.push(t.toFixed(2));
                const y = 1 + (s2*Math.exp(s1*t) - s1*Math.exp(s2*t)) / (s1 - s2);
                resp.push(y);
                target.push(1.0);
            }
            tp = "N/A";
            // Approximation for ts
            ts = (4 / Math.abs(Math.max(s1,s2))).toFixed(2) + "s";
            os = "0%";
        }

        specOs.innerText = os;
        specTs.innerText = ts;
        specTp.innerText = tp;

        chart.data.labels = time;
        chart.data.datasets[0].data = resp;
        chart.data.datasets[1].data = target;
        chart.update();
    }

    sliderZeta.addEventListener('input', updateSim);
    sliderWn.addEventListener('input', updateSim);
    
    // Initial draw
    updateSim();
});

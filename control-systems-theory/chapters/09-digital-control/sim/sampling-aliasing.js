// sim/sampling-aliasing.js

document.addEventListener('DOMContentLoaded', () => {
    const sFs = document.getElementById('s-fs');
    const vFs = document.getElementById('v-fs');
    const cSample = document.getElementById('c-sample');
    const info = document.getElementById('alias-info');

    if(!sFs || !cSample) return;

    const chart = new Chart(cSample, {
        type: 'line', data: { labels: [], datasets: [
            { label: 'Original Analog', data: [], borderColor: 'rgba(0,229,255,0.4)', borderWidth: 2, pointRadius:0, tension:0.4 },
            { label: 'Samples', data: [], borderColor: '#ffab40', backgroundColor: '#ffab40', borderWidth: 0, pointRadius:4, showLine: false },
            { label: 'Reconstructed (Aliased)', data: [], borderColor: '#ff3d71', borderDash:[5,5], borderWidth: 2, pointRadius:0, tension:0.4 }
        ] },
        options: { 
            responsive: true, maintainAspectRatio: false, animation: false,
            scales: { 
                x: { title: {display:false}, grid: {color:'rgba(255,255,255,0.05)'}, ticks: {color:'#8a9bb5'} },
                y: { title: {display:false}, grid: {color:'rgba(255,255,255,0.05)'}, min: -1.2, max: 1.2, ticks: {color:'#8a9bb5'} }
            },
            plugins: { legend: { display:true, labels: {color:'#8a9bb5'} } }
        }
    });

    const f0 = 2.0; // Analog frequency

    function update() {
        const fs = parseFloat(sFs.value);
        vFs.innerText = fs.toFixed(1);

        const tMax = 2; // seconds
        const dtAnalog = 0.01;
        
        const time = [], vAnalog = [], vSampled = [], vRecon = [];
        
        // Analog
        for(let t=0; t<=tMax; t+=dtAnalog) {
            time.push(t.toFixed(2));
            vAnalog.push(Math.sin(2*Math.PI*f0*t));
            vSampled.push(null);
            vRecon.push(null);
        }

        // Sampling
        const Ts = 1/fs;
        for(let t=0; t<=tMax; t+=Ts) {
            const idx = Math.min(Math.floor(t / dtAnalog), time.length-1);
            vSampled[idx] = Math.sin(2*Math.PI*f0*t);
        }
        
        // Reconstruction freq
        // f_alias = |f0 - k*fs| where k is an integer that minimizes the expression
        let f_recon = f0;
        let k = Math.round(f0 / fs);
        f_recon = Math.abs(f0 - k*fs);
        
        // Phase shift of alias depends on k
        let phase = (f0 - k*fs) < 0 ? Math.PI : 0; 

        // Reconstructed signal
        for(let i=0; i<time.length; i++) {
            const t = i * dtAnalog;
            vRecon[i] = Math.sin(2*Math.PI*f_recon*t + phase);
        }

        chart.data.labels = time;
        chart.data.datasets[0].data = vAnalog;
        chart.data.datasets[1].data = vSampled;
        
        if (fs <= 2*f0) {
            chart.data.datasets[2].data = vRecon;
            info.innerHTML = `
                <span style="color:var(--accent-red); font-weight:bold;">Nyquist violated! $f_s \\le 2f_0$</span><br>
                Reconstructed frequency appears as $f_\\text{alias} = \${f_recon.toFixed(2)}$ Hz.
            `;
        } else {
            // Hide recon line if it matches
            chart.data.datasets[2].data = [];
            info.innerHTML = `
                <span style="color:var(--accent-green); font-weight:bold;">Nyquist satisfied. $f_s > 2f_0$</span><br>
                Original signal can be perfectly reconstructed.
            `;
        }
        
        if(window.renderMathInElement) window.renderMathInElement(info);

        chart.update();
    }

    sFs.addEventListener('input', update);
    update();
});

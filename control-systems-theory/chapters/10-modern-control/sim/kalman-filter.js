// sim/kalman-filter.js

document.addEventListener('DOMContentLoaded', () => {
    const sQn = document.getElementById('s-qn');
    const sRn = document.getElementById('s-rn');
    const vQn = document.getElementById('v-qn');
    const vRn = document.getElementById('v-rn');

    const cKalman = document.getElementById('c-kalman');

    if(!sQn || !cKalman) return;

    const chart = new Chart(cKalman, {
        type: 'line', data: { labels: [], datasets: [
            { label: 'Noisy Meas (y)', data: [], borderColor: 'rgba(255,61,113,0.3)', backgroundColor: 'rgba(255,61,113,0.5)', pointRadius:2, showLine:false },
            { label: 'True State (x)', data: [], borderColor: 'rgba(255,255,255,0.4)', borderDash:[5,5], borderWidth: 2, pointRadius:0 },
            { label: 'Kalman Est (x^)', data: [], borderColor: '#00e5ff', borderWidth: 3, pointRadius:0 }
        ] },
        options: { 
            responsive: true, maintainAspectRatio: false, animation: false,
            scales: { 
                x: { title: {display:false}, grid: {color:'rgba(255,255,255,0.05)'}, ticks: {color:'#8a9bb5'} },
                y: { title: {display:false}, grid: {color:'rgba(255,255,255,0.05)'}, ticks: {color:'#8a9bb5'} }
            },
            plugins: { legend: { display:false } } // Custom legend in HTML
        }
    });

    // Gaussian generator
    function randn() {
        let u = 0, v = 0;
        while(u === 0) u = Math.random();
        while(v === 0) v = Math.random();
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    }

    function update() {
        const Qn = parseFloat(sQn.value); // Process noise var
        const Rn = parseFloat(sRn.value); // Sensor noise var
        
        vQn.innerText = Qn.toFixed(1);
        vRn.innerText = Rn.toFixed(1);

        const steps = 150;
        const dt = 0.1;
        
        // True system: moving with some dynamics 
        // dx/dt = v
        // dv/dt = -0.1v + noise -> driving force
        let xTrue = 0;
        let vTrue = 5;

        // Kalman Filter 1D approx (tracking position, velocity assumed constant process)
        // Let's do a simple 1D state for visual clarity: state = position
        // x_k = x_{k-1} + u_k + w_k
        // We'll use a random walk with drift
        
        let kX = 0; // Estimate
        let kP = 5; // Error covariance

        const time = [], vMeas = [], vTrueHist = [], vEstHist = [];

        for(let i=0; i<steps; i++) {
            time.push((i*dt).toFixed(1));

            // True process update
            xTrue += Math.sin(i*0.1)*0.5 + Math.cos(i*0.05)*0.2; 
            xTrue += randn() * Math.sqrt(Qn) * 0.1; // process noise
            vTrueHist.push(xTrue);

            // Measurement
            const meas = xTrue + randn() * Math.sqrt(Rn);
            vMeas.push(meas);

            // Kalman Predict
            let xPred = kX + Math.sin(i*0.1)*0.5 + Math.cos(i*0.05)*0.2; // model prediction
            let PPred = kP + Qn;

            // Kalman Update
            let K = PPred / (PPred + Rn); // Kalman Gain
            kX = xPred + K * (meas - xPred);
            kP = (1 - K) * PPred;

            vEstHist.push(kX);
        }

        chart.data.labels = time;
        chart.data.datasets[0].data = vMeas;
        chart.data.datasets[1].data = vTrueHist;
        chart.data.datasets[2].data = vEstHist;
        chart.update();
    }

    sQn.addEventListener('input', update);
    sRn.addEventListener('input', update);
    update();
});

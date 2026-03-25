// sim/pid-tuner.js

document.addEventListener('DOMContentLoaded', () => {
    const sKp = document.getElementById('s-kp');
    const sKi = document.getElementById('s-ki');
    const sKd = document.getElementById('s-kd');
    const vKp = document.getElementById('v-kp');
    const vKi = document.getElementById('v-ki');
    const vKd = document.getElementById('v-kd');

    const cResp = document.getElementById('c-pid-resp');
    const cEffort = document.getElementById('c-pid-effort');

    if(!sKp || !cResp) return;

    const commonOpts = {
        responsive: true, maintainAspectRatio: false, animation: false, elements: { point: { radius: 0 } },
        scales: { 
            x: { title: {display:false}, grid: {color:'rgba(255,255,255,0.05)'}, ticks: {color:'#8a9bb5'} },
            y: { title: {display:false}, grid: {color:'rgba(255,255,255,0.05)'}, ticks: {color:'#8a9bb5'} }
        },
        plugins: { legend: { display:false } }
    };

    const respChart = new Chart(cResp, {
        type: 'line', data: { labels: [], datasets: [
            { label: 'Setpoint r(t)', data: [], borderColor: 'rgba(255,255,255,0.4)', borderDash: [5,5], borderWidth: 1 },
            { label: 'Output y(t)', data: [], borderColor: '#00e5ff', borderWidth: 2 }
        ] },
        options: { ...commonOpts, plugins: { legend:{display:false}, title:{display:true, text:'System Response y(t)', color:'#8a9bb5'} } }
    });

    const effortChart = new Chart(cEffort, {
        type: 'line', data: { labels: [], datasets: [{ label: 'Control u(t)', data: [], borderColor: '#ffab40', borderWidth: 2 }] },
        options: { ...commonOpts, plugins: { legend:{display:false}, title:{display:true, text:'Control Effort u(t)', color:'#8a9bb5'} } }
    });

    // Plant: G(s) = 1 / (s^3 + 6s^2 + 11s + 6)
    // To simulate we use state space or Euler
    // states: x1 = y, x2 = y', x3 = y''
    // x1' = x2
    // x2' = x3
    // x3' = -6x1 - 11x2 - 6x3 + u
    
    function update() {
        const kp = parseFloat(sKp.value);
        const ki = parseFloat(sKi.value);
        const kd = parseFloat(sKd.value);
        
        vKp.innerText = kp.toFixed(1);
        vKi.innerText = ki.toFixed(1);
        vKd.innerText = kd.toFixed(1);

        const tMax = 20;
        const dt = 0.05;
        
        let x1=0, x2=0, x3=0;
        let integral = 0;
        let prevError = 0;
        
        const time = [], target = [], output = [], control = [];

        for(let t=0; t<=tMax; t+=dt) {
            time.push(t.toFixed(1));
            const r = 1.0; // unit step setpoint
            target.push(r);
            
            output.push(x1);

            const error = r - x1;
            integral += error * dt;
            const derivative = (error - prevError) / dt;
            prevError = error;

            // Simple anti-windup
            if(integral > 50) integral = 50;
            if(integral < -50) integral = -50;

            let u = kp*error + ki*integral + kd*derivative;
            
            // Saturation limit for realism
            if(u > 20) u = 20;
            if(u < -20) u = -20;
            
            control.push(u);

            // Euler integration for plant
            const dx1 = x2;
            const dx2 = x3;
            const dx3 = -6*x1 - 11*x2 - 6*x3 + u;
            
            // Sub-steps for stability
            const subDT = dt/10;
            for(let j=0; j<10; j++) {
                x1 += dx1*subDT;
                x2 += dx2*subDT;
                x3 += dx3*subDT;
            }
        }

        respChart.data.labels = time;
        respChart.data.datasets[0].data = target;
        respChart.data.datasets[1].data = output;
        respChart.update();

        effortChart.data.labels = time;
        effortChart.data.datasets[0].data = control;
        effortChart.update();
    }

    sKp.addEventListener('input', update);
    sKi.addEventListener('input', update);
    sKd.addEventListener('input', update);
    update();
});

// sim/laplace-explorer.js

document.addEventListener('DOMContentLoaded', () => {
    // Implement an interactive draggable s-plane and time-response view
    const canvasTime = document.getElementById('canvas-laplace-time');
    const splaneContainer = document.getElementById('canvas-laplace-splane');
    if(!canvasTime || !splaneContainer) return;

    let chart = new Chart(canvasTime, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Impulse Response h(t)',
                data: [],
                borderColor: '#7c4dff',
                backgroundColor: 'rgba(124, 77, 255, 0.1)',
                borderWidth: 2,
                fill: true,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            scales: {
                x: { title: { display: true, text: 'Time (s)', color: '#8a9bb5'}, ticks: { color: '#8a9bb5' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                y: { title: { display: true, text: 'Amplitude', color: '#8a9bb5'}, ticks: { color: '#8a9bb5' }, grid: { color: 'rgba(255,255,255,0.05)' } }
            },
            plugins: { legend: { labels: { color: '#e8edf8' } } }
        }
    });

    // Custom 2D implementation of draggable poles for s-plane
    const canvasS = document.createElement('canvas');
    canvasS.width = splaneContainer.clientWidth;
    canvasS.height = splaneContainer.clientHeight;
    canvasS.style.width = '100%';
    canvasS.style.height = '100%';
    splaneContainer.appendChild(canvasS);
    const ctx = canvasS.getContext('2d');

    // Pole state: default a complex pair
    let poles = [
        { real: -1, imag: 3 },
        { real: -1, imag: -3 }
    ];

    let draggingIdx = -1;

    function drawAxes() {
        ctx.clearRect(0,0,canvasS.width,canvasS.height);
        const cw = canvasS.width;
        const ch = canvasS.height;
        const cx = cw/2;
        const cy = ch/2;

        // Origin crosshair
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.moveTo(0, cy); ctx.lineTo(cw, cy);
        ctx.moveTo(cx, 0); ctx.lineTo(cx, ch);
        ctx.stroke();

        // Labels
        ctx.fillStyle = '#8a9bb5';
        ctx.font = '12px Inter';
        ctx.fillText('jω', cx + 5, 15);
        ctx.fillText('σ', cw - 15, cy - 5);
        
        // Draw stability region
        ctx.fillStyle = 'rgba(105, 255, 71, 0.05)'; // faint green for LHP
        ctx.fillRect(0, 0, cx, ch);
    }

    function sToPix(sReal, sImag) {
        // Assume mapping window: real [-10, 10], imag [-10, 10]
        const cw = canvasS.width;
        const ch = canvasS.height;
        const x = (sReal / 10) * (cw/2) + (cw/2);
        const y = -(sImag / 10) * (ch/2) + (ch/2);
        return {x, y};
    }

    function pixToS(x, y) {
        const cw = canvasS.width;
        const ch = canvasS.height;
        const sReal = ((x - cw/2) / (cw/2)) * 10;
        const sImag = -((y - ch/2) / (ch/2)) * 10;
        return {real: sReal, imag: sImag};
    }

    function drawPoles() {
        poles.forEach(p => {
            const pos = sToPix(p.real, p.imag);
            ctx.beginPath();
            ctx.strokeStyle = '#7c4dff';
            ctx.lineWidth = 2;
            ctx.moveTo(pos.x - 5, pos.y - 5); ctx.lineTo(pos.x + 5, pos.y + 5);
            ctx.moveTo(pos.x + 5, pos.y - 5); ctx.lineTo(pos.x - 5, pos.y + 5);
            ctx.stroke();
            
            // Halo glow
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 8, 0, Math.PI*2);
            ctx.fillStyle = 'rgba(124, 77, 255, 0.2)';
            ctx.fill();
        });
    }

    function updateTimeDomain() {
        // Reconstruct h(t) from the 2 poles.
        // H(s) = 1 / ((s-p1)*(s-p2))
        const p1 = poles[0];
        
        const time = [];
        const resp = [];
        const tMax = 10;
        const dt = tMax / 100;
        
        // Use simplified analytical inverse Laplace for complex conjugate pair or twin real
        if (Math.abs(p1.imag) > 0.01) {
            // Complex pair case: 1 / ((s-\alpha)^2 + \beta^2) -> (1/\beta) e^{\alpha t} sin(\beta t)
            const alpha = p1.real;
            const beta = Math.abs(p1.imag);
            for(let t=0; t<=tMax; t+=dt) {
                time.push(t.toFixed(1));
                const y = (1/beta) * Math.exp(alpha * t) * Math.sin(beta * t);
                resp.push(y);
            }
        } else {
            // Both real - simplified logic assuming same pole for now
            const alpha = p1.real;
            for(let t=0; t<=tMax; t+=dt) {
                time.push(t.toFixed(1));
                const y = t * Math.exp(alpha * t);
                resp.push(y);
            }
        }

        chart.data.labels = time;
        chart.data.datasets[0].data = resp;
        chart.update();
    }

    function render() {
        drawAxes();
        drawPoles();
        updateTimeDomain();
    }

    // Drag interactions
    canvasS.addEventListener('mousedown', (e) => {
        const rect = canvasS.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        poles.forEach((p, idx) => {
            const pos = sToPix(p.real, p.imag);
            if(Math.hypot(pos.x - x, pos.y - y) < 15) {
                draggingIdx = idx;
            }
        });
    });

    canvasS.addEventListener('mousemove', (e) => {
        if(draggingIdx !== -1) {
            const rect = canvasS.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const s = pixToS(x, y);
            
            poles[draggingIdx].real = s.real;
            poles[draggingIdx].imag = s.imag;
            
            // Auto maintain conjugate for the pair if complex
            let otherIdx = (draggingIdx === 0) ? 1 : 0;
            poles[otherIdx].real = s.real;
            poles[otherIdx].imag = -s.imag;
            
            render();
        }
    });

    canvasS.addEventListener('mouseup', () => draggingIdx = -1);
    canvasS.addEventListener('mouseleave', () => draggingIdx = -1);

    // Resize observer
    window.addEventListener('resize', () => {
        canvasS.width = splaneContainer.clientWidth;
        canvasS.height = splaneContainer.clientHeight;
        render();
    });

    render();
});

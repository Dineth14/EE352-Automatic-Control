// sim/stability-regions.js

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('canvas-stab-s');
    const cImpulse = document.getElementById('c-stab-impulse');
    
    if(!container || !cImpulse) return;

    const chart = new Chart(cImpulse, {
        type: 'line', data: { labels: [], datasets: [{ label: 'h(t)', data: [], borderColor: '#00e5ff', borderWidth: 2 }] },
        options: { 
            responsive: true, maintainAspectRatio: false, animation: false, elements: { point: { radius: 0 } },
            scales: { x: { display:false }, y: { display:false } }, plugins: { legend: { display:false } }
        }
    });

    const canvas = document.createElement('canvas');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let pole = {r: -2, i: 5};
    let isDragging = false;

    function sToPix(r, i) {
        const cw = canvas.width, ch = canvas.height;
        const xr = (r - (-10)) / 20; // scale -10 to 10
        const yr = (i - (-10)) / 20;
        return { x: xr*cw, y: ch - yr*ch };
    }

    function pixToS(x, y) {
        const cw = canvas.width, ch = canvas.height;
        const xr = x/cw; const yr = (ch-y)/ch;
        return { r: xr*20 - 10, i: yr*20 - 10 };
    }

    function draw() {
        ctx.clearRect(0,0,canvas.width, canvas.height);
        
        // Regions
        const origin = sToPix(0,0);
        
        ctx.fillStyle = 'rgba(105, 255, 71, 0.05)'; // LHP stable
        ctx.fillRect(0, 0, origin.x, canvas.height);
        
        ctx.fillStyle = 'rgba(255, 61, 113, 0.05)'; // RHP unstable
        ctx.fillRect(origin.x, 0, canvas.width - origin.x, canvas.height);

        // Axes
        ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, origin.y); ctx.lineTo(canvas.width, origin.y);
        ctx.moveTo(origin.x, 0); ctx.lineTo(origin.x, canvas.height);
        ctx.stroke();

        ctx.fillStyle = '#8a9bb5'; ctx.font='12px Inter';
        ctx.fillText("LHP (Stable)", 10, 20);
        ctx.fillText("RHP (Unstable)", origin.x + 10, 20);

        // Poles
        const p1 = sToPix(pole.r, pole.i);
        const p2 = sToPix(pole.r, -pole.i); // conjugate
        
        ctx.strokeStyle = '#ffab40'; ctx.lineWidth = 2;
        [p1, p2].forEach(p => {
            ctx.beginPath(); ctx.moveTo(p.x-6, p.y-6); ctx.lineTo(p.x+6, p.y+6); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(p.x+6, p.y-6); ctx.lineTo(p.x-6, p.y+6); ctx.stroke();
        });
        
        ctx.setLineDash([5,5]); ctx.strokeStyle='rgba(255,171,64,0.3)';
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
        ctx.setLineDash([]);
    }

    function updateSim() {
        const tVec = [], yVec = [];
        const sigma = pole.r;
        const wd = Math.abs(pole.i);
        
        // h(t) for conjugate pair is proportional to e^(sigma*t) * sin(wd*t)
        // or e^(sigma*t) if wd=0
        
        // Dynamic time scale depending on sigma so we can see what's happening
        const maxT = Math.max(2, Math.min(20, 5/Math.abs(sigma || 0.1)));
        const dt = maxT/150;

        let stable = sigma < 0;

        for(let t=0; t<=maxT; t+=dt) {
            tVec.push(t.toFixed(2));
            let y = 0;
            if(wd > 0.1) {
                y = Math.exp(sigma*t) * Math.sin(wd*t);
            } else {
                y = Math.exp(sigma*t); // approx real pole
            }
            
            // clip massive vals so chart doesn't break
            if(y > 1e6) y = 1e6;
            if(y < -1e6) y = -1e6;
            yVec.push(y);
        }

        chart.data.labels = tVec;
        chart.data.datasets[0].data = yVec;
        chart.data.datasets[0].borderColor = stable ? '#00e5ff' : '#ff3d71';
        chart.update();
    }

    container.addEventListener('mousedown', (e) => { isDragging = true; updatePos(e); });
    window.addEventListener('mouseup', () => isDragging = false);
    container.addEventListener('mousemove', (e) => { if(isDragging) updatePos(e); });

    function updatePos(e) {
        const rect = canvas.getBoundingClientRect();
        pole = pixToS(e.clientX - rect.left, e.clientY - rect.top);
        draw();
        updateSim();
    }

    window.addEventListener('resize', () => {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        draw();
        updateSim();
    });

    draw();
    updateSim();
});

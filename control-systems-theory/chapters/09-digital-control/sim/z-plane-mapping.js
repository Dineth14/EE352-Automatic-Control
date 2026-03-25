// sim/z-plane-mapping.js

document.addEventListener('DOMContentLoaded', () => {
    const sTs = document.getElementById('s-ts');
    const vTs = document.getElementById('v-ts');

    const containerS = document.getElementById('canvas-s');
    const containerZ = document.getElementById('canvas-z');

    if(!sTs || !containerS || !containerZ) return;

    const canvasS = document.createElement('canvas'); canvasS.width=containerS.clientWidth; canvasS.height=containerS.clientHeight; containerS.appendChild(canvasS);
    const ctxS = canvasS.getContext('2d');

    const canvasZ = document.createElement('canvas'); canvasZ.width=containerZ.clientWidth; canvasZ.height=containerZ.clientHeight; containerZ.appendChild(canvasZ);
    const ctxZ = canvasZ.getContext('2d');

    let poleS = {r: -2, i: 5};
    let isDragging = false;
    let Ts = parseFloat(sTs.value);

    // S-plane coordinates: -10 to +4 Real, -10 to +10 Imag
    function sToPix(r, i, cw, ch) {
        const xr = (r - (-10)) / 14; 
        const yr = (i - (-10)) / 20;
        return { x: xr*cw, y: ch - yr*ch };
    }

    function pixToS(x, y, cw, ch) {
        const xr = x/cw; const yr = (ch-y)/ch;
        return { r: xr*14 - 10, i: yr*20 - 10 };
    }

    // Z-plane coords: -2 to +2
    function zToPix(r, i, cw, ch) {
        const xr = (r - (-2)) / 4; 
        const yr = (i - (-2)) / 4;
        return { x: xr*cw, y: ch - yr*ch };
    }

    function draw() {
        // --- S PLANE ---
        ctxS.clearRect(0,0,canvasS.width, canvasS.height);
        const cwS = canvasS.width, chS = canvasS.height;
        
        // LHP background
        const originS = sToPix(0,0,cwS,chS);
        ctxS.fillStyle = 'rgba(105, 255, 71, 0.05)';
        ctxS.fillRect(0, 0, originS.x, chS);
        ctxS.fillStyle = 'rgba(255, 61, 113, 0.05)';
        ctxS.fillRect(originS.x, 0, cwS - originS.x, chS);

        ctxS.strokeStyle = 'rgba(255,255,255,0.2)'; ctxS.lineWidth = 1; ctxS.beginPath();
        ctxS.moveTo(0, originS.y); ctxS.lineTo(cwS, originS.y);
        ctxS.moveTo(originS.x, 0); ctxS.lineTo(originS.x, chS); ctxS.stroke();

        ctxS.fillStyle = '#8a9bb5'; ctxS.font='12px Inter';
        ctxS.fillText("s-plane", 10, 20);

        // draw pole
        const p1s = sToPix(poleS.r, poleS.i, cwS, chS);
        const p2s = sToPix(poleS.r, -poleS.i, cwS, chS);
        ctxS.strokeStyle = '#ffab40'; ctxS.lineWidth = 2;
        [p1s, p2s].forEach(p => {
            ctxS.beginPath(); ctxS.moveTo(p.x-6, p.y-6); ctxS.lineTo(p.x+6, p.y+6); ctxS.stroke();
            ctxS.beginPath(); ctxS.moveTo(p.x+6, p.y-6); ctxS.lineTo(p.x-6, p.y+6); ctxS.stroke();
        });


        // --- Z PLANE ---
        ctxZ.clearRect(0,0,canvasZ.width, canvasZ.height);
        const cwZ = canvasZ.width, chZ = canvasZ.height;

        const originZ = zToPix(0,0,cwZ,chZ);
        ctxZ.strokeStyle = 'rgba(255,255,255,0.2)'; ctxZ.lineWidth = 1; ctxZ.beginPath();
        ctxZ.moveTo(0, originZ.y); ctxZ.lineTo(cwZ, originZ.y);
        ctxZ.moveTo(originZ.x, 0); ctxZ.lineTo(originZ.x, chZ); ctxZ.stroke();

        // Unit circle
        const radiusZ = cwZ/4; // since scale is 4 total
        ctxZ.fillStyle = 'rgba(105, 255, 71, 0.05)';
        ctxZ.beginPath(); ctxZ.arc(originZ.x, originZ.y, radiusZ, 0, Math.PI*2); ctxZ.fill();
        ctxZ.strokeStyle = 'rgba(105, 255, 71, 0.5)';
        ctxZ.stroke();

        ctxZ.fillStyle = '#8a9bb5'; ctxZ.font='12px Inter';
        ctxZ.fillText("z-plane", 10, 20);

        // Map s to z: z = e^(sTs)
        // z = e^(sigma*Ts + j*omega*Ts) = e^(sigma*Ts) * [cos(omega*Ts) + j*sin(omega*Ts)]
        const mag = Math.exp(poleS.r * Ts);
        const phase = poleS.i * Ts;
        
        const poleZ1 = { r: mag * Math.cos(phase), i: mag * Math.sin(phase) };
        const poleZ2 = { r: mag * Math.cos(-phase), i: mag * Math.sin(-phase) };

        const p1z = zToPix(poleZ1.r, poleZ1.i, cwZ, chZ);
        const p2z = zToPix(poleZ2.r, poleZ2.i, cwZ, chZ);
        
        ctxZ.strokeStyle = '#00e5ff'; ctxZ.lineWidth = 2;
        [p1z, p2z].forEach(p => {
            ctxZ.beginPath(); ctxZ.moveTo(p.x-6, p.y-6); ctxZ.lineTo(p.x+6, p.y+6); ctxZ.stroke();
            ctxZ.beginPath(); ctxZ.moveTo(p.x+6, p.y-6); ctxZ.lineTo(p.x-6, p.y+6); ctxZ.stroke();
        });
    }

    containerS.addEventListener('mousedown', (e) => { isDragging = true; updatePos(e); });
    window.addEventListener('mouseup', () => isDragging = false);
    containerS.addEventListener('mousemove', (e) => { if(isDragging) updatePos(e); });

    function updatePos(e) {
        const rect = canvasS.getBoundingClientRect();
        poleS = pixToS(e.clientX - rect.left, e.clientY - rect.top, canvasS.width, canvasS.height);
        draw();
    }

    sTs.addEventListener('input', () => {
        Ts = parseFloat(sTs.value);
        vTs.innerText = Ts.toFixed(2);
        draw();
    });

    window.addEventListener('resize', () => {
        canvasS.width=containerS.clientWidth; canvasS.height=containerS.clientHeight;
        canvasZ.width=containerZ.clientWidth; canvasZ.height=containerZ.clientHeight;
        draw();
    });

    draw();
});

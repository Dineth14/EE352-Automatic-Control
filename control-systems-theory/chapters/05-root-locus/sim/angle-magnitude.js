// sim/angle-magnitude.js

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('canvas-angle');
    const calcDiv = document.getElementById('angle-calc');
    
    if(!container || !calcDiv) return;

    const canvas = document.createElement('canvas');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const poles = [{r: -1, i: 2}, {r: -1, i: -2}, {r: 0, i: 0}];
    const zeros = [{r: -3, i: 0}];
    
    let testPoint = {r: -1.5, i: 1.5};
    let isDragging = false;

    function sToPix(r, i) {
        const cw = canvas.width, ch = canvas.height;
        const xr = (r - (-6)) / 8;
        const yr = (i - (-4)) / 8;
        return { x: xr*cw, y: ch - yr*ch };
    }

    function pixToS(x, y) {
        const cw = canvas.width, ch = canvas.height;
        const xr = x/cw; const yr = (ch-y)/ch;
        return { r: xr*8 - 6, i: yr*8 - 4 };
    }

    function draw() {
        ctx.clearRect(0,0,canvas.width, canvas.height);
        
        // Axes
        ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.beginPath();
        const origin = sToPix(0,0);
        ctx.moveTo(0, origin.y); ctx.lineTo(canvas.width, origin.y);
        ctx.moveTo(origin.x, 0); ctx.lineTo(origin.x, canvas.height);
        ctx.stroke();

        let sumAngle = 0;
        let sumStr = "";

        // Zeros
        zeros.forEach(z => {
            const pos = sToPix(z.r, z.i);
            ctx.strokeStyle = '#00e5ff'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(pos.x, pos.y, 5, 0, Math.PI*2); ctx.stroke();
            
            // Phasor
            const tpPos = sToPix(testPoint.r, testPoint.i);
            ctx.beginPath(); ctx.moveTo(pos.x, pos.y); ctx.lineTo(tpPos.x, tpPos.y);
            ctx.setLineDash([5, 5]); ctx.stroke(); ctx.setLineDash([]);
            
            let angle = Math.atan2(testPoint.i - z.i, testPoint.r - z.r) * 180 / Math.PI;
            if (angle < 0) angle += 360;
            sumAngle += angle;
            sumStr += `+ \\psi_z (${angle.toFixed(1)}^\\circ) `;
        });

        // Poles
        poles.forEach(p => {
            const pos = sToPix(p.r, p.i);
            ctx.strokeStyle = '#7c4dff'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(pos.x-5, pos.y-5); ctx.lineTo(pos.x+5, pos.y+5); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(pos.x+5, pos.y-5); ctx.lineTo(pos.x-5, pos.y+5); ctx.stroke();
            
            // Phasor
            const tpPos = sToPix(testPoint.r, testPoint.i);
            ctx.beginPath(); ctx.moveTo(pos.x, pos.y); ctx.lineTo(tpPos.x, tpPos.y);
            ctx.setLineDash([5, 5]); ctx.stroke(); ctx.setLineDash([]);
            
            let angle = Math.atan2(testPoint.i - p.i, testPoint.r - p.r) * 180 / Math.PI;
            if (angle < 0) angle += 360;
            sumAngle -= angle;
            sumStr += `- \\theta_p (${angle.toFixed(1)}^\\circ) `;
        });

        // Normalize sumAngle to [-180, 180]
        while(sumAngle <= -180) sumAngle += 360;
        while(sumAngle > 180) sumAngle -= 360;

        // Test Point
        const tpPos = sToPix(testPoint.r, testPoint.i);
        ctx.fillStyle = '#ff3d71';
        ctx.beginPath(); ctx.arc(tpPos.x, tpPos.y, 6, 0, Math.PI*2); ctx.fill();
        
        const isRoot = Math.abs(Math.abs(sumAngle) - 180) < 5;

        calcDiv.innerHTML = `
            <p><strong>Test Point $s$:</strong> ${testPoint.r.toFixed(2)} + j${testPoint.i.toFixed(2)}</p>
            <p><strong>Sum of Angles:</strong></p>
            $$ \\angle G(s)H(s) = \\Sigma \\psi_z - \\Sigma \\theta_p $$
            <p style="font-size:0.8rem; color:var(--text-secondary)">${sumStr} = <strong>${sumAngle.toFixed(1)}&deg;</strong></p>
            
            <div style="margin-top:1rem; padding:1rem; border-radius:8px; background: rgba(${isRoot?'105,255,71':'255,61,113'}, 0.1); border: 1px solid ${isRoot?'var(--accent-green)':'var(--accent-red)'}">
                <strong>Angle Criterion:</strong><br>
                ${isRoot ? 
                    'Sum is approximately odd multiples of 180&deg;. <span style="color:var(--accent-green)">Point IS on the Root Locus.</span>' : 
                    'Sum is NOT an odd multiple of 180&deg;. <span style="color:var(--accent-red)">Point is NOT on the Root Locus.</span>'}
            </div>
            <p style="margin-top:1rem; font-size:0.8rem; color:var(--text-secondary);">Drag the red test point.</p>
        `;
        if(window.renderMathInElement) window.renderMathInElement(calcDiv);
    }

    container.addEventListener('mousedown', (e) => { isDragging = true; updatePos(e); });
    window.addEventListener('mouseup', () => isDragging = false);
    container.addEventListener('mousemove', (e) => { if(isDragging) updatePos(e); });

    function updatePos(e) {
        const rect = canvas.getBoundingClientRect();
        testPoint = pixToS(e.clientX - rect.left, e.clientY - rect.top);
        draw();
    }

    window.addEventListener('resize', () => {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        draw();
    });

    setTimeout(draw, 100);
});

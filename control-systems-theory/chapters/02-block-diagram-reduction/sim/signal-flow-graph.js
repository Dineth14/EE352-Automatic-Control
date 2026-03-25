// sim/signal-flow-graph.js

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('canvas-sfg');
    const btnMason = document.getElementById('btn-compute-mason');
    const masonResults = document.getElementById('mason-results');
    if(!container || !btnMason || !masonResults) return;

    // Hardcoded SFG example for demonstration (interactive drawing is too complex for this MVP)
    // Structure:
    // N0 (R) -> N1 -> N2 -> N3 -> N4 (Y)
    // Nodes 1..3 have feedback/feedforward

    const canvas = document.createElement('canvas');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const nodes = [
        { id: 0, x: 50, y: 200, label: 'R' },
        { id: 1, x: 150, y: 200, label: 'x1' },
        { id: 2, x: 300, y: 200, label: 'x2' },
        { id: 3, x: 450, y: 200, label: 'x3' },
        { id: 4, x: 550, y: 200, label: 'Y' }
    ];

    const edges = [
        { from: 0, to: 1, gain: '1', type: 'line' },
        { from: 1, to: 2, gain: 'G1', type: 'line' },
        { from: 2, to: 3, gain: 'G2', type: 'line' },
        { from: 3, to: 4, gain: '1', type: 'line' },
        { from: 2, to: 1, gain: '-H1', type: 'arc', height: -50 }, // Feedback L1
        { from: 3, to: 2, gain: '-H2', type: 'arc', height: -50 }, // Feedback L2
        { from: 3, to: 1, gain: '-H3', type: 'arc', height: -100 } // Feedback L3 outer
    ];

    function drawSFG(highlightEdges = []) {
        ctx.clearRect(0,0,canvas.width,canvas.height);
        
        // Draw edges
        edges.forEach((e, idx) => {
            const n1 = nodes[e.from];
            const n2 = nodes[e.to];
            const isHighlight = highlightEdges.includes(idx);
            
            ctx.beginPath();
            ctx.strokeStyle = isHighlight ? '#00e5ff' : 'rgba(255,255,255,0.2)';
            ctx.lineWidth = isHighlight ? 4 : 2;
            ctx.fillStyle = ctx.strokeStyle;
            
            if(e.type === 'line') {
                ctx.moveTo(n1.x, n1.y);
                ctx.lineTo(n2.x, n2.y);
                ctx.stroke();
                
                // Arrow
                const midX = (n1.x + n2.x)/2;
                const midY = (n1.y + n2.y)/2;
                ctx.beginPath();
                ctx.moveTo(midX+5, midY); ctx.lineTo(midX-5, midY-5); ctx.lineTo(midX-5, midY+5); ctx.fill();
                
                // Label
                ctx.fillStyle = '#8a9bb5';
                ctx.font = '14px Inter';
                ctx.fillText(e.gain, midX, midY - 10);
                
            } else if (e.type === 'arc') {
                const midX = (n1.x + n2.x)/2;
                const controlY = n1.y + e.height*2; // cubic bezier approx for simple arc
                
                ctx.moveTo(n1.x, n1.y);
                ctx.quadraticCurveTo(midX, controlY, n2.x, n2.y);
                ctx.stroke();
                
                // Arrow at approx mid
                ctx.beginPath();
                ctx.moveTo(midX-5, n1.y + e.height); ctx.lineTo(midX+5, n1.y + e.height - 5); ctx.lineTo(midX+5, n1.y + e.height + 5); ctx.fill();

                // Label
                ctx.fillStyle = '#8a9bb5';
                ctx.fillText(e.gain, midX, n1.y + e.height - 10);
            }
        });

        // Draw nodes
        nodes.forEach(n => {
            ctx.beginPath();
            ctx.arc(n.x, n.y, 8, 0, Math.PI*2);
            ctx.fillStyle = '#131c30';
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#ffab40';
            ctx.stroke();
            
            ctx.fillStyle = '#e8edf8';
            ctx.font = 'bold 12px Inter';
            ctx.fillText(n.label, n.x - 10, n.y + 25);
        });
    }

    drawSFG();

    window.addEventListener('resize', () => {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        drawSFG();
    });

    // Mason's Logic
    let state = 0;
    btnMason.addEventListener('click', () => {
        if (state === 0) {
            drawSFG([0,1,2,3]); // Forward path
            masonResults.innerHTML = `
                <div class="fade-in-up stagger-1">
                    <strong>1. Forward Paths ($P_k$)</strong><br>
                    $P_1 = (1)(G_1)(G_2)(1) = G_1 G_2$<br>
                    No other forward paths.
                </div>
            `;
            if(window.renderMathInElement) window.renderMathInElement(masonResults);
            btnMason.innerText = "Next: Find Loops";
            state = 1;
        } else if (state === 1) {
            drawSFG([1,4, 2,5, 1,2,6]); // All loops
            masonResults.innerHTML += `
                <div class="fade-in-up stagger-1" style="margin-top:1rem;">
                    <strong>2. Individual Loops ($L_i$)</strong><br>
                    $L_1 = -G_1 H_1$<br>
                    $L_2 = -G_2 H_2$<br>
                    $L_3 = -G_1 G_2 H_3$
                </div>
            `;
            if(window.renderMathInElement) window.renderMathInElement(masonResults);
            btnMason.innerText = "Next: Non-touching";
            state = 2;
        } else if (state === 2) {
            drawSFG([4,5]); // Non touching
            masonResults.innerHTML += `
                <div class="fade-in-up stagger-1" style="margin-top:1rem;">
                    <strong>3. Non-touching Loops</strong><br>
                    Do $L_1$ and $L_2$ touch? No.<br>
                    Product = $L_1 L_2 = G_1 G_2 H_1 H_2$
                </div>
            `;
            if(window.renderMathInElement) window.renderMathInElement(masonResults);
            btnMason.innerText = "Next: Compute Delta";
            state = 3;
        } else if (state === 3) {
            drawSFG();
            const deltaStr = "1 - (L_1 + L_2 + L_3) + (L_1 L_2)";
            masonResults.innerHTML += `
                <div class="fade-in-up stagger-1" style="margin-top:1rem;">
                    <strong>4. Determinant $\\Delta$</strong><br>
                    $\\Delta = 1 + G_1 H_1 + G_2 H_2 + G_1 G_2 H_3 + G_1 G_2 H_1 H_2$<br><br>
                    <strong>5. Final Gain $T = \\frac{P_1}{\\Delta}$</strong><br>
                    $$ T = \\frac{G_1 G_2}{1 + G_1 H_1 + G_2 H_2 + G_1 G_2 H_3 + G_1 G_2 H_1 H_2} $$
                </div>
            `;
            if(window.renderMathInElement) window.renderMathInElement(masonResults);
            btnMason.style.display = 'none';
        }
    });

});

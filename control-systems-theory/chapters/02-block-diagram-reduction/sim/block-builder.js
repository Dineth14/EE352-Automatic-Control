// sim/block-builder.js

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('canvas-block-builder');
    const mathDisplay = document.getElementById('bd-math-display');
    const btnReduce = document.getElementById('btn-reduce');
    if(!container || !mathDisplay || !btnReduce) return;

    // We'll create a simple fixed layout simulation for demonstration
    // State: Unreduced -> Step 1 -> Step 2
    
    container.style.position = 'relative';
    container.innerHTML = `
        <div id="bb-system" style="position:absolute; width:100%; height:100%; display:flex; align-items:center; justify-content:center; transition: all 1s ease;">
            <!-- Custom CSS block diagram -->
            <div style="display:flex; align-items:center; gap: 10px;">
                <div class="bb-signal">R(s)</div>
                <div class="bb-arrow">→</div>
                
                <!-- Junction -->
                <div class="bb-junction" id="bb-j1">
                    <span>Σ</span>
                    <div class="bb-sign-plus" style="position:absolute; left:-15px;">+</div>
                    <div class="bb-sign-minus" style="position:absolute; bottom:-20px;">-</div>
                </div>
                
                <div class="bb-arrow">→</div>
                
                <!-- G(s) -->
                <div class="bb-block" id="bb-g">G(s)</div>
                
                <div class="bb-arrow">→</div>
                
                <!-- Branch point & Output -->
                <div class="bb-branch" id="bb-b1"></div>
                
                <div class="bb-arrow">→</div>
                <div class="bb-signal">Y(s)</div>
            </div>
            
            <!-- Feedback Path -->
            <!-- We use absolute positioning relative to the container for the feedback wire -->
            <svg id="bb-wires" style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:0;">
                <path id="bb-wire-fb" d="" fill="none" stroke="var(--accent-cyan)" stroke-width="2"/>
            </svg>
            <div class="bb-block" id="bb-h" style="position:absolute; top: 60%;">H(s)</div>
        </div>
    `;

    // Inject minimal CSS
    const style = document.createElement('style');
    style.innerHTML = `
        .bb-signal { font-weight: bold; color: var(--text-primary); }
        .bb-arrow { color: var(--accent-cyan); font-weight: bold; }
        .bb-block { background: rgba(0,229,255,0.1); border: 2px solid var(--accent-cyan); padding: 10px 20px; border-radius: 4px; box-shadow: 0 0 10px rgba(0,229,255,0.2); transition: all 0.5s ease; z-index:2; position:relative; }
        .bb-junction { width: 30px; height: 30px; border-radius: 50%; border: 2px solid var(--accent-amber); display:flex; align-items:center; justify-content:center; font-size:0.8rem; font-weight:bold; position:relative; background: var(--bg-primary); z-index:2; transition: all 0.5s ease; }
        .bb-branch { width: 8px; height: 8px; border-radius: 50%; background: var(--accent-cyan); position:relative; z-index:2; transition: all 0.5s ease; }
        .bb-glow { box-shadow: 0 0 20px 5px var(--accent-violet) !important; border-color: var(--accent-violet) !important; background: rgba(124,77,255,0.2) !important; }
    `;
    document.head.appendChild(style);

    // Initial drawing of wires
    function updateWires() {
        const j1 = document.getElementById('bb-j1').getBoundingClientRect();
        const b1 = document.getElementById('bb-b1').getBoundingClientRect();
        const h = document.getElementById('bb-h').getBoundingClientRect();
        const svg = document.getElementById('bb-wires').getBoundingClientRect();
        
        // Calculate relative centers
        const cxJ1 = j1.left + j1.width/2 - svg.left;
        const cyJ1 = j1.top + j1.height/2 - svg.top;
        
        const cxB1 = b1.left + b1.width/2 - svg.left;
        const cyB1 = b1.top + b1.height/2 - svg.top;
        
        const cxH = h.left + h.width/2 - svg.left;
        const cyH = h.top + h.height/2 - svg.top;

        // Position H block dynamically below the main line
        const bb_h = document.getElementById('bb-h');
        bb_h.style.left = (cxJ1 + (cxB1-cxJ1)/2 - h.width/2) + 'px';
        bb_h.style.top = (cyJ1 + 60) + 'px';

        const updatedH = document.getElementById('bb-h').getBoundingClientRect();
        const ncxH = updatedH.left + updatedH.width/2 - svg.left;
        const ncyH = updatedH.top + updatedH.height/2 - svg.top;

        // Draw feedback wire from B1 -> H -> J1
        const path = document.getElementById('bb-wire-fb');
        path.setAttribute('d', \`M \${cxB1} \${cyB1} L \${cxB1} \${ncyH} L \${ncxH + updatedH.width/2} \${ncyH} M \${ncxH - updatedH.width/2} \${ncyH} L \${cxJ1} \${ncyH} L \${cxJ1} \${cyJ1 + j1.height/2}\`);
    }

    // Wait for layout
    setTimeout(updateWires, 100);
    window.addEventListener('resize', updateWires);

    let state = 0;
    btnReduce.addEventListener('click', () => {
        const bbg = document.getElementById('bb-g');
        const bbh = document.getElementById('bb-h');
        const bbj1 = document.getElementById('bb-j1');
        const path = document.getElementById('bb-wire-fb');

        if(state === 0) {
            // Highlight loop
            bbg.classList.add('bb-glow');
            bbh.classList.add('bb-glow');
            bbj1.classList.add('bb-glow');
            path.style.stroke = 'var(--accent-violet)';
            
            mathDisplay.innerHTML = `$$ \\text{Identify feedback loop}\\quad \\Rightarrow \\quad T_{inner} = \\frac{G(s)}{1 + G(s)H(s)} $$`;
            if(window.renderMathInElement) window.renderMathInElement(mathDisplay);
            
            btnReduce.innerText = "Apply Reduction";
            state = 1;
        } else if (state === 1) {
            // Collapse
            bbh.style.opacity = '0';
            bbj1.style.opacity = '0';
            path.style.opacity = '0';
            
            setTimeout(() => {
                bbg.classList.remove('bb-glow');
                const p = document.getElementById('bb-system');
                p.innerHTML = `
                    <div style="display:flex; align-items:center; gap: 10px;">
                        <div class="bb-signal">R(s)</div>
                        <div class="bb-arrow">→</div>
                        <div class="bb-block" style="padding: 15px 30px; font-size:1.2rem;">
                            $$ \\frac{G(s)}{1 + G(s)H(s)} $$
                        </div>
                        <div class="bb-arrow">→</div>
                        <div class="bb-signal">Y(s)</div>
                    </div>
                `;
                if(window.renderMathInElement) window.renderMathInElement(p);
                mathDisplay.innerHTML = `$$ \\text{Equivalent System: } Y(s) = \\left[\\frac{G(s)}{1 + G(s)H(s)}\\right] R(s) $$`;
                if(window.renderMathInElement) window.renderMathInElement(mathDisplay);
                btnReduce.innerText = "Reset";
                state = 2;
            }, 500);
        } else {
            // Reset
            location.reload(); // Quick dirty reset for sim brevity
        }
    });
});

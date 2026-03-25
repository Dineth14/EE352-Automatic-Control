import { initTheme } from './theme.js';
import { initNav, getProgress } from './nav.js';
import { initKaTeX } from './katex-init.js';
import { createScene } from './three-setup.js';

const chaptersData = [
    { num: "01", title: "Laplace Transform", desc: "Foundations of dynamic system modeling.", path: "chapters/01-laplace-transfer-functions/index.html", color: 0x00e5ff },
    { num: "02", title: "Block Diagrams", desc: "Algebra of signal flow and loop reduction.", path: "chapters/02-block-diagram-reduction/index.html", color: 0x7c4dff },
    { num: "03", title: "State Space", desc: "Time-domain matrix representations.", path: "chapters/03-state-space/index.html", color: 0xffab40 },
    { num: "04", title: "Time Response", desc: "Transient and steady-state specifications.", path: "chapters/04-time-response/index.html", color: 0x69ff47 },
    { num: "05", title: "Root Locus", desc: "Closed-loop poles behavior under variable gain.", path: "chapters/05-root-locus/index.html", color: 0xff3d71 },
    { num: "06", title: "Frequency Response", desc: "Bode, Nyquist, and Nichols charts.", path: "chapters/06-frequency-response/index.html", color: 0x00e5ff },
    { num: "07", title: "Stability", desc: "Routh-Hurwitz and Lyapunov methods.", path: "chapters/07-stability/index.html", color: 0x7c4dff },
    { num: "08", title: "PID Controllers", desc: "Tuning, windup, and practical design.", path: "chapters/08-pid-controllers/index.html", color: 0xffab40 },
    { num: "09", title: "Digital Control", desc: "z-Transform and discrete systems.", path: "chapters/09-digital-control/index.html", color: 0x69ff47 },
    { num: "10", title: "Modern Control", desc: "LQR, Kalman Filters, and LQG.", path: "chapters/10-modern-control/index.html", color: 0xff3d71 }
];

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initNav();
    initKaTeX();
    
    // Jump selector
    const jumpSelect = document.getElementById('chapter-jump');
    if(jumpSelect) {
        jumpSelect.addEventListener('change', (e) => {
            if(e.target.value) {
                window.location.href = e.target.value;
            }
        });
    }

    renderChaptersGrid();
    renderProgress();
    initHeroScene();
});

function renderChaptersGrid() {
    const grid = document.querySelector('.chapters-grid');
    if(!grid) return;
    
    const progress = getProgress();
    
    chaptersData.forEach((ch, idx) => {
        const isVisited = progress[parseInt(ch.num)] ? true : false;
        
        const card = document.createElement('a');
        card.href = ch.path;
        card.className = "glass-card chapter-card stagger-" + (Math.min(5, idx%5 + 1));
        
        card.innerHTML = `
            <div class="chapter-thumbnail" id="thumb-${ch.num}">
                <div class="chapter-badge">CH ${ch.num}</div>
                <!-- Mini 3D canvas goes here -->
            </div>
            <h3 class="chapter-title">${ch.title}</h3>
            <p class="chapter-desc">${ch.desc}</p>
            <div class="explore-link">
                Explore <span>→</span>
                <span style="margin-left:auto; font-size:0.8rem; color: ${isVisited ? 'var(--accent-green)' : 'var(--text-secondary)'}">
                    ${isVisited ? '✓ Visited' : 'Pending'}
                </span>
            </div>
        `;
        grid.appendChild(card);
        
        // Init a tiny three.js scene for the thumbnail
        setTimeout(() => initThumbnailScene(`thumb-${ch.num}`, ch.color), 100);
    });
}

function renderProgress() {
    const progress = getProgress();
    const hexGrid = document.getElementById('progress-hex-grid');
    let completed = 0;
    
    for(let i=1; i<=10; i++) {
        const isCompleted = progress[i];
        if (isCompleted) completed++;
        
        const hex = document.createElement('div');
        hex.style.width = '40px';
        hex.style.height = '40px';
        hex.style.clipPath = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';
        hex.style.display = 'flex';
        hex.style.alignItems = 'center';
        hex.style.justifyContent = 'center';
        hex.style.fontSize = '0.8rem';
        hex.style.fontWeight = 'bold';
        hex.style.backgroundColor = isCompleted ? 'var(--accent-cyan)' : 'var(--bg-tertiary)';
        hex.style.color = isCompleted ? 'var(--bg-primary)' : 'var(--text-secondary)';
        hex.innerHTML = i;
        hexGrid.appendChild(hex);
    }
    
    const text = document.getElementById('progress-percentage-text');
    if(text) text.innerText = (completed * 10) + '%';
}

// Global Hero Scene
function initHeroScene() {
    const setup = createScene('hero-canvas-container', { cameraZ: 50 });
    if (!setup) return;
    const { scene, camera, renderer, mouse } = setup;

    // Post processing
    const renderScene = new THREE.RenderPass(scene, camera);
    const bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    bloomPass.threshold = 0.2;
    bloomPass.strength = 1.2;
    bloomPass.radius = 0.5;

    const composer = new THREE.EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    // Create a network of dynamic nodes representing control systems
    const group = new THREE.Group();
    scene.add(group);

    const nodeCount = 40;
    const geometry = new THREE.SphereGeometry(0.5, 16, 16);
    const materialCyan = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
    const materialViolet = new THREE.MeshBasicMaterial({ color: 0x7c4dff });

    const nodes = [];
    for(let i=0; i<nodeCount; i++) {
        const mesh = new THREE.Mesh(geometry, Math.random() > 0.5 ? materialCyan : materialViolet);
        mesh.position.set(
            (Math.random() - 0.5) * 60,
            (Math.random() - 0.5) * 40,
            (Math.random() - 0.5) * 40
        );
        mesh.userData = {
            velocity: new THREE.Vector3((Math.random()-0.5)*0.05, (Math.random()-0.5)*0.05, (Math.random()-0.5)*0.05)
        };
        group.add(mesh);
        nodes.push(mesh);
    }

    // Edges
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.15 });
    
    const edges = [];
    for(let i=0; i<nodes.length; i++) {
        for(let j=i+1; j<nodes.length; j++) {
            if (nodes[i].position.distanceTo(nodes[j].position) < 15) {
                const geo = new THREE.BufferGeometry().setFromPoints([nodes[i].position, nodes[j].position]);
                const line = new THREE.Line(geo, lineMaterial);
                group.add(line);
                edges.push({line, a: nodes[i], b: nodes[j]});
            }
        }
    }

    let clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        
        let dt = clock.getDelta();
        
        // Slowly rotate whole group
        group.rotation.y += 0.05 * dt;
        group.rotation.x += 0.02 * dt;

        // Camera parallax based on mouse
        camera.position.x += (mouse.x * 0.02 - camera.position.x) * 0.05;
        camera.position.y += (-mouse.y * 0.02 - camera.position.y) * 0.05;
        camera.lookAt(scene.position);

        composer.render();
    }
    animate();
}

function initThumbnailScene(containerId, colorHex) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.z = 10;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    
    // Create an absolute positioned div for the canvas so it sits behind the badge
    const canvasWrapper = document.createElement('div');
    canvasWrapper.className = "chapter-thumbnail-canvas";
    canvasWrapper.style.position = "absolute";
    canvasWrapper.style.top = "0";
    canvasWrapper.style.left = "0";
    canvasWrapper.appendChild(renderer.domElement);
    container.appendChild(canvasWrapper);

    const geo = new THREE.IcosahedronGeometry(2.5, 1);
    const mat = new THREE.MeshBasicMaterial({ color: colorHex, wireframe: true, transparent: true, opacity: 0.5 });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    function animate() {
        requestAnimationFrame(animate);
        mesh.rotation.x += 0.01;
        mesh.rotation.y += 0.02;
        renderer.render(scene, camera);
    }
    animate();
}

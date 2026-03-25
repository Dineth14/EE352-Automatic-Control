import { createScene } from '../../assets/js/three-setup.js';

document.addEventListener('DOMContentLoaded', () => {
    const setup = createScene('hero-canvas-ch9', { cameraZ: 25 });
    if (!setup) return;
    const { scene, camera, renderer, mouse } = setup;

    // A visual showing continuous vs discrete Data
    // A 3D sine wave intersecting vertical pillars (samples)
    
    const group = new THREE.Group();
    scene.add(group);

    // Continuous Wave
    const waveMat = new THREE.LineBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.6, linewidth: 2 });
    const waveGeo = new THREE.BufferGeometry();
    const pts = [];
    for(let x=-15; x<=15; x+=0.1) {
        pts.push(new THREE.Vector3(x, Math.sin(x)*4, 0));
    }
    waveGeo.setFromPoints(pts);
    const wave = new THREE.Line(waveGeo, waveMat);
    group.add(wave);

    // Discrete Stems (Pillars)
    const stemsGeo = new THREE.CylinderGeometry(0.1, 0.1, 1, 8);
    const stemMat = new THREE.MeshBasicMaterial({ color: 0xffab40 });
    const headGeo = new THREE.SphereGeometry(0.3, 16, 16);
    
    const numSamples = 30;
    const dx = 30 / numSamples;
    const stems = [];

    for(let i=0; i<=numSamples; i++) {
        const x = -15 + i*dx;
        
        // Stalk
        const stalk = new THREE.Mesh(stemsGeo, stemMat);
        group.add(stalk);
        
        // Head
        const head = new THREE.Mesh(headGeo, stemMat);
        group.add(head);
        
        stems.push({ stalk, head, x });
    }

    // A floating grid to represent the digital Z-domain below
    const grid = new THREE.GridHelper(40, 40, 0x131c30, 0x131c30);
    grid.position.y = -6;
    scene.add(grid);

    camera.position.set(0, 5, 20);
    camera.lookAt(0,0,0);

    let tAnim = 0;

    function animate() {
        requestAnimationFrame(animate);
        tAnim += 0.05;

        // Wave travels
        for(let i=0; i<pts.length; i++) {
            const x = pts[i].x;
            pts[i].y = Math.sin(x + tAnim)*4;
        }
        waveGeo.setFromPoints(pts);
        
        // Samples follow wave
        stems.forEach(s => {
            const y = Math.sin(s.x + tAnim)*4;
            s.head.position.set(s.x, y, 0);
            
            s.stalk.scale.y = Math.max(0.01, Math.abs(y));
            s.stalk.position.set(s.x, y/2, 0);
        });

        group.rotation.x = mouse.y * 0.2;
        group.rotation.y = mouse.x * 0.3;

        renderer.render(scene, camera);
    }
    animate();
});

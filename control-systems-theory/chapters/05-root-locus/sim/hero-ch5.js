import { createScene } from '../../assets/js/three-setup.js';

document.addEventListener('DOMContentLoaded', () => {
    const setup = createScene('hero-canvas-ch5', { cameraZ: 25 });
    if (!setup) return;
    const { scene, camera, renderer, mouse } = setup;

    // Draw splane grid
    const gridHelper = new THREE.GridHelper(20, 20, 0x00e5ff, 0x00e5ff);
    gridHelper.material.transparent = true; gridHelper.material.opacity = 0.15;
    gridHelper.rotation.x = Math.PI/2;
    scene.add(gridHelper);

    // Root locus branches (3D curves for dramatic effect, normally 2D)
    // We will draw a classic 3-pole root locus that breaks away and goes to asymptotes
    const branches = new THREE.Group();
    scene.add(branches);

    const matBranch = new THREE.LineBasicMaterial({ color: 0xffab40, linewidth: 3 });
    const matPole = new THREE.MeshBasicMaterial({ color: 0x7c4dff });

    // Open loop poles at 0, -2, -4
    const poles = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(-2, 0, 0),
        new THREE.Vector3(-4, 0, 0)
    ];

    poles.forEach(p => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), matPole);
        mesh.position.copy(p);
        mesh.rotation.z = Math.PI/4; // Diamond shape (X)
        branches.add(mesh);
    });

    // Approximate trajectories instead of precise solving for real-time 3D look
    // Branch 1: 0 to -0.85 then up (j omega)
    // Branch 2: -2 to -0.85 then down (-j omega)
    // Branch 3: -4 to -infinity
    
    const pts1=[], pts2=[], pts3=[];
    for(let k=0; k<=50; k++) {
        const t = k/50;
        if(t < 0.2) {
            // on axis
            pts1.push(new THREE.Vector3(0 - t*5*0.85, 0, 0));
            pts2.push(new THREE.Vector3(-2 + t*5*1.15, 0, 0));
        } else {
            // breakaway curve
            const dy = (t-0.2)*10;
            const dx = -0.85 + (t-0.2)*2; // slant towards asymptote theta = 60
            pts1.push(new THREE.Vector3(dx, dy, 0));
            pts2.push(new THREE.Vector3(dx, -dy, 0));
        }
        pts3.push(new THREE.Vector3(-4 - t*10, 0, 0));
    }

    const curve1 = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts1), matBranch);
    const curve2 = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts2), matBranch);
    const curve3 = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts3), matBranch);

    branches.add(curve1); branches.add(curve2); branches.add(curve3);

    // Particles moving along loci representing closed-loop poles
    const pGeo = new THREE.SphereGeometry(0.3, 16, 16);
    const pMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
    const cPole1 = new THREE.Mesh(pGeo, pMat);
    const cPole2 = new THREE.Mesh(pGeo, pMat);
    const cPole3 = new THREE.Mesh(pGeo, pMat);
    branches.add(cPole1); branches.add(cPole2); branches.add(cPole3);

    let kSim = 0;

    camera.position.set(0, 0, 15);

    function animate() {
        requestAnimationFrame(animate);

        kSim += 0.005;
        if(kSim >= 1) kSim = 0;

        const idx = Math.floor(kSim * 50);
        if(idx < 50 && pts1[idx]) {
            cPole1.position.copy(pts1[idx]);
            cPole2.position.copy(pts2[idx]);
            cPole3.position.copy(pts3[idx]);
        }

        branches.rotation.y = Math.sin(Date.now()*0.001)*0.2 + mouse.x * 0.5;
        branches.rotation.x = mouse.y * 0.5;

        renderer.render(scene, camera);
    }
    animate();
});

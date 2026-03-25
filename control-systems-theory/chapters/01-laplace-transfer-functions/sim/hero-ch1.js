import { createScene, MaterialFactory } from '../../assets/js/three-setup.js';

document.addEventListener('DOMContentLoaded', () => {
    const setup = createScene('hero-canvas-ch1', { cameraZ: 25 });
    if (!setup) return;
    const { scene, camera, renderer, mouse } = setup;

    // A shimmering grid to represent the complex plane
    const gridHelper = new THREE.GridHelper(60, 60, 0x00e5ff, 0x00e5ff);
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.1;
    gridHelper.rotation.x = Math.PI / 2; // Flat on the XY plane for conventional s-plane (x=real, y=imag)
    scene.add(gridHelper);

    // Add poles (violet spikes) and zeros (cyan funnels)
    const poleMat = MaterialFactory.createPoleMaterial();
    const zeroMat = MaterialFactory.createZeroMaterial();
    
    // Spikes for poles
    const poleGeo = new THREE.ConeGeometry(0.5, 6, 16);
    poleGeo.translate(0, 3, 0); // Base at 0
    
    // Funnels for zeros
    const zeroGeo = new THREE.ConeGeometry(0.5, 6, 16);
    zeroGeo.rotateX(Math.PI); // Point down
    zeroGeo.translate(0, -3, 0);

    const elements = [];

    // Create a few poles and zeros dynamically
    for(let i=0; i<6; i++) {
        // Left half plane predominantly
        const x = (Math.random() * -10) - 1;
        const y = (Math.random() - 0.5) * 20;
        
        // Add conjugate pair for realism
        const p1 = new THREE.Mesh(poleGeo, poleMat);
        p1.position.set(x, y, 0);
        p1.rotation.x = Math.PI/2; // Orient along Z axis out of the plane
        scene.add(p1);
        
        const p2 = new THREE.Mesh(poleGeo, poleMat);
        p2.position.set(x, -y, 0);
        p2.rotation.x = Math.PI/2;
        scene.add(p2);
        
        elements.push(p1, p2);

        // Zeros
        if (i%2===0) {
            const zx = (Math.random() * 15) - 5;
            const zy = (Math.random() - 0.5) * 15;
            const z1 = new THREE.Mesh(zeroGeo, zeroMat);
            z1.position.set(zx, zy, 0);
            z1.rotation.x = Math.PI/2;
            scene.add(z1);
            
            const z2 = new THREE.Mesh(zeroGeo, zeroMat);
            z2.position.set(zx, -zy, 0);
            z2.rotation.x = Math.PI/2;
            scene.add(z2);
            elements.push(z1, z2);
        }
    }

    camera.position.set(0, -15, 20);
    camera.lookAt(0,0,0);

    let t = 0;
    function animate() {
        requestAnimationFrame(animate);
        t += 0.01;
        
        // Floating effect
        elements.forEach((el, index) => {
            el.position.z = Math.sin(t + index) * 0.5;
            el.scale.y = 1 + Math.sin(t*2 + index)*0.1;
        });

        // Parallax
        camera.position.x += (mouse.x * 0.05 - camera.position.x) * 0.05;
        camera.position.y += (-mouse.y * 0.05 - 15 - camera.position.y) * 0.05;
        camera.lookAt(0,0,0);

        renderer.render(scene, camera);
    }
    animate();
});

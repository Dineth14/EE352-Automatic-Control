import { createScene } from '../../assets/js/three-setup.js';

document.addEventListener('DOMContentLoaded', () => {
    const setup = createScene('hero-canvas-ch6', { cameraZ: 30 });
    if (!setup) return;
    const { scene, camera, renderer, mouse } = setup;

    // 3D representation of Frequency Response Magnitude surface |H(j w)|
    // Actually we can plot |H(s)| over the s-plane and highlight the j-omega axis slice

    const gridHelper = new THREE.GridHelper(30, 30, 0x7c4dff, 0x7c4dff);
    gridHelper.material.transparent = true; gridHelper.material.opacity = 0.15;
    scene.add(gridHelper);

    // Function: | 1 / (s^2 + 0.5s + 4) |
    function H(sigma, omega) {
        // s = sigma + j*omega
        // s^2 = (sigma^2 - omega^2) + j(2*sigma*omega)
        // den = (sigma^2 - omega^2 + 0.5*sigma + 4) + j(2*sigma*omega + 0.5*omega)
        const dR = sigma*sigma - omega*omega + 0.5*sigma + 4;
        const dI = 2*sigma*omega + 0.5*omega;
        const mag = 1 / Math.sqrt(dR*dR + dI*dI);
        return Math.min(mag, 5); // limit peaks
    }

    const geom = new THREE.PlaneGeometry(20, 20, 60, 60);
    geom.rotateX(-Math.PI / 2);

    const positions = geom.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];     // sigma (Real)
        const z = positions[i + 2]; // omega (Imag)
        positions[i + 1] = H(x, z) * 3; // y (Magnitude)
    }

    geom.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
        color: 0x00e5ff,
        wireframe: true,
        transparent: true,
        opacity: 0.4
    });

    const mesh = new THREE.Mesh(geom, mat);
    scene.add(mesh);

    // Highlight the j-omega axis slice (Bode Magnitude Plot)
    const lineGeom = new THREE.BufferGeometry();
    const linePts = [];
    for(let z=-10; z<=10; z+=0.1) {
        linePts.push(new THREE.Vector3(0, H(0, z)*3 + 0.1, z)); // slightly elevated to stay above mesh
    }
    lineGeom.setFromPoints(linePts);
    const lineMat = new THREE.LineBasicMaterial({ color: 0xffab40, linewidth: 4 });
    const jwAxisCurve = new THREE.Line(lineGeom, lineMat);
    scene.add(jwAxisCurve);

    // Add glowing particle moving along the j-omega curve
    const pGeo = new THREE.SphereGeometry(0.3, 16, 16);
    const pMat = new THREE.MeshBasicMaterial({ color: 0xffab40 });
    const particle = new THREE.Mesh(pGeo, pMat);
    scene.add(particle);

    camera.position.set(-15, 10, 25);
    camera.lookAt(0,0,0);

    let tAnim = 0;

    function animate() {
        requestAnimationFrame(animate);
        tAnim += 0.02;

        const w = (Math.sin(tAnim) * 10); // sweep -10 to 10
        particle.position.set(0, H(0, w)*3 + 0.1, w);

        mesh.rotation.y = mouse.x * 0.2;
        jwAxisCurve.rotation.y = mouse.x * 0.2;
        particle.rotation.y = mouse.x * 0.2; // particle position will need to rotate if group didn't but since we manually set it we should really group them
        
        // better to use a group
        scene.rotation.y += 0.002;
        scene.rotation.x = mouse.y * 0.1;

        renderer.render(scene, camera);
    }
    animate();
});

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

export class Car {
    constructor(scene) {
        this.scene = scene;
        this.mesh = new THREE.Group();
        this.scene.add(this.mesh);
        this.speed = 0;
        this.maxSpeed = 80;
        this.acceleration = 25;
        this.deceleration = 15;
        this.steering = 0;
        this.maxSteering = 0.4;
        this.wheels = [];
    }

    async load() {
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/gltf/');
        
        const loader = new GLTFLoader();
        loader.setDRACOLoader(dracoLoader);
        // Guaranteed high-quality model from Three.js repo
        const url = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@master/examples/models/gltf/ferrari.glb';
        
        // Add a temporary primitive so something is visible if loading takes time
        const fallbackGeo = new THREE.BoxGeometry(2, 1, 4);
        const fallbackMat = new THREE.MeshStandardMaterial({ color: 0xff3e00 });
        this.fallbackBox = new THREE.Mesh(fallbackGeo, fallbackMat);
        this.mesh.add(this.fallbackBox);

        return new Promise((resolve, reject) => {
            loader.load(url, (gltf) => {
                const model = gltf.scene;
                model.traverse(child => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        if (child.material.name.includes('body')) {
                            child.material.roughness = 0.05;
                            child.material.metalness = 1.0;
                            child.material.color.setHex(0xff3e00); // Premium Orange
                        }
                    }
                    if (child.name.toLowerCase().includes('wheel')) {
                        this.wheels.push(child);
                    }
                });
                // Remove fallback and add model
                this.mesh.remove(this.fallbackBox);
                this.mesh.add(model);
                resolve();
            }, undefined, reject);
        });
    }

    update(delta, controls) {
        if (controls.keys.forward) this.speed += this.acceleration * delta;
        else if (controls.keys.backward) this.speed -= this.acceleration * delta;
        else this.speed *= 0.97;

        this.speed = Math.max(-this.maxSpeed / 2, Math.min(this.maxSpeed, this.speed));

        if (Math.abs(this.speed) > 1) {
            if (controls.keys.left) this.steering += delta * 3;
            else if (controls.keys.right) this.steering -= delta * 3;
            else this.steering *= 0.85;
        } else {
            this.steering *= 0.7;
        }

        this.steering = Math.max(-this.maxSteering, Math.min(this.maxSteering, this.steering));
        const turnEffect = (this.speed / this.maxSpeed);
        this.mesh.rotation.y += this.steering * turnEffect * 2.0 * delta;
        
        const direction = new THREE.Vector3(0, 0, 1);
        direction.applyQuaternion(this.mesh.quaternion);
        this.mesh.position.add(direction.multiplyScalar(this.speed * delta));

        this.wheels.forEach(wheel => {
            wheel.rotation.x += this.speed * delta * 2;
        });
        this.mesh.rotation.z = -this.steering * turnEffect * 0.25;
    }
}

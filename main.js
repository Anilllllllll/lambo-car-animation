import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

import { Car } from './Car.js';
import { Environment } from './Environment.js';
import { Controls } from './Controls.js';

class Game {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.loadingScreen = document.getElementById('loading-screen');
        this.speedElement = document.getElementById('speed-value');
        
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        
        this.init();
    }

    async init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        this.camera.position.set(0, 5, -10);
        this.camera.lookAt(0, 0, 5);

        this.controls = new Controls();
        this.environment = new Environment(this.scene);
        this.car = new Car(this.scene);

        try {
            await Promise.all([
                this.environment.load(),
                this.car.load()
            ]);
        } catch (error) {
            console.error("Failed to load assets:", error);
        }

        this.initPostProcessing();

        this.loadingScreen.style.opacity = '0';
        setTimeout(() => this.loadingScreen.style.display = 'none', 800);
        document.body.classList.add('in-game');

        window.addEventListener('resize', () => this.onWindowResize());
        this.animate();
    }

    initPostProcessing() {
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));

        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.6, 0.4, 0.85
        );
        this.composer.addPass(bloomPass);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }

    updateHUD() {
        const speed = Math.round(Math.abs(this.car.speed) * 3.6);
        this.speedElement.innerText = speed;
    }

    updateCamera() {
        const targetOffset = new THREE.Vector3(0, 3, -12);
        targetOffset.applyQuaternion(this.car.mesh.quaternion);
        const targetPos = this.car.mesh.position.clone().add(targetOffset);
        this.camera.position.lerp(targetPos, 0.05);
        
        const lookTarget = this.car.mesh.position.clone().add(new THREE.Vector3(0, 1, 10).applyQuaternion(this.car.mesh.quaternion));
        this.camera.lookAt(lookTarget);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const delta = 0.016;
        this.car.update(delta, this.controls);
        this.environment.update(this.car.mesh.position.z);
        this.updateCamera();
        this.updateHUD();
        this.composer.render();
    }
}

new Game();

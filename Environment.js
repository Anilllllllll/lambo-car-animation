import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

export class Environment {
    constructor(scene) {
        this.scene = scene;
        this.roadTileSize = 100;
        this.tiles = [];
        this.obstacles = [];
        this.numTiles = 12;
        this.initLights();
    }

    initLights() {
        const sun = new THREE.DirectionalLight(0xffffff, 3);
        sun.position.set(100, 200, 100);
        sun.castShadow = true;
        sun.shadow.camera.left = -150;
        sun.shadow.camera.right = 150;
        sun.shadow.camera.top = 150;
        sun.shadow.camera.bottom = -150;
        sun.shadow.mapSize.width = 4096;
        sun.shadow.mapSize.height = 4096;
        this.scene.add(sun);

        const ambient = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambient);
        this.scene.fog = new THREE.FogExp2(0x0a0a0a, 0.003);
    }

    async load() {
        const rgbeLoader = new RGBELoader();
        const hdriUrl = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/equirectangular/venice_sunset_1k.hdr';
        
        await new Promise((resolve) => {
            rgbeLoader.load(hdriUrl, (texture) => {
                texture.mapping = THREE.EquirectangularReflectionMapping;
                this.scene.environment = texture;
                resolve();
            });
        });
        this.createRoad();
    }

    createRoad() {
        const roadGroup = new THREE.Group();
        this.scene.add(roadGroup);

        const roadGeo = new THREE.PlaneGeometry(30, this.roadTileSize);
        const roadMat = new THREE.MeshStandardMaterial({ 
            color: 0x111111, roughness: 0.6, metalness: 0.2 
        });

        const decorGeo = new THREE.BoxGeometry(2, 20, 2);
        const decorMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.2 });

        for (let i = 0; i < this.numTiles; i++) {
            const tile = new THREE.Mesh(roadGeo, roadMat);
            tile.rotation.x = -Math.PI / 2;
            tile.position.z = i * this.roadTileSize;
            tile.receiveShadow = true;
            
            // Markings
            const stripGeo = new THREE.PlaneGeometry(0.5, 6);
            const stripMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
            for(let j = -this.roadTileSize/2; j < this.roadTileSize/2; j += 15) {
                const strip = new THREE.Mesh(stripGeo, stripMat);
                strip.position.y = 0.02;
                strip.position.z = j;
                tile.add(strip);
            }

            // Side Decoration (Pillars / Buildings) for scale
            for (let side = -1; side <= 1; side += 2) {
                const pillar = new THREE.Mesh(decorGeo, decorMat);
                pillar.position.set(side * 25, 10, 0);
                pillar.castShadow = true;
                tile.add(pillar);
            }

            roadGroup.add(tile);
            this.tiles.push(tile); // Renamed from roadTiles

            // Spawn obstacles on new tiles (except the very first few)
            if (tile.position.z > 50) {
                this.spawnObstacles(tile.position.z);
            }
        }
    }

    spawnObstacles(z) {
        // Always spawn 1-3 cones per tile
        const count = Math.floor(Math.random() * 3) + 1;
        const lanes = [-8, -4, 0, 4, 8]; // more lane options across 30-unit wide road

        for (let c = 0; c < count; c++) {
            const obstacleGeo = new THREE.ConeGeometry(0.7, 2.0, 8); // taller & wider
            const obstacleMat = new THREE.MeshStandardMaterial({
                color: 0xff6600,
                emissive: 0xff4400,       // glows orange even without HDR
                emissiveIntensity: 0.6,
                roughness: 0.4,
                metalness: 0.1
            });
            const obstacle = new THREE.Mesh(obstacleGeo, obstacleMat);

            const lane = lanes[Math.floor(Math.random() * lanes.length)];
            // Spread cones across the tile length, but not in the first 20 units
            const offsetZ = 20 + Math.random() * (this.roadTileSize - 30);
            obstacle.position.set(lane, 1.0, z - this.roadTileSize / 2 + offsetZ);
            obstacle.castShadow = true;
            this.scene.add(obstacle);
            this.obstacles.push(obstacle);
        }
    }

    update(carZ) {
        // Clean up old obstacles
        this.obstacles = this.obstacles.filter(obj => {
            if (obj.position.z < carZ - 50) {
                this.scene.remove(obj);
                return false;
            }
            return true;
        });

        // Existing tile update logic...
        this.tiles.forEach(tile => { // Renamed from roadTiles
            if (carZ - tile.position.z > this.roadTileSize * 2) {
                tile.position.z += this.numTiles * this.roadTileSize;
                // Spawn new obstacles when a tile loops around
                this.spawnObstacles(tile.position.z);
            } else if (tile.position.z - carZ > (this.numTiles - 2) * this.roadTileSize) {
                tile.position.z -= this.numTiles * this.roadTileSize;
                // No need to spawn obstacles for backward movement, as they would be behind the car
            }
        });
    }

    reset() {
        // Remove all obstacles
        this.obstacles.forEach(obj => this.scene.remove(obj));
        this.obstacles = [];

        // Reset road tiles to their original positions and re-spawn obstacles
        this.tiles.forEach((tile, i) => {
            tile.position.z = i * this.roadTileSize;
            // Re-spawn obstacles on tiles ahead of the start (same rule as initial creation)
            if (tile.position.z > 100) {
                this.spawnObstacles(tile.position.z);
            }
        });
    }
}

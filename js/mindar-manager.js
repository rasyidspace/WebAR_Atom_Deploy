import { MindARThree } from 'mindar-image-three';
import * as THREE from 'three';

export class MindARManager {
    constructor(containerId, markerPath) {
        this.container = document.getElementById(containerId);
        
        // Initialize MindAR with the Three.js wrapper
        this.mindarThree = new MindARThree({
            container: this.container,
            imageTargetSrc: markerPath,
            uiScanning: 'no', // Disable default scanning UI, we build our own
            uiLoading: 'no',  // Disable default loading UI
            filterMinCF: 0.0001,
            filterBeta: 0.001
        });
        
        this.scene = this.mindarThree.scene;
        this.camera = this.mindarThree.camera;
        this.renderer = this.mindarThree.renderer;
        
        // Setup Renderer optimizations for mobile
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Setup Lighting
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
        hemiLight.position.set(0, 20, 0);
        this.scene.add(hemiLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
        dirLight.position.set(5, 10, 5);
        dirLight.castShadow = true;
        
        // Optimize shadow map
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        
        this.scene.add(dirLight);

        // Add Image Target Anchor (0 is the first marker in the .mind file)
        this.anchor = this.mindarThree.addAnchor(0);
        
        // Callbacks
        this.onTargetFound = null;
        this.onTargetLost = null;
        
        this.anchor.onTargetFound = () => {
            if (this.onTargetFound) this.onTargetFound();
        };
        
        this.anchor.onTargetLost = () => {
            if (this.onTargetLost) this.onTargetLost();
        };
        
        this.updatables = [];
    }

    addUpdatable(obj) {
        if (typeof obj.update === 'function') {
            this.updatables.push(obj);
        }
    }

    attachModel(model) {
        // Ensure model casts/receives shadows
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        this.anchor.group.add(model);
    }

    async start() {
        // Request permissions and start video feed
        await this.mindarThree.start();
        
        // Start render loop
        this.renderer.setAnimationLoop(() => {
            const delta = this.mindarThree.clock ? this.mindarThree.clock.getDelta() : 0.016;
            
            // Update animations or logics
            for (const obj of this.updatables) {
                obj.update(delta);
            }
            
            this.renderer.render(this.scene, this.camera);
        });
    }

    stop() {
        this.mindarThree.stop();
        this.renderer.setAnimationLoop(null);
    }
}

import * as THREE from 'three';

export class ThreeScene {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error("ThreeScene: Canvas element not found!");
            return;
        }

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color('#FFFBF5'); // Cream background

        // Camera
        this.camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            0.1,
            100
        );
        this.camera.position.set(0, 1.5, 4);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: false
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Clamp pixel ratio for mobile
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Clock
        this.clock = new THREE.Clock();
        
        // Loop callbacks
        this.updatables = [];

        this.setupLighting();
        this.setupResizeHandler();
    }

    setupLighting() {
        // Hemisphere Light (soft ambient)
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
        hemiLight.position.set(0, 20, 0);
        this.scene.add(hemiLight);

        // Directional Light (main sun/shadow caster)
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
        dirLight.position.set(5, 10, 5);
        dirLight.castShadow = true;
        
        dirLight.shadow.camera.top = 5;
        dirLight.shadow.camera.bottom = -5;
        dirLight.shadow.camera.left = -5;
        dirLight.shadow.camera.right = 5;
        dirLight.shadow.camera.near = 0.1;
        dirLight.shadow.camera.far = 20;
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        
        this.scene.add(dirLight);
    }

    setupResizeHandler() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    addUpdatable(obj) {
        if (typeof obj.update === 'function') {
            this.updatables.push(obj);
        }
    }

    startLoop() {
        this.renderer.setAnimationLoop(() => {
            const delta = this.clock.getDelta();
            
            // Update all updatables (like OrbitControls or AnimationMixer)
            for (const updatable of this.updatables) {
                updatable.update(delta);
            }
            
            this.renderer.render(this.scene, this.camera);
        });
    }

    dispose() {
        this.renderer.setAnimationLoop(null);
        this.renderer.dispose();
        // Clean up geometries and materials can be done here if needed
    }
}

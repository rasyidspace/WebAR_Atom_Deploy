import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class InteractionManager {
    constructor(camera, domElement) {
        this.camera = camera;
        this.controls = new OrbitControls(camera, domElement);
        
        // Configure controls for a smooth, premium feel
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enablePan = true;
        this.controls.enableZoom = true;
        
        // Limits
        this.controls.minDistance = 1;
        this.controls.maxDistance = 10;
        
        // Auto rotation
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 1.0;
        
        this.defaultPosition = { x: 0, y: 1.5, z: 4 };
    }

    resetCamera() {
        this.camera.position.set(
            this.defaultPosition.x, 
            this.defaultPosition.y, 
            this.defaultPosition.z
        );
        this.controls.target.set(0, 0, 0);
    }

    update() {
        this.controls.update();
    }
}

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
        
        // AR specific interaction state
        this.arMode = false;
        this.targetModel = null;
        this.previousTouch = null;
        this.previousPinchDist = null;
        this.baseScale = null;
        
        this.setupTouchGestures(domElement);
    }

    setupTouchGestures(domElement) {
        domElement.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
        domElement.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
        domElement.addEventListener('touchend', this.onTouchEnd.bind(this));
    }
    
    setARMode(enabled) {
        this.arMode = enabled;
        this.controls.enabled = !enabled; // Disable OrbitControls in AR mode
    }

    setTargetModel(model) {
        this.targetModel = model;
        if (model) {
            this.baseScale = model.scale.clone();
        }
    }

    onTouchStart(e) {
        if (!this.arMode || !this.targetModel) return;
        
        if (e.touches.length === 1) {
            this.previousTouch = { x: e.touches[0].pageX, y: e.touches[0].pageY };
        } else if (e.touches.length === 2) {
            this.previousPinchDist = this.getPinchDistance(e.touches);
            this.baseScale = this.targetModel.scale.clone();
        }
    }

    onTouchMove(e) {
        if (!this.arMode || !this.targetModel) return;
        
        if (e.touches.length === 1 && this.previousTouch) {
            // One finger rotate
            const deltaX = e.touches[0].pageX - this.previousTouch.x;
            this.targetModel.rotation.y += deltaX * 0.01;
            this.previousTouch = { x: e.touches[0].pageX, y: e.touches[0].pageY };
        } else if (e.touches.length === 2 && this.previousPinchDist) {
            // Two finger scale
            const currentDist = this.getPinchDistance(e.touches);
            const scaleRatio = currentDist / this.previousPinchDist;
            
            // Constrain scale to avoid flipping or zooming infinitely
            const newScale = this.baseScale.clone().multiplyScalar(scaleRatio);
            newScale.clampScalar(0.1, 5.0); // limits
            
            this.targetModel.scale.copy(newScale);
        }
    }

    onTouchEnd(e) {
        if (!this.arMode) return;
        
        if (e.touches.length < 2) {
            this.previousPinchDist = null;
            if (this.targetModel) this.baseScale = this.targetModel.scale.clone();
        }
        if (e.touches.length === 0) {
            this.previousTouch = null;
        }
    }

    getPinchDistance(touches) {
        const dx = touches[0].pageX - touches[1].pageX;
        const dy = touches[0].pageY - touches[1].pageY;
        return Math.sqrt(dx * dx + dy * dy);
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

import * as THREE from 'three';

export class WebXRManager {
    constructor(sceneContainer, uiCallbacks) {
        this.sceneContainer = sceneContainer;
        this.renderer = sceneContainer.renderer;
        this.scene = sceneContainer.scene;
        this.camera = sceneContainer.camera;
        
        // Callbacks for UI updates
        this.uiCallbacks = uiCallbacks || {
            onSessionStarted: () => {},
            onSessionEnded: () => {},
            onSurfaceSearching: () => {},
            onSurfaceFound: () => {},
            onModelPlaced: () => {}
        };

        this.renderer.xr.enabled = true;
        
        this.hitTestSource = null;
        this.hitTestSourceRequested = false;
        
        this.surfaceFound = false;
        this.modelPlaced = false;

        this.reticle = this.createReticle();
        this.scene.add(this.reticle);

        this.controller = this.renderer.xr.getController(0);
        this.controller.addEventListener('select', this.onSelect.bind(this));
        this.scene.add(this.controller);
    }

    createReticle() {
        const ringGeo = new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xC46A2D });
        const reticle = new THREE.Mesh(ringGeo, ringMat);
        reticle.matrixAutoUpdate = false;
        reticle.visible = false;
        
        // Add fake shadow/glow under reticle
        const glowGeo = new THREE.CircleGeometry(0.25, 32).rotateX(-Math.PI / 2);
        const glowMat = new THREE.MeshBasicMaterial({ 
            color: 0xC46A2D, 
            transparent: true, 
            opacity: 0.3,
            depthWrite: false 
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.y = -0.01;
        reticle.add(glow);

        return reticle;
    }

    static async checkSupport() {
        if ('xr' in navigator) {
            try {
                const supported = await navigator.xr.isSessionSupported('immersive-ar');
                return supported;
            } catch (e) {
                return false;
            }
        }
        return false;
    }

    async startSession(overlayElement) {
        if (!('xr' in navigator)) return;

        const sessionInit = {
            requiredFeatures: ['hit-test', 'local-floor'],
            optionalFeatures: ['dom-overlay']
        };

        if (overlayElement) {
            sessionInit.domOverlay = { root: overlayElement };
        }

        try {
            const session = await navigator.xr.requestSession('immersive-ar', sessionInit);
            session.addEventListener('end', () => this.onSessionEnded());
            
            await this.renderer.xr.setSession(session);
            this.uiCallbacks.onSessionStarted();
            this.uiCallbacks.onSurfaceSearching();
            return true;
            
        } catch (error) {
            console.error("Failed to start WebXR session:", error);
            // alert("Gagal memulai sesi AR. Pastikan izin kamera diberikan.");
            return false;
        }
    }

    onSessionEnded() {
        this.hitTestSourceRequested = false;
        this.hitTestSource = null;
        this.surfaceFound = false;
        this.modelPlaced = false;
        this.reticle.visible = false;
        this.uiCallbacks.onSessionEnded();
    }

    onSelect() {
        if (this.reticle.visible && !this.modelPlaced) {
            this.modelPlaced = true;
            this.reticle.visible = false;
            
            // Trigger callback with the matrix
            this.uiCallbacks.onModelPlaced(this.reticle.matrix.clone());
        }
    }
    
    resetModelPlacement() {
        this.modelPlaced = false;
        this.surfaceFound = false;
        this.uiCallbacks.onSurfaceSearching();
    }

    update(delta, frame) {
        if (!frame) return;

        const referenceSpace = this.renderer.xr.getReferenceSpace();
        const session = this.renderer.xr.getSession();

        if (this.hitTestSourceRequested === false) {
            session.requestReferenceSpace('viewer').then((viewerSpace) => {
                session.requestHitTestSource({ space: viewerSpace }).then((source) => {
                    this.hitTestSource = source;
                });
            });

            session.addEventListener('end', () => {
                this.hitTestSourceRequested = false;
                this.hitTestSource = null;
            });

            this.hitTestSourceRequested = true;
        }

        if (this.hitTestSource) {
            const hitTestResults = frame.getHitTestResults(this.hitTestSource);

            if (hitTestResults.length > 0) {
                const hit = hitTestResults[0];
                const pose = hit.getPose(referenceSpace);

                if (!this.modelPlaced) {
                    this.reticle.visible = true;
                    this.reticle.matrix.fromArray(pose.transform.matrix);
                    
                    if (!this.surfaceFound) {
                        this.surfaceFound = true;
                        this.uiCallbacks.onSurfaceFound();
                    }
                } else {
                    this.reticle.visible = false;
                }
            } else {
                this.reticle.visible = false;
                if (!this.modelPlaced && this.surfaceFound) {
                    this.surfaceFound = false;
                    this.uiCallbacks.onSurfaceSearching();
                }
            }
        }
    }
}

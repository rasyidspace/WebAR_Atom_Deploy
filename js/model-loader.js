import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class ModelLoader {
    constructor(sceneContainer) {
        this.sceneContainer = sceneContainer;
        this.scene = sceneContainer.scene;
        this.mixer = null;
        this.currentModel = null;
        
        // Setup Loading Manager
        this.manager = new THREE.LoadingManager();
        this.loader = new GLTFLoader(this.manager);
        
        // Expose progress callbacks
        this.onProgress = null;
        this.onError = null;
        this.onLoadComplete = null;

        this.manager.onProgress = (url, itemsLoaded, itemsTotal) => {
            if (this.onProgress) {
                this.onProgress((itemsLoaded / itemsTotal) * 100);
            }
        };

        this.manager.onError = (url) => {
            if (this.onError) {
                this.onError(url);
            }
        };
    }

    async loadModel(url, atomConfig) {
        this.disposeCurrentModel();

        try {
            const gltf = await this.loader.loadAsync(url);
            this.processLoadedModel(gltf, atomConfig);
        } catch (error) {
            console.warn(`Failed to load ${url}, generating fallback 3D model.`);
            this.generateFallbackModel(atomConfig);
        }

        if (this.onLoadComplete) {
            this.onLoadComplete();
        }
    }

    processLoadedModel(gltf, atomConfig) {
        const model = gltf.scene;

        // Apply shadows
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        // Center model using BoundingBox
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        
        // Normalize Scale to 1 Unit max dimension to fit MindAR target perfectly
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const baseScale = maxDim > 0 ? (1 / maxDim) : 1;
        
        model.position.x += (model.position.x - center.x);
        model.position.y += (model.position.y - center.y);
        model.position.z += (model.position.z - center.z);

        // Apply config transforms (multiply base scale by config scale)
        if (atomConfig) {
            const sx = (atomConfig.scale?.[0] || 1) * baseScale;
            const sy = (atomConfig.scale?.[1] || 1) * baseScale;
            const sz = (atomConfig.scale?.[2] || 1) * baseScale;
            model.scale.set(sx, sy, sz);
            if (atomConfig.rotation) model.rotation.set(...atomConfig.rotation);
        } else {
            model.scale.set(baseScale, baseScale, baseScale);
        }

        // Setup Animations
        if (gltf.animations && gltf.animations.length > 0) {
            this.mixer = new THREE.AnimationMixer(model);
            const action = this.mixer.clipAction(gltf.animations[0]);
            action.play();
            
            // Add self to scene updatables
            if (!this.sceneContainer.updatables.includes(this)) {
                this.sceneContainer.addUpdatable(this);
            }
        }
        
        this.addFakeShadow(model);

        this.currentModel = model;
        this.scene.add(model);
    }

    addFakeShadow(modelGroup) {
        const shadowGeo = new THREE.CircleGeometry(0.5, 32).rotateX(-Math.PI / 2);
        const shadowMat = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.15,
            depthWrite: false
        });
        const shadow = new THREE.Mesh(shadowGeo, shadowMat);
        shadow.position.y = -0.05; // Slightly below the model
        modelGroup.add(shadow);
    }

    generateFallbackModel(atomConfig) {
        // Generates a simple grouped structure with a nucleus and orbiting electrons
        const group = new THREE.Group();
        
        // Nucleus
        const coreGeo = new THREE.SphereGeometry(0.3, 32, 32);
        const coreMat = new THREE.MeshStandardMaterial({ color: 0xC46A2D, roughness: 0.2 });
        const core = new THREE.Mesh(coreGeo, coreMat);
        core.castShadow = true;
        group.add(core);

        // Orbits and Electrons (Dummy representation based on ID)
        let ringCount = 1;
        if (atomConfig.id === 'rutherford' || atomConfig.id === 'bohr') ringCount = 3;
        else if (atomConfig.id === 'quantum') ringCount = 5;

        for (let i = 0; i < ringCount; i++) {
            const radius = 0.8 + (i * 0.4);
            
            // Ring
            const ringGeo = new THREE.TorusGeometry(radius, 0.02, 16, 100);
            const ringMat = new THREE.MeshStandardMaterial({ color: 0x9E5624, transparent: true, opacity: 0.5 });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            
            ring.rotation.x = Math.PI / 2;
            ring.rotation.y = (Math.random() - 0.5) * Math.PI;
            
            // Electron
            const eGeo = new THREE.SphereGeometry(0.1, 16, 16);
            const eMat = new THREE.MeshStandardMaterial({ color: 0xE89B52 });
            const electron = new THREE.Mesh(eGeo, eMat);
            electron.position.set(radius, 0, 0);
            electron.castShadow = true;
            ring.add(electron);

            group.add(ring);
        }

        // Add a simple animation mixer proxy for the fallback group
        this.mixer = {
            update: (delta) => {
                group.rotation.y += delta * 0.5;
                group.rotation.z += delta * 0.2;
            }
        };
        
        if (!this.sceneContainer.updatables.includes(this)) {
            this.sceneContainer.addUpdatable(this);
        }
        
        this.addFakeShadow(group);

        this.currentModel = group;
        this.scene.add(group);
    }

    update(delta) {
        if (this.mixer) {
            this.mixer.update(delta);
        }
    }

    disposeCurrentModel() {
        if (this.currentModel) {
            this.scene.remove(this.currentModel);
            // Deep dispose logic could go here
            this.currentModel = null;
        }
        if (this.mixer && this.mixer.stopAllAction) {
            this.mixer.stopAllAction();
        }
        this.mixer = null;
    }
}

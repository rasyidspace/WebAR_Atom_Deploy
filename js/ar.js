import { ThreeScene } from './three-scene.js';
import { ModelLoader } from './model-loader.js';
import { InteractionManager } from './interaction.js';
import { WebXRManager } from './webxr-manager.js';

let currentAtomData = null;
let threeScene = null;
let modelLoader = null;
let interactionManager = null;
let xrManager = null;

async function initARPage() {
    const urlParams = new URLSearchParams(window.location.search);
    let atomId = urlParams.get('id');
    
    if (!atomId) {
        const storedName = localStorage.getItem('selectedARModel');
        if (storedName) {
            const map = {
                'Dalton': 'dalton',
                'Thomson': 'thomson',
                'Rutherford': 'rutherford',
                'Niels Bohr': 'bohr',
                'Mekanika Kuantum': 'quantum'
            };
            atomId = map[storedName] || null;
            localStorage.removeItem('selectedARModel');
        }
    }

    try {
        const response = await fetch('data/atoms.json');
        const atomsData = await response.json();
        
        if (!atomId) {
            renderSelectionModal(atomsData);
            document.getElementById('modal-overlay').classList.add('active');
            document.getElementById('ar-modal').classList.add('active');
            return;
        }
        
        currentAtomData = atomsData.find(a => a.id === atomId);
        if (currentAtomData) {
            populateUI(currentAtomData);
        } else {
            alert("Model atom tidak ditemukan!");
            window.location.href = 'play.html';
        }
        
    } catch (e) {
        console.error("Failed to init AR:", e);
    }
}

function renderSelectionModal(atoms) {
    const list = document.getElementById('modal-model-list');
    list.innerHTML = '';
    atoms.forEach(atom => {
        const div = document.createElement('div');
        div.className = 'model-option';
        div.onclick = () => {
            window.location.href = `ar.html?id=${atom.id}`;
        };
        div.innerHTML = `
          <div class="option-content">
            <div class="option-icon">${atom.iconSvg}</div>
            <span class="option-name">${atom.name}</span>
          </div>
          <div class="chevron-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg></div>
        `;
        list.appendChild(div);
    });
}

function populateUI(atom) {
    const prepTitle = document.getElementById('prep-title');
    if (prepTitle) prepTitle.textContent = atom.name;
    
    document.getElementById('bs-title').textContent = atom.name;
    document.getElementById('bs-subtitle').textContent = atom.subtitle;
    document.getElementById('bs-desc').textContent = atom.description;
    
    if (atom.information) {
        document.getElementById('bs-proton').textContent = atom.information.proton;
        document.getElementById('bs-electron').textContent = atom.information.electron;
        document.getElementById('bs-neutron').textContent = atom.information.neutron;
        document.getElementById('bs-atomic').textContent = atom.information.atomicNumber;
    }
}

function switchState(stateId) {
    document.querySelectorAll('.ar-state').forEach(el => {
        el.classList.remove('active');
    });
    document.getElementById(stateId).classList.add('active');
}

// Initialization
window.startLoadingAR = async function() {
    switchState('ar-state-loading');
    const textEl = document.getElementById('loading-text');
    textEl.textContent = "Checking AR Support...";

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isXRSupported = await WebXRManager.checkSupport();

    if (!threeScene) {
        threeScene = new ThreeScene('three-canvas');
        interactionManager = new InteractionManager(threeScene.camera, threeScene.renderer.domElement);
        threeScene.addUpdatable(interactionManager);
        
        modelLoader = new ModelLoader(threeScene);
        modelLoader.onProgress = (percent) => {
            textEl.textContent = `Loading Assets... ${Math.round(percent)}%`;
        };
    }

    if (isXRSupported) {
        // Setup XR Manager
        xrManager = new WebXRManager(threeScene, {
            onSessionStarted: () => {
                interactionManager.setARMode(true);
            },
            onSessionEnded: () => {
                interactionManager.setARMode(false);
                // Exit back to Prep or Viewer? Let's just fallback to Viewer Mode
                switchState('ar-state-viewer');
                threeScene.scene.background = new THREE.Color('#FFFBF5'); // Restore cream background
            },
            onSurfaceSearching: () => {
                switchState('ar-state-scanning');
            },
            onSurfaceFound: () => {
                switchState('ar-state-found');
            },
            onModelPlaced: (matrix) => {
                switchState('ar-state-viewer');
                if (modelLoader.currentModel) {
                    modelLoader.currentModel.matrixAutoUpdate = false;
                    modelLoader.currentModel.matrix.copy(matrix);
                    modelLoader.currentModel.updateMatrixWorld(true);
                    
                    // Allow interaction manager to rotate/scale it
                    interactionManager.setTargetModel(modelLoader.currentModel);
                }
            }
        });
        
        threeScene.addUpdatable(xrManager);
        threeScene.scene.background = null; // transparent for AR

        // We MUST request the session immediately so Chrome doesn't drop the user gesture context!
        const success = await xrManager.startSession(document.body);

        if (success) {
            threeScene.startLoop();
            
            // Now load the model in the background
            modelLoader.onLoadComplete = () => {
                if (modelLoader.currentModel && !xrManager.modelPlaced) {
                    // Hide the model far away until the user places it on a surface
                    modelLoader.currentModel.matrixAutoUpdate = true;
                    modelLoader.currentModel.position.set(0, -1000, 0);
                }
            };
            if (currentAtomData) modelLoader.loadModel(currentAtomData.model, currentAtomData);
            
        } else {
            // Failed to start WebXR (e.g. Permission Denied or Chrome error)
            textEl.textContent = "Akses Kamera Ditolak. Membuka 3D Viewer...";
            interactionManager.setARMode(false);
            threeScene.scene.background = new THREE.Color('#FFFBF5');
            
            modelLoader.onLoadComplete = () => {
                setTimeout(() => {
                    switchState('ar-state-viewer');
                    interactionManager.setTargetModel(modelLoader.currentModel);
                }, 1000);
            };
            threeScene.startLoop();
            if (currentAtomData) modelLoader.loadModel(currentAtomData.model, currentAtomData);
        }

    } else if (isIOS && currentAtomData) {
        // Fallback to 3D Viewer but expose Apple AR Quick Look button
        textEl.textContent = "Menyiapkan Model untuk iOS...";
        
        const iosBtn = document.getElementById('ios-ar-btn');
        if (iosBtn) {
            iosBtn.href = currentAtomData.modelUsdz || currentAtomData.model;
            iosBtn.style.display = 'flex';
        }

        // Continue to 3D Viewer
        interactionManager.setARMode(false);
        threeScene.scene.background = new THREE.Color('#FFFBF5');
        modelLoader.onLoadComplete = () => {
            setTimeout(() => {
                switchState('ar-state-viewer');
                interactionManager.setTargetModel(modelLoader.currentModel);
            }, 1000);
        };
        threeScene.startLoop();
        if (currentAtomData) modelLoader.loadModel(currentAtomData.model, currentAtomData);

    } else {
        // Fallback to 3D Viewer Mode for unsupported devices
        textEl.textContent = "AR Camera tidak didukung. Membuka 3D Viewer...";
        interactionManager.setARMode(false);
        threeScene.scene.background = new THREE.Color('#FFFBF5');
        
        modelLoader.onLoadComplete = () => {
            setTimeout(() => {
                switchState('ar-state-viewer');
                interactionManager.setTargetModel(modelLoader.currentModel);
            }, 1000);
        };
        
        threeScene.startLoop();
        if (currentAtomData) modelLoader.loadModel(currentAtomData.model, currentAtomData);
    }
}

// Global UI Overrides
window.showViewer = function() {
    // Only used to dismiss "Surface Found" early if needed, or by callbacks
    switchState('ar-state-viewer');
}

window.openViewer = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const atomId = urlParams.get('id');
    if (atomId) {
        window.location.href = `viewer.html?id=${atomId}`;
    } else {
        alert("Silakan pilih model atom terlebih dahulu.");
        window.location.href = 'play.html';
    }
}

let sheetOpen = false;
window.toggleBottomSheet = function() {
    const sheet = document.getElementById('bottom-sheet');
    sheetOpen = !sheetOpen;
    if (sheetOpen) {
        sheet.classList.add('open');
    } else {
        sheet.classList.remove('open');
    }
}

window.closeModal = function() {
    document.getElementById('modal-overlay').classList.remove('active');
    document.getElementById('ar-modal').classList.remove('active');
    if (!currentAtomData) {
        window.location.href = 'play.html';
    }
}

window.resetARCamera = function() {
    if (interactionManager.arMode && xrManager) {
        // In AR Mode, reset model placement
        xrManager.resetModelPlacement();
        if (modelLoader.currentModel) {
            // Move it out of view until placed again
            modelLoader.currentModel.matrix.identity();
            modelLoader.currentModel.position.set(0, -100, 0); 
            modelLoader.currentModel.updateMatrixWorld(true);
        }
    } else {
        // In Fallback 3D Mode, reset OrbitControls
        interactionManager.resetCamera();
    }
}

document.addEventListener('DOMContentLoaded', initARPage);

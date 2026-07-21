import { ThreeScene } from './three-scene.js';
import { ModelLoader } from './model-loader.js';
import { InteractionManager } from './interaction.js';

let currentAtomData = null;
let threeScene = null;
let modelLoader = null;
let interactionManager = null;

async function initARPage() {
    const urlParams = new URLSearchParams(window.location.search);
    let atomId = urlParams.get('id');
    
    // Fallback if coming from play dashboard via localStorage
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
    // Prep screen
    const prepTitle = document.getElementById('prep-title');
    if (prepTitle) prepTitle.textContent = atom.name;
    
    // Bottom Sheet
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

// Initialization of Three.js Foundation
window.startLoadingAR = function() {
    switchState('ar-state-loading');
    const textEl = document.getElementById('loading-text');
    textEl.textContent = "Initializing Engine...";

    // Initialize Three.js components if not already done
    if (!threeScene) {
        threeScene = new ThreeScene('three-canvas');
        interactionManager = new InteractionManager(threeScene.camera, threeScene.renderer.domElement);
        threeScene.addUpdatable(interactionManager);
        
        modelLoader = new ModelLoader(threeScene);
        
        // Wire loading progress
        modelLoader.onProgress = (percent) => {
            textEl.textContent = `Loading Assets... ${Math.round(percent)}%`;
        };
        
        // Note: For this fallback, it loads instantly so we add a slight simulated delay
        // to show the loading screen as requested.
        modelLoader.onLoadComplete = () => {
            textEl.textContent = "Preparing Scene...";
            setTimeout(() => {
                showViewer();
            }, 1000); // 1s artificial delay to read "Preparing Scene"
        };
        
        modelLoader.onError = (url) => {
            // Error is handled inside ModelLoader to generate fallback
            console.log("Error loading, using fallback.");
        };

        // Start render loop
        threeScene.startLoop();
    }

    // Begin Loading the model
    if (currentAtomData) {
        modelLoader.loadModel(currentAtomData.model, currentAtomData);
    }
}

function showViewer() {
    switchState('ar-state-viewer');
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

// Global closeModal override for this page
window.closeModal = function() {
    document.getElementById('modal-overlay').classList.remove('active');
    document.getElementById('ar-modal').classList.remove('active');
    if (!currentAtomData) {
        window.location.href = 'play.html';
    }
}

// Add a function to reset camera from the floating UI
window.resetARCamera = function() {
    if (interactionManager) {
        interactionManager.resetCamera();
    }
}

document.addEventListener('DOMContentLoaded', initARPage);

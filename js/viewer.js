import { ThreeScene } from './three-scene.js';
import { ModelLoader } from './model-loader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let atomId = null;
let currentAtomData = null;
let threeScene = null;
let modelLoader = null;
let controls = null;

async function initViewer() {
    // 1. Get atom ID
    const urlParams = new URLSearchParams(window.location.search);
    atomId = urlParams.get('atom') || urlParams.get('id');

    if (!atomId) {
        alert("Silakan pilih model atom terlebih dahulu.");
        window.location.href = 'play.html';
        return;
    }

    // 2. Setup Back & AR buttons
    document.getElementById('btn-back').onclick = () => {
        window.location.href = `materi-detail.html?atom=${atomId}`;
    };
    
    document.getElementById('btn-lihat-ar').onclick = () => {
        window.location.href = `ar.html?atom=${atomId}`;
    };

    // 3. Fetch Data
    try {
        const response = await fetch('data/atoms.json');
        const data = await response.json();
        currentAtomData = data.find(item => item.id === atomId);
        
        if (!currentAtomData) {
            alert("Data atom tidak ditemukan.");
            window.location.href = 'play.html';
            return;
        }

        // 4. Update UI
        document.getElementById('viewer-title').textContent = currentAtomData.name;
        document.getElementById('panel-title').textContent = currentAtomData.name;
        document.getElementById('panel-desc').textContent = currentAtomData.description;

        // 5. Setup Three.js
        threeScene = new ThreeScene('three-canvas');
        modelLoader = new ModelLoader(threeScene);

        // Setup OrbitControls
        controls = new OrbitControls(threeScene.camera, threeScene.renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enableZoom = true;
        controls.enablePan = true;
        
        // Add to updatables
        threeScene.addUpdatable(controls);

        // Start render loop
        threeScene.startLoop();

        // 6. Load Model
        if (currentAtomData.model) {
            modelLoader.loadModel(currentAtomData.model, currentAtomData);
            modelLoader.onLoadComplete = () => {
                if (modelLoader.mixer) {
                    document.getElementById('btn-pause').style.display = 'flex';
                }
            };
        }

        // Setup UI Controls
        document.getElementById('btn-reset').onclick = () => {
            controls.reset();
            threeScene.camera.position.set(0, 1.5, 4);
        };

        document.getElementById('btn-pause').onclick = () => {
            const isPlaying = modelLoader.toggleAnimation();
            document.getElementById('icon-pause').style.display = isPlaying ? 'block' : 'none';
            document.getElementById('icon-play').style.display = isPlaying ? 'none' : 'block';
        };

        // 7. Fade out help overlay
        setTimeout(() => {
            const helpOverlay = document.getElementById('help-overlay');
            if (helpOverlay) {
                helpOverlay.style.opacity = '0';
            }
        }, 4000);

    } catch (err) {
        console.error("Error loading viewer:", err);
        document.getElementById('panel-title').textContent = "Terjadi Kesalahan";
        document.getElementById('panel-desc').textContent = "Tidak dapat memuat data atom.";
    }
}

document.addEventListener('DOMContentLoaded', initViewer);

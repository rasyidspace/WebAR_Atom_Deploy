import { AtomService } from './atom-service.js';
import { MindARManager } from './mindar-manager.js';
import { ModelLoader } from './model-loader.js';

let mindarManager = null;
let modelLoader = null;
let atomData = null;

async function initAR() {
    // 1. Read URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const atomId = urlParams.get('atom') || urlParams.get('id');

    if (!atomId) {
        showError("Data atom tidak ditemukan.");
        return;
    }

    // Setup UI Buttons
    document.getElementById('btn-back').onclick = () => {
        if (mindarManager) {
            try { mindarManager.stop(); } catch(e) {}
        }
        window.location.href = `materi-detail.html?atom=${atomId}`;
    };

    // 2. Load atom configuration
    atomData = await AtomService.getAtom(atomId);
    
    if (!atomData) {
        showError("Model atom tidak ditemukan.");
        return;
    }

    // Update UI Title
    document.getElementById('ar-title').textContent = atomData.name;

    // Check if marker exists
    if (!atomData.marker) {
        showError("Marker tidak ditemukan untuk atom ini.");
        return;
    }

    // 3. Initialize MindAR
    document.getElementById('loading-desc').textContent = "Menyiapkan Kamera AR...";
    mindarManager = new MindARManager('mindar-container', atomData.marker);

    // 4. Setup Model Loader
    document.getElementById('loading-desc').textContent = "Memuat Model 3D...";
    // ModelLoader expects a sceneContainer. We pass mindarManager since it has .scene and .addUpdatable
    modelLoader = new ModelLoader(mindarManager);
    
    // Attach UI state handlers to MindAR Anchor events
    const instructionCard = document.getElementById('instruction-card');
    const tipsCard = document.getElementById('tips-card');
    const toastSuccess = document.getElementById('toast-success');
    const toastLost = document.getElementById('toast-lost');

    mindarManager.onTargetFound = () => {
        instructionCard.style.opacity = '0';
        tipsCard.style.opacity = '0';
        
        toastLost.classList.remove('visible');
        toastSuccess.classList.add('visible');
        
        setTimeout(() => {
            toastSuccess.classList.remove('visible');
        }, 3000);
    };

    mindarManager.onTargetLost = () => {
        instructionCard.style.opacity = '1';
        toastSuccess.classList.remove('visible');
        toastLost.classList.add('visible');
    };

    // 5. Load GLB Model
    try {
        await new Promise((resolve, reject) => {
            modelLoader.onLoadComplete = resolve;
            modelLoader.onError = reject;
            modelLoader.loadModel(atomData.model, atomData);
        });

        // 6. Attach model to Anchor
        if (modelLoader.currentModel) {
            mindarManager.attachModel(modelLoader.currentModel);
        } else {
            showError("Model gagal dimuat.");
            return;
        }

        // 7. Start Camera
        document.getElementById('loading-desc').textContent = "Mulai Kamera...";
        try {
            await mindarManager.start();
            // Hide loading screen when started successfully
            document.getElementById('loading-screen').classList.add('hidden');
        } catch (camErr) {
            console.error("Camera Error:", camErr);
            showError("Kamera diperlukan untuk menjalankan AR.");
        }

    } catch (modelErr) {
        console.error("Model Error:", modelErr);
        showError("Model gagal dimuat.");
    }
}

function showError(message) {
    const loadingScreen = document.getElementById('loading-screen');
    const title = document.getElementById('loading-title');
    const desc = document.getElementById('loading-desc');
    const retryBtn = document.getElementById('btn-retry');
    
    loadingScreen.classList.remove('hidden');
    title.textContent = "Terjadi Kesalahan";
    title.style.color = "#E03E3E";
    desc.textContent = message;
    
    // Show spinner container but hide spinner element inside
    const spinner = loadingScreen.querySelector('.loading-spinner-large');
    if (spinner) spinner.style.display = 'none';
    
    retryBtn.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', initAR);

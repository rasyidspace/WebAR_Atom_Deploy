import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { AtomService } from './atom-service.js';
import { ModelLoader } from './model-loader.js';

let sceneContainer = null;
let modelLoader = null;
let atomData = null;
let videoElement = null;
let mediaStream = null;

// A simple container to hold scene, camera, renderer, and updatables (like ThreeScene but simpler for camera overlay)
class CameraOverlayScene {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        
        this.scene = new THREE.Scene();
        
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.set(0, 0, 5); // Default camera position
        
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas, 
            alpha: true, 
            antialias: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
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
        this.scene.add(dirLight);

        this.updatables = [];
        this.clock = new THREE.Clock();

        // Handle Resize
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
    }

    addUpdatable(obj) {
        if (typeof obj.update === 'function') {
            this.updatables.push(obj);
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    startRenderLoop() {
        this.renderer.setAnimationLoop(() => {
            const delta = this.clock.getDelta();
            for (const obj of this.updatables) {
                obj.update(delta);
            }
            this.renderer.render(this.scene, this.camera);
        });
    }

    stopRenderLoop() {
        this.renderer.setAnimationLoop(null);
    }
}

async function initCameraView() {
    // 1. Read URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const atomId = urlParams.get('atom') || urlParams.get('id');

    if (!atomId) {
        showError("Data atom tidak ditemukan.");
        return;
    }

    // Setup Back button
    document.getElementById('btn-back').onclick = stopAndGoBack;

    // 2. Load atom configuration
    atomData = await AtomService.getAtom(atomId);
    
    if (!atomData) {
        showError("Model atom tidak ditemukan.");
        return;
    }

    document.getElementById('viewer-title').textContent = atomData.name;

    // 3. Request Camera Access
    document.getElementById('loading-desc').textContent = "Mengakses Kamera...";
    videoElement = document.getElementById('camera-feed');
    
    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
        });
        videoElement.srcObject = mediaStream;
    } catch (err) {
        console.error("Camera access denied:", err);
        showError("Akses kamera ditolak atau tidak tersedia.");
        return;
    }

    // 4. Initialize Three.js overlay
    document.getElementById('loading-desc').textContent = "Memuat Model 3D...";
    sceneContainer = new CameraOverlayScene('three-canvas');
    modelLoader = new ModelLoader(sceneContainer);

    // Load Model
    try {
        await new Promise((resolve, reject) => {
            modelLoader.onLoadComplete = resolve;
            modelLoader.onError = reject;
            modelLoader.loadModel(atomData.model, atomData);
        });

        // Setup Controls
        const controls = new OrbitControls(sceneContainer.camera, sceneContainer.renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enablePan = true;
        controls.minDistance = 1;
        controls.maxDistance = 20;
        
        sceneContainer.addUpdatable({
            update: () => controls.update()
        });

        // Setup UI Controls
        if (modelLoader.mixer) {
            document.getElementById('btn-pause').style.display = 'flex';
        }

        document.getElementById('btn-reset').onclick = () => {
            controls.reset();
            sceneContainer.camera.position.set(0, 0, 5);
        };

        document.getElementById('btn-pause').onclick = () => {
            const isPlaying = modelLoader.toggleAnimation();
            document.getElementById('icon-pause').style.display = isPlaying ? 'block' : 'none';
            document.getElementById('icon-play').style.display = isPlaying ? 'none' : 'block';
        };

        // Narration Logic for Penemuan Elektron
        if (atomData.id === 'penemuan-elektron') {
            const narrationTimeline = [
                {
                    start: 1, end: 119,
                    title: "Sinar Katoda Normal",
                    description: "Elektron bergerak lurus dari katoda menuju anoda di dalam tabung vakum. Pada kondisi ini belum diberikan medan listrik maupun medan magnet."
                },
                {
                    start: 120, end: 165,
                    title: "Pengaruh Medan Listrik",
                    description: "Saat medan listrik diberikan, lintasan sinar katoda membelok menuju kutub positif. Hal ini menunjukkan bahwa sinar katoda bermuatan negatif."
                },
                {
                    start: 166, end: 255,
                    title: "Pengaruh Medan Magnet",
                    description: "Ketika medan magnet diterapkan, lintasan sinar katoda kembali mengalami pembelokan. Arah pembelokan bergantung pada arah medan magnet yang diberikan."
                },
                {
                    start: 256, end: 300,
                    title: "Kesimpulan Percobaan",
                    description: "Setelah pengaruh medan dihilangkan, lintasan kembali lurus. Percobaan ini membuktikan bahwa sinar katoda merupakan aliran partikel bermuatan negatif yang kemudian dikenal sebagai elektron."
                }
            ];

            const narrationCard = document.getElementById('narration-card');
            const titleEl = document.getElementById('narration-title');
            const descEl = document.getElementById('narration-desc');
            const progressEl = document.getElementById('narration-progress');

            narrationCard.style.display = 'block';
            setTimeout(() => narrationCard.classList.add('active'), 500);

            let currentTimelineIndex = -1;

            sceneContainer.addUpdatable({
                update: () => {
                    if (!modelLoader.mixer || !modelLoader.mixer._actions || modelLoader.mixer._actions.length === 0) return;
                    
                    const action = modelLoader.mixer._actions[0];
                    const FPS = 30;
                    // Calculate current frame (looping safely)
                    const time = action.time % action.getClip().duration;
                    const currentFrame = Math.floor(time * FPS) + 1;
                    
                    let newIndex = narrationTimeline.findIndex(t => currentFrame >= t.start && currentFrame <= t.end);
                    if (newIndex === -1) newIndex = 0; // Fallback to first if out of bounds (e.g. slight overshoots)

                    if (newIndex !== currentTimelineIndex) {
                        currentTimelineIndex = newIndex;
                        
                        if (narrationCard.classList.contains('active')) {
                            narrationCard.classList.remove('active');
                            narrationCard.classList.add('fade-out');
                            
                            setTimeout(() => {
                                const timeline = narrationTimeline[newIndex];
                                titleEl.textContent = timeline.title;
                                descEl.textContent = timeline.description;
                                progressEl.textContent = `Tahap ${newIndex + 1} dari ${narrationTimeline.length}`;
                                
                                narrationCard.classList.remove('fade-out');
                                narrationCard.classList.add('active');
                            }, 200);
                        } else {
                            // Initial load
                            const timeline = narrationTimeline[newIndex];
                            titleEl.textContent = timeline.title;
                            descEl.textContent = timeline.description;
                            progressEl.textContent = `Tahap ${newIndex + 1} dari ${narrationTimeline.length}`;
                        }
                    }
                }
            });
        } else if (atomData.id === 'penemuan-inti') {
            const narrationTimeline = [
                { title: "Observasi 1", description: "Sinar bergerak lurus menembus lempeng emas (diteruskan)." },
                { title: "Penjelasan 1", description: "Karena sinar melewati ruang hampa (tidak mengenai inti atom)." },
                { title: "Observasi 2", description: "Sinar menembus lempeng emas namun bergerak membelok (dibelokkan)." },
                { title: "Penjelasan 2", description: "Karena sinar mendekati inti atom." },
                { title: "Observasi 3", description: "Sinar bergerak memantul saat mengenai lempeng emas (dipantulkan)." },
                { title: "Penjelasan 3", description: "Karena sinar tepat mengenai inti atom." },
                { title: "Kesimpulan", description: "Terdapat sinar alfa yang diteruskan, dibelokkan, dan dipantulkan." }
            ];

            const narrationCard = document.getElementById('narration-card');
            const titleEl = document.getElementById('narration-title');
            const descEl = document.getElementById('narration-desc');
            const progressEl = document.getElementById('narration-progress');

            narrationCard.style.display = 'block';
            setTimeout(() => narrationCard.classList.add('active'), 500);

            let lastRenderedIndex = -1;

            sceneContainer.addUpdatable({
                update: () => {
                    const newIndex = modelLoader.currentSequenceIndex;
                    // modelLoader.sequenceUrls might not be set immediately, ensure newIndex is valid
                    if (newIndex !== undefined && newIndex !== lastRenderedIndex && narrationTimeline[newIndex]) {
                        lastRenderedIndex = newIndex;
                        
                        if (narrationCard.classList.contains('active')) {
                            narrationCard.classList.remove('active');
                            narrationCard.classList.add('fade-out');
                            
                            setTimeout(() => {
                                const timeline = narrationTimeline[newIndex];
                                titleEl.textContent = timeline.title;
                                descEl.textContent = timeline.description;
                                progressEl.textContent = `Tahap ${newIndex + 1} dari ${narrationTimeline.length}`;
                                
                                narrationCard.classList.remove('fade-out');
                                narrationCard.classList.add('active');
                            }, 200);
                        } else {
                            const timeline = narrationTimeline[newIndex];
                            titleEl.textContent = timeline.title;
                            descEl.textContent = timeline.description;
                            progressEl.textContent = `Tahap ${newIndex + 1} dari ${narrationTimeline.length}`;
                        }
                    }
                }
            });
        }

        // Double tap to reset
        let lastTap = 0;
        document.getElementById('three-canvas').addEventListener('touchend', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            if (tapLength < 500 && tapLength > 0) {
                // Reset Camera
                sceneContainer.camera.position.set(0, 0, 5);
                controls.target.set(0, 0, 0);
                e.preventDefault();
            }
            lastTap = currentTime;
        });

        // Hide Loading Screen
        document.getElementById('loading-screen').classList.add('hidden');
        
        // Hide Help Overlay after 5 seconds
        setTimeout(() => {
            document.getElementById('help-overlay').classList.add('hidden');
        }, 5000);

        // Start render loop
        sceneContainer.startRenderLoop();

    } catch (err) {
        console.error("Model load error:", err);
        showError("Model 3D gagal dimuat.");
    }
}

function stopAndGoBack() {
    // Stop camera
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
    }
    // Stop rendering
    if (sceneContainer) {
        sceneContainer.stopRenderLoop();
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const atomId = urlParams.get('atom') || urlParams.get('id');
    window.location.href = `materi-detail.html?atom=${atomId}`;
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
    
    const spinner = loadingScreen.querySelector('.loading-spinner-large');
    if (spinner) spinner.style.display = 'none';
    
    retryBtn.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', initCameraView);

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

        // Narration Logic for Penemuan Elektron
        if (currentAtomData.id === 'penemuan-elektron') {
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
            
            // Hide static text to prevent clutter
            document.getElementById('atom-name').style.display = 'none';
            document.getElementById('atom-description').style.display = 'none';

            narrationCard.style.display = 'block';
            setTimeout(() => narrationCard.classList.add('active'), 500);

            let currentTimelineIndex = -1;

            threeScene.addUpdatable({
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
        } else if (currentAtomData.id === 'penemuan-inti') {
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
            
            // Hide static text to prevent clutter
            document.getElementById('atom-name').style.display = 'none';
            document.getElementById('atom-description').style.display = 'none';

            narrationCard.style.display = 'block';
            setTimeout(() => narrationCard.classList.add('active'), 500);

            let lastRenderedIndex = -1;

            threeScene.addUpdatable({
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

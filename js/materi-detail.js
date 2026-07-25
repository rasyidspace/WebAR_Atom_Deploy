// Materi Detail Logic

async function loadMateriDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const atomId = urlParams.get('atom') || urlParams.get('id');
    
    if (!atomId) {
        window.location.href = 'materi.html';
        return;
    }
    
    try {
        const response = await fetch('data/atoms.json');
        if (!response.ok) throw new Error('Network response was not ok');
        
        const atomsData = await response.json();
        const currentIndex = atomsData.findIndex(a => a.id === atomId);
        
        if (currentIndex === -1) {
            window.location.href = 'materi.html';
            return;
        }
        
        const atom = atomsData[currentIndex];
        renderDetail(atom, atomsData, currentIndex);
        
    } catch (error) {
        console.error("Error loading detail:", error);
        document.getElementById('loading-indicator').textContent = "Gagal memuat materi.";
    }
}

function getCategoryClass(category) {
    if (category === "PENDAHULUAN") return "cat-pendahuluan";
    if (category === "TEORI ATOM") return "cat-teori-atom";
    if (category === "PENEMUAN") return "cat-penemuan";
    if (category === "EKSPERIMEN") return "cat-eksperimen";
    if (category === "MODEL ATOM") return "cat-model-atom";
    return "";
}

function renderHero(atom) {
    return `
        <div class="detail-hero">
            <span class="badge-category ${getCategoryClass(atom.category)}">${atom.category}</span>
            <h1 class="detail-title">${atom.name}</h1>
            <p class="hero-scientist">${atom.scientist} • ${atom.year}</p>
        </div>
    `;
}

function renderSummary(atom) {
    if (!atom.summary) return '';
    return `
        <div class="summary-card">
            <div class="summary-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            </div>
            <div class="summary-text">${atom.summary}</div>
        </div>
    `;
}

function getIllustrationHtml(name) {
    const images = {
        'atom-concept': 'atom-concept.png',
        'dalton-model': 'dalton-model.png',
        'cathode-ray': 'cathode-ray.jpg',
        'thomson-model': 'thomson-model.png',
        'gold-foil': 'gold-foil.png',
        'rutherford-model': 'rutherford-model.png',
        'neutron-discovery': 'neutron-discovery.webp',
        'bohr-model': 'bohr-model.jpg',
        'quantum-orbital': 'quantum-orbital.jpg'
    };
    
    const filename = images[name];
    if (!filename) return '';
    
    return `<img src="assets/images/${filename}" alt="${name}" style="width: 100%; border-radius: 8px;">`;
}

function renderSections(atom) {
    if (!atom.sections || atom.sections.length === 0) return '';
    
    let html = '<div class="content-section">';
    atom.sections.forEach(sec => {
        html += `<div class="content-block">
            <h4>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                ${sec.title}
            </h4>
            <p>${sec.content}</p>
        `;
        if (sec.illustration) {
            html += `<div class="illustration-card">
                ${getIllustrationHtml(sec.illustration)}
                <span style="font-size: 12px; margin-top: 8px; color: var(--text-light); text-align: center; display: block;">Visualisasi: ${sec.illustration.replace('-', ' ')}</span>
            </div>`;
        }
        html += `</div>`;
    });
    html += '</div>';
    return html;
}

function renderChecklist(atom) {
    if (!atom.importantPoints || atom.importantPoints.length === 0) return '';
    
    let list = atom.importantPoints.map(p => `
        <li style="display: flex; gap: 12px; margin-bottom: 12px; align-items: flex-start;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2D8A56" stroke-width="2" style="flex-shrink: 0;"><polyline points="20 6 9 17 4 12"/></svg>
            <span style="font-size: 14px;">${p}</span>
        </li>
    `).join('');
    
    return `
        <div class="checklist-card">
            <h4 style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px; color: var(--text);">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                Poin Penting
            </h4>
            <ul style="list-style: none; padding: 0; margin: 0;">${list}</ul>
        </div>
    `;
}

function renderScientist(atom) {
    if (!atom.biography) return '';
    return `
        <div class="scientist-card">
            <div class="scientist-portrait">
                <img src="${atom.thumbnail}" alt="${atom.scientist}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">
            </div>
            <div class="scientist-info">
                <h4>${atom.scientist}</h4>
                <div class="scientist-meta">${atom.nationality} • ${atom.year}</div>
                <p class="scientist-bio">${atom.biography}</p>
                <div class="scientist-contribution">💡 ${atom.contribution}</div>
            </div>
        </div>
    `;
}

function renderTimeline(atomsData, currentPosition) {
    let nodes = atomsData.map(a => {
        const isActive = a.timelinePosition === currentPosition;
        return `
            <div class="timeline-node ${isActive ? 'active' : ''}">
                <div class="timeline-circle">${a.timelinePosition}</div>
                <div class="timeline-label">${a.year.split(' ')[0]}</div>
            </div>
        `;
    }).join('');
    
    return `
        <div class="timeline-container">
            <h4 style="font-size: 14px; margin-bottom: 8px;">Garis Waktu Penemuan</h4>
            <div class="timeline-scroll">
                ${nodes}
            </div>
        </div>
    `;
}

function renderFunFacts(atom) {
    if (!atom.funFacts || atom.funFacts.length === 0) return '';
    return `
        <div class="callout-card fact">
            <div class="callout-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            </div>
            <div class="callout-content">
                <h4>Tahukah Kamu?</h4>
                <p>${atom.funFacts.join('<br><br>')}</p>
            </div>
        </div>
    `;
}

function renderApplications(atom) {
    if (!atom.applications || atom.applications.length === 0) return '';
    let list = atom.applications.map(app => `<li>${app}</li>`).join('');
    return `
        <div class="callout-card app">
            <div class="callout-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </div>
            <div class="callout-content">
                <h4>Penerapan Sehari-hari</h4>
                <ul style="padding-left: 16px; margin: 0; font-size: 13px; line-height: 1.5;">${list}</ul>
            </div>
        </div>
    `;
}

function renderKeywords(atom) {
    if (!atom.keywords || atom.keywords.length === 0) return '';
    let chips = atom.keywords.map(k => `<div class="chip">${k}</div>`).join('');
    return `
        <div style="margin-bottom: 12px; font-size: 14px; font-weight: 700; color: var(--text);">Kata Kunci</div>
        <div class="keywords-container">
            ${chips}
        </div>
    `;
}

function renderNavigation(atomsData, currentIndex) {
    let html = '<div class="nav-prev-next">';
    
    if (currentIndex > 0) {
        let prev = atomsData[currentIndex - 1];
        html += `
            <a href="materi-detail.html?atom=${prev.id}" class="nav-btn prev">
                <span class="nav-label">← Sebelumnya</span>
                <span class="nav-title">${prev.name}</span>
            </a>
        `;
    } else {
        html += `<div style="flex: 1;"></div>`;
    }
    
    if (currentIndex < atomsData.length - 1) {
        let next = atomsData[currentIndex + 1];
        html += `
            <a href="materi-detail.html?atom=${next.id}" class="nav-btn next">
                <span class="nav-label">Selanjutnya →</span>
                <span class="nav-title">${next.name}</span>
            </a>
        `;
    } else {
        html += `<div style="flex: 1;"></div>`;
    }
    
    html += '</div>';
    return html;
}

function renderBottomActions(atom) {
    const actionBar = document.getElementById('bottom-action-bar');
    if (!atom.model) {
        actionBar.style.display = 'none';
        return;
    }
    
    actionBar.style.display = 'flex';
    
    document.getElementById('btn-preview-3d').onclick = () => {
        window.location.href = `viewer.html?atom=${atom.id}`;
    };
    
    document.getElementById('btn-camera-view').onclick = () => {
        window.location.href = `camera.html?atom=${atom.id}`;
    };
}

function renderDetail(atom, atomsData, currentIndex) {
    const container = document.getElementById('detail-container');
    
    const html = `
        ${renderHero(atom)}
        ${renderSummary(atom)}
        ${renderScientist(atom)}
        ${renderTimeline(atomsData, atom.timelinePosition)}
        ${renderSections(atom)}
        ${renderChecklist(atom)}
        ${renderFunFacts(atom)}
        ${renderApplications(atom)}
        ${renderKeywords(atom)}
        ${renderNavigation(atomsData, currentIndex)}
    `;
    
    container.innerHTML = html;
    
    renderBottomActions(atom);
}

document.addEventListener('DOMContentLoaded', loadMateriDetail);

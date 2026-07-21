// Materi Detail Logic

async function loadMateriDetail() {
    // Parse URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const atomId = urlParams.get('id');
    
    if (!atomId) {
        window.location.href = 'materi.html';
        return;
    }
    
    try {
        // Fetch data
        const response = await fetch('data/atoms.json');
        if (!response.ok) throw new Error('Network response was not ok');
        
        const atomsData = await response.json();
        const atom = atomsData.find(a => a.id === atomId);
        
        if (!atom) {
            window.location.href = 'materi.html';
            return;
        }
        
        renderDetail(atom);
        
    } catch (error) {
        console.error("Error loading detail:", error);
        document.getElementById('loading-indicator').textContent = "Gagal memuat materi.";
    }
}

function renderDetail(atom) {
    const container = document.getElementById('detail-container');
    const actionBar = document.getElementById('bottom-action-bar');
    const btnAr = document.getElementById('btn-lihat-ar');
    
    // Configure AR button
    btnAr.onclick = () => {
        window.location.href = `ar.html?id=${atom.id}`;
    };
    
    // Build Lists
    const characteristicsList = atom.characteristics.map(c => `<li>${c}</li>`).join('');
    const advantagesList = atom.advantages.map(c => `<li>${c}</li>`).join('');
    const limitationsList = atom.limitations.map(c => `<li>${c}</li>`).join('');
    
    const html = `
        <div class="detail-hero">
          <div class="detail-icon-wrapper">
            ${atom.iconSvg}
          </div>
          <h1 class="detail-title">${atom.name}</h1>
          <p class="text-sm" style="color: var(--primary); font-weight: 600;">Tahun Penemuan: ${atom.timeline}</p>
        </div>
        
        <div class="detail-section">
          <h3 class="detail-section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            Pengantar
          </h3>
          <p style="font-size: 15px;">${atom.introduction}</p>
        </div>
        
        <div class="detail-section">
          <h3 class="detail-section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            Karakteristik
          </h3>
          <ul class="detail-list">
            ${characteristicsList}
          </ul>
        </div>
        
        <div class="detail-section">
          <h3 class="detail-section-title" style="color: #2D8A56;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            Kelebihan
          </h3>
          <ul class="detail-list">
            ${advantagesList}
          </ul>
        </div>
        
        <div class="detail-section">
          <h3 class="detail-section-title" style="color: #D34545;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            Kelemahan
          </h3>
          <ul class="detail-list">
            ${limitationsList}
          </ul>
        </div>
        
        <div class="fun-fact-box">
          <div class="fun-fact-title">Tahukah Kamu?</div>
          <p style="font-size: 14px;">${atom.funFact}</p>
        </div>
    `;
    
    container.innerHTML = html;
    actionBar.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', loadMateriDetail);

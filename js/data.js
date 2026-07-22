// Data Fetching Logic

async function fetchAtomsData() {
    try {
        const response = await fetch('data/atoms.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Could not load atoms data:", error);
        return [];
    }
}

function renderMateriCards(atomsData) {
    const container = document.getElementById('materi-list-container');
    if (!container) return;
    
    container.innerHTML = ''; // Clear loading state
    
    atomsData.forEach(atom => {
        const cardHtml = `
        <div class="material-card theme-${atom.id}">
          <div class="mc-header">
            <div class="mc-icon">
              ${atom.iconSvg}
            </div>
            <h3 class="card-title">${atom.name}</h3>
          </div>
          <p class="card-desc">${atom.description}</p>
          <button class="btn btn-outline btn-sm w-100 mt-2" onclick="window.location.href='materi-detail.html?id=${atom.id}'">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            Buka Materi
          </button>
        </div>
        `;
        container.insertAdjacentHTML('beforeend', cardHtml);
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    // Only load on materi page
    if (document.getElementById('materi-list-container')) {
        const atomsData = await fetchAtomsData();
        renderMateriCards(atomsData);
    }
});

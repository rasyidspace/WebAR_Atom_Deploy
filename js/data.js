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
        <div class="material-card theme-${atom.id}" style="background-image: url('${atom.thumbnail}');">
          <div class="mc-content">
            <h3 class="card-title">${atom.name}</h3>
            <button class="btn btn-secondary btn-sm w-100" onclick="window.location.href='materi-detail.html?atom=${atom.id}'">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
              Buka Materi
            </button>
          </div>
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

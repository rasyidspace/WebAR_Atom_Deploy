// MPA Routing Logic
// Since this is a Multi-Page Application, navigate() changes the window.location

function navigate(pageId) {
    if (pageId === 'home') {
        window.location.href = 'index.html';
    } else {
        window.location.href = `${pageId}.html`;
    }
}

// In MPA, active bottom nav state is determined by the current page URL
document.addEventListener('DOMContentLoaded', () => {
    const currentPath = window.location.pathname;
    let currentView = '';
    
    if (currentPath.includes('index.html') || currentPath.endsWith('/')) {
        currentView = 'home';
    } else if (currentPath.includes('play.html')) {
        currentView = 'play';
    } else if (currentPath.includes('materi.html')) {
        currentView = 'materi';
    } else if (currentPath.includes('ar.html')) {
        currentView = 'ar';
    }
    
    // update current view globally for ui.js
    window.currentView = currentView;
    
    if (typeof updateBottomNavState === 'function' && currentView) {
        updateBottomNavState(currentView);
    }
});

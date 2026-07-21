// UI Interaction Logic

// Modal Functions for AR Selection
function openModal() {
  const overlay = document.getElementById('modal-overlay');
  const modal = document.getElementById('ar-modal');
  const bottomNav = document.getElementById('bottom-nav');
  
  if(overlay) overlay.classList.add('active');
  if(modal) modal.classList.add('active');
  
  // Update bottom nav state to visually show AR is clicked
  if (typeof updateBottomNavState === 'function') {
      updateBottomNavState('ar');
  }
  
  // Hide bottom nav to prevent overlapping
  if (bottomNav) {
    bottomNav.classList.add('hidden');
  }
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  const modal = document.getElementById('ar-modal');
  const bottomNav = document.getElementById('bottom-nav');
  
  if (overlay) overlay.classList.remove('active');
  if (modal) modal.classList.remove('active');
  
  // Revert bottom nav state to current view
  if (typeof currentView !== 'undefined' && currentView !== 'ar') {
    if (typeof updateBottomNavState === 'function') {
        updateBottomNavState(currentView);
    }
  }
  
  // Show bottom nav again if in a main view
  const mainViews = ['play', 'materi'];
  if (bottomNav && typeof currentView !== 'undefined' && mainViews.includes(currentView)) {
    bottomNav.classList.remove('hidden');
  } else if (bottomNav && typeof currentView === 'undefined') {
    // MPA fallback
    bottomNav.classList.remove('hidden');
  }
}

function updateBottomNavState(viewId) {
    // Reset all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    
    // Set active nav item
    const activeNavItem = document.querySelector(`.nav-item[data-target="${viewId}"]`);
    if (activeNavItem) {
      activeNavItem.classList.add('active');
    }
}

// AR Navigation Function
function startAR(modelName) {
  if (modelName) {
    // Map names to IDs for ar.html
    const map = {
        'Dalton': 'dalton',
        'Thomson': 'thomson',
        'Rutherford': 'rutherford',
        'Niels Bohr': 'bohr',
        'Mekanika Kuantum': 'quantum'
    };
    const atomId = map[modelName] || 'dalton';
    
    if (typeof closeModal === 'function') {
        closeModal();
    }
    
    window.location.href = `ar.html?id=${atomId}`;
  }
}

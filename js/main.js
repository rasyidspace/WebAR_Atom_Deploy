// Main application entry point
document.addEventListener('DOMContentLoaded', () => {
  console.log('Struktur Atom App Initialized');
  
  // Initialize Particles.js background
  const bgPattern = document.querySelector('.bg-pattern');
  if (bgPattern) {
    bgPattern.id = 'particles-js';
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js';
    script.onload = () => {
      if (window.particlesJS) {
        particlesJS.load('particles-js', 'particlesjs-config.json', function() {
          console.log('particles.js loaded');
        });
      }
    };
    document.body.appendChild(script);
  }
});

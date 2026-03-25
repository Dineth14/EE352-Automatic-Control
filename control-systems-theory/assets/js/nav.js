/**
 * assets/js/nav.js
 * Handles sidebar toggling and scroll progress bar.
 */

export function initNav() {
  const menuToggle = document.getElementById('mobile-menu-toggle');
  const sidebar = document.querySelector('.sidebar');
  
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
    
    // Auto-close on link click (mobile)
    const links = sidebar.querySelectorAll('a');
    links.forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          sidebar.classList.remove('open');
        }
      });
    });
  }

  // Progress Bar
  const progressBar = document.createElement('div');
  progressBar.className = 'progress-bar-container';
  progressBar.innerHTML = '<div class="progress-bar" id="scroll-progress"></div>';
  document.body.appendChild(progressBar);
  
  const bar = document.getElementById('scroll-progress');
  
  window.addEventListener('scroll', () => {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    if(bar) {
      bar.style.width = scrolled + '%';
    }
  });

  // Track page visits for index page progress
  trackVisit();
}

function trackVisit() {
  const currentPath = window.location.pathname;
  let visits = JSON.parse(localStorage.getItem('cst-visits') || '{}');
  
  // Extract chapter info (e.g. /chapters/01-laplace...)
  const match = currentPath.match(/\/chapters\/(\d{2})/);
  if (match) {
    const chapNum = parseInt(match[1], 10);
    visits[chapNum] = true;
    localStorage.setItem('cst-visits', JSON.stringify(visits));
  }
}

export function getProgress() {
  return JSON.parse(localStorage.getItem('cst-visits') || '{}');
}

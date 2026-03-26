/* ============================================================
   Navigation — Sidebar + Mobile Collapsible + Scroll Progress
   ============================================================ */
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    // --- Sidebar Toggle (mobile) ---
    const sidebar = document.querySelector('.sidebar');
    const toggle = document.querySelector('.sidebar-toggle');
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:999;display:none;';
    document.body.appendChild(overlay);

    if (toggle && sidebar) {
      toggle.addEventListener('click', function() {
        sidebar.classList.toggle('open');
        overlay.style.display = sidebar.classList.contains('open') ? 'block' : 'none';
        toggle.setAttribute('aria-expanded', sidebar.classList.contains('open'));
      });
      overlay.addEventListener('click', function() {
        sidebar.classList.remove('open');
        overlay.style.display = 'none';
        toggle.setAttribute('aria-expanded', 'false');
      });
    }

    // --- Scroll Progress Bar ---
    const progressBar = document.querySelector('.scroll-progress-bar');
    if (progressBar) {
      window.addEventListener('scroll', function() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        progressBar.style.width = progress + '%';
      }, { passive: true });
    }

    // --- Active Nav Link ---
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    const currentPath = window.location.pathname;
    navLinks.forEach(function(link) {
      const href = link.getAttribute('href');
      if (href && currentPath.includes(href.replace(/^\.\.\//, '').replace(/^\.\//, ''))) {
        link.classList.add('active');
      }
    });

    // --- Collapsible Sections ---
    document.querySelectorAll('.collapsible-header').forEach(function(header) {
      header.addEventListener('click', function() {
        const parent = header.parentElement;
        parent.classList.toggle('open');
        const body = parent.querySelector('.collapsible-body');
        if (parent.classList.contains('open')) {
          body.style.maxHeight = body.scrollHeight + 'px';
        } else {
          body.style.maxHeight = '0';
        }
      });
      // Keyboard accessibility
      header.setAttribute('tabindex', '0');
      header.setAttribute('role', 'button');
      header.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          header.click();
        }
      });
    });

    // --- Worked Example Toggles ---
    document.querySelectorAll('.worked-example-header').forEach(function(header) {
      header.addEventListener('click', function() {
        header.parentElement.classList.toggle('open');
      });
      header.setAttribute('tabindex', '0');
      header.setAttribute('role', 'button');
      header.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          header.click();
        }
      });
    });

    // --- Intersection Observer for Appear Animations ---
    const appearEls = document.querySelectorAll('.appear, .slide-in-right, .scale-in');
    if (appearEls.length > 0 && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });
      appearEls.forEach(function(el) { observer.observe(el); });
    }

    // --- Track Chapter Progress ---
    const chapterMatch = window.location.pathname.match(/chapters\/(\d+)/);
    if (chapterMatch) {
      const chapterNum = parseInt(chapterMatch[1]);
      const visited = JSON.parse(localStorage.getItem('cst-visited') || '[]');
      if (!visited.includes(chapterNum)) {
        visited.push(chapterNum);
        localStorage.setItem('cst-visited', JSON.stringify(visited));
      }
    }
  });
})();

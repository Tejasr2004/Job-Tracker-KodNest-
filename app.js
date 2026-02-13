/**
 * Job Notification Tracker — Client-side Router
 * Simple hash-based routing
 */

class Router {
  constructor() {
    this.routes = {
      '/': this.renderDashboard,
      '/dashboard': this.renderDashboard,
      '/saved': this.renderSaved,
      '/digest': this.renderDigest,
      '/settings': this.renderSettings,
      '/proof': this.renderProof
    };
    
    this.init();
  }

  init() {
    // Handle initial load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.handleRoute());
    } else {
      this.handleRoute();
    }
    
    // Handle hash changes
    window.addEventListener('hashchange', () => this.handleRoute());
    
    // Handle navigation clicks
    document.addEventListener('click', (e) => {
      if (e.target.matches('.kn-nav__link')) {
        e.preventDefault();
        const route = e.target.getAttribute('data-route');
        window.location.hash = route === '/' ? '' : route;
        this.handleRoute();
      }
    });

    // Handle hamburger toggle
    const toggle = document.querySelector('.kn-nav__toggle');
    const navList = document.querySelector('.kn-nav__list');
    
    if (toggle && navList) {
      toggle.addEventListener('click', () => {
        const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', !isExpanded);
        navList.classList.toggle('open');
      });
    }
  }

  handleRoute() {
    const hash = window.location.hash.slice(1) || '/';
    const route = hash === '' ? '/' : hash;
    
    // Update active nav link
    document.querySelectorAll('.kn-nav__link').forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('data-route') === route) {
        link.classList.add('active');
      }
    });

    // Close mobile menu if open
    const navList = document.querySelector('.kn-nav__list');
    const toggle = document.querySelector('.kn-nav__toggle');
    if (navList && navList.classList.contains('open')) {
      navList.classList.remove('open');
      toggle?.setAttribute('aria-expanded', 'false');
    }

    // Render route
    const renderFn = this.routes[route] || this.renderNotFound;
    renderFn.call(this);
  }

  renderPage(title, container) {
    container.innerHTML = `
      <div class="kn-placeholder">
        <h1 class="kn-placeholder__heading">${title}</h1>
        <p class="kn-placeholder__subtext">This section will be built in the next step.</p>
      </div>
    `;
  }

  renderDashboard() {
    const container = document.getElementById('route-container');
    this.renderPage('Dashboard', container);
  }

  renderSaved() {
    const container = document.getElementById('route-container');
    this.renderPage('Saved', container);
  }

  renderDigest() {
    const container = document.getElementById('route-container');
    this.renderPage('Digest', container);
  }

  renderSettings() {
    const container = document.getElementById('route-container');
    this.renderPage('Settings', container);
  }

  renderProof() {
    const container = document.getElementById('route-container');
    this.renderPage('Proof', container);
  }

  renderNotFound() {
    const container = document.getElementById('route-container');
    container.innerHTML = `
      <div class="kn-placeholder">
        <h1 class="kn-placeholder__heading">Page Not Found</h1>
        <p class="kn-placeholder__subtext">The page you're looking for doesn't exist.</p>
      </div>
    `;
  }
}

// Initialize router
new Router();

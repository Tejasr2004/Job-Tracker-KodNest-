
// Route Logic for Job Notification Tracker
const routes = {
    '/': {
        title: 'Dashboard',
        subtext: 'Overview of your job search progress and notifications.'
    },
    '/dashboard': {
        title: 'Dashboard',
        subtext: 'Overview of your job search progress and notifications.'
    },
    '/saved': {
        title: 'Saved Jobs',
        subtext: 'Your curated list of potential opportunities.'
    },
    '/digest': {
        title: 'Daily Digest',
        subtext: 'Summary of new notifications from the last 24 hours.'
    },
    '/settings': {
        title: 'Settings',
        subtext: 'Configure your notification preferences and account details.'
    },
    '/proof': {
        title: 'Proof of Work',
        subtext: 'Verify your completed tasks and deployment status.'
    }
};

const appContent = document.getElementById('app-content');
const navLinks = document.querySelectorAll('.kn-nav-link');
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
const navbar = document.getElementById('navbar');

function navigateTo(path) {
    window.history.pushState({}, path, window.location.origin + path);
    renderRoute(path);
}

function renderRoute(path) {
    const route = routes[path] || routes['/dashboard']; // Default to Dashboard if path not found
    
    // Update Content
    appContent.innerHTML = `
        <div class="kn-route-container">
            <h1 class="kn-route-title">${route.title}</h1>
            <p class="kn-route-subtext">This section will be built in the next step.</p>
            <p style="color: #999; margin-top: 8px; font-size: 14px;">${route.subtext}</p>
        </div>
    `;

    // Update Active Link State
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === path) {
            link.classList.add('active');
        }
    });

    // Close mobile menu if open
    if (navbar.classList.contains('open')) {
        navbar.classList.remove('open');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Handle Initial Load
    renderRoute(window.location.pathname);

    // Handle Link Clicks
    document.body.addEventListener('click', e => {
        if (e.target.matches('[data-link]')) {
            e.preventDefault();
            navigateTo(e.target.getAttribute('href'));
        }
    });

    // Handle Browser Back/Forward
    window.addEventListener('popstate', () => {
        renderRoute(window.location.pathname);
    });

    // Mobile Menu Toggle
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => {
            navbar.classList.toggle('open');
        });
    }
});


// Route Logic for Job Notification Tracker

const appContent = document.getElementById('app-content');
const navLinks = document.querySelectorAll('.kn-nav-link');
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
const navbar = document.getElementById('navbar');

// Page Render Functions
function renderLanding() {
    return `
        <div class="kn-hero">
            <h1>Stop Missing The Right Jobs.</h1>
            <p>Precision-matched job discovery delivered daily at 9AM.</p>
            <a href="/settings" class="kn-btn kn-btn-primary" data-link>Start Tracking</a>
        </div>
    `;
}

function renderDashboard() {
    return `
        <div class="kn-route-container">
            <h1 class="kn-route-title">Dashboard</h1>
            <div class="kn-empty-state">
                <div class="kn-empty-state-icon">&#128202;</div>
                <h3>No jobs yet</h3>
                <p>In the next step, you will load a realistic dataset to see your analytics.</p>
            </div>
        </div>
    `;
}

function renderSettings() {
    return `
        <div class="kn-route-container">
            <h1 class="kn-route-title">Settings</h1>
            <p class="kn-route-subtext" style="margin-bottom: 40px;">Configure your job tracking preferences.</p>
            
            <div class="kn-form-grid">
                <div class="kn-form-group" style="grid-column: span 2;">
                    <label class="kn-form-label">Role Keywords</label>
                    <input type="text" class="kn-input" placeholder="e.g. Senior Frontend Engineer, React Developer">
                </div>
                
                <div class="kn-form-group" style="grid-column: span 2;">
                    <label class="kn-form-label">Preferred Locations</label>
                    <input type="text" class="kn-input" placeholder="e.g. San Francisco, New York, Remote">
                </div>
                
                <div class="kn-form-group">
                    <label class="kn-form-label">Work Mode</label>
                    <select class="kn-select">
                        <option>Remote</option>
                        <option>Hybrid</option>
                        <option>Onsite</option>
                    </select>
                </div>
                
                <div class="kn-form-group">
                    <label class="kn-form-label">Experience Level</label>
                    <select class="kn-select">
                        <option>Mid-Level</option>
                        <option>Senior</option>
                        <option>Staff/Principal</option>
                    </select>
                </div>

                <div style="grid-column: span 2; display: flex; justify-content: flex-end; margin-top: 16px;">
                    <button class="kn-btn kn-btn-primary">Save Preferences</button>
                </div>
            </div>
        </div>
    `;
}

function renderSaved() {
    return `
        <div class="kn-route-container">
            <h1 class="kn-route-title">Saved Jobs</h1>
            <div class="kn-empty-state">
                <div class="kn-empty-state-icon">&#128278;</div>
                <h3>No saved jobs yet</h3>
                <p>Jobs you bookmark as interesting will appear here for easy access.</p>
            </div>
        </div>
    `;
}

function renderDigest() {
    return `
        <div class="kn-route-container">
            <h1 class="kn-route-title">Daily Digest</h1>
            <div class="kn-empty-state">
                <div class="kn-empty-state-icon">&#128231;</div>
                <h3>No digest generated yet</h3>
                <p>Your daily summary of new opportunities will arrive at 9:00 AM.</p>
            </div>
        </div>
    `;
}

function renderProof() {
    return `
        <div class="kn-route-container">
            <h1 class="kn-route-title">Proof of Work</h1>
            <div class="kn-empty-state" style="align-items: flex-start; text-align: left; padding: 40px;">
                <h3 style="margin-bottom: 24px;">Project Artifacts</h3>
                <div style="width: 100%; border: 1px dashed #ccc; padding: 24px; border-radius: 4px; background: #fafafa; color: #777;">
                    <p>Artifact collection area reserved for deployment logs and validation screenshots.</p>
                </div>
            </div>
        </div>
    `;
}


// Router Logic
const routes = {
    '/': renderLanding,
    '/dashboard': renderDashboard,
    '/settings': renderSettings,
    '/saved': renderSaved,
    '/digest': renderDigest,
    '/proof': renderProof
};

function navigateTo(path) {
    if (window.location.pathname !== path) {
        window.history.pushState({}, path, window.location.origin + path);
    }
    renderRoute(path);
}

function renderRoute(path) {
    const renderFn = routes[path] || routes['/']; // Default to Landing

    // Update Content
    appContent.innerHTML = renderFn();

    // Update Active Link State
    navLinks.forEach(link => {
        link.classList.remove('active');
        // Handle root path active state logic if needed, or exact match
        if (link.getAttribute('href') === path) {
            link.classList.add('active');
        }
    });

    // Close mobile menu if open
    if (navbar && navbar.classList.contains('open')) {
        navbar.classList.remove('open');
    }

    // Scroll to top
    window.scrollTo(0, 0);
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

// Route Logic for Job Notification Tracker

const appContent = document.getElementById('app-content');
const navLinks = document.querySelectorAll('.kn-nav-link');
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
const navbar = document.getElementById('navbar');


// --- DATA STORE ---
let allJobs = [];
let savedJobIds = [];

try {
    const stored = localStorage.getItem('kn_saved_jobs');
    if (stored) savedJobIds = JSON.parse(stored);
} catch (e) {
    console.error("Error loading saved jobs:", e);
    savedJobIds = [];
}

// Load Data
if (typeof generateJobData === 'function') {
    allJobs = generateJobData();
    console.log("Jobs Loaded:", allJobs.length);
} else {
    console.error("Job Data Generator not found!");
}

// --- INTERACTIONS ---
window.toggleSaveJob = function (id) {
    const btn = document.getElementById(`btn-save-${id}`);

    if (savedJobIds.includes(id)) {
        // Unsave
        savedJobIds = savedJobIds.filter(jobId => jobId !== id);
        if (btn) {
            btn.innerText = 'Save';
            btn.classList.remove('kn-btn-primary');
            btn.classList.add('kn-btn-secondary');
        }
        // If on saved page, re-render to remove
        if (window.location.pathname === '/saved') {
            renderRoute('/saved');
            return;
        }
    } else {
        // Save
        savedJobIds.push(id);
        if (btn) {
            btn.innerText = 'Saved \u2713';
            btn.classList.remove('kn-btn-secondary');
            btn.classList.add('kn-btn-primary'); // Highlight saved state
        }
    }


    try {
        localStorage.setItem('kn_saved_jobs', JSON.stringify(savedJobIds));
    } catch (e) {
        console.warn("Could not save to localStorage:", e);
    }
};

window.savePreferences = function () {
    // Mock save functionality
    const btn = document.querySelector('.kn-form-grid button');
    const originalText = btn.innerText;

    btn.innerText = 'Preferences Saved!';
    btn.style.backgroundColor = 'var(--color-success)';

    setTimeout(() => {
        btn.innerText = originalText;
        btn.style.backgroundColor = '';
    }, 2000);
};

// ... [Modal Functions remain same, but ensuring window attachment] ...

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Handle Initial Load
    renderRoute(window.location.pathname);

    // Global Click Handler (Delegation)
    document.body.addEventListener('click', e => {
        // Handle Navigation Links
        const link = e.target.closest('[data-link]');
        if (link) {
            e.preventDefault();
            navigateTo(link.getAttribute('href'));
            return;
        }

        // Handle Settings "Save Preferences" button (if not using onclick inline)
        if (e.target.matches('.kn-form-grid button')) {
            window.savePreferences();
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

// --- RENDERING HELPERS ---

function renderJobCard(job, isSaved) {
    const saveBtnText = isSaved ? 'Saved \u2713' : 'Save';
    const saveBtnClass = isSaved ? 'kn-btn-secondary' : 'kn-btn-secondary'; // Could style active state differently if needed

    // Skill tags
    const skillsHtml = job.skills.map(skill => `<span class="kn-tag">${skill}</span>`).join('');

    // Mode tag color
    const modeClass = `kn-tag-${job.mode.toLowerCase()}`;

    return `
    <div class="kn-job-card" id="${job.id}">
        <div class="kn-source-badge">${job.source}</div>
        <div class="kn-job-header">
            <div class="kn-job-title">${job.title}</div>
            <div class="kn-job-company">${job.company}</div>
        </div>
        
        <div class="kn-job-meta">
            <span class="kn-tag ${modeClass}">${job.mode}</span>
            <span class="kn-tag">${job.location}</span>
            <span class="kn-tag">${job.experience}</span>
        </div>
        
        <div style="font-size: 13px; color: #444; margin-bottom: 12px; font-weight: 500;">
            ${job.salaryRange}
        </div>

        <div style="font-size: 12px; color: #888; margin-bottom: 16px;">
            <span style="font-weight: 500; color: #333;">Posted:</span> ${job.postedDaysAgo === 0 ? 'Today' : job.postedDaysAgo + ' days ago'}
        </div>

        <div class="kn-job-actions">
            <button class="kn-btn kn-btn-sm kn-btn-secondary" onclick="openJobModal('${job.id}')">View</button>
            <button class="kn-btn kn-btn-sm ${saveBtnClass}" onclick="toggleSaveJob('${job.id}')" id="btn-save-${job.id}">${saveBtnText}</button>
            <a href="${job.applyUrl}" target="_blank" class="kn-btn kn-btn-sm kn-btn-primary" style="text-decoration:none; text-align:center;">Apply</a>
        </div>
    </div>
    `;
}

function renderFilterBar() {
    return `
    <div class="kn-filter-bar">
        <input type="text" class="kn-search-input" placeholder="Search roles or companies...">
        <select class="kn-filter-select"><option>Location</option><option>Bangalore</option><option>Remote</option></select>
        <select class="kn-filter-select"><option>Mode</option><option>Remote</option><option>Hybrid</option></select>
        <select class="kn-filter-select"><option>Experience</option><option>Fresher</option><option>1-3 Years</option></select>
        <select class="kn-filter-select"><option>Source</option><option>LinkedIn</option><option>Naukri</option></select>
        <select class="kn-filter-select"><option>Sort: Latest</option><option>Sort: Salary</option></select>
    </div>
    `;
}

// --- PAGE RENDER FUNCTIONS ---

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
    const jobListHtml = allJobs.map(job => renderJobCard(job, savedJobIds.includes(job.id))).join('');

    return `
        <div class="kn-route-container" style="max-width: 1200px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:16px;">
                <h1 class="kn-route-title" style="margin-bottom:0; font-size:32px;">Dashboard</h1>
                <span style="color:#666; font-size:14px;">${allJobs.length} Jobs Found</span>
            </div>
            
            ${renderFilterBar()}
            
            <div class="kn-job-list">
                ${jobListHtml}
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
    const savedJobs = allJobs.filter(job => savedJobIds.includes(job.id));

    if (savedJobs.length === 0) {
        return `
        <div class="kn-route-container">
            <h1 class="kn-route-title">Saved Jobs</h1>
            <div class="kn-empty-state">
                <div class="kn-empty-state-icon">&#128278;</div>
                <h3>No saved jobs yet</h3>
                <p>Jobs you bookmark in the dashboard will appear here.</p>
                <a href="/dashboard" class="kn-btn kn-btn-primary" data-link style="margin-top:16px;">Browse Jobs</a>
            </div>
        </div>
        `;
    }

    const jobListHtml = savedJobs.map(job => renderJobCard(job, true)).join('');

    return `
        <div class="kn-route-container" style="max-width: 1200px;">
            <h1 class="kn-route-title" style="margin-bottom:24px;">Saved Jobs</h1>
            <div class="kn-job-list">
                ${jobListHtml}
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


// --- INTERACTIONS ---

window.toggleSaveJob = function (id) {
    const btn = document.getElementById(`btn-save-${id}`);

    if (savedJobIds.includes(id)) {
        // Unsave
        savedJobIds = savedJobIds.filter(jobId => jobId !== id);
        if (btn) {
            btn.innerText = 'Save';
            btn.classList.remove('kn-btn-primary'); // Assuming secondary is default
        }
        // If on saved page, re-render to remove it (optional, but good UX)
        if (window.location.pathname === '/saved') {
            renderRoute('/saved');
            return;
        }
    } else {
        // Save
        savedJobIds.push(id);
        if (btn) {
            btn.innerText = 'Saved \u2713';
        }
    }

    localStorage.setItem('kn_saved_jobs', JSON.stringify(savedJobIds));
};

window.openJobModal = function (id) {
    const job = allJobs.find(j => j.id === id);
    if (!job) return;

    // Create modal HTML
    const modalHtml = `
        <div class="kn-modal-overlay active" id="job-modal" onclick="closeJobModal(event)">
            <div class="kn-modal-content">
                <button class="kn-close-modal" onclick="closeJobModal(null, true)">&times;</button>
                <div class="kn-job-header" style="margin-top:16px;">
                    <h2 style="font-family:var(--font-heading); margin-bottom:8px;">${job.title}</h2>
                    <h3 style="font-size:18px; color:#555; font-weight:500;">${job.company}</h3>
                </div>
                
                <div class="kn-job-meta" style="font-size:14px; margin-bottom:24px;">
                    <span class="kn-tag">${job.location}</span>
                    <span class="kn-tag">${job.mode}</span>
                    <span class="kn-tag">${job.experience}</span>
                    <span class="kn-tag">${job.salaryRange}</span>
                </div>
                
                <p style="margin-bottom:24px; color:#333; line-height:1.7;">${job.description}</p>
                
                <h4 style="font-size:14px; text-transform:uppercase; color:#999; margin-bottom:12px;">Skills</h4>
                <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:32px;">
                    ${job.skills.map(s => `<span class="kn-tag" style="background:#E0E0E0;">${s}</span>`).join('')}
                </div>
                
                <div style="display:flex; gap:16px;">
                    <a href="${job.applyUrl}" target="_blank" class="kn-btn kn-btn-primary" style="flex:2; text-decoration:none; text-align:center;">Apply Now</a>
                    <button class="kn-btn kn-btn-secondary" style="flex:1;" onclick="toggleSaveJob('${job.id}'); closeJobModal(null, true);">
                        ${savedJobIds.includes(job.id) ? 'Saved' : 'Save for Later'}
                    </button>
                </div>
            </div>
        </div>
    `;

    // Append to body
    const existingModal = document.getElementById('job-modal');
    if (existingModal) existingModal.remove();

    document.body.insertAdjacentHTML('beforeend', modalHtml);
};

window.closeJobModal = function (e, force = false) {
    if (force || e.target.id === 'job-modal') {
        const modal = document.getElementById('job-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 200); // Wait for transition
        }
    }
};


// --- ROUTER ---

const routes = {
    '/': renderLanding,
    '/dashboard': renderDashboard,
    '/settings': renderSettings,
    '/saved': renderSaved,
    '/digest': renderDigest,
    '/proof': renderProof
};


function navigateTo(path) {
    window.location.hash = path;
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
    const initialPath = window.location.hash.slice(1) || '/';
    renderRoute(initialPath);

    // Handle Link Clicks
    document.body.addEventListener('click', e => {
        if (e.target.matches('[data-link]')) {
            e.preventDefault();
            navigateTo(e.target.getAttribute('href'));
        }
    });

    // Handle Hash Change (Back/Forward matches hash routing)
    window.addEventListener('hashchange', () => {
        const path = window.location.hash.slice(1) || '/';
        renderRoute(path);
    });

    // Mobile Menu Toggle
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => {
            navbar.classList.toggle('open');
        });
    }
});


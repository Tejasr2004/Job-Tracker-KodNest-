// Route Logic for Job Notification Tracker

const appContent = document.getElementById('app-content');
const navLinks = document.querySelectorAll('.kn-nav-link');
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
const navbar = document.getElementById('navbar');


// --- DATA STORE ---
let allJobs = [];
let savedJobIds = [];
let userPreferences = {
    roleKeywords: [],
    preferredLocations: [],
    preferredMode: [],
    experienceLevel: '',
    skills: [],
    minMatchScore: 40
};
let showOnlyMatches = false; // Toggle state

// Load Preferences
try {
    const storedPrefs = localStorage.getItem('kn_job_preferences');
    if (storedPrefs) userPreferences = JSON.parse(storedPrefs);
} catch (e) {
    console.error("Error loading preferences:", e);
}

// Load Saved Jobs
try {
    const storedSaved = localStorage.getItem('kn_saved_jobs');
    if (storedSaved) savedJobIds = JSON.parse(storedSaved);
} catch (e) {
    console.error("Error loading saved jobs:", e);
}

// MATCH SCORE ENGINE
function calculateMatchScore(job) {
    if (!userPreferences.roleKeywords.length && !userPreferences.preferredLocations.length) return 0;

    let score = 0;

    // 1. Role Keywords (+25 Title, +15 Desc)
    const jobTitle = job.title.toLowerCase();
    const jobDesc = job.description.toLowerCase();
    const hasTitleMatch = userPreferences.roleKeywords.some(k => jobTitle.includes(k.toLowerCase()));
    const hasDescMatch = userPreferences.roleKeywords.some(k => jobDesc.includes(k.toLowerCase()));

    if (hasTitleMatch) score += 25;
    if (hasDescMatch) score += 15;

    // 2. Location (+15)
    // Precise match
    if (userPreferences.preferredLocations.some(l => l.toLowerCase() === job.location.toLowerCase())) {
        score += 15;
    }

    // 3. Mode (+10)
    if (userPreferences.preferredMode.map(m => m.toLowerCase()).includes(job.mode.toLowerCase())) {
        score += 10;
    }

    // 4. Experience (+10)
    // Simple string match for MVP
    if (userPreferences.experienceLevel && job.experience === userPreferences.experienceLevel) {
        score += 10;
    }

    // 5. Skills Overlap (+15 if any match)
    const userSkills = userPreferences.skills.map(s => s.toLowerCase());
    const jobSkills = job.skills.map(s => s.toLowerCase());
    const hasSkillMatch = jobSkills.some(s => userSkills.includes(s));
    if (hasSkillMatch) score += 15;

    // 6. Recency (+5 if <= 2 days)
    if (job.postedDaysAgo <= 2) score += 5;

    // 7. Source (+5 if LinkedIn)
    if (job.source === 'LinkedIn') score += 5;

    return Math.min(score, 100); // Cap at 100
}

// Load Data & Calc Scores
if (typeof generateJobData === 'function') {
    allJobs = generateJobData();
    // Calculate scores immediately
    allJobs.forEach(job => {
        job.matchScore = calculateMatchScore(job);
    });
    console.log("Jobs Loaded & Scored:", allJobs.length);
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
    // User asked for: preferredLocations (multi-select dropdown). Standard <select multiple> is ugly but functional.
    // Let's stick to text input for "flexible" or standard <select multiple>.
    // Actually, to make it look "Premium" without libraries, a set of checkboxes or a text input with pills is better.
    // Given constraints, I will use a simple text input for locations (comma separated) as it's robust, OR a list of checkboxes if the list is small. 
    // The user's list is: "Bangalore", "Hyderabad", "Pune", "Chennai", "Gurgaon", "Noida", "Mumbai", "Remote".
    // I'll implement a clean checkbox grid for locations to meet "multi-select" intent better than a native multi-select box.

    // Correction: User asked for "multi-select dropdown". I will use a standard <select multiple> but styled needed, or just text input for simplicity and "comma-separated" behavior which is often more user friendly than Ctrl+Click.
    // WAIT. "Fields: preferredLocations (multi-select dropdown)". I should try to honor "dropdown".
    // I will use a simple <select multiple> with a height.

    const roles = document.getElementById('pref-role-input').value.split(',').map(s => s.trim()).filter(Boolean);
    const skills = document.getElementById('pref-skill-input').value.split(',').map(s => s.trim()).filter(Boolean);
    const exp = document.getElementById('pref-exp').value;
    const minScore = parseInt(document.getElementById('pref-min-score').value);

    // Locations (from select multiple)
    const locSelect = document.getElementById('pref-locs');
    const selectedLocs = Array.from(locSelect.selectedOptions).map(opt => opt.value);

    // Mode (checkboxes)
    const modes = [];
    if (document.getElementById('mode-remote').checked) modes.push('Remote');
    if (document.getElementById('mode-hybrid').checked) modes.push('Hybrid');
    if (document.getElementById('mode-onsite').checked) modes.push('Onsite');

    userPreferences = {
        roleKeywords: roles,
        preferredLocations: selectedLocs,
        preferredMode: modes,
        experienceLevel: exp,
        skills: skills,
        minMatchScore: minScore
    };

    localStorage.setItem('kn_job_preferences', JSON.stringify(userPreferences));

    // Re-score all jobs
    allJobs.forEach(job => job.matchScore = calculateMatchScore(job));

    // UI Feedback
    const btn = document.getElementById('btn-save-prefs');
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


// --- INTERACTIONS ---
window.toggleMatchFilter = function () {
    showOnlyMatches = !showOnlyMatches;
    renderRoute('/dashboard');
};

// --- RENDERING HELPERS ---

function renderJobCard(job, isSaved) {
    const saveBtnText = isSaved ? 'Saved \u2713' : 'Save';
    const saveBtnClass = isSaved ? 'kn-btn-secondary' : 'kn-btn-secondary';

    // Skill tags
    const skillsHtml = job.skills.map(skill => `<span class="kn-tag">${skill}</span>`).join('');

    // Mode tag color
    const modeClass = `kn-tag-${job.mode.toLowerCase()}`;

    // Match Badge Logic
    let matchClass = 'kn-match-low';
    if (job.matchScore >= 80) matchClass = 'kn-match-high';
    else if (job.matchScore >= 60) matchClass = 'kn-match-medium';
    else if (job.matchScore >= 40) matchClass = 'kn-match-neutral';

    const matchBadge = `<div class="kn-match-badge ${matchClass}">Match: ${job.matchScore || 0}%</div>`;

    return `
    <div class="kn-job-card" id="${job.id}">
        ${matchBadge}
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


// State for filters to persist across re-renders
let dashboardFilters = {
    search: '',
    location: '',
    mode: '',
    source: '',
    sort: 'latest'
};

function renderFilterBar() {
    return `
    <div style="margin-bottom: 16px; display:flex; justify-content:space-between; align-items:center;">
        <div class="kn-filter-bar" style="margin-bottom:0; flex:1;">
            <input type="text" id="filter-search" class="kn-search-input" placeholder="Search roles or companies..." 
                   value="${dashboardFilters.search}" oninput="handleFilterChange()">
            
            <select id="filter-loc" class="kn-filter-select" onchange="handleFilterChange()">
                <option value="">Location: Any</option>
                <option value="Bangalore" ${dashboardFilters.location === 'Bangalore' ? 'selected' : ''}>Bangalore</option>
                <option value="Remote" ${dashboardFilters.location === 'Remote' ? 'selected' : ''}>Remote</option>
                <option ${dashboardFilters.location === 'Hyderabad' ? 'selected' : ''}>Hyderabad</option>
                <option ${dashboardFilters.location === 'Pune' ? 'selected' : ''}>Pune</option>
                <option ${dashboardFilters.location === 'Chennai' ? 'selected' : ''}>Chennai</option>
                <option ${dashboardFilters.location === 'Gurgaon' ? 'selected' : ''}>Gurgaon</option>
                <option ${dashboardFilters.location === 'Noida' ? 'selected' : ''}>Noida</option>
                <option ${dashboardFilters.location === 'Mumbai' ? 'selected' : ''}>Mumbai</option>
            </select>
            
            <select id="filter-mode" class="kn-filter-select" onchange="handleFilterChange()">
                <option value="">Mode: Any</option>
                <option value="Remote" ${dashboardFilters.mode === 'Remote' ? 'selected' : ''}>Remote</option>
                <option value="Hybrid" ${dashboardFilters.mode === 'Hybrid' ? 'selected' : ''}>Hybrid</option>
                <option value="Onsite" ${dashboardFilters.mode === 'Onsite' ? 'selected' : ''}>Onsite</option>
            </select>
            
            <select id="filter-src" class="kn-filter-select" onchange="handleFilterChange()">
                <option value="">Source: Any</option>
                <option ${dashboardFilters.source === 'LinkedIn' ? 'selected' : ''}>LinkedIn</option>
                <option ${dashboardFilters.source === 'Naukri' ? 'selected' : ''}>Naukri</option>
                <option ${dashboardFilters.source === 'Indeed' ? 'selected' : ''}>Indeed</option>
                <option ${dashboardFilters.source === 'Instahyre' ? 'selected' : ''}>Instahyre</option>
                <option ${dashboardFilters.source === 'Hirist' ? 'selected' : ''}>Hirist</option>
            </select>
            
            <select id="filter-sort" class="kn-filter-select" onchange="handleFilterChange()">
                <option value="latest" ${dashboardFilters.sort === 'latest' ? 'selected' : ''}>Sort: Latest</option>
                <option value="match" ${dashboardFilters.sort === 'match' ? 'selected' : ''}>Sort: Match Score</option>
                <option value="salary" ${dashboardFilters.sort === 'salary' ? 'selected' : ''}>Sort: Salary</option>
            </select>
        </div>
        
        <label class="kn-toggle-wrapper" style="margin-left:16px; flex-shrink:0;">
            <input type="checkbox" class="kn-toggle-input" ${showOnlyMatches ? 'checked' : ''} onchange="window.toggleMatchFilter()">
            <div class="kn-toggle-slider"></div>
            <span>Show Only Matches (>${userPreferences.minMatchScore || 40}%)</span>
        </label>
    </div>
    `;
}

// Global filter handler
let filterTimeout;
window.handleFilterChange = function () {
    // Update state immediately
    dashboardFilters.search = document.getElementById('filter-search').value;
    dashboardFilters.location = document.getElementById('filter-loc').value;
    dashboardFilters.mode = document.getElementById('filter-mode').value;
    dashboardFilters.source = document.getElementById('filter-src').value;
    dashboardFilters.sort = document.getElementById('filter-sort').value;

    // Debounce re-render
    clearTimeout(filterTimeout);
    filterTimeout = setTimeout(() => {
        renderRoute('/dashboard');
        // Restore focus to search if it was active (simple heuristic)
        const searchInput = document.getElementById('filter-search');
        if (searchInput && dashboardFilters.search) {
            searchInput.focus();
            // Cursor position hack (move to end)
            searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
        }
    }, 300);
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
    // 1. Filter Logic using STATE
    let filtered = allJobs;

    // Search
    const searchVal = dashboardFilters.search.toLowerCase();
    if (searchVal) {
        filtered = filtered.filter(j => j.title.toLowerCase().includes(searchVal) || j.company.toLowerCase().includes(searchVal));
    }

    // Loc
    const locVal = dashboardFilters.location;
    if (locVal) filtered = filtered.filter(j => j.location === locVal);

    // Mode
    const modeVal = dashboardFilters.mode;
    if (modeVal) filtered = filtered.filter(j => j.mode === modeVal);

    // Source
    const srcVal = dashboardFilters.source;
    if (srcVal) filtered = filtered.filter(j => j.source === srcVal);

    // Match Threshold
    if (showOnlyMatches) {
        const threshold = userPreferences.minMatchScore || 40;
        filtered = filtered.filter(j => j.matchScore >= threshold);
    }

    // 2. Sort Logic
    const sortVal = dashboardFilters.sort;
    if (sortVal === 'match') {
        filtered.sort((a, b) => b.matchScore - a.matchScore);
    } else if (sortVal === 'salary') {
        const getSal = s => {
            const m = s.match(/(\d+)/);
            return m ? parseInt(m[0]) : 0;
        };
        filtered.sort((a, b) => getSal(b.salaryRange) - getSal(a.salaryRange));
    } else {
        // Latest (default)
        filtered.sort((a, b) => a.postedDaysAgo - b.postedDaysAgo);
    }

    const jobListHtml = filtered.map(job => renderJobCard(job, savedJobIds.includes(job.id))).join('');

    // Empty State for No Matches
    let content = '';
    if (filtered.length === 0) {
        content = `
        <div class="kn-empty-state">
            <div class="kn-empty-state-icon">&#128269;</div>
            <h3>No roles match your criteria</h3>
            <p>Adjust your filters or lower your match threshold in Settings.</p>
            <button onclick="window.location.hash='/settings'" class="kn-btn kn-btn-primary" style="margin-top:16px;">Adjust Preferences</button>
        </div>
        `;
    } else {
        content = `<div class="kn-job-list">${jobListHtml}</div>`;
    }

    // Banner if no preferences
    let banner = '';
    const hasPrefs = userPreferences.roleKeywords.length > 0 || userPreferences.preferredLocations.length > 0;
    if (!hasPrefs) {
        banner = `
        <div style="background-color:#E3F2FD; padding:12px 16px; border-radius:4px; margin-bottom:16px; color:#0D47A1; display:flex; justify-content:space-between; align-items:center;">
            <span><strong>Tip:</strong> Set your preferences to activate intelligent matching.</span>
            <button onclick="window.location.hash='/settings'" class="kn-btn kn-btn-sm kn-btn-primary" style="background-color:#1565C0;">Set Preferences</button>
        </div>
        `;
    }

    return `
        <div class="kn-route-container" style="max-width: 1200px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:16px;">
                <h1 class="kn-route-title" style="margin-bottom:0; font-size:32px;">Dashboard</h1>
                <span style="color:#666; font-size:14px;">${filtered.length} Jobs Found</span>
            </div>
            
            ${banner}
            ${renderFilterBar()}
            
            ${content}
        </div>
    `;
}

function renderSettings() {
    // Helpers to pre-fill
    const rolesStr = userPreferences.roleKeywords.join(', ');
    const skillsStr = userPreferences.skills.join(', ');

    const isModechk = (m) => userPreferences.preferredMode.includes(m) ? 'checked' : '';
    const locs = ["Bangalore", "Hyderabad", "Pune", "Chennai", "Gurgaon", "Noida", "Mumbai", "Remote"];
    const isLocSel = (l) => userPreferences.preferredLocations.includes(l) ? 'selected' : '';

    return `
        <div class="kn-route-container">
            <h1 class="kn-route-title">Settings</h1>
            <p class="kn-route-subtext" style="margin-bottom: 40px;">Configure your job tracking preferences.</p>
            
            <div class="kn-form-grid">
                <div class="kn-form-group" style="grid-column: span 2;">
                    <label class="kn-form-label">Role Keywords (comma separated)</label>
                    <input type="text" id="pref-role-input" class="kn-input" value="${rolesStr}" placeholder="e.g. Senior Frontend Engineer, React Developer">
                </div>
                
                <div class="kn-form-group">
                    <label class="kn-form-label">Preferred Locations (Hold Ctrl/Cmd to select multiple)</label>
                    <select id="pref-locs" class="kn-input" multiple style="height: 120px;">
                        ${locs.map(l => `<option value="${l}" ${isLocSel(l)}>${l}</option>`).join('')}
                    </select>
                </div>
                
                <div class="kn-form-group">
                    <label class="kn-form-label">Work Mode</label>
                    <div style="display:flex; flex-direction:column; gap:8px; padding:8px; border:1px solid var(--color-border); border-radius:4px; background:white;">
                        <label class="kn-checkbox-item"><input type="checkbox" id="mode-remote" ${isModechk('Remote')}> Remote</label>
                        <label class="kn-checkbox-item"><input type="checkbox" id="mode-hybrid" ${isModechk('Hybrid')}> Hybrid</label>
                        <label class="kn-checkbox-item"><input type="checkbox" id="mode-onsite" ${isModechk('Onsite')}> Onsite</label>
                    </div>
                </div>
                
                <div class="kn-form-group">
                    <label class="kn-form-label">Experience Level</label>
                    <select id="pref-exp" class="kn-select">
                        <option value="">Any</option>
                        <option value="Fresher" ${userPreferences.experienceLevel === 'Fresher' ? 'selected' : ''}>Fresher</option>
                        <option value="0-1 Years" ${userPreferences.experienceLevel === '0-1 Years' ? 'selected' : ''}>0-1 Years</option>
                        <option value="1-3 Years" ${userPreferences.experienceLevel === '1-3 Years' ? 'selected' : ''}>1-3 Years</option>
                    </select>
                </div>

                <div class="kn-form-group">
                    <label class="kn-form-label">Minimum Match Score (0-100)</label>
                    <div style="display:flex; align-items:center; gap:16px;">
                        <input type="range" id="pref-min-score" min="0" max="100" value="${userPreferences.minMatchScore || 40}" style="flex:1;" oninput="document.getElementById('score-val').innerText = this.value">
                        <span id="score-val" style="font-weight:bold; min-width:30px;">${userPreferences.minMatchScore || 40}</span>
                    </div>
                </div>

                <div class="kn-form-group" style="grid-column: span 2;">
                    <label class="kn-form-label">Skills (comma separated)</label>
                    <input type="text" id="pref-skill-input" class="kn-input" value="${skillsStr}" placeholder="e.g. Java, Python, React, AWS">
                </div>

                <div style="grid-column: span 2; display: flex; justify-content: flex-end; margin-top: 16px;">
                    <button class="kn-btn kn-btn-primary" id="btn-save-prefs" onclick="savePreferences()">Save Preferences</button>
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


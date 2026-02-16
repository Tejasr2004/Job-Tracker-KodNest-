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
    status: '',
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
            
            <select id="filter-status" class="kn-filter-select" onchange="handleFilterChange()">
                <option value="">Status: All</option>
                <option value="Not Applied" ${dashboardFilters.status === 'Not Applied' ? 'selected' : ''}>Not Applied</option>
                <option value="Applied" ${dashboardFilters.status === 'Applied' ? 'selected' : ''}>Applied</option>
                <option value="Rejected" ${dashboardFilters.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
                <option value="Selected" ${dashboardFilters.status === 'Selected' ? 'selected' : ''}>Selected</option>
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
    dashboardFilters.status = document.getElementById('filter-status').value;
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

    // Status
    const statusVal = dashboardFilters.status;
    if (statusVal) {
        filtered = filtered.filter(j => {
            const s = jobStatuses[j.id]?.status || 'Not Applied';
            return s === statusVal;
        });
    }

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


window.generateDigest = function () {
    const today = new Date().toISOString().split('T')[0];
    const digestKey = `jobTrackerDigest_${today}`;

    // Sort logic: Match Score DESC, then Date Posted ASC (freshness) -> actually prompt said PostedDaysAgo ASC (which means smaller number = fresher)
    // "1) matchScore descending, 2) postedDaysAgo ascending"
    const candidates = [...allJobs].sort((a, b) => {
        if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
        return a.postedDaysAgo - b.postedDaysAgo;
    });

    const top10 = candidates.slice(0, 10);

    // Store
    const digestData = {
        date: today,
        jobs: top10
    };
    localStorage.setItem(digestKey, JSON.stringify(digestData));

    // Re-render
    renderRoute('/digest');
};

window.copyDigest = function () {
    const content = document.getElementById('digest-content').innerText;
    navigator.clipboard.writeText(content).then(() => {
        const btn = document.getElementById('btn-copy-digest');
        const original = btn.innerText;
        btn.innerText = 'Copied!';
        setTimeout(() => btn.innerText = original, 2000);
    });
};

window.emailDigest = function () {
    const subject = "My 9AM Job Digest";
    const body = encodeURIComponent(document.getElementById('digest-content').innerText);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
};

function renderDigest() {
    const today = new Date().toISOString().split('T')[0];
    const digestKey = `jobTrackerDigest_${today}`;

    // Check for existing digest
    let digestData = null;
    try {
        const stored = localStorage.getItem(digestKey);
        if (stored) digestData = JSON.parse(stored);
    } catch (e) {
        console.error(e);
    }

    // 1. Empty State / Generator
    if (!digestData) {
        // Blocking if no preferences
        const hasPrefs = userPreferences.roleKeywords.length > 0 || userPreferences.preferredLocations.length > 0;
        if (!hasPrefs) {
            return `
                <div class="kn-route-container">
                    <h1 class="kn-route-title">Daily Digest</h1>
                    <div class="kn-empty-state">
                        <div class="kn-empty-state-icon" style="color:#B0BEC5;">&#9888;</div>
                        <h3>Personalization Required</h3>
                        <p>Set your preferences to generate a personalized daily digest.</p>
                        <a href="/settings" class="kn-btn kn-btn-primary" data-link style="margin-top:16px;">Set Preferences</a>
                    </div>
                </div>
            `;
        }

        return `
            <div class="kn-route-container">
                <h1 class="kn-route-title">Daily Digest</h1>
                <div class="kn-empty-state">
                    <div class="kn-empty-state-icon">&#128231;</div>
                    <h3>Your 9AM Briefing</h3>
                    <p>Generate your curated list of top opportunities for today (${today}).</p>
                    <button onclick="generateDigest()" class="kn-btn kn-btn-primary" style="margin-top:24px;">Generate Today's Digest (Simulated)</button>
                    <div style="margin-top:12px; font-size:12px; color:#999;">Demo Mode: Daily trigger simulated manually.</div>
                </div>
            </div>
        `;
    }


    // 2. Render Digest (Email Style)
    const jobsHtml = digestData.jobs.map(job => `
        <div class="kn-digest-item" style="padding: 16px; border-bottom: 1px solid #EEE; display:flex; justify-content:space-between; align-items:flex-start;">
            <div style="flex:1;">
                <div style="font-weight:700; font-size:16px; color:#333; margin-bottom:4px;">${job.title}</div>
                <div style="font-size:14px; color:#666; margin-bottom:8px;">${job.company} &bull; ${job.location}</div>
                <div style="font-size:12px; color:#888;">${job.experience} &bull; Match: <strong style="color:var(--color-success);">${job.matchScore}%</strong></div>
            </div>
            <a href="${job.applyUrl}" target="_blank" class="kn-btn kn-btn-sm kn-btn-secondary" style="margin-left:16px;">Apply</a>
        </div>
    `).join('');

    // Recent Status Updates
    const recentUpdates = Object.entries(jobStatuses)
        .map(([id, data]) => {
            const job = allJobs.find(j => j.id === id);
            return job ? { ...job, status: data.status, statusDate: data.date } : null;
        })
        .filter(j => j)
        .sort((a, b) => new Date(b.statusDate) - new Date(a.statusDate))
        .slice(0, 5);

    const updatesHtml = recentUpdates.length > 0 ? `
        <div style="padding:16px; background:#FAFAFA; border-top:1px solid #EEE; border-bottom:1px solid #EEE; font-size:13px; color:#666; text-align:center; font-weight:bold; margin-top:0;">
            Recent Status Updates
        </div>
        ${recentUpdates.map(job => `
            <div class="kn-digest-item" style="padding: 12px 16px; border-bottom: 1px solid #EEE; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <div style="font-size:14px; font-weight:600; color:#333;">${job.title}</div>
                    <div style="font-size:12px; color:#666;">${job.company}</div>
                </div>
                <div style="text-align:right;">
                     <span class="kn-tag status-${job.status.toLowerCase().replace(' ', '-')}" style="margin:0;">${job.status}</span>
                     <div style="font-size:10px; color:#999; margin-top:2px;">${job.statusDate}</div>
                </div>
            </div>
        `).join('')}
    ` : '';

    return `
        <div class="kn-route-container" style="background-color:#F4F4F4; min-height:80vh; padding-top:40px;">
            <div class="kn-digest-paper" style="max-width:600px; margin:0 auto; background:white; border:1px solid #DDD; border-radius:8px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.05);">
                <!-- Header -->
                <div style="background-color:var(--color-text); color:white; padding:24px; text-align:center;">
                    <h2 style="font-family:var(--font-heading); margin:0; font-size:24px;">Top 10 Jobs For You</h2>
                    <div style="font-size:13px; opacity:0.8; margin-top:8px; letter-spacing:1px; text-transform:uppercase;">9AM Digest &bull; ${today}</div>
                </div>

                <!-- Content -->
                <div id="digest-content">
                    <div style="padding:16px; background:#FAFAFA; border-bottom:1px solid #EEE; font-size:13px; color:#666; text-align:center;">
                        High-priority matches based on your preferences.
                    </div>
                    ${jobsHtml}
                    ${digestData.jobs.length === 0 ? '<div style="padding:32px; text-align:center; color:#888;">No matching roles today. Check again tomorrow.</div>' : ''}
                    
                    ${updatesHtml}
                </div>

                <!-- Footer -->

                <div style="background-color:#FAFAFA; padding:16px; border-top:1px solid #EEE; text-align:center; font-size:12px; color:#999;">
                    This digest was generated based on your preferences.<br>
                    <a href="#" onclick="window.scrollTo(0,0); return false;" style="color:#666; text-decoration:none;">Back to Top</a>
                </div>
            </div>

            <!-- Actions -->
            <div style="max-width:600px; margin:24px auto; display:flex; gap:16px; justify-content:center;">
                <button id="btn-copy-digest" onclick="copyDigest()" class="kn-btn kn-btn-secondary" style="background:white;">Copy to Clipboard</button>
                <button onclick="emailDigest()" class="kn-btn kn-btn-secondary" style="background:white;">Create Email Draft</button>
            </div>
        </div>
    `;
}

window.toggleTestItem = function (index) {
    testChecklist[index] = !testChecklist[index];
    localStorage.setItem('kn_test_checklist', JSON.stringify(testChecklist));
    renderRoute('/jt/07-test'); // Re-render to update UI
};

window.resetTestChecklist = function () {
    if (confirm("Reset all test progress?")) {
        testChecklist = Array(10).fill(false);
        localStorage.setItem('kn_test_checklist', JSON.stringify(testChecklist));
        renderRoute('/jt/07-test');
    }
};

function renderTestChecklist() {
    const items = [
        "Preferences persist after refresh",
        "Match score calculates correctly",
        '"Show only matches" toggle works',
        "Save job persists after refresh",
        "Apply opens in new tab",
        "Status update persists after refresh",
        "Status filter works correctly",
        "Digest generates top 10 by score",
        "Digest persists for the day",
        "No console errors on main pages"
    ];

    const passedCount = testChecklist.filter(Boolean).length;
    const isPassing = passedCount === 10;
    const progressColor = isPassing ? 'var(--color-success)' : '#F57C00';

    return `
        <div class="kn-route-container" style="max-width: 800px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
                <h1 class="kn-route-title" style="margin:0;">Test Checklist</h1>
                <button onclick="resetTestChecklist()" class="kn-btn kn-btn-sm kn-btn-secondary">Reset Test Status</button>
            </div>

            <div style="background:white; padding:24px; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.05); border:1px solid #EEE;">
                <div style="margin-bottom:24px; padding-bottom:16px; border-bottom:1px solid #EEE; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <h3 style="margin:0; font-size:18px;">Tests Passed: <span style="color:${progressColor}">${passedCount} / 10</span></h3>
                        ${!isPassing ? '<div style="font-size:13px; color:#666; margin-top:4px;">Resolve all issues before shipping.</div>' : '<div style="font-size:13px; color:var(--color-success); margin-top:4px;">All systems go! Ready to ship.</div>'}
                    </div>
                    <div style="font-size:32px;">${isPassing ? '&#9989;' : '&#128295;'}</div>
                </div>

                <div style="display:flex; flex-direction:column; gap:12px;">
                    ${items.map((item, i) => `
                        <label class="kn-checklist-item" style="display:flex; align-items:center; padding:12px; border:1px solid #EEE; border-radius:6px; cursor:pointer; background:${testChecklist[i] ? '#F9FFF9' : 'white'}; transition:all 0.2s;">
                            <input type="checkbox" onchange="toggleTestItem(${i})" ${testChecklist[i] ? 'checked' : ''} style="width:20px; height:20px; margin-right:16px; cursor:pointer;">
                            <span style="font-size:15px; ${testChecklist[i] ? 'text-decoration:line-through; color:#888;' : 'color:#333;'}">${item}</span>
                        </label>
                    `).join('')}
                </div>
                
                ${isPassing ? `
                    <div style="margin-top:24px; text-align:center;">
                        <button onclick="window.location.hash='/jt/08-ship'" class="kn-btn kn-btn-primary" style="width:100%; padding:16px; font-size:16px;">Proceed to Ship &rarr;</button>
                    </div>
                ` : ''}
            </div>
        </div>
        `;
}

function renderShip() {
    const passedCount = testChecklist.filter(Boolean).length;

    if (passedCount < 10) {
        return `
            <div class="kn-route-container" style="text-align:center; padding-top:80px;">
                <div style="font-size:64px; margin-bottom:24px;">&#128274;</div>
                <h1 style="margin-bottom:16px;">Ship Locked</h1>
                <p style="color:#666; max-width:400px; margin:0 auto 32px auto;">You must verify all 10 items on the checklist before you can access the shipping controls.</p>
                <a href="#/jt/07-test" class="kn-btn kn-btn-primary">Go to Checklist</a>
            </div>
        `;
    }

    return `
        <div class="kn-route-container" style="text-align:center; padding-top:60px;">
            <div style="font-size:64px; margin-bottom:24px;">&#128640;</div>
            <h1 style="margin-bottom:16px; color:var(--color-success);">Ready to Ship!</h1>
            <p style="color:#666; max-width:500px; margin:0 auto 32px auto;">All tests passed. You are cleared to deploy the Job Notification Tracker v1.0.</p>
            
            <div style="padding:24px; background:white; border:1px solid #EEE; border-radius:8px; max-width:500px; margin:0 auto; text-align:left;">
                <h3 style="margin-bottom:16px;">Release Notes</h3>
                <ul style="color:#555; line-height:1.6; padding-left:20px;">
                    <li>Preferences Engine & LocalStorage Persistence</li>
                    <li>Deterministic Match Scoring (0-100)</li>
                    <li>Daily Digest with Email-Style UI</li>
                    <li>Job Status Tracking (Applied/Rejected/Selected)</li>
                    <li>Built-in Test Suite</li>
                </ul>
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

// Load Saved Jobs
try {
    const storedSaved = localStorage.getItem('kn_saved_jobs');
    if (storedSaved) savedJobIds = JSON.parse(storedSaved);
} catch (e) {
    console.error("Error loading saved jobs:", e);
}


// Load Job Statuses
let jobStatuses = {}; // { jobId: { status: 'Applied', date: '2023-10-27' } }
try {
    const storedStatus = localStorage.getItem('kn_job_statuses');
    if (storedStatus) jobStatuses = JSON.parse(storedStatus);
} catch (e) {
    console.error("Error loading job statuses:", e);
}

// Load Test Checklist
let testChecklist = Array(10).fill(false);
try {
    const storedChecklist = localStorage.getItem('kn_test_checklist');
    if (storedChecklist) testChecklist = JSON.parse(storedChecklist);
} catch (e) {
    console.error("Error loading checklist:", e);
}

// MATCH SCORE ENGINE
function calculateMatchScore(job) {
    if (!userPreferences.roleKeywords.length && !userPreferences.preferredLocations.length) return 0;
    // ... (rest of match score logic)


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

window.updateJobStatus = function (id, newStatus) {
    if (!newStatus) return;

    // Update State
    const today = new Date().toISOString().split('T')[0];
    if (newStatus === 'Not Applied') {
        delete jobStatuses[id];
    } else {
        jobStatuses[id] = { status: newStatus, date: today };
    }

    // Persist
    localStorage.setItem('kn_job_statuses', JSON.stringify(jobStatuses));

    // Visual Feedback
    const select = document.getElementById(`status-${id}`);
    if (select) {
        select.className = `kn-status-select status-${newStatus.toLowerCase().replace(' ', '-')}`;
    }

    // Toast
    showToast(`Status updated: ${newStatus}`);

    // Re-render if filtering is active (optional, but good for consistency)
    // For now, let's keep it simple to avoid jumping UI.
};

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'kn-toast';
    toast.innerText = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }, 100);
}

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
    '/proof': renderProof,
    '/jt/07-test': renderTestChecklist,
    '/jt/08-ship': renderShip
};


function navigateTo(path) {
    window.location.hash = path;
}

function renderRoute(path) {
    const renderFn = routes[path] || routes['/']; // Default to Landing

    // Update Content
    appContent.innerHTML = renderFn();

    // ... (rest of router logic)


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




function renderJobCard(job, isSaved) {
    const saveBtnText = isSaved ? 'Saved \u2713' : 'Save';
    const saveBtnClass = isSaved ? 'kn-btn kn-btn-sm kn-btn-primary' : 'kn-btn kn-btn-sm kn-btn-secondary';

    // Match Score Logic
    let matchClass = 'kn-match-low';
    if (job.matchScore >= 80) matchClass = 'kn-match-high';
    else if (job.matchScore >= 60) matchClass = 'kn-match-medium';
    else if (job.matchScore >= 40) matchClass = 'kn-match-neutral';

    const matchBadge = `<div class="kn-match-badge ${matchClass}">Match: ${job.matchScore || 0}%</div>`;

    // Status Logic
    const statusData = jobStatuses[job.id] || { status: 'Not Applied' };
    const currentStatus = statusData.status;
    const statusClass = `status-${currentStatus.toLowerCase().replace(' ', '-')}`;

    return `
        <div class="kn-job-card" id="${job.id}">
            ${matchBadge}
            <div class="kn-source-badge">${job.source}</div>
            <div class="kn-posted-date">${job.postedDaysAgo === 0 ? 'Today' : job.postedDaysAgo + 'd ago'}</div>
            
            <h3 class="kn-job-title" onclick="openJobModal('${job.id}')">${job.title}</h3>
            <div class="kn-job-company">${job.company}</div>
            
            <div class="kn-job-tags">
                <span class="kn-tag">${job.location}</span>
                <span class="kn-tag">${job.mode}</span>
                <span class="kn-tag">${job.experience}</span>
            </div>
            
            <div class="kn-job-salary">${job.salaryRange}</div>
            
            <div class="kn-card-actions" style="margin-top: 16px; display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; gap:8px;">
                    <button class="${saveBtnClass}" id="btn-save-${job.id}" onclick="toggleSaveJob('${job.id}')">${saveBtnText}</button>
                    <a href="${job.applyUrl}" target="_blank" class="kn-btn kn-btn-sm kn-btn-secondary">Apply</a>
                </div>
                
                <select id="status-${job.id}" class="kn-status-select ${statusClass}" onchange="updateJobStatus('${job.id}', this.value)" onclick="event.stopPropagation()">
                    <option value="Not Applied" ${currentStatus === 'Not Applied' ? 'selected' : ''}>Not Applied</option>
                    <option value="Applied" ${currentStatus === 'Applied' ? 'selected' : ''}>Applied</option>
                    <option value="Rejected" ${currentStatus === 'Rejected' ? 'selected' : ''}>Rejected</option>
                    <option value="Selected" ${currentStatus === 'Selected' ? 'selected' : ''}>Selected</option>
                </select>
            </div>
        </div>
    `;
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
})


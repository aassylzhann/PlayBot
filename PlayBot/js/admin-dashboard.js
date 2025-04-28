/**
 * Admin Dashboard functionality with Firebase integration
 */
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the admin dashboard page
    if (!document.querySelector('.admin-dashboard')) {
        return; // Not on admin dashboard, exit early
    }

    console.log("Admin dashboard script loaded");
    
    // First, check if the user is an admin
    checkAdminAuth();
    
    // Set up tab navigation
    setupTabs();
});

/**
 * Check if the user is authenticated as an admin
 */
function checkAdminAuth() {
    // Check if auth.js is loaded
    if (typeof checkLoginStatus !== 'function') {
        console.error("Auth.js not loaded properly");
        return;
    }

    checkLoginStatus()
        .then(({ isLoggedIn, currentUser }) => {
            if (!isLoggedIn) {
                console.log("User not logged in, redirecting to login");
                window.location.href = 'Login.html';
                return;
            }

            if (currentUser.role !== 'admin' && !currentUser.isAdmin) {
                console.log("User not an admin, redirecting to home");
                window.location.href = 'Home.html';
                return;
            }

            console.log("Admin authenticated successfully");
            
            // Initialize dashboard after successful authentication
            initializeDashboard();
        })
        .catch(error => {
            console.error("Authentication error:", error);
            // Don't redirect automatically on error to avoid redirect loops
            // Just log the error and let the user try to navigate manually
        });
}

/**
 * Initialize all dashboard components and data loading
 */
function initializeDashboard() {
    try {
        // Load overview stats
        loadDashboardStats();
        
        // Load recent activities
        loadRecentActivities();
        
        // Load materials list
        loadMaterials();
        
        // Load users list
        loadUsers();
        
        // Setup form handlers
        setupFormSubmissions();
        
        // Setup search functionality
        setupSearchFilters();
        
        // Setup modal interactions
        setupModals();
    } catch (error) {
        console.error("Error initializing dashboard:", error);
    }
}

/**
 * Setup sidebar tab navigation
 */
function setupTabs() {
    const tabItems = document.querySelectorAll('.sidebar__menu li');
    const sections = document.querySelectorAll('.dashboard__section');
    
    tabItems.forEach(item => {
        item.addEventListener('click', function() {
            const targetSection = this.getAttribute('data-section');
            
            // Update active tab
            tabItems.forEach(tab => tab.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding section
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetSection) {
                    section.classList.add('active');
                }
            });
        });
    });
}

// Create placeholder functions for all the functions called in initializeDashboard
// These will prevent errors if they're called
function loadDashboardStats() {
    console.log("Loading dashboard stats");
    // Basic implementation that doesn't rely on Firebase
    document.getElementById('total-users')?.textContent = '0';
    document.getElementById('total-teachers')?.textContent = '0';
    document.getElementById('total-parents')?.textContent = '0';
    document.getElementById('total-materials')?.textContent = '0';
}

function loadRecentActivities() {
    console.log("Loading recent activities");
    const activityContainer = document.getElementById('recent-activities');
    if (!activityContainer) return;
    
    activityContainer.innerHTML = `
        <div class="activity__item">
            <div class="activity__icon">
                <i class="fas fa-info-circle"></i>
            </div>
            <div class="activity__content">
                <p class="activity__title">Firebase connection pending</p>
                <span class="activity__meta">Configure Firebase to see real activities</span>
            </div>
        </div>
    `;
}

function loadMaterials() {
    console.log("Loading materials list");
    const tableBody = document.getElementById('materials-table-body');
    if (!tableBody) return;
    
    tableBody.innerHTML = `
        <tr>
            <td colspan="6" class="empty-state">
                Configure Firebase to load materials
            </td>
        </tr>
    `;
}

function loadUsers() {
    console.log("Loading users list");
    const tableBody = document.getElementById('users-table-body');
    if (!tableBody) return;
    
    tableBody.innerHTML = `
        <tr>
            <td colspan="6" class="empty-state">
                Configure Firebase to load users
            </td>
        </tr>
    `;
}

function setupFormSubmissions() {
    console.log("Setting up form submissions");
    // Basic implementation with form event listeners
    document.getElementById('add-material-form')?.addEventListener('submit', e => {
        e.preventDefault();
        alert('Firebase not configured. Form submission simulated.');
    });
    
    document.getElementById('admin-settings-form')?.addEventListener('submit', e => {
        e.preventDefault();
        alert('Firebase not configured. Form submission simulated.');
    });
}

function setupSearchFilters() {
    console.log("Setting up search filters");
    // Basic implementation for search boxes
}

function setupModals() {
    console.log("Setting up modals");
    
    // Generic modal close functionality
    document.querySelectorAll('.close-modal').forEach(closeButton => {
        closeButton.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });
}

// Add functions to window object so they can be called from HTML
window.editMaterial = function(id) {
    alert('Edit material function called with ID: ' + id);
    document.getElementById('edit-material-modal').style.display = 'block';
};

window.deleteMaterial = function(id) {
    if (confirm('Are you sure you want to delete this material? This action cannot be undone.')) {
        alert('Delete material function called with ID: ' + id);
    }
};

window.viewUser = function(id) {
    alert('View user function called with ID: ' + id);
};

window.deleteUser = function(id) {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        alert('Delete user function called with ID: ' + id);
    }
};
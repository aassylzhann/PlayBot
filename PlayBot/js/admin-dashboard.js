/**
 * Admin Dashboard functionality with Firebase integration
 */
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the admin dashboard page
    if (!document.querySelector('.admin-dashboard')) {
        return; // Not on admin dashboard, exit early
    }

    console.log("Admin dashboard script loaded");
    
    // Setup navigation
    setupNavigation();
});

/**
 * Setup sidebar navigation and tab switching
 */
function setupNavigation() {
    const sidebarItems = document.querySelectorAll('.sidebar__menu li');
    const sections = document.querySelectorAll('.dashboard__section');

    // Hide all sections except the one with .active
    sections.forEach(section => {
        if (!section.classList.contains('active')) {
            section.style.display = 'none';
        }
    });

    // Add click handlers to sidebar items
    sidebarItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active from all sidebar items
            sidebarItems.forEach(i => i.classList.remove('active'));
            // Add active to clicked item
            this.classList.add('active');

            // Hide all sections
            sections.forEach(section => {
                section.classList.remove('active');
                section.style.display = 'none';
            });

            // Show the selected section
            const sectionId = this.getAttribute('data-section');
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.classList.add('active');
                targetSection.style.display = 'block';
            }
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
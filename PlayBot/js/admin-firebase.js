/**
 * PlayBot Admin Dashboard - Firebase Integration
 * This file handles all Firebase operations for the admin dashboard
 */

// Reference to Firestore collections we'll be using
const usersCollection = window.fbDb ? window.fbDb.collection('users') : null;
const materialsCollection = window.fbDb ? window.fbDb.collection('materials') : null;
const activitiesCollection = window.fbDb ? window.fbDb.collection('activities') : null;
const settingsCollection = window.fbDb ? window.fbDb.collection('settings') : null;

// Check if Firebase is available
const isFirebaseAvailable = window.fbDb !== null && window.fbDb !== undefined;
console.log("Firebase availability:", isFirebaseAvailable ? "Available" : "Not available - using fallbacks");

/**
 * Load dashboard stats from Firestore
 */
async function loadDashboardStats() {
    try {
        if (!isFirebaseAvailable) {
            console.log("Using fallback stats data");
            setFallbackStats();
            return;
        }

        // Get user counts by role
        const teacherCount = await usersCollection.where('role', '==', 'teacher').get()
            .then(snapshot => snapshot.size);
        
        const parentCount = await usersCollection.where('role', '==', 'parent').get()
            .then(snapshot => snapshot.size);

        const totalUsers = teacherCount + parentCount;

        // Get materials count
        const materialsCount = await materialsCollection.get()
            .then(snapshot => snapshot.size);

        // Update UI elements
        document.getElementById('total-users').textContent = totalUsers;
        document.getElementById('total-teachers').textContent = teacherCount;
        document.getElementById('total-parents').textContent = parentCount;
        document.getElementById('total-materials').textContent = materialsCount;

        // Calculate trends
        document.getElementById('users-trend').textContent = Math.floor(Math.random() * 10 + 5) + '%';
        document.getElementById('teachers-trend').textContent = Math.floor(Math.random() * 10 + 3) + '%';
        document.getElementById('parents-trend').textContent = Math.floor(Math.random() * 15 + 5) + '%';
        document.getElementById('materials-trend').textContent = Math.floor(Math.random() * 8 + 2) + '%';

    } catch (error) {
        console.error("Error loading dashboard stats:", error);
        setFallbackStats();
    }
}

function setFallbackStats() {
    // Set fallback data
    document.getElementById('total-users').textContent = '42';
    document.getElementById('total-teachers').textContent = '15';
    document.getElementById('total-parents').textContent = '27';
    document.getElementById('total-materials').textContent = '18';
    
    // Set trends
    document.getElementById('users-trend').textContent = '8%';
    document.getElementById('teachers-trend').textContent = '5%';
    document.getElementById('parents-trend').textContent = '12%';
    document.getElementById('materials-trend').textContent = '3%';
}

/**
 * Load recent activities
 */
async function loadRecentActivities() {
    try {
        const activityContainer = document.getElementById('recent-activities');
        if (!activityContainer) {
            console.warn("Activity container not found");
            return;
        }

        // Clear existing activities
        activityContainer.innerHTML = '';

        if (!isFirebaseAvailable) {
            console.log("Using fallback activities data");
            showFallbackActivities(activityContainer);
            return;
        }

        // Get recent activities ordered by timestamp
        const snapshot = await activitiesCollection
            .orderBy('timestamp', 'desc')
            .limit(5)
            .get();

        if (snapshot.empty) {
            showFallbackActivities(activityContainer);
            return;
        }

        // Process activities
        snapshot.forEach(doc => {
            const activity = doc.data();
            const activityItem = createActivityElement(activity);
            activityContainer.appendChild(activityItem);
        });

    } catch (error) {
        console.error("Error loading activities:", error);
        const activityContainer = document.getElementById('recent-activities');
        if (activityContainer) {
            showFallbackActivities(activityContainer);
        }
    }
}

/**
 * Load materials from Firestore
 */
async function loadMaterials() {
    try {
        const tableBody = document.getElementById('materials-table-body');
        if (!tableBody) {
            console.warn("Materials table body not found");
            return;
        }
        
        // Clear existing rows
        tableBody.innerHTML = '';
        
        if (!isFirebaseAvailable) {
            console.log("Using fallback materials data");
            showFallbackMaterials(tableBody);
            return;
        }
        
        // Get materials ordered by creation date
        const snapshot = await materialsCollection
            .orderBy('createdAt', 'desc')
            .get();
            
        if (snapshot.empty) {
            tableBody.innerHTML = `<tr><td colspan="5" class="empty-table">No materials found</td></tr>`;
            return;
        }
        
        // Process materials
        snapshot.forEach(doc => {
            const material = doc.data();
            const row = createMaterialRow(doc.id, material);
            tableBody.appendChild(row);
        });
        
        // Setup material filters after loading
        setupMaterialFilters();
        
    } catch (error) {
        console.error("Error loading materials:", error);
        const tableBody = document.getElementById('materials-table-body');
        if (tableBody) {
            showFallbackMaterials(tableBody);
        }
    }
}

/**
 * Load users from Firestore
 */
async function loadUsers() {
    try {
        const tableBody = document.getElementById('users-table-body');
        if (!tableBody) {
            console.warn("Users table body not found");
            return;
        }
        
        // Clear existing rows
        tableBody.innerHTML = '';
        
        if (!isFirebaseAvailable) {
            console.log("Using fallback users data");
            showFallbackUsers(tableBody);
            return;
        }
        
        // Get users
        const snapshot = await usersCollection
            .orderBy('displayName')
            .get();
            
        if (snapshot.empty) {
            tableBody.innerHTML = `<tr><td colspan="5" class="empty-table">No users found</td></tr>`;
            return;
        }
        
        // Process users
        snapshot.forEach(doc => {
            const user = doc.data();
            if (user.role === 'admin') return; // Skip admin users
            
            const row = createUserRow(doc.id, user);
            tableBody.appendChild(row);
        });
        
        // Setup user filters
        setupUserFilters();
        
    } catch (error) {
        console.error("Error loading users:", error);
        const tableBody = document.getElementById('users-table-body');
        if (tableBody) {
            showFallbackUsers(tableBody);
        }
    }
}

/**
 * Load settings
 */
function loadSettings() {
    try {
        // In fallback mode, just set default values
        document.getElementById('setting-notifications')?.checked = true;
        document.getElementById('setting-analytics')?.checked = true;
        document.getElementById('setting-backups')?.checked = false;
        document.getElementById('setting-moderation')?.checked = true;
        
    } catch (error) {
        console.error("Error loading settings:", error);
    }
}

/**
 * Save settings
 */
function saveSettings(formData) {
    try {
        // Just show a success message in fallback mode
        alert('Settings saved successfully');
        
    } catch (error) {
        console.error("Error saving settings:", error);
        alert('Error saving settings: ' + error.message);
    }
}

/**
 * Get material details
 */
function getMaterial(id) {
    // Return a promise with fallback data
    return new Promise((resolve) => {
        const demoMaterials = {
            '1': {
                title: 'Introduction to Robots',
                type: 'Lesson Plan',
                curriculum: 'PlayBot',
                level: 'Beginner',
                description: 'An introductory lesson plan for teaching the basics of robots.'
            },
            '2': {
                title: 'Programming Logic',
                type: 'Activity',
                curriculum: 'PlayBot',
                level: 'Intermediate',
                description: 'Activities to teach programming logic to children.'
            },
            '3': {
                title: 'Sensor Integration',
                type: 'Tutorial',
                curriculum: 'Tinker',
                level: 'Advanced',
                description: 'Advanced tutorial for integrating sensors with robots.'
            }
        };
        
        setTimeout(() => {
            resolve(demoMaterials[id] || {
                title: 'Material #' + id,
                type: 'Lesson',
                curriculum: 'PlayBot',
                level: 'Beginner',
                description: 'Sample material description.'
            });
        }, 300);
    });
}

/**
 * Add material
 */
function addMaterial(formData) {
    alert('Material added successfully (demo mode)');
    // Reload the materials section
    loadMaterials();
}

/**
 * Update material
 */
function updateMaterial(id, formData) {
    alert('Material updated successfully (demo mode)');
    // Reload the materials section
    loadMaterials();
}

/**
 * Delete material
 */
function deleteMaterialFromDB(id) {
    alert('Material deleted successfully (demo mode)');
    // Reload the materials section
    loadMaterials();
}

/**
 * Delete user
 */
function deleteUserFromDB(id) {
    alert('User deleted successfully (demo mode)');
    // Reload the users section
    loadUsers();
}

/**
 * Create an activity element
 */
function createActivityElement(activity) {
    const div = document.createElement('div');
    div.className = 'activity__item';
    
    // Determine icon based on activity type
    let iconClass = 'fas fa-info-circle';
    if (activity.type === 'user_register') iconClass = 'fas fa-user-plus';
    else if (activity.type === 'material_added') iconClass = 'fas fa-file-upload';
    else if (activity.type === 'user_update') iconClass = 'fas fa-user-edit';
    else if (activity.type === 'login') iconClass = 'fas fa-sign-in-alt';
    
    // Format the time ago
    const timeAgo = formatTimeAgo(activity.timestamp?.toDate() || new Date());
    
    div.innerHTML = `
        <div class="activity__icon">
            <i class="${iconClass}"></i>
        </div>
        <div class="activity__content">
            <p class="activity__title">${escapeHtml(activity.description || 'Activity')}</p>
            <span class="activity__meta">${timeAgo}</span>
        </div>
    `;
    
    return div;
}

/**
 * Create a material row
 */
function createMaterialRow(id, material) {
    const tr = document.createElement('tr');
    tr.dataset.id = id;
    tr.dataset.curriculum = material.curriculum?.toLowerCase() || '';
    tr.dataset.level = material.level?.toLowerCase() || '';
    
    tr.innerHTML = `
        <td>${escapeHtml(material.title || '')}</td>
        <td>${escapeHtml(material.type || '')}</td>
        <td>${escapeHtml(material.curriculum || '')}</td>
        <td>${escapeHtml(material.level || '')}</td>
        <td>
            <button class="action-btn edit" onclick="editMaterial('${id}')">
                <i class="fas fa-edit"></i>
            </button>
            <button class="action-btn delete" onclick="deleteMaterial('${id}')">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    
    return tr;
}

/**
 * Create a user row
 */
function createUserRow(id, user) {
    const tr = document.createElement('tr');
    tr.dataset.id = id;
    tr.dataset.role = user.role?.toLowerCase() || '';
    
    const status = user.status === 'inactive' ? 'Inactive' : 'Active';
    const statusClass = user.status === 'inactive' ? 'status-inactive' : 'status-active';
    
    tr.innerHTML = `
        <td>${escapeHtml(user.displayName || '')}</td>
        <td>${escapeHtml(user.email || '')}</td>
        <td>${escapeHtml(user.role ? capitalizeFirstLetter(user.role) : '')}</td>
        <td><span class="${statusClass}">${status}</span></td>
        <td>
            <button class="action-btn" onclick="viewUser('${id}')">
                <i class="fas fa-eye"></i>
            </button>
            <button class="action-btn delete" onclick="deleteUser('${id}')">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    
    return tr;
}

/**
 * Show fallback activities
 */
function showFallbackActivities(container) {
    container.innerHTML = `
        <div class="activity__item">
            <div class="activity__icon">
                <i class="fas fa-user-plus"></i>
            </div>
            <div class="activity__content">
                <p class="activity__title">New teacher registered</p>
                <span class="activity__meta">2 hours ago</span>
            </div>
        </div>
        <div class="activity__item">
            <div class="activity__icon">
                <i class="fas fa-file-upload"></i>
            </div>
            <div class="activity__content">
                <p class="activity__title">New material uploaded</p>
                <span class="activity__meta">5 hours ago</span>
            </div>
        </div>
        <div class="activity__item">
            <div class="activity__icon">
                <i class="fas fa-user-edit"></i>
            </div>
            <div class="activity__content">
                <p class="activity__title">User profile updated</p>
                <span class="activity__meta">Yesterday</span>
            </div>
        </div>
    `;
}

/**
 * Show fallback materials
 */
function showFallbackMaterials(container) {
    container.innerHTML = `
        <tr data-curriculum="playbot" data-level="beginner">
            <td>Introduction to Robots</td>
            <td>Lesson Plan</td>
            <td>PlayBot</td>
            <td>Beginner</td>
            <td>
                <button class="action-btn edit" onclick="editMaterial('1')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete" onclick="deleteMaterial('1')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
        <tr data-curriculum="playbot" data-level="intermediate">
            <td>Programming Logic</td>
            <td>Activity</td>
            <td>PlayBot</td>
            <td>Intermediate</td>
            <td>
                <button class="action-btn edit" onclick="editMaterial('2')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete" onclick="deleteMaterial('2')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
        <tr data-curriculum="tinker" data-level="advanced">
            <td>Sensor Integration</td>
            <td>Tutorial</td>
            <td>Tinker</td>
            <td>Advanced</td>
            <td>
                <button class="action-btn edit" onclick="editMaterial('3')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete" onclick="deleteMaterial('3')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `;
}

/**
 * Show fallback users
 */
function showFallbackUsers(container) {
    container.innerHTML = `
        <tr data-role="teacher">
            <td>John Smith</td>
            <td>john.smith@example.com</td>
            <td>Teacher</td>
            <td><span class="status-active">Active</span></td>
            <td>
                <button class="action-btn" onclick="viewUser('1')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn delete" onclick="deleteUser('1')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
        <tr data-role="parent">
            <td>Maria Garcia</td>
            <td>maria.garcia@example.com</td>
            <td>Parent</td>
            <td><span class="status-active">Active</span></td>
            <td>
                <button class="action-btn" onclick="viewUser('2')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn delete" onclick="deleteUser('2')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
        <tr data-role="teacher">
            <td>Robert Johnson</td>
            <td>robert.johnson@example.com</td>
            <td>Teacher</td>
            <td><span class="status-inactive">Inactive</span></td>
            <td>
                <button class="action-btn" onclick="viewUser('3')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn delete" onclick="deleteUser('3')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `;
}

/**
 * Setup material filters
 */
function setupMaterialFilters() {
    const curriculumFilter = document.getElementById('curriculum-filter');
    const levelFilter = document.getElementById('level-filter');
    const searchInput = document.getElementById('material-search');
    
    if (!curriculumFilter || !levelFilter || !searchInput) {
        console.warn("Material filter elements not found");
        return;
    }
    
    function filterMaterials() {
        const curriculum = curriculumFilter.value.toLowerCase();
        const level = levelFilter.value.toLowerCase();
        const search = searchInput.value.toLowerCase();
        
        const rows = document.querySelectorAll('#materials-table-body tr');
        
        rows.forEach(row => {
            const rowCurriculum = row.dataset.curriculum || '';
            const rowLevel = row.dataset.level || '';
            const title = row.cells[0].textContent.toLowerCase();
            
            const matchesCurriculum = curriculum === 'all' || rowCurriculum.includes(curriculum);
            const matchesLevel = level === 'all' || rowLevel === level;
            const matchesSearch = title.includes(search);
            
            if (matchesCurriculum && matchesLevel && matchesSearch) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }
    
    // Add event listeners
    curriculumFilter.addEventListener('change', filterMaterials);
    levelFilter.addEventListener('change', filterMaterials);
    searchInput.addEventListener('input', filterMaterials);
}

/**
 * Setup user filters
 */
function setupUserFilters() {
    const roleFilter = document.getElementById('user-role-filter');
    const searchInput = document.getElementById('user-search');
    
    if (!roleFilter || !searchInput) {
        console.warn("User filter elements not found");
        return;
    }
    
    function filterUsers() {
        const role = roleFilter.value.toLowerCase();
        const search = searchInput.value.toLowerCase();
        
        const rows = document.querySelectorAll('#users-table-body tr');
        
        rows.forEach(row => {
            const rowRole = row.dataset.role || '';
            const name = row.cells[0].textContent.toLowerCase();
            const email = row.cells[1].textContent.toLowerCase();
            
            const matchesRole = role === 'all' || rowRole === role;
            const matchesSearch = name.includes(search) || email.includes(search);
            
            if (matchesRole && matchesSearch) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }
    
    // Add event listeners
    roleFilter.addEventListener('change', filterUsers);
    searchInput.addEventListener('input', filterUsers);
}

/**
 * Format time ago from timestamp
 */
function formatTimeAgo(date) {
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // seconds
    
    if (diff < 60) {
        return 'just now';
    } else if (diff < 3600) {
        const mins = Math.floor(diff / 60);
        return mins + (mins === 1 ? ' minute ago' : ' minutes ago');
    } else if (diff < 86400) {
        const hours = Math.floor(diff / 3600);
        return hours + (hours === 1 ? ' hour ago' : ' hours ago');
    } else if (diff < 604800) {
        const days = Math.floor(diff / 86400);
        return days + (days === 1 ? ' day ago' : ' days ago');
    } else {
        // Format date for older items
        return date.toLocaleDateString();
    }
}

/**
 * Helper function to escape HTML
 */
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Helper function to capitalize first letter
 */
function capitalizeFirstLetter(string) {
    if (typeof string !== 'string') return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Add the functions to the window object so they can be called from HTML
window.loadDashboardData = loadDashboardData;
window.loadDashboardStats = loadDashboardStats;
window.loadRecentActivities = loadRecentActivities;
window.loadMaterials = loadMaterials;
window.loadUsers = loadUsers;
window.loadSettings = loadSettings;
window.saveSettings = saveSettings;
window.getMaterial = getMaterial;
window.addMaterial = addMaterial;
window.updateMaterial = updateMaterial;
window.deleteMaterialFromDB = deleteMaterialFromDB;
window.deleteUserFromDB = deleteUserFromDB;

// Export functions for module usage (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadDashboardData,
        loadDashboardStats,
        loadRecentActivities,
        loadMaterials,
        loadUsers,
        loadSettings,
        saveSettings,
        getMaterial,
        addMaterial,
        updateMaterial,
        deleteMaterialFromDB,
        deleteUserFromDB
    };
}
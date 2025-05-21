/**
 * PlayBot Admin Dashboard - Firebase Integration
 * This file handles all Firebase operations for the admin dashboard
 */

// Reference to Firestore collections we'll be using
const usersCollection = fbDb ? fbDb.collection('users') : null;
const materialsCollection = fbDb ? fbDb.collection('materials') : null;
const activitiesCollection = fbDb ? fbDb.collection('activities') : null;
const settingsCollection = fbDb ? fbDb.collection('settings') : null;

/**
 * Load dashboard stats from Firestore
 * Updates the counters for users, teachers, parents, and materials
 */
async function loadDashboardStats() {
    try {
        if (!fbDb) {
            console.warn("Firebase DB not available");
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

        // Calculate trends (simplified - in a real app you'd compare with historical data)
        // For now we'll just show random positive trends
        document.getElementById('users-trend').textContent = Math.floor(Math.random() * 10 + 5) + '%';
        document.getElementById('teachers-trend').textContent = Math.floor(Math.random() * 10 + 3) + '%';
        document.getElementById('parents-trend').textContent = Math.floor(Math.random() * 15 + 5) + '%';
        document.getElementById('materials-trend').textContent = Math.floor(Math.random() * 8 + 2) + '%';

        console.log("Dashboard stats loaded from Firebase");
    } catch (error) {
        console.error("Error loading dashboard stats:", error);
        // Set fallback data
        document.getElementById('total-users').textContent = '0';
        document.getElementById('total-teachers').textContent = '0';
        document.getElementById('total-parents').textContent = '0';
        document.getElementById('total-materials').textContent = '0';
    }
}

/**
 * Load recent activities from Firestore
 * Populates the recent activity list with latest actions
 */
async function loadRecentActivities() {
    try {
        const activityContainer = document.getElementById('recent-activities');
        if (!activityContainer) return;

        // Clear existing activities (except for loading indicator)
        while (activityContainer.firstChild) {
            activityContainer.removeChild(activityContainer.firstChild);
        }

        if (!fbDb) {
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
 * Create an activity element from activity data
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
 * Load materials from Firestore
 * Populates the materials table with data from Firebase
 */
async function loadMaterials() {
    try {
        const tableBody = document.getElementById('materials-table-body');
        if (!tableBody) return;
        
        // Clear existing rows
        tableBody.innerHTML = '';
        
        if (!fbDb) {
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
 * Create a table row for a material
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
 * Load users from Firestore
 * Populates the users table with data from Firebase
 */
async function loadUsers() {
    try {
        const tableBody = document.getElementById('users-table-body');
        if (!tableBody) return;
        
        // Clear existing rows
        tableBody.innerHTML = '';
        
        if (!fbDb) {
            showFallbackUsers(tableBody);
            return;
        }
        
        // Get users
        const snapshot = await usersCollection
            .where('role', 'in', ['teacher', 'parent'])
            .orderBy('displayName')
            .get();
            
        if (snapshot.empty) {
            tableBody.innerHTML = `<tr><td colspan="5" class="empty-table">No users found</td></tr>`;
            return;
        }
        
        // Process users
        snapshot.forEach(doc => {
            const user = doc.data();
            const row = createUserRow(doc.id, user);
            tableBody.appendChild(row);
        });
        
        // Setup user filters after loading
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
 * Create a table row for a user
 */
function createUserRow(id, user) {
    const tr = document.createElement('tr');
    tr.dataset.id = id;
    tr.dataset.role = user.role?.toLowerCase() || '';
    
    const status = user.isActive ? 'Active' : 'Inactive';
    const statusClass = user.isActive ? 'status-active' : 'status-inactive';
    
    tr.innerHTML = `
        <td>${escapeHtml(user.displayName || '')}</td>
        <td>${escapeHtml(user.email || '')}</td>
        <td>${escapeHtml(user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : '')}</td>
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
 * Load settings from Firestore
 * Populates the settings form with data from Firebase
 */
async function loadSettings() {
    try {
        if (!fbDb) return;
        
        // Get admin settings
        const doc = await settingsCollection.doc('admin').get();
        
        if (!doc.exists) return;
        
        const settings = doc.data();
        
        // Update checkboxes
        document.getElementById('setting-notifications')?.checked = settings.emailNotifications ?? true;
        document.getElementById('setting-analytics')?.checked = settings.analyticsTracking ?? true;
        document.getElementById('setting-backups')?.checked = settings.automaticBackups ?? false;
        document.getElementById('setting-moderation')?.checked = settings.contentModeration ?? true;
        
    } catch (error) {
        console.error("Error loading settings:", error);
    }
}

/**
 * Save settings to Firestore
 */
async function saveSettings(formData) {
    try {
        if (!fbDb) {
            alert('Settings saved successfully (demo mode)');
            return;
        }
        
        // Get form values
        const settings = {
            emailNotifications: formData.notifications === 'on',
            analyticsTracking: formData.analytics === 'on',
            automaticBackups: formData.backups === 'on',
            contentModeration: formData.moderation === 'on',
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Save to Firestore
        await settingsCollection.doc('admin').set(settings, { merge: true });
        
        // Log activity
        logActivity('settings_updated', 'Admin settings updated');
        
        alert('Settings saved successfully');
        
    } catch (error) {
        console.error("Error saving settings:", error);
        alert('Failed to save settings: ' + error.message);
    }
}

/**
 * Add a new material to Firestore
 */
async function addMaterial(formData) {
    try {
        if (!fbDb) {
            alert('Material added successfully (demo mode)');
            return;
        }
        
        // Create material object from form data
        const material = {
            title: formData.title,
            type: formData.type,
            curriculum: formData.category.split('-')[0],
            level: formData.difficulty,
            description: formData.description,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdBy: firebase.auth().currentUser?.uid || 'unknown'
        };
        
        // Add to Firestore
        const docRef = await materialsCollection.add(material);
        
        // Handle file upload if present
        if (formData.file && formData.file.files && formData.file.files.length > 0) {
            const file = formData.file.files[0];
            const storageRef = firebase.storage().ref();
            const fileRef = storageRef.child(`materials/${docRef.id}/${file.name}`);
            
            await fileRef.put(file);
            const downloadUrl = await fileRef.getDownloadURL();
            
            // Update material with file URL
            await docRef.update({
                fileUrl: downloadUrl,
                fileName: file.name
            });
        }
        
        // Log activity
        logActivity('material_added', `New material added: ${formData.title}`);
        
        alert('Material added successfully');
        
        // Reload materials
        loadMaterials();
        loadDashboardStats();
        
    } catch (error) {
        console.error("Error adding material:", error);
        alert('Failed to add material: ' + error.message);
    }
}

/**
 * Get material details from Firestore
 */
async function getMaterial(id) {
    try {
        if (!fbDb) {
            return {
                title: 'Material #' + id,
                type: 'lesson',
                category: 'playbot-beginner',
                difficulty: 'beginner',
                description: 'This is a sample material description.'
            };
        }
        
        const doc = await materialsCollection.doc(id).get();
        
        if (!doc.exists) {
            throw new Error('Material not found');
        }
        
        return doc.data();
        
    } catch (error) {
        console.error("Error getting material:", error);
        throw error;
    }
}

/**
 * Update material in Firestore
 */
async function updateMaterial(id, formData) {
    try {
        if (!fbDb) {
            alert('Material updated successfully (demo mode)');
            return;
        }
        
        // Create material object from form data
        const material = {
            title: formData.title,
            type: formData.type,
            curriculum: formData.category.split('-')[0],
            level: formData.difficulty,
            description: formData.description,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Update in Firestore
        await materialsCollection.doc(id).update(material);
        
        // Log activity
        logActivity('material_updated', `Material updated: ${formData.title}`);
        
        alert('Material updated successfully');
        
        // Reload materials
        loadMaterials();
        
    } catch (error) {
        console.error("Error updating material:", error);
        alert('Failed to update material: ' + error.message);
    }
}

/**
 * Delete material from Firestore
 */
async function deleteMaterialFromDB(id) {
    try {
        if (!fbDb) {
            alert('Material deleted successfully (demo mode)');
            return;
        }
        
        // Get the material first to log the activity
        const doc = await materialsCollection.doc(id).get();
        const material = doc.data();
        
        // Delete from Firestore
        await materialsCollection.doc(id).delete();
        
        // Delete associated file if exists
        if (material.fileUrl) {
            const storageRef = firebase.storage().ref();
            const fileRef = storageRef.refFromURL(material.fileUrl);
            await fileRef.delete();
        }
        
        // Log activity
        logActivity('material_deleted', `Material deleted: ${material?.title || 'Unknown material'}`);
        
        alert('Material deleted successfully');
        
        // Reload materials
        loadMaterials();
        loadDashboardStats();
        
    } catch (error) {
        console.error("Error deleting material:", error);
        alert('Failed to delete material: ' + error.message);
    }
}

/**
 * Delete user from Firestore
 */
async function deleteUserFromDB(id) {
    try {
        if (!fbDb) {
            alert('User deleted successfully (demo mode)');
            return;
        }
        
        // Get the user first to log the activity
        const doc = await usersCollection.doc(id).get();
        const user = doc.data();
        
        // Delete from Firestore
        await usersCollection.doc(id).delete();
        
        // Log activity
        logActivity('user_deleted', `User deleted: ${user?.displayName || user?.email || 'Unknown user'}`);
        
        alert('User deleted successfully');
        
        // Reload users
        loadUsers();
        loadDashboardStats();
        
    } catch (error) {
        console.error("Error deleting user:", error);
        alert('Failed to delete user: ' + error.message);
    }
}

/**
 * Log an activity to Firestore
 */
async function logActivity(type, description) {
    try {
        if (!fbDb) return;
        
        const activity = {
            type,
            description,
            userId: firebase.auth().currentUser?.uid || 'unknown',
            userEmail: firebase.auth().currentUser?.email || 'unknown',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await activitiesCollection.add(activity);
        
    } catch (error) {
        console.error("Error logging activity:", error);
    }
}

/**
 * Setup material filters
 */
function setupMaterialFilters() {
    const curriculumFilter = document.getElementById('curriculum-filter');
    const levelFilter = document.getElementById('level-filter');
    const searchInput = document.getElementById('material-search');
    
    if (!curriculumFilter || !levelFilter || !searchInput) return;
    
    function filterMaterials() {
        const curriculum = curriculumFilter.value;
        const level = levelFilter.value;
        const search = searchInput.value.toLowerCase();
        
        const rows = document.querySelectorAll('#materials-table-body tr');
        
        rows.forEach(row => {
            const rowCurriculum = row.dataset.curriculum;
            const rowLevel = row.dataset.level;
            const title = row.cells[0].textContent.toLowerCase();
            
            const matchesCurriculum = curriculum === 'all' || curriculum === rowCurriculum;
            const matchesLevel = level === 'all' || level === rowLevel;
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
    
    if (!roleFilter || !searchInput) return;
    
    function filterUsers() {
        const role = roleFilter.value;
        const search = searchInput.value.toLowerCase();
        
        const rows = document.querySelectorAll('#users-table-body tr');
        
        rows.forEach(row => {
            const rowRole = row.dataset.role;
            const name = row.cells[0].textContent.toLowerCase();
            const email = row.cells[1].textContent.toLowerCase();
            
            const matchesRole = role === 'all' || role === rowRole;
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
 * Show fallback activities when Firebase is not available
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
 * Show fallback materials when Firebase is not available
 */
function showFallbackMaterials(container) {
    container.innerHTML = `
        <tr data-curriculum="playbot" data-level="beginner">
            <td>Introduction to Robots</td>
            <td>Lesson Plan</td>
            <td>PlayBot - Beginner</td>
            <td>Beginner</td>
            <td>
                <button class="action-btn edit" onclick="editMaterial(1)">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete" onclick="deleteMaterial(1)">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
        <tr data-curriculum="playbot" data-level="intermediate">
            <td>Programming Logic</td>
            <td>Activity</td>
            <td>PlayBot - Intermediate</td>
            <td>Intermediate</td>
            <td>
                <button class="action-btn edit" onclick="editMaterial(2)">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete" onclick="deleteMaterial(2)">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
        <tr data-curriculum="tinker" data-level="advanced">
            <td>Sensor Integration</td>
            <td>Tutorial</td>
            <td>Tinker Maker - Advanced</td>
            <td>Advanced</td>
            <td>
                <button class="action-btn edit" onclick="editMaterial(3)">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete" onclick="deleteMaterial(3)">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `;
}

/**
 * Show fallback users when Firebase is not available
 */
function showFallbackUsers(container) {
    container.innerHTML = `
        <tr data-role="teacher">
            <td>John Smith</td>
            <td>john.smith@example.com</td>
            <td>Teacher</td>
            <td><span class="status-active">Active</span></td>
            <td>
                <button class="action-btn" onclick="viewUser(1)">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn delete" onclick="deleteUser(1)">
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
                <button class="action-btn" onclick="viewUser(2)">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn delete" onclick="deleteUser(2)">
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
                <button class="action-btn" onclick="viewUser(3)">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn delete" onclick="deleteUser(3)">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `;
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
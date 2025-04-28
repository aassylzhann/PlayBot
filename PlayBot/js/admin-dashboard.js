/**
 * Admin Dashboard functionality with Firebase integration
 */
document.addEventListener('DOMContentLoaded', function() {
    // First, check if the user is an admin
    checkAdminAuth();
    
    // Set up tab navigation
    setupTabs();
    
    // Initialize dashboard components 
    // (will only fully initialize after successful auth check)
});

/**
 * Check if the user is authenticated as an admin
 */
function checkAdminAuth() {
    checkLoginStatus()
        .then(({ isLoggedIn, currentUser }) => {
            if (!isLoggedIn) {
                window.location.href = 'Login.html';
                return;
            }

            if (currentUser.role !== 'admin' && !currentUser.isAdmin) {
                window.location.href = 'Home.html';
                return;
            }

            console.log("Admin authenticated successfully");
            
            // Initialize dashboard after successful authentication
            initializeDashboard();
        })
        .catch(error => {
            console.error("Authentication error:", error);
            window.location.href = 'Login.html';
        });
}

/**
 * Initialize all dashboard components and data loading
 */
function initializeDashboard() {
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

/**
 * Load overview dashboard statistics
 */
function loadDashboardStats() {
    // Reference the stats elements
    const totalUsersElement = document.getElementById('total-users');
    const totalTeachersElement = document.getElementById('total-teachers');
    const totalParentsElement = document.getElementById('total-parents');
    const totalMaterialsElement = document.getElementById('total-materials');
    
    // Get user counts
    fbDb.collection('users').get()
        .then(usersSnapshot => {
            const users = {
                total: usersSnapshot.size,
                teachers: 0,
                parents: 0
            };
            
            usersSnapshot.forEach(doc => {
                const userData = doc.data();
                if (userData.role === 'teacher') users.teachers++;
                if (userData.role === 'parent') users.parents++;
            });
            
            // Update user stats
            totalUsersElement.textContent = users.total;
            totalTeachersElement.textContent = users.teachers;
            totalParentsElement.textContent = users.parents;
            
            // Set random trend percentages for demo
            document.getElementById('users-trend').textContent = (Math.random() * 20).toFixed(1) + '%';
            document.getElementById('teachers-trend').textContent = (Math.random() * 15).toFixed(1) + '%';
            document.getElementById('parents-trend').textContent = (Math.random() * 25).toFixed(1) + '%';
        })
        .catch(error => {
            console.error("Error getting user stats:", error);
            totalUsersElement.textContent = "Error";
            totalTeachersElement.textContent = "Error";
            totalParentsElement.textContent = "Error";
        });
    
    // Get materials count
    fbDb.collection('materials').get()
        .then(materialsSnapshot => {
            totalMaterialsElement.textContent = materialsSnapshot.size;
            document.getElementById('materials-trend').textContent = (Math.random() * 30).toFixed(1) + '%';
        })
        .catch(error => {
            console.error("Error getting materials stats:", error);
            totalMaterialsElement.textContent = "Error";
        });
}

/**
 * Load recent system activities
 */
function loadRecentActivities() {
    const activityContainer = document.getElementById('recent-activities');
    
    fbDb.collection('activities')
        .orderBy('timestamp', 'desc')
        .limit(5)
        .get()
        .then(snapshot => {
            if (snapshot.empty) {
                activityContainer.innerHTML = '<div class="empty-state">No recent activities</div>';
                return;
            }
            
            let activitiesHTML = '';
            
            snapshot.forEach(doc => {
                const activity = doc.data();
                const date = activity.timestamp ? 
                    formatDate(activity.timestamp.toDate()) : 
                    'Unknown date';
                
                let iconClass = 'fa-bell';
                
                // Set icon based on activity type
                if (activity.type === 'login') iconClass = 'fa-sign-in-alt';
                else if (activity.type === 'material') iconClass = 'fa-book';
                else if (activity.type === 'user') iconClass = 'fa-user';
                
                activitiesHTML += `
                    <div class="activity__item">
                        <div class="activity__icon">
                            <i class="fas ${iconClass}"></i>
                        </div>
                        <div class="activity__content">
                            <p class="activity__title">${activity.description}</p>
                            <span class="activity__meta">${date}</span>
                        </div>
                    </div>
                `;
            });
            
            activityContainer.innerHTML = activitiesHTML;
        })
        .catch(error => {
            console.error("Error loading activities:", error);
            activityContainer.innerHTML = '<div class="error-state">Error loading activities</div>';
        });
}

/**
 * Format date for display
 */
function formatDate(date) {
    return date.toLocaleString();
}

/**
 * Load educational materials list
 */
function loadMaterials() {
    const tableBody = document.getElementById('materials-table-body');
    
    fbDb.collection('materials')
        .orderBy('createdAt', 'desc')
        .get()
        .then(snapshot => {
            if (snapshot.empty) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="empty-state">No materials found</td>
                    </tr>
                `;
                return;
            }
            
            let materialsHTML = '';
            
            snapshot.forEach(doc => {
                const material = doc.data();
                const materialId = doc.id;
                
                const date = material.createdAt ? 
                    formatDate(material.createdAt.toDate()) : 
                    'Unknown date';
                
                materialsHTML += `
                    <tr data-id="${materialId}">
                        <td>${material.title}</td>
                        <td>${capitalizeFirstLetter(material.type || 'Unknown')}</td>
                        <td>${capitalizeFirstLetter(material.category || 'General')}</td>
                        <td>${capitalizeFirstLetter(material.audience || 'All')}</td>
                        <td>${date}</td>
                        <td class="actions">
                            <button class="btn-icon edit" onclick="editMaterial('${materialId}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon delete" onclick="deleteMaterial('${materialId}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
            
            tableBody.innerHTML = materialsHTML;
        })
        .catch(error => {
            console.error("Error loading materials:", error);
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="error-state">Error loading materials</td>
                </tr>
            `;
        });
}

/**
 * Load users list
 */
function loadUsers() {
    const tableBody = document.getElementById('users-table-body');
    
    fbDb.collection('users')
        .orderBy('createdAt', 'desc')
        .get()
        .then(snapshot => {
            if (snapshot.empty) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="empty-state">No users found</td>
                    </tr>
                `;
                return;
            }
            
            let usersHTML = '';
            
            snapshot.forEach(doc => {
                const user = doc.data();
                const userId = doc.id;
                
                const date = user.createdAt ? 
                    formatDate(user.createdAt.toDate()) : 
                    'Unknown date';
                
                const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
                const status = 'Active'; // Assume all users are active for now
                
                usersHTML += `
                    <tr data-id="${userId}" data-role="${user.role}">
                        <td>${fullName}</td>
                        <td>${user.email}</td>
                        <td>${capitalizeFirstLetter(user.role || 'User')}</td>
                        <td>${date}</td>
                        <td>
                            <span class="badge badge-success">${status}</span>
                        </td>
                        <td class="actions">
                            <button class="btn-icon edit" onclick="viewUser('${userId}')">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn-icon delete" onclick="deleteUser('${userId}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
            
            tableBody.innerHTML = usersHTML;
        })
        .catch(error => {
            console.error("Error loading users:", error);
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="error-state">Error loading users</td>
                </tr>
            `;
        });
}

/**
 * Set up form submission handlers
 */
function setupFormSubmissions() {
    // Add material form
    const addMaterialForm = document.getElementById('add-material-form');
    if (addMaterialForm) {
        addMaterialForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const materialData = {
                title: document.getElementById('material-title').value,
                type: document.getElementById('material-type').value,
                category: document.getElementById('material-category').value,
                audience: document.getElementById('material-audience').value,
                description: document.getElementById('material-description').value,
                externalUrl: document.getElementById('material-url').value || null,
                content: document.getElementById('material-content').value || null,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdBy: 'admin'
            };
            
            // Add material to Firestore
            fbDb.collection('materials').add(materialData)
                .then(() => {
                    // Track activity
                    trackAdminActivity('Added new material: ' + materialData.title, 'material');
                    
                    // Show success message
                    alert('Material added successfully');
                    
                    // Reset form
                    this.reset();
                    
                    // Reload materials list
                    loadMaterials();
                })
                .catch(error => {
                    console.error("Error adding material:", error);
                    alert('Error adding material: ' + error.message);
                });
        });
    }
    
    // Admin settings form
    const adminSettingsForm = document.getElementById('admin-settings-form');
    if (adminSettingsForm) {
        adminSettingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const settingsData = {
                notifications: document.getElementById('setting-notifications').checked,
                analytics: document.getElementById('setting-analytics').checked,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Save settings to Firestore
            fbDb.collection('settings').doc('admin').set(settingsData, { merge: true })
                .then(() => {
                    // Show success message
                    alert('Settings saved successfully');
                })
                .catch(error => {
                    console.error("Error saving settings:", error);
                    alert('Error saving settings: ' + error.message);
                });
        });
        
        // Load existing settings
        fbDb.collection('settings').doc('admin').get()
            .then(doc => {
                if (doc.exists) {
                    const settings = doc.data();
                    
                    document.getElementById('setting-notifications').checked = 
                        settings.notifications !== undefined ? settings.notifications : true;
                        
                    document.getElementById('setting-analytics').checked = 
                        settings.analytics !== undefined ? settings.analytics : true;
                }
            })
            .catch(error => {
                console.error("Error loading settings:", error);
            });
    }
    
    // Edit material form
    const editMaterialForm = document.getElementById('edit-material-form');
    if (editMaterialForm) {
        editMaterialForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const materialId = document.getElementById('edit-material-id').value;
            
            if (!materialId) {
                alert('Error: Material ID not found');
                return;
            }
            
            const materialData = {
                title: document.getElementById('edit-material-title').value,
                category: document.getElementById('edit-material-category').value,
                audience: document.getElementById('edit-material-audience').value,
                description: document.getElementById('edit-material-description').value,
                externalUrl: document.getElementById('edit-material-url').value || null,
                content: document.getElementById('edit-material-content').value || null,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Update material in Firestore
            fbDb.collection('materials').doc(materialId).update(materialData)
                .then(() => {
                    // Track activity
                    trackAdminActivity('Updated material: ' + materialData.title, 'material');
                    
                    // Hide modal
                    const modal = document.getElementById('edit-material-modal');
                    modal.style.display = 'none';
                    
                    // Show success message
                    alert('Material updated successfully');
                    
                    // Reload materials list
                    loadMaterials();
                })
                .catch(error => {
                    console.error("Error updating material:", error);
                    alert('Error updating material: ' + error.message);
                });
        });
    }
}

/**
 * Set up search and filter functionality
 */
function setupSearchFilters() {
    // Material search
    const materialSearch = document.getElementById('material-search');
    if (materialSearch) {
        materialSearch.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            filterTable('materials-table-body', searchTerm);
        });
    }
    
    // User search and filter
    const userSearch = document.getElementById('user-search');
    const userRoleFilter = document.getElementById('user-role-filter');
    
    if (userSearch) {
        userSearch.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const roleFilter = userRoleFilter ? userRoleFilter.value : 'all';
            filterUsersTable(searchTerm, roleFilter);
        });
    }
    
    if (userRoleFilter) {
        userRoleFilter.addEventListener('change', function() {
            const roleFilter = this.value;
            const searchTerm = userSearch ? userSearch.value.toLowerCase() : '';
            filterUsersTable(searchTerm, roleFilter);
        });
    }
    
    // News search
    const newsSearch = document.getElementById('news-search');
    if (newsSearch) {
        newsSearch.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            filterTable('news-table-body', searchTerm);
        });
    }
}

/**
 * Filter a generic table by search term
 */
function filterTable(tableBodyId, searchTerm) {
    const rows = document.querySelectorAll(`#${tableBodyId} tr`);
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        
        if (text.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

/**
 * Filter users table by search term and role
 */
function filterUsersTable(searchTerm, roleFilter) {
    const rows = document.querySelectorAll('#users-table-body tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const userRole = row.getAttribute('data-role');
        
        const matchesSearch = text.includes(searchTerm);
        const matchesRole = roleFilter === 'all' || userRole === roleFilter;
        
        if (matchesSearch && matchesRole) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

/**
 * Set up modal interactions
 */
function setupModals() {
    // Generic modal close functionality
    document.querySelectorAll('.close-modal').forEach(closeButton => {
        closeButton.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        document.querySelectorAll('.modal').forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
}

/**
 * Capitalize the first letter of a string
 */
function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Track admin activity
 */
function trackAdminActivity(description, type) {
    const activity = {
        description: description,
        type: type,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        userId: 'admin'
    };
    
    return fbDb.collection('activities').add(activity)
        .catch(error => {
            console.error("Error tracking activity:", error);
        });
}

/**
 * Edit material handler
 */
function editMaterial(materialId) {
    // Get material data
    fbDb.collection('materials').doc(materialId).get()
        .then(doc => {
            if (!doc.exists) {
                alert('Error: Material not found');
                return;
            }
            
            const material = doc.data();
            
            // Populate form fields
            document.getElementById('edit-material-id').value = materialId;
            document.getElementById('edit-material-title').value = material.title || '';
            document.getElementById('edit-material-category').value = material.category || '';
            document.getElementById('edit-material-audience').value = material.audience || '';
            document.getElementById('edit-material-description').value = material.description || '';
            document.getElementById('edit-material-url').value = material.externalUrl || '';
            document.getElementById('edit-material-content').value = material.content || '';
            
            // Show modal
            const modal = document.getElementById('edit-material-modal');
            modal.style.display = 'block';
        })
        .catch(error => {
            console.error("Error getting material:", error);
            alert('Error getting material: ' + error.message);
        });
}

/**
 * Delete material handler
 */
function deleteMaterial(materialId) {
    if (confirm('Are you sure you want to delete this material? This action cannot be undone.')) {
        fbDb.collection('materials').doc(materialId).get()
            .then(doc => {
                const materialTitle = doc.exists ? doc.data().title : 'Unknown material';
                
                // Delete the material
                return fbDb.collection('materials').doc(materialId).delete()
                    .then(() => {
                        // Track activity
                        trackAdminActivity('Deleted material: ' + materialTitle, 'material');
                        
                        // Show success message
                        alert('Material deleted successfully');
                        
                        // Reload materials list
                        loadMaterials();
                    });
            })
            .catch(error => {
                console.error("Error deleting material:", error);
                alert('Error deleting material: ' + error.message);
            });
    }
}

/**
 * View user handler
 */
function viewUser(userId) {
    // Redirect to a user profile page
    window.location.href = `User-Profile.html?id=${userId}`;
}

/**
 * Delete user handler
 */
function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        fbDb.collection('users').doc(userId).get()
            .then(doc => {
                const userData = doc.data();
                const userName = userData ? `${userData.firstName} ${userData.lastName}` : 'Unknown user';
                
                // Delete the user
                return fbDb.collection('users').doc(userId).delete()
                    .then(() => {
                        // Track activity
                        trackAdminActivity('Deleted user: ' + userName, 'user');
                        
                        // Show success message
                        alert('User deleted successfully');
                        
                        // Reload users list
                        loadUsers();
                    });
            })
            .catch(error => {
                console.error("Error deleting user:", error);
                alert('Error deleting user: ' + error.message);
            });
    }
}

// Make functions available globally for button click handlers
window.editMaterial = editMaterial;
window.deleteMaterial = deleteMaterial;
window.viewUser = viewUser;
window.deleteUser = deleteUser;
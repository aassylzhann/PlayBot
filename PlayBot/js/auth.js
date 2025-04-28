/**
 * Handles user login authentication
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @param {string} role - User's role (teacher or parent)
 * @param {boolean} remember - Whether to remember the user
 * @returns {Promise} - Resolves with user data or rejects with error
 */
function loginUser(email, password, role, remember) {
    return new Promise((resolve, reject) => {
        // In a real application, you would make an API call to your backend
        // For demonstration purposes, we're using localStorage
        
        // Simple validation
        if (!email || !password) {
            reject(new Error('Please enter both email and password'));
            return;
        }
        
        // Simulate server request with timeout
        setTimeout(() => {
            // Check if user exists in localStorage (from registration)
            const storedEmail = localStorage.getItem('userEmail_' + email);
            const storedPassword = localStorage.getItem('userPassword_' + email);
            const storedRole = localStorage.getItem('userRole_' + email);
            
            if (storedEmail === email && storedPassword === password && storedRole === role) {
                // User authenticated successfully
                const userData = {
                    email: email,
                    firstName: localStorage.getItem('userFirstName_' + email),
                    lastName: localStorage.getItem('userLastName_' + email),
                    role: role
                };
                
                // Set session information
                localStorage.setItem('currentUserEmail', email);
                localStorage.setItem('currentUserRole', role);
                localStorage.setItem('isLoggedIn', 'true');
                
                // Set remember me cookie if checked
                if (remember) {
                    const expiryDate = new Date();
                    expiryDate.setMonth(expiryDate.getMonth() + 1); // 1 month expiry
                    document.cookie = `rememberedUser=${email}; expires=${expiryDate.toUTCString()}; path=/`;
                }
                
                resolve(userData);
            } else if (email === 'admin@playbot.com' && password === 'admin123') {
                // Admin login
                const userData = {
                    email: 'admin@playbot.com',
                    firstName: 'Admin',
                    lastName: 'User',
                    role: 'admin'
                };
                
                // Set session information
                localStorage.setItem('currentUserEmail', 'admin@playbot.com');
                localStorage.setItem('currentUserRole', 'admin');
                localStorage.setItem('isLoggedIn', 'true');
                
                resolve(userData);
            } else {
                reject(new Error('Invalid email or password'));
            }
        }, 500); // Simulate network delay
    });
}

/**
 * Handles user logout
 */
function logoutUser() {
    netlifyIdentity.logout();
    localStorage.removeItem('user');
    window.location.href = 'Home.html';
}

/**
 * Checks if a user is currently logged in
 * @returns {boolean} Whether the user is logged in
 */
function isUserLoggedIn() {
    return netlifyIdentity.currentUser() !== null;
}

/**
 * Get the current logged in user data
 * @returns {Object|null} User data or null if not logged in
 */
function getCurrentUser() {
    if (!isUserLoggedIn()) return null;
    
    const netUser = netlifyIdentity.currentUser();
    
    // Format user data
    return {
        email: netUser.email,
        name: netUser.user_metadata.full_name || netUser.email.split('@')[0],
        role: netUser.app_metadata.roles ? netUser.app_metadata.roles[0] : 'student'
    };
}

/**
 * Registers a new user
 * @param {Object} userData - User registration data
 * @returns {Promise} - Resolves when registration is complete or rejects with error
 */
function registerUser(userData) {
    return new Promise((resolve, reject) => {
        // Basic validation
        if (!userData.email || !userData.password || !userData.firstName || !userData.lastName) {
            reject(new Error('All fields are required'));
            return;
        }
        
        if (userData.password !== userData.confirmPassword) {
            reject(new Error('Passwords do not match'));
            return;
        }
        
        if (!userData.termsAccepted) {
            reject(new Error('You must agree to the terms and conditions'));
            return;
        }
        
        // Check if email already exists
        const existingUser = localStorage.getItem('userEmail_' + userData.email);
        if (existingUser) {
            reject(new Error('Email already registered'));
            return;
        }
        
        // Simulate server request with timeout
        setTimeout(() => {
            // Store user data with email-based keys to allow multiple users
            localStorage.setItem('userEmail_' + userData.email, userData.email);
            localStorage.setItem('userPassword_' + userData.email, userData.password);
            localStorage.setItem('userFirstName_' + userData.email, userData.firstName);
            localStorage.setItem('userLastName_' + userData.email, userData.lastName);
            localStorage.setItem('userRole_' + userData.email, userData.role);
            
            // Set current session
            localStorage.setItem('currentUserEmail', userData.email);
            localStorage.setItem('currentUserRole', userData.role);
            localStorage.setItem('isLoggedIn', 'true');
            
            resolve({
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
                role: userData.role
            });
        }, 500); // Simulate network delay
    });
}

/**
 * Validates password strength
 * @param {string} password - The password to validate
 * @returns {Object} Result with isValid boolean and message string
 */
function validatePassword(password) {
    const result = {
        isValid: true,
        message: ''
    };
    
    // Password should be at least 8 characters
    if (password.length < 8) {
        result.isValid = false;
        result.message = 'Password must be at least 8 characters long';
        return result;
    }
    
    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
        result.isValid = false;
        result.message = 'Password must contain at least one uppercase letter';
        return result;
    }
    
    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
        result.isValid = false;
        result.message = 'Password must contain at least one lowercase letter';
        return result;
    }
    
    // Check for at least one number
    if (!/[0-9]/.test(password)) {
        result.isValid = false;
        result.message = 'Password must contain at least one number';
        return result;
    }
    
    return result;
}

/**
 * Check login status and return user data if logged in
 * @returns {Object} Object with isLoggedIn boolean and currentUser data
 */
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    let currentUser = null;
    
    if (isLoggedIn) {
        const email = localStorage.getItem('currentUserEmail');
        currentUser = {
            email: email,
            firstName: localStorage.getItem('userFirstName_' + email),
            lastName: localStorage.getItem('userLastName_' + email),
            role: localStorage.getItem('currentUserRole')
        };
    }
    
    return { isLoggedIn, currentUser };
}

/**
 * Updates UI for logged in or logged out state
 */
function updateAuthUI() {
    const authButtons = document.querySelector('.auth-buttons');
    const userProfile = document.querySelector('#user-profile');
    
    if (isUserLoggedIn()) {
        // Hide auth buttons and show user profile
        if (authButtons) authButtons.classList.add('hidden');
        if (userProfile) {
            const user = getCurrentUser();
            userProfile.classList.remove('hidden');
            
            // Update user name display
            const userNameEl = userProfile.querySelector('#user-name');
            if (userNameEl) userNameEl.textContent = user.name;
            
            // Update dropdown content
            const dropdownContent = userProfile.querySelector('.dropdown-content');
            if (dropdownContent) {
                // Clear existing content
                dropdownContent.innerHTML = '';
                
                // Add appropriate dashboard link based on role
                switch(user.role) {
                    case 'admin':
                        dropdownContent.innerHTML += '<a href="Admin-Dashboard.html">Admin Dashboard</a>';
                        break;
                    case 'teacher':
                        dropdownContent.innerHTML += '<a href="Teacher-Dashboard.html">Teacher Dashboard</a>';
                        break;
                    case 'parent':
                        dropdownContent.innerHTML += '<a href="Parent-Dashboard.html">Parent Dashboard</a>';
                        break;
                }
                
                // Add common links
                dropdownContent.innerHTML += `
                    <a href="Profile.html">Profile</a>
                    <a href="Change-Password.html">Change Password</a>
                    <a href="#" onclick="logoutUser(); return false;">Logout</a>
                `;
            }
        }
    } else {
        // Show auth buttons and hide user profile
        if (authButtons) authButtons.classList.remove('hidden');
        if (userProfile) userProfile.classList.add('hidden');
    }
}

/**
 * Update user profile data
 * @param {Object} userData User data to update
 * @returns {boolean} Success or failure
 */
function updateUserProfile(userData) {
    if (!isUserLoggedIn()) return false;
    
    const email = localStorage.getItem('currentUserEmail');
    
    if (userData.firstName) {
        localStorage.setItem('userFirstName_' + email, userData.firstName);
    }
    
    if (userData.lastName) {
        localStorage.setItem('userLastName_' + email, userData.lastName);
    }
    
    return true;
}

/**
 * Change user password
 * @param {string} currentPassword Current password
 * @param {string} newPassword New password
 * @returns {boolean} Success or failure
 */
function changeUserPassword(currentPassword, newPassword) {
    if (!isUserLoggedIn()) return false;
    
    const email = localStorage.getItem('currentUserEmail');
    const storedPassword = localStorage.getItem('userPassword_' + email);
    
    // Verify current password
    if (storedPassword !== currentPassword) {
        return false;
    }
    
    // Update password
    localStorage.setItem('userPassword_' + email, newPassword);
    return true;
}

/**
 * Check if user is admin
 * @returns {boolean} Whether the user is an admin
 */
function isAdminUser() {
    const currentUser = getCurrentUser();
    return currentUser && currentUser.role === 'admin';
}

// Setup Netlify Identity events
document.addEventListener('DOMContentLoaded', function() {
    if (typeof netlifyIdentity !== 'undefined') {
        netlifyIdentity.on('login', user => {
            // Update localStorage
            const userData = {
                email: user.email,
                name: user.user_metadata.full_name || user.email.split('@')[0],
                role: user.app_metadata.roles ? user.app_metadata.roles[0] : 'student'
            };
            localStorage.setItem('user', JSON.stringify(userData));
            
            // Update UI
            updateAuthUI();
        });
        
        netlifyIdentity.on('logout', () => {
            localStorage.removeItem('user');
            updateAuthUI();
        });
    }
});
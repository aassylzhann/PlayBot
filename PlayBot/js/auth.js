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
            } else if (email === "admin@playbot.com" && password === "123123") {
                const adminData = {
                    firstName: "Admin",
                    lastName: "User",
                    email: email,
                    role: "admin",
                    isAdmin: true
                };
                
                // Set session information
                localStorage.setItem('currentUserEmail', 'admin@playbot.com');
                localStorage.setItem('currentUserRole', 'admin');
                localStorage.setItem('isLoggedIn', 'true');
                
                resolve(adminData);
            } else {
                reject(new Error('Invalid email or password'));
            }
        }, 500); // Simulate network delay
    });
}

function isAdminUser() {
    const user = getCurrentUser();
    return user && user.isAdmin === true;
}

/**
 * Handles user logout
 */
function logoutUser() {
    localStorage.removeItem('currentUserEmail');
    localStorage.removeItem('currentUserRole');
    localStorage.setItem('isLoggedIn', 'false');
    
    // Redirect to home page
    window.location.href = 'Home.html';
}

/**
 * Checks if a user is currently logged in
 * @returns {boolean} Whether the user is logged in
 */
function isUserLoggedIn() {
    return localStorage.getItem('isLoggedIn') === 'true';
}

/**
 * Get the current logged in user data
 * @returns {Object|null} User data or null if not logged in
 */
function getCurrentUser() {
    if (!isUserLoggedIn()) return null;
    
    const email = localStorage.getItem('currentUserEmail');
    return {
        email: email,
        firstName: localStorage.getItem('userFirstName_' + email),
        lastName: localStorage.getItem('userLastName_' + email),
        role: localStorage.getItem('currentUserRole')
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
    const isLoggedIn = isUserLoggedIn();
    const authButtons = document.querySelector('.auth-buttons');
    const userProfile = document.getElementById('user-profile');
    
    if (isLoggedIn) {
        // Hide auth buttons, show user profile
        authButtons?.classList.add('hidden');
        userProfile?.classList.add('visible');
        
        // Update user name
        const currentUser = getCurrentUser();
        if (currentUser && userProfile) {
            const userNameSpan = userProfile.querySelector('#user-name');
            if (userNameSpan) {
                userNameSpan.textContent = currentUser.firstName || 'User';
            }
            
            // Update dropdown content based on user role
            const dropdownContent = userProfile.querySelector('.dropdown-content');
            if (dropdownContent) {
                dropdownContent.innerHTML = ''; // Clear existing content
                
                // Add links based on user role
                if (currentUser.role === 'admin') {
                    dropdownContent.innerHTML += `<a href="Admin-Dashboard.html">Admin Dashboard</a>`;
                } else if (currentUser.role === 'teacher') {
                    dropdownContent.innerHTML += `<a href="Teacher-Dashboard.html">Teacher Dashboard</a>`;
                } else if (currentUser.role === 'parent') {
                    dropdownContent.innerHTML += `<a href="Parent-Dashboard.html">Parent Dashboard</a>`;
                }
                
                // Common links for all users
                dropdownContent.innerHTML += `
                    <a href="Profile.html">My Profile</a>
                    <a href="#" onclick="handleLogout()">Logout</a>
                `;
            }
        }
    } else {
        // Show auth buttons, hide user profile
        authButtons?.classList.remove('hidden');
        userProfile?.classList.remove('visible');
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

// Call updateAuthUI when the DOM is loaded
document.addEventListener('DOMContentLoaded', updateAuthUI);

// Add this code to the Login.html page or update the existing login form submission handler:

document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const role = document.querySelector('input[name="role"]:checked')?.value || 'teacher'; // Default to teacher if no selection
            const remember = document.getElementById('remember')?.checked || false;
            
            // Show loading indicator
            const submitBtn = this.querySelector('.submit-btn');
            const originalBtnText = submitBtn ? submitBtn.textContent : 'Login';
            
            // Check if submitBtn exists before modifying it
            if (submitBtn) {
                submitBtn.textContent = 'Logging in...';
                submitBtn.disabled = true;
            }
            
            loginUser(email, password, role, remember)
                .then(userData => {
                    console.log('Login successful:', userData);
                    
                    // Redirect based on role
                    if (userData.role === 'admin') {
                        window.location.href = 'Admin-Dashboard.html';
                    } else if (userData.role === 'teacher') {
                        window.location.href = 'Teacher-Dashboard.html';
                    } else {
                        window.location.href = 'Parent-Dashboard.html';
                    }
                })
                .catch(error => {
                    console.error('Login error:', error);
                    alert(error.message || 'Login failed. Please try again.');
                    
                    // Reset button if it exists
                    if (submitBtn) {
                        submitBtn.textContent = originalBtnText;
                        submitBtn.disabled = false;
                    }
                });
        });
    }
});
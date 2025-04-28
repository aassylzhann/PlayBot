// Add this near the top of the file

// Set up Firebase Auth state observer
fbAuth.onAuthStateChanged(function(user) {
    // Call updateAuthUI() whenever auth state changes
    console.log("Firebase Auth state changed:", user ? "User logged in" : "User logged out");
    updateAuthUI();
});

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
        // Simple validation
        if (!email || !password) {
            reject(new Error('Please enter both email and password'));
            return;
        }
        
        // Special case for admin
        if (email === "admin@playbot.com" && password === "123123") {
            const adminData = {
                firstName: "Admin",
                lastName: "User",
                email: email,
                role: "admin",
                isAdmin: true
            };
            
            // Set session information
            localStorage.setItem('currentUserEmail', email);
            localStorage.setItem('currentUserRole', 'admin');
            localStorage.setItem('isLoggedIn', 'true');
            
            resolve(adminData);
            return;
        }
        
        // Set persistence based on remember checkbox
        const persistenceType = remember ? 
            firebase.auth.Auth.Persistence.LOCAL : 
            firebase.auth.Auth.Persistence.SESSION;
        
        fbAuth.setPersistence(persistenceType)
            .then(() => {
                // Sign in with email and password
                return fbAuth.signInWithEmailAndPassword(email, password);
            })
            .then((userCredential) => {
                // Get user data from Firestore
                return fbDb.collection('users').doc(userCredential.user.uid).get();
            })
            .then((doc) => {
                if (doc.exists) {
                    const userData = doc.data();
                    
                    // Verify role if provided
                    if (role && userData.role !== role) {
                        reject(new Error(`Invalid credentials for ${role} role`));
                        return;
                    }
                    
                    // Set session information
                    localStorage.setItem('currentUserEmail', email);
                    localStorage.setItem('currentUserRole', userData.role);
                    localStorage.setItem('isLoggedIn', 'true');
                    
                    resolve(userData);
                } else {
                    reject(new Error('User data not found'));
                }
            })
            .catch((error) => {
                reject(new Error(error.message));
            });
    });
}

/**
 * Handles user logout
 * @returns {Promise} Promise that resolves when logout is complete
 */
function logoutUser() {
    return new Promise((resolve, reject) => {
        fbAuth.signOut()
            .then(() => {
                localStorage.removeItem('currentUserEmail');
                localStorage.removeItem('currentUserRole');
                localStorage.setItem('isLoggedIn', 'false');
                
                resolve();
            })
            .catch((error) => {
                console.error('Logout error:', error);
                reject(error);
            });
    });
}

/**
 * Checks if a user is currently logged in
 * @returns {boolean} Whether the user is logged in
 */
function isUserLoggedIn() {
    return fbAuth.currentUser !== null || localStorage.getItem('isLoggedIn') === 'true';
}

/**
 * Get the current logged in user data
 * @returns {Promise<Object|null>} Promise resolving with user data or null if not logged in
 */
function getCurrentUser() {
    return new Promise((resolve, reject) => {
        const authUser = fbAuth.currentUser;
        
        if (!authUser && localStorage.getItem('isLoggedIn') !== 'true') {
            resolve(null);
            return;
        }
        
        // Handle admin case
        const email = localStorage.getItem('currentUserEmail');
        if (email === 'admin@playbot.com') {
            resolve({
                email: email,
                firstName: 'Admin',
                lastName: 'User',
                role: 'admin',
                isAdmin: true
            });
            return;
        }
        
        // For regular users, get data from Firestore
        if (authUser) {
            fbDb.collection('users').doc(authUser.uid).get()
                .then((doc) => {
                    if (doc.exists) {
                        resolve({
                            ...doc.data(),
                            email: authUser.email,
                            uid: authUser.uid
                        });
                    } else {
                        resolve({
                            email: authUser.email,
                            role: localStorage.getItem('currentUserRole')
                        });
                    }
                })
                .catch((error) => {
                    console.error('Error getting user data:', error);
                    reject(error);
                });
        } else {
            // Fallback to localStorage
            resolve({
                email: email,
                firstName: localStorage.getItem('userFirstName_' + email),
                lastName: localStorage.getItem('userLastName_' + email),
                role: localStorage.getItem('currentUserRole')
            });
        }
    });
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
        
        // Create user in Firebase Auth
        fbAuth.createUserWithEmailAndPassword(userData.email, userData.password)
            .then((userCredential) => {
                // Add user data to Firestore
                return fbDb.collection('users').doc(userCredential.user.uid).set({
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    role: userData.role,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            })
            .then(() => {
                // Set session information
                localStorage.setItem('currentUserEmail', userData.email);
                localStorage.setItem('currentUserRole', userData.role);
                localStorage.setItem('isLoggedIn', 'true');
                
                resolve({
                    email: userData.email,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    role: userData.role
                });
            })
            .catch((error) => {
                reject(new Error(error.message));
            });
    });
}

/**
 * Validates password strength
 * @param {string} password - The password to validate
 * @returns {Object} Result with isValid boolean and message string
 */
function validatePassword(password) {
    // This function doesn't need to change, it's client-side validation
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
 * @returns {Promise<Object>} Promise resolving with object containing isLoggedIn boolean and currentUser data
 */
function checkLoginStatus() {
    return new Promise((resolve) => {
        fbAuth.onAuthStateChanged((user) => {
            if (user || localStorage.getItem('isLoggedIn') === 'true') {
                getCurrentUser().then(currentUser => {
                    resolve({ isLoggedIn: true, currentUser });
                }).catch(error => {
                    console.error("Error getting current user:", error);
                    // Even if getCurrentUser fails, we should resolve with consistent structure
                    resolve({ isLoggedIn: false, currentUser: null });
                });
            } else {
                resolve({ isLoggedIn: false, currentUser: null });
            }
        });
    });
}

/**
 * Updates UI for logged in or logged out state
 */
function updateAuthUI() {
    checkLoginStatus().then(({ isLoggedIn, currentUser }) => {
        const authButtons = document.querySelector('.auth-buttons');
        const userProfile = document.getElementById('user-profile');
        
        if (isLoggedIn && currentUser) {
            // Hide auth buttons, show user profile
            authButtons?.classList.add('hidden');
            userProfile?.classList.add('visible');
            
            // Update user name
            if (userProfile) {
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
                        <a href="javascript:void(0)" onclick="handleLogout(); return false;">Logout</a>
                    `;
                }
            }
        } else {
            // Show auth buttons, hide user profile
            authButtons?.classList.remove('hidden');
            userProfile?.classList.remove('visible');
        }
    });
}

/**
 * Update user profile data
 * @param {Object} userData User data to update
 * @returns {Promise<boolean>} Promise resolving with success or failure
 */
function updateUserProfile(userData) {
    return new Promise((resolve, reject) => {
        const user = fbAuth.currentUser;
        
        if (!user) {
            reject(new Error('Not logged in'));
            return;
        }
        
        fbDb.collection('users').doc(user.uid).update({
            firstName: userData.firstName,
            lastName: userData.lastName,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
            resolve(true);
        })
        .catch((error) => {
            console.error('Error updating user profile:', error);
            reject(error);
        });
    });
}

/**
 * Change user password
 * @param {string} currentPassword Current password
 * @param {string} newPassword New password
 * @returns {Promise<boolean>} Promise resolving with success or failure
 */
function changeUserPassword(currentPassword, newPassword) {
    return new Promise((resolve, reject) => {
        const user = fbAuth.currentUser;
        
        if (!user) {
            reject(new Error('Not logged in'));
            return;
        }
        
        // Reauthenticate user
        const credential = firebase.auth.EmailAuthProvider.credential(
            user.email, 
            currentPassword
        );
        
        user.reauthenticateWithCredential(credential)
            .then(() => {
                // Update password
                return user.updatePassword(newPassword);
            })
            .then(() => {
                resolve(true);
            })
            .catch((error) => {
                console.error('Error changing password:', error);
                reject(error);
            });
    });
}

/**
 * Check if user is admin
 * @returns {Promise<boolean>} Promise resolving with whether the user is an admin
 */
function isAdminUser() {
    return getCurrentUser().then(user => {
        return user && (user.role === 'admin' || user.isAdmin === true);
    });
}

// Handle the logout function
function handleLogout() {
    return logoutUser().then(() => {
        window.location.href = 'Home.html';
    }).catch(error => {
        console.error("Logout error:", error);
        alert("Error logging out. Please try again.");
    });
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
            const role = document.querySelector('input[name="role"]:checked')?.value || 'teacher'; 
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
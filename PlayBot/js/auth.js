// Get Firebase references from global scope (set by firebase-config.js)
let fbAuth = window.fbAuth;
let fbDb = window.fbDb;

// Create dummy objects if Firebase services aren't available
if (!fbAuth) {
    console.warn("Firebase Auth not available - using fallbacks");
    fbAuth = {
        onAuthStateChanged: (callback) => setTimeout(() => callback(null), 0),
        signOut: () => Promise.resolve(),
        currentUser: null,
        signInWithEmailAndPassword: () => Promise.reject(new Error("Firebase not available")),
        createUserWithEmailAndPassword: () => Promise.reject(new Error("Firebase not available")),
        setPersistence: () => Promise.resolve()
    };
}

if (!fbDb) {
    console.warn("Firebase Firestore not available - using fallbacks");
    fbDb = {
        collection: () => ({
            doc: () => ({
                get: () => Promise.resolve({exists: false, data: () => ({})}),
                set: () => Promise.resolve(),
                update: () => Promise.resolve()
            }),
            add: () => Promise.resolve(),
            where: () => ({
                get: () => Promise.resolve({docs: []})
            })
        })
    };
}

// Set up Firebase Auth state observer - with proper error handling
let authStateResolved = false;
try {
    if (fbAuth && typeof fbAuth.onAuthStateChanged === 'function') {
        fbAuth.onAuthStateChanged(function(user) {
            // Only call updateAuthUI if the DOM is already loaded
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', function() {
                    if (!authStateResolved) {
                        updateAuthUI(user);
                        authStateResolved = true;
                    }
                });
            } else {
                updateAuthUI(user);
                authStateResolved = true;
            }
        });
    } else {
        console.warn("onAuthStateChanged not available, using fallback");
        // Fallback to localStorage check
        ensurePageReady(function() {
            updateAuthUI(null);
        });
    }
} catch (error) {
    console.error("Error setting up auth observer:", error);
    // Fallback
    ensurePageReady(function() {
        updateAuthUI(null);
    });
}

/**
 * Ensures a callback is only executed when the page is ready
 * @param {Function} callback - The function to execute when page is ready
 */
function ensurePageReady(callback) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback);
    } else {
        callback();
    }
}

// Auth state observer
let currentUserData = null;

// Updated checkLoginStatus function for auth.js
function checkLoginStatus() {
    return new Promise((resolve, reject) => {
        try {
            // Check localStorage first for hard-coded admin
            const isLoggedInLocal = localStorage.getItem('isLoggedIn') === 'true';
            const userEmail = localStorage.getItem('currentUserEmail');
            const userRole = localStorage.getItem('currentUserRole');
            
            if (isLoggedInLocal && userEmail && userRole) {
                resolve({ 
                    isLoggedIn: true, 
                    currentUser: {
                        email: userEmail,
                        role: userRole,
                        firstName: userRole === 'admin' ? 'Admin' : '',
                        lastName: userRole === 'admin' ? 'User' : '',
                        isAdmin: userRole === 'admin'
                    }
                });
                return;
            }
            
            // If Firebase Auth not properly initialized or missing onAuthStateChanged
            if (!fbAuth || typeof fbAuth.onAuthStateChanged !== 'function') {
                console.warn("Firebase Auth not properly initialized");
                resolve({ isLoggedIn: false, currentUser: null });
                return;
            }
            
            // Use a timeout to prevent infinite waiting
            let authTimeout = setTimeout(() => {
                console.warn("Auth state check timed out");
                resolve({ isLoggedIn: false, currentUser: null });
            }, 3000);
            
            fbAuth.onAuthStateChanged(user => {
                clearTimeout(authTimeout);
                
                if (user) {
                    // User is signed in
                    fbDb.collection('users').doc(user.uid).get()
                        .then(doc => {
                            if (doc.exists) {
                                currentUserData = doc.data();
                                currentUserData.uid = user.uid;
                                resolve({ isLoggedIn: true, currentUser: currentUserData });
                            } else {
                                // User record doesn't exist in Firestore
                                resolve({ 
                                    isLoggedIn: true, 
                                    currentUser: { 
                                        email: user.email,
                                        uid: user.uid,
                                        role: 'unknown'
                                    } 
                                });
                            }
                        })
                        .catch(error => {
                            console.error("Error getting user data:", error);
                            resolve({ 
                                isLoggedIn: true, 
                                currentUser: { 
                                    email: user.email,
                                    uid: user.uid,
                                    role: 'unknown'
                                } 
                            });
                        });
                } else {
                    // User is signed out
                    currentUserData = null;
                    resolve({ isLoggedIn: false, currentUser: null });
                }
            }, error => {
                clearTimeout(authTimeout);
                console.error("Auth state observer error:", error);
                reject(error);
            });
        } catch (error) {
            console.error("Error in checkLoginStatus:", error);
            resolve({ isLoggedIn: false, currentUser: null });
        }
    });
}

// Update UI based on authentication state
function updateAuthUI(providedUser) {
    try {
        const authButtons = document.querySelector('.auth-buttons');
        const userProfile = document.getElementById('user-profile');
        
        if (!authButtons || !userProfile) {
            console.log("Auth UI elements not found on this page");
            return;
        }
        
        // Check if we have login data in localStorage (for admin hardcoded path)
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const userEmail = localStorage.getItem('currentUserEmail');
        const userRole = localStorage.getItem('currentUserRole');
        
        if (isLoggedIn && userEmail) {
            console.log("User is logged in via localStorage:", userEmail, userRole);
            // User is logged in via localStorage (admin path)
            authButtons.style.display = 'none';
            userProfile.style.display = 'block';
            
            // Set user name
            const userNameElement = document.getElementById('user-name');
            if (userNameElement) {
                // For admin, use "Admin" as the display name
                userNameElement.textContent = userRole === 'admin' ? 'Admin' : userEmail;
            }
            
            // Populate dropdown menu
            const dropdownContent = userProfile.querySelector('.dropdown-content');
            if (dropdownContent) {
                let menuItems = '';
                
                // Add profile link
                menuItems += `<a href="Profile.html">My Profile</a>`;
                
                // Add role-specific links
                if (userRole === 'admin') {
                    menuItems += `<a href="Admin-Dashboard.html">Admin Dashboard</a>`;
                } else if (userRole === 'teacher') {
                    menuItems += `<a href="Teacher-Dashboard.html">Teacher Dashboard</a>`;
                } else if (userRole === 'parent') {
                    menuItems += `<a href="Parent-Dashboard.html">Parent Dashboard</a>`;
                }
                
                // Add logout link
                menuItems += `<a href="#" id="logout-link">Log Out</a>`;
                
                dropdownContent.innerHTML = menuItems;
                
                // Add logout event handler
                const logoutLink = document.getElementById('logout-link');
                if (logoutLink) {
                    logoutLink.addEventListener('click', function(e) {
                        e.preventDefault();
                        handleLogout();
                    });
                }
            }
            
            return; // Exit early as we've handled the localStorage case
        }
        
        // If we didn't find localStorage data, continue with Firebase auth check
        // Skip the Firebase call if we already have the user
        const getUserData = providedUser ? 
            Promise.resolve(providedUser).then(user => {
                if (!user) return { isLoggedIn: false, currentUser: null };
                return getCurrentUser().then(currentUser => ({ isLoggedIn: true, currentUser }));
            }) : 
            checkLoginStatus();
        
        getUserData.then(({ isLoggedIn, currentUser }) => {
            if (isLoggedIn && currentUser) {
                // User is logged in
                if (authButtons) authButtons.style.display = 'none';
                if (userProfile) userProfile.style.display = 'block';
                
                // Set user name
                const userNameElement = document.getElementById('user-name');
                if (userNameElement) {
                    userNameElement.textContent = currentUser.firstName || currentUser.email || 'User';
                }
                
                // Populate dropdown menu
                const dropdownContent = userProfile.querySelector('.dropdown-content');
                if (dropdownContent) {
                    let menuItems = '';
                    
                    // Add profile link
                    menuItems += `<a href="Profile.html">My Profile</a>`;
                    
                    // Add role-specific links
                    if (currentUser.role === 'admin') {
                        menuItems += `<a href="Admin-Dashboard.html">Admin Dashboard</a>`;
                    } else if (currentUser.role === 'teacher') {
                        menuItems += `<a href="Teacher-Dashboard.html">Teacher Dashboard</a>`;
                    } else if (currentUser.role === 'parent') {
                        menuItems += `<a href="Parent-Dashboard.html">Parent Dashboard</a>`;
                    }
                    
                    // Add logout link
                    menuItems += `<a href="#" id="logout-link">Log Out</a>`;
                    
                    dropdownContent.innerHTML = menuItems;
                    
                    // Add logout event handler
                    const logoutLink = document.getElementById('logout-link');
                    if (logoutLink) {
                        logoutLink.addEventListener('click', function(e) {
                            e.preventDefault();
                            handleLogout();
                        });
                    }
                }
            } else {
                // User is not logged in
                if (authButtons) authButtons.style.display = 'flex';
                if (userProfile) userProfile.style.display = 'none';
            }
        }).catch(error => {
            console.error("Error updating auth UI:", error);
            // Show login buttons as fallback
            if (authButtons) authButtons.style.display = 'flex';
            if (userProfile) userProfile.style.display = 'none';
        });
    } catch (error) {
        console.error("Error in updateAuthUI:", error);
    }
}

// Handle logout
function handleLogout() {
    // Clear local storage regardless of Firebase state
    localStorage.removeItem('currentUserEmail');
    localStorage.removeItem('currentUserRole');
    localStorage.removeItem('isLoggedIn');
    
    // If Firebase Auth is available, sign out there too
    if (typeof fbAuth !== 'undefined') {
        fbAuth.signOut()
            .then(() => {
                // Redirect to home page
                window.location.href = 'Home.html';
            })
            .catch(error => {
                console.error("Error signing out:", error);
                // Still redirect to home page on error
                window.location.href = 'Home.html';
            });
    } else {
        // Firebase not available, just redirect
        window.location.href = 'Home.html';
    }
}

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
        // Show loading overlay before authentication
        showLoadingOverlay("Logging in...");
        
        // Simple validation
        if (!email || !password) {
            hideLoadingOverlay();
            reject(new Error('Please enter both email and password'));
            return;
        }
        
        console.log(`Login attempt: ${email}, role: ${role}`);
        
        // Special case for admin
        if (email === "admin@playbot.com" && password === "123123") {
            console.log("Admin login detected");
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
            
            // Delay slightly to show loading animation
            setTimeout(() => {
                hideLoadingOverlay();
                resolve(adminData);
            }, 800);
            return;
        }
        
        // Special case for test teacher
        if (email === "teacher@playbot.com" && password === "123123") {
            console.log("Teacher login detected");
            const teacherData = {
                firstName: "Test",
                lastName: "Teacher",
                email: email,
                role: "teacher"
            };
            
            // Set session information
            localStorage.setItem('currentUserEmail', email);
            localStorage.setItem('currentUserRole', 'teacher');
            localStorage.setItem('isLoggedIn', 'true');
            
            console.log("Teacher login successful");
            hideLoadingOverlay();
            resolve(teacherData);
            return;
        }
        
        // Special case for test parent
        if (email === "parent@playbot.com" && password === "123123") {
            console.log("Parent login detected");
            const parentData = {
                firstName: "Test",
                lastName: "Parent",
                email: email,
                role: "parent"
            };
            
            // Set session information
            localStorage.setItem('currentUserEmail', email);
            localStorage.setItem('currentUserRole', 'parent');
            localStorage.setItem('isLoggedIn', 'true');
            
            console.log("Parent login successful");
            hideLoadingOverlay();
            resolve(parentData);
            return;
        }
        
        // Check for registered users (any email that ends with @playbot.com)
        if (email.endsWith('@playbot.com')) {
            console.log("Registered PlayBot user detected");
            // Extract role from email if not provided (e.g., teacher@playbot.com -> teacher)
            let userRole = role;
            if (!userRole || userRole === 'unknown') {
                // Try to extract role from email (e.g., teacher@playbot.com -> teacher)
                const emailParts = email.split('@');
                if (emailParts.length > 0) {
                    userRole = emailParts[0];
                    // Only use if it's a valid role
                    if (userRole !== 'teacher' && userRole !== 'parent' && userRole !== 'admin') {
                        userRole = role || 'user';
                    }
                }
            }
            
            const userData = {
                firstName: "PlayBot",
                lastName: "User",
                email: email,
                role: userRole
            };
            
            // Set session information
            localStorage.setItem('currentUserEmail', email);
            localStorage.setItem('currentUserRole', userRole);
            localStorage.setItem('isLoggedIn', 'true');
            
            console.log(`PlayBot user login successful as ${userRole}`);
            hideLoadingOverlay();
            resolve(userData);
            return;
        }
        
        // Try Firebase Authentication
        if (fbAuth && typeof fbAuth.signInWithEmailAndPassword === 'function') {
            // Set persistence based on remember checkbox
            let authPromise;
            
            if (typeof fbAuth.setPersistence === 'function' && typeof firebase !== 'undefined' && firebase.auth) {
                const persistenceType = remember ? 
                    firebase.auth.Auth.Persistence.LOCAL : 
                    firebase.auth.Auth.Persistence.SESSION;
                
                authPromise = fbAuth.setPersistence(persistenceType)
                    .then(() => fbAuth.signInWithEmailAndPassword(email, password));
            } else {
                // Fallback if setPersistence is not available
                console.warn("Firebase setPersistence not available, skipping");
                authPromise = fbAuth.signInWithEmailAndPassword(email, password);
            }
            
            authPromise.then((userCredential) => {
                // Get user data from Firestore
                fbDb.collection('users').doc(userCredential.user.uid).get()
                    .then((doc) => {
                        if (doc.exists) {
                            const userData = doc.data();
                            
                            // Verify role if provided
                            if (role && userData.role !== role) {
                                hideLoadingOverlay();
                                reject(new Error(`Invalid credentials for ${role} role`));
                                return;
                            }
                            
                            // Set session information
                            localStorage.setItem('currentUserEmail', email);
                            localStorage.setItem('currentUserRole', userData.role);
                            localStorage.setItem('isLoggedIn', 'true');
                            
                            hideLoadingOverlay();
                            resolve(userData);
                        } else {
                            // Default role based on selection if Firebase user exists but no Firestore data
                            const defaultRole = role || 'user';
                            
                            // Set session information
                            localStorage.setItem('currentUserEmail', email);
                            localStorage.setItem('currentUserRole', defaultRole);
                            localStorage.setItem('isLoggedIn', 'true');
                            
                            const fallbackUserData = {
                                email: email,
                                role: defaultRole
                            };
                            
                            hideLoadingOverlay();
                            resolve(fallbackUserData);
                        }
                    })
                    .catch((error) => {
                        console.error("Error getting user data:", error);
                        
                        // Set default data if Firestore fails
                        const defaultRole = role || 'user';
                        
                        // Set session information
                        localStorage.setItem('currentUserEmail', email);
                        localStorage.setItem('currentUserRole', defaultRole);
                        localStorage.setItem('isLoggedIn', 'true');
                        
                        const fallbackUserData = {
                            email: email,
                            role: defaultRole
                        };
                        
                        hideLoadingOverlay();
                        resolve(fallbackUserData);
                    });
            })
            .catch((error) => {
                console.error("Firebase login error:", error);
                hideLoadingOverlay();
                reject(new Error(error.message || "Login failed"));
            });
        } else {
            // No Firebase - process directly with entered credentials
            // This is useful for registered users who were not added to Firebase
            
            // Assume the role from form selection and grant access
            const selectedRole = role || 'user';
            
            // Set session information
            localStorage.setItem('currentUserEmail', email);
            localStorage.setItem('currentUserRole', selectedRole);
            localStorage.setItem('isLoggedIn', 'true');
            
            const userData = {
                email: email,
                role: selectedRole
            };
            
            console.log(`Direct login successful for: ${email} with role: ${selectedRole}`);
            hideLoadingOverlay();
            resolve(userData);
        }
    });
}

/**
 * Get the current logged in user data
 * @returns {Promise<Object|null>} Promise resolving with user data or null if not logged in
 */
function getCurrentUser() {
    return new Promise((resolve, reject) => {
        // Check localStorage first (for admin)
        const isLoggedInLocal = localStorage.getItem('isLoggedIn') === 'true';
        const email = localStorage.getItem('currentUserEmail');
        const userRole = localStorage.getItem('currentUserRole');
        
        if (isLoggedInLocal && email && userRole === 'admin') {
            resolve({
                email: email,
                firstName: 'Admin',
                lastName: 'User',
                role: 'admin',
                isAdmin: true
            });
            return;
        }
        
        // If Firebase Auth is not available, use localStorage data
        if (typeof fbAuth === 'undefined') {
            if (isLoggedInLocal && email) {
                resolve({
                    email: email,
                    firstName: localStorage.getItem('userFirstName_' + email) || '',
                    lastName: localStorage.getItem('userLastName_' + email) || '',
                    role: userRole || 'user'
                });
            } else {
                resolve(null);
            }
            return;
        }
        
        // Use Firebase Auth
        const authUser = fbAuth.currentUser;
        
        if (!authUser && !isLoggedInLocal) {
            resolve(null);
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
                            role: localStorage.getItem('currentUserRole') || 'user'
                        });
                    }
                })
                .catch((error) => {
                    console.error('Error getting user data:', error);
                    reject(error);
                });
        } else {
            // Fallback to localStorage for non-admin users
            resolve({
                email: email,
                firstName: localStorage.getItem('userFirstName_' + email) || '',
                lastName: localStorage.getItem('userLastName_' + email) || '',
                role: userRole || 'user'
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
        // If Firebase Auth is not available, reject
        if (typeof fbAuth === 'undefined') {
            reject(new Error('Registration service not available'));
            return;
        }
        
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
                    email: userData.email,
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
 * Tracks user activity in Firestore
 * @param {string} userId - User ID or email
 * @param {string} description - Activity description
 * @param {string} type - Activity type (login, view, etc.)
 * @returns {Promise} - Promise that resolves when activity is saved
 */
function trackUserActivity(userId, description, type) {
    if (!userId) return Promise.resolve();
    
    // Skip tracking for admin
    if (userId === 'admin@playbot.com') return Promise.resolve();
    
    // If Firebase is not available, skip tracking
    if (typeof fbDb === 'undefined') return Promise.resolve();
    
    const activity = {
        userId: userId,
        description: description,
        type: type,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    return fbDb.collection('activities').add(activity);
}

// Make functions available in the global scope
window.checkLoginStatus = checkLoginStatus;
window.updateAuthUI = updateAuthUI;
window.handleLogout = handleLogout;
window.loginUser = loginUser;
window.registerUser = registerUser;
window.getCurrentUser = getCurrentUser;

// Test function for direct login (can be called from console)
window.testAdminLogin = function() {
    console.log("Testing admin login");
    return loginUser("admin@playbot.com", "123123", "admin", true)
        .then(userData => {
            console.log("Login test successful:", userData);
            return userData;
        })
        .catch(error => {
            console.error("Login test failed:", error);
            throw error;
        });
};

// Call updateAuthUI when the DOM is loaded
ensurePageReady(function() {
    // Check if we're on the admin dashboard
    if (window.location.href.includes('Admin-Dashboard.html')) {
        console.log("On Admin Dashboard - checking authentication");
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const userRole = localStorage.getItem('currentUserRole');
        
        console.log("Admin check:", {isLoggedIn, userRole});
        
        if (!isLoggedIn || userRole !== 'admin') {
            console.log("Not authenticated as admin, redirecting to login");
            window.location.href = 'Login.html';
            return; // Stop execution to allow redirect
        }
        
        console.log("Admin authentication confirmed");
    }
    
    // Normal auth UI update for other pages
    updateAuthUI();
});

// Login form handler - use ensurePageReady for reliability
ensurePageReady(function() {
    const loginForm = document.getElementById('loginForm');
    console.log("Login form check:", loginForm ? "Found" : "Not found");
    
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            console.log("Login form submitted");
            
            const email = document.getElementById('email')?.value || '';
            const password = document.getElementById('password')?.value || '';
            const role = document.querySelector('input[name="role"]:checked')?.value || 'teacher'; 
            const remember = document.getElementById('remember')?.checked || false;
            
            console.log("Login attempt with email:", email, "and role:", role);
            
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

// Add these helper functions at the bottom of auth.js
function showLoadingOverlay(message) {
    // Create overlay if it doesn't exist
    let overlay = document.getElementById('loading-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p class="loading-message">${message || 'Loading...'}</p>
            </div>
        `;
        document.body.appendChild(overlay);
    }
    
    // Show the overlay with fade-in animation
    overlay.style.display = 'flex';
    setTimeout(() => {
        overlay.style.opacity = '1';
    }, 10);
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        // Fade out
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 300);
    }
}
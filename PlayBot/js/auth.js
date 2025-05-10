// Firebase initialization
const firebaseConfig = {
    apiKey: "AIzaSyAedr0odqXmKxgbMdoEm0aYYlfLYyBqMoM",
    authDomain: "playbot-ed-tech.firebaseapp.com",
    projectId: "playbot-ed-tech",
    storageBucket: "playbot-ed-tech.appspot.com",
    messagingSenderId: "409133432749",
    appId: "1:409133432749:web:af36ffd161e5a20c12baf0"
};

// Initialize Firebase only if not already initialized
if (typeof firebase !== 'undefined') {
    // Initialize the Firebase app if not already initialized
    if (!firebase.apps || !firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    // Create reference to Firebase services
    const fbAuth = firebase.auth();
    const fbDb = firebase.firestore();
} else {
    console.error("Firebase SDK not loaded. Auth functions will use localStorage fallbacks.");
    // Create dummy objects to prevent errors
    const fbAuth = {
        onAuthStateChanged: (callback) => callback(null),
        signOut: () => Promise.resolve(),
        currentUser: null
    };
    
    const fbDb = {
        collection: () => ({
            doc: () => ({
                get: () => Promise.resolve({exists: false, data: () => ({})}),
                set: () => Promise.resolve(),
                update: () => Promise.resolve()
            }),
            add: () => Promise.resolve()
        })
    };
}

// Set up Firebase Auth state observer - with performance improvements
let authStateResolved = false;
if (typeof fbAuth !== 'undefined') {
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
}

// Auth state observer
let currentUserData = null;

// Check login status and get current user data
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
            
            // If no localStorage data or Firebase not available, use Firebase
            if (typeof fbAuth === 'undefined') {
                console.error("Firebase Auth not initialized");
                resolve({ isLoggedIn: false, currentUser: null });
                return;
            }
            
            fbAuth.onAuthStateChanged(user => {
                if (user) {
                    // User is signed in.
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
                    // User is signed out.
                    currentUserData = null;
                    resolve({ isLoggedIn: false, currentUser: null });
                }
            }, error => {
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
        
        // If Firebase Auth is not available, reject
        if (typeof fbAuth === 'undefined') {
            reject(new Error('Authentication service not available'));
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
                // Track login activity
                trackUserActivity(userCredential.user.uid, "User logged in", "login");
                
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

// Call updateAuthUI when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the admin dashboard
    if (window.location.href.includes('Admin-Dashboard.html')) {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const userRole = localStorage.getItem('currentUserRole');
        
        if (!isLoggedIn || userRole !== 'admin') {
            window.location.href = 'Login.html';
        }
    }
    
    // Normal auth UI update for other pages
    updateAuthUI();
});

// Login form handler
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
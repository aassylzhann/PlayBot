/**
 * Initializes common header components
 */
function initializeHeader() {
    // Check login status and update UI
    if (typeof updateAuthUI === 'function') {
        updateAuthUI();
    }
    
    // Initialize language selector if it exists
    const enBtn = document.getElementById('en-btn');
    const zhBtn = document.getElementById('zh-btn');
    
    if (enBtn && zhBtn) {
        // Load preferred language from localStorage
        const preferredLanguage = localStorage.getItem('preferredLanguage') || 'en';
        switchLanguage(preferredLanguage);
        
        // Set event listeners
        enBtn.addEventListener('click', function() {
            switchLanguage('en');
        });
        
        zhBtn.addEventListener('click', function() {
            switchLanguage('zh');
        });
    }
}

/**
 * Switch language function
 */
function switchLanguage(lang) {
    const enBtn = document.getElementById('en-btn');
    const zhBtn = document.getElementById('zh-btn');
    
    if (!enBtn || !zhBtn) return;
    
    // Toggle active class on buttons
    if (lang === 'en') {
        enBtn.classList.add('active');
        zhBtn.classList.remove('active');
    } else if (lang === 'zh') {
        zhBtn.classList.add('active');
        enBtn.classList.remove('active');
    }
    
    // Save preference
    localStorage.setItem('preferredLanguage', lang);
    
    // Show/hide language content
    const langContents = document.querySelectorAll('.lang-content');
    langContents.forEach(content => {
        if (content.getAttribute('data-lang') === lang) {
            content.style.display = '';
        } else {
            content.style.display = 'none';
        }
    });
}

/**
 * Handle user logout from any page
 */
function handleLogout() {
    if (typeof logoutUser === 'function') {
        logoutUser();
    } else {
        // Fallback if auth.js isn't loaded
        localStorage.removeItem('currentUserEmail');
        localStorage.removeItem('currentUserRole');
        localStorage.setItem('isLoggedIn', 'false');
    }
    
    // Redirect to home page
    window.location.href = 'Home.html';
}

// Initialize components when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeHeader();
});
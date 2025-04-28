/**
 * Initializes common header components
 */
function initializeHeader() {
    try {
        // Check if auth functions are available before calling them
        if (typeof updateAuthUI === 'function') {
            updateAuthUI();
        } else {
            console.warn("Auth UI functions not available yet");
            // Try again with a delay
            setTimeout(() => {
                if (typeof updateAuthUI === 'function') {
                    updateAuthUI();
                }
            }, 500);
        }
    } catch (error) {
        console.error("Error initializing header:", error);
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

// Initialize mobile menu
function initializeMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mainMenu = document.querySelector('.main__menu');
    
    if (mobileMenuBtn && mainMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            mainMenu.classList.toggle('active');
            this.classList.toggle('active');
        });
    }
}

// Initialize dropdown menus
function initializeDropdowns() {
    const dropdowns = document.querySelectorAll('.dropdown');
    
    dropdowns.forEach(dropdown => {
        const link = dropdown.querySelector('a');
        const content = dropdown.querySelector('.dropdown-content');
        
        if (link && content) {
            // Mobile-friendly dropdown toggle
            if (window.innerWidth < 768) {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    content.classList.toggle('show');
                });
            }
        }
    });
}

// Initialize accordion elements
function initializeAccordions() {
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    
    accordionHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const content = this.nextElementSibling;
            this.classList.toggle('active');
            
            if (content.style.maxHeight) {
                content.style.maxHeight = null;
            } else {
                content.style.maxHeight = content.scrollHeight + 'px';
            }
        });
    });
}

// Initialize tabs
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Hide all tab contents
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Remove active class from all tab buttons
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Show the selected tab content
            document.getElementById(tabId).classList.add('active');
            
            // Add active class to the clicked button
            this.classList.add('active');
        });
    });
}

// Initialize components on DOM content loaded
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Initialize components with proper error handling
        initializeHeader();
        initializeMobileMenu();
        initializeDropdowns();
        initializeAccordions();
        initializeTabs();
        
        console.log("All page components initialized");
    } catch (error) {
        console.error("Error initializing components:", error);
    }
});
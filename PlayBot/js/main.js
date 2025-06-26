// Fix scroll handling and event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Initialize scroll handling
    window.addEventListener('scroll', handleScroll);
    
    // Fix for scroll-to-top button
    const scrollTopBtn = document.getElementById('scroll-top-btn');
    if (scrollTopBtn) {
        scrollTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // Initialize any other components
    initializeComponents();
});

function handleScroll() {
    const header = document.getElementById('header');
    const scrollTopBtn = document.getElementById('scroll-top-btn');
    
    // Handle header sticky class
    if (header) {
        if (window.scrollY > 50) {
            header.classList.add('sticky');
        } else {
            header.classList.remove('sticky');
        }
    }
    
    // Handle scroll-to-top button visibility
    if (scrollTopBtn) {
        if (window.scrollY > 300) {
            scrollTopBtn.classList.add('visible');
        } else {
            scrollTopBtn.classList.remove('visible');
        }
    }
}

function initializeComponents() {
    // Add any component initialization here
    console.log("Main components initialized");
}

// Language switching functionality
function switchLanguage(lang) {
    // Validate lang parameter
    if (lang !== 'en' && lang !== 'zh') {
        console.error('Invalid language code:', lang);
        return;
    }
    
    // Store language preference
    localStorage.setItem('preferred_language', lang);
    
    // Update UI for language buttons
    const enBtn = document.getElementById('en-btn');
    const zhBtn = document.getElementById('zh-btn');
    
    if (enBtn && zhBtn) {
        if (lang === 'en') {
            enBtn.classList.add('active');
            zhBtn.classList.remove('active');
        } else {
            enBtn.classList.remove('active');
            zhBtn.classList.add('active');
        }
    }
    
    // Toggle language content sections
    const contentSections = document.querySelectorAll('.lang-content');
    contentSections.forEach(section => {
        if (section.getAttribute('data-lang') === lang) {
            section.style.display = 'block';
        } else {
            section.style.display = 'none';
        }
    });
    
    console.log('Language switched to:', lang);
}

// Check and apply stored language preference on load
document.addEventListener('DOMContentLoaded', function() {
    const storedLang = localStorage.getItem('preferred_language');
    if (storedLang) {
        switchLanguage(storedLang);
    }
});

// Make switchLanguage available globally
window.switchLanguage = switchLanguage;

// Scroll slide function
let currentIndex = 0;
function scrollSlide(direction) {
    const slides = document.querySelector('.slider');
    const totalSlides = 3;
    // const slideWidth = 100 / totalSlides;

    currentIndex = (currentIndex + direction + totalSlides) % totalSlides;

    // Calculate the new transform value
   // slides.style.transform = `translateX(-${currentIndex * slideWidth}%)`;
    slider.style.transform = `translateX(-${currentIndex * 100}%)`;
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

// Handle ethics accordion functionality
document.addEventListener('DOMContentLoaded', function() {
    const accordionHeaders = document.querySelectorAll('.ethics-accordion-header');
    
    accordionHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const accordionItem = this.parentElement;
            const accordionContent = this.nextElementSibling;
            
            // Close all other accordion items
            const allAccordionItems = document.querySelectorAll('.ethics-accordion-item');
            allAccordionItems.forEach(item => {
                if (item !== accordionItem && item.classList.contains('active')) {
                    item.classList.remove('active');
                }
            });
            
            // Toggle current accordion item
            accordionItem.classList.toggle('active');
        });
    });
    
    // Open the first accordion item by default
    const firstAccordionItem = document.querySelector('.ethics-accordion-item');
    if (firstAccordionItem) {
        firstAccordionItem.classList.add('active');
    }
});

// Add page transition indicator
document.addEventListener('DOMContentLoaded', function() {
    // Remove loading class if it exists
    document.body.classList.remove('page-loading');
    
    // Add click handler to all internal links
    document.querySelectorAll('a').forEach(link => {
        // Only for internal links to HTML pages
        if (link.href && link.href.includes(window.location.hostname) && 
            link.href.endsWith('.html')) {
            
            link.addEventListener('click', function(e) {
                // Don't add loading indicator for "javascript:void(0)" links
                if (this.getAttribute('href') === 'javascript:void(0)') return;
                
                document.body.classList.add('page-loading');
            });
        }
    });
});

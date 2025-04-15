// Language switcher function
function switchLanguage(lang) {
    // Update active button
    document.getElementById('en-btn').classList.toggle('active', lang === 'en');
    document.getElementById('zh-btn').classList.toggle('active', lang === 'zh');
    
    // Switch content with data-lang attribute
    const langContents = document.querySelectorAll('.lang-content');
    langContents.forEach(content => {
        if (content.getAttribute('data-lang') === lang) {
            content.style.display = 'block';
        } else {
            content.style.display = 'none';
        }
    });
    
    // Switch headings with data-lang-en and data-lang-zh attributes
    const langHeadings = document.querySelectorAll('[data-lang-en][data-lang-zh]');
    langHeadings.forEach(heading => {
        heading.textContent = heading.getAttribute(`data-lang-${lang}`);
    });
    
    // Store language preference
    localStorage.setItem('preferredLanguage', lang);
}

// Load preferred language on page load
document.addEventListener('DOMContentLoaded', function() {
    const savedLang = localStorage.getItem('preferredLanguage') || 'en';
    switchLanguage(savedLang);
});

// Scroll to top function
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Scroll slide function
let currentIndex = 0;
function scrollSlide(direction) {
    const slides = document.querySelector('.slider');
    const totalSlides = 6;
    const slideWidth = 100 / totalSlides;

    currentIndex = (currentIndex + direction + totalSlides) % totalSlides;

    // Calculate the new transform value
    slides.style.transform = `translateX(-${currentIndex * slideWidth}%)`;
}

// Combined scroll event handler
function handleScroll() {
    const scrollTopBtn = document.getElementById("scroll-top-btn");
    const prevBtn = document.querySelector(".prev-btn");
    const nextBtn = document.querySelector(".next-btn");
    const header = document.querySelector("#sticky-header-with-topbar");

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const headerHeight = header.offsetHeight;

    // Show/hide scroll to top button
    if (scrollTop > 300) {
        scrollTopBtn.classList.add("show");
    } else {
        scrollTopBtn.classList.remove("show");
    }

    // Show/hide slide buttons based on scroll position
    if (scrollTop >= headerHeight) {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
    } else {
        prevBtn.style.display = 'block';
        nextBtn.style.display = 'block';
    }
}

// Add event listener for scroll
window.addEventListener('scroll', handleScroll);

// Add click event to scroll button
document.getElementById("scroll-top-btn").addEventListener("click", scrollToTop);

// Add click event to slide buttons
document.querySelector(".prev-btn").addEventListener("click", () => scrollSlide(-1));
document.querySelector(".next-btn").addEventListener("click", () => scrollSlide(1));

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
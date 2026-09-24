// ===================================
// Loading Screen Animation with Video
// ===================================
const loadingScreen = document.getElementById('loading-screen');
const loadingVideo = document.getElementById('loading-video');

function initLoadingScreen() {
    // Disable loading screen completely on mobile devices
    if (window.innerWidth <= 768) {
        if (loadingScreen) loadingScreen.style.display = 'none';
        document.body.classList.remove('loading');
        if (loadingVideo) {
            loadingVideo.pause();
            loadingVideo.removeAttribute('src'); // Free up memory
            loadingVideo.load();
        }
        return;
    }

    // Video event handling
    if (loadingVideo) {
        // Fallback: If video fails to load, continue with black background
        loadingVideo.addEventListener('error', () => {
            console.warn('Loading video failed to load. Using fallback black background.');
        });

        // Pause video when it ends to save resources
        loadingVideo.addEventListener('ended', () => {
            loadingVideo.pause();
        });
    }

    // Timeline:
    // 0-90ms: Black background fade-in (handled by CSS animation)
    // 90-2310ms: Video plays (2.22 seconds = 2220ms)
    // 2310-2400ms: Black background fade-out (90ms)
    // 2400ms: Loading screen removed

    // Stage 1: Fade-out starts at 2310ms
    setTimeout(() => {
        loadingScreen.classList.add('fade-out');
        document.body.classList.remove('loading');
    }, 2310);

    // Stage 2: Remove loading screen from DOM at 2400ms
    setTimeout(() => {
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
            // Pause and reset video to save resources
            if (loadingVideo) {
                loadingVideo.pause();
                loadingVideo.currentTime = 0;
            }
        }
        
        // --- Show Splash Modal if we're on the home page ---
        // Using requestAnimationFrame to ensure it triggers immediately after loading screen is hidden
        requestAnimationFrame(() => {
            if (typeof window.showSplashModal === 'function') {
                window.showSplashModal();
            }
        });
    }, 2400);
}

// Initialize loading screen on page load
if (loadingScreen) {
    initLoadingScreen();
}

// ===================================
// Navbar scroll effect
// ===================================
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Smooth scroll for navigation links
// Force scroll to top on page load
window.addEventListener('load', () => {
    window.scrollTo(0, 0);
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Mobile menu toggle
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const navMenu = document.getElementById('navMenu');
const mobileNavOverlay = document.getElementById('mobileNavOverlay');
const mobilePanelClose = document.getElementById('mobilePanelClose');
let scrollPosition = 0;

function closeMobileMenu() {
    navMenu.classList.remove('active');
    mobileMenuToggle.classList.remove('active');
    if (mobileNavOverlay) mobileNavOverlay.classList.remove('active');
    document.body.classList.remove('no-scroll');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, scrollPosition);

    // Close all open dropdowns too
    document.querySelectorAll('.dropdown.mobile-open').forEach(d => d.classList.remove('mobile-open'));
}

function openMobileMenu() {
    scrollPosition = window.scrollY;
    navMenu.classList.add('active');
    mobileMenuToggle.classList.add('active');
    if (mobileNavOverlay) mobileNavOverlay.classList.add('active');
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollPosition}px`;
    document.body.style.width = '100%';
    document.body.classList.add('no-scroll');
}

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        navMenu.classList.contains('active') ? closeMobileMenu() : openMobileMenu();
    });
}

// Panel close button (×)
if (mobilePanelClose) {
    mobilePanelClose.addEventListener('click', closeMobileMenu);
}

// Close menu when clicking the dark overlay
if (mobileNavOverlay) {
    mobileNavOverlay.addEventListener('click', closeMobileMenu);
}

// Tap-to-expand dropdowns on mobile
document.querySelectorAll('.dropdown').forEach(dropdown => {
    const link = dropdown.querySelector('.nav-link');
    if (!link) return;

    link.addEventListener('click', (e) => {
        // Only intercept on mobile
        if (window.innerWidth > 768) return;

        e.preventDefault();
        e.stopPropagation();

        const isOpen = dropdown.classList.contains('mobile-open');

        // Close all others first
        document.querySelectorAll('.dropdown.mobile-open').forEach(d => d.classList.remove('mobile-open'));

        // Toggle this one
        if (!isOpen) {
            dropdown.classList.add('mobile-open');
        }
    });
});

// Close mobile menu when clicking a non-dropdown nav-link
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        // Skip if this is a dropdown toggle (handled above)
        if (link.closest('.dropdown')) return;
        if (!navMenu.classList.contains('active')) return;

        e.preventDefault();
        e.stopPropagation();

        const href = link.getAttribute('href');
        closeMobileMenu();

        setTimeout(() => {
            if (href && href !== '#') {
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else if (href.includes('.html')) {
                    window.location.href = href; // External page (gallery.html)
                }
            }
        }, 60);
    });
});

// Close mobile menu when clicking dropdown sub-links
document.querySelectorAll('.dropdown-menu a').forEach(link => {
    link.addEventListener('click', (e) => {
        if (window.innerWidth > 768) return;
        // Let default onclick fire first, then close the menu
        setTimeout(closeMobileMenu, 100);
    });
});

// Contact form handling
const contactForm = document.getElementById('contactForm');
const formMessage = document.getElementById('formMessage');

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Get form data
        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData);

        // Get the submit button to change its state
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;

        // Set loading state
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
        formMessage.textContent = '';

        try {
            const response = await fetch(contactForm.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                // Show success message
                formMessage.textContent = 'Thank you for your enquiry! We will contact you soon.';
                formMessage.style.color = '#d4af37'; // Gold
                formMessage.style.marginTop = '1rem';
                formMessage.style.textAlign = 'center';

                // Reset form
                contactForm.reset();
            } else {
                // Handle potential errors from Formspree
                const errorData = await response.json();
                if (Object.hasOwn(errorData, 'errors')) {
                    const errorMessages = errorData.errors.map(error => error.message).join(", ");
                    throw new Error(errorMessages);
                } else {
                    throw new Error('Oops! There was a problem submitting your form');
                }
            }
        } catch (error) {
            // Show error message
            formMessage.textContent = error.message || 'Oops! Something went wrong. Please try again.';
            formMessage.style.color = '#ef4444'; // Red color
            formMessage.style.marginTop = '1rem';
            // Clear message after 5 seconds
            setTimeout(() => {
                formMessage.textContent = '';
            }, 5000);
        }
    });
}

// Fade-in animation on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe all sections
document.querySelectorAll('section').forEach(section => {
    observer.observe(section);
});

// GSAP Scroll-Triggered Text Reveal Animation
// Register ScrollTrigger plugin
if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    // Apply to all elements with js-fill class
    const fillElements = document.querySelectorAll('.js-fill > span');

    fillElements.forEach(target => {
        if (target && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            gsap.to(target, {
                backgroundPosition: '0% 0',  // Move gradient from right (100%) to left (0%)
                ease: 'none',
                scrollTrigger: {
                    trigger: target.closest('.js-fill'),
                    start: 'top 75%',        // Start when element enters viewport
                    end: 'top 40%',          // Complete quickly for full text visibility
                    scrub: 0.5,              // Smooth scrolling effect
                }
            });
        }
    });
}

// Bento Grid Scroll Animations
const bentoObserverOptions = {
    threshold: 0.2,
    rootMargin: '0px 0px -100px 0px'
};

const bentoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('aos-animate');
            bentoObserver.unobserve(entry.target);
        }
    });
}, bentoObserverOptions);

// Observe all Bento cards
document.querySelectorAll('[data-aos]').forEach(card => {
    bentoObserver.observe(card);
});

/* ===================================
   Modal Logic
   =================================== */
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('programModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const closeModalBtn = document.querySelector('.close-modal');
    const closeModalTrigger = document.querySelector('.close-modal-trigger');
    const openModalBtns = document.querySelectorAll('.open-modal-btn');

    const programDetails = {
        monthly: {
            title: 'Monthly Plan',
            content: `
                <p>Full access to our comprehensive Karate training program on a flexible month-to-month billing cycle. Ideal for students starting their martial arts journey without long-term commitments.</p>
                <ul>
                    <li><strong>Training Access:</strong> All scheduled classes applicable to belt level.</li>
                    <li><strong>Focus:</strong> From fundamental stances to advanced Shito-Ryu forms and sparring strategies.</li>
                    <li><strong>Benefits:</strong> Top-tier physical conditioning, self-defense mastery, and step-by-step belt progression.</li>
                    <li><strong>Billing:</strong> Renews automatically every month. Cancel anytime.</li>
                </ul>
                <p>Start mastering your mind and body under expert guidance with ultimate flexibility.</p>
            `
        },
        quarterly: {
            title: 'Quarterly Plan (6 Months)',
            content: `
                <p>The perfect middle ground — commit to 6 months of structured Shito-Ryu Karate training and enjoy a discounted rate compared to month-to-month billing.</p>
                <ul>
                    <li><strong>Training Access:</strong> Full access to all scheduled classes for 6 consecutive months.</li>
                    <li><strong>Focus:</strong> Steady skill development, from fundamental stances to advanced Shito-Ryu forms and sparring strategies.</li>
                    <li><strong>Benefits:</strong> Meaningful savings over the monthly plan, with enough time to genuinely progress through belt levels.</li>
                    <li><strong>Billing:</strong> One upfront payment covering 6 full months of training.</li>
                </ul>
                <p>Ideal for students ready to commit to real progress while enjoying greater value than month-to-month membership.</p>
            `
        },
        yearly: {
            title: 'Annual Plan (Best Value)',
            content: `
                <p>Commit to a year of excellence and get our absolute best value. The Annual Plan includes everything from the Monthly Plan at a significantly discounted rate.</p>
                <ul>
                    <li><strong>Training Access:</strong> Unrestricted access to all scheduled classes year-round.</li>
                    <li><strong>Focus:</strong> Long-term development, including competition preparation and the Black Belt pathway.</li>
                    <li><strong>Benefits:</strong> Consistent growth, deep mentorship opportunities, and the best financial value.</li>
                    <li><strong>Billing:</strong> One upfront payment covering 12 full months.</li>
                </ul>
                <p>Dedicate yourself to true mastery and lock in our lowest rate for your martial arts journey.</p>
            `
        }
    };

    function openModal(programKey) {
        const data = programDetails[programKey];
        if (data && modal) {
            modalTitle.textContent = data.title;
            modalBody.innerHTML = data.content;
            modal.style.display = 'flex';
            // Trigger reflow
            void modal.offsetWidth;
            modal.classList.add('show');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        }
    }

    function closeModal() {
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
                document.body.style.overflow = '';
            }, 300);
        }
    }

    if (openModalBtns) {
        openModalBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent default button behavior
                const programKey = btn.getAttribute('data-program');
                openModal(programKey);
            });
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }

    if (closeModalTrigger) {
        closeModalTrigger.addEventListener('click', closeModal);
    }

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Expose functions to global scope for inline handlers
    window.closeModal = closeModal;
    window.openModal = openModal;
    window.openCertificateModal = openCertificateModal;

    const certificatesData = {
        '2025-2026': ['January']
    };

    function openCertificateModal(year) {
        if (!modal) return;

        const months = certificatesData[year];
        if (!months) return;

        modalTitle.textContent = `Certificates: ${year}`;

        // Build the month selection UI
        let htmlContent = `<div class="certificate-months-grid">`;
        months.forEach(month => {
            htmlContent += `<button class="btn btn-outline month-btn" onclick="showCertificates('${year}', '${month}')">${month}</button>`;
        });
        htmlContent += `</div><div id="certificate-display-area" class="certificate-display-area"></div>`;

        modalBody.innerHTML = htmlContent;
        modal.style.display = 'flex';
        void modal.offsetWidth;
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    window.showCertificates = function (year, month) {
        const displayArea = document.getElementById('certificate-display-area');
        if (!displayArea) return;

        // Placeholder for uploaded certificates
        // In a real app, this would fetch images from a server/folder
        displayArea.innerHTML = `
            <h3 class="text-center" style="margin: 2rem 0 1rem; color: var(--color-accent);">${month} ${year}</h3>
            <div class="certificates-gallery">
                <div class="certificate-placeholder">
                    <span>Certificate 1</span>
                </div>
                <div class="certificate-placeholder">
                    <span>Certificate 2</span>
                </div>
                <div class="certificate-placeholder">
                    <span>Certificate 3</span>
                </div>
            </div>
            <p class="text-center" style="margin-top: 1rem; font-size: 0.9rem; color: var(--color-text-muted);">
                (Certificates uploaded by the team will appear here)
            </p>
        `;
    };

    /* --- Certificate / Gallery Lightbox Modal --- */
    const certModal = document.getElementById('cert-modal');
    const certModalImg = document.getElementById('cert-modal-img');
    const certModalTitle = document.getElementById('cert-modal-title');
    const certModalDesc = document.getElementById('cert-modal-desc');
    const certModalClose = document.querySelector('.cert-modal-close');
    const certModalOverlay = document.querySelector('.cert-modal-overlay');

    if (certModal) {
        // Add click listeners to all gallery items
        document.querySelectorAll('.gallery-item').forEach(item => {
            item.style.cursor = 'pointer'; // Make them look clickable

            // Add a subtle hover effect if desired, or rely on CSS
            item.addEventListener('click', () => {
                const img = item.querySelector('img');
                const title = item.querySelector('h3');
                const desc = item.querySelector('p');

                if (img) {
                    certModalImg.src = img.src;
                } else {
                    // Fallback for placeholders without real images
                    const placeholderSpan = item.querySelector('.gallery-image span');
                    if (placeholderSpan) {
                        // Empty src will show alt text or broken image icon. 
                        // For this MVP, we just use empty src if no image.
                        certModalImg.src = '';
                        certModalImg.alt = placeholderSpan.textContent;
                    }
                }

                if (title) certModalTitle.textContent = title.textContent;
                if (desc) certModalDesc.textContent = desc.textContent;

                certModal.classList.add('active');
                certModal.setAttribute('aria-hidden', 'false');
                document.body.style.overflow = 'hidden'; // Stop background scrolling
            });
        });

        // Close functions
        const closeCertModal = () => {
            certModal.classList.remove('active');
            certModal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = ''; // Restore scrolling

            // Clear image after fade Out animation completes (300ms)
            setTimeout(() => {
                certModalImg.src = '';
                certModalImg.alt = 'Certificate View';
            }, 300);
        };

        if (certModalClose) certModalClose.addEventListener('click', closeCertModal);
        if (certModalOverlay) certModalOverlay.addEventListener('click', closeCertModal);

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && certModal.classList.contains('active')) {
                closeCertModal();
            }
        });
    }

});

/* ===================================
   Testimonial Marquee Logic
   =================================== */
function initTestimonialMarquee({ containerSelector, reviews }) {
    const marqueeContainer = document.querySelector(containerSelector);
    if (!marqueeContainer || !reviews || reviews.length === 0) return;

    marqueeContainer.innerHTML = '';

    // Function to generate a single card HTML
    const createCardHTML = (review) => {
        const initials = review.author.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
        const stars = '★'.repeat(review.stars || 5) + '☆'.repeat(5 - (review.stars || 5));
        return `
        <article class="testimonial-card-mq">
            <div class="testimonial-card-mq__header">
                <div class="testimonial-card-mq__avatar">${initials}</div>
                <div class="testimonial-card-mq__meta">
                    <span class="testimonial-card-mq__author">${review.author}</span>
                    <div class="testimonial-card-mq__stars">${stars}</div>
                </div>
            </div>
            <p class="testimonial-card-mq__text">"${review.text}"</p>
            <div class="testimonial-card-mq__source">
                <svg class="google-logo-icon" viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Google Review</span>
            </div>
        </article>
    `;
    };

    // 1. Create First Track and fill it
    const track1 = document.createElement('div');
    track1.className = 'testimonial-marquee__track';

    reviews.forEach((review) => {
        track1.insertAdjacentHTML('beforeend', createCardHTML(review));
    });

    marqueeContainer.appendChild(track1);

    // 2. Create Second Track (Clone for infinite loop)
    const track2 = document.createElement('div');
    track2.className = 'testimonial-marquee__track';
    track2.setAttribute('aria-hidden', 'true'); // Hide from screen readers so they don't read duplicates

    reviews.forEach((review) => {
        track2.insertAdjacentHTML('beforeend', createCardHTML(review));
    });

    marqueeContainer.appendChild(track2);
}

// Initialize on page load with data
document.addEventListener('DOMContentLoaded', () => {
    const reviewsData = [
        {
            author: "Paulson Vincent",
            stars: 5,
            text: "My son has been attending karate classes under Neeraj for a while. He has exceptional ability to combine rigour and patience while teaching kids. He pays good attention to fitness as well. Strongly recommend this place."
        },
        {
            author: "Prem Kumar",
            stars: 5,
            text: "The karate training is excellent. My daughter has been going for the last 4 months. The instructor maintains great discipline and explains every technique clearly. I can see real improvement in my daughter — she is feeling more confident in everything. I truly appreciate the quality of teaching provided."
        },
        {
            author: "Mamatha Teja",
            stars: 5,
            text: "The Karate classes under Trainer Neeraj at Eurokids Doddakannelli are a must-try. It's an investment in your child's physical health, mental focus, and character development. Highly, highly recommended!"
        },
        {
            author: "Lokesh Lokesh",
            stars: 5,
            text: "We are very happy with the karate class. My kid loves coming every week and is learning so much. The coach gives personal attention and motivates the children very well. Highly recommend this place."
        },
        {
            author: "Eshitha Eshwarilr",
            stars: 5,
            text: "The training quality is very good, and the coach Neeraj maintains discipline while keeping the kids motivated. I can see great improvement in my child's focus and confidence."
        },
        {
            author: "Udaya Kumar",
            stars: 5,
            text: "My child really enjoys the karate classes. The coach Neeraj is very patient, skilled, and dedicated. My child has become more disciplined and active. We are very happy with the progress. Highly recommend this institute."
        },
        {
            author: "Syed Musthaffa",
            stars: 5,
            text: "Nice coaching provided by the Karate master."
        },
        {
            author: "Chaithra Chaithra",
            stars: 5,
            text: "Very good coaching by the master Neeraj, really grateful for kids to learn defending techniques and good fitness."
        },
        {
            author: "Vincent Vasanth Kumar",
            stars: 5,
            text: "Very good instructor, well structured and disciplined. My kids are learning a lot here. Very thankful to Neeraj sir for improving confidence in my kids."
        }
    ];

    initTestimonialMarquee({
        containerSelector: '#my-testimonials',
        reviews: reviewsData
    });
});

/* ===================================
   Splash Screen Trial Modal Logic
   =================================== */
window.showSplashModal = function() {
    const splashModal = document.getElementById('splash-modal');
    if (!splashModal) return;

    // Check if we've already shown the splash modal in this session to prevent annoyance
    const hasSeenSplash = sessionStorage.getItem('rsmac_splash_seen');
    if (hasSeenSplash) return;

    // Mark as seen immediately so it doesn't fire again if re-triggered
    sessionStorage.setItem('rsmac_splash_seen', 'true');

    // Show the modal with a tiny delay to ensure CSS transitions happen
    setTimeout(() => {
        splashModal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Make background unscrollable while open
    }, 100);
};

window.closeSplashModal = function() {
    const splashModal = document.getElementById('splash-modal');
    if (!splashModal) return;

    splashModal.classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
    
    // Completely hide after transition finishes
    setTimeout(() => {
        splashModal.style.display = 'none';
    }, 400);
};

document.addEventListener('DOMContentLoaded', () => {
    const splashModal = document.getElementById('splash-modal');
    const splashCloseBtn = document.querySelector('.splash-close-btn');
    const splashBookBtn = document.getElementById('splash-book-btn');

    if (!splashModal) return;

    // Close on X btn
    if (splashCloseBtn) {
        splashCloseBtn.addEventListener('click', window.closeSplashModal);
    }

    // Close on dark overlay click
    splashModal.addEventListener('click', (e) => {
        if (e.target === splashModal) {
            window.closeSplashModal();
        }
    });

    // Handle "Book My Free Trial" click
    if (splashBookBtn) {
        splashBookBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.closeSplashModal();
            window.open('https://forms.gle/ciE1fZenXYvK115t6', '_blank');
        });
    }
});

// ===================================
// RS MAC Calendar
// ===================================
(function () {
    const grid       = document.getElementById('calDaysGrid');
    const label      = document.getElementById('calMonthLabel');
    const prevBtn    = document.getElementById('calPrev');
    const nextBtn    = document.getElementById('calNext');

    if (!grid || !label || !prevBtn || !nextBtn) return;

    const MONTHS = [
        'January','February','March','April','May','June',
        'July','August','September','October','November','December'
    ];

    // Days when classes run (0=Sun,1=Mon,...,6=Sat)
    const CLASS_DAYS = new Set([1, 2, 3, 4, 5, 6]); // Mon–Sat

    // Special event dates: { 'YYYY-M-D': true }
    // These can be updated whenever real events are scheduled.
    const EVENT_DATES = {};

    const now  = new Date();
    let cur = { year: now.getFullYear(), month: now.getMonth() };

    function buildCalendar({ year, month }) {
        grid.innerHTML = '';
        label.textContent = `${MONTHS[month]} ${year}`;

        const firstDay  = new Date(year, month, 1).getDay();   // 0=Sun
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const todayKey  = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;

        // Empty prefix cells
        for (let i = 0; i < firstDay; i++) {
            const empty = document.createElement('div');
            empty.className = 'cal-day cal-empty';
            grid.appendChild(empty);
        }

        // Day cells
        for (let d = 1; d <= daysInMonth; d++) {
            const cell = document.createElement('div');
            cell.className = 'cal-day';
            cell.textContent = d;

            const dayOfWeek = new Date(year, month, d).getDay();
            const key = `${year}-${month}-${d}`;
            const isToday = (key === todayKey);

            if (isToday) {
                cell.classList.add('cal-today');
            } else if (EVENT_DATES[key]) {
                cell.classList.add('cal-event-day');
            } else if (CLASS_DAYS.has(dayOfWeek)) {
                cell.classList.add('cal-class-day');
            }

            grid.appendChild(cell);
        }
    }

    buildCalendar(cur);

    prevBtn.addEventListener('click', () => {
        cur.month--;
        if (cur.month < 0) { cur.month = 11; cur.year--; }
        buildCalendar(cur);
    });

    nextBtn.addEventListener('click', () => {
        cur.month++;
        if (cur.month > 11) { cur.month = 0; cur.year++; }
        buildCalendar(cur);
    });
})();

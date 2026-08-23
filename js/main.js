// ================= Smooth Scrolling (Lenis) & Anchor Links =================
const mobilePerformanceMode = () => window.matchMedia('(max-width: 900px), (hover: none), (pointer: coarse)').matches;
const reducedMotionMode = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let lenis; // عرفناها بره عشان نقدر نستخدمها في الناف بار
document.addEventListener("DOMContentLoaded", () => {
    const canUseLenis = typeof Lenis !== 'undefined' && !mobilePerformanceMode() && !reducedMotionMode();

    if (canUseLenis) {
        lenis = new Lenis({
            lerp: 0.08,
            direction: 'vertical',
            gestureDirection: 'vertical',
            smooth: true,
            smoothTouch: false,
        });
        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
    }

    // Desktop uses Lenis; touch devices use the browser's cheaper native smooth scroll.
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return; // تجاهل لو اللينك فاضي

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault(); // نمنع القفزة المفاجئة
                const nav = document.getElementById('navbar');
                const navHeight = nav ? nav.offsetHeight : 0;

                const rect = targetElement.getBoundingClientRect();
                const absoluteTop = window.scrollY + rect.top;
                const isTall = rect.height > (window.innerHeight * 0.8);

                // Mobile: align below navbar. Desktop: center short sections, top-align tall sections.
                if (lenis) {
                    if (window.innerWidth < 768) {
                        lenis.scrollTo(targetElement, { offset: -(navHeight + 16), duration: 0.9 });
                    } else {
                        if (isTall) {
                            lenis.scrollTo(targetElement, { offset: -(navHeight + 16), duration: 0.9 });
                        } else {
                            const centerY = Math.max(0, absoluteTop + rect.height / 2 - window.innerHeight / 2);
                            lenis.scrollTo(centerY, { duration: 0.9 });
                        }
                    }
                } else {
                    let topPos;
                    if (window.innerWidth < 768 || isTall) {
                        topPos = absoluteTop - (navHeight + 16);
                    } else {
                        topPos = Math.max(0, absoluteTop + rect.height / 2 - window.innerHeight / 2);
                    }
                    window.scrollTo({ top: topPos, behavior: reducedMotionMode() ? 'auto' : 'smooth' });
                }
            }
        });
    });
});

// ================= General UI Logic =================
document.addEventListener('DOMContentLoaded', () => {
    // Loader
    const loader = document.getElementById('loader');
    if(loader) {
        // حفظ الـ Hash في الذاكرة (عشان لو راجعين من صفحة تفاصيل المشروع)
        const targetHash = window.location.hash;

        // حل مشكلة القفز لقسم البروجكتس وتثبيت الصفحة عند الهيرو دايماً
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }

        // تفريغ الـ URL من أي Hash (عشان نمنع قفزة المتصفح المفاجئة أول ما يفتح)
        if (window.location.hash) {
            window.history.replaceState(null, null, window.location.pathname + window.location.search);
        }

        window.scrollTo(0, 0);
        if (typeof lenis !== 'undefined' && lenis) lenis.scrollTo(0, { immediate: true });

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        const isBackNav = performance.getEntriesByType("navigation")[0]?.type === "back_forward";
        const introDuration = reduceMotion ? 350 : (mobilePerformanceMode() ? 1800 : 2850);
        const introCount = document.getElementById('intro-count');
        if (introCount) {
            const introStartedAt = performance.now();
            const updateIntroCount = (now) => {
                const progress = Math.min((now - introStartedAt) / introDuration, 1);
                introCount.textContent = String(Math.round(progress * 100)).padStart(2, '0');
                if (progress < 1) requestAnimationFrame(updateIntroCount);
            };
            requestAnimationFrame(updateIntroCount);
        }

        document.body.classList.add('intro-lock');
        if (typeof lenis !== 'undefined' && lenis) lenis.stop();

        setTimeout(() => {
            // إجبار أخير للصفحة قبل ما الستارة تترفع عشان نمنع أي قفزة
            window.scrollTo(0, 0);

            loader.classList.add('intro-complete');
            document.body.classList.remove('intro-lock');
            document.body.classList.add('intro-loaded');
            
            const savedScroll = sessionStorage.getItem('indexScrollPos');
            if (typeof lenis !== 'undefined' && lenis) {
                lenis.start();
                
                // لو اللينك كان فيه #projects، هنعمل سكرول سينمائي ناعم للقسم
                if (targetHash) {
                    setTimeout(() => {
                        const targetEl = document.querySelector(targetHash);
                        if (targetEl) {
                            const navHeight = document.getElementById('navbar') ? document.getElementById('navbar').offsetHeight : 0;
                            lenis.scrollTo(targetEl, { offset: -(navHeight + 16), duration: 1.5 });
                        }
                    }, 200);
                } else if (isBackNav && savedScroll) {
                    // لو راجع من السهم بتاع المتصفح، يرجع لنفس المكان اللي كان واقف فيه
                    lenis.scrollTo(parseFloat(savedScroll), { immediate: true });
                } else {
                    lenis.scrollTo(0, { immediate: true }); // لو مفيش، يفضل فوق
                }
            } else {
                if (targetHash) {
                    setTimeout(() => {
                        const targetEl = document.querySelector(targetHash);
                        if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth' });
                    }, 200);
                } else if (isBackNav && savedScroll) {
                    window.scrollTo(0, parseFloat(savedScroll));
                }
            }

            setTimeout(() => {
                loader.style.display = 'none';
            }, 1200);
        }, introDuration);
    }

    // Mobile Nav
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    if(hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('nav-active');
            hamburger.classList.toggle('toggle');
        });
        navLinks.querySelectorAll('li a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('nav-active');
                hamburger.classList.remove('toggle');
            });
        });
    }

    // Contact form redirect
    const contactForm = document.querySelector('.contact-form');
    const nextInput = contactForm ? contactForm.querySelector('input[name="_next"]') : null;
    if (nextInput) {
        nextInput.value = new URL('thanks.html', window.location.href).href;
    }

    // Theme Toggle
    const themeToggleBtn = document.getElementById('theme-toggle');
    const htmlTag = document.documentElement;
    if(themeToggleBtn) {
        const themeIcon = themeToggleBtn.querySelector('i');
        function updateThemeIcon(theme) {
            if (theme === 'light') {
                themeIcon.classList.replace('fa-sun', 'fa-moon');
            } else {
                themeIcon.classList.replace('fa-moon', 'fa-sun');
            }
        }
        let currentTheme = localStorage.getItem('theme') || 'dark';
        if (!localStorage.getItem('theme')) {
            localStorage.setItem('theme', currentTheme);
        }
        htmlTag.setAttribute('data-theme', currentTheme);
        updateThemeIcon(currentTheme);

        themeToggleBtn.addEventListener('click', () => {
            let theme = htmlTag.getAttribute('data-theme');
            if (theme === 'dark') {
                htmlTag.setAttribute('data-theme', 'light');
                localStorage.setItem('theme', 'light');
                updateThemeIcon('light');
                window.dispatchEvent(new Event('themeChanged'));
            } else {
                htmlTag.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
                updateThemeIcon('dark');
                window.dispatchEvent(new Event('themeChanged'));
            }
        });
    }
});

// ================= Save Scroll Position for Back Button =================
window.addEventListener('beforeunload', () => {
    // نحفظ مكان السكرول في الرئيسية بس عشان لما نرجع من البروجكت يكمل من نفس المكان
    if (!window.location.href.includes('project.html') && !window.location.href.includes('thanks.html')) {
        sessionStorage.setItem('indexScrollPos', window.scrollY);
    }
});

// Navbar Scroll
let navbarScrollTicking = false;
window.addEventListener('scroll', () => {
    if (!navbarScrollTicking) {
        navbarScrollTicking = true;
        requestAnimationFrame(() => {
            const nav = document.getElementById('navbar');
            if (nav) {
                if (window.scrollY > 50) {
                    nav.classList.add('scrolled');
                } else if (!window.location.href.includes('project.html')) {
                    nav.classList.remove('scrolled');
                }
            }
            navbarScrollTicking = false;
        });
    }
}, { passive: true });

// --- Typing Effect ---
const typingTextElement = document.getElementById('typing-text');
if (typingTextElement) {
    const texts = ["Full Stack Laravel.", "Software Engineering.", "Hardware Solutions.", "Web Development."];
    let count = 0, index = 0, currentText = "", letter = "";
    (function type() {
        if (count === texts.length) count = 0;
        currentText = texts[count];
        letter = currentText.slice(0, ++index);
        typingTextElement.textContent = letter;
        let typeSpeed = 100;
        if (letter.length === currentText.length) {
            typeSpeed = 2000;
            index = 0;
            count++;
        }
        setTimeout(type, typeSpeed);
    }());
}

// Scroll Animations
const observerOptions = { threshold: 0.15, rootMargin: "0px 0px -50px 0px" };
const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add('show'), index * 80);
        }
    });
}, observerOptions);

const animElements = document.querySelectorAll('.hidden-fade, .hidden-slide-left, .hidden-slide-right, .hidden-slide-up');
animElements.forEach(el => observer.observe(el));

// Run an initial visibility pass to handle elements already in view or cases where smooth-scrolling library
// (e.g., Lenis) may delay intersection events. This ensures elements that should already be visible get the 'show' class.
function runVisibilityCheck() {
    animElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const inView = rect.top <= (window.innerHeight * (1 - observerOptions.threshold)) && rect.bottom >= 0;
        if (inView) el.classList.add('show');
    });
}


// Check shortly after load and when resizing. Also schedule a check after Lenis init if present.
window.addEventListener('load', () => setTimeout(runVisibilityCheck, 100));
window.addEventListener('resize', runVisibilityCheck);
if (typeof lenis !== 'undefined') setTimeout(runVisibilityCheck, 300);

// Parallax is intentionally desktop-only to keep touch scrolling on the compositor thread.
if (!mobilePerformanceMode()) {
    window.addEventListener('scroll', () => {
        document.querySelectorAll('[data-parallax]').forEach(el => {
            const speed = el.getAttribute('data-parallax') || 0.5;
            el.style.transform = `translateY(${window.scrollY * speed}px)`;
        });
    }, { passive: true });
}

    // ================= Custom Parallax for Projects Section =================
    document.addEventListener('DOMContentLoaded', () => {
        const projectsSection = document.getElementById('projects');
        if (projectsSection) {
            const parallaxBg = document.createElement('div');
            parallaxBg.className = 'projects-parallax-bg';
            projectsSection.insertBefore(parallaxBg, projectsSection.firstChild);
            
            if (!mobilePerformanceMode()) {
                window.addEventListener('scroll', () => {
                    const rect = projectsSection.getBoundingClientRect();
                    // التأكد إن القسم ظاهر في الشاشة عشان نوفر في الأداء
                    if (rect.top <= window.innerHeight && rect.bottom >= 0) {
                        const scrollDistance = (window.innerHeight - rect.top) * 0.15; // سرعة الـ Parallax (15%)
                        parallaxBg.style.transform = `translateY(${scrollDistance}px)`;
                    }
                }, { passive: true });
            }
        }
    });

// Floating Hero Img
const heroProfileImg = document.querySelector('.hero-profile-img');
if (heroProfileImg && !mobilePerformanceMode()) {
    document.addEventListener('mousemove', (e) => {
        const rect = heroProfileImg.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        heroProfileImg.style.transform = `translate(${(e.clientX - centerX) * 0.03}px, ${(e.clientY - centerY) * 0.03}px)`;
    });
    document.addEventListener('mouseleave', () => heroProfileImg.style.transform = 'translate(0, 0)');
}

// Image Scroll Rotation
if (!mobilePerformanceMode()) {
    window.addEventListener('scroll', () => {
        document.querySelectorAll('.about-img img, .hero-profile-img').forEach(img => {
            const rect = img.getBoundingClientRect();
            const scrollPercent = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
            if (scrollPercent > 0 && scrollPercent < 1) {
                img.style.transform = `rotateZ(${(scrollPercent - 0.5) * 3}deg) scale(${0.98 + scrollPercent * 0.05})`;
            }
        });
    }, { passive: true });
}

// Skill Tags Stagger
document.addEventListener('DOMContentLoaded', () => {
    const skillObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                setTimeout(() => entry.target.classList.add('skill-visible'), (parseInt(entry.target.getAttribute('data-delay')) || 0) * 80);
            }
        });
    }, { threshold: 0.3, rootMargin: "0px 0px -100px 0px" });
    document.querySelectorAll('.skill-tag').forEach(tag => skillObserver.observe(tag));
});

// ================= Project Details Database & Dynamic Loader =================
const projectsData = {
    'xero': {
        title: "Xero Office\nE-Commerce",
        type: "Commerce Platform",
        tags: ['<i class="fab fa-laravel"></i> Laravel', 'TailwindCSS', '<i class="fas fa-database"></i> MySQL'],
        description: "A comprehensive, high-performance e-commerce platform built from scratch. It features a modern storefront for customers and an advanced data-driven control panel for administrators, ensuring a seamless shopping experience and efficient store management.",
        meta: {
            "Role": "Full-Stack Development",
            "Product": "E-Commerce Platform",
            "Year": "2026",
            "Focus": "Commerce & Analytics"
        },
        story: [
            {
                title: "The challenge",
                text: "Bring the storefront, checkout, inventory, order operations, and business insights into one product without making either the customer or admin experience feel complicated."
            },
            {
                title: "The approach",
                text: "I built a Laravel and MySQL foundation, then designed the customer journey and admin workflows as one connected system with secure authentication, automated email, and live analytics."
            },
            {
                title: "The outcome",
                text: "A complete commerce workflow that moves from product discovery to fulfilment, while giving administrators a clear view of sales, stock, customers, and orders."
            }
        ],
        features: [
            "<strong>Google OAuth 2.0 Integration:</strong> Quick and secure user authentication and registration via Google accounts.",
            "<strong>Automated SMTP Emails:</strong> Custom HTML/CSS email notifications sent automatically upon order placement, shipping, and delivery.",
            "<strong>Real-time Analytics Engine:</strong> Dynamic dashboard charts (Chart.js) with time-based filters (Daily, Monthly, Yearly) for sales tracking.",
            "<strong>Smart Inventory System:</strong> Live tracking of product stock with automated low-stock alert notifications in the admin header.",
            "<strong>End-to-End Checkout:</strong> Seamless cart management and order processing workflow with status tracking.",
            "<strong>Interactive Reviews:</strong> Custom-built 5-star rating system allowing users to review purchased products.",
            "<strong>Native Dark/Light Mode:</strong> Full system integration for seamless theme toggling without page refreshes.",
            "<strong>Data Export:</strong> One-click Excel spreadsheet export for all customer orders."
        ],
        images: [
    'images/x3.png',  // 1. (صورة ديسكتوب) هتاخد العرض كله عشان دي أول صورة
    'images/x12.jpg', // 2. (صورة موبايل) هتاخد نص العرض
    'images/x13.jpg', // 3. (صورة موبايل) هتاخد نص العرض اللي جنبها
    'images/x1.png',  // 4. (صورة ديسكتوب) هتاخد العرض كله عشان دي الصورة الرابعة
    'images/x2.png',  // 5. نص العرض
    'images/x4.png',  // 6. نص العرض
    'images/x5.png',  // 7. نص العرض
    'images/x7.png',  // 8. هتاخد العرض كله (4n)
    'images/x6.png',
    'images/x8.png',
    'images/x9.png',
    'images/x14.png',
    'images/x10.png',
    'images/x11.png'
],
        galleryLabels: [
            "Storefront overview", "Mobile shopping", "Mobile product view", "Product discovery",
            "Commerce interface", "Catalogue experience", "Product details", "Admin overview",
            "Analytics dashboard", "Order management", "Inventory workflow", "Customer insights",
            "Responsive checkout", "System overview"
        ],
        github: "https://github.com/omararafa295-cmd/xero-office-ecommerce",
        demo: "#"
    },
    'pacman': {
        title: "Search in Pacman",
        type: "AI Search Project",
        tags: ['<i class="fab fa-python"></i> Python', '<i class="fas fa-brain"></i> AI', 'Algorithms'],
        description: "Implemented classic Artificial Intelligence search algorithms to navigate Pacman through complex mazes, optimizing paths to collect all dots efficiently.",
        meta: {
            "Role": "Algorithm Engineering",
            "Product": "AI Search Project",
            "Context": "Academic Project",
            "Focus": "Pathfinding & Heuristics"
        },
        story: [
            {
                title: "The challenge",
                text: "Find reliable paths through maze environments while comparing how different search strategies trade speed, memory, and solution quality."
            },
            {
                title: "The approach",
                text: "I implemented uninformed and informed search algorithms in Python, then designed custom heuristics to improve how Pacman evaluates complex routes."
            },
            {
                title: "The outcome",
                text: "A practical comparison of DFS, BFS, and A* that demonstrates algorithm behaviour visually and produces efficient solutions across multiple maze layouts."
            }
        ],
        features: [
            "<strong>Depth-First Search:</strong> Implemented DFS exploration with stack-based traversal for maze navigation.",
            "<strong>Breadth-First Search:</strong> Added BFS to find shortest unweighted paths through the search space.",
            "<strong>A* with custom heuristics:</strong> Combined path cost and informed estimates to guide efficient search.",
            "<strong>Optimised pathfinding:</strong> Compared strategies across dynamic maze layouts and multi-goal scenarios."
        ],
        images: ['images/pacman3.png','images/pacman2.png','images/pacman1.png'], 
        galleryLabels: ["Search environment", "Algorithm in motion", "Solved maze"],
        github: "https://github.com/omararafa295-cmd/Pacman-Search-AI",
        demo: null 
    },
    'simple-blog': {
        title: "Simple Blog",
        type: "Publishing Platform",
        tags: ['<i class="fab fa-laravel"></i> Laravel', 'MySQL', 'Bootstrap'],
        description: "A simple blog application built with Laravel, featuring a clean and modern design. It allows users to read, create, and manage blog posts efficiently.",
        meta: {
            "Role": "Full-Stack Development",
            "Product": "Publishing Platform",
            "Context": "Training Project",
            "Focus": "Laravel CRUD & Auth"
        },
        story: [
            {
                title: "The challenge",
                text: "Turn a basic content idea into a structured publishing workflow where visitors can read freely and authorised users can manage posts safely."
            },
            {
                title: "The approach",
                text: "I used Laravel conventions for routing, authentication, validation, relationships, and CRUD operations, then built a responsive Bootstrap interface around them."
            },
            {
                title: "The outcome",
                text: "A focused full-stack application with a clear separation between the public reading experience and the secure content-management workflow."
            }
        ],
        features: [
            "<strong>Authentication & authorisation:</strong> Protected publishing actions and user-specific access rules.",
            "<strong>Complete post workflow:</strong> Create, read, update, and delete posts through a clean interface.",
            "<strong>Responsive Bootstrap UI:</strong> Consistent reading and editing experience across screen sizes.",
            "<strong>Relational data model:</strong> Structured users and posts with Laravel and MySQL relationships."
        ],
        images: ['images/blog1.png', 'images/blog4.png', 'images/blog3.png', 'images/blog2.png'], 
        galleryLabels: ["Posts overview", "User dashboard", "Article view", "Create & edit"],
        github: "https://github.com/omararafa295-cmd/laravel-blog",
        demo: null
    },
    'iqraa': {
        title: "Iqraa Islamic PWA",
        type: "Progressive Web App",
        tags: ['<i class="fab fa-react"></i> React 19', 'Tailwind CSS', 'PWA', 'REST APIs'],
        description: "A bilingual, mobile-first Islamic Progressive Web App that brings Quran reading and audio, smart search, prayer times, Qibla, adhkar, hadith, radio, Hijri calendar, bookmarks, and offline access into one polished experience.",
        meta: {
            "Role": "Product & Frontend",
            "Product": "Islamic Progressive Web App",
            "Year": "2026",
            "Focus": "Accessible Daily Worship"
        },
        story: [
            {
                title: "The challenge",
                text: "Daily Islamic services are often fragmented across separate apps. The goal was to make Quran, audio, prayer, Qibla, adhkar, and discovery feel like one calm experience."
            },
            {
                title: "The approach",
                text: "I designed a bilingual React PWA around mobile reading, clear navigation, persistent preferences, API-driven content, and reliable offline access."
            },
            {
                title: "The outcome",
                text: "One installable product that supports daily worship and learning across devices, with accessible themes, Arabic and English layouts, and a unified content experience."
            }
        ],
        features: [
            "<strong>Bilingual by design:</strong> Arabic and English interfaces with automatic RTL and LTR layout support.",
            "<strong>Deep Quran experience:</strong> Reading, smart Arabic search, bookmarks, last-reading persistence, and multiple tafsir sources.",
            "<strong>Rich audio library:</strong> 14 reciters, a floating player, offline downloads, and resumable progress.",
            "<strong>Daily worship toolkit:</strong> Prayer times, location-aware Qibla, adhkar, hadith, Quran radio, and Hijri calendar.",
            "<strong>Reliable PWA:</strong> Service Worker caching, offline Quran data, installation, and persistent settings.",
            "<strong>Accessible interface:</strong> Mobile-first glassmorphism UI with carefully designed light and dark themes."
        ],
        images: [
            'images/iqraa-hero.webp',
            'images/iqraa-02.webp',
            'images/iqraa-03.webp',
            'images/iqraa-04.webp',
            'images/iqraa-05.webp',
            'images/iqraa-06.webp',
            'images/iqraa-07.webp',
            'images/iqraa-08.webp',
            'images/iqraa-09.webp',
            'images/iqraa-10.webp',
            'images/iqraa-01.webp'
        ],
        galleryLabels: [
            "Experience overview", "Home experience", "Quran reading", "Tafsir & bookmarks",
            "Ayah card", "Audio & recitation", "Search & calendar", "Prayer & Qibla",
            "Quran radio", "Hadith & Azkar", "Brand cover"
        ],
        github: "https://github.com/omararafa295-cmd/iqraa-quran-app",
        demo: "https://iqraa-app.vercel.app/"
    },
   
};

document.addEventListener("DOMContentLoaded", () => {
    if (!window.location.pathname.includes('project.html')) return;

    const projectId = new URLSearchParams(window.location.search).get('id');
    const project = projectsData[projectId];

    if (!project) {
        window.location.href = 'projects.html';
        return;
    }

    const projectKeys = Object.keys(projectsData);
    const projectIndex = projectKeys.indexOf(projectId);
    const images = project.images || [];
    const labels = images.map((_, index) => project.galleryLabels?.[index] || `Product screen ${String(index + 1).padStart(2, '0')}`);
    const cleanTitle = project.title.replace(/\n/g, ' ');
    const padNumber = number => String(number).padStart(2, '0');

    document.title = `${cleanTitle} | Omar Arafa`;
    document.getElementById('case-project-index').textContent = padNumber(projectIndex + 1);
    document.getElementById('page-title').innerText = project.title;
    document.getElementById('page-desc').innerText = project.description;
    document.getElementById('page-tags').innerHTML = project.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
    document.getElementById('case-media-label').textContent = `${projectId.replace(/-/g, '_')} / CASE STUDY`;
    document.getElementById('case-media-type').textContent = project.type || 'DIGITAL PRODUCT';

    const links = [];
    if (project.demo && project.demo !== '#') {
        links.push(`<a href="${project.demo}" target="_blank" rel="noreferrer" class="case-action primary"><i class="fas fa-arrow-up-right-from-square"></i> Live Product</a>`);
    }
    if (project.github) {
        links.push(`<a href="${project.github}" target="_blank" rel="noreferrer" class="case-action secondary"><i class="fab fa-github"></i> View Code</a>`);
    }
    document.getElementById('page-links').innerHTML = links.join('');

    document.getElementById('page-meta').innerHTML = Object.entries(project.meta || {}).map(([label, value]) => `
        <div>
            <dt>${label}</dt>
            <dd>${value}</dd>
        </div>
    `).join('');

    document.getElementById('page-story').innerHTML = (project.story || []).map((item, index) => `
        <article class="case-story-card hidden-slide-up" data-number="${padNumber(index + 1)}">
            <span>${padNumber(index + 1)}</span>
            <h3>${item.title}</h3>
            <p>${item.text}</p>
        </article>
    `).join('');

    document.getElementById('page-features').innerHTML = project.features.map((feature, index) => `
        <article class="case-feature-item hidden-slide-up">
            <span class="case-feature-number">${padNumber(index + 1)}</span>
            <div class="case-feature-copy">${feature}</div>
            <span class="case-feature-icon"><i class="fas fa-arrow-right"></i></span>
        </article>
    `).join('');

    const heroImage = document.getElementById('case-hero-image');
    const galleryImage = document.getElementById('case-gallery-image');
    const galleryMain = document.getElementById('case-gallery-open');
    const galleryCaption = document.getElementById('case-gallery-caption');
    const galleryCounter = document.getElementById('case-gallery-counter');
    const galleryLabel = document.getElementById('case-gallery-label');
    const galleryThumbs = document.getElementById('case-gallery-thumbs');
    const totalText = padNumber(images.length);
    let activeImage = 0;
    let switchTimer;

    document.getElementById('case-gallery-total').textContent = totalText;
    heroImage.src = images[0] || '';
    heroImage.alt = `${cleanTitle} product overview`;

    galleryThumbs.innerHTML = images.map((src, index) => `
        <button class="case-gallery-thumb${index === 0 ? ' is-active' : ''}" type="button" data-gallery-index="${index}" aria-label="View ${labels[index]}">
            <img src="${src}" alt="${cleanTitle} — ${labels[index]}" loading="lazy" decoding="async">
            <span>${padNumber(index + 1)}</span>
        </button>
    `).join('');

    const updateGallery = (nextIndex, immediate = false) => {
        if (!images.length) return;
        activeImage = (nextIndex + images.length) % images.length;
        const commit = () => {
            galleryImage.src = images[activeImage];
            galleryImage.alt = `${cleanTitle} — ${labels[activeImage]}`;
            galleryCaption.textContent = labels[activeImage];
            galleryCounter.textContent = `${padNumber(activeImage + 1)} / ${totalText}`;
            galleryLabel.textContent = `PROJECT VIEW / ${padNumber(activeImage + 1)}`;
            galleryThumbs.querySelectorAll('.case-gallery-thumb').forEach((button, index) => {
                button.classList.toggle('is-active', index === activeImage);
                button.setAttribute('aria-current', index === activeImage ? 'true' : 'false');
            });
            galleryMain.classList.remove('is-switching');
        };

        clearTimeout(switchTimer);
        if (immediate || reducedMotionMode()) {
            commit();
        } else {
            galleryMain.classList.add('is-switching');
            switchTimer = setTimeout(commit, 130);
        }
    };

    updateGallery(0, true);
    galleryThumbs.addEventListener('click', event => {
        const button = event.target.closest('[data-gallery-index]');
        if (button) updateGallery(Number(button.dataset.galleryIndex));
    });
    document.getElementById('case-gallery-prev').addEventListener('click', () => updateGallery(activeImage - 1));
    document.getElementById('case-gallery-next').addEventListener('click', () => updateGallery(activeImage + 1));

    if (images.length > 1 && window.matchMedia('(min-width: 981px)').matches) {
        const thumbObserver = new IntersectionObserver(entries => {
            const activeEntry = entries.find(entry => entry.isIntersecting);
            if (activeEntry) updateGallery(Number(activeEntry.target.dataset.galleryIndex));
        }, { rootMargin: '-42% 0px -42% 0px', threshold: 0 });
        galleryThumbs.querySelectorAll('.case-gallery-thumb').forEach(button => thumbObserver.observe(button));
    }

    const lightbox = document.createElement('div');
    lightbox.className = 'case-lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', `${cleanTitle} gallery`);
    lightbox.innerHTML = `
        <div class="case-lightbox-bar">
            <span>${cleanTitle}</span>
            <button class="case-lightbox-close" type="button" aria-label="Close gallery"><i class="fas fa-xmark"></i></button>
        </div>
        <div class="case-lightbox-stage">
            <button class="case-lightbox-nav case-lightbox-prev" type="button" aria-label="Previous image"><i class="fas fa-arrow-left"></i></button>
            <img src="" alt="">
            <button class="case-lightbox-nav case-lightbox-next" type="button" aria-label="Next image"><i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="case-lightbox-footer">
            <span class="case-lightbox-caption"></span>
            <span class="case-lightbox-counter"></span>
        </div>
    `;
    document.body.appendChild(lightbox);

    const lightboxImage = lightbox.querySelector('img');
    const lightboxCaption = lightbox.querySelector('.case-lightbox-caption');
    const lightboxCounter = lightbox.querySelector('.case-lightbox-counter');
    let lightboxIndex = 0;
    let touchStartX = 0;
    let lightboxHistoryActive = false;

    const updateLightbox = index => {
        if (!images.length) return;
        lightboxIndex = (index + images.length) % images.length;
        lightboxImage.src = images[lightboxIndex];
        lightboxImage.alt = `${cleanTitle} — ${labels[lightboxIndex]}`;
        lightboxCaption.textContent = labels[lightboxIndex];
        lightboxCounter.textContent = `${padNumber(lightboxIndex + 1)} / ${totalText}`;
    };
    const openLightbox = index => {
        updateLightbox(index);
        if (!lightbox.classList.contains('is-open')) {
            history.pushState({ ...(history.state || {}), caseLightbox: true }, '', window.location.href);
            lightboxHistoryActive = true;
        }
        lightbox.classList.add('is-open');
        document.body.style.overflow = 'hidden';
        if (lenis) lenis.stop();
        lightbox.querySelector('.case-lightbox-close').focus();
    };
    const closeLightbox = (fromHistory = false) => {
        if (!lightbox.classList.contains('is-open')) return;
        lightbox.classList.remove('is-open');
        document.body.style.overflow = '';
        if (lenis) lenis.start();
        if (lightboxHistoryActive && !fromHistory) {
            lightboxHistoryActive = false;
            history.back();
        } else {
            lightboxHistoryActive = false;
        }
    };

    document.getElementById('case-hero-open').addEventListener('click', () => openLightbox(0));
    galleryMain.addEventListener('click', () => openLightbox(activeImage));
    lightbox.querySelector('.case-lightbox-close').addEventListener('click', () => closeLightbox());
    lightbox.querySelector('.case-lightbox-prev').addEventListener('click', () => updateLightbox(lightboxIndex - 1));
    lightbox.querySelector('.case-lightbox-next').addEventListener('click', () => updateLightbox(lightboxIndex + 1));
    lightbox.addEventListener('click', event => { if (event.target === lightbox) closeLightbox(); });
    lightbox.addEventListener('touchstart', event => { touchStartX = event.changedTouches[0].clientX; }, { passive: true });
    lightbox.addEventListener('touchend', event => {
        const distance = event.changedTouches[0].clientX - touchStartX;
        if (Math.abs(distance) > 45) updateLightbox(lightboxIndex + (distance < 0 ? 1 : -1));
    }, { passive: true });
    document.addEventListener('keydown', event => {
        if (!lightbox.classList.contains('is-open')) return;
        if (event.key === 'Escape') closeLightbox();
        if (event.key === 'ArrowLeft') updateLightbox(lightboxIndex - 1);
        if (event.key === 'ArrowRight') updateLightbox(lightboxIndex + 1);
    });
    window.addEventListener('popstate', () => {
        if (lightbox.classList.contains('is-open')) closeLightbox(true);
    });

    const nextProjectKey = projectKeys[(projectIndex + 1) % projectKeys.length];
    const nextProject = projectsData[nextProjectKey];
    const nextProjectLink = document.createElement('a');
    nextProjectLink.href = `project.html?id=${nextProjectKey}`;
    nextProjectLink.className = 'case-next-project hidden-fade';
    nextProjectLink.innerHTML = `
        <div class="case-next-copy">
            <p>Next case study / ${padNumber(((projectIndex + 1) % projectKeys.length) + 1)}</p>
            <h2>${nextProject.title.replace(/\n/g, '<br>')}</h2>
            <span>Explore project <i class="fas fa-arrow-right"></i></span>
        </div>
        <div class="case-next-visual">
            <img src="${nextProject.images[0]}" alt="${nextProject.title.replace(/\n/g, ' ')} preview" loading="lazy" decoding="async">
        </div>
    `;
    const footer = document.querySelector('.premium-footer');
    footer?.parentNode.insertBefore(nextProjectLink, footer);

    images.slice(1, 4).forEach(src => {
        const preloadImage = new Image();
        preloadImage.src = src;
    });

    requestAnimationFrame(() => {
        document.querySelectorAll('.case-study-page .hidden-fade, .case-study-page .hidden-slide-left, .case-study-page .hidden-slide-right, .case-study-page .hidden-slide-up, .case-next-project').forEach((element, index) => {
            setTimeout(() => element.classList.add('show'), Math.min(index * 35, 280));
        });
    });
});

/* ✨ ANIMATION ADDED: premium interaction layer */
document.addEventListener('DOMContentLoaded', () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const nav = document.getElementById('navbar');
    const navLinks = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
    const sections = Array.from(document.querySelectorAll('section[id]'));

    if (sections.length) {
        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-section-visible');
                }
            });
        }, { threshold: 0.42, rootMargin: '-12% 0px -45% 0px' });

        sections.forEach(section => sectionObserver.observe(section));
    }

    if (sections.length && navLinks.length) {
        const updateActiveSection = () => {
            const navHeight = nav ? nav.offsetHeight : 0;
            const probeY = window.scrollY + navHeight + window.innerHeight * 0.34;
            let activeId = sections[0].id;

            sections.forEach(section => {
                if (section.offsetTop <= probeY) {
                    activeId = section.id;
                }
            });

            const nearBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8;
            if (nearBottom) {
                activeId = sections[sections.length - 1].id;
            }

            navLinks.forEach(link => {
                link.classList.toggle('is-active', link.getAttribute('href') === `#${activeId}`);
            });
        };

        updateActiveSection();
        if (!mobilePerformanceMode()) {
            window.addEventListener('scroll', updateActiveSection, { passive: true });
        }
        window.addEventListener('resize', updateActiveSection);
    }

    const projectImageTargets = Array.from(document.querySelectorAll('.project-hero-visual, .project-gallery-grid img'));
    if (projectImageTargets.length) {
        const imageRevealObserver = new IntersectionObserver((entries, observerInstance) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;

                entry.target.classList.add('image-in-view');
                observerInstance.unobserve(entry.target);
            });
        }, { threshold: 0.22, rootMargin: '0px 0px -10% 0px' });

        projectImageTargets.forEach((target, index) => {
            target.style.transitionDelay = `${Math.min(index * 90, 360)}ms`;
            imageRevealObserver.observe(target);
        });
    }

    document.querySelectorAll('.btn, .modal-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            if (reduceMotion) return;

            const rect = button.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            ripple.style.width = `${size}px`;
            ripple.style.height = `${size}px`;
            ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
            ripple.style.top = `${event.clientY - rect.top - size / 2}px`;

            button.querySelector('.ripple')?.remove();
            button.appendChild(ripple);
            ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
        });
    });

    const counterTargets = Array.from(document.querySelectorAll('[data-count], .stat-number, .counter'));
    if (!reduceMotion && counterTargets.length) {
        const countObserver = new IntersectionObserver((entries, observerInstance) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;

                const target = entry.target;
                const rawValue = target.dataset.count || target.textContent;
                const finalValue = parseFloat(rawValue.replace(/[^\d.]/g, ''));
                if (Number.isNaN(finalValue)) return;

                const suffix = rawValue.replace(/[\d.,\s]/g, '');
                const start = performance.now();
                const duration = 1200;

                const animateCount = (now) => {
                    const progress = Math.min((now - start) / duration, 1);
                    const eased = 1 - Math.pow(1 - progress, 3);
                    target.textContent = `${Math.round(finalValue * eased)}${suffix}`;

                    if (progress < 1) {
                        requestAnimationFrame(animateCount);
                    }
                };

                requestAnimationFrame(animateCount);
                observerInstance.unobserve(target);
            });
        }, { threshold: 0.6 });

        counterTargets.forEach(target => countObserver.observe(target));
    }

    if (!reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        const dot = document.createElement('span');
        const ring = document.createElement('span');
        dot.className = 'cursor-dot';
        ring.className = 'cursor-ring';
        document.body.append(dot, ring);

        let mouseX = window.innerWidth / 2;
        let mouseY = window.innerHeight / 2;
        let ringX = mouseX;
        let ringY = mouseY;

        const moveCursor = () => {
            ringX += (mouseX - ringX) * 0.18;
            ringY += (mouseY - ringY) * 0.18;
            dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
            ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
            requestAnimationFrame(moveCursor);
        };

        window.addEventListener('pointermove', (event) => {
            mouseX = event.clientX;
            mouseY = event.clientY;
            document.body.classList.add('cursor-ready');
        }, { passive: true });

        document.querySelectorAll('a, button, .project-card, .contact-method-card, input, textarea').forEach(target => {
            target.addEventListener('pointerenter', () => document.body.classList.add('cursor-grow'));
            target.addEventListener('pointerleave', () => document.body.classList.remove('cursor-grow'));
        });

        moveCursor();
    }
    
    // ================= Reading Progress Bar =================
    const readingProgress = document.getElementById('reading-progress');
    if (readingProgress) {
        let readingProgressTicking = false;
        window.addEventListener('scroll', () => {
            if (!readingProgressTicking) {
                readingProgressTicking = true;
                requestAnimationFrame(() => {
                    const scrollTop = window.scrollY;
                    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
                    // حساب النسبة المئوية للسكرول
                    const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
                    readingProgress.style.width = `${scrollPercent}%`;
                    readingProgressTicking = false;
                });
            }
        }, { passive: true });
    }

    // ================= Magnetic Buttons Effect =================
    if (!reduceMotion && window.matchMedia('(hover: hover)').matches) {
        // تحديد الزراير اللي عايزينها تبقى مغناطيسية
        const magneticElements = document.querySelectorAll('.btn-nav, .social-icons a, .footer-socials a, .btn-outline, .back-btn');
        magneticElements.forEach(elem => {
            elem.addEventListener('mousemove', (e) => {
                const rect = elem.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                elem.style.transform = `translate(${x * 0.35}px, ${y * 0.35}px)`; // قوة الجذب
                elem.style.transition = 'none'; // إلغاء الترانزيشن أثناء الجذب عشان يبقى لحظي
            });
            elem.addEventListener('mouseleave', () => {
                elem.style.transform = '';
                elem.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'; // رجوع مرن (سوستة)
            });
        });
    }

    // ================= 3D Tilt Effect for Project Cards =================
    const projectCards = document.querySelectorAll('.project-card');
    if (!reduceMotion && projectCards.length) {
        projectCards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                // حساب زاوية الميل (أقصى ميل 10 درجات عشان يبقى ناعم وشيك)
                const rotateX = ((y - centerY) / centerY) * -10;
                const rotateY = ((x - centerX) / centerX) * 10;
                
                // دمج الحركة 3D مع تأثير الـ Hover الأصلي (translateY -8px)
                card.style.transform = `perspective(1000px) translateY(-8px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
                card.style.transition = 'none'; // بنلغي الترانزيشن عشان الحركة تبقى تفاعلية ولحظية مع الماوس
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = ''; // بنرجع الكارت لوضعه الطبيعي للـ CSS
                // بنرجع الترانزيشن عشان رجوع الكارت يكون ناعم
                card.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.5s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.4s';
            });
            
            card.addEventListener('mouseenter', () => {
                card.style.transition = 'transform 0.1s ease'; // دخول سريع لتأثير الـ 3D
            });
        });
    }

    // ================= Custom Circuit Data Flow Background =================
    const canvas = document.getElementById('hero-particles');
    if (canvas && !reduceMotion && !mobilePerformanceMode()) {
        const ctx = canvas.getContext('2d');
        
        let packets = [];
        const gridSize = 50; // حجم الشبكة الهندسية اللي بتمشي عليها البيانات
        
        function setCanvasSize() {
            canvas.width = canvas.parentElement.offsetWidth;
            canvas.height = canvas.parentElement.offsetHeight;
            initPackets();
        }
        
        window.addEventListener('resize', () => {
            setCanvasSize();
        });
        
        // تحويل لون الموقع لـ RGB عشان نقدر نستخدمه بشفافية في تأثيرات الخلفية
        let canvasAccentRgb = '255, 77, 109'; 
        function updateCanvasColor() {
            const hex = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
            if(hex) {
                let cleanHex = hex.replace('#', '');
                if(cleanHex.length === 3) cleanHex = cleanHex.split('').map(c => c+c).join('');
                const bigint = parseInt(cleanHex, 16);
                canvasAccentRgb = `${(bigint >> 16) & 255}, ${(bigint >> 8) & 255}, ${bigint & 255}`;
            }
        }
        updateCanvasColor();
        window.addEventListener('themeChanged', () => setTimeout(updateCanvasColor, 50));

        class DataPacket {
            constructor() {
                this.reset();
                // توزيع عشوائي في الشاشة كبداية
                this.x = Math.floor(Math.random() * canvas.width / gridSize) * gridSize;
                this.y = Math.floor(Math.random() * canvas.height / gridSize) * gridSize;
            }
            
            reset() {
                this.axis = Math.random() > 0.5 ? 'x' : 'y'; // الحركة إما أفقية أو رأسية
                this.dir = Math.random() > 0.5 ? 1 : -1;
                this.speed = Math.random() * 1.5 + 0.5; // سرعة هادية ومريحة
                this.length = Math.random() * 80 + 30; // طول ذيل الإشارة
                this.opacity = Math.random() * 0.35 + 0.1; // شفافية منخفضة جداً عشان ميزعجش الكلام
                
                if (this.axis === 'x') {
                    this.x = this.dir === 1 ? -this.length : canvas.width + this.length;
                    this.y = Math.floor(Math.random() * canvas.height / gridSize) * gridSize;
                } else {
                    this.x = Math.floor(Math.random() * canvas.width / gridSize) * gridSize;
                    this.y = this.dir === 1 ? -this.length : canvas.height + this.length;
                }
            }
            
            update() {
                this[this.axis] += this.speed * this.dir;
                
                // لما تخرج بره الشاشة ترجع تاني
                if ((this.axis === 'x' && (this.dir === 1 ? this.x > canvas.width + this.length : this.x < -this.length)) ||
                    (this.axis === 'y' && (this.dir === 1 ? this.y > canvas.height + this.length : this.y < -this.length))) {
                    this.reset();
                }
            }
            
            draw(isLight) {
                const colorHead = `rgba(${canvasAccentRgb}, ${this.opacity})`;
                const colorTail = `rgba(${canvasAccentRgb}, 0)`;
                
                ctx.beginPath();
                let tailX = this.axis === 'x' ? this.x - this.length * this.dir : this.x;
                let tailY = this.axis === 'y' ? this.y - this.length * this.dir : this.y;
                
                ctx.moveTo(tailX, tailY);
                ctx.lineTo(this.x, this.y);
                
                const grad = ctx.createLinearGradient(tailX, tailY, this.x, this.y);
                grad.addColorStop(0, colorTail);
                grad.addColorStop(1, colorHead);
                
                ctx.strokeStyle = grad;
                ctx.lineWidth = 1.5;
                ctx.stroke();
                
                // النقطة المضيئة في المقدمة (رأس البيانات)
                ctx.beginPath();
                ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
                ctx.fillStyle = colorHead;
                ctx.fill();
            }
        }
        
        function initPackets() {
            packets = [];
            // عدد قليل جداً ومدروس بناءً على مساحة الشاشة عشان تظل فاضية وهادية
            const numPackets = Math.floor((canvas.width * canvas.height) / 20000); 
            for (let i = 0; i < Math.max(numPackets, 15); i++) {
                packets.push(new DataPacket());
            }
        }
        
        setCanvasSize();
        
        function animateFlow() {
            ctx.clearRect(0, 0, canvas.width, canvas.height); // تنظيف الشاشة كاملة لعدم ترك أي أثر مزعج
            const isLight = document.documentElement.getAttribute('data-theme') === 'light';
            
            // رسم نقاط خلفية خفيفة جداً لعمل شكل شبكة (Grid)
            ctx.fillStyle = isLight ? 'rgba(17, 24, 39, 0.04)' : 'rgba(255, 255, 255, 0.03)';
            for(let x = 0; x < canvas.width; x += gridSize) {
                for(let y = 0; y < canvas.height; y += gridSize) {
                    ctx.fillRect(x - 0.5, y - 0.5, 1, 1);
                }
            }
            
            packets.forEach(p => {
                p.update();
                p.draw(isLight);
            });
            
            requestAnimationFrame(animateFlow);
        }
        
        animateFlow();
    }
});

// ================= Theme Color Customizer =================
document.addEventListener('DOMContentLoaded', () => {
    const customizer = document.getElementById('theme-customizer');
    const toggleBtn = document.getElementById('customizer-toggle');
    const colorBtns = document.querySelectorAll('.color-btn');
    const htmlTag = document.documentElement;

    if (customizer && toggleBtn) {
        toggleBtn.addEventListener('click', () => customizer.classList.toggle('active'));

        const savedColor = localStorage.getItem('site-color') || 'blue';
        
        // إزالة التحديد الافتراضي من كل الألوان لمنع ظهور لونين مع بعض
        colorBtns.forEach(b => b.classList.remove('active'));

        colorBtns.forEach(btn => {
            if (btn.getAttribute('data-color') === savedColor) btn.classList.add('active');

            btn.addEventListener('click', () => {
                const color = btn.getAttribute('data-color');
                htmlTag.setAttribute('data-color', color);
                localStorage.setItem('site-color', color);
                
                colorBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                window.dispatchEvent(new Event('themeChanged')); // تنبيه لتحديث ألوان الكانفاس
            });
        });
        
        document.addEventListener('click', (e) => {
            if (!customizer.contains(e.target)) customizer.classList.remove('active');
        });
    }
});


// ================= Cinematic scroll chapters =================
(function () {
    const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
    const smoothstep = (start, end, value) => {
        const x = clamp((value - start) / (end - start));
        return x * x * (3 - (2 * x));
    };
    const sceneProgress = (section, rect, stickyElement) => {
        // The sticky element is the real viewport for the scene. Using its height keeps
        // progress stable when mobile browser chrome expands or collapses while scrolling.
        const stickyHeight = stickyElement ? stickyElement.offsetHeight : (document.documentElement.clientHeight || window.innerHeight);
        const travel = Math.max(1, section.offsetHeight - stickyHeight);
        return clamp(-rect.top / travel);
    };

    const initCinematicChapters = () => {
        const laptopScene = document.querySelector('.laptop-scroll-scene');
        const laptopSticky = laptopScene && laptopScene.querySelector('.laptop-sticky');
        const laptopCamera = laptopScene && laptopScene.querySelector('.laptop-camera');
        const laptopLid = laptopScene && laptopScene.querySelector('.laptop-lid');
        const laptopScreen = laptopScene && laptopScene.querySelector('.laptop-screen');
        const laptopContent = laptopScene && laptopScene.querySelector('.laptop-screen-content');
        const laptopCopy = laptopScene && laptopScene.querySelector('.laptop-chapter-copy');
        const laptopBlackout = laptopScene && laptopScene.querySelector('.laptop-blackout');

        const contactScene = document.querySelector('.contact-cinematic');
        const contactSticky = contactScene && contactScene.querySelector('.contact-cinematic-sticky');
        const phone = contactScene && contactScene.querySelector('.vintage-phone-camera');
        const contactForm = contactScene && contactScene.querySelector('.contact-form-cinematic');

        if (!laptopScene && !contactScene) return;

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        const mobileView = window.matchMedia('(max-width: 900px)');
        let gsapMobileLaptop = false;
        let ticking = false;

        // Keep the mobile chapter tied directly to native scroll. ScrollTrigger owns
        // only the animation progress; the browser keeps its normal touch momentum.
        if (laptopScene && laptopSticky && laptopCamera && laptopLid && laptopScreen
            && typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);
            const laptopMedia = gsap.matchMedia();

            laptopMedia.add('(max-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
                gsapMobileLaptop = true;
                ScrollTrigger.config({ ignoreMobileResize: true, limitCallbacks: true });

                const screenFocus = () => {
                    let offsetY = 0;
                    let node = laptopScreen;
                    while (node && node !== laptopCamera) {
                        offsetY += node.offsetTop || 0;
                        node = node.offsetParent;
                    }

                    const stickyHeight = Math.max(1, laptopSticky.offsetHeight);
                    const stickyWidth = Math.max(1, laptopSticky.offsetWidth);
                    const screenHeight = Math.max(1, laptopScreen.offsetHeight);
                    const screenWidth = Math.max(1, laptopScreen.offsetWidth);
                    const screenCenterY = offsetY + (screenHeight / 2);

                    return {
                        y: (laptopCamera.offsetHeight / 2) - screenCenterY,
                        scale: clamp(Math.max(stickyWidth / screenWidth, stickyHeight / screenHeight) * 1.025, 3.7, 5.15)
                    };
                };

                gsap.set(laptopCamera, {
                    y: () => laptopSticky.offsetHeight * 0.16,
                    scale: 0.62,
                    transformOrigin: '50% 43%',
                    force3D: true
                });
                gsap.set(laptopLid, { rotationX: 86, force3D: true });
                gsap.set(laptopScreen, { opacity: 0.18 });
                if (laptopContent) gsap.set(laptopContent, { opacity: 0.18 });
                if (laptopCopy) gsap.set(laptopCopy, { opacity: 1, y: 0 });
                if (laptopBlackout) gsap.set(laptopBlackout, { opacity: 0 });

                const timeline = gsap.timeline({
                    defaults: { ease: 'none' },
                    scrollTrigger: {
                        trigger: laptopScene,
                        start: 'top top',
                        end: 'bottom bottom',
                        scrub: true,
                        invalidateOnRefresh: true,
                        fastScrollEnd: false
                    }
                });

                timeline
                    .to(laptopCamera, { y: 0, scale: 1, duration: 0.30, ease: 'power2.inOut' }, 0.05)
                    .to(laptopLid, { rotationX: 0, duration: 0.30, ease: 'power2.inOut' }, 0.05)
                    .to(laptopScreen, { opacity: 1, duration: 0.25 }, 0.08);

                if (laptopCopy) timeline.to(laptopCopy, { opacity: 0, y: -28, duration: 0.17 }, 0.17);
                if (laptopContent) timeline.to(laptopContent, { opacity: 1, duration: 0.14 }, 0.27);

                timeline.to(laptopCamera, {
                    y: () => screenFocus().y,
                    scale: () => screenFocus().scale,
                    duration: 0.31,
                    ease: 'power1.inOut'
                }, 0.60);

                // Keep the screen rendered until the blackout covers it. Fading both at
                // once caused the long empty purple frame seen in the phone recording.
                if (laptopBlackout) timeline.to(laptopBlackout, { opacity: 1, duration: 0.07, ease: 'power2.in' }, 0.92);
                timeline.to({}, { duration: 0.01 }, 0.99);

                requestAnimationFrame(() => ScrollTrigger.refresh());

                return () => {
                    gsapMobileLaptop = false;
                };
            });
        }

        const updateLaptop = (rect) => {
            if (!laptopScene || !laptopCamera || reduceMotion.matches || gsapMobileLaptop) return;
            const p = sceneProgress(laptopScene, rect, laptopSticky);
            const mobile = window.innerWidth <= 768;
            const open = smoothstep(mobile ? 0.06 : 0.04, mobile ? 0.36 : 0.34, p);
            const story = smoothstep(mobile ? 0.27 : 0.25, mobile ? 0.41 : 0.43, p)
                * (1 - smoothstep(mobile ? 0.82 : 0.70, mobile ? 0.92 : 0.82, p));
            const approach = smoothstep(mobile ? 0.54 : 0.50, mobile ? 0.91 : 0.88, p);
            const blackout = smoothstep(mobile ? 0.91 : 0.79, mobile ? 0.988 : 0.94, p);
            const startScale = 0.58;
            const openScale = 0.42;
            const desktopFinalScale = 2.35;
            const stickyHeight = laptopSticky ? laptopSticky.offsetHeight : (document.documentElement.clientHeight || window.innerHeight);
            const screenHeight = Math.max(1, laptopScreen.offsetHeight);
            // A portrait viewport needs more scale than desktop before the 16:9 screen
            // fully covers it. This makes the zoom land inside the screen on every phone.
            const mobileFinalScale = clamp((stickyHeight / screenHeight) * 1.08, 3.8, 5.4);
            const finalScale = mobile ? mobileFinalScale : desktopFinalScale;
            const zoomScale = finalScale - (startScale + openScale);
            const y = ((1 - open) * (mobile ? 20 : 23)) - (approach * (mobile ? 2 : 4));
            const scale = startScale + (open * openScale) + (approach * zoomScale);
            const viewportHeight = document.documentElement.clientHeight || window.innerHeight;
            const yPixels = y * viewportHeight / 100;

            laptopCamera.style.transform = 'translate3d(0,' + yPixels + 'px,0) scale(' + scale + ')';
            laptopLid.style.transform = 'rotateX(' + (86 * (1 - open)) + 'deg)';
            laptopScreen.style.opacity = String((0.16 + (0.84 * open)) * (1 - blackout));
            if (laptopContent) laptopContent.style.opacity = String(0.18 + (0.82 * story));
            if (laptopCopy) {
                laptopCopy.style.opacity = String((1 - smoothstep(mobile ? 0.17 : 0.16, 0.34, p)) * (1 - blackout));
                laptopCopy.style.transform = 'translate3d(0,' + (-28 * smoothstep(0.12, 0.34, p)) + 'px,0)';
            }
            if (laptopBlackout) laptopBlackout.style.opacity = String(blackout);
        };

        const updateContact = (rect) => {
            if (!contactScene || !phone || !contactForm || reduceMotion.matches) return;
            if (mobileView.matches) {
                phone.style.removeProperty('opacity');
                phone.style.removeProperty('transform');
                contactForm.style.removeProperty('opacity');
                contactForm.style.removeProperty('transform');
                return;
            }
            const p = sceneProgress(contactScene, rect, contactSticky);
            const phoneIn = smoothstep(0.02, 0.25, p);
            const formIn = smoothstep(0.29, 0.56, p);
            const phoneX = -8 * smoothstep(0.34, 0.68, p);
            const phoneY = (1 - phoneIn) * 16;
            const phoneScale = 0.68 + (0.34 * phoneIn) - (0.08 * smoothstep(0.62, 0.9, p));

            phone.style.opacity = String(phoneIn);
            phone.style.transform = 'translate3d(' + phoneX + 'vw,' + phoneY + 'vh,0) rotate(' + (-8 + (6 * phoneIn)) + 'deg) scale(' + phoneScale + ')';
            contactForm.style.opacity = String(formIn);
            contactForm.style.transform = 'translate3d(' + ((1 - formIn) * 130) + 'px,0,0)';
        };

        const update = () => {
            ticking = false;
            const viewportHeight = document.documentElement.clientHeight || window.innerHeight;
            if (laptopScene) {
                const laptopRect = laptopScene.getBoundingClientRect();
                if (laptopRect.bottom >= -viewportHeight && laptopRect.top <= viewportHeight * 2) {
                    updateLaptop(laptopRect);
                }
            }
            if (contactScene) {
                const contactRect = contactScene.getBoundingClientRect();
                if (contactRect.bottom >= -viewportHeight && contactRect.top <= viewportHeight * 2) {
                    updateContact(contactRect);
                }
            }
        };
        const requestUpdate = () => {
            if (!ticking) {
                ticking = true;
                window.requestAnimationFrame(update);
            }
        };

        window.addEventListener('scroll', requestUpdate, { passive: true });
        window.addEventListener('resize', requestUpdate, { passive: true });
        reduceMotion.addEventListener && reduceMotion.addEventListener('change', requestUpdate);
        mobileView.addEventListener && mobileView.addEventListener('change', requestUpdate);
        requestUpdate();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCinematicChapters, { once: true });
    } else {
        initCinematicChapters();
    }
})();

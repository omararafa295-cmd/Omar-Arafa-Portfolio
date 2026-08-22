(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const body = document.body;
  const header = document.getElementById('site-header');
  const progressBar = document.querySelector('.scroll-progress span');
  const aura = document.querySelector('.cursor-aura');

  const finishLoader = () => {
    body.classList.remove('is-loading');
    body.classList.add('loaded');
  };

  const loader = document.getElementById('loader');
  if (loader && !reducedMotion) {
    const count = document.getElementById('loader-count');
    const line = loader.querySelector('.loader-line span');
    const start = performance.now();
    const duration = 1350;

    const tick = (now) => {
      const value = Math.min(100, Math.round(((now - start) / duration) * 100));
      if (count) count.textContent = String(value).padStart(2, '0');
      if (line) line.style.width = `${value}%`;
      if (value < 100) requestAnimationFrame(tick);
      else window.setTimeout(finishLoader, 160);
    };

    requestAnimationFrame(tick);
  } else {
    finishLoader();
  }

  const updateScrollUI = () => {
    const y = window.scrollY;
    if (header) header.classList.toggle('scrolled', y > 24);
    if (progressBar) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.width = `${max > 0 ? (y / max) * 100 : 0}%`;
    }
  };

  updateScrollUI();
  window.addEventListener('scroll', updateScrollUI, { passive: true });

  if (aura && window.matchMedia('(hover: hover)').matches) {
    window.addEventListener('pointermove', (event) => {
      aura.style.opacity = '1';
      aura.style.transform = `translate(${event.clientX - 140}px, ${event.clientY - 140}px)`;
    }, { passive: true });
  }

  const menuToggle = document.querySelector('.menu-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  const closeMenu = () => {
    body.classList.remove('menu-open');
    if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
    if (mobileMenu) mobileMenu.setAttribute('aria-hidden', 'true');
  };

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      const open = body.classList.toggle('menu-open');
      menuToggle.setAttribute('aria-expanded', String(open));
      mobileMenu.setAttribute('aria-hidden', String(!open));
    });
    mobileMenu.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  }

  const revealElements = document.querySelectorAll('[data-reveal]');
  if (reducedMotion || !('IntersectionObserver' in window)) {
    revealElements.forEach((element) => element.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.13, rootMargin: '0px 0px -45px' });
    revealElements.forEach((element) => revealObserver.observe(element));
  }

  const navLinks = [...document.querySelectorAll('.desktop-nav a[href^="#"]')];
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
        });
      });
    }, { rootMargin: '-35% 0px -55%', threshold: 0 });
    sections.forEach((section) => sectionObserver.observe(section));
  }

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const selector = link.getAttribute('href');
      if (!selector || selector === '#') return;
      const target = document.querySelector(selector);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    });
  });

  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  const nextInput = document.querySelector('input[name="_next"]');
  if (nextInput) {
    nextInput.value = new URL('thanks.html', window.location.href).href;
  }

  const projects = {
    xero: {
      type: 'E-COMMERCE / FULL-STACK',
      title: 'XERO OFFICE\nE-COMMERCE',
      description: 'A comprehensive commerce platform for printers and toners, built around a modern customer storefront and an operations-focused administration system.',
      tags: ['Laravel', 'Tailwind CSS', 'MySQL', 'Chart.js'],
      github: 'https://github.com/omararafa295-cmd/xero-office-ecommerce',
      features: [
        'Secure account flows with Google OAuth 2.0 integration.',
        'Automated HTML email updates for order placement, shipping, and delivery.',
        'Interactive sales analytics with daily, monthly, and yearly filters.',
        'Smart inventory monitoring with low-stock alerts for administrators.',
        'Complete cart, checkout, order processing, and status-tracking workflow.',
        'Product reviews, dark mode, and one-click order export to Excel.'
      ],
      images: ['images/x3.png', 'images/x12.jpg', 'images/x13.jpg', 'images/x1.png', 'images/x2.png', 'images/x4.png', 'images/x5.png', 'images/x7.png', 'images/x6.png', 'images/x8.png', 'images/x9.png', 'images/x14.png', 'images/x10.png', 'images/x11.png'],
      next: 'pacman'
    },
    pacman: {
      type: 'AI / ALGORITHMS',
      title: 'PACMAN\nSEARCH AI',
      description: 'Classic artificial-intelligence search strategies implemented to guide Pacman through complex mazes while finding efficient paths and collecting targets.',
      tags: ['Python', 'Artificial Intelligence', 'Algorithms', 'A*'],
      github: 'https://github.com/omararafa295-cmd/Pacman-Search-AI',
      features: [
        'Depth-First Search implementation for graph exploration.',
        'Breadth-First Search for shortest-path discovery in unweighted mazes.',
        'A* search with custom heuristics for efficient navigation.',
        'Reusable search logic tested across multiple maze layouts.'
      ],
      images: ['images/pacman3.png', 'images/pacman2.png', 'images/pacman1.png'],
      next: 'simple-blog'
    },
    'simple-blog': {
      type: 'WEB APP / CMS',
      title: 'LARAVEL\nBLOG',
      description: 'A clean publishing application that lets users read, create, edit, and manage posts with secure authentication and ownership-based permissions.',
      tags: ['Laravel', 'PHP', 'MySQL', 'Bootstrap'],
      github: 'https://github.com/omararafa295-cmd/laravel-blog',
      features: [
        'Custom registration and session-based authentication.',
        'Complete create, read, update, and delete workflow for posts.',
        'Ownership authorization so only authors can edit or remove their content.',
        'Public post discovery with a responsive Bootstrap interface.'
      ],
      images: ['images/blog1.png', 'images/blog4.png', 'images/blog3.png', 'images/blog2.png'],
      next: 'xero'
    }
  };

  const detailRoot = document.getElementById('project-page');
  if (detailRoot) {
    const key = new URLSearchParams(window.location.search).get('id') || 'xero';
    const project = projects[key] || projects.xero;
    const nextProject = projects[project.next];
    const setText = (id, value) => {
      const element = document.getElementById(id);
      if (element) element.textContent = value;
    };

    document.title = `${project.title.replace(/\n/g, ' ')} — Omar Arafa`;
    setText('project-type', project.type);
    setText('project-title', project.title);
    setText('project-description', project.description);
    setText('next-project-title', nextProject.title.replace(/\n/g, ' '));

    const heroImage = document.getElementById('project-hero-image');
    if (heroImage) {
      heroImage.src = project.images[0];
      heroImage.alt = `${project.title.replace(/\n/g, ' ')} interface`;
    }

    const tags = document.getElementById('project-tags');
    if (tags) tags.innerHTML = project.tags.map((tag) => `<span>${tag}</span>`).join('');

    const features = document.getElementById('project-features');
    if (features) {
      features.innerHTML = project.features
        .map((feature, index) => `<div class="feature-row"><i>${String(index + 1).padStart(2, '0')}</i><span>${feature}</span></div>`)
        .join('');
    }

    const githubLink = document.getElementById('project-github');
    if (githubLink) githubLink.href = project.github;

    const gallery = document.getElementById('project-gallery');
    if (gallery) {
      gallery.innerHTML = project.images
        .map((src, index) => `<button class="gallery-item" type="button" data-image="${src}" aria-label="Open screenshot ${index + 1}"><img src="${src}" alt="${project.title.replace(/\n/g, ' ')} screenshot ${index + 1}" loading="lazy"></button>`)
        .join('');
    }

    const nextLink = document.getElementById('next-project');
    if (nextLink) nextLink.href = `project.html?id=${project.next}`;

    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.setAttribute('aria-hidden', 'true');
    lightbox.innerHTML = '<button type="button" aria-label="Close image">×</button><img src="" alt="Expanded project screenshot">';
    body.appendChild(lightbox);

    const closeLightbox = () => {
      lightbox.classList.remove('open');
      lightbox.setAttribute('aria-hidden', 'true');
      body.style.overflow = '';
    };

    gallery?.addEventListener('click', (event) => {
      const item = event.target.closest('.gallery-item');
      if (!item) return;
      lightbox.querySelector('img').src = item.dataset.image;
      lightbox.classList.add('open');
      lightbox.setAttribute('aria-hidden', 'false');
      body.style.overflow = 'hidden';
    });
    lightbox.querySelector('button').addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (event) => {
      if (event.target === lightbox) closeLightbox();
    });
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeLightbox();
    });
  }
})();

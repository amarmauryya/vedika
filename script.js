/* ============================================
   KNOW YOUR BHAWISYA — JavaScript
   ============================================ */

// ====== STARS CANVAS ======
(function initStars() {
    const canvas = document.getElementById('starsCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let stars = [];
    const STAR_COUNT = 200;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function createStars() {
        stars = [];
        for (let i = 0; i < STAR_COUNT; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 1.5 + 0.3,
                alpha: Math.random() * 0.8 + 0.2,
                alphaSpeed: Math.random() * 0.01 + 0.003,
                alphaDir: Math.random() > 0.5 ? 1 : -1,
            });
        }
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        stars.forEach(star => {
            star.alpha += star.alphaSpeed * star.alphaDir;
            if (star.alpha >= 1) { star.alpha = 1; star.alphaDir = -1; }
            if (star.alpha <= 0.1) { star.alpha = 0.1; star.alphaDir = 1; }

            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(212, 168, 67, ${star.alpha})`;
            ctx.fill();
        });
        requestAnimationFrame(draw);
    }

    resize();
    createStars();
    draw();

    window.addEventListener('resize', () => {
        resize();
        createStars();
    });
})();

// ====== NAVBAR SCROLL EFFECT ======
(function initNavbar() {
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 60) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile toggle
    navToggle.addEventListener('click', () => {
        navLinks.classList.toggle('open');
        navToggle.classList.toggle('active');
    });

    // Close on link click
    navLinks.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('open');
            navToggle.classList.remove('active');
        });
    });

    // Active link on scroll
    const sections = document.querySelectorAll('section[id]');
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY + 200;
        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');
            const link = document.querySelector(`.nav-link[href="#${id}"]`);
            if (link) {
                if (scrollY >= top && scrollY < top + height) {
                    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                }
            }
        });
    });
})();

// ====== FAQ ACCORDION ======
(function initFAQ() {
    const items = document.querySelectorAll('.faq-item');
    items.forEach(item => {
        const btn = item.querySelector('.faq-question');
        btn.addEventListener('click', () => {
            const isOpen = item.classList.contains('active');
            // Close all
            items.forEach(i => i.classList.remove('active'));
            // Toggle current
            if (!isOpen) {
                item.classList.add('active');
            }
        });
    });
})();

// ====== SCROLL REVEAL ======
(function initReveal() {
    const revealElements = document.querySelectorAll(
        '.service-card, .about-grid, .reading-form, .testimonial-card, .faq-item, .cta-content, .section-header'
    );

    revealElements.forEach(el => el.classList.add('reveal'));

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => observer.observe(el));
})();

// ====== SMOOTH SCROLL for all anchor links ======
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// ====== FORM SUBMISSION ======
(function initForm() {
    const form = document.getElementById('readingForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const submitBtn = document.getElementById('submitBtn');
        const originalText = submitBtn.innerHTML;

        // Show loading
        submitBtn.innerHTML = '<span>Processing...</span>';
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.7';

        // Simulate processing
        setTimeout(() => {
            // Collect form data
            const formData = {
                name: document.getElementById('fullName').value,
                email: document.getElementById('email').value,
                dob: document.getElementById('dob').value,
                birthPlace: document.getElementById('birthPlace').value,
                birthTime: document.getElementById('birthTime').value,
                phone: document.getElementById('phone').value,
                plan: document.querySelector('input[name="plan"]:checked').value,
                question: document.getElementById('question').value,
            };

            console.log('Reading Request:', formData);

            // Success state
            submitBtn.innerHTML = '<span>✓ Request Submitted Successfully!</span>';
            submitBtn.style.background = 'linear-gradient(135deg, #2d8a4e, #34a853)';

            // Show alert
            alert(`Thank you, ${formData.name}! 🙏\n\nYour reading request has been received.\nYou will receive your detailed PDF report at ${formData.email} within 24-48 hours.\n\nPlan: ${formData.plan}\nAmount: ₹499`);

            // Reset after 3 seconds
            setTimeout(() => {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
                submitBtn.style.background = '';
                form.reset();
            }, 3000);
        }, 1500);
    });
})();

// ====== PARALLAX on Hero (subtle) ======
(function initParallax() {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        if (scrollY < window.innerHeight) {
            hero.style.backgroundPositionY = `${scrollY * 0.3}px`;
        }
    });
})();

// ====== Tilt Effect on Service Cards (Desktop Only) ======
(function initTilt() {
    if (window.innerWidth < 768) return;

    const cards = document.querySelectorAll('[data-tilt]');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 15;
            const rotateY = (centerX - x) / 15;
            card.style.transform = `translateY(-8px) perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });
})();

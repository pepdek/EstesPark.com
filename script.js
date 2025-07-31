document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    const navLinksArray = Array.from(navLinks);
    navLinksArray.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = targetSection.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    const heroButtons = document.querySelectorAll('.cta-primary, .cta-secondary');
    heroButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (this.textContent.includes('Perfect Stay')) {
                const lodgingSection = document.querySelector('#lodging');
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = lodgingSection.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            } else if (this.textContent.includes('Explore Attractions')) {
                const attractionsSection = document.querySelector('#attractions');
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = attractionsSection.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    window.addEventListener('scroll', function() {
        const header = document.querySelector('.header');
        if (window.scrollY > 100) {
            header.style.background = 'rgba(255, 255, 255, 0.98)';
            header.style.boxShadow = '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)';
        } else {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.boxShadow = '0 1px 2px 0 rgb(0 0 0 / 0.05)';
        }
    });

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '-80px 0px -20% 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const targetId = `#${entry.target.id}`;
                navLinksArray.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === targetId) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, observerOptions);

    const sections = document.querySelectorAll('section[id]');
    sections.forEach(section => {
        observer.observe(section);
    });

    const animateOnScroll = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    });

    const animatedElements = document.querySelectorAll('.feature-card, .attraction-card, .lodging-card, .dining-card, .season-activities, .timeline-item');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        animateOnScroll.observe(el);
    });

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = target.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
});
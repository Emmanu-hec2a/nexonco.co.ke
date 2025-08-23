// Smooth scrolling for navigation links
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

        // Navbar background on scroll
        window.addEventListener('scroll', () => {
            const nav = document.querySelector('.nav');
            if (window.scrollY > 100) {
                nav.style.background = 'rgba(255, 255, 255, 0.98)';
                nav.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
            } else {
                nav.style.background = 'rgba(255, 255, 255, 0.95)';
                nav.style.boxShadow = 'none';
            }
        });

        // Animate stats on scroll
        const observerOptions = {
            threshold: 0.5,
            rootMargin: '0px 0px -100px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const statsItems = entry.target.querySelectorAll('.stat-item h3');
                    statsItems.forEach((stat, index) => {
                        setTimeout(() => {
                            stat.style.animation = 'countUp 2s ease-out forwards';
                        }, index * 200);
                    });
                }
            });
        }, observerOptions);

        const statsSection = document.querySelector('.stats-section');
        if (statsSection) {
            observer.observe(statsSection);
        }

        // Form submission
        document.querySelector('form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Show success message
            const form = this;
            const originalHTML = form.innerHTML;
            
            form.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <i class="fas fa-check-circle" style="font-size: 3rem; color: #2ecc71; margin-bottom: 20px;"></i>
                    <h3 style="color: #2ecc71; margin-bottom: 15px;">Message Sent Successfully!</h3>
                    <p>Thank you for your interest in NEXONCO. Our team will contact you within 24 hours to discuss how our CARePath technology can transform your healthcare operations.</p>
                    <button type="button" class="btn btn-primary" onclick="location.reload()" style="margin-top: 20px;">
                        Send Another Message
                    </button>
                </div>
            `;
        });

        // Add CSS for count-up animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes countUp {
                from { 
                    transform: translateY(20px); 
                    opacity: 0; 
                }
                to { 
                    transform: translateY(0); 
                    opacity: 1; 
                }
            }
        `;
        document.head.appendChild(style);

        // Wait for DOM to be fully loaded
        document.addEventListener('DOMContentLoaded', function() {
            // Try multiple ways to find the elements
            let mobileMenuBtn = document.getElementById('mobileMenuBtn') || 
                               document.querySelector('.mobile-menu-btn');
            let navLinks = document.getElementById('navLinks') || 
                          document.querySelector('.nav-links');

            // If still not found, create the mobile menu button
            if (!mobileMenuBtn) {
                const navContainer = document.querySelector('.nav-container');
                if (navContainer) {
                    mobileMenuBtn = document.createElement('button');
                    mobileMenuBtn.className = 'mobile-menu-btn';
                    mobileMenuBtn.setAttribute('aria-label', 'Toggle mobile menu');
                    mobileMenuBtn.innerHTML = `
                        <span class="hamburger-line"></span>
                        <span class="hamburger-line"></span>
                        <span class="hamburger-line"></span>
                    `;
                    navContainer.appendChild(mobileMenuBtn);
                }
            }

            // Check if navLinks exists
            if (!navLinks) {
                navLinks = document.querySelector('.nav-links');
            }

            // Final check
            if (!mobileMenuBtn || !navLinks) {
                console.error('Could not initialize mobile menu');
                return;
            }

            // Toggle mobile menu
            mobileMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                mobileMenuBtn.classList.toggle('active');
                navLinks.classList.toggle('active');
            });

            // Close mobile menu when clicking on a link
            const navLinkItems = navLinks.querySelectorAll('a');
            navLinkItems.forEach(link => {
                link.addEventListener('click', () => {
                    mobileMenuBtn.classList.remove('active');
                    navLinks.classList.remove('active');
                });
            });

            // Close mobile menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!mobileMenuBtn.contains(e.target) && !navLinks.contains(e.target)) {
                    mobileMenuBtn.classList.remove('active');
                    navLinks.classList.remove('active');
                }
            });

            // Handle window resize
            window.addEventListener('resize', () => {
                if (window.innerWidth > 768) {
                    mobileMenuBtn.classList.remove('active');
                    navLinks.classList.remove('active');
                }
            });

            console.log('Mobile menu initialized successfully');
        });

        // Console welcome message
        console.log(`
            🚀 Welcome to NEXONCO
            🏥 Connecting Care, Saving Lives
            🧠 Powered by CARePath AI Technology
            
            Interested in our revolutionary healthcare AI?
            Contact us: hello@nexonco.com
            
            • Transforming Healthcare Through Intelligence
        `);
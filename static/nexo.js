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
        // document.querySelector('form').addEventListener('submit', function(e) {
        //     e.preventDefault();
            
        //     Show success message
        //     const form = this;
        //     const originalHTML = form.innerHTML;
            
        //     form.innerHTML = `
        //         <div style="text-align: center; padding: 40px;">
        //             <i class="fas fa-check-circle" style="font-size: 3rem; color: #2ecc71; margin-bottom: 20px;"></i>
        //             <h3 style="color: #2ecc71; margin-bottom: 15px;">Message Sent Successfully!</h3>
        //             <p>Thank you for your interest in NEXONCO. Our team will contact you within 24 hours to discuss how our CARePath technology can transform your healthcare operations.</p>
        //             <button type="button" class="btn btn-primary" onclick="location.reload()" style="margin-top: 20px;">
        //                 Send Another Message
        //             </button>
        //         </div>
        //     `;
        // });

        class ContactForm {
            constructor() {
                this.form = document.getElementById('contactForm');
                this.submitBtn = document.getElementById('submitBtn');
                this.btnText = document.getElementById('btnText');
                this.successMessage = document.getElementById('successMessage');
                this.errorMessage = document.getElementById('errorMessage');
                this.charCount = document.getElementById('charCount');
                
                this.init();
            }
            
            init() {
                this.form.addEventListener('submit', this.handleSubmit.bind(this));
                this.setupRealTimeValidation();
                this.setupCharacterCounter();
                this.setupPhoneFormatting();
            }
            
            setupRealTimeValidation() {
                const inputs = this.form.querySelectorAll('input, select, textarea');
                inputs.forEach(input => {
                    input.addEventListener('blur', () => this.validateField(input));
                    input.addEventListener('input', () => this.clearFieldError(input));
                });
            }
            
            setupCharacterCounter() {
                const messageField = document.getElementById('message');
                messageField.addEventListener('input', () => {
                    const count = messageField.value.length;
                    this.charCount.textContent = count;
                    
                    if (count > 450) {
                        this.charCount.style.color = '#ff6b6b';
                    } else {
                        this.charCount.style.color = 'rgba(255, 255, 255, 0.7)';
                    }
                });
            }
            
            setupPhoneFormatting() {
                const phoneField = document.getElementById('phone');
                phoneField.addEventListener('input', (e) => {
                    let value = e.target.value.replace(/\D/g, '');
                    
                    if (value.length >= 6) {
                        value = value.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
                    } else if (value.length >= 3) {
                        value = value.replace(/(\d{3})(\d{3})/, '($1) $2');
                    } else if (value.length > 0) {
                        value = value.replace(/(\d{3})/, '($1)');
                    }
                    
                    e.target.value = value;
                });
            }
            
            validateField(field) {
                const value = field.value.trim();
                const fieldName = field.id; // Use ID instead of name
                let isValid = true;
                let errorMessage = '';
                
                // Clear previous errors
                this.clearFieldError(field);
                
                // Required field validation
                if (field.hasAttribute('required') && !value) {
                    errorMessage = 'This field is required.';
                    isValid = false;
                }
                
                // Specific field validations
                if (value && fieldName === 'fullName') {
                    if (value.length < 2) {
                        errorMessage = 'Name must be at least 2 characters long.';
                        isValid = false;
                    } else if (!/^[a-zA-Z\s'-]+$/.test(value)) {
                        errorMessage = 'Please enter a valid name.';
                        isValid = false;
                    }
                }
                
                if (value && fieldName === 'email') {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(value)) {
                        errorMessage = 'Please enter a valid email address.';
                        isValid = false;
                    }
                }
                
                if (value && fieldName === 'phone') {
                    const phoneRegex = /^\(\d{3}\)\s\d{3}-\d{4}$/;
                    if (!phoneRegex.test(value)) {
                        errorMessage = 'Please enter a valid phone number: (123) 456-7890';
                        isValid = false;
                    }
                }
                
                if (value && fieldName === 'organization') {
                    if (value.length < 2) {
                        errorMessage = 'Organization name must be at least 2 characters long.';
                        isValid = false;
                    }
                }
                
                // Show error if validation failed
                if (!isValid) {
                    this.showFieldError(field, errorMessage);
                }
                
                return isValid;
            }
            
            showFieldError(field, message) {
                const formGroup = field.closest('.form-group');
                const errorDiv = formGroup.querySelector('.error');
                
                formGroup.classList.add('invalid');
                errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
                errorDiv.style.display = 'flex';
            }
            
            clearFieldError(field) {
                const formGroup = field.closest('.form-group');
                const errorDiv = formGroup.querySelector('.error');
                
                formGroup.classList.remove('invalid');
                errorDiv.style.display = 'none';
                errorDiv.innerHTML = '';
            }
            
            validateForm() {
                const requiredFields = this.form.querySelectorAll('[required]');
                let isValid = true;
                
                requiredFields.forEach(field => {
                    if (!this.validateField(field)) {
                        isValid = false;
                    }
                });
                
                return isValid;
            }
            
            // Collect form data properly
            collectFormData() {
                return {
                    fullName: document.getElementById('fullName').value.trim(),
                    organization: document.getElementById('organization').value.trim(),
                    email: document.getElementById('email').value.trim(),
                    phone: document.getElementById('phone').value.trim(),
                    interest: document.getElementById('interest').value,
                    message: document.getElementById('message').value.trim()
                };
            }
            
            async handleSubmit(e) {
                e.preventDefault();
                
                // Hide previous messages
                this.hideMessages();
                
                // Validate form
                if (!this.validateForm()) {
                    this.showError('Please fix the errors above and try again.');
                    return;
                }
                
                // Show loading state
                this.setLoadingState(true);
                
                try {
                    // Collect form data
                    const formData = this.collectFormData();
                    console.log('Form submission data:', formData);
                    
                    // Submit form data
                    const result = await this.submitFormData(formData);
                    
                    this.showSuccess();
                    this.form.reset();
                    this.charCount.textContent = '0';
                    
                    console.log('Form submitted successfully:', result);
                    
                } catch (error) {
                    console.error('Form submission error:', error);
                    
                    // Show user-friendly error message
                    let errorMessage = 'There was an error sending your message. Please try again.';
                    
                    if (error.message.includes('connect') || error.message.includes('fetch')) {
                        errorMessage = 'Unable to connect to server. Please check your internet connection.';
                    } else if (error.message.includes('400')) {
                        errorMessage = 'Please check your input and try again.';
                    } else if (error.message.includes('429')) {
                        errorMessage = 'Too many requests. Please wait a moment before trying again.';
                    } else if (error.message.includes('500')) {
                        errorMessage = 'Server error. Please try again in a few moments.';
                    }
                    
                    this.showError(errorMessage);
                    
                } finally {
                    this.setLoadingState(false);
                }
            }
            
            async submitFormData(data) {
                try {
                    console.log('Sending data to server:', data);
                    
                    const response = await fetch('/api/contact', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(data)
                    });
                    
                    console.log('Response status:', response.status);
                    console.log('Response ok:', response.ok);
                    
                    // Get response text first to see what we're getting
                    const responseText = await response.text();
                    console.log('Raw response:', responseText);
                    
                    if (!response.ok) {
                        let errorData;
                        try {
                            errorData = JSON.parse(responseText);
                        } catch {
                            errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
                        }
                        
                        console.error('Server error details:', errorData);
                        throw new Error(errorData.error || `Server returned ${response.status}`);
                    }
                    
                    // Parse JSON response
                    const result = JSON.parse(responseText);
                    return result;
                    
                } catch (error) {
                    console.error('Network/API error:', error);
                    
                    if (error.name === 'TypeError' && error.message.includes('fetch')) {
                        throw new Error('Unable to connect to server');
                    }
                    
                    throw error;
                }
            }
            
            setLoadingState(loading) {
                if (loading) {
                    this.submitBtn.disabled = true;
                    this.btnText.textContent = 'Sending...';
                    this.submitBtn.innerHTML = '<div class="loading"></div> Sending...';
                } else {
                    this.submitBtn.disabled = false;
                    this.btnText.textContent = 'Send Message';
                    this.submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
                }
            }
            
            showSuccess() {
                this.successMessage.style.display = 'flex';
                this.successMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                
                // Auto-hide after 10 seconds
                setTimeout(() => {
                    this.successMessage.style.display = 'none';
                }, 10000);
            }
            
            showError(message) {
                this.errorMessage.querySelector('span').textContent = message;
                this.errorMessage.style.display = 'flex';
                this.errorMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                
                // Auto-hide after 8 seconds
                setTimeout(() => {
                    this.errorMessage.style.display = 'none';
                }, 8000);
            }
            
            hideMessages() {
                this.successMessage.style.display = 'none';
                this.errorMessage.style.display = 'none';
            }
        }

        // Initialize the form when DOM is loaded
        document.addEventListener('DOMContentLoaded', () => {
            new ContactForm();
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
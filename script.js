document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.querySelector('.menu-toggle');
    const navigation = document.querySelector('.site-nav');

    if (menuToggle && navigation) {
        const closeNavigation = () => {
            menuToggle.setAttribute('aria-expanded', 'false');
            navigation.classList.remove('is-open');
        };

        menuToggle.addEventListener('click', () => {
            const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
            menuToggle.setAttribute('aria-expanded', String(!isExpanded));
            navigation.classList.toggle('is-open', !isExpanded);
        });

        navigation.addEventListener('click', (event) => {
            if (event.target.closest('a')) {
                closeNavigation();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeNavigation();
            }
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 800) {
                closeNavigation();
            }
        });
    }

    const form = document.querySelector('.contact-form');

    if (form) {
        const status = form.querySelector('.form-status');
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phonePattern = /^[\d\s()+-]{10,}$/;

        form.addEventListener('submit', async (event) => {
            event.preventDefault();

            const data = new FormData(form);
            const name = String(data.get('name') || '').trim();
            const email = String(data.get('email') || '').trim();
            const phone = String(data.get('phone') || '').trim();
            const enquiryType = String(data.get('enquiryType') || '').trim();
            const visitDate = String(data.get('visitDate') || '').trim();
            const message = String(data.get('message') || '').trim();
            const errors = [];

            if (name.length < 2) {
                errors.push('Please enter your full name.');
            }
            if (!emailPattern.test(email)) {
                errors.push('Please enter a valid email address.');
            }
            if (!phonePattern.test(phone)) {
                errors.push('Please enter a valid phone number.');
            }
            if (!enquiryType) {
                errors.push('Please choose an enquiry type.');
            }
            if (message.length < 20) {
                errors.push('Your message must be at least 20 characters long.');
            }
            if (visitDate) {
                const selectedDate = new Date(`${visitDate}T00:00:00`);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                if (selectedDate < today) {
                    errors.push('Preferred visit date cannot be in the past.');
                }
            }

            if (errors.length > 0) {
                status.textContent = errors.join(' ');
                status.className = 'form-status error';
                return;
            }

            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'Sending...';
            status.textContent = 'Sending your enquiry...';
            status.className = 'form-status';

            try {
                const response = await fetch('/api/enquiries', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name,
                        email,
                        phone,
                        enquiryType,
                        visitDate,
                        message
                    })
                });
                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || 'Unable to send your enquiry.');
                }

                form.reset();
                status.textContent = result.message;
                status.className = 'form-status success';
            } catch (error) {
                status.textContent = error.message || 'There was a problem connecting to the server. Please try again.';
                status.className = 'form-status error';
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Send enquiry';
            }
        });
    }

    const filterButtons = document.querySelectorAll('.filter-button');
    const productFeatures = document.querySelectorAll('.product-feature');

    if (filterButtons.length && productFeatures.length) {
        filterButtons.forEach((button) => {
            button.addEventListener('click', () => {
                const filter = button.dataset.filter;

                filterButtons.forEach((item) => item.classList.toggle('is-active', item === button));

                productFeatures.forEach((feature) => {
                    const matches = filter === 'all' || feature.dataset.product === filter;
                    feature.classList.toggle('hidden', !matches);
                });
            });
        });
    }

    const lightbox = document.querySelector('.lightbox');
    const lightboxImage = document.querySelector('.lightbox-image');
    const lightboxCaption = document.querySelector('.lightbox-caption');

    if (lightbox && lightboxImage && lightboxCaption) {
        const galleryItems = document.querySelectorAll('[data-lightbox-image]');

        galleryItems.forEach((item) => {
            item.addEventListener('click', () => {
                lightboxImage.src = item.dataset.lightboxImage;
                lightboxImage.alt = item.alt;
                lightboxCaption.textContent = item.dataset.caption || item.alt;
                lightbox.classList.add('open');
                lightbox.setAttribute('aria-hidden', 'false');
            });
        });

        const closeLightbox = () => {
            lightbox.classList.remove('open');
            lightbox.setAttribute('aria-hidden', 'true');
        };

        lightbox.addEventListener('click', (event) => {
            if (event.target === lightbox || event.target.closest('.lightbox-close')) {
                closeLightbox();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && lightbox.classList.contains('open')) {
                closeLightbox();
            }
        });
    }
});

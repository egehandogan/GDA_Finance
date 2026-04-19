document.addEventListener('DOMContentLoaded', () => {
  // 1. Navbar Glass Effect
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // 2. Intersection Observer for scroll animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Prepare delay if attribute exists
        const delay = entry.target.getAttribute('data-delay');
        if (delay) {
          entry.target.style.transitionDelay = `${delay}ms`;
        }
        
        entry.target.classList.add('visible');
        // Optional: Stop observing once faded in to avoid re-triggering
        // observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const animElements = document.querySelectorAll('.fade-up, .fade-in');
  animElements.forEach(el => observer.observe(el));

  // 3. Pricing Toggle Logic
  const billingSwitch = document.getElementById('billingSwitch');
  const amounts = document.querySelectorAll('.amount');
  const periods = document.querySelectorAll('.period');

  if (billingSwitch) {
    billingSwitch.addEventListener('change', (e) => {
      const isYearly = e.target.checked;

      amounts.forEach(el => {
        const spanValue = isYearly ? el.getAttribute('data-yearly') : el.getAttribute('data-monthly');
        
        // Quick animate numbers
        el.style.opacity = 0;
        setTimeout(() => {
          el.innerText = spanValue;
          el.style.opacity = 1;
        }, 300);
      });

      // Update periods globally (optional: or leave as /aylık and simply refer to yearly cost billed monthly)
      // Usually yearly plans show the "Equivalent monthly price".
      // Let's just keep the label as /aylık but show the discounted rate.
      // E.g. $17/mo -> $13/mo (Billed Annually)
    });
  }

  // Smooth scroll offset for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      if(targetId === '#') return;
      const targetElement = document.querySelector(targetId);
      
      if (targetElement) {
        const navHeight = navbar.offsetHeight;
        const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - navHeight;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });

        // Update active class on nav links
        document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
        this.classList.add('active');
      }
    });
  });

  // Track scroll position to update active navbar link automatically
  const sections = document.querySelectorAll('section');
  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      if (pageYOffset >= (sectionTop - navbar.offsetHeight - 50)) {
        current = section.getAttribute('id');
      }
    });

    document.querySelectorAll('.nav-links a').forEach(li => {
      li.classList.remove('active');
      if (li.getAttribute('href') === `#${current}`) {
        li.classList.add('active');
      }
    });
  });
});

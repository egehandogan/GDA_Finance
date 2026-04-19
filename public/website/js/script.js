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
      }
    });
  }, observerOptions);

  const animElements = document.querySelectorAll('.fade-up, .fade-in');
  animElements.forEach(el => observer.observe(el));

  // 3. Pricing Toggle Logic
  const billingSwitch = document.getElementById('billingSwitch');
  const amounts = document.querySelectorAll('.amount');

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
    });
  }
});

/**
 * script.js
 * Vanilla JS logic for mobile navigation, theme toggling, and form validation
 */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initMobileNavigation();
  initContactForm();
});

/**
 * Initializes the light/dark theme toggle and respects system preference.
 * Updates aria-label on the button to reflect current theme state.
 */
function initTheme() {
  const toggleBtns = document.querySelectorAll('.theme-toggle-btn');
  if (toggleBtns.length === 0) return;

  const currentTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Set initial theme
  const isDark = currentTheme === 'dark' || (!currentTheme && prefersDark);
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  updateThemeToggleLabel(toggleBtns, isDark ? 'dark' : 'light');

  // Handle toggle click
  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = document.documentElement.getAttribute('data-theme');
      const newTheme = theme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      updateThemeToggleLabel(toggleBtns, newTheme);
    });
  });
}

/**
 * Updates the aria-label on all theme toggle buttons to reflect the action they will perform.
 * @param {NodeList} btns
 * @param {string} currentTheme - 'light' or 'dark'
 */
function updateThemeToggleLabel(btns, currentTheme) {
  btns.forEach(btn => {
    btn.setAttribute('aria-label', currentTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    btn.setAttribute('aria-pressed', currentTheme === 'dark' ? 'true' : 'false');
  });
}

/**
 * Initializes the accessible mobile navigation menu.
 */
function initMobileNavigation() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const navMenu = document.getElementById('primary-navigation');

  if (!menuBtn || !navMenu) return;

  menuBtn.addEventListener('click', () => {
    const isExpanded = menuBtn.getAttribute('aria-expanded') === 'true';
    
    // Toggle aria-expanded
    menuBtn.setAttribute('aria-expanded', String(!isExpanded));
    
    // Toggle menu visibility
    if (!isExpanded) {
      navMenu.classList.add('is-open');
    } else {
      navMenu.classList.remove('is-open');
    }
  });

  // Close menu when clicking a nav link (mobile UX)
  navMenu.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      menuBtn.setAttribute('aria-expanded', 'false');
      navMenu.classList.remove('is-open');
    });
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!menuBtn.contains(e.target) && !navMenu.contains(e.target)) {
      if (menuBtn.getAttribute('aria-expanded') === 'true') {
        menuBtn.setAttribute('aria-expanded', 'false');
        navMenu.classList.remove('is-open');
      }
    }
  });

  // Close menu on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') {
      menuBtn.setAttribute('aria-expanded', 'false');
      navMenu.classList.remove('is-open');
      menuBtn.focus();
    }
  });
}

/**
 * Initializes accessible client-side form validation.
 */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    let isValid = true;
    
    // Validate Name
    const nameInput = document.getElementById('name');
    if (!nameInput.value.trim()) {
      showError(nameInput, 'Please enter your name.');
      isValid = false;
    } else {
      clearError(nameInput);
    }
    
    // Validate Email
    const emailInput = document.getElementById('email');
    if (!emailInput.value.trim() || !isValidEmail(emailInput.value)) {
      showError(emailInput, 'Please enter a valid email address.');
      isValid = false;
    } else {
      clearError(emailInput);
    }
    
    // Validate Message
    const messageInput = document.getElementById('message');
    if (!messageInput.value.trim()) {
      showError(messageInput, 'Please enter a message.');
      isValid = false;
    } else {
      clearError(messageInput);
    }

    if (isValid) {
      // Simulate form submission
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Sending...';
      submitBtn.disabled = true;
      
      // Announce to screen readers
      const statusRegion = document.getElementById('form-status');
      if (statusRegion) {
        statusRegion.textContent = 'Sending message...';
      }

      setTimeout(() => {
        form.reset();
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        
        if (statusRegion) {
          statusRegion.textContent = 'Message sent successfully. Thank you!';
          // Clear status after 5s
          setTimeout(() => { statusRegion.textContent = ''; }, 5000);
        }
      }, 1500);
    } else {
      // Focus the first invalid input for accessibility
      const firstInvalid = form.querySelector('[aria-invalid="true"]');
      if (firstInvalid) {
        firstInvalid.focus();
      }
    }
  });
}

/**
 * Shows an accessible error message for a given input.
 * @param {HTMLElement} input 
 * @param {string} message 
 */
function showError(input, message) {
  const errorId = `${input.id}-error`;
  const errorElement = document.getElementById(errorId);
  
  input.setAttribute('aria-invalid', 'true');
  
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }
}

/**
 * Clears the error state for a given input.
 * @param {HTMLElement} input 
 */
function clearError(input) {
  const errorId = `${input.id}-error`;
  const errorElement = document.getElementById(errorId);
  
  input.removeAttribute('aria-invalid');
  
  if (errorElement) {
    errorElement.textContent = '';
    errorElement.style.display = 'none';
  }
}

/**
 * Basic email validation regex.
 * @param {string} email 
 * @returns {boolean}
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

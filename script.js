(function() {
  'use strict';

  if (typeof window.__app === 'undefined') {
    window.__app = {};
  }

  var app = window.__app;

  function debounce(fn, delay) {
    var timer = null;
    return function() {
      var context = this;
      var args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function() {
        fn.apply(context, args);
      }, delay);
    };
  }

  function throttle(fn, limit) {
    var inThrottle;
    return function() {
      var context = this;
      var args = arguments;
      if (!inThrottle) {
        fn.apply(context, args);
        inThrottle = true;
        setTimeout(function() {
          inThrottle = false;
        }, limit);
      }
    };
  }

  function initBurgerMenu() {
    if (app.burgerInitialized) return;
    app.burgerInitialized = true;

    var toggle = document.querySelector('.c-nav__toggle');
    var nav = document.querySelector('.c-nav');
    var menu = document.querySelector('.c-nav__menu');
    var navLinks = document.querySelectorAll('.c-nav__link');

    if (!toggle || !nav || !menu) return;

    function openMenu() {
      nav.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('u-no-scroll');
      menu.style.maxHeight = 'calc(100vh - var(--header-h))';
    }

    function closeMenu() {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('u-no-scroll');
      menu.style.maxHeight = '0';
    }

    toggle.addEventListener('click', function() {
      if (nav.classList.contains('is-open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        closeMenu();
        toggle.focus();
      }
    });

    document.addEventListener('click', function(e) {
      if (!nav.classList.contains('is-open')) return;
      if (!nav.contains(e.target) && e.target !== toggle) {
        closeMenu();
      }
    });

    for (var i = 0; i < navLinks.length; i++) {
      navLinks[i].addEventListener('click', function() {
        if (nav.classList.contains('is-open')) {
          closeMenu();
        }
      });
    }

    var resizeHandler = debounce(function() {
      if (window.innerWidth >= 1024 && nav.classList.contains('is-open')) {
        closeMenu();
      }
    }, 150);

    window.addEventListener('resize', resizeHandler, { passive: true });
  }

  function initSmoothScroll() {
    if (app.smoothScrollInitialized) return;
    app.smoothScrollInitialized = true;

    var isHomePage = location.pathname === '/' || location.pathname === '/index.html' || location.pathname.endsWith('/index.html');

    var links = document.querySelectorAll('a[href^="#"]');
    for (var i = 0; i < links.length; i++) {
      var link = links[i];
      var href = link.getAttribute('href');

      if (href === '#' || href === '#!') continue;

      if (!isHomePage && href.indexOf('/') === -1) {
        link.setAttribute('href', '/' + href);
      }

      link.addEventListener('click', function(e) {
        var targetHref = this.getAttribute('href');
        var hash = '';

        if (targetHref.indexOf('#') !== -1) {
          hash = targetHref.substring(targetHref.indexOf('#'));
        }

        if (!hash || hash === '#' || hash === '#!') return;

        var targetId = hash.substring(1);
        var targetElement = document.getElementById(targetId);

        if (targetElement && (isHomePage || targetHref.indexOf('/') === -1)) {
          e.preventDefault();

          var header = document.querySelector('.l-header');
          var headerHeight = header ? header.offsetHeight : 80;
          var targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;

          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      });
    }
  }

  function initScrollSpy() {
    if (app.scrollSpyInitialized) return;
    app.scrollSpyInitialized = true;

    var navLinks = document.querySelectorAll('.c-nav__link[href^="#"]');
    if (navLinks.length === 0) return;

    var sections = [];
    for (var i = 0; i < navLinks.length; i++) {
      var href = navLinks[i].getAttribute('href');
      if (href && href !== '#' && href !== '#!') {
        var sectionId = href.substring(1);
        var section = document.getElementById(sectionId);
        if (section) {
          sections.push({ link: navLinks[i], section: section });
        }
      }
    }

    if (sections.length === 0) return;

    function updateActiveLink() {
      var scrollPosition = window.pageYOffset + 100;

      for (var i = sections.length - 1; i >= 0; i--) {
        var item = sections[i];
        if (item.section.offsetTop <= scrollPosition) {
          for (var j = 0; j < sections.length; j++) {
            sections[j].link.classList.remove('is-active');
            sections[j].link.removeAttribute('aria-current');
          }
          item.link.classList.add('is-active');
          item.link.setAttribute('aria-current', 'page');
          break;
        }
      }
    }

    var scrollHandler = throttle(updateActiveLink, 100);
    window.addEventListener('scroll', scrollHandler, { passive: true });
    updateActiveLink();
  }

  function initScrollAnimations() {
    if (app.scrollAnimationsInitialized) return;
    app.scrollAnimationsInitialized = true;

    if ('IntersectionObserver' in window) {
      var observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      };

      var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }
        });
      }, observerOptions);

      var animatedElements = document.querySelectorAll('.c-card, .c-feature, .c-stat-card, .c-testimonial, .c-value-card, .c-team-card, .c-service-card, .c-portfolio-card, .c-award-item, .c-support-card');

      for (var i = 0; i < animatedElements.length; i++) {
        var el = animatedElements[i];
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
        observer.observe(el);
      }
    }
  }

  function initCountUp() {
    if (app.countUpInitialized) return;
    app.countUpInitialized = true;

    var statValues = document.querySelectorAll('.c-stat-card__value, .c-countdown__value');

    if (statValues.length === 0) return;

    function animateValue(element, start, end, duration) {
      var range = end - start;
      var current = start;
      var increment = end > start ? 1 : -1;
      var stepTime = Math.abs(Math.floor(duration / range));
      var obj = element;

      var timer = setInterval(function() {
        current += increment;
        obj.textContent = current;
        if (current === end) {
          clearInterval(timer);
        }
      }, stepTime);
    }

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting && !entry.target.dataset.animated) {
            entry.target.dataset.animated = 'true';
            var text = entry.target.textContent.replace(/[^0-9]/g, '');
            var endValue = parseInt(text, 10);
            if (!isNaN(endValue)) {
              entry.target.textContent = '0';
              animateValue(entry.target, 0, endValue, 2000);
            }
          }
        });
      }, { threshold: 0.5 });

      for (var i = 0; i < statValues.length; i++) {
        observer.observe(statValues[i]);
      }
    }
  }

  function initButtonEffects() {
    if (app.buttonEffectsInitialized) return;
    app.buttonEffectsInitialized = true;

    var buttons = document.querySelectorAll('.c-button, .c-btn, .btn, .btn-primary, .btn-outline-primary');

    for (var i = 0; i < buttons.length; i++) {
      var button = buttons[i];

      button.addEventListener('mouseenter', function() {
        this.style.transition = 'all 0.3s ease-out';
        this.style.transform = 'translateY(-2px)';
      });

      button.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
      });

      button.addEventListener('click', function(e) {
        var ripple = document.createElement('span');
        var rect = this.getBoundingClientRect();
        var size = Math.max(rect.width, rect.height);
        var x = e.clientX - rect.left - size / 2;
        var y = e.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.style.position = 'absolute';
        ripple.style.borderRadius = '50%';
        ripple.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
        ripple.style.transform = 'scale(0)';
        ripple.style.animation = 'ripple-effect 0.6s ease-out';
        ripple.style.pointerEvents = 'none';

        this.style.position = 'relative';
        this.style.overflow = 'hidden';
        this.appendChild(ripple);

        setTimeout(function() {
          ripple.remove();
        }, 600);
      });
    }

    var style = document.createElement('style');
    style.textContent = '@keyframes ripple-effect { to { transform: scale(4); opacity: 0; } }';
    document.head.appendChild(style);
  }

  function initCardHoverEffects() {
    if (app.cardHoverInitialized) return;
    app.cardHoverInitialized = true;

    var cards = document.querySelectorAll('.c-card, .card, .c-testimonial, .c-service-card, .c-portfolio-card');

    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];

      card.addEventListener('mouseenter', function() {
        this.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        this.style.transform = 'translateY(-8px) scale(1.02)';
      });

      card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
      });
    }
  }

  function initImageAnimations() {
    if (app.imageAnimationsInitialized) return;
    app.imageAnimationsInitialized = true;

    var images = document.querySelectorAll('img:not(.c-logo__img)');

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'scale(1)';
          }
        });
      }, { threshold: 0.1 });

      for (var i = 0; i < images.length; i++) {
        var img = images[i];
        if (!img.hasAttribute('loading')) {
          img.setAttribute('loading', 'lazy');
        }
        img.style.opacity = '0';
        img.style.transform = 'scale(0.95)';
        img.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
        observer.observe(img);
      }
    }
  }

  function initFormValidation() {
    if (app.formValidationInitialized) return;
    app.formValidationInitialized = true;

    var forms = document.querySelectorAll('form, .c-form');

    var validators = {
      name: {
        pattern: /^[a-zA-ZÀ-ÿs-']{2,50}$/,
        message: 'Bitte geben Sie einen gültigen Namen ein (2-50 Zeichen, nur Buchstaben).'
      },
      firstname: {
        pattern: /^[a-zA-ZÀ-ÿs-']{2,50}$/,
        message: 'Bitte geben Sie einen gültigen Vornamen ein.'
      },
      lastname: {
        pattern: /^[a-zA-ZÀ-ÿs-']{2,50}$/,
        message: 'Bitte geben Sie einen gültigen Nachnamen ein.'
      },
      email: {
        pattern: /^[^s@]+@[^s@]+.[^s@]+$/,
        message: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.'
      },
      phone: {
        pattern: /^[ds+-()]{10,20}$/,
        message: 'Bitte geben Sie eine gültige Telefonnummer ein (10-20 Zeichen).'
      },
      message: {
        minLength: 10,
        message: 'Die Nachricht muss mindestens 10 Zeichen lang sein.'
      }
    };

    function validateField(field) {
      var fieldName = field.name || field.id;
      var fieldValue = field.value.trim();
      var isValid = true;
      var errorMessage = '';

      if (field.hasAttribute('required') && fieldValue === '') {
        isValid = false;
        errorMessage = 'Dieses Feld ist erforderlich.';
      } else if (fieldValue !== '') {
        if (validators[fieldName]) {
          var validator = validators[fieldName];
          if (validator.pattern && !validator.pattern.test(fieldValue)) {
            isValid = false;
            errorMessage = validator.message;
          } else if (validator.minLength && fieldValue.length < validator.minLength) {
            isValid = false;
            errorMessage = validator.message;
          }
        }
      }

      if (field.type === 'checkbox' && field.hasAttribute('required') && !field.checked) {
        isValid = false;
        errorMessage = 'Bitte akzeptieren Sie die Datenschutzbestimmungen.';
      }

      showFieldError(field, isValid, errorMessage);
      return isValid;
    }

    function showFieldError(field, isValid, errorMessage) {
      var errorElement = field.parentElement.querySelector('.c-form__error');

      if (!isValid) {
        field.classList.add('has-error');
        field.classList.add('is-invalid');
        field.setAttribute('aria-invalid', 'true');

        if (!errorElement) {
          errorElement = document.createElement('span');
          errorElement.className = 'c-form__error';
          errorElement.setAttribute('role', 'alert');
          field.parentElement.appendChild(errorElement);
        }
        errorElement.textContent = errorMessage;
      } else {
        field.classList.remove('has-error');
        field.classList.remove('is-invalid');
        field.removeAttribute('aria-invalid');
        if (errorElement) {
          errorElement.remove();
        }
      }
    }

    for (var i = 0; i < forms.length; i++) {
      var form = forms[i];

      var inputs = form.querySelectorAll('input:not([type="submit"]), textarea, select');
      for (var j = 0; j < inputs.length; j++) {
        var input = inputs[j];
        input.addEventListener('blur', function() {
          validateField(this);
        });

        input.addEventListener('input', debounce(function() {
          if (this.classList.contains('has-error')) {
            validateField(this);
          }
        }, 300));
      }

      form.addEventListener('submit', function(e) {
        e.preventDefault();

        var formValid = true;
        var formInputs = this.querySelectorAll('input:not([type="submit"]), textarea, select');

        for (var k = 0; k < formInputs.length; k++) {
          if (!validateField(formInputs[k])) {
            formValid = false;
          }
        }

        if (!formValid) {
          showNotification('Bitte korrigieren Sie die markierten Fehler.', 'error');
          var firstError = this.querySelector('.has-error, .is-invalid');
          if (firstError) {
            firstError.focus();
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          return;
        }

        var submitBtn = this.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.disabled = true;
          var originalText = submitBtn.textContent;
          submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Wird gesendet...';

          var formData = new FormData(this);
          var data = {};
          for (var pair of formData.entries()) {
            data[pair[0]] = pair[1];
          }

          setTimeout(function() {
            if (Math.random() > 0.1) {
              showNotification('Vielen Dank! Ihre Nachricht wurde erfolgreich gesendet.', 'success');
              setTimeout(function() {
                window.location.href = 'thank_you.html';
              }, 1500);
            } else {
              showNotification('Fehler: Keine Verbindung möglich. Bitte versuchen Sie es später erneut.', 'error');
              if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
              }
            }
          }, 1500);
        }
      });
    }
  }

  function showNotification(message, type) {
    var container = document.querySelector('.notification-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'notification-container';
      container.style.cssText = 'position:fixed;top:80px;right:20px;z-index:9999;max-width:400px;';
      document.body.appendChild(container);
    }

    var notification = document.createElement('div');
    notification.className = 'notification notification--' + type;
    notification.setAttribute('role', 'alert');
    notification.style.cssText = 'background:' + (type === 'success' ? '#16a34a' : '#dc2626') + ';color:#fff;padding:1rem 1.5rem;border-radius:8px;margin-bottom:1rem;box-shadow:0 4px 16px rgba(0,0,0,0.2);animation:slideIn 0.3s ease-out;';
    notification.textContent = message;

    container.appendChild(notification);

    setTimeout(function() {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(function() {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }, 5000);

    var style = document.createElement('style');
    style.textContent = '@keyframes slideIn { from { transform: translateX(400px); opacity: 0; } to { transform: translateX(0); opacity: 1; } } @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(400px); opacity: 0; } }';
    if (!document.querySelector('style[data-notification-styles]')) {
      style.setAttribute('data-notification-styles', 'true');
      document.head.appendChild(style);
    }
  }

  function initFilterPortfolio() {
    if (app.filterInitialized) return;
    app.filterInitialized = true;

    var filterButtons = document.querySelectorAll('.c-filter-btn');
    if (filterButtons.length === 0) return;

    var portfolioItems = document.querySelectorAll('.portfolio-item, .c-portfolio-card');

    for (var i = 0; i < filterButtons.length; i++) {
      filterButtons[i].addEventListener('click', function() {
        var filter = this.getAttribute('data-filter');

        for (var j = 0; j < filterButtons.length; j++) {
          filterButtons[j].classList.remove('is-active');
          filterButtons[j].setAttribute('aria-pressed', 'false');
        }

        this.classList.add('is-active');
        this.setAttribute('aria-pressed', 'true');

        for (var k = 0; k < portfolioItems.length; k++) {
          var item = portfolioItems[k];
          item.style.transition = 'opacity 0.4s ease-out, transform 0.4s ease-out';

          if (filter === 'all' || item.classList.contains(filter)) {
            item.style.opacity = '1';
            item.style.transform = 'scale(1)';
            item.style.display = 'block';
          } else {
            item.style.opacity = '0';
            item.style.transform = 'scale(0.9)';
            setTimeout(function(el) {
              return function() {
                el.style.display = 'none';
              };
            }(item), 400);
          }
        }
      });
    }
  }

  function initScrollToTop() {
    if (app.scrollToTopInitialized) return;
    app.scrollToTopInitialized = true;

    var scrollBtn = document.createElement('button');
    scrollBtn.className = 'scroll-to-top';
    scrollBtn.setAttribute('aria-label', 'Nach oben scrollen');
    scrollBtn.innerHTML = '↑';
    scrollBtn.style.cssText = 'position:fixed;bottom:30px;right:30px;width:50px;height:50px;background:var(--color-primary);color:#fff;border:none;border-radius:50%;font-size:24px;cursor:pointer;opacity:0;visibility:hidden;transition:all 0.3s ease;z-index:999;box-shadow:0 4px 12px rgba(0,0,0,0.2);';
    document.body.appendChild(scrollBtn);

    function toggleScrollBtn() {
      if (window.pageYOffset > 300) {
        scrollBtn.style.opacity = '1';
        scrollBtn.style.visibility = 'visible';
      } else {
        scrollBtn.style.opacity = '0';
        scrollBtn.style.visibility = 'hidden';
      }
    }

    scrollBtn.addEventListener('click', function() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });

    scrollBtn.addEventListener('mouseenter', function() {
      this.style.transform = 'scale(1.1)';
    });

    scrollBtn.addEventListener('mouseleave', function() {
      this.style.transform = 'scale(1)';
    });

    window.addEventListener('scroll', throttle(toggleScrollBtn, 100), { passive: true });
  }

  function initModalBackdrop() {
    if (app.modalBackdropInitialized) return;
    app.modalBackdropInitialized = true;

    var modalTriggers = document.querySelectorAll('[data-bs-toggle="modal"]');

    for (var i = 0; i < modalTriggers.length; i++) {
      modalTriggers[i].addEventListener('click', function(e) {
        e.preventDefault();
        var targetId = this.getAttribute('data-bs-target');
        if (targetId) {
          var modal = document.querySelector(targetId);
          if (modal) {
            openModal(modal);
          }
        }
      });
    }

    var closeButtons = document.querySelectorAll('[data-bs-dismiss="modal"]');
    for (var j = 0; j < closeButtons.length; j++) {
      closeButtons[j].addEventListener('click', function() {
        var modal = this.closest('.modal');
        if (modal) {
          closeModal(modal);
        }
      });
    }

    function openModal(modal) {
      var backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop';
      backdrop.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:' + (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--z-modal')) - 1) + ';opacity:0;transition:opacity 0.3s ease;';
      document.body.appendChild(backdrop);

      setTimeout(function() {
        backdrop.style.opacity = '1';
      }, 10);

      modal.style.display = 'block';
      modal.style.opacity = '0';
      setTimeout(function() {
        modal.style.transition = 'opacity 0.3s ease';
        modal.style.opacity = '1';
      }, 10);

      document.body.classList.add('u-no-scroll');

      backdrop.addEventListener('click', function() {
        closeModal(modal);
      });

      modal.setAttribute('data-backdrop-id', backdrop.className);
    }

    function closeModal(modal) {
      var backdrops = document.querySelectorAll('.modal-backdrop');
      var backdrop = backdrops[backdrops.length - 1];

      modal.style.opacity = '0';
      if (backdrop) {
        backdrop.style.opacity = '0';
      }

      setTimeout(function() {
        modal.style.display = 'none';
        if (backdrop) {
          backdrop.remove();
        }
        document.body.classList.remove('u-no-scroll');
      }, 300);
    }
  }

  function initVideoPlayers() {
    if (app.videoPlayersInitialized) return;
    app.videoPlayersInitialized = true;

    var playButtons = document.querySelectorAll('.c-play-btn');

    for (var i = 0; i < playButtons.length; i++) {
      playButtons[i].addEventListener('click', function() {
        var videoCard = this.closest('.c-video-card');
        if (videoCard) {
          var video = videoCard.querySelector('video');
          if (video) {
            if (video.paused) {
              video.play();
              this.style.display = 'none';
            }
          }
        }
      });
    }

    var videos = document.querySelectorAll('video');
    for (var j = 0; j < videos.length; j++) {
      if (!videos[j].hasAttribute('loading')) {
        videos[j].setAttribute('loading', 'lazy');
      }
    }
  }

  app.init = function() {
    if (app.initialized) return;
    app.initialized = true;

    initBurgerMenu();
    initSmoothScroll();
    initScrollSpy();
    initScrollAnimations();
    initCountUp();
    initButtonEffects();
    initCardHoverEffects();
    initImageAnimations();
    initFormValidation();
    initFilterPortfolio();
    initScrollToTop();
    initModalBackdrop();
    initVideoPlayers();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', app.init);
  } else {
    app.init();
  }

})();

/* ============================================================
   CYBERPUNK CITY GRID — interactions & animation
   Requires gsap, ScrollTrigger, Lenis, VanillaTilt (CDN globals).
   jQuery/Bootstrap-free: scrollspy and nav toggle are custom.
   ============================================================ */

(function () {
  'use strict';

  var FINE_POINTER = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var IS_MOBILE = window.matchMedia('(max-width: 767px)').matches;
  var REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NAV_OFFSET = -84;

  var C = window.CYBER = {
    lenis: null,
    isMobile: IS_MOBILE,
    finePointer: FINE_POINTER,
    reducedMotion: REDUCED_MOTION
  };

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* ============================================================
     Lenis smooth scrolling + anchor navigation
     ============================================================ */
  if (window.Lenis && !REDUCED_MOTION) {
    C.lenis = new Lenis({ duration: 1.15, smoothWheel: true });

    if (window.gsap) {
      C.lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (time) { C.lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      requestAnimationFrame(function raf(time) {
        C.lenis.raf(time);
        requestAnimationFrame(raf);
      });
    }
  }

  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href^="#"]');
    if (!link) return;
    var target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    if (C.lenis) {
      C.lenis.scrollTo(target, { offset: NAV_OFFSET, duration: 1.2 });
    } else {
      target.scrollIntoView({ behavior: REDUCED_MOTION ? 'auto' : 'smooth' });
    }
  });

  /* ============================================================
     Mobile nav toggle
     ============================================================ */
  var nav = document.getElementById('site-nav');
  var toggle = document.getElementById('nav-toggle');
  if (nav && toggle) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.querySelectorAll('.nav-link').forEach(function (l) {
      l.addEventListener('click', function () {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ============================================================
     Scroll progress bar
     ============================================================ */
  var bar = document.createElement('div');
  bar.id = 'scroll-progress';
  document.body.appendChild(bar);

  /* ============================================================
     Custom scrollspy + sliding nav pill
     ============================================================ */
  var navList = document.getElementById('nav-links');
  var navLinks = navList ? Array.prototype.slice.call(navList.querySelectorAll('.nav-link')) : [];
  var spySections = navLinks
    .map(function (l) { return document.querySelector(l.getAttribute('href')); })
    .filter(Boolean);

  var pill = null;
  if (navList && window.gsap) {
    pill = document.createElement('span');
    pill.id = 'nav-pill';
    navList.appendChild(pill);
  }

  var activeLink = null;
  function seatPill() {
    if (!pill || !activeLink || getComputedStyle(pill).display === 'none') return;
    var navRect = navList.getBoundingClientRect();
    var rect = activeLink.getBoundingClientRect();
    gsap.to(pill, {
      left: rect.left - navRect.left,
      width: rect.width,
      opacity: 1,
      duration: REDUCED_MOTION ? 0 : 0.45,
      ease: 'power3.out',
      overwrite: 'auto'
    });
  }

  function spy() {
    var pos = (window.scrollY || 0) + innerHeight * 0.35;
    var current = spySections[0];
    for (var i = 0; i < spySections.length; i++) {
      if (spySections[i].offsetTop <= pos) current = spySections[i];
    }
    if (!current) return;
    var link = navLinks[spySections.indexOf(current)];
    if (link !== activeLink) {
      navLinks.forEach(function (l) { l.classList.remove('active'); });
      link.classList.add('active');
      activeLink = link;
      seatPill();
    }
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var max = document.documentElement.scrollHeight - innerHeight;
      var p = max > 0 ? (window.scrollY || 0) / max : 0;
      bar.style.transform = 'scaleX(' + Math.min(Math.max(p, 0), 1) + ')';
      spy();
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { onScroll(); seatPill(); });
  window.addEventListener('load', function () { onScroll(); seatPill(); });
  onScroll();

  /* ============================================================
     Typing animation (hero terminal)
     ============================================================ */
  var typingEl = document.getElementById('typing-animation');
  if (typingEl) {
    var typingTexts = [
      'Software Engineer  ',
      'Automation Engineer  ',
      'Full Stack Developer   '
    ];
    if (REDUCED_MOTION) {
      typingEl.textContent = typingTexts[0].trim();
    } else {
      (function playTypingAnimation(text) {
        for (var i = 0; i < text.length; i++) {
          (function (ch, delay) {
            setTimeout(function () { typingEl.textContent += ch; }, delay);
          })(text[i], i * 200);
        }
        setTimeout(function () {
          typingEl.textContent = '';
          playTypingAnimation(typingTexts[(typingTexts.indexOf(text) + 1) % typingTexts.length]);
        }, text.length * 200);
      })(typingTexts[0]);
    }
  }

  /* ============================================================
     Magnetic cursor
     ============================================================ */
  if (FINE_POINTER && !REDUCED_MOTION && window.gsap) {
    var dot = document.createElement('div');
    dot.id = 'cyber-cursor-dot';
    var ring = document.createElement('div');
    ring.id = 'cyber-cursor-ring';
    document.body.appendChild(dot);
    document.body.appendChild(ring);

    gsap.set([dot, ring], { xPercent: -50, yPercent: -50 });

    var dotX = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3' });
    var dotY = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3' });
    var ringX = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' });
    var ringY = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });

    var INTERACTIVE = 'a, button, .btn';
    var stuck = null;
    var last = { x: 0, y: 0, t: performance.now() };

    document.addEventListener('mousemove', function (e) {
      document.body.classList.add('cursor-active');

      var now = performance.now();
      var dt = Math.max(now - last.t, 1);
      var vx = (e.clientX - last.x) / dt;
      var vy = (e.clientY - last.y) / dt;
      last = { x: e.clientX, y: e.clientY, t: now };

      dotX(e.clientX);
      dotY(e.clientY);

      if (stuck) {
        var r = stuck.getBoundingClientRect();
        var cx = r.left + r.width / 2;
        var cy = r.top + r.height / 2;
        ringX(cx + (e.clientX - cx) * 0.3);
        ringY(cy + (e.clientY - cy) * 0.3);
      } else {
        ringX(e.clientX);
        ringY(e.clientY);
        var speed = Math.min(Math.hypot(vx, vy), 2.5);
        gsap.to(dot, {
          scaleX: 1 + speed * 0.5,
          scaleY: 1 / (1 + speed * 0.35),
          rotation: Math.atan2(vy, vx) * 180 / Math.PI,
          duration: 0.15,
          overwrite: 'auto'
        });
      }
    }, { passive: true });

    document.addEventListener('mouseover', function (e) {
      var el = e.target.closest(INTERACTIVE);
      if (!el) return;
      stuck = el;
      ring.classList.add('is-stuck');
      gsap.to(ring, { scale: 1.8, duration: 0.3, overwrite: 'auto' });
      gsap.to(dot, { scaleX: 0.5, scaleY: 0.5, rotation: 0, duration: 0.3, overwrite: 'auto' });
    });

    document.addEventListener('mouseout', function (e) {
      var el = e.target.closest(INTERACTIVE);
      if (!el || stuck !== el) return;
      stuck = null;
      ring.classList.remove('is-stuck');
      gsap.to(ring, { scale: 1, duration: 0.3, overwrite: 'auto' });
      gsap.to(dot, { scaleX: 1, scaleY: 1, duration: 0.3, overwrite: 'auto' });
    });

    /* magnetic pull on interactive elements */
    var makeMagnetic = function (el, strength) {
      var xTo = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3' });
      var yTo = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3' });
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * strength);
        yTo((e.clientY - (r.top + r.height / 2)) * strength);
      });
      el.addEventListener('mouseleave', function () {
        xTo(0);
        yTo(0);
      });
    };

    document
      .querySelectorAll('.btn, .socials a, .nav-link')
      .forEach(function (el) { makeMagnetic(el, 0.3); });

    /* social links: hover scale composes with the magnetic translate */
    document.querySelectorAll('.socials a').forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        gsap.to(el, { scale: 1.25, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
      });
      el.addEventListener('mouseleave', function () {
        gsap.to(el, { scale: 1, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
      });
    });
  }

  /* ============================================================
     Text splitting helpers
     ============================================================ */
  function splitChars(el, out) {
    if (el.nodeType === 3) {
      var frag = document.createDocumentFragment();
      el.textContent.split(/(\s+)/).forEach(function (token) {
        if (!token) return;
        if (/^\s+$/.test(token)) {
          frag.appendChild(document.createTextNode(token));
          return;
        }
        var word = document.createElement('span');
        word.className = 'word';
        token.split('').forEach(function (ch) {
          var s = document.createElement('span');
          s.className = 'char';
          s.textContent = ch;
          word.appendChild(s);
          out.push(s);
        });
        frag.appendChild(word);
      });
      el.parentNode.replaceChild(frag, el);
    } else if (el.nodeType === 1 && !el.classList.contains('char') && !el.classList.contains('word')) {
      Array.prototype.slice.call(el.childNodes).forEach(function (child) {
        splitChars(child, out);
      });
    }
  }

  /* words grouped into visual lines by offsetTop; inline elements
     (e.g. <strong>) ride along as single reveal units */
  function revealLines(p) {
    var words = [];
    var INLINE = ['STRONG', 'EM', 'B', 'I', 'A', 'SPAN'];
    Array.prototype.slice.call(p.childNodes).forEach(function (n) {
      if (n.nodeType === 1 && INLINE.indexOf(n.tagName) !== -1) {
        n.classList.add('reveal-word');
        words.push(n);
        return;
      }
      if (n.nodeType !== 3 || !n.textContent.trim()) return;
      var frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(function (tok) {
        if (!tok) return;
        if (/^\s+$/.test(tok)) {
          frag.appendChild(document.createTextNode(tok));
          return;
        }
        var s = document.createElement('span');
        s.className = 'reveal-word';
        s.textContent = tok;
        frag.appendChild(s);
        words.push(s);
      });
      p.replaceChild(frag, n);
    });
    if (!words.length) return;

    var lineTops = [];
    words.forEach(function (w) {
      var top = w.offsetTop;
      if (lineTops.indexOf(top) === -1) lineTops.push(top);
      w.dataset.line = lineTops.indexOf(top);
    });

    gsap.from(words, {
      opacity: 0,
      y: 18,
      duration: 0.6,
      ease: 'power2.out',
      stagger: function (i, el) { return parseFloat(el.dataset.line) * 0.18; },
      scrollTrigger: { trigger: p, start: 'top 82%' }
    });
  }

  /* ============================================================
     Hero entrance
     ============================================================ */
  function initHero() {
    if (!window.gsap || REDUCED_MOTION) return;

    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    var title = document.querySelector('.hero-title');

    if (title) {
      title.setAttribute('aria-label', title.textContent.replace(/\s+/g, ' ').trim());
      var chars = [];
      splitChars(title, chars);
      tl.from(chars, { opacity: 0, y: 70, rotateX: -90, duration: 0.7, stagger: 0.03 }, 0.1);
    }

    tl.from('.hero-greeting', { opacity: 0, y: 20, duration: 0.6 }, 0)
      .from('.hero-terminal, .hero-role', { opacity: 0, y: 26, duration: 0.7, stagger: 0.15 }, 0.9)
      .from('.hero-cta .tilt-wrap', { opacity: 0, y: 26, duration: 0.7, stagger: 0.12 }, 1.15)
      .from('.portrait-frame', { opacity: 0, x: 60, duration: 1, ease: 'power2.out' }, 0.5)
      .from('.hero-marquee', { opacity: 0, duration: 0.8 }, 1.4);

    var badges = document.querySelectorAll('.hero-badge');
    if (badges.length) {
      gsap.to(badges, { opacity: 1, duration: 1.2, stagger: 0.12, delay: 1.3 });
    }
  }

  /* ============================================================
     Scroll-driven reveals
     ============================================================ */
  function initScrollFX() {
    if (!window.gsap || !window.ScrollTrigger) return;

    if (REDUCED_MOTION) {
      // static fallbacks: filled bars, visible values
      document.querySelectorAll('.skill-card').forEach(function (card) {
        var fill = card.querySelector('.skill-bar-fill');
        if (fill) fill.style.width = card.dataset.percent + '%';
      });
      return;
    }

    // generic fade-up reveals
    gsap.utils.toArray('[data-reveal]').forEach(function (el) {
      gsap.from(el, {
        opacity: 0,
        y: 44,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 88%' }
      });
    });

    // skills: cards float in with stagger, bars grow, numbers count up
    var skillCards = gsap.utils.toArray('.skill-card');
    if (skillCards.length) {
      ScrollTrigger.batch(skillCards, {
        start: 'top 90%',
        once: true,
        onEnter: function (batch) {
          gsap.from(batch, { opacity: 0, y: 40, duration: 0.6, ease: 'power2.out', stagger: 0.07 });
          batch.forEach(function (card, i) {
            var pct = parseInt(card.dataset.percent, 10) || 0;
            var fill = card.querySelector('.skill-bar-fill');
            var value = card.querySelector('.skill-value');
            if (fill) {
              gsap.to(fill, { width: pct + '%', duration: 1.2, delay: 0.15 + i * 0.07, ease: 'power3.out' });
            }
            if (value) {
              var counter = { v: 0 };
              gsap.to(counter, {
                v: pct,
                duration: 1.2,
                delay: 0.15 + i * 0.07,
                ease: 'power3.out',
                onUpdate: function () { value.textContent = Math.round(counter.v) + '%'; }
              });
            }
          });
        }
      });
    }

    // ghost titles drift slower than the page (parallax depth)
    gsap.utils.toArray('[data-ghost]').forEach(function (ghost) {
      gsap.to(ghost, {
        yPercent: 36,
        ease: 'none',
        scrollTrigger: {
          trigger: ghost.parentElement,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      });
    });

    // hero portrait: slow drift on scroll
    var portrait = document.querySelector('.portrait-frame');
    if (portrait) {
      gsap.to(portrait, {
        y: 90,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero-section',
          start: 'top top',
          end: 'bottom top',
          scrub: true
        }
      });
    }

    // line-by-line paragraph reveals
    var about = document.getElementById('about-text');
    var resume = document.getElementById('resume-text');
    if (about) revealLines(about);
    if (resume) revealLines(resume);

    ScrollTrigger.refresh();
  }

  /* ============================================================
     Tilt + glitch titles
     ============================================================ */
  function initTilt() {
    document.querySelectorAll('.project-card h3').forEach(function (h3) {
      h3.classList.add('glitch');
      h3.setAttribute('data-text', h3.textContent);
    });

    if (!window.VanillaTilt || !FINE_POINTER || IS_MOBILE || REDUCED_MOTION) return;

    var ctaWraps = document.querySelectorAll('.tilt-wrap');
    if (ctaWraps.length) {
      VanillaTilt.init(ctaWraps, {
        max: 15, speed: 400, scale: 1.05,
        glare: true, 'max-glare': 0.3, gyroscope: false
      });
    }

    var projectCards = document.querySelectorAll('.project-card');
    if (projectCards.length) {
      VanillaTilt.init(projectCards, {
        max: 8, speed: 600, scale: 1.01,
        glare: true, 'max-glare': 0.15, perspective: 1400, gyroscope: false
      });
    }

    var skillCards = document.querySelectorAll('.skill-card');
    if (skillCards.length) {
      VanillaTilt.init(skillCards, {
        max: 12, speed: 500, scale: 1.03, glare: false, gyroscope: false
      });
    }
  }

  /* ============================================================
     Particle burst (contact buttons + socials)
     ============================================================ */
  if (!REDUCED_MOTION) {
    var canvas = null;
    var ctx = null;
    var particles = [];
    var running = false;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    var sizeCanvas = function () {
      canvas.width = innerWidth * dpr;
      canvas.height = innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    var burst = function (x, y) {
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'particle-canvas';
        document.body.appendChild(canvas);
        ctx = canvas.getContext('2d');
        sizeCanvas();
        window.addEventListener('resize', sizeCanvas);
      }
      var count = IS_MOBILE ? 18 : 42;
      for (var i = 0; i < count; i++) {
        var angle = Math.random() * Math.PI * 2;
        var speed = 2 + Math.random() * 6;
        particles.push({
          x: x, y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2,
          size: 1.5 + Math.random() * 2.5,
          life: 1
        });
      }
      if (!running) {
        running = true;
        requestAnimationFrame(tick);
      }
    };

    var tick = function () {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      ctx.globalCompositeOperation = 'lighter';
      for (var i = particles.length - 1; i >= 0; i--) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12;
        p.vx *= 0.985;
        p.life -= 0.022;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = p.life;
        ctx.fillStyle = '#00FF41';
        ctx.shadowColor = '#00FF41';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      if (particles.length) {
        requestAnimationFrame(tick);
      } else {
        running = false;
        ctx.clearRect(0, 0, innerWidth, innerHeight);
      }
    };

    document.addEventListener('click', function (e) {
      var el = e.target.closest('#contact-section .btn, .socials a, .hero-cta .btn');
      if (!el) return;
      burst(e.clientX, e.clientY);
    });
  }

  /* ============================================================
     Boot
     ============================================================ */
  function boot() {
    initHero();
    initScrollFX();
    initTilt();
    spy();
    seatPill();
  }

  // wait for full load so fonts/images don't shift line measurements
  if (document.readyState === 'complete') setTimeout(boot, 100);
  else window.addEventListener('load', function () { setTimeout(boot, 100); });
})();

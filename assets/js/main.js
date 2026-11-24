(function () {
  "use strict";
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var html = document.documentElement;

  /* ---------------- Safe debounced ScrollTrigger refresh to avoid long tasks ---------------- */
  var _stRefreshPending = false;
  function safeScrollTriggerRefresh() {
    if (_stRefreshPending || typeof ScrollTrigger === 'undefined') return;
    _stRefreshPending = true;
    requestAnimationFrame(function () {
      _stRefreshPending = false;
      ScrollTrigger.refresh();
    });
  }

  /* ---------------- Trust marquee: populate duplicated content ---------------- */
  (function () {
    var tpl = document.getElementById('trust-items');
    var track = document.querySelector('.marquee-track');
    if (!tpl || !track) return;
    track.appendChild(tpl.content.cloneNode(true));
    track.appendChild(tpl.content.cloneNode(true));
  })();

  /* ---------------- Preloader (Cinematic Studio Reveal) ---------------- */
  function initPreloader() {
    var plEl = document.getElementById('preloader');
    var plStatus = document.querySelector('.pl-status-pill');
    var plWord = document.getElementById('pl-wordmark');
    var plLetters = document.querySelectorAll('#pl-word-super .pl-letter');
    var plChangingWrap = document.getElementById('pl-changing-word-wrap');
    var plChangingTrack = document.getElementById('pl-changing-track');
    var plTag = document.getElementById('pl-tagline');
    var plNum = document.getElementById('pl-num');
    var plPercent = document.getElementById('pl-percent');
    var plBar = document.getElementById('pl-bar-fill');
    var plStage = document.getElementById('pl-stage');
    if (!plEl || plEl._preloaderInit) {
      return;
    }
    plEl._preloaderInit = true;

    // index.html runs the preloader from a small inline script (once per session, ~4 s, hard 5 s limit,
    // independent of this file and of gsap / lenis / iconify). Nothing is left to animate here; just react
    // once it has closed. The code below is only the fallback for a page that has no inline controller.
    if (window.__smPreloader) {
      var afterPreloader = function () { updateNavTheme(); loadHeroVideo(); };
      if (window.__smPreloader.done) {
        afterPreloader();
      } else {
        window.addEventListener('sm-preloader-done', afterPreloader, { once: true });
      }
      return;
    }

    // Repeat visit: the inline <head> script already hid the preloader (html.pl-skip)
    // so the page shows straight away. Reveal the header and start the hero video.
    if (html.classList.contains('pl-skip')) {
      plEl.style.display = 'none';
      document.body.classList.remove('is-loading');
      document.body.classList.add('is-loaded');
      updateNavTheme();
      if (document.readyState === 'complete') {
        loadHeroVideo();
      } else {
        window.addEventListener('load', loadHeroVideo, { once: true });
      }
      return;
    }
    // First visit of the session: remember it so later page loads skip the intro.
    try { sessionStorage.setItem('supermajor_preloader_shown', '1'); } catch (e) { }

    // The lockup is centred on "SUPER MAJOR": the word mask is always exactly as
    // wide as MAJOR (the last word). Longer words start at the same left edge and
    // run past the mask on the right (clip-path leaves the right side open), so
    // nothing re-centres while the words cycle.
    // Measure the glyphs with a Range: the spans themselves stretch to the widest
    // word in the column, so their own width is always CONNECTED's.
    function syncChangingWordWidth() {
      if (!plChangingTrack || !plChangingWrap) return;
      var majorEl = plChangingTrack.lastElementChild;
      if (!majorEl) return;
      requestAnimationFrame(function () {
        var range = document.createRange();
        range.selectNodeContents(majorEl);
        var w = range.getBoundingClientRect().width;
        if (w) plChangingWrap.style.width = Math.ceil(w) + 'px';
      });
    }
    syncChangingWordWidth();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(syncChangingWordWidth);
    }
    window.addEventListener('resize', syncChangingWordWidth, { passive: true });
    window.addEventListener('orientationchange', function () {
      setTimeout(syncChangingWordWidth, 100);
    });

    document.body.classList.add('is-loading');

    if (reducedMotion) {
      if (plStatus) { plStatus.classList.add('in'); }
      if (plWord) { plWord.classList.add('in'); }
      plLetters.forEach(function (l) { l.classList.add('in'); });
      if (plChangingWrap) { plChangingWrap.classList.add('in'); }
      if (plChangingTrack && plChangingTrack.lastElementChild) {
        plChangingTrack.style.transform = 'translateY(-' + plChangingTrack.lastElementChild.offsetTop + 'px)';
      }
      if (plTag) { plTag.classList.add('in'); }
      if (plPercent) { plPercent.classList.add('in'); }
      document.body.classList.remove('is-loading');
      document.body.classList.add('is-loaded');
      setTimeout(function () { plEl.classList.add('hide'); }, 200);
      return;
    }

    var STAGGER = 90;
    var DUR = 380;
    var HOLD = 800;
    var SLIDE_DUR = 500; 
    var MAJOR_REST = 600; 

    function animateSuperLetters(onDone) {
      plLetters.forEach(function (el, i) {
        setTimeout(function () { el.classList.add('in'); }, i * STAGGER);
      });
      var total = plLetters.length ? (plLetters.length - 1) * STAGGER + DUR : 0;
      setTimeout(onDone, total);
    }

    var superTotal = plLetters.length ? (plLetters.length - 1) * STAGGER + DUR : 740;
    var wordCount = plChangingTrack ? plChangingTrack.children.length : 6;
    var totalWordSteps = Math.max(wordCount - 1, 1);
    var MAJOR_LAND_TIME = 60 + superTotal + (totalWordSteps * HOLD) + SLIDE_DUR;
    var TOTAL_DURATION = MAJOR_LAND_TIME + MAJOR_REST;

    function runWordCycle() {
      if (!plChangingTrack) return;
      var words = plChangingTrack.children;
      var steps = words.length;
      if (steps <= 1) return;
      var i = 1;
      function next() {
        if (!words[i] || hidden) return; // closing: keep SUPER MAJOR on screen
        plChangingTrack.style.transform = 'translateY(-' + words[i].offsetTop + 'px)';
        if (i === steps - 1) majorShownAt = performance.now();
        i++;
        if (i < steps) setTimeout(next, HOLD);
      }
      setTimeout(next, HOLD);
    }

    requestAnimationFrame(function () {
      setTimeout(function () {
        if (plStatus) plStatus.classList.add('in');
        if (plWord) plWord.classList.add('in');
        animateSuperLetters(function () {
          if (plChangingWrap) plChangingWrap.classList.add('in');
          runWordCycle();
        });
        if (plTag) plTag.classList.add('in');
        if (plPercent) plPercent.classList.add('in');
      }, 60);
    });

    var start = null;
    var hidden = false;
    // Set when MAJOR slides in. The word cycle runs on timers, which fall behind
    // while the page is busy loading, so the preloader waits for MAJOR to have
    // landed and rested instead of closing on elapsed time alone.
    var majorShownAt = plChangingTrack && plChangingTrack.children.length > 1 ? null : 0;

    function tick(now) {
      if (!start) start = now;
      var elapsed = now - start;

      var progress = Math.min(elapsed / MAJOR_LAND_TIME, 1);
      var pct = Math.min(Math.round(progress * 100), 100);

      if (plNum) plNum.textContent = pct;
      if (plBar) plBar.style.width = pct + '%';

      if (plStage) {
        if (pct < 32) {
          plStage.textContent = 'INITIALIZING 3D PIPELINE';
        } else if (pct < 65) {
          plStage.textContent = 'CALIBRATING LIGHTING & CAD';
        } else if (pct < 92) {
          plStage.textContent = 'PREPARING ENVIRONMENT';
        } else {
          plStage.textContent = 'STUDIO READY';
        }
      }

      var majorRested = majorShownAt !== null && now - majorShownAt >= SLIDE_DUR + MAJOR_REST;
      if (elapsed < TOTAL_DURATION || !majorRested) {
        requestAnimationFrame(tick);
      } else if (!hidden) {
        hidden = true;
        if (plBar) plBar.style.width = '100%';
        if (plNum) plNum.textContent = 100;

        plEl.classList.add('hide');
        document.body.classList.remove('is-loading');
        document.body.classList.add('is-loaded');
        updateNavTheme();
        loadHeroVideo();

        setTimeout(function () {
          plEl.style.display = 'none';
          window.removeEventListener('resize', syncChangingWordWidth);
        }, 900);
      }
    }

    requestAnimationFrame(tick);

    // Safety net for slow devices: never leave the loader up past ~9s, but always
    // end on SUPER MAJOR — jump to it, let it rest, then close.
    setTimeout(function () {
      if (hidden) return;
      hidden = true;
      plLetters.forEach(function (l) { l.classList.add('in'); });
      if (plChangingWrap) plChangingWrap.classList.add('in');
      if (plChangingTrack && plChangingTrack.lastElementChild && majorShownAt === null) {
        majorShownAt = performance.now();
        plChangingTrack.style.transform = 'translateY(-' + plChangingTrack.lastElementChild.offsetTop + 'px)';
      }
      setTimeout(function () {
        plEl.classList.add('hide');
        document.body.classList.remove('is-loading');
        document.body.classList.add('is-loaded');
        updateNavTheme();
        loadHeroVideo();
        setTimeout(function () {
          plEl.style.display = 'none';
        }, 950);
      }, majorShownAt === null ? 0 : MAJOR_REST);
    }, 9000);
  }

  initPreloader();

  /* ---------------- Smooth scroll (Lenis) ---------------- */
  var lenis = null;
  if (!reducedMotion && window.Lenis) {
    try {
      lenis = new Lenis({ duration: 1.1, smoothWheel: true });
      html.classList.add('has-lenis');
      if (window.ScrollTrigger) {
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      } else {
        (function raf(time) { lenis.raf(time); requestAnimationFrame(raf); })();
      }
    } catch (e) { lenis = null; }
  }

  // Re-scroll to hash after Lenis+ScrollTrigger init displaces native hash position
  if (window.location.hash) {
    var userMoved = false;
    ['wheel', 'touchstart', 'keydown'].forEach(function (ev) {
      window.addEventListener(ev, function () { userMoved = true; }, { once: true, passive: true });
    });
    window.addEventListener('load', function () {
      setTimeout(function () {
        if (userMoved) return;
        var hashEl = document.getElementById(window.location.hash.slice(1));
        if (!hashEl) return;
        if (lenis) lenis.scrollTo(hashEl, { offset: -80 });
        else hashEl.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
      }, 300);
    });
  }

  /* ---------------- Header Interactions ---------------- */
  var siteHeader = null;
  var navLinks = [];
  var sections = [];
  var initScrollTextScrub = null;
  var NAV_SKIP = '#site-header, #header-placeholder, #scroll-progress, #page-veil, #preloader, #preloader-placeholder, #card-preview, #back-to-top, #service-cursor-tooltip';
  var imageLumaCache = {};

  function lumaFromRgb(r, g, b) {
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  function imageTheme(src) {
    if (!src) return 'dark';
    if (src in imageLumaCache) return imageLumaCache[src];
    imageLumaCache[src] = 'dark';
    var img = new Image();
    img.onload = function () {
      try {
        var c = document.createElement('canvas');
        c.width = 16; c.height = 16;
        var cx = c.getContext('2d');
        cx.drawImage(img, 0, 0, 16, 16);
        var d = cx.getImageData(0, 0, 16, 16).data, sum = 0;
        for (var p = 0; p < d.length; p += 4) sum += lumaFromRgb(d[p], d[p + 1], d[p + 2]);
        imageLumaCache[src] = sum / (d.length / 4) < 140 ? 'dark' : 'light';
        updateNavTheme();
      } catch (err) {}
    };
    img.src = src;
    return imageLumaCache[src];
  }

  function themeAtPoint(x, y) {
    var stack = document.elementsFromPoint(x, y);
    for (var i = 0; i < stack.length; i++) {
      var el = stack[i];
      if (el.closest(NAV_SKIP)) continue;
      var tag = el.getAttribute('data-nav-theme');
      if (tag === 'light' || tag === 'dark') return tag;

      var cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.1) continue;

      var name = el.tagName;
      if (name === 'VIDEO' || name === 'IFRAME' || name === 'CANVAS') return 'dark';
      if (name === 'IMG') return imageTheme(el.currentSrc || el.src);

      var bg = cs.backgroundColor.match(/[\d.]+/g);
      if (bg && (bg.length < 4 || parseFloat(bg[3]) >= 0.5)) {
        return lumaFromRgb(+bg[0], +bg[1], +bg[2]) < 140 ? 'dark' : 'light';
      }
      var bgImg = cs.backgroundImage.match(/url\(["']?([^"')]+)["']?\)/);
      if (bgImg) return imageTheme(bgImg[1]);
      for (var k = 0; k < el.children.length; k++) {
        var child = el.children[k];
        if (!/^(VIDEO|IMG|IFRAME|CANVAS)$/.test(child.tagName)) continue;
        var cr = child.getBoundingClientRect();
        if (y >= cr.top && y <= cr.bottom && x >= cr.left && x <= cr.right) {
          return child.tagName === 'IMG' ? imageTheme(child.currentSrc || child.src) : 'dark';
        }
      }
    }
    return null;
  }

  function updateNavTheme() {
    var header = siteHeader || document.getElementById('site-header');
    if (!header) return;

    var hero = document.getElementById('hero');
    if (hero) {
      var heroBottom = hero.offsetTop + hero.offsetHeight;
      var y = window.scrollY || window.pageYOffset;
      if (y < heroBottom - 70) {
        header.classList.add('nav-theme-dark');
        header.classList.remove('nav-theme-light');
        return;
      }
    }

    var hr = header.getBoundingClientRect();
    var y = Math.max(1, hr.top + hr.height / 2);
    var w = window.innerWidth;
    var votes = { light: 0, dark: 0 };
    [0.12, 0.5, 0.88].forEach(function (f) {
      var t = themeAtPoint(w * f, y);
      if (t) votes[t]++;
    });

    var theme = votes.light > votes.dark ? 'light' : votes.dark > votes.light ? 'dark' : null;
    if (!theme) {
      var pageBg = getComputedStyle(document.body).backgroundColor.match(/[\d.]+/g);
      theme = pageBg && lumaFromRgb(+pageBg[0], +pageBg[1], +pageBg[2]) >= 140 ? 'light' : 'dark';
    }
    if (theme === 'light') {
      header.classList.add('nav-theme-light');
      header.classList.remove('nav-theme-dark');
    } else {
      header.classList.add('nav-theme-dark');
      header.classList.remove('nav-theme-light');
    }
  }

  /* Interactive 3D Navbar & Micro-physics */
  function init3DNavbar() {
    var header = document.getElementById('site-header');
    if (!header || header._3dInit) return;
    header._3dInit = true;

    // 2. Nav links 3D magnetic hover
    var links = [].slice.call(header.querySelectorAll('.nav-link'));
    links.forEach(function (link) {
      link.addEventListener('mousemove', function (e) {
        var rect = link.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;
        link.style.transform = 'translate(' + (x * 0.15).toFixed(1) + 'px, ' + (y * 0.15 - 2).toFixed(1) + 'px) translateZ(12px)';
      });
      link.addEventListener('mouseleave', function () {
        link.style.transform = '';
      });
    });
  }

  function bindAnchorLinks(scope) {
    var root = scope || document;
    root.querySelectorAll('a[data-nav], a[href^="#"]').forEach(function (a) {
      if (a._navInit) return;
      a._navInit = true;
      a.addEventListener('click', function (e) {
        var href = a.getAttribute('href');
        if (!href || href === '#' || href.length < 2) return;
        if (!href.startsWith('#')) return;
        var target = null;
        try { target = document.querySelector(href); } catch (err) {}
        if (!target) {
          if (href === '#section-work') {
            e.preventDefault();
            var prefix = (window.location.pathname.includes('/works/') || window.location.pathname.includes('/legal/') || window.location.pathname.includes('/services/')) ? '../' : '';
            window.location.href = prefix + 'work';
          }
          return;
        }
        e.preventDefault();
        var mobileMenu = document.getElementById('mobile-menu');
        var menuToggle = document.getElementById('menu-toggle');
        var menuIcon = document.getElementById('menu-icon');
        if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
          mobileMenu.classList.add('hidden');
          document.body.classList.remove('mobile-menu-open');
          if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
          if (menuIcon) menuIcon.setAttribute('icon', 'solar:hamburger-menu-linear');
        }
        if (lenis) { lenis.scrollTo(target, { offset: -80 }); }
        else { target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' }); }
        history.pushState(null, '', href);
      });
    });
  }

  function initHeaderInteractions() {
    siteHeader = document.getElementById('site-header');
    navLinks = [].slice.call(document.querySelectorAll('header [data-nav]'));
    sections = ['hero', 'trust', 'about', 'work', 'services', 'studio', 'contact'].map(function (id) { return document.getElementById(id); }).filter(Boolean);

    init3DNavbar();
    updateNavTheme();

    var menuToggle = document.getElementById('menu-toggle');
    var mobileMenu = document.getElementById('mobile-menu');
    var menuIcon = document.getElementById('menu-icon');

    if (menuToggle && mobileMenu && !menuToggle._menuInit) {
      menuToggle._menuInit = true;

      function closeMobileMenu() {
        mobileMenu.classList.add('hidden');
        document.body.classList.remove('mobile-menu-open');
        menuToggle.setAttribute('aria-expanded', 'false');
        if (menuIcon) menuIcon.setAttribute('icon', 'solar:hamburger-menu-linear');
      }

      menuToggle.addEventListener('click', function (e) {
        e.stopPropagation();
        var isHidden = mobileMenu.classList.contains('hidden');
        mobileMenu.classList.toggle('hidden');
        document.body.classList.toggle('mobile-menu-open', isHidden);
        menuToggle.setAttribute('aria-expanded', String(isHidden));
        if (menuIcon) menuIcon.setAttribute('icon', isHidden ? 'solar:close-linear' : 'solar:hamburger-menu-linear');
      });

      mobileMenu.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () {
          closeMobileMenu();
        });
      });

      document.addEventListener('click', function (e) {
        if (!mobileMenu.classList.contains('hidden') && !mobileMenu.contains(e.target) && !menuToggle.contains(e.target)) {
          closeMobileMenu();
        }
      });
    }

    bindAnchorLinks(document.getElementById('header-placeholder') || document);
  }

  /* ---------------- Footer Interactions ---------------- */
  function initFooterInteractions() {
    var yearEl = document.getElementById('footer-year') || document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
    var yearMobEl = document.getElementById('footer-year-mobile');
    if (yearMobEl) yearMobEl.textContent = new Date().getFullYear();

    var btt = document.getElementById('back-to-top');
    if (btt && !btt._bttInit) {
      btt._bttInit = true;
      btt.addEventListener('click', function () {
        if (lenis) lenis.scrollTo(0);
        else window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
      });
    }

    bindAnchorLinks(document.getElementById('footer-placeholder') || document);

    if (typeof initScrollTextScrub === 'function') {
      initScrollTextScrub();
    }
    initFooterBrand();

    if (window.ScrollTrigger) {
      safeScrollTriggerRefresh();
    }
  }

  /* ---------------- Oversized Footer Brand Signature ---------------- */
  function initFooterBrand() {
    var wrapperEl = document.querySelector('.footer-pinned-wrapper') ||
      document.getElementById('footer-placeholder') ||
      document.querySelector('.footer');
    var stageEl = document.querySelector('.footer-brand-stage');
    var motionEl = document.querySelector('.footer-brand-motion');
    var fitEl = document.querySelector('.footer-brand-fit');
    var brandEl = document.querySelector('.footer-brand');
    if (!stageEl || !motionEl || !fitEl || !brandEl) return;

    var triggerEl = wrapperEl || stageEl;

    fitEl.style.transformOrigin = 'center bottom';
    motionEl.style.transformOrigin = 'center bottom';
    brandEl.style.transformOrigin = 'center bottom';

    function fitBrand() {
      var brandWidth = brandEl.scrollWidth || brandEl.offsetWidth;
      var stageWidth = stageEl.clientWidth;
      if (!stageWidth || !brandWidth) return;

      var containerEl = document.querySelector('.footer .mx-auto.max-w-7xl');
      var containerWidth = containerEl ? containerEl.clientWidth : (window.innerWidth - 64);

      var usableWidth = Math.min(stageWidth - 48, containerWidth);
      var targetWidth = usableWidth * 0.94;
      var scaleX = targetWidth / brandWidth;
      fitEl.style.transform = 'scaleX(' + scaleX.toFixed(4) + ')';
      fitEl.style.transformOrigin = 'center bottom';
    }

    function animateEntrance() {
      if (window.ScrollTrigger) {
        var oldST = ScrollTrigger.getById('supermajorFooterST');
        if (oldST) oldST.kill();
      }
      if (motionEl._footerST) {
        motionEl._footerST.kill();
        motionEl._footerST = null;
      }

      if (reducedMotion || !(window.gsap && window.ScrollTrigger)) {
        if (window.gsap) gsap.set(motionEl, { scaleX: 1, scaleY: 1, y: 0, transformOrigin: 'center bottom' });
        return;
      }

      gsap.set(motionEl, {
        transformOrigin: 'center bottom',
        scaleX: 1,
        y: 0
      });

      motionEl._footerST = gsap.fromTo(motionEl,
        {
          scaleY: 1.05,
          scaleX: 1,
          y: 0,
          transformOrigin: 'center bottom'
        },
        {
          scaleY: 0.28,
          scaleX: 1,
          y: 0,
          transformOrigin: 'center bottom',
          ease: 'none',
          scrollTrigger: {
            id: 'supermajorFooterST',
            trigger: triggerEl,
            start: 'bottom bottom',
            end: '+=600',
            pin: true,
            pinSpacing: true,
            anticipatePin: 1,
            scrub: (lenis || window.Lenis) ? true : 0.4,
            invalidateOnRefresh: true
          }
        }
      ).scrollTrigger;
    }

    fitBrand();
    if (window.gsap) {
      gsap.set(motionEl, {
        scaleX: 1,
        scaleY: 1,
        y: 0,
        transformOrigin: 'center bottom'
      });
    }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        fitBrand();
        safeScrollTriggerRefresh();
      });
    }

    if (!window._footerBrandResizeInit) {
      window._footerBrandResizeInit = true;
      if (window.ResizeObserver) {
        var ro = new ResizeObserver(function () {
          fitBrand();
          safeScrollTriggerRefresh();
        });
        ro.observe(stageEl);
      }
      var resizeTimer;
      window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
          fitBrand();
          safeScrollTriggerRefresh();
        }, 100);
      }, { passive: true });
    }
  }

  /* ---------------- Component Loader ---------------- */
  function loadComponents() {
    var preloaderTarget = document.getElementById('preloader');
    var headerTarget = document.getElementById('header-placeholder');
    var footerTarget = document.getElementById('footer-placeholder');

    var script = document.querySelector('script[src*="main.js"], script[src*="main.min.js"]');
    var basePath = (script && script.getAttribute('src').startsWith('../')) ? '../' : '';
    if (!basePath && (window.location.pathname.includes('/works/') || window.location.pathname.includes('/legal/') || window.location.pathname.includes('/services/'))) {
      basePath = '../';
    }

    function adaptComponentLinks(htmlStr) {
      if (!basePath) return htmlStr;
      return htmlStr
        .replace(/href="#section-work"/g, 'href="' + basePath + 'work"')
        .replace(/href="\.\/"/g, 'href="' + basePath + '"')
        .replace(/href="work"/g, 'href="' + basePath + 'work"')
        .replace(/href="(#(?:hero|trust|about|services|studio|contact))"/g, 'href="' + basePath + '$1"')
        .replace(/href="(?:(?:\.\.\/|\/)?legal\/|legal\/)/g, 'href="' + basePath + 'legal/')
        .replace(/(src|href)="assets\//g, '$1="' + basePath + 'assets/');
    }

    if (!preloaderTarget) {
      var isIndexPage = !document.body.classList.contains('site-page');

      if (isIndexPage) {
        var preloaderPlaceholder = document.createElement('div');
        preloaderPlaceholder.id = 'preloader-placeholder';
        document.body.insertBefore(preloaderPlaceholder, document.body.firstChild);
        fetch(basePath + 'components/preloader.html')
          .then(function (r) { return r.text(); })
          .then(function (html) {
            preloaderPlaceholder.innerHTML = html;
            initPreloader();
          })
          .catch(function () {
            document.body.classList.remove('is-loading');
            document.body.classList.add('is-loaded');
          });
      } else {
        document.body.classList.remove('is-loading');
        document.body.classList.add('is-loaded');
      }
    }

    if (headerTarget) {
      headerTarget.innerHTML = '';
      fetch(basePath + 'components/header.html?v=53')
        .then(function (r) { return r.text(); })
        .then(function (html) {
          headerTarget.innerHTML = adaptComponentLinks(html);
          initHeaderInteractions();
          onScroll();
        })
        .catch(function (e) {
          console.warn('Could not load header component via fetch:', e);
          initHeaderInteractions();
        });
    } else {
      initHeaderInteractions();
    }

    if (footerTarget) {
      footerTarget.innerHTML = '';
      fetch(basePath + 'components/footer.html?v=59')
        .then(function (r) { return r.text(); })
        .then(function (html) {
          footerTarget.innerHTML = adaptComponentLinks(html);
          initFooterInteractions();
        })
        .catch(function (e) {
          console.warn('Could not load footer component via fetch:', e);
          initFooterInteractions();
        });
    } else {
      initFooterInteractions();
    }
  }

  loadComponents();

  /* ---------------- Header shrink + active link on scroll ---------------- */
  if (!sections.length) sections = ['hero', 'trust', 'about', 'work', 'services', 'studio', 'contact'].map(function (id) { return document.getElementById(id); }).filter(Boolean);
  if (!siteHeader) siteHeader = document.getElementById('site-header');
  if (!navLinks.length) navLinks = [].slice.call(document.querySelectorAll('header [data-nav]'));

  var _scrollTicking = false;
  function onScroll() {
    if (!siteHeader) siteHeader = document.getElementById('site-header');
    var y = window.scrollY || window.pageYOffset;
    var doc = document.documentElement;
    var scrollTop = doc.scrollTop || document.body.scrollTop;
    var height = doc.scrollHeight - doc.clientHeight;
    var pct = height > 0 ? (scrollTop / height) * 100 : 0;

    // Batch geometric reads first before mutating DOM classes/styles
    if (!navLinks.length) navLinks = [].slice.call(document.querySelectorAll('header [data-nav]'));
    var current = sections[0];
    for (var i = 0; i < sections.length; i++) {
      var top = sections[i].offsetTop;
      if (y >= top - 160) current = sections[i];
    }

    // Now apply style/class writes
    if (siteHeader) {
      if (y > 40) { siteHeader.classList.add('header-scrolled'); }
      else { siteHeader.classList.remove('header-scrolled'); }
    }

    updateNavTheme();

    var prog = document.getElementById('scroll-progress');
    if (prog) prog.style.width = pct + '%';
    var btt = document.getElementById('back-to-top');
    if (btt) {
      if (y > 700) { btt.style.opacity = '1'; btt.style.transform = 'translateY(0)'; }
      else { btt.style.opacity = '0'; btt.style.transform = 'translateY(16px)'; }
    }
    navLinks.forEach(function (link) {
      var match = current && link.getAttribute('href') === ('#' + current.id);
      link.classList.toggle('active', !!match);
    });
  }

  function handleScrollThrottled() {
    if (!_scrollTicking) {
      _scrollTicking = true;
      requestAnimationFrame(function () {
        onScroll();
        _scrollTicking = false;
      });
    }
  }

  window.addEventListener('scroll', handleScrollThrottled, { passive: true });
  if (lenis) {
    lenis.on('scroll', handleScrollThrottled);
  }
  handleScrollThrottled();

  var bttEl = document.getElementById('back-to-top');
  if (bttEl) {
    bttEl.addEventListener('click', function () {
      if (lenis) lenis.scrollTo(0);
      else window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------------- Reveal animations (GSAP ScrollTrigger, with safe fallback) ---------------- */
  if (!reducedMotion && window.gsap && window.ScrollTrigger) {
    html.classList.add('js-anim');
    gsap.registerPlugin(ScrollTrigger);
    var items = [].slice.call(document.querySelectorAll('[data-reveal]'));
    items.forEach(function (el, i) {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 88%',
        once: true,
        onEnter: function () { el.classList.add('revealed'); }
      });
    });

    /* ---------------- Scroll-driven Text Scrub Animation (Disabled per user request) ---------------- */
    initScrollTextScrub = function () {
      return;

      var parsedList = [];

      elements.forEach(function (el) {
        if (el.dataset.textSplit === 'true') return;
        el.dataset.textSplit = 'true';

        var isDark = el.closest('[data-nav-theme="dark"]') ||
          el.closest('.bg-ink') ||
          el.closest('#services') ||
          (el.closest('[data-nav-theme="light"]') ? false : (
            el.classList.contains('text-white') ||
            el.classList.contains('text-cream')
          ));

        var defaultBase = isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(21, 18, 16, 0.22)';
        var defaultActive = isDark ? '#FFFFFF' : '#151210';

        var wordItems = [];
        var splitChars = el.getAttribute('data-scroll-text') === 'chars' || el.hasAttribute('data-scroll-chars');

        function wrapNodes(node) {
          if (node.nodeType === Node.TEXT_NODE) {
            var text = node.textContent;
            if (!text.trim()) return;
            var fragment = document.createDocumentFragment();

            if (splitChars) {
              var chars = text.split('');
              chars.forEach(function (ch) {
                if (/\s/.test(ch)) {
                  fragment.appendChild(document.createTextNode(ch));
                } else {
                  var span = document.createElement('span');
                  span.className = 'scrub-word scrub-char';
                  span.textContent = ch;

                  var parentEl = node.parentElement;
                  var isBrandWord = parentEl && (
                    parentEl.classList.contains('text-brand') ||
                    parentEl.classList.contains('text-[#FF4B0A]') ||
                    parentEl.classList.contains('text-[#C93708]') ||
                    el.classList.contains('text-[#FF4B0A]') ||
                    el.classList.contains('text-[#C93708]') ||
                    el.classList.contains('text-brand')
                  );

                  var base = isBrandWord ? 'rgba(201, 55, 8, 0.28)' : defaultBase;
                  var active = isBrandWord ? '#C93708' : defaultActive;

                  span.style.color = base;
                  fragment.appendChild(span);
                  wordItems.push({ el: span, base: base, active: active });
                }
              });
            } else {
              var tokens = text.split(/(\s+)/);
              tokens.forEach(function (tok) {
                if (!tok) return;
                if (/^\s+$/.test(tok)) {
                  fragment.appendChild(document.createTextNode(tok));
                } else {
                  var span = document.createElement('span');
                  span.className = 'scrub-word';
                  span.textContent = tok;

                  var parentEl = node.parentElement;
                  var isBrandWord = parentEl && (
                    parentEl.classList.contains('text-brand') ||
                    parentEl.classList.contains('text-[#FF4B0A]') ||
                    parentEl.classList.contains('text-[#C93708]') ||
                    el.classList.contains('text-[#FF4B0A]') ||
                    el.classList.contains('text-[#C93708]') ||
                    el.classList.contains('text-brand')
                  );

                  var base = isBrandWord ? 'rgba(201, 55, 8, 0.28)' : defaultBase;
                  var active = isBrandWord ? '#C93708' : defaultActive;

                  span.style.color = base;
                  fragment.appendChild(span);
                  wordItems.push({ el: span, base: base, active: active });
                }
              });
            }
            node.parentNode.replaceChild(fragment, node);
          } else if (node.nodeType === Node.ELEMENT_NODE && !node.classList.contains('scrub-word')) {
            var children = Array.prototype.slice.call(node.childNodes);
            children.forEach(wrapNodes);
          }
        }

        wrapNodes(el);

        if (!wordItems.length) return;

        parsedList.push({ el: el, wordItems: wordItems });
        buildElementTimeline(el, wordItems, splitChars);
      });

      function buildElementTimeline(el, wordItems, isChars) {
        if (el._scrubTimeline) {
          if (el._scrubTimeline.scrollTrigger) el._scrubTimeline.scrollTrigger.kill();
          el._scrubTimeline.kill();
        }

        var lines = [];
        var currentLine = [];
        var currentTop = -1;

        wordItems.forEach(function (item) {
          var top = item.el.offsetTop;
          if (currentTop === -1 || Math.abs(top - currentTop) <= 6) {
            currentLine.push(item);
            currentTop = top;
          } else {
            lines.push(currentLine);
            currentLine = [item];
            currentTop = top;
          }
        });
        if (currentLine.length) {
          lines.push(currentLine);
        }

        var isFooter = el.closest('footer') !== null;
        var startTrigger = isFooter ? 'top 92%' : 'top 86%';
        var endTrigger = isFooter ? 'bottom bottom' : (lines.length > 2 ? 'bottom 35%' : 'bottom 45%');

        var tl = gsap.timeline({
          scrollTrigger: {
            trigger: el,
            start: startTrigger,
            end: endTrigger,
            scrub: isFooter ? 0.35 : 0.6,
            onLeave: function () {
              wordItems.forEach(function (item) { item.el.style.color = item.active; });
            },
            onLeaveBack: function () {
              wordItems.forEach(function (item) { item.el.style.color = item.base; });
            }
          }
        });

        lines.forEach(function (lineWords) {
          var lineSpans = lineWords.map(function (item) { return item.el; });
          tl.to(lineSpans, {
            color: function (i) { return lineWords[i].active; },
            stagger: {
              each: isChars ? 0.08 : 0.04,
              from: 'start'
            },
            ease: 'none',
            duration: Math.max(0.3, lineWords.length * (isChars ? 0.08 : 0.04))
          });
        });

        el._scrubTimeline = tl;
      }

      var resizeTimer;
      window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
          parsedList.forEach(function (entry) {
            buildElementTimeline(entry.el, entry.wordItems);
          });
          safeScrollTriggerRefresh();
        }, 200);
      }, { passive: true });
    };
    initScrollTextScrub();

    gsap.from('.hero-h1 .line span', { yPercent: 100, duration: 1.0, ease: 'power4.out', stagger: 0.08 });

    document.querySelectorAll('[data-count-to]').forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-count-to')) || 0;
      var obj = { val: 0 };
      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        once: true,
        onEnter: function () {
          gsap.to(obj, { val: target, duration: 1.4, ease: 'power2.out', onUpdate: function () { el.textContent = Math.round(obj.val); } });
        }
      });
    });

    safeScrollTriggerRefresh();
    window.addEventListener('resize', safeScrollTriggerRefresh, { passive: true });
    // main.js can now start after the page's load event (index.html runs it after the first paint)
    if (document.readyState === 'complete') {
      safeScrollTriggerRefresh();
    } else {
      window.addEventListener('load', safeScrollTriggerRefresh, { passive: true });
    }
  } else {
    document.querySelectorAll('[data-count-to]').forEach(function (el) { el.textContent = el.getAttribute('data-count-to'); });
  }

  document.querySelectorAll('.possibility-float-card').forEach(function (floatCard) {
    var slides = floatCard.querySelectorAll('.possibility-slide');
    var dots = floatCard.querySelectorAll('.slide-dot');
    if (!slides.length) return;

    var currentIdx = 0;
    var timer = null;

    function showSlide(idx) {
      currentIdx = (idx + slides.length) % slides.length;
      slides.forEach(function (s, i) {
        s.classList.toggle('active', i === currentIdx);
      });
      dots.forEach(function (d, i) {
        d.classList.toggle('active', i === currentIdx);
      });
    }

    function nextSlide() {
      showSlide(currentIdx + 1);
    }

    function startTimer() {
      if (timer) clearInterval(timer);
      timer = setInterval(nextSlide, 2800);
    }

    function stopTimer() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    // Initial state
    showSlide(0);
    startTimer();

    // Click to manually jump to next image
    floatCard.addEventListener('click', function (e) {
      e.preventDefault();
      nextSlide();
      startTimer();
    });

    floatCard.addEventListener('mouseenter', function () {
      stopTimer();
    });
    floatCard.addEventListener('mouseleave', function () {
      startTimer();
    });
  });

  /* ---------------- Parallax hero cards ---------------- */
  var heroSection = document.getElementById('hero');
  if (!reducedMotion && heroSection) {
    var parallaxEls = [].slice.call(document.querySelectorAll('[data-parallax]'));
    heroSection.addEventListener('mousemove', function (e) {
      var rect = heroSection.getBoundingClientRect();
      var px = (e.clientX - rect.left) / rect.width - .5;
      var py = (e.clientY - rect.top) / rect.height - .5;
      parallaxEls.forEach(function (el) {
        var strength = parseFloat(el.getAttribute('data-parallax')) || 10;
        el.style.transform = (el.style.transform || '').replace(/translate3d\([^)]*\)/, '');
        el.style.transform = 'translate3d(' + (px * strength) + 'px,' + (py * strength) + 'px,0)';
      });
    });
  }

  /* ---------------- Task scheduler to avoid main-thread blocking (>50ms) ---------------- */
  function scheduleTask(fn) {
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(fn);
    } else {
      setTimeout(fn, 60);
    }
  }

  /* ---------------- Deferred Secondary & Below-The-Fold Enhancements ---------------- */
  function initCardInteractions() {
    /* ---------------- Tilt on service cards ---------------- */
    if (!reducedMotion) {
      document.querySelectorAll('[data-tilt]').forEach(function (card) {
        card.addEventListener('mousemove', function (e) {
          var r = card.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width - .5;
          var py = (e.clientY - r.top) / r.height - .5;
          card.style.transform = 'perspective(800px) rotateX(' + (py * -4) + 'deg) rotateY(' + (px * 4) + 'deg) translateY(-2px)';
        });
        card.addEventListener('mouseleave', function () { card.style.transform = ''; });
      });
    }

    /* ---------------- Spotlight & 3D Tilt on Showcase Cards ---------------- */
    document.querySelectorAll('.showcase-card').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var x = e.clientX - r.left;
        var y = e.clientY - r.top;
        card.style.setProperty('--mouse-x', x + 'px');
        card.style.setProperty('--mouse-y', y + 'px');
        if (!reducedMotion) {
          var px = (x / r.width - 0.5);
          var py = (y / r.height - 0.5);
          card.style.transform = 'perspective(1000px) rotateX(' + (py * -3.5) + 'deg) rotateY(' + (px * 3.5) + 'deg) scale3d(1.01, 1.01, 1.01)';
        }
      });
      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
      });
    });

    /* ---------------- Magnetic buttons ---------------- */
    if (!reducedMotion && window.gsap) {
      document.querySelectorAll('.magnetic').forEach(function (btn) {
        var xTo = gsap.quickTo(btn, 'x', { duration: .5, ease: 'power3' });
        var yTo = gsap.quickTo(btn, 'y', { duration: .5, ease: 'power3' });
        btn.addEventListener('mousemove', function (e) {
          var r = btn.getBoundingClientRect();
          xTo((e.clientX - r.left - r.width / 2) * .3);
          yTo((e.clientY - r.top - r.height / 2) * .3);
        });
        btn.addEventListener('mouseleave', function () { xTo(0); yTo(0); });
      });
    }

    /* ---------------- Scroll cue bob ---------------- */
    if (!reducedMotion && window.gsap) {
      var scrollCue = document.getElementById('scroll-cue');
      if (scrollCue) {
        gsap.to(scrollCue, { y: 8, duration: 1, repeat: -1, yoyo: true, ease: 'sine.inOut' });
      }
    }
  }

  /* ---------------- Disciplines Interactive Hover & Preview Animations ---------------- */
  function initDisciplinesSection() {
    var section = document.getElementById('four-disciplines');
    if (!section) return;
    var rows = Array.prototype.slice.call(section.querySelectorAll('.service-row'));
    if (!rows.length) return;

    var isFinePointer = window.matchMedia('(min-width: 1024px) and (hover: hover) and (pointer: fine)');
    var prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)');

    var glow1 = document.getElementById('disciplines-glow-1');
    var glow2 = document.getElementById('disciplines-glow-2');

    // Ambient glow colors per discipline
    var glowColors = [
      { c1: 'rgba(255, 110, 15, 0.16)', c2: 'rgba(255, 110, 15, 0.08)' }, // 01 3D & CGI
      { c1: 'rgba(255, 55, 10, 0.18)', c2: 'rgba(255, 55, 10, 0.09)' },  // 02 Animation
      { c1: 'rgba(255, 130, 40, 0.16)', c2: 'rgba(255, 130, 40, 0.08)' }, // 03 AR / VR
      { c1: 'rgba(255, 75, 10, 0.15)', c2: 'rgba(255, 75, 10, 0.07)' },  // 04 Web & Brand
      { c1: 'rgba(255, 90, 10, 0.17)', c2: 'rgba(255, 90, 10, 0.08)' }   // 05 AI
    ];

    function activateRow(row, idx) {
      rows.forEach(function (r) { r.classList.remove('is-active'); });
      row.classList.add('is-active');

      if (glow1 && glow2 && glowColors[idx] && !prefersReduce.matches) {
        glow1.style.backgroundColor = glowColors[idx].c1;
        glow2.style.backgroundColor = glowColors[idx].c2;
      }
    }

    function checkReady() {
      if (isFinePointer.matches && !prefersReduce.matches) {
        section.classList.add('disciplines-ready');
        if (!rows.some(function (r) { return r.classList.contains('is-active'); })) {
          activateRow(rows[0], 0);
        }
      } else {
        section.classList.remove('disciplines-ready');
        rows.forEach(function (r) { r.classList.remove('is-active'); });
      }
    }
    checkReady();
    isFinePointer.addEventListener('change', checkReady);
    prefersReduce.addEventListener('change', checkReady);

    // Scroll-triggered stagger entrance for rows
    if (window.gsap && window.ScrollTrigger && !prefersReduce.matches) {
      gsap.fromTo(rows,
        { opacity: 0, y: 36 },
        {
          opacity: 1,
          y: 0,
          duration: 0.85,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '#four-disciplines',
            start: 'top 78%',
            once: true
          }
        }
      );
    }

    rows.forEach(function (row, idx) {
      var preview = row.querySelector('.service-inline-preview');

      row.addEventListener('pointerenter', function () {
        if (!isFinePointer.matches || prefersReduce.matches) return;
        activateRow(row, idx);
      });

      row.addEventListener('focusin', function () {
        activateRow(row, idx);
      });

      if (!prefersReduce.matches && preview) {
        row.addEventListener('mousemove', function (e) {
          if (!row.classList.contains('is-active')) return;
          var rect = preview.getBoundingClientRect();
          var px = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
          var py = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);

          px = Math.max(-1, Math.min(1, px));
          py = Math.max(-1, Math.min(1, py));

          preview.style.transform = 'perspective(900px) rotateZ(3.5deg) rotateX(' + (py * -6) + 'deg) rotateY(' + (px * 6) + 'deg) scale3d(1.02, 1.02, 1.02)';
        });

        row.addEventListener('mouseleave', function () {
          if (isFinePointer.matches) {
            preview.style.transform = '';
          }
        });
      }

      var servicePages = {
        '1': 'services/3d-product-visualization',
        '2': 'services/product-animation',
        '3': 'services/ar-vr-experiences',
        '4': 'services/website-design',
        '5': 'services/generative-ai'
      };
      var servicePage = servicePages[row.getAttribute('data-discipline')];
      if (servicePage) {
        row.addEventListener('click', function (e) {
          if (!e.target.closest('a')) {
            window.location.href = servicePage;
          }
        });
      }
    });

  /* ---------------- AI Studio Pinned Scroll (LED BY HUMAN · SCALED BY AI) ---------------- */
  (function initAiStudioPin() {
    var section = document.getElementById('ai-studio');
    var pinWrap = document.getElementById('ai-studio-pin');
    var rightPanel = document.getElementById('ai-right-panel');
    var rightPanelInner = document.getElementById('ai-right-panel-inner');
    var steps = Array.prototype.slice.call(document.querySelectorAll('.ai-step'));
    var rows = Array.prototype.slice.call(document.querySelectorAll('.ai-service-row'));
    if (!section || !pinWrap || !rightPanel || !rightPanelInner || !steps.length || !rows.length) return;
    if (!(window.gsap && window.ScrollTrigger)) return;

    gsap.registerPlugin(ScrollTrigger);

    var stepParts = steps.map(function (step) {
      return {
        el: step,
        dot: step.querySelector('.rounded-full'),
        texts: Array.prototype.slice.call(step.querySelectorAll('p'))
      };
    });

    var INACTIVE_DOT_BORDER = '#BDB7AE';
    var INACTIVE_NUM_COLOR = '#BDB7AE';
    var INACTIVE_LABEL_COLOR = 'rgba(21, 18, 16, 0.5)';

    function setStep(idx) {
      stepParts.forEach(function (part, i) {
        var active = i === idx;
        if (part.dot) {
          part.dot.style.borderColor = active ? 'var(--brand)' : INACTIVE_DOT_BORDER;
          part.dot.style.backgroundColor = active ? 'var(--brand)' : 'transparent';
        }
        if (part.texts[0]) part.texts[0].style.color = active ? 'var(--brand)' : INACTIVE_NUM_COLOR;
        if (part.texts[1]) part.texts[1].style.color = active ? '' : INACTIVE_LABEL_COLOR;
        part.el.classList.toggle('is-active', active);
      });
      var rowIdx = Math.min(idx - 1, rows.length - 1);
      rows.forEach(function (row, i) {
        row.classList.toggle('is-active', i === rowIdx);
      });
    }

    var mm = gsap.matchMedia();
    mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', function () {
      section.classList.add('ai-pin-ready');
      setStep(0);

      var st = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: function () {
          var overflow = Math.max(rightPanelInner.scrollHeight - rightPanel.clientHeight, 0);
          return '+=' + (overflow + 500);
        },
        pin: pinWrap,
        pinSpacing: true,
        scrub: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: function (self) {
          var overflow = Math.max(rightPanelInner.scrollHeight - rightPanel.clientHeight, 0);
          gsap.set(rightPanelInner, { y: -self.progress * overflow });
          var idx = Math.round(self.progress * (steps.length - 1));
          setStep(idx);
        }
      });

      return function () {
        st.kill();
        section.classList.remove('ai-pin-ready');
        gsap.set(rightPanelInner, { clearProps: 'transform' });
        setStep(0);
      };
    });
  })();
}

  /* ---------------- Studio Stats & Contact Form Enhancements ---------------- */
  function initStudioAndForm() {
    /* ---------------- Stats Countup Animation ---------------- */
    var countElements = Array.prototype.slice.call(document.querySelectorAll('.countup'));
    if (countElements.length && window.ScrollTrigger && window.gsap) {
      ScrollTrigger.create({
        trigger: '#studio',
        start: 'top 80%',
        once: true,
        onEnter: function () {
          countElements.forEach(function (el) {
            var target = parseInt(el.getAttribute('data-count-to') || el.textContent || '0', 10);
            var obj = { val: 0 };
            gsap.to(obj, {
              val: target,
              duration: 1.6,
              ease: 'power2.out',
              onUpdate: function () {
                el.textContent = Math.round(obj.val);
              }
            });
          });
        }
      });
    }

  /* ---------------- Contact form ---------------- */
  var form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = document.getElementById('form-status');
      var submitBtn = document.getElementById('submit-btn') || form.querySelector('button[type="submit"]');
      var submitText = document.getElementById('submit-btn-text');
      var originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';

      var name = form.name ? form.name.value.trim() : '';
      var email = form.email ? form.email.value.trim() : '';
      var company = form.company ? form.company.value.trim() : '';
      var product = form.product ? form.product.value : '';
      var need = form.need ? form.need.value.trim() : '';

      function setStatus(msg, isSuccess) {
        if (!status) return;
        status.textContent = msg;
        status.className = isSuccess
          ? 'mt-4 text-sm font-semibold text-emerald-600'
          : 'mt-4 text-sm font-semibold text-brand';
        status.classList.remove('hidden');
      }

      if (!name || !need) {
        setStatus('Please fill in your name and project details.', false);
        return;
      }

      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setStatus('Please enter a valid email address.', false);
        return;
      }

      // UI: Disable submit button & indicate progress
      if (submitBtn) {
        submitBtn.disabled = true;
        if (submitText) {
          submitText.textContent = 'Sending...';
        } else {
          submitBtn.innerHTML = 'Sending...';
        }
      }
      setStatus('Sending your enquiry...', true);

      var payload = {
        name: name,
        email: email,
        company: company || '-',
        product: product || 'General Enquiry',
        need: need,
        _subject: 'New Project Enquiry: ' + name + (company && company !== '-' ? ' (' + company + ')' : ''),
        _template: 'table',
        _captcha: 'false',
        _cc: 'sasi@supermajor.in'
      };

      // Fallback: mailto link directly addressed to business@supermajor.in (with CC to sasi@supermajor.in)
      function fallbackToMailto() {
        var subject = encodeURIComponent('New project enquiry - ' + name);
        var body = encodeURIComponent(
          'Name: ' + name + '\n' +
          (email ? 'Email: ' + email + '\n' : '') +
          'Company: ' + (company || '-') + '\n' +
          'Interested in: ' + (product || 'General Enquiry') + '\n\n' +
          need
        );
        window.location.href = 'mailto:business@supermajor.in?cc=sasi@supermajor.in&subject=' + subject + '&body=' + body;
        setStatus('We could not send this automatically. Your email app should open with the message ready. If it does not, please email business@supermajor.in.', false);
      }

      // 1. Try server PHP endpoint first (for Apache/GoDaddy live hosting)
      fetch('contact.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          if (res.ok) return res.json();
          throw new Error('PHP endpoint returned ' + res.status);
        })
        .then(function (data) {
          if (data && data.success) {
            setStatus('Thank you! Your message has been sent. We\'ll get back to you shortly.', true);
            form.reset();
          } else {
            throw new Error((data && data.message) || 'Server error');
          }
        })
        .catch(function () {
          // 2. Fallback to FormSubmit AJAX endpoint (works on static previews and hosting)
          return fetch('https://formsubmit.co/ajax/business@supermajor.in', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
          })
            .then(function (res) {
              return res.json();
            })
            .then(function (data) {
              if (data && (data.success === true || data.success === 'true')) {
                setStatus('Thank you! Your message has been sent. We\'ll get back to you shortly.', true);
                form.reset();
              } else if (data && data.message && data.message.toLowerCase().includes('activation')) {
                setStatus('Activation required: FormSubmit sent a one-time activation link to business@supermajor.in. Please check your inbox or Spam/Junk folder and click "Activate Form" to begin receiving messages.', false);
              } else {
                throw new Error((data && data.message) || 'Submission failed');
              }
            })
            .catch(function () {
              // 3. Last-resort fallback to mailto:business@supermajor.in
              fallbackToMailto();
            });
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            if (originalBtnHtml) {
              submitBtn.innerHTML = originalBtnHtml;
            } else if (submitText) {
              submitText.textContent = 'Send it over';
            }
          }
        });
    });

    [].slice.call(form.querySelectorAll('input,textarea,select')).forEach(function (field) {
      field.addEventListener('input', function () {
        var status = document.getElementById('form-status');
        if (status && !status.textContent.includes('Thank you')) {
          status.classList.add('hidden');
        }
      });
    });
  }

  /* ---------------- Local time (Chennai, IST) ---------------- */
  function updateTime() {
    var el = document.getElementById('local-time');
    if (!el) return;
    try {
      el.textContent = new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' }).format(new Date());
    } catch (e) { el.textContent = new Date().toLocaleTimeString(); }
  }
    updateTime(); setInterval(updateTime, 30000);
  }

  /* ---------------- Media, 3D Canvas & Interactive Tooltips ---------------- */
  function initMediaAndTooltips() {
    /* ---------------- Three.js hero scene ---------------- */
    (function () {
    var canvas = document.getElementById('hero-canvas');
    if (!canvas || !window.THREE) return;
    var section = document.getElementById('hero');

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 8);

    var group = new THREE.Group();
    scene.add(group);

    var icoGeo = new THREE.IcosahedronGeometry(2.1, 1);
    var icoMat = new THREE.MeshBasicMaterial({ color: 0xE8400A, wireframe: true, transparent: true, opacity: 0.55 });
    var ico = new THREE.Mesh(icoGeo, icoMat);
    group.add(ico);

    var innerGeo = new THREE.IcosahedronGeometry(1.35, 0);
    var innerMat = new THREE.MeshBasicMaterial({ color: 0xF5F1EB, wireframe: true, transparent: true, opacity: 0.18 });
    var inner = new THREE.Mesh(innerGeo, innerMat);
    group.add(inner);

    // particle ring
    var particleCount = 260;
    var positions = new Float32Array(particleCount * 3);
    for (var i = 0; i < particleCount; i++) {
      var r = 3.2 + Math.random() * 0.6;
      var theta = Math.random() * Math.PI * 2;
      var phi = Math.acos((Math.random() * 2) - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    var particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var particleMat = new THREE.PointsMaterial({ color: 0xF5F1EB, size: 0.035, transparent: true, opacity: 0.5 });
    var particles = new THREE.Points(particleGeo, particleMat);
    group.add(particles);

    function resize() {
      var w = section.clientWidth, h = section.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);

    var mouseX = 0, mouseY = 0;
    section.addEventListener('mousemove', function (e) {
      var r = section.getBoundingClientRect();
      mouseX = ((e.clientX - r.left) / r.width - .5) * 2;
      mouseY = ((e.clientY - r.top) / r.height - .5) * 2;
    });

    var visible = false;
    var animId = null;
    var clock = new THREE.Clock();
    function animate() {
      if (!visible) {
        animId = null;
        return;
      }
      animId = requestAnimationFrame(animate);
      var t = clock.getElapsedTime();
      if (!reducedMotion) {
        ico.rotation.y = t * 0.12;
        ico.rotation.x = t * 0.06;
        inner.rotation.y = -t * 0.18;
        particles.rotation.y = t * 0.04;
        group.rotation.y += (mouseX * 0.3 - group.rotation.y) * 0.03;
        group.rotation.x += (-mouseY * 0.2 - group.rotation.x) * 0.03;
      }
      renderer.render(scene, camera);
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible && !animId) {
          animId = requestAnimationFrame(animate);
        }
      }, { threshold: 0.05 }).observe(section);
    } else {
      visible = true;
      animate();
    }
  })();

  /* ---------------- Studio Reel & Video Playback Controllers ---------------- */
  (function initStudioVideos() {
    // 1. Hero floating card video
    var cardSoundBtn = document.getElementById('hero-sound-toggle');
    var cardVideo = document.getElementById('hero-card-video');
    var cardSoundIcon = document.getElementById('sound-icon');
    var cardSoundText = document.getElementById('sound-text');

    if (cardSoundBtn && cardVideo) {
      var isCardMuted = true;
      cardSoundBtn.addEventListener('click', function () {
        isCardMuted = !isCardMuted;
        cardVideo.muted = isCardMuted;
        if (cardSoundIcon) {
          cardSoundIcon.setAttribute('icon', isCardMuted ? 'solar:volume-cross-linear' : 'solar:volume-loud-linear');
        }
        if (cardSoundText) {
          cardSoundText.textContent = isCardMuted ? 'Sound off' : 'Sound on';
        }
      });
    }

    // 2. Full-screen Studio Reel Hero Video
    var fullVideo = document.getElementById('fullwidth-reel-video');
    var reelSoundBtn = document.getElementById('reel-sound-toggle');
    var reelSoundIcon = document.getElementById('reel-sound-icon');
    var reelSoundText = document.getElementById('reel-sound-text');
    var quickSoundBtn = document.getElementById('hero-sound-quick-toggle');
    var quickSoundIcon = document.getElementById('hero-quick-sound-icon');
    var quickSoundText = document.getElementById('hero-quick-sound-text');

    var reelPlayBtn = document.getElementById('reel-play-toggle');
    var reelPlayIcon = document.getElementById('reel-play-icon');
    var reelBarPlayBtn = document.getElementById('reel-play-bar-btn');
    var reelBarPlayIcon = document.getElementById('reel-bar-play-icon');
    var reelBarPlayText = document.getElementById('reel-bar-play-text');

    var reelFsBtn = document.getElementById('reel-fs-toggle');
    var curTimeEl = document.getElementById('reel-current-time');
    var durTimeEl = document.getElementById('reel-duration-time');
    var progBar = document.getElementById('reel-progress-bar');
    var progTrack = document.getElementById('reel-progress-track');

    function formatTime(s) {
      if (isNaN(s) || s < 0) s = 0;
      var m = Math.floor(s / 60);
      var sec = Math.floor(s % 60);
      return (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
    }

    if (fullVideo) {
      var isFullMuted = true;
      function setMuteState(muted) {
        isFullMuted = muted;
        fullVideo.muted = isFullMuted;
        if (reelSoundIcon) {
          reelSoundIcon.setAttribute('icon', isFullMuted ? 'solar:volume-cross-linear' : 'solar:volume-loud-linear');
        }
        if (reelSoundText) {
          reelSoundText.textContent = isFullMuted ? 'Sound off' : 'Sound on';
        }
        if (quickSoundIcon) {
          quickSoundIcon.setAttribute('icon', isFullMuted ? 'solar:volume-cross-linear' : 'solar:volume-loud-linear');
        }
        if (quickSoundText) {
          quickSoundText.textContent = isFullMuted ? 'Turn sound on' : 'Mute sound';
        }
      }

      if (reelSoundBtn) {
        reelSoundBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          setMuteState(!isFullMuted);
        });
      }
      if (quickSoundBtn) {
        quickSoundBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          setMuteState(!isFullMuted);
        });
      }

      function togglePlayback() {
        if (fullVideo.paused) {
          fullVideo.play();
          if (reelPlayIcon) reelPlayIcon.setAttribute('icon', 'solar:pause-bold');
          if (reelBarPlayIcon) reelBarPlayIcon.setAttribute('icon', 'solar:pause-bold');
          if (reelBarPlayText) reelBarPlayText.textContent = 'Pause';
        } else {
          fullVideo.pause();
          if (reelPlayIcon) reelPlayIcon.setAttribute('icon', 'solar:play-bold');
          if (reelBarPlayIcon) reelBarPlayIcon.setAttribute('icon', 'solar:play-bold');
          if (reelBarPlayText) reelBarPlayText.textContent = 'Play';
        }
      }

      if (reelPlayBtn) reelPlayBtn.addEventListener('click', togglePlayback);
      if (reelBarPlayBtn) reelBarPlayBtn.addEventListener('click', togglePlayback);

      // Time update & Progress Scrubber
      fullVideo.addEventListener('timeupdate', function () {
        if (fullVideo.duration) {
          var pct = (fullVideo.currentTime / fullVideo.duration) * 100;
          if (progBar) progBar.style.width = pct + '%';
          if (curTimeEl) curTimeEl.textContent = formatTime(fullVideo.currentTime);
          if (durTimeEl && durTimeEl.textContent === '00:15') durTimeEl.textContent = formatTime(fullVideo.duration);
        }
      });

      fullVideo.addEventListener('loadedmetadata', function () {
        if (durTimeEl) durTimeEl.textContent = formatTime(fullVideo.duration);
      });

      if (progTrack) {
        progTrack.addEventListener('click', function (e) {
          var rect = progTrack.getBoundingClientRect();
          var clickPos = (e.clientX - rect.left) / rect.width;
          if (fullVideo.duration) {
            fullVideo.currentTime = clickPos * fullVideo.duration;
          }
        });
      }

      // Fullscreen Toggle
      if (reelFsBtn) {
        reelFsBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          var heroEl = document.getElementById('hero');
          var target = heroEl || fullVideo;
          if (!document.fullscreenElement) {
            if (target.requestFullscreen) target.requestFullscreen();
            else if (target.webkitRequestFullscreen) target.webkitRequestFullscreen();
          } else {
            if (document.exitFullscreen) document.exitFullscreen();
          }
        });
      }

      // Auto-pause when scrolled out of viewport
      if ('IntersectionObserver' in window) {
        var reelObserver = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) {
              if (!fullVideo.paused) fullVideo.pause();
            } else {
              fullVideo.play().catch(function () { });
            }
          });
        }, { threshold: 0.15 });
        reelObserver.observe(fullVideo);
      }
    }

    // Ensure card video autoplays reliably
    if (cardVideo) {
      var playPromise = cardVideo.play();
      if (playPromise !== undefined) {
        playPromise.catch(function () {
          cardVideo.muted = true;
          cardVideo.play().catch(function () {});
        });
      }
    }

    // Lazy-load below-the-fold videos with data-src
    if ('IntersectionObserver' in window) {
      var lazyVideos = [].slice.call(document.querySelectorAll('video.lazy-video'));
      var lazyObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var video = entry.target;
            // Poster images of below-the-fold cards are loaded here too (data-poster), so they
            // don't compete with the hero for bandwidth during the first load.
            if (video.dataset.poster && !video.getAttribute('poster')) {
              video.setAttribute('poster', video.dataset.poster);
            }
            if (video.dataset.src && !video.src) {
              video.src = video.dataset.src;
              video.load();
              video.play().catch(function () {});
            }
            lazyObserver.unobserve(video);
          }
        });
      }, { rootMargin: '300px 0px' });
      lazyVideos.forEach(function (v) { lazyObserver.observe(v); });
    }
  })();

  /* ---------------- Showcase Card Click Navigation ---------------- */
  (function initShowcaseCardClicks() {
    var cards = document.querySelectorAll('.showcase-card');
    if (!cards.length) return;

    cards.forEach(function (card) {
      card.addEventListener('click', function (e) {
        var href = card.getAttribute('href');
        if (href && href.startsWith('#')) {
          e.preventDefault();
          var targetId = href.substring(1);
          var targetEl = document.getElementById(targetId);
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            try {
              history.pushState(null, '', href);
            } catch (err) { }
          }

          var discIdx = card.getAttribute('data-discipline-index');
          if (discIdx !== null) {
            var rows = document.querySelectorAll('#four-disciplines .service-row');
            var idx = parseInt(discIdx, 10);
            if (rows[idx]) {
              rows.forEach(function (r) { r.classList.remove('is-active'); });
              rows[idx].classList.add('is-active');
            }
          }
        }
      });
    });
  })();

  /* ---------------- Mouse-following "OPEN" Circle Cursor (Showcase Section Only) ---------------- */
  (function initShowcaseOpenCursor() {
    var tooltip = document.getElementById('service-cursor-tooltip');
    if (!tooltip) return; // Only exists on index.html

    var sectionCards = document.querySelectorAll('#concept-showcase .showcase-card, .showcase-card, .work-card-img-wrap');
    if (!sectionCards.length) return;

    var isHovered = false;
    var xTo = null;
    var yTo = null;
    var currentX = -200;
    var currentY = -200;
    var targetX = -200;
    var targetY = -200;
    var rafId = null;

    if (window.gsap) {
      xTo = gsap.quickTo(tooltip, 'x', { duration: 0.15, ease: 'power3.out' });
      yTo = gsap.quickTo(tooltip, 'y', { duration: 0.15, ease: 'power3.out' });
    }

    function renderPos() {
      currentX += (targetX - currentX) * 0.35;
      currentY += (targetY - currentY) * 0.35;
      tooltip.style.transform = 'translate3d(' + currentX.toFixed(2) + 'px, ' + currentY.toFixed(2) + 'px, 0)';
      if (isHovered || Math.abs(targetX - currentX) > 0.5 || Math.abs(targetY - currentY) > 0.5) {
        rafId = requestAnimationFrame(renderPos);
      } else {
        rafId = null;
      }
    }

    function updatePos(e) {
      var radius = 41; // half of 82px circle
      var x = e.clientX - radius;
      var y = e.clientY - radius;

      if (xTo && yTo) {
        xTo(x);
        yTo(y);
      } else {
        targetX = x;
        targetY = y;
        if (!rafId) {
          rafId = requestAnimationFrame(renderPos);
        }
      }
    }

    sectionCards.forEach(function (card) {
      function activate(e) {
        document.body.classList.add('showcase-hovered');
        var radius = 41;
        var startX = e.clientX - radius;
        var startY = e.clientY - radius;

        if (window.gsap) {
          gsap.set(tooltip, { x: startX, y: startY });
        } else {
          currentX = startX;
          currentY = startY;
          targetX = startX;
          targetY = startY;
          tooltip.style.transform = 'translate3d(' + startX.toFixed(2) + 'px, ' + startY.toFixed(2) + 'px, 0)';
        }

        isHovered = true;
        tooltip.classList.add('is-active');
      }

      card.addEventListener('mouseenter', function (e) {
        activate(e);
      });

      card.addEventListener('mousemove', function (e) {
        if (!isHovered) {
          activate(e);
        }
        updatePos(e);
      }, { passive: true });

      card.addEventListener('mouseleave', function (e) {
        if (e.relatedTarget && card.contains(e.relatedTarget)) return;
        document.body.classList.remove('showcase-hovered');
        isHovered = false;
        tooltip.classList.remove('is-active');
      });
    });
  })();

  /* ---------------- Project Card Hover Preview (follows cursor, Work page) ---------------- */
  (function initProjectCardPreview() {
    var previewEl = document.getElementById('card-preview');
    var videoEl = document.getElementById('card-preview-video');
    var imgEl = document.getElementById('card-preview-img');
    var cards = [].slice.call(document.querySelectorAll('.project-card:not([data-no-hover])'));
    if (!previewEl || !videoEl || !imgEl || !cards.length) return;
    if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return;

    var mouseX = 0, mouseY = 0;
    var posX = 0, posY = 0;
    var active = false;
    var activeCard = null;
    var rafId = null;
    var OFFSET_X = 28;
    var OFFSET_Y = -34;

    function render() {
      if (reducedMotion) {
        posX = mouseX;
        posY = mouseY;
      } else {
        posX += (mouseX - posX) * 0.22;
        posY += (mouseY - posY) * 0.22;
      }
      previewEl.style.transform = 'translate3d(' + (posX + OFFSET_X).toFixed(1) + 'px, ' + (posY + OFFSET_Y).toFixed(1) + 'px, 0)';
      if (active) {
        rafId = requestAnimationFrame(render);
      } else {
        rafId = null;
      }
    }

    function ensureLoop() {
      if (!rafId) rafId = requestAnimationFrame(render);
    }

    function showPreview(card) {
      var videoSrc = card.getAttribute('data-video');
      var cardImg = card.querySelector('.project-image-mask img');

      videoEl.classList.remove('is-active');
      imgEl.classList.remove('is-active');
      videoEl.pause();
      videoEl.removeAttribute('src');
      videoEl.load();

      if (videoSrc) {
        videoEl.src = videoSrc;
        videoEl.play().catch(function () { });
        videoEl.classList.add('is-active');
      } else if (cardImg) {
        imgEl.src = cardImg.currentSrc || cardImg.src;
        imgEl.classList.add('is-active');
      } else {
        return;
      }

      posX = mouseX;
      posY = mouseY;
      previewEl.style.transform = 'translate3d(' + (posX + OFFSET_X).toFixed(1) + 'px, ' + (posY + OFFSET_Y).toFixed(1) + 'px, 0)';

      active = true;
      activeCard = card;
      previewEl.classList.add('is-visible');
      ensureLoop();
    }

    function hidePreview() {
      active = false;
      activeCard = null;
      previewEl.classList.remove('is-visible');
      videoEl.pause();
    }

    cards.forEach(function (card) {
      card.addEventListener('mouseenter', function () { showPreview(card); }, { passive: true });
      card.addEventListener('mouseleave', hidePreview, { passive: true });
    });

    document.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }, { passive: true });

    // Scrolling never fires mouseenter/mouseleave (the mouse itself hasn't
    // moved), yet the content sliding underneath a stationary cursor changes
    // which card, if any, is actually under it. So on every scroll, re-check
    // what's really at the last known cursor position: show/switch to that
    // card if it's a project card, or hide if it isn't.
    function syncToScroll() {
      var el = document.elementFromPoint(mouseX, mouseY);
      var cardUnderCursor = el && el.closest ? el.closest('.project-card:not([data-no-hover])') : null;
      if (cardUnderCursor) {
        if (cardUnderCursor !== activeCard) showPreview(cardUnderCursor);
      } else if (active) {
        hidePreview();
      }
    }
    window.addEventListener('scroll', syncToScroll, { passive: true });
    if (lenis && lenis.on) {
      lenis.on('scroll', syncToScroll);
    }
  })();



  /* ---------------- Concept Showcase - Stacked Sticky Cards Scrolling Animation ---------------- */
  (function initStackedStickyCards() {
    var container = document.getElementById('concept-showcase');
    if (!container) return;

    var cards = [].slice.call(container.querySelectorAll('.concept-stack-card'));
    if (cards.length < 2) return;

    if (!window.gsap || !window.ScrollTrigger || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    cards.forEach(function (card, index) {
      var inner = card.querySelector('.concept-card-inner');
      if (!inner) return;

      // Scale down and dim when the next card scrolls up over it
      var nextCard = cards[index + 1];
      if (nextCard) {
        gsap.to(inner, {
          scale: 0.94,
          ease: 'none',
          scrollTrigger: {
            trigger: nextCard,
            start: 'top 85%',
            end: 'top 15%',
            scrub: 0.3,
            invalidateOnRefresh: true
          }
        });
      }

      // Scale down further if there's a card 2 positions ahead (e.g. Card 1 when Card 3 arrives)
      var nextNextCard = cards[index + 2];
      if (nextNextCard) {
        gsap.to(inner, {
          scale: 0.88,
          ease: 'none',
          scrollTrigger: {
            trigger: nextNextCard,
            start: 'top 85%',
            end: 'top 15%',
            scrub: 0.3,
            invalidateOnRefresh: true
          }
        });
      }
    });

    // The last card has no following card to shrink for. Apply the same
    // scale-down/cover treatment, triggered by the element immediately
    // after the stack (not the distant Studio section) so its timing
    // matches the tight card-to-card handoff cards 1 and 2 use.
    var lastCard = cards[cards.length - 1];
    var lastInner = lastCard && lastCard.querySelector('.concept-card-inner');
    var nextSection = document.getElementById('concept-showcase-end');
    if (lastInner && nextSection) {
      gsap.to(lastInner, {
        scale: 0.94,
        ease: 'none',
        scrollTrigger: {
          trigger: nextSection,
          start: 'top 85%',
          end: 'top 15%',
          scrub: 0.3,
          invalidateOnRefresh: true
        }
      });
    }
  })();

  } // end initMediaAndTooltips

  /* ---------------- Lazy Hero Video Loader (Saves 2.2MB on initial page load) ---------------- */
  var _heroVideoLoaded = false;
  function loadHeroVideo() {
    if (_heroVideoLoaded) return;
    _heroVideoLoaded = true;
    var fullVideo = document.getElementById('fullwidth-reel-video');
    if (fullVideo) {
      if (fullVideo.dataset.src && !fullVideo.src) {
        fullVideo.src = fullVideo.dataset.src;
        fullVideo.load();
      }
      var playPromise = fullVideo.play();
      if (playPromise !== undefined) {
        playPromise.catch(function () {
          fullVideo.muted = true;
          fullVideo.play().catch(function () {});
        });
      }
    }
  }
  ['scroll', 'pointerdown', 'touchstart', 'keydown'].forEach(function (e) {
    window.addEventListener(e, loadHeroVideo, { once: true, passive: true });
  });

  /* ---------------- Orchestrated Deferred Startup (Runs after page load to prevent Long Tasks) ---------------- */
  function setupWorkStack() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    const workCards = document.querySelectorAll('.work-cl-wrapper');
    if (!workCards.length) return;

    const topOffset = window.innerWidth <= 768 ? 70 : 90;

    workCards.forEach((card, index) => {
      if (index < workCards.length - 1) {
        ScrollTrigger.create({
          trigger: card,
          start: 'top top+=' + topOffset,
          end: 'bottom top+=' + topOffset,
          scrub: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const scale = 1 - (self.progress * 0.05);
            const brightness = 1 - (self.progress * 0.35);

            const innerCard = card.querySelector('.work-card-wrap');
            if (innerCard) {
              innerCard.style.transform = `scale(${scale})`;
            }

            const imgWrap = card.querySelector('.work-card-img-wrap');
            if (imgWrap) {
              imgWrap.style.filter = `brightness(${brightness})`;
            }

            const metaWrap = card.querySelector('.work-card-meta');
            if (metaWrap) {
              metaWrap.style.opacity = Math.max(0, 1 - (self.progress * 2));
            }
          }
        });
      }
    });
  }

  function runDeferredStartup() {
    scheduleTask(initCardInteractions);
    scheduleTask(initDisciplinesSection);
    scheduleTask(initStudioAndForm);
    scheduleTask(initMediaAndTooltips);
    scheduleTask(setupWorkStack);
  }

  if (document.readyState === 'complete') {
    runDeferredStartup();
  } else {
    window.addEventListener('load', function () {
      setTimeout(runDeferredStartup, 150);
    }, { once: true });
  }

  /* ---------------- Back-Forward Cache (bfcache) restore handler ---------------- */
  window.addEventListener('pageshow', function (event) {
    if (event.persisted) {
      document.body.classList.remove('is-navigating', 'is-loading');
      document.body.classList.add('is-loaded');
      var veil = document.getElementById('page-veil');
      if (veil) veil.classList.remove('is-active');
      var preloader = document.getElementById('preloader');
      if (preloader) {
        preloader.classList.add('hide');
        preloader.style.display = 'none';
      }
      if (typeof ScrollTrigger !== 'undefined') {
        setTimeout(safeScrollTriggerRefresh, 100);
      }
    }
  });
})();


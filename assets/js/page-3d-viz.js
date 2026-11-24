document.addEventListener('DOMContentLoaded', function () {
      var videos = [].slice.call(document.querySelectorAll('video[data-inview]'));
      if (!videos.length || !('IntersectionObserver' in window)) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            var p = e.target.play();
            if (p && p.catch) p.catch(function () { });
          } else {
            e.target.pause();
          }
        });
      }, { threshold: 0.25 });

      videos.forEach(function (v) { io.observe(v); });
    });

document.addEventListener('DOMContentLoaded', function () {
      var track = document.getElementById('cap-track');
      if (!track) return;
      var cards = [].slice.call(track.querySelectorAll('.cap-card'));
      var prev = document.getElementById('cap-prev');
      var next = document.getElementById('cap-next');

      function scrollPad() {
        return parseFloat(getComputedStyle(track).scrollPaddingLeft) || 0;
      }

      // card's left edge in the track's scroll-space (stable regardless of positioned ancestors)
      function cardLeft(c) {
        return c.getBoundingClientRect().left - track.getBoundingClientRect().left + track.scrollLeft;
      }

      function nearestIndex() {
        var target = track.scrollLeft + scrollPad(), best = 0, min = Infinity;
        cards.forEach(function (c, i) {
          var d = Math.abs(cardLeft(c) - target);
          if (d < min) { min = d; best = i; }
        });
        return best;
      }

      function scrollToCard(i) {
        i = Math.max(0, Math.min(cards.length - 1, i));
        track.scrollTo({ left: cardLeft(cards[i]) - scrollPad(), behavior: 'smooth' });
      }

      function update() {
        var idx = nearestIndex();
        prev.disabled = idx === 0;
        next.disabled = idx === cards.length - 1;
      }

      prev.addEventListener('click', function () { scrollToCard(nearestIndex() - 1); });
      next.addEventListener('click', function () { scrollToCard(nearestIndex() + 1); });

      var ticking = false;
      track.addEventListener('scroll', function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () { update(); ticking = false; });
      }, { passive: true });
      window.addEventListener('resize', update);

      // Titles wrap to different line counts; give them all the tallest height so the text below lines up.
      var titles = [].slice.call(track.querySelectorAll('.cap-title'));
      function alignTitles() {
        titles.forEach(function (t) { t.style.minHeight = ''; });
        var tallest = Math.max.apply(null, titles.map(function (t) { return t.offsetHeight; }));
        titles.forEach(function (t) { t.style.minHeight = tallest + 'px'; });
      }
      alignTitles();
      window.addEventListener('resize', alignTitles);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(alignTitles);

      // Drag with a mouse; phones and trackpads already scroll natively
      var dragging = false, startX = 0, startLeft = 0, moved = false;
      track.addEventListener('pointerdown', function (e) {
        if (e.pointerType !== 'mouse') return;
        dragging = true;
        moved = false;
        startX = e.clientX;
        startLeft = track.scrollLeft;
        track.classList.add('is-dragging');
      });
      window.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        if (Math.abs(e.clientX - startX) > 5) moved = true;
        track.scrollLeft = startLeft - (e.clientX - startX);
      });
      window.addEventListener('pointerup', function () {
        if (!dragging) return;
        dragging = false;
        track.classList.remove('is-dragging');
        scrollToCard(nearestIndex());
      });
      // A drag that ends on a link (the exploded-view card) must not also open it
      track.addEventListener('click', function (e) {
        if (moved) { e.preventDefault(); moved = false; }
      }, true);

      update();
    });

document.addEventListener('DOMContentLoaded', function () {
      var viewer = document.getElementById('arvr-viewer');
      if (!viewer) return;
      var stage = document.getElementById('arvr-stage');
      var fsBtn = document.getElementById('arvr-fs');
      var arPanel = document.getElementById('arvr-ar-panel');
      var arBtn = document.getElementById('arvr-ar');
      var tryBtn = document.getElementById('arvr-tryon');
      var toggle = document.getElementById('arvr-ar-toggle');
      var actions = document.getElementById('arvr-ar-actions');
      var qr = document.getElementById('arvr-qr');
      var qrClose = document.getElementById('arvr-qr-close');
      var qrCode = document.getElementById('arvr-qr-code');
      var toast = document.getElementById('arvr-toast');
      var touch = window.matchMedia('(pointer: coarse)').matches;
      var track = function (label) { if (window.pvTrack) window.pvTrack('service_interaction', label); };
      var mv = null, ready = false, toastTimer, qrOpener = null;

      function say(msg) {
        toast.textContent = msg;
        toast.style.opacity = '1';
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { toast.style.opacity = '0'; }, 4500);
      }

      // ---- AR model: phones only, loaded when full screen opens so a tap can start AR straight away ----
      // (Scene Viewer and Quick Look must be launched inside the tap itself, not after a download.)
      function loadARModel() {
        if (mv || !touch) return;
        arBtn.disabled = tryBtn.disabled = true;
        var s = document.createElement('script');
        s.type = 'module';
        s.src = '../assets/js/vendor/model-viewer.min.js';
        s.onerror = function () { say('AR could not load in this browser.'); };
        document.head.appendChild(s);

        mv = document.createElement('model-viewer');
        mv.setAttribute('src', viewer.getAttribute('data-ar-model'));
        mv.setAttribute('alt', '3D model of ' + viewer.getAttribute('data-ar-name') + ' for AR');
        mv.setAttribute('loading', 'eager');
        mv.setAttribute('ar', '');
        mv.setAttribute('ar-placement', 'floor');
        mv.setAttribute('ar-scale', 'fixed');
        mv.innerHTML = '<span slot="ar-button" hidden></span>';
        mv.className = 'absolute inset-0 z-0';
        mv.style.opacity = '1';
        mv.setAttribute('aria-hidden', 'true');
        mv.addEventListener('load', function () {
          ready = true;
          arBtn.disabled = tryBtn.disabled = false;
        }, { once: true });
        mv.addEventListener('error', function () { say('The AR model could not load.'); });
        mv.addEventListener('ar-status', function (e) {
          if (e.detail.status === 'failed') say('AR could not start on this device.');
        });
        stage.appendChild(mv);
      }

      // ---- QR code (desktop): generated on first open from this page's own address ----
      function drawQR() {
        if (qrCode.firstChild) return;
        var canonical = document.querySelector('link[rel="canonical"]');
        var url = (canonical ? canonical.href : location.href.split('#')[0]) + '#pv-viewer';
        function draw() {
          var q = window.qrcode(0, 'M');
          q.addData(url);
          q.make();
          qrCode.innerHTML = q.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
        }
        if (window.qrcode) return draw();
        var s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js';
        s.onload = draw;
        s.onerror = function () { qrCode.textContent = 'Open ' + url + ' on your phone.'; };
        document.head.appendChild(s);
      }

      function showQR(label, opener) {
        document.getElementById('arvr-qr-label').textContent = label;
        drawQR();
        qrOpener = opener;
        qr.hidden = false;
        qrClose.focus();
      }

      function hideQR() {
        if (qr.hidden) return;
        qr.hidden = true;
        if (qrOpener) qrOpener.focus();
      }

      qrClose.addEventListener('click', hideQR);
      qr.addEventListener('click', function (e) { if (e.target === qr) hideQR(); });

      function launchAR(modes, label, opener) {
        if (!touch) return showQR(label, opener);
        if (!ready) return say('Still loading the AR model, try again in a moment.');
        mv.arModes = modes;
        if (mv.canActivateAR) mv.activateAR();
        else say(label + ' is not supported on this device.');
      }

      arBtn.addEventListener('click', function () { launchAR('scene-viewer quick-look', 'See in your space', arBtn); });
      tryBtn.addEventListener('click', function () { launchAR('webxr quick-look scene-viewer', 'Try it on yourself', tryBtn); });

      toggle.addEventListener('click', function () {
        var open = toggle.getAttribute('aria-expanded') !== 'true';
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        toggle.setAttribute('aria-label', open ? 'Hide AR options' : 'Show AR options');
        actions.classList.toggle('is-collapsed', !open);
        actions.inert = !open;
      });

      // ---- Full screen: native API where available, fixed-position fallback for iPhone Safari ----
      var nativeFs = !!(viewer.requestFullscreen || viewer.webkitRequestFullscreen);
      function fsElement() { return document.fullscreenElement || document.webkitFullscreenElement; }
      function isFs() { return fsElement() === viewer || viewer.classList.contains('is-pseudo-fs'); }

      // ---- Smooth enter/exit: the browser switches full screen instantly, so the stage is animated
      // from where it was to where it now is (FLIP). Full screen uses the page's cream, so the switch
      // itself is invisible and the stage reads as growing out of, or shrinking back into, the page.
      var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var wasFs = false, pageRect = null, fsRect = null, flipAnim = null;
      var liftEl = viewer.closest('[data-reveal]');
      function setLift(on) { if (liftEl) liftEl.classList.toggle('arvr-lift', on); }

      function flip(first) {
        if (flipAnim) flipAnim.cancel();
        var last = stage.getBoundingClientRect();
        if (!first || reducedMotion || !stage.animate || !last.width || !last.height) {
          setLift(viewer.classList.contains('is-pseudo-fs'));
          return last;
        }
        setLift(true);
        stage.style.zIndex = '100001';
        flipAnim = stage.animate([
          { transformOrigin: '0 0', transform: 'translate(' + (first.left - last.left) + 'px,' + (first.top - last.top) + 'px) scale(' + (first.width / last.width) + ',' + (first.height / last.height) + ')' },
          { transformOrigin: '0 0', transform: 'none' }
        ], { duration: 480, easing: 'cubic-bezier(.16, 1, .3, 1)' });
        flipAnim.onfinish = flipAnim.oncancel = function () {
          flipAnim = null;
          stage.style.zIndex = '';
          setLift(viewer.classList.contains('is-pseudo-fs'));
        };
        return last;
      }

      window.addEventListener('resize', function () {
        if (isFs() && !flipAnim) fsRect = stage.getBoundingClientRect();
      });

      function syncFs() {
        var on = isFs();
        if (on !== wasFs) {
          wasFs = on;
          var first = on ? pageRect : fsRect;
          // Wait a frame so the full-screen (or page) layout has settled before measuring
          requestAnimationFrame(function () {
            var landed = flip(first);
            if (on) fsRect = landed;
          });
        }
        fsBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
        fsBtn.setAttribute('aria-label', on ? 'Exit full screen' : 'View in full screen');
        var enterIcon = document.getElementById('arvr-fs-icon-enter');
        var exitIcon = document.getElementById('arvr-fs-icon-exit');
        if (enterIcon) enterIcon.classList.toggle('hidden', on);
        if (exitIcon) exitIcon.classList.toggle('hidden', !on);
        arPanel.hidden = !on;
        if (on) loadARModel();
        else hideQR();
      }

      function setPseudo(on) {
        if (on) setLift(true);
        viewer.classList.toggle('is-pseudo-fs', on);
        document.documentElement.style.overflow = on ? 'hidden' : '';
        syncFs();
      }

      fsBtn.addEventListener('click', function () {
        if (isFs()) {
          if (fsElement()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
          else setPseudo(false);
          return;
        }
        track('Viewer: full screen');
        pageRect = stage.getBoundingClientRect();
        if (nativeFs) {
          var p = (viewer.requestFullscreen || viewer.webkitRequestFullscreen).call(viewer);
          if (p && p.catch) p.catch(function () { setPseudo(true); });
        } else {
          setPseudo(true);
        }
      });
      document.addEventListener('fullscreenchange', syncFs);
      document.addEventListener('webkitfullscreenchange', syncFs);
      document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        if (!qr.hidden) hideQR();
        else if (viewer.classList.contains('is-pseudo-fs')) setPseudo(false);
      });

      syncFs();
    });

(function () {
      window.dataLayer = window.dataLayer || [];
      function track(event, label) {
        window.dataLayer.push({ event: event, event_label: label || '', page_section: 'service_3d_cgi_visuals' });
      }
      window.pvTrack = track;

      document.addEventListener('click', function (e) {
        var el = e.target.closest && e.target.closest('[data-track]');
        if (el) track(el.getAttribute('data-track'), el.getAttribute('data-track-label') || el.textContent.trim().slice(0, 80));
      });

      document.addEventListener('toggle', function (e) {
        var d = e.target;
        if (d.tagName === 'DETAILS' && d.open) {
          track('service_interaction', 'FAQ: ' + d.querySelector('summary').textContent.trim());
        }
      }, true);
    })();

document.addEventListener('DOMContentLoaded', function () {
      var form = document.getElementById('pv-form');
      if (!form) return;
      var status = document.getElementById('pv-form-status');
      var btn = form.querySelector('button[type="submit"]');
      var btnLabel = btn.textContent.trim();
      var loadedAt = Date.now();
      var started = false;
      var EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[^\s@.]{2,}$/;
      var track = window.pvTrack || function () { };

      var fields = [
        { id: 'pv-name', msg: 'Please enter your name.' },
        { id: 'pv-email', msg: 'Please enter a valid business email.', test: function (v) { return EMAIL.test(v); } },
        { id: 'pv-company', msg: 'Please enter your company name.' },
        { id: 'pv-input', msg: 'Please choose what you have.' },
        { id: 'pv-type', msg: 'Please choose a project type.' }
      ];

      function val(id) { return document.getElementById(id).value.trim(); }

      function setError(f, show) {
        var input = document.getElementById(f.id);
        var err = document.getElementById(f.id + '-error');
        input.setAttribute('aria-invalid', show ? 'true' : 'false');
        err.textContent = show ? f.msg : '';
        err.classList.toggle('hidden', !show);
      }

      function isValid(f) {
        var v = val(f.id);
        return v !== '' && (!f.test || f.test(v));
      }

      function setStatus(msg, ok) {
        status.textContent = msg;
        status.style.color = ok ? '#7FD6A4' : '#FF6A38';
        status.classList.remove('hidden');
      }

      form.addEventListener('focusin', function () {
        if (started) return;
        started = true;
        track('form_start', 'Enquiry form');
      });

      // Clear a field's error as soon as it becomes valid
      fields.forEach(function (f) {
        var input = document.getElementById(f.id);
        input.addEventListener(input.tagName === 'SELECT' ? 'change' : 'input', function () {
          if (input.getAttribute('aria-invalid') === 'true' && isValid(f)) setError(f, false);
        });
      });

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        // Bots: honeypot filled, or submitted faster than a person could type
        if (form.elements._gotcha.value || Date.now() - loadedAt < 2500) return;

        var firstBad = null;
        fields.forEach(function (f) {
          var ok = isValid(f);
          setError(f, !ok);
          if (!ok && !firstBad) firstBad = f;
        });
        if (firstBad) {
          document.getElementById(firstBad.id).focus();
          setStatus('Please check the highlighted fields.', false);
          return;
        }

        var name = val('pv-name'), email = val('pv-email'), company = val('pv-company'), type = val('pv-type');
        var phone = val('pv-phone');
        var details =
          'Phone: ' + (phone || '-') + '\n' +
          'What they have: ' + val('pv-input') + '\n' +
          'Project type: ' + type + '\n' +
          'Where it will run: ' + (val('pv-placement') || '-') + '\n' +
          'Deadline: ' + (val('pv-deadline') || '-');
        var payload = {
          name: name,
          email: email,
          phone: phone || '-',
          company: company,
          product: '3D & CGI visuals - ' + type,
          need: details,
          _subject: 'New 3D visualization enquiry: ' + name + ' (' + company + ')',
          _template: 'table',
          _captcha: 'false'
        };

        btn.disabled = true;
        btn.textContent = 'Sending…';
        setStatus('Sending your enquiry…', true);

        function finish() {
          btn.disabled = false;
          btn.textContent = btnLabel;
        }

        function done() {
          finish();
          setStatus('Thank you. Your enquiry has been sent, and we will reply to ' + email + ' soon.', true);
          track('form_submit', type);
          form.reset();
        }

        function openMailApp() {
          finish();
          var body = 'Name: ' + name + '\nEmail: ' + email + '\nCompany: ' + company + '\n\n' + details;
          window.location.href = 'mailto:business@supermajor.in?subject=' +
            encodeURIComponent(payload._subject) + '&body=' + encodeURIComponent(body);
          setStatus('We could not send this automatically. Your email app should open with the message ready to send to business@supermajor.in.', false);
          track('form_submit_fallback', type);
        }

        var json = { 'Content-Type': 'application/json', 'Accept': 'application/json' };

        fetch('../contact.php', { method: 'POST', headers: json, body: JSON.stringify(payload) })
          .then(function (res) {
            if (!res.ok) throw new Error('contact.php ' + res.status);
            return res.json();
          })
          .then(function (data) {
            if (!data || !data.success) throw new Error('contact.php failed');
            done();
          })
          .catch(function () {
            return fetch('https://formsubmit.co/ajax/business@supermajor.in', { method: 'POST', headers: json, body: JSON.stringify(payload) })
              .then(function (res) { return res.json(); })
              .then(function (data) {
                if (data && (data.success === true || data.success === 'true')) return done();
                throw new Error('FormSubmit failed');
              })
              .catch(openMailApp);
          });
      });
    });
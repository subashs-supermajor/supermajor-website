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

(function () {
      window.dataLayer = window.dataLayer || [];
      function track(event, label) {
        window.dataLayer.push({ event: event, event_label: label || '', page_section: 'service_ar_vr' });
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
      var stage = document.getElementById('ar-try-stage');
      if (!stage) return;
      var poster = document.getElementById('ar-try-poster');
      var note = document.getElementById('ar-try-note');
      var modeBtns = [document.getElementById('ar-try-view'), document.getElementById('ar-try-tryon')];
      var FABRICS = [['Navy', '#1C3F7A'], ['Champagne', '#A8957F'], ['Gray', '#B9BBB9'], ['Black', '#1A1A1C'], ['Pale Pink', '#EFCFD1']];
      var MODES = {
        view: { ar: 'scene-viewer quick-look', label: 'Open AR View' },
        tryon: { ar: 'webxr quick-look scene-viewer', label: 'Start Virtual Try-On' }
      };
      var mv = null, launch, mode;

      function checkSupport() {
        Promise.resolve(mv.updateComplete).then(function () {
          note.textContent = mv.canActivateAR
            ? 'Tap "' + MODES[mode].label + '", then point your camera at the floor.'
            : 'AR is not supported on this device. You can still rotate and zoom the 3D model.';
        });
      }

      function build() {
        var s = document.createElement('script');
        s.type = 'module';
        s.src = '../assets/js/vendor/model-viewer.min.js';
        document.head.appendChild(s);

        mv = document.createElement('model-viewer');
        mv.setAttribute('src', '../assets/ar-vr/glam-velvet-sofa.glb');
        mv.setAttribute('alt', '3D model of a curved velvet sofa, ready to place in your room');
        mv.setAttribute('camera-controls', '');
        mv.setAttribute('touch-action', 'pan-y');
        mv.setAttribute('camera-orbit', '-28deg 76deg auto');
        mv.setAttribute('environment-image', 'neutral');
        mv.setAttribute('shadow-intensity', '1');
        mv.setAttribute('interaction-prompt', 'none');
        mv.setAttribute('ar', '');
        mv.setAttribute('ar-placement', 'floor');
        mv.setAttribute('ar-scale', 'fixed');
        mv.setAttribute('variant-name', 'Navy');
        mv.className = 'absolute inset-0';
        mv.innerHTML =
          '<div class="ar-try-fabrics absolute inset-x-0 bottom-[4.25rem] flex justify-center">' +
          '<div class="flex gap-1 rounded-full bg-white/90 p-1 shadow-md" role="group" aria-label="Fabric colour">' +
          FABRICS.map(function (f, i) {
            return '<button type="button" class="arvr-swatch size-11 rounded-full border-2 border-transparent p-1 outline-none focus-visible:ring-2 focus-visible:ring-[#C93708]" data-variant="' + f[0] + '" aria-pressed="' + (i === 0) + '" aria-label="' + f[0] + ' fabric"><span class="block size-full rounded-full" style="background:' + f[1] + ';"></span></button>';
          }).join('') +
          '</div></div>' +
          '<button slot="ar-button" type="button" class="absolute inset-x-3 bottom-3 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#C93708] px-5 text-sm font-semibold text-white shadow-md"></button>';

        launch = mv.querySelector('[slot="ar-button"]');
        var swatches = [].slice.call(mv.querySelectorAll('.arvr-swatch'));
        swatches.forEach(function (b) {
          b.addEventListener('click', function () {
            mv.variantName = b.getAttribute('data-variant');
            swatches.forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
            if (window.pvTrack) window.pvTrack('service_interaction', 'AR try fabric: ' + b.getAttribute('data-variant'));
          });
        });

        mv.addEventListener('load', function () {
          poster.hidden = true;
          checkSupport();
        }, { once: true });
        mv.addEventListener('error', function () { note.textContent = 'The 3D model could not load. Please try again.'; });
        mv.addEventListener('ar-status', function (e) {
          if (e.detail.status === 'failed') note.textContent = 'AR could not start on this device.';
        });

        stage.appendChild(mv);
      }

      function open(m) {
        mode = m;
        if (!mv) build();
        stage.hidden = false;
        mv.arModes = MODES[m].ar;
        launch.textContent = MODES[m].label;
        modeBtns.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-mode') === m ? 'true' : 'false'); });
        note.textContent = 'Loading the 3D model…';
        if (mv.loaded) checkSupport();
      }

      modeBtns.forEach(function (b) {
        b.addEventListener('click', function () { open(b.getAttribute('data-mode')); });
      });

      // Arriving from a QR code: open the matching mode (AR itself still needs a tap)
      var fromQR = new URLSearchParams(location.search).get('ar');
      if ((fromQR === 'view' || fromQR === 'tryon') && window.matchMedia('(pointer: coarse)').matches) {
        open(fromQR);
        if (window.pvTrack) window.pvTrack('service_interaction', 'AR try: opened from QR (' + fromQR + ')');
      }
    });

document.addEventListener('DOMContentLoaded', function () {
      var img = document.getElementById('arvr-config-img');
      if (!img) return;
      var name = document.getElementById('arvr-config-name');
      var opts = [].slice.call(document.querySelectorAll('.arvr-config'));

      function choose(b, focus) {
        var label = b.getAttribute('aria-label');
        opts.forEach(function (o) {
          var on = o === b;
          o.setAttribute('aria-checked', on ? 'true' : 'false');
          o.tabIndex = on ? 0 : -1;
        });
        if (focus) b.focus();
        img.classList.add('is-swapping');
        var next = new Image();
        next.onload = next.onerror = function () {
          img.src = next.src;
          img.alt = 'Curved velvet sofa in ' + label + ' fabric';
          img.classList.remove('is-swapping');
        };
        next.src = '../assets/ar-vr/' + b.getAttribute('data-img') + '.webp';
        name.textContent = label;
      }

      opts.forEach(function (b, i) {
        b.addEventListener('click', function () {
          choose(b, false);
          window.pvTrack && window.pvTrack('service_interaction', 'Configurator: ' + b.getAttribute('aria-label'));
        });
        b.addEventListener('keydown', function (e) {
          var d = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ? -1 : 0;
          if (!d) return;
          e.preventDefault();
          choose(opts[(i + d + opts.length) % opts.length], true);
        });
      });
    });

document.addEventListener('DOMContentLoaded', function () {
      var form = document.getElementById('arvr-form');
      if (!form) return;
      var status = document.getElementById('arvr-form-status');
      var btn = form.querySelector('button[type="submit"]');
      var btnLabel = btn.textContent.trim();
      var loadedAt = Date.now();
      var started = false;
      var EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[^\s@.]{2,}$/;
      var track = window.pvTrack || function () { };

      var fields = [
        { id: 'arvr-name', msg: 'Please enter your name.' },
        { id: 'arvr-email', msg: 'Please enter a valid business email.', test: function (v) { return EMAIL.test(v); } },
        { id: 'arvr-company', msg: 'Please enter your company name.' },
        { id: 'pv-input', msg: 'Please choose what you have.' },
        { id: 'arvr-service', msg: 'Please choose a type of experience.' }
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

        var name = val('arvr-name'), email = val('arvr-email'), company = val('arvr-company'), service = val('arvr-service');
        var phone = val('pv-phone');
        var details =
          'Phone: ' + (phone || '-') + '\n' +
          'What they have: ' + val('pv-input') + '\n' +
          'Type of experience: ' + service + '\n' +
          'Where it will run: ' + (val('pv-placement') || '-') + '\n' +
          'Deadline: ' + (val('pv-deadline') || '-');
        var payload = {
          name: name,
          email: email,
          phone: phone || '-',
          company: company,
          product: 'AR / VR & interactive 3D - ' + service,
          need: details,
          _subject: 'New AR/VR enquiry: ' + name + ' (' + company + ')',
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
          track('form_submit', service);
          form.reset();
        }

        function openMailApp() {
          finish();
          var body = 'Name: ' + name + '\nEmail: ' + email + '\nCompany: ' + company + '\n\n' + details;
          window.location.href = 'mailto:business@supermajor.in?subject=' +
            encodeURIComponent(payload._subject) + '&body=' + encodeURIComponent(body);
          setStatus('We could not send this automatically. Your email app should open with the message ready to send to business@supermajor.in.', false);
          track('form_submit_fallback', service);
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
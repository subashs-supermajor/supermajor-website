(() => {
          const initEveryStageRows = () => {
            const rows = document.querySelectorAll('[data-every-stage-row]');
            if (!rows.length) return;
            if (!('IntersectionObserver' in window)) {
              rows.forEach(row => { row.style.opacity = '1'; row.style.transform = 'translateY(0)'; });
              return;
            }
            const observer = new IntersectionObserver(entries => {
              entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
              });
            }, { threshold: 0.18 });
            rows.forEach(row => observer.observe(row));
          };
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initEveryStageRows, { once: true });
          } else {
            initEveryStageRows();
          }
        })();

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
      var track = document.getElementById('industry-track');
      if (!track) return;
      var cards = [].slice.call(track.querySelectorAll('.industry-card'));
      var prev = document.getElementById('industry-prev');
      var next = document.getElementById('industry-next');
      var count = document.getElementById('industry-count');
      var total = cards.length;

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

      function pad(n) { return (n < 10 ? '0' : '') + n; }

      function update() {
        var idx = nearestIndex();
        if (count) count.textContent = pad(idx + 1) + ' / ' + pad(total);
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

      // Titles wrap to different line counts; give them all the tallest height
      // so the tags and descriptions start on one line across the cards.
      var titles = [].slice.call(track.querySelectorAll('.industry-title'));
      function alignTitles() {
        titles.forEach(function (t) { t.style.minHeight = ''; });
        var tallest = Math.max.apply(null, titles.map(function (t) { return t.offsetHeight; }));
        titles.forEach(function (t) { t.style.minHeight = tallest + 'px'; });
      }
      alignTitles();
      window.addEventListener('resize', alignTitles);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(alignTitles);

      // Drag with a mouse; phones and trackpads already scroll natively
      var dragging = false, startX = 0, startLeft = 0;
      track.addEventListener('pointerdown', function (e) {
        if (e.pointerType !== 'mouse') return;
        dragging = true;
        startX = e.clientX;
        startLeft = track.scrollLeft;
        track.classList.add('is-dragging');
      });
      window.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        track.scrollLeft = startLeft - (e.clientX - startX);
      });
      window.addEventListener('pointerup', function () {
        if (!dragging) return;
        dragging = false;
        track.classList.remove('is-dragging');
        scrollToCard(nearestIndex());
      });

      update();
    });

document.addEventListener('DOMContentLoaded', function () {
      var btn = document.getElementById('animate-more');
      if (!btn) return;
      var extra = [].slice.call(document.querySelectorAll('#animate-grid [data-more]'));
      var label = btn.querySelector('[data-label]');
      var icon = btn.querySelector('[data-icon]');
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') !== 'true';
        extra.forEach(function (card) {
          card.classList.toggle('hidden', !open);
          if (open) card.classList.add('revealed');
        });
        btn.setAttribute('aria-expanded', String(open));
        label.textContent = open ? 'Show less' : 'Know more';
        icon.setAttribute('icon', open ? 'solar:arrow-up-linear' : 'solar:arrow-down-linear');
        icon.classList.toggle('group-hover:translate-y-1.5', !open);
        icon.classList.toggle('group-hover:-translate-y-1.5', open);
        if (!open) document.getElementById('what-we-animate').scrollIntoView({ block: 'start' });
        if (window.ScrollTrigger) ScrollTrigger.refresh();
      });
    });

document.addEventListener('DOMContentLoaded', function () {
      var form = document.getElementById('film-form');
      if (!form) return;
      var status = document.getElementById('film-form-status');
      var btn = form.querySelector('button[type="submit"]');
      var btnText = btn ? btn.innerHTML : '';

      function setStatus(msg, ok) {
        status.textContent = msg;
        status.style.color = ok ? '#7FD6A4' : '#FF6A38';
        status.classList.remove('hidden');
      }

      function val(id) {
        var el = document.getElementById(id);
        return el ? el.value.trim() : '';
      }

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (form.elements._gotcha && form.elements._gotcha.value) return;

        var name = val('contact-name');
        var email = val('contact-email');
        var company = val('contact-company');
        var phone = val('contact-phone');
        var type = val('contact-animation');
        var details =
          'Phone: ' + (phone || '-') + '\n' +
          'What they have: ' + val('contact-input') + '\n' +
          'Type of animation: ' + type + '\n' +
          'Where it will run: ' + (val('contact-placement') || '-') + '\n' +
          'Deadline: ' + (val('contact-deadline') || '-');

        var payload = {
          name: name,
          email: email,
          phone: phone || '-',
          company: company || '-',
          product: 'Product film - ' + type,
          need: details,
          _subject: 'New animation enquiry: ' + name + (company ? ' (' + company + ')' : ''),
          _template: 'table',
          _captcha: 'false'
        };

        if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }
        setStatus('Sending your enquiry...', true);

        function done() {
          setStatus('Thank you! Your enquiry has been sent. We will reply with a plan for your film.', true);
          form.reset();
        }

        function openMailApp() {
          var body = 'Name: ' + name + '\nEmail: ' + email + '\nCompany: ' + (company || '-') + '\n\n' + details;
          window.location.href = 'mailto:business@supermajor.in?subject=' +
            encodeURIComponent(payload._subject) + '&body=' + encodeURIComponent(body);
          setStatus('Opening your email app to send this to business@supermajor.in.', true);
        }

        var json = { 'Content-Type': 'application/json', 'Accept': 'application/json' };

        // 1. Site mail script (GoDaddy)
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
            // 2. FormSubmit relay
            return fetch('https://formsubmit.co/ajax/business@supermajor.in', { method: 'POST', headers: json, body: JSON.stringify(payload) })
              .then(function (res) { return res.json(); })
              .then(function (data) {
                if (data && (data.success === true || data.success === 'true')) return done();
                throw new Error('FormSubmit failed');
              })
              // 3. Visitor's own mail app
              .catch(openMailApp);
          })
          .finally(function () {
            if (btn) { btn.disabled = false; btn.innerHTML = btnText; }
          });
      });
    });
/* Services hub: studio clock, row videos and the proof rail. */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function all(sel, root) { return [].slice.call((root || document).querySelectorAll(sel)); }

  // Chennai clock in the closing section
  var clock = document.getElementById('local-time');
  function tick() {
    if (!clock) return;
    try {
      clock.textContent = new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' }).format(new Date());
    } catch (e) { clock.textContent = new Date().toLocaleTimeString(); }
  }
  tick(); setInterval(tick, 30000);

  // Services: row videos play only while on screen (never for reduced motion)
  var vids = all('video[data-play-inview]');
  if (vids.length && !reduce && 'IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { var p = e.target.play(); if (p && p.catch) p.catch(function () { }); }
        else { e.target.pause(); }
      });
    }, { threshold: 0.4 });
    vids.forEach(function (v) { vio.observe(v); });
  }

  // Proof: category tabs jump to their first card, arrows step one card, the active tab follows the scroll
  var rail = document.querySelector('[data-rail]');
  if (rail) {
    var cards = all('.svc-card', rail);
    var tabs = all('[data-rail-tab]');
    var prev = document.querySelector('[data-rail-prev]');
    var next = document.querySelector('[data-rail-next]');
    var nearest = function () {
      var best = 0, dist = Infinity;
      cards.forEach(function (c, i) {
        var d = Math.abs(c.offsetLeft - rail.scrollLeft);
        if (d < dist) { dist = d; best = i; }
      });
      return best;
    };
    var go = function (i) {
      i = Math.max(0, Math.min(cards.length - 1, i));
      rail.scrollTo({ left: cards[i].offsetLeft, behavior: reduce ? 'auto' : 'smooth' });
    };
    var sync = function () {
      var cat = cards[nearest()].getAttribute('data-cat');
      tabs.forEach(function (t) {
        var on = t.getAttribute('data-rail-tab') === cat;
        if (on && t.getAttribute('aria-current') !== 'true') {
          var bar = t.parentNode;
          if (t.offsetLeft < bar.scrollLeft || t.offsetLeft + t.offsetWidth > bar.scrollLeft + bar.clientWidth) {
            bar.scrollTo({ left: Math.max(0, t.offsetLeft - 3), behavior: reduce ? 'auto' : 'smooth' });
          }
        }
        t.setAttribute('aria-current', on ? 'true' : 'false');
      });
      if (prev) prev.disabled = rail.scrollLeft <= 2;
      if (next) next.disabled = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 2;
    };
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        var key = t.getAttribute('data-rail-tab');
        for (var i = 0; i < cards.length; i++) { if (cards[i].getAttribute('data-cat') === key) { go(i); break; } }
      });
    });
    if (prev) prev.addEventListener('click', function () { go(nearest() - 1); });
    if (next) next.addEventListener('click', function () { go(nearest() + 1); });
    var queued = false;
    rail.addEventListener('scroll', function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; sync(); });
    }, { passive: true });
    window.addEventListener('resize', sync, { passive: true });
    sync();
  }

  // Interactive FAQ: smooth auto-collapse accordion for already present UI
  var faqDetails = all('#faq details');
  if (faqDetails.length) {
    faqDetails.forEach(function (detail) {
      var summary = detail.querySelector('summary');
      var content = detail.querySelector('p');
      if (!summary || !content) return;

      summary.addEventListener('click', function (e) {
        if (reduce) {
          if (!detail.open) {
            faqDetails.forEach(function (other) {
              if (other !== detail && other.open) other.removeAttribute('open');
            });
          }
          return;
        }

        e.preventDefault();

        // If clicking on an open detail, smoothly close it
        if (detail.open) {
          content.style.maxHeight = content.scrollHeight + 'px';
          content.style.opacity = '1';
          requestAnimationFrame(function () {
            content.style.transition = 'max-height 0.28s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease';
            content.style.maxHeight = '0px';
            content.style.opacity = '0';
          });
          setTimeout(function () {
            detail.removeAttribute('open');
            content.style.maxHeight = '';
            content.style.opacity = '';
            content.style.transition = '';
          }, 280);
          return;
        }

        // Close any other open details smoothly
        faqDetails.forEach(function (other) {
          if (other !== detail && other.open) {
            var otherP = other.querySelector('p');
            if (otherP) {
              otherP.style.maxHeight = otherP.scrollHeight + 'px';
              otherP.style.opacity = '1';
              requestAnimationFrame(function () {
                otherP.style.transition = 'max-height 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease';
                otherP.style.maxHeight = '0px';
                otherP.style.opacity = '0';
              });
              setTimeout(function () {
                other.removeAttribute('open');
                otherP.style.maxHeight = '';
                otherP.style.opacity = '';
                otherP.style.transition = '';
              }, 250);
            } else {
              other.removeAttribute('open');
            }
          }
        });

        // Open this detail with smooth animation
        detail.setAttribute('open', '');
        var targetHeight = content.scrollHeight;
        content.style.maxHeight = '0px';
        content.style.opacity = '0';
        requestAnimationFrame(function () {
          content.style.transition = 'max-height 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease';
          content.style.maxHeight = targetHeight + 'px';
          content.style.opacity = '1';
        });
        setTimeout(function () {
          content.style.maxHeight = '';
          content.style.opacity = '';
          content.style.transition = '';
        }, 350);
      });
    });
  }
})();

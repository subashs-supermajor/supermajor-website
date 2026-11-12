/* Shared behaviour for services/website-design.html and services/generative-ai.html:
   conversion tracking, the enquiry form, in-view videos and the on-page "Team up" link.
   Build: npx esbuild assets/js/service-editorial.js --minify --outfile=assets/js/service-editorial.min.js */
(function () {
  'use strict';

  var page = document.body.getAttribute('data-service') || 'service';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Tracking: everything goes to the GTM dataLayer ---------- */
  function track(event, label, extra) {
    window.dataLayer = window.dataLayer || [];
    var data = { event: event, event_label: label || '', service_page: page };
    if (extra) Object.keys(extra).forEach(function (k) { data[k] = extra[k]; });
    window.dataLayer.push(data);
  }

  // data-track is the attribute the other service pages already carry
  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('[data-track]') : null;
    if (el) track(el.getAttribute('data-track'), el.getAttribute('data-track-label') || el.textContent.trim());
  });

  /* ---------- "Team up" / "Contact" stay on this page ----------
     main.js points them at the homepage form, which would lose a campaign visitor. */
  function keepContactOnPage(root) {
    if (!root || !document.getElementById('contact')) return;
    root.querySelectorAll('a[href="../#contact"]').forEach(function (a) {
      a.setAttribute('href', '#contact');
    });
  }
  ['header-placeholder', 'footer-placeholder'].forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    keepContactOnPage(el);
    new MutationObserver(function () { keepContactOnPage(el); }).observe(el, { childList: true, subtree: true });
  });

  /* ---------- Videos play only on screen; never for reduced motion or data saver ---------- */
  var saveData = navigator.connection && navigator.connection.saveData;
  var videos = [].slice.call(document.querySelectorAll('video[data-inview]'));
  if (videos.length && 'IntersectionObserver' in window && !reduced && !saveData) {
    var videoObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var playing = entry.target.play();
          if (playing && playing.catch) playing.catch(function () { });
        } else {
          entry.target.pause();
        }
      });
    }, { threshold: 0.25 });
    videos.forEach(function (v) { videoObserver.observe(v); });
  }

  /* ---------- Click-to-play for heavy films: nothing downloads until asked ---------- */
  document.querySelectorAll('[data-play]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var box = btn.parentNode;
      var video = document.createElement('video');
      video.src = btn.getAttribute('data-play');
      video.poster = btn.getAttribute('data-poster') || '';
      video.controls = true;
      video.playsInline = true;
      video.muted = true;
      video.setAttribute('aria-label', btn.getAttribute('data-title') || 'Project video');
      box.appendChild(video);
      btn.remove();
      var img = box.querySelector('img');
      if (img) img.remove();
      video.focus();
      var playing = video.play();
      if (playing && playing.catch) playing.catch(function () { });
    });
  });

  /* ---------- Tabs: the device demo and the prompt demo ----------
     Each [data-tabs] root holds [role=tab] buttons plus [data-panel] items to show. */
  document.querySelectorAll('[data-tabs]').forEach(function (root) {
    var tabs = [].slice.call(root.querySelectorAll('[role="tab"]'));
    var panels = [].slice.call(root.querySelectorAll('[data-panel]'));

    function select(tab, silent) {
      var key = tab.getAttribute('data-tab');
      root.setAttribute('data-active', key);
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      });
      panels.forEach(function (p) {
        p.classList.toggle('is-active', p.getAttribute('data-panel') === key);
      });
      if (!silent) track('service_interaction', root.getAttribute('data-tabs') + ': ' + key);
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab); });
      tab.addEventListener('keydown', function (e) {
        var step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (!step) return;
        e.preventDefault();
        var next = tabs[(i + step + tabs.length) % tabs.length];
        next.focus();
        select(next);
      });
    });

    // Phone visitors start on the screen they are holding
    var first = window.matchMedia('(max-width: 767px)').matches && root.getAttribute('data-mobile-tab');
    var start = first && root.querySelector('[data-tab="' + first + '"]');
    select(start || tabs[0], true);
  });

  /* ---------- Services list: hover, focus or tap changes the preview (desktop) ---------- */
  document.querySelectorAll('[data-preview-list]').forEach(function (list) {
    var rows = [].slice.call(list.querySelectorAll('li'));
    var images = [].slice.call(document.querySelectorAll('[data-preview] img'));
    function show(i) {
      rows.forEach(function (r, n) { r.classList.toggle('is-active', n === i); });
      images.forEach(function (img, n) { img.classList.toggle('is-active', n === i); });
    }
    rows.forEach(function (row, i) {
      row.addEventListener('mouseenter', function () { show(i); });
      row.addEventListener('focusin', function () { show(i); });
    });
    show(0);
  });

  /* ---------- Proof cards: interactive expansion on hover ---------- */
  document.querySelectorAll('.sv-proof').forEach(function (proof) {
    var articles = [].slice.call(proof.querySelectorAll('article'));
    articles.forEach(function (article, i) {
      function activate() { proof.setAttribute('data-hover-card', i === 0 ? 'first' : 'second'); }
      function deactivate() { proof.removeAttribute('data-hover-card'); }
      article.addEventListener('mouseenter', activate);
      article.addEventListener('focusin', activate);
      article.addEventListener('mouseleave', deactivate);
      article.addEventListener('focusout', function (e) {
        if (!article.contains(e.relatedTarget)) deactivate();
      });
    });
  });

  /* ---------- Enquiry form ---------- */
  var form = document.getElementById('enquiry-form');
  if (!form) return;

  var statusEl = document.getElementById('enquiry-status');
  var btn = form.querySelector('button[type="submit"]');
  var btnLabel = btn.innerHTML;
  var serviceName = form.getAttribute('data-service-name') || 'Service';
  var started = false;

  function setStatus(message, ok) {
    statusEl.textContent = message;
    statusEl.className = 'sv-status ' + (ok ? 'is-ok' : 'is-err');
    statusEl.hidden = false;
  }

  function markStarted() {
    if (started) return;
    started = true;
    track('form_start', serviceName);
  }
  form.addEventListener('focusin', markStarted);
  form.addEventListener('input', markStarted);

  form.querySelectorAll('select').forEach(function (select) {
    select.addEventListener('change', function () {
      if (select.value) track('enquiry_selection', select.value, { field: select.name });
    });
  });

  function fieldBox(input) { return input.closest('.sv-field'); }

  function showError(input) {
    var box = fieldBox(input);
    if (!box) return;
    var error = box.querySelector('.sv-field__err');
    var value = input.value.trim();
    var message = '';
    if (input.required && !value) message = input.getAttribute('data-empty') || 'This field is required.';
    else if (input.type === 'email' && value && !input.validity.valid) message = 'Enter a valid email address, for example name@company.com.';
    box.classList.toggle('is-invalid', !!message);
    if (message) {
      input.setAttribute('aria-invalid', 'true');
      if (error) error.textContent = message;
    } else {
      input.removeAttribute('aria-invalid');
    }
    return !message;
  }

  var fields = [].slice.call(form.querySelectorAll('.sv-input'));
  fields.forEach(function (input) {
    input.addEventListener('blur', function () { if (input.value) showError(input); });
    input.addEventListener('input', function () {
      if (fieldBox(input).classList.contains('is-invalid')) showError(input);
    });
    input.addEventListener('change', function () {
      if (fieldBox(input).classList.contains('is-invalid')) showError(input);
    });
  });

  function value(name) {
    var el = form.elements[name];
    return el ? el.value.trim() : '';
  }

  // Campaign details travel inside the enquiry, so contact.php needs no change
  function campaignLines() {
    var params = new URLSearchParams(window.location.search);
    var lines = [];
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'].forEach(function (k) {
      if (params.get(k)) lines.push(k + ': ' + params.get(k));
    });
    return lines;
  }

  function buildDetails() {
    var lines = [];
    fields.forEach(function (input) {
      var label = input.getAttribute('data-extra');
      if (label) lines.push(label + ': ' + (input.value.trim() || '-'));
    });
    lines.push('', 'Page: ' + window.location.href.split('?')[0]);
    var campaign = campaignLines();
    if (campaign.length) lines = lines.concat(['', 'Campaign'], campaign);
    return lines.join('\n');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (form.elements._gotcha && form.elements._gotcha.value) return;

    var firstBad = null;
    fields.forEach(function (input) {
      if (!showError(input) && !firstBad) firstBad = input;
    });
    if (firstBad) {
      setStatus('Please check the highlighted fields.', false);
      firstBad.focus();
      return;
    }

    var name = value('name');
    var email = value('email');
    var company = value('company');
    var type = value('product');
    var details = buildDetails();
    var payload = {
      name: name,
      email: email,
      company: company,
      phone: value('phone') || '-',
      product: serviceName + (type ? ' - ' + type : ''),
      need: details,
      _subject: serviceName + ' enquiry: ' + name + ' (' + company + ')',
      _template: 'table',
      _captcha: 'false'
    };
    var json = { 'Content-Type': 'application/json', 'Accept': 'application/json' };

    btn.disabled = true;
    btn.textContent = 'Sending...';
    setStatus('Sending your enquiry...', true);

    function sent() {
      // The only place a conversion fires: a backend confirmed the enquiry
      track('form_submit_success', serviceName, { project_type: type || 'Not selected' });
      setStatus('Thank you. Your enquiry has been sent and we will reply by email.', true);
      form.reset();
      started = false;
    }

    function openMailApp() {
      track('form_submit_fallback', serviceName);
      var body = 'Name: ' + name + '\nEmail: ' + email + '\nCompany: ' + company + '\nService: ' + payload.product + '\n\n' + details;
      window.location.href = 'mailto:business@supermajor.in?subject=' +
        encodeURIComponent(payload._subject) + '&body=' + encodeURIComponent(body);
      setStatus('We could not send this from the page, so your email app is opening with it filled in. You can also write to business@supermajor.in.', false);
    }

    function viaFormSubmit() {
      return fetch('https://formsubmit.co/ajax/business@supermajor.in', { method: 'POST', headers: json, body: JSON.stringify(payload) })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data && (data.success === true || data.success === 'true')) return sent();
          throw new Error('FormSubmit failed');
        })
        .catch(openMailApp);
    }

    fetch('../contact.php', { method: 'POST', headers: json, body: JSON.stringify(payload) })
      .then(function (res) {
        // 400 and 429 are real answers from contact.php: a relay would only sidestep them
        if (res.status === 400 || res.status === 429) {
          return res.json().then(function (data) { setStatus(data.message, false); });
        }
        if (!res.ok) throw new Error('contact.php ' + res.status);
        return res.json().then(function (data) {
          if (!data || !data.success) throw new Error('contact.php failed');
          sent();
        });
      })
      .catch(viaFormSubmit)
      .finally(function () {
        btn.disabled = false;
        btn.innerHTML = btnLabel;
      });
  });
})();

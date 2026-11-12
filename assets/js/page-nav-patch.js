/* Rewrites shared header/footer in-page anchors (e.g. #hero, #services)
   to point back at the home page when this script runs on a non-home page.
   Uses clean URLs (/ and /work, not index.html / work.html). */
(function () {
  "use strict";

  var homeAnchors = ["#hero", "#trust", "#about", "#services", "#studio", "#contact"];

  var script = document.querySelector('script[src*="page-nav-patch.js"]');
  var prefix = (script && script.getAttribute('src').startsWith('../')) ? '../' : '';
  var home = prefix || './';

  // True on /work, /work/ and the old /work.html, and on every case study under /works/.
  function onWorkSection() {
    var p = window.location.pathname.replace(/\/+$/, '');
    return p.endsWith('/work') || p.endsWith('work.html') || p.includes('/works/');
  }

  function patch(root) {
    if (!root) return;
    homeAnchors.forEach(function (hash) {
      // Pages with their own enquiry form keep "#contact" on the page
      if (hash === '#contact' && document.getElementById('contact')) return;
      root.querySelectorAll('a[href="' + hash + '"]').forEach(function (a) {
        a.setAttribute("href", home + hash);
      });
    });
    root.querySelectorAll('a[href="#section-work"]').forEach(function (a) {
      a.setAttribute("href", prefix + "work");
      a.removeAttribute("data-nav");
      if (onWorkSection()) {
        a.classList.add("active");
      }
    });
    root.querySelectorAll('a[href="./"], a[href="index.html"]').forEach(function (a) {
      a.setAttribute("href", home);
    });
    root.querySelectorAll('a[href="work"], a[href="work.html"]').forEach(function (a) {
      a.setAttribute("href", prefix + "work");
      if (a.hasAttribute("data-nav") && onWorkSection()) {
        a.classList.add("active");
      }
    });
    root.querySelectorAll('a[href*="#services"]').forEach(function (a) {
      if (window.location.pathname.includes("/services/")) {
        a.classList.add("active");
      }
    });
  }

  ["header-placeholder", "footer-placeholder"].forEach(function (id) {
    var target = document.getElementById(id);
    if (!target) return;
    patch(target);
    new MutationObserver(function () {
      patch(target);
    }).observe(target, { childList: true, subtree: true });
  });
})();

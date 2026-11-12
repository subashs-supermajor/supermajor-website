/* Brief cinematic fade between the Work index and the Mitsuba case study.
   Real navigation still happens (no SPA), so back/forward stays native. */
(function () {
  "use strict";
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var veil = document.getElementById("page-veil");

  function resetTransition() {
    if (veil) {
      veil.classList.remove("is-active");
    }
    document.body.classList.remove("is-navigating", "is-loading");
    document.body.classList.add("is-loaded");
    var preloader = document.getElementById("preloader");
    if (preloader) {
      preloader.classList.add("hide");
      preloader.style.display = "none";
    }
  }

  // Ensure clean state on script execution
  resetTransition();

  // Restore cleanly when restored from browser bfcache (Back/Forward navigation)
  window.addEventListener("pageshow", function () {
    resetTransition();
  });

  // Clean up before page hides so cached bfcache snapshot never retains active veil
  window.addEventListener("pagehide", function () {
    resetTransition();
  });

  if (!veil) return;

  document.addEventListener("click", function (e) {
    var link = e.target.closest ? e.target.closest("[data-page-transition]") : null;
    if (!link) return;
    var href = link.getAttribute("href");
    if (!href || link.target === "_blank") return;

    e.preventDefault();
    var preloader = document.getElementById("preloader");
    if (preloader) {
      preloader.classList.remove("hide");
      preloader.style.display = "flex";
      preloader.style.transform = "translateY(0)";
      var bar = document.getElementById("pl-bar-fill");
      var track = document.getElementById("pl-changing-track");
      if (bar) bar.style.width = "0%";
      if (track) track.style.transform = "translateY(0)";
    }
    document.body.classList.add("is-navigating", "is-loading");
    document.body.classList.remove("is-loaded");
    veil.classList.add("is-active");
    var delay = reducedMotion ? 0 : 420;
    setTimeout(function () {
      window.location.href = href;
    }, delay);
  });
})();


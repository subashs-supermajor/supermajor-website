/**
 * SUPERMAJOR - Editorial Case Study Scroll Animations & Parallax
 * Drives cinematic scroll-based reveals, image parallax,
 * and micro-interactions on all case study pages in works/
 */
(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);

  function initAnimations() {
    if (reducedMotion || !hasGsap) {
      // Fallback: reveal all animated elements immediately
      document.querySelectorAll("[data-reveal]").forEach(function (el) {
        el.classList.add("revealed");
      });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // 1. Generic [data-reveal] trigger for case study elements
    document.querySelectorAll("[data-reveal]").forEach(function (el) {
      ScrollTrigger.create({
        trigger: el,
        start: "top 88%",
        once: true,
        onEnter: function () {
          el.classList.add("revealed");
        }
      });
    });

    // 2. Staggered reveal for Editorial Metadata Rows
    var metaTables = document.querySelectorAll(".editorial-meta-table");
    metaTables.forEach(function (table) {
      var rows = table.querySelectorAll(".editorial-meta-row");
      if (rows.length) {
        gsap.fromTo(
          rows,
          { opacity: 0, y: 16 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.08,
            ease: "power2.out",
            scrollTrigger: {
              trigger: table,
              start: "top 85%",
              once: true
            }
          }
        );
      }
    });

    // 3. Staggered reveal for Pipeline Process Cards
    var pipelineGrids = document.querySelectorAll(".pipeline-grid");
    pipelineGrids.forEach(function (grid) {
      var cards = grid.children;
      if (cards.length) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 28 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.12,
            ease: "power2.out",
            scrollTrigger: {
              trigger: grid,
              start: "top 85%",
              once: true
            }
          }
        );
      }
    });

    // 4. Subtle Parallax on Hero Visual & Panoramic Banner
    var parallaxImages = document.querySelectorAll(".case-parallax-media");
    parallaxImages.forEach(function (img) {
      var parent = img.parentElement;
      if (!parent) return;

      gsap.fromTo(
        img,
        { scale: 1.06, yPercent: -4 },
        {
          scale: 1.0,
          yPercent: 4,
          ease: "none",
          scrollTrigger: {
            trigger: parent,
            start: "top bottom",
            end: "bottom top",
            scrub: true
          }
        }
      );
    });

    // 5. Staggered reveal for Outcome Metrics
    var metricGrids = document.querySelectorAll(".outcome-metrics-grid");
    metricGrids.forEach(function (grid) {
      var metrics = grid.children;
      if (metrics.length) {
        gsap.fromTo(
          metrics,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.65,
            stagger: 0.1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: grid,
              start: "top 85%",
              once: true
            }
          }
        );
      }
    });

    // Refresh ScrollTrigger once DOM/fonts settle
    setTimeout(function () {
      ScrollTrigger.refresh();
    }, 200);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAnimations);
  } else {
    initAnimations();
  }

  window.addEventListener("load", function () {
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  });
})();

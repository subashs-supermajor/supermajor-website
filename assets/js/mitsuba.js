(function () {
  "use strict";
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  (function mitsubaMediaMotion() {
    var mediaFrames = [].slice.call(document.querySelectorAll(".mitsuba-media-frame, .mitsuba-hero-visual"));
    if (!mediaFrames.length) return;

    mediaFrames.forEach(function (frame) {
      var media = frame.querySelector(".mitsuba-media");
      if (!media) return;

      if (hasGsap && !reducedMotion) {
        gsap.to(media, {
          yPercent: 4,
          ease: "none",
          scrollTrigger: {
            trigger: frame,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.6,
            invalidateOnRefresh: true
          }
        });
      }
    });
  })();

  /* ---------------- Lazy video loading + play/pause on visibility ---------------- */
  (function lazyVideos() {
    var videos = [].slice.call(document.querySelectorAll("video[data-lazy]"));
    if (!videos.length) return;

    function hydrate(video) {
      if (video._hydrated) return;
      video._hydrated = true;
      var source = video.querySelector("source[data-src]");
      if (source) {
        source.setAttribute("src", source.getAttribute("data-src"));
        video.load();
      }
    }

    if (reducedMotion) {
      // Load posters only; do not autoplay heavy motion content.
      return;
    }

    if (!("IntersectionObserver" in window)) {
      videos.forEach(function (v) {
        hydrate(v);
        v.play().catch(function () { });
      });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var video = entry.target;
          if (entry.isIntersecting) {
            hydrate(video);
            video.play().catch(function () { });
          } else if (video._hydrated) {
            video.pause();
          }
        });
      },
      { rootMargin: "400px 0px" }
    );

    videos.forEach(function (v) { io.observe(v); });
  })();

  /* ---------------- Clip-path / scale image reveals ---------------- */
  (function reveals() {
    var frames = [].slice.call(document.querySelectorAll(".reveal-frame"));
    if (!frames.length) return;

    if (reducedMotion || !hasGsap) {
      frames.forEach(function (f) { f.classList.add("is-in"); });
      return;
    }

    frames.forEach(function (frame) {
      ScrollTrigger.create({
        trigger: frame,
        start: "top 85%",
        once: true,
        onEnter: function () { frame.classList.add("is-in"); }
      });
    });
  })();

  /* ---------------- Sticky story steps ---------------- */
  (function stickyStory() {
    var steps = [].slice.call(document.querySelectorAll(".story-step"));
    if (!steps.length) return;

    var navItems = [].slice.call(document.querySelectorAll("[data-story-nav]"));

    function setActive(idx) {
      steps.forEach(function (s, i) { s.classList.toggle("is-active", i === idx); });
      navItems.forEach(function (n, i) { n.classList.toggle("is-active", i === idx); });
    }

    setActive(0);

    if (reducedMotion || !("IntersectionObserver" in window)) {
      steps.forEach(function (s) { s.classList.add("is-active"); });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var idx = steps.indexOf(entry.target);
            if (idx > -1) setActive(idx);
          }
        });
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: 0 }
    );

    steps.forEach(function (s) { io.observe(s); });
  })();

  /* ---------------- Horizontal scroll gallery (desktop, pinned) ---------------- */
  (function horizontalGallery() {
    var wrap = document.querySelector(".h-gallery[data-pin]");
    var track = wrap ? wrap.querySelector(".h-gallery-track") : null;
    if (!wrap || !track || !hasGsap || reducedMotion) return;

    var mm = gsap.matchMedia();
    mm.add("(min-width: 768px)", function () {
      var st = ScrollTrigger.create({
        trigger: wrap,
        start: "top top",
        end: function () { return "+=" + Math.max(track.scrollWidth - wrap.clientWidth, 1); },
        pin: true,
        scrub: 0.6,
        invalidateOnRefresh: true,
        onUpdate: function (self) {
          var max = track.scrollWidth - wrap.clientWidth;
          gsap.set(track, { x: -self.progress * max });
        }
      });
      return function () { st.kill(); };
    });
  })();

  /* ---------------- Hero scroll parallax (subtle, transform/opacity only) ---------------- */
  (function heroScroll() {
    var hero = document.querySelector(".case-hero");
    var media = hero ? hero.querySelector(".case-hero-media") : null;
    var content = hero ? hero.querySelector(".case-hero-content") : null;
    if (!hero || !hasGsap || reducedMotion) return;

    gsap.to(media, {
      scale: 0.94,
      opacity: 0.6,
      ease: "none",
      scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true }
    });

    if (content) {
      gsap.to(content, {
        yPercent: -18,
        opacity: 0.35,
        ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true }
      });
    }
  })();

  /* ---------------- Custom-chrome YouTube embed ----------------
     controls:0 hides YouTube's native bar; we drive everything via
     the IFrame Player API with our own minimal control surface. */
  (function customYoutubePlayer() {
    var mount = document.getElementById("mitsuba-yt-player");
    var fullscreenBtn = document.getElementById("mitsuba-yt-fullscreen");
    var muteBtn = document.getElementById("mitsuba-yt-mute");
    var mutedIcon = muteBtn ? muteBtn.querySelector('[data-icon="muted"]') : null;
    var unmutedIcon = muteBtn ? muteBtn.querySelector('[data-icon="unmuted"]') : null;
    var settingsBtn = document.getElementById("mitsuba-yt-settings");
    var settingsMenu = document.getElementById("mitsuba-yt-settings-menu");
    var speedList = document.getElementById("mitsuba-yt-speed-options");
    var qualityList = document.getElementById("mitsuba-yt-quality-options");
    var volumeSlider = document.getElementById("mitsuba-yt-volume");
    if (!mount) return;
    var videoId = mount.getAttribute("data-yt-id");
    if (!videoId) return;

    var QUALITY_LABELS = {
      highres: "Highest", hd2160: "2160p", hd1440: "1440p", hd1080: "1080p",
      hd720: "720p", large: "480p", medium: "360p", small: "240p", tiny: "144p", auto: "Auto"
    };
    var SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

    var lastVolume = 100;
    var userSetQuality = false;

    function updateSliderFill(slider) {
      var pct = slider.value + "%";
      slider.style.background = "linear-gradient(to right,rgba(255,255,255,.9) 0%,rgba(255,255,255,.9) " + pct + ",rgba(255,255,255,.3) " + pct + ",rgba(255,255,255,.3) 100%)";
    }

    function setMuteUI(isMuted) {
      if (mutedIcon) mutedIcon.classList.toggle("hidden", !isMuted);
      if (unmutedIcon) unmutedIcon.classList.toggle("hidden", isMuted);
      if (muteBtn) {
        muteBtn.setAttribute("aria-pressed", String(isMuted));
        muteBtn.setAttribute("aria-label", isMuted ? "Unmute" : "Mute");
      }
    }

    function closeSettingsMenu() {
      if (!settingsMenu) return;
      settingsMenu.classList.add("hidden");
      if (settingsBtn) settingsBtn.setAttribute("aria-expanded", "false");
    }

    /* Position the fixed-menu near the settings button, keeping it on-screen. */
    function positionSettingsMenu() {
      if (!settingsBtn || !settingsMenu) return;
      var rect = settingsBtn.getBoundingClientRect();
      var menuW = 176; /* w-44 */
      var gap = 8;
      settingsMenu.style.top = "auto";
      settingsMenu.style.bottom = (window.innerHeight - rect.top + gap) + "px";
      var fromLeft = rect.right - menuW;
      if (fromLeft < gap) {
        settingsMenu.style.left = gap + "px";
        settingsMenu.style.right = "auto";
      } else {
        settingsMenu.style.right = (window.innerWidth - rect.right) + "px";
        settingsMenu.style.left = "auto";
      }
    }

    function buildSettingsMenu(player) {
      if (!settingsMenu) return;

      if (speedList) {
        speedList.innerHTML = "";
        var currentRate = player.getPlaybackRate();
        SPEEDS.forEach(function (rate) {
          var btn = document.createElement("button");
          btn.type = "button";
          btn.textContent = rate + "x";
          btn.className = "rounded-md px-2 py-1 text-[11px] font-medium transition " +
            (rate === currentRate ? "bg-white text-black" : "bg-white/10 hover:bg-white/20 text-white");
          btn.addEventListener("click", function () {
            player.setPlaybackRate(rate);
            closeSettingsMenu();
          });
          speedList.appendChild(btn);
        });
      }

      if (qualityList) {
        qualityList.innerHTML = "";
        var levels = player.getAvailableQualityLevels();
        var currentQuality = player.getPlaybackQuality();
        if (!levels || !levels.length) levels = ["auto"];
        levels.forEach(function (level) {
          var btn = document.createElement("button");
          btn.type = "button";
          var label = QUALITY_LABELS[level] || level;
          var isActive = level === currentQuality;
          btn.innerHTML = '<span style="display:flex;align-items:center;justify-content:space-between;gap:8px">' +
            '<span>' + label + '</span>' +
            (isActive ? '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>' : '') +
            '</span>';
          btn.style.cssText = "width:100%;text-align:left;padding:5px 8px;border-radius:6px;font-size:11px;transition:background .15s;" +
            (isActive ? "background:rgba(255,255,255,.15);color:#fff;font-weight:500" : "color:rgba(255,255,255,.8)");
          btn.addEventListener("mouseover", function () { if (!isActive) btn.style.background = "rgba(255,255,255,.08)"; });
          btn.addEventListener("mouseout", function () { if (!isActive) btn.style.background = ""; });
          btn.addEventListener("click", function () {
            userSetQuality = true;
            player.setPlaybackQuality(level);
            closeSettingsMenu();
          });
          qualityList.appendChild(btn);
        });
      }
    }

    function initPlayer() {
      new window.YT.Player(mount, {
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          iv_load_policy: 3,
          cc_load_policy: 0
        },
        events: {
          onReady: function (e) {
            e.target.playVideo();
            setMuteUI(true);
            forcePreferredQuality(e.target);

            var ytIframe = e.target.getIframe();
            if (ytIframe) {
              ytIframe.style.position = "absolute";
              ytIframe.style.left = "0";
              ytIframe.style.top = "0";
              ytIframe.style.width = "100%";
              ytIframe.style.height = "100%";
            }

            if (fullscreenBtn) {
              fullscreenBtn.addEventListener("click", function () {
                var iframe = e.target.getIframe();
                if (iframe.requestFullscreen) iframe.requestFullscreen();
                else if (iframe.webkitRequestFullscreen) iframe.webkitRequestFullscreen();
                else if (iframe.msRequestFullscreen) iframe.msRequestFullscreen();
              });
            }

            if (muteBtn) {
              muteBtn.addEventListener("click", function () {
                var nowMuted = !e.target.isMuted();
                if (nowMuted) {
                  e.target.mute();
                  if (volumeSlider) { volumeSlider.value = 0; updateSliderFill(volumeSlider); }
                } else {
                  e.target.unMute();
                  e.target.setVolume(lastVolume);
                  if (volumeSlider) { volumeSlider.value = lastVolume; updateSliderFill(volumeSlider); }
                }
                setMuteUI(nowMuted);
              });
            }

            if (volumeSlider) {
              updateSliderFill(volumeSlider);
              volumeSlider.addEventListener("input", function () {
                var vol = parseInt(volumeSlider.value, 10);
                updateSliderFill(volumeSlider);
                if (vol === 0) {
                  e.target.mute();
                  setMuteUI(true);
                } else {
                  if (e.target.isMuted()) e.target.unMute();
                  e.target.setVolume(vol);
                  lastVolume = vol;
                  setMuteUI(false);
                }
              });
            }

            if (settingsBtn && settingsMenu) {
              settingsBtn.addEventListener("click", function (ev) {
                ev.stopPropagation();
                var isHidden = settingsMenu.classList.contains("hidden");
                if (isHidden) {
                  buildSettingsMenu(e.target);
                  settingsMenu.classList.remove("hidden");
                  positionSettingsMenu();
                  settingsBtn.setAttribute("aria-expanded", "true");
                } else {
                  closeSettingsMenu();
                }
              });
              document.addEventListener("click", function (ev) {
                if (!settingsMenu.contains(ev.target) && ev.target !== settingsBtn) {
                  closeSettingsMenu();
                }
              });
              window.addEventListener("scroll", closeSettingsMenu, { passive: true });
              window.addEventListener("resize", function () {
                if (!settingsMenu.classList.contains("hidden")) positionSettingsMenu();
              }, { passive: true });
            }
          },
          onStateChange: function (e) {
            if (e.data === window.YT.PlayerState.PLAYING) {
              hidePoster();
              if (!userSetQuality) forcePreferredQuality(e.target);
            }
          }
        }
      });
    }

    function hidePoster() {
      var poster = document.getElementById("mitsuba-yt-poster");
      if (!poster || poster.classList.contains("opacity-0")) return;
      poster.classList.add("opacity-0");
      setTimeout(function () { poster.remove(); }, 800);
    }

    /* Prefer 1080p as the default quality. YouTube still adapts down
       if the viewer's connection can't sustain it. If 1080p isn't in
       the available levels yet, fall back to the highest offered. */
    function forcePreferredQuality(player) {
      try {
        var levels = player.getAvailableQualityLevels();
        if (!levels || !levels.length) return;
        var preferred = levels.indexOf("hd1080") !== -1 ? "hd1080" : levels[0];
        player.setPlaybackQuality(preferred);
      } catch (err) {}
    }

    if (window.YT && window.YT.Player) {
      initPlayer();
      return;
    }

    var previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () {
      if (typeof previousCallback === "function") previousCallback();
      initPlayer();
    };

    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      var tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
  })();

  /* ---------------- The Process: Pinned Scrubbed Line Animation ---------------- */
  (function processPinnedTimeline() {
    var section = document.getElementById("process");
    if (!section || !hasGsap) return;

    var progressFill = section.querySelector(".process-track-fill");
    var runner = section.querySelector(".process-track-runner");
    var track = section.querySelector(".process-track-line");
    var steps = [].slice.call(section.querySelectorAll(".process-step"));
    var pctText = section.querySelector(".process-progress-pct");

    if (!progressFill || !track) return;

    if (reducedMotion) {
      gsap.set(progressFill, { width: "100%" });
      if (runner) gsap.set(runner, { left: "100%" });
      steps.forEach(function (s) { s.classList.add("is-active"); });
      if (pctText) pctText.textContent = "100%";
      return;
    }

    function getStepThresholds() {
      var trackRect = track.getBoundingClientRect();
      if (!trackRect.width) return [0.01, 0.22, 0.42, 0.62, 0.82];
      return steps.map(function (step, idx) {
        var node = step.querySelector(".process-step-node") || step;
        var nodeRect = node.getBoundingClientRect();
        var ratio = (nodeRect.left + nodeRect.width / 2 - trackRect.left) / trackRect.width;
        return Math.max(0, Math.min(1, ratio));
      });
    }

    var thresholds = getStepThresholds();

    ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "+=1200",
      pin: true,
      scrub: 0.5,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onRefresh: function () {
        thresholds = getStepThresholds();
      },
      onUpdate: function (self) {
        var p = self.progress; // 0 to 1

        // Scrub the progress fill line from left to right (0% to 100%)
        gsap.set(progressFill, { width: (p * 100) + "%" });

        // Glide the glowing runner bead along the line
        if (runner) {
          gsap.set(runner, { left: (p * 100) + "%" });
        }

        // Live percentage counter
        if (pctText) {
          pctText.textContent = Math.round(p * 100) + "%";
        }

        // Activate / deactivate steps dynamically based on scroll progress
        steps.forEach(function (step, i) {
          var t = (thresholds[i] !== undefined) ? thresholds[i] : (i * 0.22);
          var isPassed = (i === 0) ? (p >= 0.01) : (p >= (t - 0.02));
          step.classList.toggle("is-active", isPassed);
        });
      }
    });
  })();
})();

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const smallMobile = window.matchMedia('(max-width: 639px)').matches;

    // Project Details Store
    const projects = {
      "precision-in-form": {
        title: "Precision in Form",
        category: "3D & CGI",
        tags: "Product visualisation · Concept study",
        image: "https://cdn.prod.website-files.com/692f25b223f2b302c5738113/695a0a2496547747739b4e11_project%20card%20image%202.avif",
        overview: "A premium consumer product developed as a precise digital asset and rendered across studio, material-detail and lifestyle scenes.",
        challenge: "Create one production-ready product asset capable of carrying a consistent visual identity across campaign formats without losing material accuracy.",
        approach: "We treated modelling, surfacing, lighting and framing as one connected process. Each decision was tested at hero scale and close detail before expanding the asset into a flexible image system.",
        deliverables: "3D modelling · Material development · CGI renders",
        ai: ""
      },
      "kinetic-objects": {
        title: "Kinetic Objects",
        category: "Animation & Films",
        tags: "Product film · Concept study",
        image: "https://cdn.prod.website-files.com/692f25b223f2b302c5738113/6958ad981856872ea999e6bc_card%20image%202.avif",
        overview: "A cinematic product sequence showing form, function, materials and movement.",
        challenge: "Translate product benefits into a short sequence that communicates through motion rather than explanation.",
        approach: "The film was structured around controlled camera moves, tactile transitions and precise material response. Motion supports the product hierarchy instead of competing with it.",
        deliverables: "Creative direction · CGI animation · Product film",
        ai: ""
      },
      "signal-and-story": {
        title: "Signal & Story",
        category: "Websites & Brand",
        tags: "Digital experience · Concept study",
        image: "https://cdn.prod.website-files.com/692f25b223f2b302c5738113/69304ca0b568982e93ac4828_project%20card%20image%201.avif",
        overview: "A product-led website combining brand storytelling, CGI imagery and interactive presentation.",
        challenge: "Build a clear digital narrative where visual impact never compromises product information or usability.",
        approach: "We developed the content hierarchy, interaction model and CGI system together, creating a consistent experience from the first frame to detailed product exploration.",
        deliverables: "Strategy · Web design · Development · CGI",
        ai: ""
      },
      "placed-in-context": {
        title: "Placed in Context",
        category: "AR & 3D Commerce",
        tags: "Interactive commerce · Concept study",
        image: "https://cdn.prod.website-files.com/692f25b223f2b302c5738113/69307a6778a053a670143ada_project%20card%20image.avif",
        overview: "A product translated into an optimised interactive asset and placed inside a realistic customer environment.",
        challenge: "Preserve visual quality while meeting the performance constraints required for responsive real-time viewing.",
        approach: "The product was rebuilt around a controlled geometry and texture budget, then tested across scale, lighting and placement conditions.",
        deliverables: "Real-time 3D · AR placement · Commerce asset",
        ai: ""
      },
      "worlds-around-one-product": {
        title: "Worlds Around One Product",
        category: "3D & CGI",
        tags: "AI-assisted concept study",
        image: "https://cdn.prod.website-files.com/692f25b223f2b302c5738113/695a09e703602d5c373cac12_project%20card%20image.avif",
        overview: "One controlled product shown across several directed campaign environments using CGI and generative production.",
        challenge: "Create campaign variety quickly while maintaining the exact product form, materials and brand intent in every output.",
        approach: "The product remained controlled through CGI. Human creative direction set the visual rules while AI supported environment exploration and production variations.",
        deliverables: "Creative direction · CGI · AI-assisted environments",
        ai: "AI supported environment exploration and selected campaign variations. Product geometry, materials, composition standards and every final output remained under human creative direction and CGI control."
      },
      "material-rhythm": {
        title: "Material Rhythm",
        category: "Animation & Films",
        tags: "Motion study · Concept study",
        image: "https://cdn.prod.website-files.com/692f25b223f2b302c5738113/695a08f632223729da7efafb_card%20image%202.avif",
        overview: "A tactile motion study turning product surfaces and details into a precise visual rhythm.",
        challenge: "Make material behaviour the central narrative while keeping the sequence concise and product-led.",
        approach: "Lighting, camera movement and transitions were designed together to make every material shift readable and intentional.",
        deliverables: "Look development · CGI animation · Motion frames",
        ai: ""
      },
      "the-product-is-the-interface": {
        title: "The Product Is the Interface",
        category: "Websites & Brand",
        tags: "Commerce experience · Concept study",
        image: "https://cdn.prod.website-files.com/692f25b223f2b302c5738113/6958ad981856872ea999e6bc_card%20image%202-p-800.avif",
        overview: "A commerce experience where brand, product imagery and interaction operate as one system.",
        challenge: "Create an expressive visual identity that remains fast, legible and useful throughout a product journey.",
        approach: "We established a modular brand and interface system, then produced CGI assets for consistent use across key product and campaign moments.",
        deliverables: "Brand system · Web design · Development · CGI",
        ai: ""
      }
    };

    /* ---------------- Hero Headline & Ambient Animations ---------------- */
    function initHeroAnimations() {
      if (reduceMotion) return;

      if (window.gsap) {
        // Line-by-line staggered reveal for the hero headline
        gsap.fromTo('.hero-title-line',
          { yPercent: 115, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 1.15, ease: 'power4.out', stagger: 0.12, delay: 0.15 }
        );

        // Eyebrow tag reveal
        gsap.fromTo('[data-hero-eyebrow]',
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.05 }
        );

        // Meta information reveal
        gsap.fromTo('[data-hero-meta]',
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.85, ease: 'power3.out', delay: 0.35 }
        );

        // Ambient glowing orb subtle pulsation
        gsap.to('.hero-ambient-orb-1', {
          scale: 1.14,
          x: 15,
          y: -12,
          duration: 7,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut'
        });
        gsap.to('.hero-ambient-orb-2', {
          scale: 1.08,
          rotation: 10,
          duration: 9,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut'
        });
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initHeroAnimations);
    } else {
      initHeroAnimations();
    }

    /* ---------------- Marquees (Capabilities + Contact) ---------------- */
    let capabilityAnimation;
    let contactAnimation;

    function startMarquees() {
      const capability = document.getElementById('capability-marquee');
      const contact = document.getElementById('contact-marquee');

      if (!reduceMotion) {
        if (capability) {
          capabilityAnimation = capability.animate(
            [{ transform: 'translateX(0)' }, { transform: 'translateX(-50%)' }],
            { duration: smallMobile ? 18000 : 32000, iterations: Infinity, easing: 'linear' }
          );

          capability.addEventListener('mouseenter', () => capabilityAnimation.pause());
          capability.addEventListener('mouseleave', () => capabilityAnimation.play());
          capability.addEventListener('focusin', () => capabilityAnimation.pause());
          capability.addEventListener('focusout', () => capabilityAnimation.play());
        }

        if (contact) {
          contactAnimation = contact.animate(
            [{ transform: 'translateX(0)' }, { transform: 'translateX(-50%)' }],
            { duration: smallMobile ? 22000 : 38000, iterations: Infinity, easing: 'linear' }
          );
        }
      } else {
        if (capability) {
          capability.classList.add('w-max', 'whitespace-nowrap');
        }
        if (contact) {
          contact.classList.remove('w-max', 'whitespace-nowrap');
          contact.classList.add('w-full', 'whitespace-normal', 'text-center');
          if (contact.children[1]) contact.children[1].classList.add('hidden');
        }
      }
    }

    startMarquees();

    /* ---------------- Filter Toolbar with Animated Transition ---------------- */
    const cards = Array.from(document.querySelectorAll('[data-project]'));
    const filterButtons = Array.from(document.querySelectorAll('.filter-button'));
    const emptyState = document.getElementById('empty-state');
    const filterBar = document.getElementById('filter-bar');

    /* Drag & swipe gesture interaction for filter bar */
    if (filterBar) {
      let isDown = false;
      let startX = 0;
      let scrollLeft = 0;
      let hasMoved = false;

      filterBar.addEventListener('mousedown', (e) => {
        isDown = true;
        hasMoved = false;
        startX = e.pageX - filterBar.offsetLeft;
        scrollLeft = filterBar.scrollLeft;
      });

      window.addEventListener('mouseup', () => {
        if (isDown) {
          isDown = false;
          setTimeout(() => { hasMoved = false; }, 50);
        }
      });

      filterBar.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        const x = e.pageX - filterBar.offsetLeft;
        const walk = (x - startX) * 1.5;
        if (Math.abs(x - startX) > 6) {
          hasMoved = true;
        }
        filterBar.scrollLeft = scrollLeft - walk;
      });

      filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          if (hasMoved) {
            e.preventDefault();
            e.stopImmediatePropagation();
            return;
          }
          btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }, true);
      });
    }

    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        const filter = button.dataset.filter;

        filterButtons.forEach(item => {
          const active = item === button;
          item.setAttribute('aria-pressed', String(active));
          if (active) {
            item.classList.remove('border', 'border-[#BDB7AE]');
            item.classList.add('border-2', 'border-[#C93708]', 'font-semibold');
            item.style.background = '#FFFFFF';
            item.style.color = '#151210';
          } else {
            item.classList.remove('border-2', 'border-[#C93708]', 'font-semibold');
            item.classList.add('border', 'border-[#BDB7AE]');
            item.style.background = '#FFFFFF';
            item.style.color = '#151210';
          }
        });

        let visibleCards = [];

        cards.forEach(card => {
          const visible = filter === 'all' || card.dataset.category === filter;

          if (visible) {
            visibleCards.push(card);
            card.classList.remove('hidden');
            if (!reduceMotion && window.gsap) {
              gsap.fromTo(card,
                { opacity: 0, y: 30, scale: 0.98 },
                { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'power3.out' }
              );
            }
          } else {
            if (!reduceMotion && window.gsap) {
              gsap.to(card, {
                opacity: 0,
                y: 15,
                duration: 0.25,
                ease: 'power2.in',
                onComplete: () => { card.classList.add('hidden'); }
              });
            } else {
              card.classList.add('hidden');
            }
          }
        });

        if (emptyState) {
          emptyState.classList.toggle('hidden', visibleCards.length !== 0);
        }

        if (window.ScrollTrigger) {
          setTimeout(() => ScrollTrigger.refresh(), 300);
        }
      });
    });

    /* ---------------- Interactive 3D Card Hover & Tilt Physics ---------------- */
    if (!reduceMotion) {
      cards.filter(card => !card.hasAttribute('data-no-hover')).forEach(card => {
        card.addEventListener('mousemove', e => {
          const rect = card.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width - 0.5;
          const y = (e.clientY - rect.top) / rect.height - 0.5;
          const mask = card.querySelector('.project-image-mask');
          if (mask) {
            mask.style.transform = `perspective(1000px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 5).toFixed(2)}deg) translateZ(8px)`;
          }
        });

        card.addEventListener('mouseleave', () => {
          const mask = card.querySelector('.project-image-mask');
          if (mask) {
            mask.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
          }
        });
      });
    }

    /* ---------------- Project Detail Dynamic Markup ---------------- */
    function detailMarkup(slug) {
      const project = projects[slug];
      if (!project) return '';

      const slugs = Object.keys(projects);
      const nextSlug = slugs[(slugs.indexOf(slug) + 1) % slugs.length];
      const next = projects[nextSlug];

      return `
        <article class="detail-article">
          <section data-nav-theme="dark" class="bg-[#151210] pb-16 pt-16 text-[#F5F1EB] sm:pb-24 sm:pt-20 lg:pb-28">
            <div class="mx-auto max-w-[1320px] px-5 sm:px-6 lg:px-10">
              <button type="button" data-back-to-work class="mb-10 inline-flex min-h-11 items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#E8400A] transition-transform duration-200 hover:-translate-x-1 outline-none">
                <iconify-icon icon="solar:arrow-left-linear" width="18" height="18"></iconify-icon>
                All work
              </button>
              <div class="eyebrow-tag text-brand mb-4">
                <span class="dot"></span>
                ${project.category}
              </div>
              <h1 class="mt-4 max-w-6xl font-display font-black text-5xl uppercase leading-[0.92] tracking-[-0.055em] text-white sm:text-7xl lg:text-8xl">${project.title}</h1>
              <p class="mt-4 text-xs font-mono uppercase tracking-[0.18em] text-[#F5F1EB]/50">${project.tags}</p>
            </div>
          </section>

          <section data-nav-theme="dark" class="bg-[#151210] px-5 pb-12 sm:px-6 sm:pb-16 lg:px-10">
            <div class="mx-auto max-w-[1440px] overflow-hidden shadow-2xl">
              <img loading="lazy" src="${project.image}" alt="${project.title} project hero visual" class="aspect-[16/9] h-full w-full object-cover">
            </div>
          </section>

          <section data-nav-theme="light" class="py-16 sm:py-24 lg:py-32 bg-[#F5F1EB]">
            <div class="mx-auto grid max-w-[1320px] gap-12 px-5 sm:px-6 md:grid-cols-12 lg:px-10">
              <div class="md:col-span-3">
                <span class="eyebrow-tag text-brand">Overview</span>
              </div>
              <p class="max-w-4xl text-2xl font-medium leading-snug tracking-[-0.025em] md:col-span-9 sm:text-3xl text-ink">${project.overview}</p>
            </div>
          </section>

          <section data-nav-theme="light" class="border-y border-[#E0DAD0] bg-[#EDEBE6] py-16 sm:py-24 lg:py-32">
            <div class="mx-auto grid max-w-[1320px] gap-14 px-5 sm:px-6 md:grid-cols-2 lg:px-10">
              <div>
                <span class="eyebrow-tag text-[#8A8480]">Creative objective</span>
                <h2 class="mt-4 font-display text-3xl font-bold uppercase tracking-[-0.04em] sm:text-4xl text-ink">What needed to be solved</h2>
                <p class="mt-5 max-w-xl text-base leading-7 text-[#615C58]">${project.challenge}</p>
              </div>
              <div>
                <span class="eyebrow-tag text-[#8A8480]">Our approach</span>
                <h2 class="mt-4 font-display text-3xl font-bold uppercase tracking-[-0.04em] sm:text-4xl text-ink">One connected process</h2>
                <p class="mt-5 max-w-xl text-base leading-7 text-[#615C58]">${project.approach}</p>
              </div>
            </div>
          </section>

          <section data-nav-theme="light" class="py-16 sm:py-24 lg:py-32 bg-[#F5F1EB]">
            <div class="mx-auto max-w-[1320px] px-5 sm:px-6 lg:px-10">
              <div class="grid gap-6 sm:grid-cols-2">
                <div class="overflow-hidden bg-[#EDEBE6] shadow-md">
                  <img loading="lazy" src="${project.image}" alt="${project.title} composition view" class="aspect-[4/5] h-full w-full object-cover">
                </div>
                <div class="overflow-hidden bg-[#EDEBE6] shadow-md sm:mt-20">
                  <img loading="lazy" src="${project.image}" alt="${project.title} detail view" class="aspect-[4/5] h-full w-full scale-110 object-cover">
                </div>
              </div>

              <div class="mt-16 grid gap-8 border-t border-[#E0DAD0] pt-8 md:grid-cols-12">
                <p class="text-xs font-mono uppercase tracking-[0.18em] text-[#8A8480] md:col-span-3">Deliverables</p>
                <p class="text-xl font-bold uppercase leading-8 tracking-[0.06em] md:col-span-9 text-ink">${project.deliverables}</p>
              </div>

              ${project.ai ? `
                <div class="mt-12 grid gap-8 border-t border-[#E0DAD0] pt-8 md:grid-cols-12">
                  <p class="text-xs font-mono uppercase tracking-[0.18em] text-[#E8400A] md:col-span-3">AI's role</p>
                  <p class="max-w-3xl text-base sm:text-lg leading-8 text-[#615C58] md:col-span-9">${project.ai}</p>
                </div>
              ` : ''}
            </div>
          </section>

          <section data-nav-theme="dark" class="bg-[#151210] py-20 text-[#F5F1EB] sm:py-28 border-t border-white/10">
            <div class="mx-auto grid max-w-[1320px] gap-12 px-5 sm:px-6 md:grid-cols-12 md:items-end lg:px-10">
              <div class="md:col-span-8">
                <div class="eyebrow-tag text-brand mb-3">Next project</div>
                <a href="#${nextSlug}" data-route class="mt-2 block font-display text-4xl font-black uppercase leading-none tracking-tight text-white transition-colors hover:text-brand sm:text-6xl lg:text-7xl">
                  ${next.title} ↗
                </a>
              </div>
              <div class="md:col-span-4 md:text-right">
                <a href="mailto:business@supermajor.in" class="cta-work-case-study-start-project magnetic inline-flex min-h-16 items-center gap-4 rounded-full bg-brand px-8 text-sm font-bold uppercase tracking-[0.12em] text-[#151210] transition hover:bg-brandLight">
                  Start a project
                  <iconify-icon icon="solar:arrow-right-up-linear" width="22" height="22"></iconify-icon>
                </a>
              </div>
            </div>
          </section>
        </article>
      `;
    }

    /* ---------------- Seamless Routing (Grid ↔ Detail) ---------------- */
    function renderRoute(targetSlug, pushHistory = false) {
      const workPage = document.getElementById('work-page');
      const detailPage = document.getElementById('detail-page');
      if (!workPage || !detailPage) return;

      if (targetSlug && projects[targetSlug]) {
        workPage.classList.add('hidden');
        detailPage.classList.remove('hidden');
        detailPage.innerHTML = detailMarkup(targetSlug);
        document.title = `${projects[targetSlug].title} - Super Major`;

        if (pushHistory) {
          window.location.hash = targetSlug;
        }

        // Attach listener to "All work" back button
        const backBtn = detailPage.querySelector('[data-back-to-work]');
        if (backBtn) {
          backBtn.addEventListener('click', () => {
            renderRoute('', true);
          });
        }
      } else {
        detailPage.classList.add('hidden');
        detailPage.innerHTML = '';
        workPage.classList.remove('hidden');
        document.title = 'Selected Work - Super Major';

        if (pushHistory && window.location.hash) {
          history.pushState(null, '', window.location.pathname);
        }
      }

      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });

      if (window.ScrollTrigger) {
        setTimeout(() => ScrollTrigger.refresh(), 100);
      }
      if (typeof window.updateNavTheme === 'function') {
        setTimeout(window.updateNavTheme, 50);
      }
    }

    // Intercept project route clicks
    document.addEventListener('click', event => {
      const routeLink = event.target.closest('a[data-route]');
      if (!routeLink) return;

      event.preventDefault();
      const href = routeLink.getAttribute('href');
      let slug = '';

      if (href.startsWith('#')) {
        slug = href.substring(1);
      } else if (href.includes('/work/')) {
        slug = href.split('/work/')[1].replace(/\/$/, '');
      }

      renderRoute(slug, true);
    });

    // Handle hash change & initial load
    window.addEventListener('hashchange', () => {
      const hashSlug = window.location.hash.replace('#', '');
      renderRoute(hashSlug, false);
    });

    // Check initial hash
    if (window.location.hash) {
      const initialSlug = window.location.hash.replace('#', '');
      if (projects[initialSlug]) {
        renderRoute(initialSlug, false);
      }
    }
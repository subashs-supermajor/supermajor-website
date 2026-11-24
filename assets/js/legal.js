document.addEventListener('DOMContentLoaded', function () {
      const desktopLinks = document.querySelectorAll('#legal-toc .legal-toc-link');
      const mobilePills = document.querySelectorAll('#mobile-legal-toc .mobile-toc-pill');
      const sections = document.querySelectorAll('article section[id]');

      if (!sections.length) return;

      const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            const targetHref = '#' + id;

            // Update Desktop Sidebar Links
            desktopLinks.forEach(function (link) {
              if (link.getAttribute('href') === targetHref) {
                link.classList.add('active');
              } else {
                link.classList.remove('active');
              }
            });

            // Update Mobile Swipeable Pills
            mobilePills.forEach(function (pill) {
              if (pill.getAttribute('href') === targetHref) {
                pill.classList.remove('bg-white/80', 'text-ink', 'border-ink/15');
                pill.classList.add('bg-brand', 'text-white', 'border-brand', 'shadow-xs', 'font-semibold');
                // Scroll active pill into view smoothly horizontally
                pill.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
              } else {
                pill.classList.remove('bg-brand', 'text-white', 'border-brand', 'shadow-xs', 'font-semibold');
                pill.classList.add('bg-white/80', 'text-ink', 'border-ink/15');
              }
            });
          }
        });
      }, {
        rootMargin: '-15% 0px -65% 0px',
        threshold: 0
      });

      sections.forEach(function (sec) {
        observer.observe(sec);
      });
    });
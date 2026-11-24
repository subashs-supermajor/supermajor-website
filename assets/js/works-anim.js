const title = document.querySelector("[data-title]");

    if (
      title &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {

      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          title.classList.remove("translate-y-full")
        )
      );
    } else if (title) {
      title.classList.remove("translate-y-full");
    }
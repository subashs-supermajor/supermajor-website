window.addEventListener('pageshow', function () {
      var veil = document.getElementById('page-veil');
      if (veil) veil.classList.remove('is-active');
      document.body.classList.remove('is-navigating', 'is-loading');
      document.body.classList.add('is-loaded');
    });
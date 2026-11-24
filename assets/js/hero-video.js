window.addEventListener('load', function () {
  var video = document.querySelector('video[data-hero-video]');
  var net = navigator.connection;
  if (!video || window.innerWidth < 768 || (net && net.saveData)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  setTimeout(function () {
    new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        var playing = video.play();
        if (playing && playing.catch) playing.catch(function () { });
      } else {
        video.pause();
      }
    }, { threshold: 0.25 }).observe(video);
  }, 1200);
});

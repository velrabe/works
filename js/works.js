(function () {
  var cards = document.querySelectorAll("[data-reveal], .works-page__service-card");
  if (!cards.length) return;

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -5% 0px" }
  );

  cards.forEach(function (card, index) {
    card.style.transitionDelay = Math.min(index * 0.05, 0.35) + "s";
    observer.observe(card);
  });
})();

(function () {
  if (typeof Lenis === "undefined") return;

  var lenis = new Lenis({
    duration: 1.1,
    easing: function (t) {
      return Math.min(1, 1.001 - Math.pow(2, -10 * t));
    },
    smoothWheel: true,
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }

  requestAnimationFrame(raf);
})();

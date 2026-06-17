(function () {
  var cards = document.querySelectorAll("[data-reveal], .works-page__service-card");
  if (cards.length) {
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
      card.style.transitionDelay = Math.min(index * 0.04, 0.2) + "s";
      observer.observe(card);
    });
  }
})();

(function () {
  function getSlideStep(slide) {
    if (!slide) return 0;
    var styles = window.getComputedStyle(slide);
    var gap = parseFloat(styles.marginRight) || 0;
    return slide.offsetWidth + gap;
  }

  function scrollCarousel(btn, direction) {
    var carousel = btn.closest("[data-carousel]");
    if (!carousel) return;
    var track = carousel.querySelector(".works-page__carousel-track");
    if (!track) return;
    var slide = track.querySelector(".works-page__carousel-slide");
    track.scrollBy({ left: direction * getSlideStep(slide), behavior: "smooth" });
  }

  function updateActiveSlides(track) {
    var slides = track.querySelectorAll(".works-page__carousel-slide");
    if (!slides.length) return;

    var trackRect = track.getBoundingClientRect();
    var center = trackRect.left + trackRect.width / 2;
    var closest = null;
    var closestDistance = Infinity;

    slides.forEach(function (slide) {
      var rect = slide.getBoundingClientRect();
      var slideCenter = rect.left + rect.width / 2;
      var distance = Math.abs(center - slideCenter);
      slide.classList.toggle("is-active", false);
      if (distance < closestDistance) {
        closestDistance = distance;
        closest = slide;
      }
    });

    if (closest) closest.classList.add("is-active");
  }

  document.querySelectorAll(".works-page__carousel-track").forEach(function (track) {
    updateActiveSlides(track);
    track.addEventListener("scroll", function () {
      updateActiveSlides(track);
    }, { passive: true });
  });

  document.querySelectorAll("[data-carousel-prev]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      scrollCarousel(btn, -1);
    });
  });

  document.querySelectorAll("[data-carousel-next]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      scrollCarousel(btn, 1);
    });
  });
})();

(function () {
  var openButtons = document.querySelectorAll("[data-modal-open]");
  var modals = document.querySelectorAll("[data-modal]");
  var lastFocus = null;
  var root = document.documentElement;

  function setModalLock(locked) {
    root.classList.toggle("works-modal-open", locked);
    document.body.classList.toggle("works-modal-open", locked);
  }

  function openModal(id) {
    var modal = document.getElementById(id);
    if (!modal) return;
    lastFocus = document.activeElement;
    modal.hidden = false;
    setModalLock(true);
    var closeBtn = modal.querySelector("[data-modal-close]");
    if (closeBtn) closeBtn.focus();
  }

  function closeModal(modal) {
    modal.hidden = true;
    if (!document.querySelector("[data-modal]:not([hidden])")) {
      setModalLock(false);
    }
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  openButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      openModal(btn.getAttribute("data-modal-open"));
    });
  });

  modals.forEach(function (modal) {
    modal.querySelectorAll("[data-modal-close]").forEach(function (el) {
      el.addEventListener("click", function () {
        closeModal(modal);
      });
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    modals.forEach(function (modal) {
      if (!modal.hidden) closeModal(modal);
    });
  });
})();

(function () {
  var copyBtn = document.querySelector("[data-copy-requisites]");
  var downloadBtn = document.querySelector("[data-download-requisites]");
  var source = document.getElementById("requisites-plain-text");

  if (copyBtn && source) {
    copyBtn.addEventListener("click", function () {
      navigator.clipboard.writeText(source.innerText.trim()).then(function () {
        copyBtn.setAttribute("data-copied", "true");
        setTimeout(function () {
          copyBtn.removeAttribute("data-copied");
        }, 2000);
      });
    });
  }

  if (downloadBtn && source) {
    downloadBtn.addEventListener("click", function () {
      if (!window.jspdf || !window.jspdf.jsPDF) return;
      var doc = new window.jspdf.jsPDF();
      var lines = doc.splitTextToSize(source.innerText.trim(), 180);
      doc.text(lines, 14, 20);
      doc.save("requisites.pdf");
    });
  }
})();

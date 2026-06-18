(function () {
  var cards = document.querySelectorAll("[data-reveal]");
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
    var showcase = btn.closest(".works-page__showcase");
    var carousel = showcase
      ? showcase.querySelector("[data-carousel]")
      : btn.closest("[data-carousel]");
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
    var lightbox = document.querySelector("[data-lightbox]");
    if (lightbox && !lightbox.hidden) return;
    modals.forEach(function (modal) {
      if (!modal.hidden) closeModal(modal);
    });
  });
})();

(function () {
  var copyBtn = document.querySelector("[data-copy-requisites]");
  var source = document.getElementById("requisites-plain-text");

  function getRequisitesCopyText() {
    var rows = document.querySelectorAll("#modal-requisites .works-modal__requisites-row");
    if (rows.length) {
      return Array.prototype.map
        .call(rows, function (row) {
          var labelEl = row.querySelector(".works-modal__requisites-label");
          var valueEl = row.querySelector(".works-modal__requisites-value");
          if (!labelEl || !valueEl) return "";

          var label = labelEl.textContent.trim();
          var value = valueEl.textContent.trim();
          if (!value) return "";

          if (label === "ИП") {
            return "ИП " + value;
          }

          return label + ": " + value;
        })
        .filter(Boolean)
        .join("\n");
    }

    return source ? source.textContent.trim() : "";
  }

  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      var text = getRequisitesCopyText();
      if (!text) return;

      navigator.clipboard.writeText(text).then(function () {
        copyBtn.setAttribute("data-copied", "true");
        setTimeout(function () {
          copyBtn.removeAttribute("data-copied");
        }, 2000);
      });
    });
  }
})();

(function () {
  var icon = document.querySelector("[data-fab-icon]");
  if (!icon) return;

  var angle = 0;
  var lastScrollY = window.scrollY;

  function onScroll() {
    var currentScrollY = window.scrollY;
    var delta = currentScrollY - lastScrollY;
    lastScrollY = currentScrollY;
    angle += delta * 0.55;
    icon.style.transform = "rotate(" + angle + "deg)";
  }

  window.addEventListener("scroll", onScroll, { passive: true });
})();

(function () {
  var lightbox = document.querySelector("[data-lightbox]");
  if (!lightbox) return;

  var imgEl = lightbox.querySelector("[data-lightbox-img]");
  var counterEl = lightbox.querySelector("[data-lightbox-counter]");
  var captionEl = lightbox.querySelector("[data-lightbox-caption]");
  var prevBtn = lightbox.querySelector("[data-lightbox-prev]");
  var nextBtn = lightbox.querySelector("[data-lightbox-next]");
  var root = document.documentElement;
  var items = [];
  var index = 0;
  var lastFocus = null;

  function setLock(locked) {
    root.classList.toggle("works-modal-open", locked);
    document.body.classList.toggle("works-modal-open", locked);
  }

  function getItemsFromTrack(track) {
    return Array.prototype.map.call(
      track.querySelectorAll(".works-page__carousel-img"),
      function (img) {
        return { src: img.currentSrc || img.src, alt: img.alt || "" };
      }
    );
  }

  function updateView() {
    var item = items[index];
    if (!item || !imgEl) return;

    imgEl.src = item.src;
    imgEl.alt = item.alt;

    if (counterEl) {
      counterEl.textContent = index + 1 + " / " + items.length;
    }

    if (captionEl) {
      captionEl.textContent = item.alt;
    }

    if (prevBtn) prevBtn.hidden = items.length <= 1;
    if (nextBtn) nextBtn.hidden = items.length <= 1;
  }

  function open(track, startIndex) {
    items = getItemsFromTrack(track);
    if (!items.length) return;

    index = startIndex;
    lastFocus = document.activeElement;
    updateView();
    lightbox.hidden = false;
    setLock(true);
    if (prevBtn) prevBtn.focus();
  }

  function close() {
    lightbox.hidden = true;
    if (imgEl) imgEl.removeAttribute("src");
    setLock(false);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function step(direction) {
    if (!items.length) return;
    index = (index + direction + items.length) % items.length;
    updateView();
  }

  document.querySelectorAll(".works-page__carousel-img").forEach(function (img) {
    img.addEventListener("click", function () {
      var track = img.closest(".works-page__carousel-track");
      if (!track) return;
      var imgs = track.querySelectorAll(".works-page__carousel-img");
      var startIndex = Array.prototype.indexOf.call(imgs, img);
      open(track, startIndex < 0 ? 0 : startIndex);
    });
  });

  lightbox.querySelectorAll("[data-lightbox-close]").forEach(function (el) {
    el.addEventListener("click", close);
  });

  if (prevBtn) {
    prevBtn.addEventListener("click", function () {
      step(-1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", function () {
      step(1);
    });
  }

  document.addEventListener("keydown", function (e) {
    if (lightbox.hidden) return;

    if (e.key === "Escape") {
      close();
      return;
    }

    if (e.key === "ArrowLeft") {
      step(-1);
      return;
    }

    if (e.key === "ArrowRight") {
      step(1);
    }
  });
})();

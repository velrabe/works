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
  if (typeof Swiper === "undefined") return;

  var GALLERY_SPEED = 350;

  function initSlideCaptions(root) {
    root.querySelectorAll(".works-page__carousel-slide").forEach(function (slide) {
      if (slide.querySelector(".works-page__carousel-slide-inner")) return;

      var img = slide.querySelector(".works-page__carousel-img");
      if (!img) return;

      var inner = document.createElement("div");
      inner.className = "works-page__carousel-slide-inner";

      var captionWrap = document.createElement("div");
      captionWrap.className = "works-page__carousel-slide-caption-wrap";

      var captionTextWrap = document.createElement("div");
      captionTextWrap.className = "works-page__carousel-slide-caption-text-wrap";

      var caption = document.createElement("p");
      caption.className = "works-page__carousel-slide-caption";
      caption.textContent = img.getAttribute("alt") || "";

      captionTextWrap.appendChild(caption);
      captionWrap.appendChild(captionTextWrap);
      slide.insertBefore(inner, img);
      inner.appendChild(img);
      inner.appendChild(captionWrap);
    });
  }

  var brandingEl = document.getElementById("gallery-branding");
  var pitchEl = document.getElementById("gallery-pitch");
  var prevBtn = document.querySelector("[data-linked-gallery-prev]");
  var nextBtn = document.querySelector("[data-linked-gallery-next]");
  if (!brandingEl || !pitchEl) return;

  initSlideCaptions(brandingEl);
  initSlideCaptions(pitchEl);

  brandingEl.querySelectorAll(".swiper-slide").forEach(function (slide, index) {
    slide.dataset.galleryIndex = String(index);
  });
  pitchEl.querySelectorAll(".swiper-slide").forEach(function (slide, index) {
    slide.dataset.galleryIndex = String(index);
  });

  var brandingCount = brandingEl.querySelectorAll(".swiper-slide").length;
  var pitchCount = pitchEl.querySelectorAll(".swiper-slide").length;
  var syncing = false;

  var sharedOptions = {
    slidesPerView: "auto",
    centeredSlides: true,
    loop: true,
    speed: GALLERY_SPEED,
    spaceBetween: 12,
    slideToClickedSlide: false,
    watchSlidesProgress: true,
    loopAdditionalSlides: 2,
  };

  var brandingSwiper = new Swiper(brandingEl, Object.assign({}, sharedOptions, {
    loopedSlides: brandingCount,
  }));

  var pitchSwiper = new Swiper(pitchEl, Object.assign({}, sharedOptions, {
    loopedSlides: pitchCount,
    allowTouchMove: false,
  }));

  function mirroredPitchIndex(brandingIndex) {
    return (pitchCount - 1 - brandingIndex + pitchCount) % pitchCount;
  }

  function syncPitchToBranding(speed) {
    pitchSwiper.slideToLoop(
      mirroredPitchIndex(brandingSwiper.realIndex),
      speed === undefined ? GALLERY_SPEED : speed,
      false
    );
  }

  syncing = true;
  brandingSwiper.slideToLoop(0, 0, false);
  pitchSwiper.slideToLoop(mirroredPitchIndex(0), 0, false);
  syncing = false;

  brandingSwiper.on("slideChangeTransitionEnd", function () {
    if (syncing) return;
    syncing = true;
    syncPitchToBranding(GALLERY_SPEED);
    syncing = false;
  });

  if (prevBtn) {
    prevBtn.addEventListener("click", function () {
      brandingSwiper.slidePrev();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", function () {
      brandingSwiper.slideNext();
    });
  }
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

  function getItemsFromSwiper(swiperEl) {
    return Array.prototype.map.call(
      swiperEl.querySelectorAll(
        ".swiper-slide:not(.swiper-slide-duplicate) .works-page__carousel-img"
      ),
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

  function open(swiperEl, startIndex) {
    items = getItemsFromSwiper(swiperEl);
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

  document
    .querySelectorAll(".works-page__gallery-swiper .works-page__carousel-img")
    .forEach(function (img) {
      img.addEventListener("click", function () {
        var swiperEl = img.closest(".works-page__gallery-swiper");
        if (!swiperEl) return;
        var slide = img.closest(".swiper-slide");
        var startIndex = slide ? parseInt(slide.dataset.galleryIndex || "0", 10) : 0;
        open(swiperEl, isNaN(startIndex) ? 0 : startIndex);
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

(function () {
  var cover = document.querySelector("[data-case-cover]");
  if (!cover) return;

  var panel = cover.querySelector(".works-page__case-cover-panel");
  if (!panel) return;

  var ticking = false;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function smootherStep(t) {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  function update() {
    ticking = false;
    var rect = panel.getBoundingClientRect();
    var viewHeight = window.innerHeight;
    var start = viewHeight * 0.9;
    var end = viewHeight * 0.4;
    var raw = (start - rect.top) / (start - end);
    cover.style.setProperty(
      "--widget-progress",
      String(smootherStep(clamp(raw, 0, 1)))
    );
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
})();

(function () {
  var quote = document.querySelector("[data-case-cover-quote]");
  if (!quote) return;

  var panel = quote.closest(".works-page__case-cover-panel");
  var text = quote.textContent.replace(/\s+/g, " ").trim();
  var rawWords = text.split(" ");
  var words = [];
  var glueNext = /^(and|in|or|the|a|to|of)$/i;

  for (var wi = 0; wi < rawWords.length; wi += 1) {
    var chunk = rawWords[wi];
    while (glueNext.test(chunk) && wi + 1 < rawWords.length) {
      wi += 1;
      chunk += " " + rawWords[wi];
    }
    words.push(chunk);
  }

  var played = false;
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  quote.textContent = "";

  words.forEach(function (word, wordIndex) {
    var wordSpan = document.createElement("span");
    wordSpan.className = "works-page__case-cover-word";

    word.split("").forEach(function (char) {
      var charSpan = document.createElement("span");
      charSpan.textContent = char;
      charSpan.className = "works-page__case-cover-char";
      if (reducedMotion) {
        charSpan.style.opacity = "1";
      }
      wordSpan.appendChild(charSpan);
    });

    quote.appendChild(wordSpan);

    if (wordIndex < words.length - 1) {
      var spaceSpan = document.createElement("span");
      spaceSpan.className = "works-page__case-cover-space";
      spaceSpan.textContent = " ";
      quote.appendChild(spaceSpan);
    }
  });

  function playFocusIn() {
    if (played || reducedMotion) return;
    played = true;
    quote.querySelectorAll(".works-page__case-cover-char").forEach(function (span, index) {
      span.style.animationDelay = index * 0.0175 + "s";
      span.classList.add("is-focus-in");
    });
  }

  if (!panel) {
    playFocusIn();
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          playFocusIn();
          observer.disconnect();
        }
      });
    },
    { threshold: 0.35, rootMargin: "0px 0px -10% 0px" }
  );

  observer.observe(panel);
})();

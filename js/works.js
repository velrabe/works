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
  var GALLERY_SPEED = 350;
  var GALLERY_EASING = "cubic-bezier(0.34, 1.25, 0.64, 1)";

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

  function getGap(track) {
    var style = window.getComputedStyle(track);
    var gap = parseFloat(style.columnGap || style.gap || "0");
    return isNaN(gap) ? 0 : gap;
  }

  function getMetrics(root, track) {
    var slide = track.querySelector(".works-page__carousel-slide:not(.is-clone)");
    if (!slide) slide = track.querySelector(".works-page__carousel-slide");
    if (!slide) return null;

    var gap = getGap(track);
    var slideStyle = window.getComputedStyle(slide);
    var marginRight = parseFloat(slideStyle.marginRight) || 0;
    var slideWidth = slide.offsetWidth + (gap || marginRight);
    var centerOffset = (root.clientWidth - slide.offsetWidth) / 2;
    return { slideWidth: slideWidth, centerOffset: centerOffset };
  }

  function cloneTrackSlides(track, count) {
    var originals = Array.prototype.slice.call(
      track.querySelectorAll(".works-page__carousel-slide:not(.is-clone)")
    );

    for (var i = count - 1; i >= 0; i -= 1) {
      var pre = originals[i].cloneNode(true);
      pre.classList.add("is-clone");
      pre.removeAttribute("data-gallery-index");
      track.insertBefore(pre, track.firstChild);
    }

    originals.forEach(function (slide) {
      var post = slide.cloneNode(true);
      post.classList.add("is-clone");
      post.removeAttribute("data-gallery-index");
      track.appendChild(post);
    });
  }

  function preparePitchTrack(track, root) {
    var slides = Array.prototype.slice.call(track.children);
    if (slides.length < 8) return slides.length;

    slides.forEach(function (slide, index) {
      slide.dataset.galleryIndex = String(index);
    });

    var extras = slides.slice(0, 2);
    var ordered = [slides[7], slides[6], slides[5], slides[4], slides[3], slides[2]];
    track.textContent = "";

    ordered.forEach(function (slide) {
      track.appendChild(slide);
    });

    extras.forEach(function (slide) {
      slide.classList.add("works-page__carousel-slide--lightbox-only");
      slide.hidden = true;
      root.appendChild(slide);
    });

    return ordered.length;
  }

  function setupLinkedTrack(root, options) {
    var track = root.querySelector(".works-page__carousel-track");
    if (!track) return null;

    var count = options.preparePitch ? preparePitchTrack(track, root) : track.children.length;
    var originals = Array.prototype.slice.call(track.children);

    originals.forEach(function (slide, index) {
      slide.classList.remove("is-clone", "is-active");
      if (!slide.hasAttribute("data-gallery-index")) {
        slide.dataset.galleryIndex = String(index);
      }
    });

    cloneTrackSlides(track, count);

    return {
      root: root,
      track: track,
      count: count,
      pos: count,
      invert: !!options.invert,
    };
  }

  function logicalIndex(state) {
    return ((state.pos - state.count) % state.count + state.count) % state.count;
  }

  function translateFor(state, metrics) {
    var offset = state.pos * metrics.slideWidth;
    return state.invert
      ? metrics.centerOffset + offset
      : metrics.centerOffset - offset;
  }

  function setTrackTranslate(state, metrics, animate) {
    state.track.style.transition = animate
      ? "transform " + GALLERY_SPEED + "ms " + GALLERY_EASING
      : "none";
    state.track.style.transform =
      "translate3d(" + translateFor(state, metrics) + "px, 0, 0)";
  }

  function updateActiveStates(brandingState, pitchState) {
    var brandingIndex = logicalIndex(brandingState);
    var pitchIndex = logicalIndex(pitchState);

    brandingState.track.querySelectorAll(".works-page__carousel-slide").forEach(function (slide, index) {
      slide.classList.toggle("is-active", index === brandingState.pos);
    });

    pitchState.track.querySelectorAll(".works-page__carousel-slide").forEach(function (slide, index) {
      slide.classList.toggle("is-active", index === pitchState.pos);
    });

    brandingState.index = brandingIndex;
    pitchState.index = pitchIndex;
  }

  function normalizeLoop(state) {
    if (state.pos >= state.count * 2) {
      state.pos -= state.count;
      return true;
    }
    if (state.pos < state.count) {
      state.pos += state.count;
      return true;
    }
    return false;
  }

  var brandingRoot = document.getElementById("gallery-branding");
  var pitchRoot = document.getElementById("gallery-pitch");
  var prevBtn = document.querySelector("[data-linked-gallery-prev]");
  var nextBtn = document.querySelector("[data-linked-gallery-next]");
  if (!brandingRoot || !pitchRoot) return;

  initSlideCaptions(brandingRoot);
  initSlideCaptions(pitchRoot);

  var brandingState = setupLinkedTrack(brandingRoot, { invert: true });
  var pitchState = setupLinkedTrack(pitchRoot, { invert: false, preparePitch: true });
  if (!brandingState || !pitchState) return;

  var animating = false;

  function render(animate) {
    var brandingMetrics = getMetrics(brandingState.root, brandingState.track);
    var pitchMetrics = getMetrics(pitchState.root, pitchState.track);
    if (!brandingMetrics || !pitchMetrics) return;

    setTrackTranslate(brandingState, brandingMetrics, animate);
    setTrackTranslate(pitchState, pitchMetrics, animate);
    updateActiveStates(brandingState, pitchState);
  }

  function afterTransition(state, metrics) {
    if (!normalizeLoop(state)) return;
    setTrackTranslate(state, metrics, false);
  }

  function move(direction) {
    if (animating) return;
    animating = true;

    brandingState.pos += direction;
    pitchState.pos += direction;

    render(true);

    window.setTimeout(function () {
      var brandingMetrics = getMetrics(brandingState.root, brandingState.track);
      var pitchMetrics = getMetrics(pitchState.root, pitchState.track);
      if (brandingMetrics) afterTransition(brandingState, brandingMetrics);
      if (pitchMetrics) afterTransition(pitchState, pitchMetrics);
      render(false);
      animating = false;
    }, GALLERY_SPEED);
  }

  render(false);

  if (prevBtn) {
    prevBtn.addEventListener("click", function () {
      move(-1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", function () {
      move(1);
    });
  }

  window.addEventListener("resize", function () {
    render(false);
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

  function getItemsFromGallery(viewportEl) {
    var slides = Array.prototype.slice.call(
      viewportEl.querySelectorAll(".works-page__carousel-slide:not(.is-clone)")
    );

    slides.sort(function (a, b) {
      return (
        parseInt(a.dataset.galleryIndex || "0", 10) -
        parseInt(b.dataset.galleryIndex || "0", 10)
      );
    });

    return slides.map(function (slide) {
      var img = slide.querySelector(".works-page__carousel-img");
      return {
        src: img.currentSrc || img.src,
        alt: img ? img.alt || "" : "",
      };
    }).filter(function (item) {
      return !!item.src;
    });
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

  function open(viewportEl, startIndex) {
    items = getItemsFromGallery(viewportEl);
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
    .querySelectorAll(".works-page__gallery-viewport .works-page__carousel-img")
    .forEach(function (img) {
      img.addEventListener("click", function () {
        var viewportEl = img.closest(".works-page__gallery-viewport");
        if (!viewportEl) return;
        var slide = img.closest(".works-page__carousel-slide");
        var startIndex = slide ? parseInt(slide.dataset.galleryIndex || "0", 10) : 0;
        open(viewportEl, isNaN(startIndex) ? 0 : startIndex);
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

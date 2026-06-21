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
  var SLIDE_COUNT = 6;
  var WAGONS_IN_DOM = 2;
  var TRANSITION_MS = 350;

  function initSlideCaptions(root) {
    root.querySelectorAll(".works-page__carousel-slide").forEach(initSlideCaption);
  }

  function initSlideCaption(slide) {
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
  }

  function CarouselRow(shell, reverseOrder) {
    this.shell = shell;
    this.viewport = shell.querySelector("[data-carousel-viewport]");
    this.track = shell.querySelector("[data-carousel-viewport] [data-carousel-track]");
    this.reverseOrder = reverseOrder;
    this.templates = Array.from(
      this.track.querySelectorAll(".works-page__carousel-slide")
    )
      .slice(0, SLIDE_COUNT)
      .map(function (slide) {
        return slide.cloneNode(true);
      });
    this.domIndex = 0;
    this.centerX = 0;
  }

  CarouselRow.prototype.getSlideOrder = function () {
    var order = [];
    var i;

    for (i = 0; i < SLIDE_COUNT; i += 1) {
      order.push(i);
    }

    if (this.reverseOrder) {
      order.reverse();
    }

    return order;
  };

  CarouselRow.prototype.cloneSlide = function (templateIndex) {
    var template = this.templates[templateIndex];
    var slide = template.cloneNode(true);
    slide.dataset.galleryIndex =
      template.dataset.galleryIndex || String(templateIndex);
    slide.classList.remove("is-active");
    return slide;
  };

  CarouselRow.prototype.appendWagon = function () {
    var order = this.getSlideOrder();
    var frag = document.createDocumentFragment();
    var i;

    for (i = 0; i < order.length; i += 1) {
      frag.appendChild(this.cloneSlide(order[i]));
    }

    this.track.appendChild(frag);
    initSlideCaptions(this.shell);
  };

  CarouselRow.prototype.prependWagon = function () {
    var order = this.getSlideOrder();
    var frag = document.createDocumentFragment();
    var i;

    for (i = 0; i < order.length; i += 1) {
      frag.appendChild(this.cloneSlide(order[i]));
    }

    this.track.insertBefore(frag, this.track.firstChild);
    initSlideCaptions(this.shell);
    this.domIndex += SLIDE_COUNT;
    this.applyTransform(false);
  };

  CarouselRow.prototype.removeFirstWagon = function () {
    var i;

    for (i = 0; i < SLIDE_COUNT; i += 1) {
      this.track.removeChild(this.track.firstElementChild);
    }

    this.domIndex -= SLIDE_COUNT;
    this.applyTransform(false);
  };

  CarouselRow.prototype.removeLastWagon = function () {
    var i;

    for (i = 0; i < SLIDE_COUNT; i += 1) {
      this.track.removeChild(this.track.lastElementChild);
    }
  };

  CarouselRow.prototype.ensureWagonBuffer = function () {
    while (this.track.children.length < SLIDE_COUNT * WAGONS_IN_DOM) {
      this.appendWagon();
    }
  };

  CarouselRow.prototype.buildWagons = function () {
    var i;

    this.track.textContent = "";

    for (i = 0; i < WAGONS_IN_DOM; i += 1) {
      this.appendWagon();
    }

    initSlideCaptions(this.shell);
  };

  CarouselRow.prototype.measure = function () {
    var viewportWidth = this.viewport.getBoundingClientRect().width;
    this.centerX = viewportWidth / 2;
  };

  CarouselRow.prototype.getTranslateX = function () {
    var slide = this.track.children[this.domIndex];
    if (!slide) return 0;
    return this.centerX - (slide.offsetLeft + slide.offsetWidth / 2);
  };

  CarouselRow.prototype.applyTransform = function (animate) {
    var x = this.getTranslateX();
    this.track.style.transition = animate
      ? "transform " + TRANSITION_MS + "ms cubic-bezier(0.4, 0, 0.2, 1)"
      : "none";
    this.track.style.transform = "translate3d(" + x + "px, 0, 0)";
  };

  CarouselRow.prototype.setActive = function () {
    var active = this.domIndex;
    Array.prototype.forEach.call(this.track.children, function (slide, index) {
      slide.classList.toggle("is-active", index === active);
    });
  };

  var brandingShell = document.getElementById("gallery-branding");
  var pitchShell = document.getElementById("gallery-pitch");
  var prevBtn = document.querySelector("[data-linked-gallery-prev]");
  var nextBtn = document.querySelector("[data-linked-gallery-next]");
  if (!brandingShell || !pitchShell) return;

  var branding = new CarouselRow(brandingShell, false);
  var pitch = new CarouselRow(pitchShell, true);
  var rows = [branding, pitch];
  var logicalIndex = 0;
  var animating = false;

  function applyRows(animate) {
    rows.forEach(function (row) {
      row.measure();
      row.applyTransform(animate);
      row.setActive();
    });
  }

  function initGallery() {
    rows.forEach(function (row) {
      row.buildWagons();
      row.domIndex = logicalIndex;
    });

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        applyRows(false);
      });
    });
  }

  function waitRowsTransition(done) {
    var pending = rows.length;

    function onEnd(event) {
      if (event.propertyName !== "transform") return;
      pending -= 1;
      if (pending > 0) return;

      rows.forEach(function (row) {
        row.track.removeEventListener("transitionend", onEnd);
      });
      done();
    }

    rows.forEach(function (row) {
      row.track.addEventListener("transitionend", onEnd);
    });
  }

  function recycleRows(delta, prepended) {
    if (delta > 0 && logicalIndex === 0 && branding.domIndex >= SLIDE_COUNT) {
      rows.forEach(function (row) {
        row.removeFirstWagon();
      });
    }

    if (prepended) {
      rows.forEach(function (row) {
        row.removeLastWagon();
      });
    }

    rows.forEach(function (row) {
      row.ensureWagonBuffer();
      row.measure();
      row.applyTransform(false);
      row.setActive();
    });
  }

  function step(delta) {
    if (animating || !delta) return;
    animating = true;

    var prepended = logicalIndex === 0 && delta < 0;
    var targetDom = branding.domIndex + delta;

    if (prepended) {
      rows.forEach(function (row) {
        row.prependWagon();
      });
      targetDom = branding.domIndex + delta;
    }

    if (
      delta > 0 &&
      targetDom >= branding.track.children.length - SLIDE_COUNT
    ) {
      rows.forEach(function (row) {
        row.ensureWagonBuffer();
      });
    }

    logicalIndex = (logicalIndex + delta + SLIDE_COUNT) % SLIDE_COUNT;

    rows.forEach(function (row) {
      row.domIndex = targetDom;
    });

    applyRows(true);

    waitRowsTransition(function () {
      recycleRows(delta, prepended);
      animating = false;
    });
  }

  initGallery();

  if (typeof ResizeObserver !== "undefined") {
    var resizeObserver = new ResizeObserver(function () {
      if (animating) return;
      applyRows(false);
    });
    rows.forEach(function (row) {
      resizeObserver.observe(row.viewport);
    });
  } else {
    window.addEventListener("resize", function () {
      if (animating) return;
      applyRows(false);
    });
  }

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

  function getItemsFromRow(rowEl) {
    var map = {};

    rowEl.querySelectorAll(".works-page__carousel-slide[data-gallery-index]").forEach(
      function (slide) {
        var key = slide.dataset.galleryIndex;
        if (key === undefined || map[key]) return;

        var img = slide.querySelector(".works-page__carousel-img");
        if (!img) return;

        map[key] = { src: img.currentSrc || img.src, alt: img.alt || "" };
      }
    );

    return Object.keys(map)
      .sort(function (a, b) {
        return parseInt(a, 10) - parseInt(b, 10);
      })
      .map(function (key) {
        return map[key];
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

  function open(rowEl, startIndex) {
    items = getItemsFromRow(rowEl);
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
    .querySelectorAll("[data-linked-row] .works-page__carousel-img")
    .forEach(function (img) {
      img.addEventListener("click", function () {
        var rowEl = img.closest("[data-linked-row]");
        if (!rowEl) return;
        var slide = img.closest(".works-page__carousel-slide");
        var startIndex = slide ? parseInt(slide.dataset.galleryIndex || "0", 10) : 0;
        open(rowEl, isNaN(startIndex) ? 0 : startIndex);
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

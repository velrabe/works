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
  var WAGONS_IN_DOM = 3;
  var START_WAGON = 1;
  var TRANSITION_MS = 350;
  var ACTIVATION_MS = 860;
  var DEACTIVATION_MS = 440;
  var STAGE_TRANSITION_MS = 780;
  var STAGE_SCRUB_TRANSITION_MS = 460;
  var MOBILE_GALLERY_QUERY = "(max-width: 47.9375rem)";
  var mobileGalleryMedia = window.matchMedia
    ? window.matchMedia(MOBILE_GALLERY_QUERY)
    : { matches: false };

  function isMobileGallery() {
    return mobileGalleryMedia.matches;
  }

  function primeCarouselImages(scope) {
    var imgs = scope.querySelectorAll
      ? scope.querySelectorAll(".works-page__carousel-img")
      : [];

    imgs.forEach(function (img) {
      var src = img.getAttribute("data-carousel-src") || img.getAttribute("src");
      if (!src) return;

      var slide = img.closest(".works-page__carousel-slide");
      if (slide) {
        var slideImageUrl = new URL(src, window.location.href).href;
        slide.style.setProperty("--carousel-slide-image", "url('" + slideImageUrl.replace(/'/g, "\\'") + "')");
      }

      img.loading = "eager";
      img.decoding = "async";

      if (img.getAttribute("src") !== src) {
        img.setAttribute("src", src);
      } else if (!img.complete) {
        img.src = src;
      }
    });
  }

  function ensureCarouselHiResImage(slide) {
    var fullSrc = slide.dataset.slideFullSrc;
    var inner = slide.querySelector(".works-page__carousel-slide-inner");
    var minImg = slide.querySelector(".works-page__carousel-img");
    var hiResImg;

    if (!fullSrc || !inner || !minImg) return null;

    hiResImg = slide.querySelector(".works-page__carousel-img-hires");

    if (!hiResImg) {
      hiResImg = document.createElement("img");
      hiResImg.className = "works-page__carousel-img-hires";
      hiResImg.setAttribute("alt", "");
      hiResImg.setAttribute("loading", "eager");
      hiResImg.setAttribute("draggable", "false");
      hiResImg.decoding = "async";
      inner.insertBefore(hiResImg, minImg);
    }

    function markLoaded() {
      slide.classList.add("is-hires-loaded");
    }

    hiResImg.addEventListener("load", markLoaded, { once: true });

    if (hiResImg.getAttribute("src") !== fullSrc) {
      slide.classList.remove("is-hires-loaded");
      hiResImg.setAttribute("src", fullSrc);
    }

    if (hiResImg.complete && hiResImg.naturalWidth > 0) {
      markLoaded();
    }

    return hiResImg;
  }

  function preloadCarouselTemplates(rows) {
    rows.forEach(function (row) {
      row.templates.forEach(function (template) {
        var fullSrc = template.dataset.slideFullSrc;

        template.querySelectorAll(".works-page__carousel-img").forEach(function (img) {
          var src = img.getAttribute("data-carousel-src") || img.getAttribute("src");
          if (!src) return;

          var probe = new Image();
          probe.decoding = "async";
          probe.src = src;
        });

        if (fullSrc) {
          var fullProbe = new Image();
          fullProbe.decoding = "async";
          fullProbe.src = fullSrc;
        }
      });
    });
  }

  var ROLE_LABELS = {
    "motion-design": "Motion-design",
    "ux/ui": "UX/UI",
    "web-design": "Web-design",
    "product design": "Product design",
    "graphic design": "Graphic design",
  };

  function capitalizeTagLabel(tag) {
    return tag.replace(/(^|[\s\-/]+)([a-z])/gi, function (_match, sep, letter) {
      return sep + letter.toUpperCase();
    });
  }

  function expandRoleTags(roleString) {
    var tags = roleString
      .replace(/^Роль:\s*/i, "")
      .split(",")
      .map(function (tag) {
        return tag.trim();
      })
      .filter(Boolean);

    var result = [];
    var seen = {};

    function pushTag(label) {
      var key = label.toLowerCase();
      if (seen[key]) return;
      seen[key] = true;
      result.push(label);
    }

    tags.forEach(function (tag) {
      var lower = tag.toLowerCase();
      if (lower === "deck/slides") {
        pushTag("Pitch-deck");
        pushTag("Graphic-design");
        return;
      }

      var mapped = ROLE_LABELS[lower];
      if (mapped) {
        pushTag(mapped);
        return;
      }

      pushTag(capitalizeTagLabel(tag));
    });

    return result;
  }

  window.worksExpandRoleTags = expandRoleTags;

  function createCaptionHeading(title, year) {
    var headingWrap = document.createElement("div");
    headingWrap.className = "works-page__carousel-slide-caption-heading-wrap";
    headingWrap.appendChild(createCaptionBlock("title", "p", title));
    if (year) headingWrap.appendChild(createCaptionBlock("year", "p", year));
    return headingWrap;
  }

  function ensureCaptionHeading(captionTextWrap) {
    if (!captionTextWrap) return;
    if (captionTextWrap.querySelector(".works-page__carousel-slide-caption-heading-wrap")) return;

    var titleWrap = captionTextWrap.querySelector(
      ".works-page__carousel-slide-caption-title-wrap"
    );
    if (!titleWrap) return;

    var yearWrap = captionTextWrap.querySelector(
      ".works-page__carousel-slide-caption-year-wrap"
    );
    var headingWrap = document.createElement("div");
    headingWrap.className = "works-page__carousel-slide-caption-heading-wrap";

    captionTextWrap.insertBefore(headingWrap, titleWrap);
    headingWrap.appendChild(titleWrap);
    if (yearWrap) headingWrap.appendChild(yearWrap);
  }

  function createCaptionBlock(className, tagName, text) {
    var wrap = document.createElement("div");
    wrap.className = "works-page__carousel-slide-caption-" + className + "-wrap";

    var el = document.createElement(tagName);
    el.className = "works-page__carousel-slide-caption-" + className;
    el.textContent = text;

    wrap.appendChild(el);
    return wrap;
  }


  function createCaptionPreview(previewSrc, altText) {
    var wrap = document.createElement("div");
    wrap.className = "works-page__carousel-slide-caption-preview-wrap";

    var frame = document.createElement("div");
    frame.className = "works-page__carousel-slide-caption-preview-frame";

    var previewImg = document.createElement("img");
    previewImg.className = "works-page__carousel-slide-caption-preview-img";
    previewImg.setAttribute("src", previewSrc);
    previewImg.setAttribute("alt", altText || "");
    previewImg.setAttribute("loading", "eager");
    previewImg.setAttribute("draggable", "false");

    frame.appendChild(previewImg);
    wrap.appendChild(frame);
    return wrap;
  }

  function ensureCaptionPreview(slide) {
    var captionWrap = slide.querySelector(".works-page__carousel-slide-caption-wrap");
    if (!captionWrap || captionWrap.querySelector(".works-page__carousel-slide-caption-preview-wrap")) {
      return;
    }

    var img = slide.querySelector(".works-page__carousel-img");
    if (!img) return;

    var previewSrc = img.getAttribute("data-carousel-src") || img.getAttribute("src");
    if (!previewSrc) return;

    var altText = slide.dataset.slideTitle || img.getAttribute("alt") || "";
    captionWrap.insertBefore(createCaptionPreview(previewSrc, altText), captionWrap.firstChild);
  }

  function createRoleTags(roleString) {
    var tagsWrap = document.createElement("div");
    tagsWrap.className = "works-page__carousel-slide-caption-tags";

    expandRoleTags(roleString).forEach(function (tag) {
      var tagWrap = document.createElement("div");
      tagWrap.className = "works-page__carousel-slide-caption-tag-wrap";

      var tagEl = document.createElement("span");
      tagEl.className = "works-page__carousel-slide-caption-tag";
      tagEl.textContent = tag;

      tagWrap.appendChild(tagEl);
      tagsWrap.appendChild(tagWrap);
    });

    return tagsWrap;
  }


  function bindSlidePointerActive(slide) {
    if (slide.dataset.pointerActiveBound === "true") return;
    slide.dataset.pointerActiveBound = "true";

    slide.addEventListener("pointerdown", function (event) {
      if (isMobileGallery()) return;
      if (event.target.closest("[data-carousel-fullscreen]")) return;
      slide.classList.add("is-pointer-active");
    });

    slide.addEventListener("mouseleave", function () {
      slide.classList.remove("is-pointer-active");
    });
  }

  function setSlideHoverMotion(slide) {
    var img = slide.querySelector(".works-page__carousel-img");
    if (!img) return;

    var rotate = (Math.random() * 2 - 1).toFixed(3);
    var x = ((Math.random() * 2 - 1) * 0.5).toFixed(3);
    var y = ((Math.random() * 2 - 1) * 0.5).toFixed(3);

    img.style.setProperty("--slide-hover-rotate", rotate + "deg");
    img.style.setProperty("--slide-hover-x", x + "rem");
    img.style.setProperty("--slide-hover-y", y + "rem");
  }

  function bindSlideHoverRandom(slide) {
    var img = slide.querySelector(".works-page__carousel-img");
    if (!img || slide.dataset.hoverBound === "true") return;

    slide.dataset.hoverBound = "true";
    slide.addEventListener("mouseenter", function () {
      setSlideHoverMotion(slide);
    });
  }

  function initSlideCaption(slide) {
    if (slide.querySelector(".works-page__carousel-slide-inner")) {
      var inner = slide.querySelector(".works-page__carousel-slide-inner");
      var captionWrap = slide.querySelector(".works-page__carousel-slide-caption-wrap");
      var captionTextWrap = slide.querySelector(
        ".works-page__carousel-slide-caption-text-wrap"
      );
      var existingFullscreen = inner.querySelector(
        ".works-page__carousel-slide-fullscreen"
      );
      if (
        existingFullscreen &&
        captionWrap &&
        existingFullscreen.parentElement !== captionWrap
      ) {
        captionWrap.appendChild(existingFullscreen);
      }
      ensureCaptionPreview(slide);
      ensureCaptionHeading(captionTextWrap);
      primeCarouselImages(slide);
      bindSlidePointerActive(slide);
      bindSlideHoverRandom(slide);
      return;
    }

    var img = slide.querySelector(".works-page__carousel-img");
    if (!img) return;

    var imgSrc = img.getAttribute("src");
    if (imgSrc) {
      img.setAttribute("data-carousel-src", imgSrc);
    }

    var title = slide.dataset.slideTitle || img.getAttribute("alt") || "";
    var year = slide.dataset.slideYear || "";
    var role = slide.dataset.slideRole || "";

    var inner = document.createElement("div");
    inner.className = "works-page__carousel-slide-inner";

    var captionWrap = document.createElement("div");
    captionWrap.className = "works-page__carousel-slide-caption-wrap";

    var captionTextWrap = document.createElement("div");
    captionTextWrap.className = "works-page__carousel-slide-caption-text-wrap";

    captionTextWrap.appendChild(createCaptionHeading(title, year));
    if (role) captionTextWrap.appendChild(createRoleTags(role));

    var fullscreenBtn = document.createElement("button");
    fullscreenBtn.type = "button";
    fullscreenBtn.className = "works-page__carousel-slide-fullscreen";
    fullscreenBtn.setAttribute("data-carousel-fullscreen", "");
    fullscreenBtn.setAttribute("aria-label", "Открыть на весь экран");

    var fullscreenIconWrap = document.createElement("span");
    fullscreenIconWrap.className = "works-page__carousel-slide-fullscreen-icon-wrap";

    var fullscreenIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    fullscreenIcon.setAttribute("class", "works-page__carousel-slide-fullscreen-icon");
    fullscreenIcon.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    fullscreenIcon.setAttribute("width", "1.5rem");
    fullscreenIcon.setAttribute("height", "1.5rem");
    fullscreenIcon.setAttribute("viewBox", "0 0 15 15");
    fullscreenIcon.setAttribute("aria-hidden", "true");

    var fullscreenPathBg = document.createElementNS("http://www.w3.org/2000/svg", "path");
    fullscreenPathBg.setAttribute("d", "M0 0h15v15H0z");
    fullscreenPathBg.setAttribute("fill", "none");

    var fullscreenPathIcon = document.createElementNS("http://www.w3.org/2000/svg", "path");
    fullscreenPathIcon.setAttribute(
      "d",
      "M1 1h4v1H2.707l3.147 3.146l-.708.708L2 2.707V5H1zm11.293 1H10V1h4v4h-1V2.707L9.854 5.854l-.708-.708zm-6.44 7.854L2.708 13H5v1H1v-4h1v2.293l3.146-3.147zm4-.708L13 12.293V10h1v4h-4v-1h2.293L9.146 9.854z"
    );
    fullscreenPathIcon.setAttribute("fill", "currentColor");
    fullscreenPathIcon.setAttribute("fill-rule", "evenodd");
    fullscreenPathIcon.setAttribute("clip-rule", "evenodd");

    fullscreenIcon.appendChild(fullscreenPathBg);
    fullscreenIcon.appendChild(fullscreenPathIcon);
    fullscreenIconWrap.appendChild(fullscreenIcon);
    fullscreenBtn.appendChild(fullscreenIconWrap);

    img.setAttribute("draggable", "false");

    captionWrap.appendChild(createCaptionPreview(imgSrc, title));
    captionWrap.appendChild(captionTextWrap);
    captionWrap.appendChild(fullscreenBtn);
    slide.insertBefore(inner, img);
    inner.appendChild(img);
    inner.appendChild(captionWrap);
    primeCarouselImages(slide);
    bindSlidePointerActive(slide);
    bindSlideHoverRandom(slide);
  }

  function CarouselRow(shell) {
    this.shell = shell;
    this.viewport = shell.querySelector("[data-carousel-viewport]");
    this.track = shell.querySelector("[data-carousel-viewport] [data-carousel-track]");
    this.templates = Array.from(
      this.track.querySelectorAll(".works-page__carousel-slide")
    ).map(function (slide) {
        var template = slide.cloneNode(true);
        template.querySelectorAll(".works-page__carousel-img").forEach(function (img) {
          var src = img.getAttribute("src");
          if (src) {
            img.setAttribute("data-carousel-src", src);
          }
          img.loading = "eager";
        });
        return template;
      });
    this.slideCount = this.templates.length;
    this.logicalIndex = 0;
    this.domIndex = 0;
    this.centerX = 0;
    this.activeSlide = null;
    this.stageSlides = [];
  }

  CarouselRow.prototype.getSlideOrder = function () {
    var order = [];
    var i;

    for (i = 0; i < this.slideCount; i += 1) {
      order.push(i);
    }

    return order;
  };

  CarouselRow.prototype.cloneSlide = function (templateIndex) {
    var template = this.templates[templateIndex];
    var slide = template.cloneNode(true);
    slide.dataset.galleryIndex =
      template.dataset.galleryIndex || String(templateIndex);
    slide.classList.remove("is-active", "is-activating", "is-deactivating");
    delete slide.dataset.hoverBound;
    initSlideCaption(slide);
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
  };

  CarouselRow.prototype.prependWagon = function () {
    var order = this.getSlideOrder();
    var frag = document.createDocumentFragment();
    var i;

    for (i = 0; i < order.length; i += 1) {
      frag.appendChild(this.cloneSlide(order[i]));
    }

    this.track.insertBefore(frag, this.track.firstChild);
    this.domIndex += this.slideCount;
    this.applyTransform(false);
  };

  CarouselRow.prototype.removeFirstWagon = function () {
    var i;

    for (i = 0; i < this.slideCount; i += 1) {
      this.track.removeChild(this.track.firstElementChild);
    }

    this.domIndex -= this.slideCount;
    this.applyTransform(false);
  };

  CarouselRow.prototype.removeLastWagon = function () {
    var i;

    for (i = 0; i < this.slideCount; i += 1) {
      this.track.removeChild(this.track.lastElementChild);
    }
  };

  CarouselRow.prototype.ensureWagonBuffer = function () {
    while (this.track.children.length < this.slideCount * WAGONS_IN_DOM) {
      this.appendWagon();
    }
  };

  CarouselRow.prototype.buildWagons = function () {
    var i;

    this.track.textContent = "";
    this.activeSlide = null;

    for (i = 0; i < WAGONS_IN_DOM; i += 1) {
      this.appendWagon();
    }

  };

  CarouselRow.prototype.buildStageSlides = function () {
    var frag = document.createDocumentFragment();
    var rowName = this.shell.dataset.linkedRow || "";
    var i;

    this.track.textContent = "";
    this.activeSlide = null;
    this.stageSlides = [];
    this.track.style.transition = "none";
    this.track.style.transform = "none";

    for (i = 0; i < this.slideCount; i += 1) {
      var slide = this.cloneSlide(i);
      slide.dataset.stageRow = rowName;
      slide.dataset.stageSourceIndex = String(i);
      ensureCarouselHiResImage(slide);
      this.stageSlides.push(slide);
      frag.appendChild(slide);
    }

    this.track.appendChild(frag);
  };

  CarouselRow.prototype.buildMobileSlides = function () {
    var frag = document.createDocumentFragment();
    var wagon;
    var i;

    this.track.textContent = "";

    for (wagon = 0; wagon < WAGONS_IN_DOM; wagon += 1) {
      for (i = 0; i < this.slideCount; i += 1) {
        frag.appendChild(this.cloneSlide(i));
      }
    }

    this.track.appendChild(frag);
    this.track.style.transition = "none";
    this.track.style.transform = "none";
    this.domIndex = 0;
    this.logicalIndex = 0;
    this.activeSlide = null;
    this.setActive(false);
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
    this.track.style.transform =
      "translate3d(calc(" + x + "px + var(--works-carousel-row-offset, 0px)), 0, 0)";
  };

  CarouselRow.prototype.setActive = function (animateActivation) {
    var nextSlide = this.track.children[this.domIndex];
    var previousSlide =
      this.activeSlide && this.track.contains(this.activeSlide)
        ? this.activeSlide
        : this.track.querySelector(".works-page__carousel-slide.is-active");

    if (!nextSlide) return;

    if (previousSlide === nextSlide) {
      nextSlide.classList.add("is-active");
      this.activeSlide = nextSlide;
      return;
    }

    if (previousSlide) {
      previousSlide.classList.remove("is-active", "is-activating");
      window.clearTimeout(previousSlide.worksCarouselActivateTimer);

      if (!isMobileGallery()) {
        previousSlide.classList.add("is-deactivating");
        window.clearTimeout(previousSlide.worksCarouselDeactivateTimer);
        previousSlide.worksCarouselDeactivateTimer = window.setTimeout(function () {
          if (!previousSlide.classList.contains("is-active")) {
            previousSlide.classList.remove("is-deactivating");
          }
        }, DEACTIVATION_MS);
      } else {
        previousSlide.classList.remove("is-deactivating");
      }
    }

    this.track
      .querySelectorAll(".works-page__carousel-slide.is-active")
      .forEach(function (slide) {
        if (slide !== nextSlide) {
          slide.classList.remove("is-active", "is-activating", "is-deactivating");
          window.clearTimeout(slide.worksCarouselActivateTimer);
          window.clearTimeout(slide.worksCarouselDeactivateTimer);
        }
      });

    nextSlide.classList.remove("is-deactivating");
    window.clearTimeout(nextSlide.worksCarouselDeactivateTimer);

    if (animateActivation && !isMobileGallery()) {
      nextSlide.classList.remove("is-activating");
      window.clearTimeout(nextSlide.worksCarouselActivateTimer);
      void nextSlide.offsetWidth;
      nextSlide.classList.add("is-active", "is-activating");
      nextSlide.worksCarouselActivateTimer = window.setTimeout(function () {
        nextSlide.classList.remove("is-activating");
      }, ACTIVATION_MS);
    } else {
      nextSlide.classList.add("is-active");
      nextSlide.classList.remove("is-activating");
      window.clearTimeout(nextSlide.worksCarouselActivateTimer);
    }

    this.activeSlide = nextSlide;
  };

  var brandingShell = document.getElementById("gallery-branding");
  var pitchShell = document.getElementById("gallery-pitch");
  var prevBtn = document.querySelector("[data-linked-gallery-prev]");
  var nextBtn = document.querySelector("[data-linked-gallery-next]");
  if (!brandingShell || !pitchShell) return;

  var branding = new CarouselRow(brandingShell);
  var pitch = new CarouselRow(pitchShell);
  var rows = [branding, pitch];
  var galleryRoot = document.querySelector("[data-linked-gallery]");
  var stageItems = [];
  var stageIndex = 1;
  var stageVisibleSlides = new Map();
  var stageAnimationTimer = null;
  var stageFastTimer = null;
  var stageThumbRoot = null;
  var stageThumbTrack = null;
  var stageThumbFrame = null;
  var stageThumbButtons = [];
  var stageThumbDragging = false;
  var stageThumbDragIndex = null;
  var stageThumbDragPointerId = null;
  var galleryInViewport = false;

  function getPitchPairOffset() {
    return branding.slideCount * (2 * START_WAGON + 1) - 1;
  }

  function syncPitchPair() {
    pitch.domIndex = getPitchPairOffset() - branding.domIndex;
  }

  function applyPitchStep(delta) {
    var slideCount = pitch.slideCount;
    var targetPitch = pitch.domIndex - delta;

    while (targetPitch < 0) {
      pitch.prependWagon();
      targetPitch += slideCount;
    }

    while (targetPitch >= pitch.track.children.length) {
      pitch.appendWagon();
    }

    pitch.domIndex = targetPitch;
  }

  var logicalIndex = 0;
  var animating = false;
  var galleryMode = null;
  var mobileDriverRow = null;
  var mobileDriverTimer = null;
  var mobileMirrorBase = 0;
  var mobilePositioning = false;
  var mobileRefreshTimer = null;
  var mobileMirrorAnimationFrame = null;
  var MOBILE_MIRROR_EASE = 0.18;
  var MOBILE_MIRROR_SETTLE = 3;

  function wrapIndex(value, size) {
    return ((value % size) + size) % size;
  }

  function clearStageClasses(slide) {
    slide.classList.remove(
      "is-active",
      "is-activating",
      "is-deactivating",
      "is-stage-center",
      "is-stage-left-top",
      "is-stage-left-bottom",
      "is-stage-right-top",
      "is-stage-right-bottom",
      "is-stage-hidden-left",
      "is-stage-hidden-right",
      "is-stage-hidden",
      "is-stage-visible",
      "is-stage-preparing",
      "is-pointer-active"
    );
    window.clearTimeout(slide.worksCarouselActivateTimer);
    window.clearTimeout(slide.worksCarouselDeactivateTimer);
  }

  function buildStageSequence() {
    var sequence = [];
    var count = Math.min(branding.stageSlides.length, pitch.stageSlides.length);
    var i;

    if (!count) return sequence;

    sequence.push({
      lane: "bottom",
      slide: pitch.stageSlides[count - 1],
    });

    sequence.push({
      lane: "top",
      slide: branding.stageSlides[0],
    });

    for (i = 1; i < count; i += 1) {
      sequence.push({
        lane: "top",
        slide: branding.stageSlides[i],
      });
      sequence.push({
        lane: "bottom",
        slide: pitch.stageSlides[count - 1 - i],
      });
    }

    return sequence;
  }

  function findStageItemByLane(startIndex, lane, direction) {
    var offset;

    for (offset = 1; offset <= stageItems.length; offset += 1) {
      var index = wrapIndex(startIndex + direction * offset, stageItems.length);
      var item = stageItems[index];
      if (item && item.lane === lane) return item;
    }

    return null;
  }

  function setStagePosition(map, item, position) {
    if (!item || !item.slide) return;
    map.set(item.slide, position);
  }

  function getStagePositions() {
    var positions = new Map();
    var centerItem = stageItems[stageIndex];

    setStagePosition(positions, centerItem, "center");
    setStagePosition(positions, findStageItemByLane(stageIndex, "top", 1), "right-top");
    setStagePosition(positions, findStageItemByLane(stageIndex, "bottom", 1), "right-bottom");
    setStagePosition(positions, findStageItemByLane(stageIndex, "top", -1), "left-top");
    setStagePosition(positions, findStageItemByLane(stageIndex, "bottom", -1), "left-bottom");

    return positions;
  }

  function getStageItemTitle(item) {
    if (!item || !item.slide) return "";
    return (
      item.slide.dataset.slideTitle ||
      item.slide.querySelector(".works-page__carousel-title")?.textContent?.trim() ||
      item.slide.querySelector(".works-page__carousel-img")?.getAttribute("alt") ||
      ""
    );
  }

  function getStageItemPreviewSrc(item) {
    var img = item && item.slide ? item.slide.querySelector(".works-page__carousel-img") : null;
    return img ? img.getAttribute("data-carousel-src") || img.getAttribute("src") || "" : "";
  }

  function clearStageFastMode(delay) {
    window.clearTimeout(stageFastTimer);
    stageFastTimer = window.setTimeout(function () {
      if (galleryRoot) galleryRoot.classList.remove("is-stage-fast");
    }, delay);
  }

  function setStageThumbFramePosition(x, width) {
    if (!stageThumbFrame) return;
    stageThumbFrame.style.left = x + "px";
    stageThumbFrame.style.width = width + "px";
    stageThumbFrame.style.transform = "";
  }

  function animateStageThumbFrame(targetX, targetWidth, animate) {
    if (!stageThumbFrame || !stageThumbTrack) return;

    if (!animate) {
      stageThumbFrame.getAnimations().forEach(function (animation) {
        animation.cancel();
      });
      setStageThumbFramePosition(targetX, targetWidth);
      return;
    }

    var trackRect = stageThumbTrack.getBoundingClientRect();
    var frameRect = stageThumbFrame.getBoundingClientRect();
    var startX = frameRect.left - trackRect.left;
    var startWidth = frameRect.width || targetWidth;
    var duration = stageThumbDragging ? 120 : 260;

    stageThumbFrame.getAnimations().forEach(function (animation) {
      animation.cancel();
    });
    setStageThumbFramePosition(targetX, targetWidth);

    if (typeof stageThumbFrame.animate !== "function") {
      return;
    }

    stageThumbFrame.animate(
      [
        { left: startX + "px", width: startWidth + "px" },
        { left: targetX + "px", width: targetWidth + "px" },
      ],
      {
        duration: duration,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      }
    );
  }

  function updateStageThumbFrame(animate) {
    if (!stageThumbTrack || !stageThumbFrame || !stageThumbButtons.length) return;

    var activeThumb = stageThumbButtons[stageIndex];
    if (!activeThumb) return;

    var trackRect = stageThumbTrack.getBoundingClientRect();
    var thumbRect = activeThumb.getBoundingClientRect();

    if (!trackRect.width || !thumbRect.width) {
      requestAnimationFrame(function () {
        updateStageThumbFrame(animate);
      });
      return;
    }

    animateStageThumbFrame(thumbRect.left - trackRect.left, thumbRect.width, animate);
  }

  function updateStageStrip(animate) {
    if (!stageThumbRoot) return;

    stageThumbButtons.forEach(function (button, index) {
      var isActive = index === stageIndex;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-current", isActive ? "true" : "false");
    });

    updateStageThumbFrame(animate);
  }

  function getStageDirection(targetIndex) {
    var forward = wrapIndex(targetIndex - stageIndex, stageItems.length);
    var backward = wrapIndex(stageIndex - targetIndex, stageItems.length);
    return forward <= backward ? 1 : -1;
  }

  function goToStageIndex(targetIndex, options) {
    if (!stageItems.length) return;

    var opts = options || {};
    var nextIndex = wrapIndex(targetIndex, stageItems.length);
    var duration = opts.fast ? STAGE_SCRUB_TRANSITION_MS : STAGE_TRANSITION_MS;

    if (nextIndex === stageIndex) {
      updateStageStrip(true);
      return;
    }

    if (animating && !opts.force) return;

    if (opts.fast && galleryRoot) {
      galleryRoot.classList.add("is-stage-fast");
      clearStageFastMode(duration + 120);
    }

    var direction = getStageDirection(nextIndex);

    window.clearTimeout(stageAnimationTimer);
    animating = true;
    stageIndex = nextIndex;
    renderStage(true, direction);
    window.setTimeout(function () {
      updateStageStrip(true);
    }, 0);

    stageAnimationTimer = window.setTimeout(function () {
      animating = false;
    }, duration);
  }

  function getStageThumbIndexFromPoint(clientX) {
    if (!stageThumbButtons.length) return stageIndex;

    var closestIndex = stageIndex;
    var closestDistance = Infinity;

    stageThumbButtons.forEach(function (button, index) {
      var rect = button.getBoundingClientRect();
      var center = rect.left + rect.width / 2;
      var distance = Math.abs(clientX - center);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    return closestIndex;
  }

  function destroyStageStrip() {
    if (stageThumbFrame) {
      stageThumbFrame.onpointerdown = null;
    }

    if (stageThumbRoot && stageThumbRoot.parentElement) {
      stageThumbRoot.parentElement.removeChild(stageThumbRoot);
    }

    stageThumbRoot = null;
    stageThumbTrack = null;
    stageThumbFrame = null;
    stageThumbButtons = [];
    stageThumbDragging = false;
    stageThumbDragIndex = null;
  }

  function bindStageThumbFrameDrag() {
    if (!stageThumbFrame) return;

    function moveDrag(event) {
      if (!stageThumbDragging || event.pointerId !== stageThumbDragPointerId) return;

      var nextIndex = getStageThumbIndexFromPoint(event.clientX);
      if (nextIndex === stageThumbDragIndex) return;

      stageThumbDragIndex = nextIndex;
      goToStageIndex(nextIndex, { fast: true, force: true });
    }

    function endDrag(event) {
      if (!stageThumbDragging || event.pointerId !== stageThumbDragPointerId) return;

      stageThumbDragging = false;
      stageThumbDragIndex = null;
      stageThumbDragPointerId = null;
      stageThumbFrame.classList.remove("is-dragging");

      if (stageThumbFrame.hasPointerCapture(event.pointerId)) {
        stageThumbFrame.releasePointerCapture(event.pointerId);
      }

      document.removeEventListener("pointermove", moveDrag);
      document.removeEventListener("pointerup", endDrag);
      document.removeEventListener("pointercancel", endDrag);
    }

    stageThumbFrame.addEventListener("pointerdown", function (event) {
      if (galleryMode !== "desktop" || !stageItems.length) return;

      event.preventDefault();
      stageThumbDragging = true;
      stageThumbDragIndex = stageIndex;
      stageThumbDragPointerId = event.pointerId;
      stageThumbFrame.classList.add("is-dragging");
      stageThumbFrame.setPointerCapture(event.pointerId);
      document.addEventListener("pointermove", moveDrag);
      document.addEventListener("pointerup", endDrag);
      document.addEventListener("pointercancel", endDrag);
    });

    stageThumbFrame.addEventListener("pointermove", moveDrag);
    stageThumbFrame.addEventListener("pointerup", endDrag);
    stageThumbFrame.addEventListener("pointercancel", endDrag);
  }

  function buildStageStrip() {
    if (!galleryRoot) return;

    destroyStageStrip();

    var frame = galleryRoot.querySelector(".works-page__showcase-gallery-frame");
    if (!frame || !stageItems.length) return;

    stageThumbRoot = document.createElement("div");
    stageThumbRoot.className = "works-page__stage-strip";
    stageThumbRoot.setAttribute("data-stage-strip", "");

    stageThumbTrack = document.createElement("div");
    stageThumbTrack.className = "works-page__stage-strip-track";
    stageThumbTrack.setAttribute("data-stage-strip-track", "");

    stageThumbButtons = stageItems.map(function (item, index) {
      var button = document.createElement("button");
      var img = document.createElement("img");
      var title = getStageItemTitle(item);
      var previewSrc = getStageItemPreviewSrc(item);

      button.type = "button";
      button.className =
        "works-page__stage-thumb works-page__stage-thumb--" + item.lane;
      button.setAttribute("data-stage-thumb-index", String(index));
      button.setAttribute("aria-label", title ? "Показать слайд: " + title : "Показать слайд");

      img.className = "works-page__stage-thumb-img";
      img.setAttribute("src", previewSrc);
      img.setAttribute("alt", "");
      img.setAttribute("loading", "eager");
      img.setAttribute("draggable", "false");

      button.appendChild(img);
      button.addEventListener("click", function () {
        goToStageIndex(index, { fast: true, force: true });
      });

      stageThumbTrack.appendChild(button);
      return button;
    });

    stageThumbFrame = document.createElement("div");
    stageThumbFrame.className = "works-page__stage-thumb-frame";
    stageThumbFrame.setAttribute("data-stage-thumb-frame", "");
    stageThumbFrame.setAttribute("aria-hidden", "true");

    stageThumbTrack.appendChild(stageThumbFrame);
    stageThumbRoot.appendChild(stageThumbTrack);
    frame.insertAdjacentElement("afterend", stageThumbRoot);
    bindStageThumbFrameDrag();
    updateStageStrip(false);
  }

  function applyStagePosition(slide, position, animate) {
    slide.classList.remove(
      "is-stage-center",
      "is-stage-left-top",
      "is-stage-left-bottom",
      "is-stage-right-top",
      "is-stage-right-bottom",
      "is-stage-hidden-left",
      "is-stage-hidden-right",
      "is-stage-hidden",
      "is-stage-preparing"
    );

    slide.classList.add("is-stage-visible", "is-stage-" + position);

    if (position === "center") {
      slide.classList.add("is-active");
      if (animate) {
        slide.classList.add("is-activating");
        window.clearTimeout(slide.worksCarouselActivateTimer);
        slide.worksCarouselActivateTimer = window.setTimeout(function () {
          slide.classList.remove("is-activating");
        }, STAGE_TRANSITION_MS);
      }
      return;
    }

    slide.classList.remove("is-active", "is-activating", "is-deactivating");
  }

  function renderStage(animate, direction) {
    var positions = getStagePositions();
    var hiddenDirection = direction < 0 ? "right" : "left";
    var enterDirection = direction < 0 ? "left" : "right";

    stageItems.forEach(function (item) {
      var slide = item.slide;
      var position = positions.get(slide);
      var wasVisible = stageVisibleSlides.has(slide);

      if (position) {
        if (animate && !wasVisible) {
          clearStageClasses(slide);
          slide.classList.add("is-stage-preparing", "is-stage-hidden-" + enterDirection);
          window.getComputedStyle(slide).transform;
          slide.classList.remove("is-stage-preparing");
        }
        applyStagePosition(slide, position, animate);
        return;
      }

      clearStageClasses(slide);
      slide.classList.add("is-stage-hidden", "is-stage-hidden-" + hiddenDirection);
    });

    stageVisibleSlides = positions;

    updateStageStrip(animate);
  }

  function initStageGallery() {
    if (galleryRoot) galleryRoot.classList.add("is-stage-gallery");

    rows.forEach(function (row) {
      row.buildStageSlides();
    });

    stageItems = buildStageSequence();
    stageIndex = stageItems.length > 1 ? 1 : 0;
    stageVisibleSlides = new Map();
    preloadCarouselTemplates(rows);
    buildStageStrip();
    renderStage(false, 1);
  }

  function stepStage(delta) {
    if (!stageItems.length || animating || !delta) return;
    goToStageIndex(stageIndex + delta, { fast: false });
  }

  function applyRows(animate) {
    if (isMobileGallery()) return;

    rows.forEach(function (row) {
      row.measure();
      row.applyTransform(animate);
      row.setActive(animate);
    });
  }

  function initGallery() {
    initStageGallery();
  }

  function isEditableKeyTarget(target) {
    if (!target) return false;
    if (target.isContentEditable) return true;
    if (typeof target.closest !== "function") return false;
    return !!target.closest("input, textarea, select, [contenteditable='true']");
  }

  function hasOpenOverlay() {
    return !!document.querySelector("[data-lightbox]:not([hidden]), [data-modal]:not([hidden])");
  }

  function updateGalleryViewportState() {
    if (!galleryRoot) {
      galleryInViewport = false;
      return;
    }

    var rect = galleryRoot.getBoundingClientRect();
    galleryInViewport = rect.bottom > 0 && rect.top < window.innerHeight;
  }

  function initGalleryKeyboardNavigation() {
    if (!galleryRoot) return;

    if (typeof IntersectionObserver !== "undefined") {
      var keyboardObserver = new IntersectionObserver(
        function (entries) {
          galleryInViewport = entries.some(function (entry) {
            return entry.isIntersecting;
          });
        },
        { threshold: 0.08 }
      );
      keyboardObserver.observe(galleryRoot);
    } else {
      updateGalleryViewportState();
      window.addEventListener("scroll", updateGalleryViewportState, { passive: true });
      window.addEventListener("resize", updateGalleryViewportState);
    }

    document.addEventListener("keydown", function (event) {
      if (event.defaultPrevented) return;
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      if (!galleryInViewport || galleryMode !== "desktop" || isMobileGallery()) return;
      if (isEditableKeyTarget(event.target) || hasOpenOverlay()) return;

      event.preventDefault();
      step(event.key === "ArrowRight" ? 1 : -1);
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
    var slideCount = branding.slideCount;

    if (delta > 0 && branding.domIndex >= slideCount * (WAGONS_IN_DOM - 1)) {
      branding.removeFirstWagon();
      branding.appendWagon();
      pitch.removeLastWagon();
      pitch.prependWagon();
    }

    if (prepended) {
      branding.removeLastWagon();
      pitch.removeFirstWagon();
      pitch.appendWagon();
    }

    rows.forEach(function (row) {
      row.ensureWagonBuffer();
    });

    syncPitchPair();

    rows.forEach(function (row) {
      row.measure();
      row.applyTransform(false);
      row.setActive(false);
    });
  }

  function step(delta) {
    if (isMobileGallery()) return;
    if (galleryMode === "desktop") {
      stepStage(delta);
      return;
    }
    if (animating || !delta) return;
    animating = true;

    var targetDom = branding.domIndex + delta;
    var prepended = delta < 0 && targetDom < 0;

    if (prepended) {
      branding.prependWagon();
      targetDom = branding.domIndex + delta;
    }

    if (delta > 0 && targetDom >= branding.track.children.length) {
      branding.appendWagon();
    }

    logicalIndex = (logicalIndex + delta + branding.slideCount) % branding.slideCount;

    branding.domIndex = targetDom;
    applyPitchStep(delta);

    applyRows(true);

    waitRowsTransition(function () {
      recycleRows(delta, prepended);
      animating = false;
    });
  }

  function clearMobileSlideReveals(exceptSlide) {
    document
      .querySelectorAll(".works-page__carousel-slide.is-touch-revealed")
      .forEach(function (slide) {
        if (slide !== exceptSlide) {
          slide.classList.remove("is-touch-revealed");
        }
      });
  }

  function positiveModulo(value, size) {
    return ((value % size) + size) % size;
  }

  function getOtherMobileRow(row) {
    return row === branding ? pitch : branding;
  }

  function getMobileSlideCenter(row, index) {
    var slide = row.track.children[index];
    if (!slide) return 0;
    return slide.offsetLeft + slide.offsetWidth / 2;
  }

  function getMobileScrollForIndex(row, index) {
    return getMobileSlideCenter(row, index) - row.viewport.clientWidth / 2;
  }

  function getMobileWagonSpan(row) {
    var first = row.track.children[0];
    var next = row.track.children[row.slideCount];
    if (!first || !next) return 0;
    return next.offsetLeft - first.offsetLeft;
  }

  function getMobileMirrorBase() {
    var brandingIndex = branding.slideCount * START_WAGON;
    var pitchIndex = getPitchPairOffset() - brandingIndex;
    return getMobileSlideCenter(branding, brandingIndex) + getMobileSlideCenter(pitch, pitchIndex);
  }

  function updateMobileActiveSlide(row) {
    var viewport = row.viewport;
    var center = viewport.scrollLeft + viewport.clientWidth / 2;
    var nearest = 0;
    var nearestDistance = Infinity;

    Array.prototype.forEach.call(row.track.children, function (slide, index) {
      var slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
      var distance = Math.abs(center - slideCenter);

      if (distance < nearestDistance) {
        nearest = index;
        nearestDistance = distance;
      }
    });

    row.domIndex = nearest;
    row.logicalIndex = positiveModulo(nearest, row.slideCount);
    row.setActive(false);
  }

  function updateMobileActiveSlides() {
    rows.forEach(updateMobileActiveSlide);
  }

  function setMobileDriver(row) {
    mobileDriverRow = row;
    window.clearTimeout(mobileDriverTimer);
    mobileDriverTimer = window.setTimeout(function () {
      mobileDriverRow = null;
    }, 220);
  }

  function getClampedMobileScrollLeft(row, scrollLeft) {
    return Math.max(
      0,
      Math.min(scrollLeft, row.viewport.scrollWidth - row.viewport.clientWidth)
    );
  }

  function setMobileScrollLeft(row, scrollLeft) {
    row.viewport.scrollLeft = getClampedMobileScrollLeft(row, scrollLeft);
  }

  function clearMobileMirrorAnimation() {
    if (mobileMirrorAnimationFrame) {
      window.cancelAnimationFrame(mobileMirrorAnimationFrame);
      mobileMirrorAnimationFrame = null;
    }

    rows.forEach(function (row) {
      row.mobileMirrorTarget = null;
      row.mobileMirrorSettling = false;
      row.viewport.classList.remove("is-mirror-syncing");
    });
  }

  function animateMobileMirror() {
    var hasTarget = false;

    rows.forEach(function (row) {
      if (row.mobileMirrorTarget === null || row.mobileMirrorTarget === undefined) {
        return;
      }

      hasTarget = true;
      row.viewport.classList.add("is-mirror-syncing");

      var current = row.viewport.scrollLeft;
      var target = getClampedMobileScrollLeft(row, row.mobileMirrorTarget);
      var distance = target - current;

      if (Math.abs(distance) <= MOBILE_MIRROR_SETTLE) {
        row.mobileMirrorSettling = true;
        setMobileScrollLeft(row, target);
        row.mobileMirrorTarget = null;
        row.viewport.classList.remove("is-mirror-syncing");
        updateMobileActiveSlide(row);
        requestAnimationFrame(function () {
          row.mobileMirrorSettling = false;
        });
        return;
      }

      setMobileScrollLeft(row, current + distance * MOBILE_MIRROR_EASE);
      updateMobileActiveSlide(row);
    });

    if (hasTarget) {
      mobileMirrorAnimationFrame = window.requestAnimationFrame(animateMobileMirror);
    } else {
      mobileMirrorAnimationFrame = null;
    }
  }

  function setMobileMirrorTarget(row, scrollLeft) {
    row.mobileMirrorTarget = getClampedMobileScrollLeft(row, scrollLeft);

    if (!mobileMirrorAnimationFrame) {
      mobileMirrorAnimationFrame = window.requestAnimationFrame(animateMobileMirror);
    }
  }

  function syncMobileMirrorFrom(sourceRow) {
    var targetRow = getOtherMobileRow(sourceRow);
    var sourceCenter = sourceRow.viewport.scrollLeft + sourceRow.viewport.clientWidth / 2;
    var targetCenter = mobileMirrorBase - sourceCenter;

    setMobileMirrorTarget(targetRow, targetCenter - targetRow.viewport.clientWidth / 2);
  }

  function recenterMobilePairFrom(sourceRow) {
    var direction = 0;
    var targetRow = getOtherMobileRow(sourceRow);

    if (sourceRow.domIndex < sourceRow.slideCount) {
      direction = 1;
    } else if (sourceRow.domIndex >= sourceRow.slideCount * (WAGONS_IN_DOM - 1)) {
      direction = -1;
    }

    if (!direction) return;

    clearMobileMirrorAnimation();
    mobilePositioning = true;
    setMobileScrollLeft(
      sourceRow,
      sourceRow.viewport.scrollLeft + direction * getMobileWagonSpan(sourceRow)
    );
    setMobileScrollLeft(
      targetRow,
      targetRow.viewport.scrollLeft - direction * getMobileWagonSpan(targetRow)
    );
    updateMobileActiveSlides();

    requestAnimationFrame(function () {
      mobilePositioning = false;
    });
  }

  function handleMobileRowScroll(row) {
    if (!isMobileGallery() || mobilePositioning) return;

    updateMobileActiveSlide(row);
    syncMobileMirrorFrom(row);
    updateMobileActiveSlide(getOtherMobileRow(row));
    recenterMobilePairFrom(row);
  }

  function bindMobileNativeRow(row) {
    if (row.shell.dataset.mobileNativeBound === "true") return;
    row.shell.dataset.mobileNativeBound = "true";

    var ticking = false;

    row.viewport.addEventListener(
      "pointerdown",
      function () {
        if (!isMobileGallery()) return;
        setMobileDriver(row);
      },
      { passive: true }
    );

    row.viewport.addEventListener(
      "touchstart",
      function () {
        if (!isMobileGallery()) return;
        setMobileDriver(row);
      },
      { passive: true }
    );

    row.viewport.addEventListener(
      "wheel",
      function () {
        if (!isMobileGallery()) return;
        setMobileDriver(row);
      },
      { passive: true }
    );

    row.viewport.addEventListener(
      "scroll",
      function () {
        if (!isMobileGallery()) return;
        if (mobilePositioning) return;
        if (row.mobileMirrorSettling) return;
        if (row.mobileMirrorTarget !== null && row.mobileMirrorTarget !== undefined) return;
        if (mobileDriverRow && mobileDriverRow !== row) return;

        setMobileDriver(row);
        clearMobileSlideReveals();

        if (ticking) return;
        ticking = true;

        requestAnimationFrame(function () {
          handleMobileRowScroll(row);
          ticking = false;
        });
      },
      { passive: true }
    );

    row.track.addEventListener("click", function (event) {
      if (!isMobileGallery()) return;
      if (event.target.closest("[data-carousel-fullscreen]")) return;

      var slide = event.target.closest(".works-page__carousel-slide");
      if (!slide || !row.track.contains(slide)) return;

      event.preventDefault();
      setSlideHoverMotion(slide);

      var shouldReveal = !slide.classList.contains("is-touch-revealed");
      clearMobileSlideReveals(slide);
      slide.classList.toggle("is-touch-revealed", shouldReveal);
    });
  }

  function initMobileGallery() {
    animating = false;
    logicalIndex = 0;
    if (galleryRoot) galleryRoot.classList.remove("is-stage-gallery");
    destroyStageStrip();

    rows.forEach(function (row) {
      row.buildMobileSlides();
      bindMobileNativeRow(row);
    });

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        mobilePositioning = true;
        mobileMirrorBase = getMobileMirrorBase();
        branding.domIndex = branding.slideCount * START_WAGON + logicalIndex;
        syncPitchPair();
        setMobileScrollLeft(branding, getMobileScrollForIndex(branding, branding.domIndex));
        setMobileScrollLeft(pitch, getMobileScrollForIndex(pitch, pitch.domIndex));
        updateMobileActiveSlides();

        requestAnimationFrame(function () {
          mobilePositioning = false;
        });
      });
    });
  }

  function refreshMobileGallery() {
    if (!isMobileGallery() || galleryMode !== "mobile") return;

    window.clearTimeout(mobileRefreshTimer);
    mobileRefreshTimer = window.setTimeout(function () {
      clearMobileMirrorAnimation();
      mobilePositioning = true;
      logicalIndex = branding.logicalIndex || 0;
      mobileMirrorBase = getMobileMirrorBase();
      branding.domIndex = branding.slideCount * START_WAGON + logicalIndex;
      syncPitchPair();
      setMobileScrollLeft(branding, getMobileScrollForIndex(branding, branding.domIndex));
      setMobileScrollLeft(pitch, getMobileScrollForIndex(pitch, pitch.domIndex));
      updateMobileActiveSlides();

      requestAnimationFrame(function () {
        mobilePositioning = false;
      });
    }, 80);
  }

  function setGalleryMode() {
    var nextMode = isMobileGallery() ? "mobile" : "desktop";
    if (galleryMode === nextMode) return;

    galleryMode = nextMode;
    mobileDriverRow = null;
    window.clearTimeout(mobileDriverTimer);
    window.clearTimeout(mobileRefreshTimer);
    clearMobileMirrorAnimation();
    clearMobileSlideReveals();

    if (galleryMode === "mobile") {
      initMobileGallery();
    } else {
      initGallery();
    }
  }

  setGalleryMode();
  initGalleryKeyboardNavigation();

  if (mobileGalleryMedia.addEventListener) {
    mobileGalleryMedia.addEventListener("change", setGalleryMode);
  } else if (mobileGalleryMedia.addListener) {
    mobileGalleryMedia.addListener(setGalleryMode);
  }

  if (typeof ResizeObserver !== "undefined") {
    var resizeObserver = new ResizeObserver(function () {
      if (isMobileGallery()) {
        refreshMobileGallery();
        return;
      }
      if (animating) return;
      if (galleryMode === "desktop") renderStage(false, 1);
    });
    rows.forEach(function (row) {
      resizeObserver.observe(row.viewport);
    });
  } else {
    window.addEventListener("resize", function () {
      setGalleryMode();
      if (isMobileGallery()) {
        refreshMobileGallery();
        return;
      }
      if (animating) return;
      if (galleryMode === "desktop") renderStage(false, 1);
    });
  }

  window.addEventListener("resize", function () {
    if (galleryMode === "desktop") updateStageStrip(false);
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

  function initGalleryDrag() {
    var surface = document.querySelector(".works-page__showcase-gallery-rows");
    if (!surface) return;

    var startX = 0;
    var deltaX = 0;
    var baseBrandingX = 0;
    var basePitchX = 0;
    var dragging = false;
    var dragRow = "branding";
    var DRAG_THRESHOLD = 48;

    function getDragRowFromTarget(target) {
      if (pitchShell.contains(target)) {
        return "pitch";
      }
      return "branding";
    }

    function applyDragTransforms(delta) {
      if (galleryMode === "desktop") return;

      if (dragRow === "pitch") {
        branding.track.style.transform =
          "translate3d(" + (baseBrandingX - delta) + "px, 0, 0)";
        pitch.track.style.transform =
          "translate3d(" + (basePitchX + delta) + "px, 0, 0)";
        return;
      }

      branding.track.style.transform =
        "translate3d(" + (baseBrandingX + delta) + "px, 0, 0)";
      pitch.track.style.transform =
        "translate3d(" + (basePitchX - delta) + "px, 0, 0)";
    }

    function dragStepDelta(delta) {
      var stepDelta = delta > 0 ? -1 : 1;
      if (galleryMode === "desktop") return stepDelta;

      if (dragRow === "pitch") {
        stepDelta = -stepDelta;
      }
      return stepDelta;
    }

    function onPointerDown(event) {
      if (isMobileGallery()) return;
      if (animating) return;
      if (event.target.closest("[data-carousel-fullscreen]")) return;

      dragging = true;
      dragRow = getDragRowFromTarget(event.target);
      deltaX = 0;
      startX = event.clientX;
      if (galleryMode !== "desktop") {
        branding.measure();
        pitch.measure();
        baseBrandingX = branding.getTranslateX();
        basePitchX = pitch.getTranslateX();
      }
      surface.classList.add("is-dragging");
      surface.setPointerCapture(event.pointerId);
    }

    function onPointerMove(event) {
      if (!dragging) return;

      deltaX = event.clientX - startX;
      if (galleryMode === "desktop") return;

      branding.track.style.transition = "none";
      pitch.track.style.transition = "none";
      applyDragTransforms(deltaX);
    }

    function onPointerUp(event) {
      if (!dragging) return;

      dragging = false;
      surface.classList.remove("is-dragging");

      if (surface.hasPointerCapture(event.pointerId)) {
        surface.releasePointerCapture(event.pointerId);
      }

      if (Math.abs(deltaX) >= DRAG_THRESHOLD) {
        step(dragStepDelta(deltaX));
        return;
      }

      if (galleryMode === "desktop") return;
      applyRows(true);
    }

    surface.addEventListener("pointerdown", onPointerDown);
    surface.addEventListener("pointermove", onPointerMove);
    surface.addEventListener("pointerup", onPointerUp);
    surface.addEventListener("pointercancel", onPointerUp);
  }

  initGalleryDrag();

  document.addEventListener("click", function (event) {
    if (!isMobileGallery()) return;
    if (event.target.closest(".works-page__carousel-slide")) return;
    clearMobileSlideReveals();
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
  var copyEmailBtn = document.querySelector("[data-copy-email]");
  if (!copyEmailBtn) return;

  var copiedTimer = null;

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }

    var field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.top = "-9999px";
    field.style.left = "-9999px";
    document.body.appendChild(field);
    field.select();

    try {
      document.execCommand("copy");
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    } finally {
      document.body.removeChild(field);
    }
  }

  copyEmailBtn.addEventListener("click", function () {
    var email = copyEmailBtn.getAttribute("data-copy-email");
    if (!email) return;

    copyText(email).then(function () {
      copyEmailBtn.setAttribute("data-copied", "true");
      clearTimeout(copiedTimer);
      copiedTimer = setTimeout(function () {
        copyEmailBtn.removeAttribute("data-copied");
      }, 1600);
    });
  });
})();

(function () {
  var anchorButtons = document.querySelectorAll("[data-copy-anchor]");
  if (!anchorButtons.length) return;

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }

    var field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.top = "-9999px";
    field.style.left = "-9999px";
    document.body.appendChild(field);
    field.select();

    try {
      document.execCommand("copy");
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    } finally {
      document.body.removeChild(field);
    }
  }

  anchorButtons.forEach(function (button) {
    var copiedTimer = null;

    button.addEventListener("click", function () {
      var anchor = button.getAttribute("data-copy-anchor");
      if (!anchor) return;

      var url = window.location.href.split("#")[0] + "#" + anchor;

      copyText(url).then(function () {
        button.setAttribute("data-copied", "true");
        clearTimeout(copiedTimer);
        copiedTimer = setTimeout(function () {
          button.removeAttribute("data-copied");
        }, 1600);
      });
    });
  });
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
  var titleEl = lightbox.querySelector("[data-lightbox-title]");
  var yearEl = lightbox.querySelector("[data-lightbox-year]");
  var yearWrapEl = lightbox.querySelector("[data-lightbox-year-wrap]");
  var tagsEl = lightbox.querySelector("[data-lightbox-tags]");
  var prevBtn = lightbox.querySelector("[data-lightbox-prev]");
  var nextBtn = lightbox.querySelector("[data-lightbox-next]");
  var root = document.documentElement;
  var items = [];
  var index = 0;
  var lastFocus = null;
  var viewToken = 0;

  function setLock(locked) {
    root.classList.toggle("works-modal-open", locked);
    document.body.classList.toggle("works-modal-open", locked);
  }

  function getSlideTags(slide) {
    var tags = Array.from(
      slide.querySelectorAll(".works-page__carousel-slide-caption-tag")
    )
      .map(function (el) {
        return el.textContent.trim();
      })
      .filter(Boolean);

    if (tags.length) return tags;

    if (window.worksExpandRoleTags) {
      return window.worksExpandRoleTags(slide.dataset.slideRole || "");
    }

    return [];
  }

  function getItemsFromRow(rowEl) {
    var map = {};

    rowEl.querySelectorAll(".works-page__carousel-slide[data-gallery-index]").forEach(
      function (slide) {
        var key = slide.dataset.galleryIndex;
        if (key === undefined || map[key]) return;

        var img = slide.querySelector(".works-page__carousel-img");
        if (!img) return;

        map[key] = {
          src:
            slide.dataset.slideFullSrc ||
            img.getAttribute("data-full-src") ||
            img.currentSrc ||
            img.src,
          previewSrc:
            img.getAttribute("data-carousel-src") ||
            img.getAttribute("src") ||
            "",
          title: slide.dataset.slideTitle || img.alt || "",
          year: slide.dataset.slideYear || "",
          tags: getSlideTags(slide),
        };
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

    viewToken += 1;
    var token = viewToken;
    var previewSrc = item.previewSrc || item.src;
    var fullSrc = item.src;

    imgEl.src = previewSrc;
    imgEl.alt = item.title || "";

    if (fullSrc && fullSrc !== previewSrc) {
      var loader = new Image();
      loader.onload = function () {
        if (token !== viewToken || !imgEl) return;
        imgEl.src = fullSrc;
      };
      loader.src = fullSrc;
    }

    if (counterEl) {
      counterEl.textContent = index + 1 + " / " + items.length;
    }

    if (titleEl) {
      titleEl.textContent = item.title || "";
    }

    if (yearEl) {
      yearEl.textContent = item.year || "";
    }

    if (yearWrapEl) {
      yearWrapEl.hidden = !item.year;
    }

    if (tagsEl) {
      tagsEl.textContent = "";
      (item.tags || []).forEach(function (tag) {
        var tagWrap = document.createElement("div");
        tagWrap.className = "works-lightbox__tag-wrap";

        var tagSpan = document.createElement("span");
        tagSpan.className = "works-lightbox__tag";
        tagSpan.textContent = tag;

        tagWrap.appendChild(tagSpan);
        tagsEl.appendChild(tagWrap);
      });
      tagsEl.hidden = !(item.tags && item.tags.length);
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

  document.addEventListener("click", function (event) {
    var btn = event.target.closest("[data-carousel-fullscreen]");
    if (!btn) return;

    event.preventDefault();
    event.stopPropagation();

    var slide = btn.closest(".works-page__carousel-slide");
    var rowEl = btn.closest("[data-linked-row]");
    if (!slide || !rowEl) return;

    var startIndex = parseInt(slide.dataset.galleryIndex || "0", 10);
    open(rowEl, isNaN(startIndex) ? 0 : startIndex);
  });

  window.worksOpenLightbox = open;

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

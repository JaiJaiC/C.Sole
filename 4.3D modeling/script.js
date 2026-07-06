// ========================================
// 3D Modeling Page — Gallery
// ========================================

// Images in this folder (ordered 1–7)
var IMAGES = [
    '1.rubbish bin.png',
    '2.basketball robot.png',
    '3.榫卯.png',
    '4.container.png',
    '5.clock.png',
    '6.claw.png',
    '7.AUV.png'
];

// ---------- DOM refs ----------
var galleryModeling = document.getElementById('gallery-modeling');
var lightbox = document.getElementById('lightbox');
var lightboxImg = document.getElementById('lightbox-img');
var lightboxCounter = document.getElementById('lightbox-counter');
var btnClose = document.getElementById('lightbox-close');
var btnPrev = document.getElementById('lightbox-prev');
var btnNext = document.getElementById('lightbox-next');

// ---------- Lightbox state ----------
var currentIndex = -1;
var currentSrcs = [];

// ---------- Create cards ----------
function createCards() {
    var fragment = document.createDocumentFragment();
    for (var i = 0; i < IMAGES.length; i++) {
        var card = document.createElement('div');
        card.className = 'img-card';
        card.dataset.index = i;

        var img = document.createElement('img');
        img.className = 'gallery-img';
        img.alt = IMAGES[i].replace(/\.[^.]+$/, '');
        img.src = encodeURI(IMAGES[i]);
        img.dataset.src = encodeURI(IMAGES[i]);
        card.appendChild(img);

        fragment.appendChild(card);
    }
    galleryModeling.appendChild(fragment);
}

// ---------- Init gallery ----------
function initGallery() {
    currentSrcs = IMAGES.map(function (name) {
        return encodeURI(name);
    });

    // Reveal images once loaded
    var imgs = document.querySelectorAll('.gallery-img');
    imgs.forEach(function (img) {
        if (img.complete) {
            img.classList.add('loaded');
        } else {
            img.addEventListener('load', function () {
                img.classList.add('loaded');
            });
        }
        // Fallback: reveal after a short delay even if load event fires before we listen
        setTimeout(function () {
            if (img.complete) img.classList.add('loaded');
        }, 100);
    });
}

// ---------- Lightbox ----------
function openLightbox(index) {
    currentIndex = index;
    showCurrentImage();
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
    currentIndex = -1;
}

function showCurrentImage() {
    if (currentIndex < 0 || currentIndex >= currentSrcs.length) return;
    var src = currentSrcs[currentIndex];

    lightboxImg.style.opacity = '0';
    setTimeout(function () {
        lightboxImg.src = src;
        lightboxImg.style.opacity = '1';
        lightboxCounter.textContent = (currentIndex + 1) + ' / ' + currentSrcs.length;
    }, 150);
}

function prevImage() {
    if (currentIndex < 0) return;
    currentIndex = (currentIndex - 1 + currentSrcs.length) % currentSrcs.length;
    showCurrentImage();
}

function nextImage() {
    if (currentIndex < 0) return;
    currentIndex = (currentIndex + 1) % currentSrcs.length;
    showCurrentImage();
}

// ---------- Event bindings ----------
function bindEvents() {
    document.addEventListener('click', function (e) {
        var card = e.target.closest('.img-card');
        if (!card) return;
        var index = parseInt(card.dataset.index, 10);
        openLightbox(index);
    });

    btnClose.addEventListener('click', function (e) {
        e.stopPropagation();
        closeLightbox();
    });

    lightbox.addEventListener('click', function (e) {
        if (e.target === lightbox) closeLightbox();
    });

    btnPrev.addEventListener('click', function (e) {
        e.stopPropagation();
        prevImage();
    });

    btnNext.addEventListener('click', function (e) {
        e.stopPropagation();
        nextImage();
    });

    document.addEventListener('keydown', function (e) {
        if (currentIndex < 0) return;
        if (e.key === 'ArrowLeft') { e.preventDefault(); prevImage(); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); nextImage(); }
        else if (e.key === 'Escape') { e.preventDefault(); closeLightbox(); }
    });
}

// ---------- Init ----------
function init() {
    createCards();
    initGallery();
    bindEvents();
}

window.addEventListener('DOMContentLoaded', init);

// ─── Mobile dropdown toggle ─────────────────────────
(function () {
  var dropdowns = document.querySelectorAll('.nav-dropdown');
  dropdowns.forEach(function (dd) {
    var trigger = dd.firstElementChild;
    if (!trigger || (trigger.tagName !== 'A' && trigger.tagName !== 'BUTTON')) return;
    trigger.addEventListener('click', function (e) {
      if (window.innerWidth > 640) return;
      if (dd.classList.contains('dropdown-open')) {
        dd.classList.remove('dropdown-open');
        var nl = dd.closest('.nav-links'); if (nl) nl.style.overflow = '';
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      dropdowns.forEach(function (d) { d.classList.remove('dropdown-open'); });
      dd.classList.add('dropdown-open');
      var navLinks = dd.closest('.nav-links'); if (navLinks) navLinks.style.overflow = 'visible';
    });
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.nav-dropdown')) {
      dropdowns.forEach(function (d) {
        d.classList.remove('dropdown-open');
        var nl = d.closest('.nav-links'); if (nl) nl.style.overflow = '';
      });
    }
  });
})();

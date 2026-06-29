// ========================================
// Photography Page — Landscape Gallery
// ========================================

var SWITCH_INTERVAL = 8000;
var CARDS_PER_GROUP = 10;

// Images in landscape/ folder: 1,2,4,5,6,7,8,9,10,11,12,13,14,16,17,21,22 (17 total)
var IMAGE_IDS = [1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 21, 22];
var TOTAL_IMAGES = IMAGE_IDS.length; // 17
var imageBase = 'landscape/';

// ---------- DOM refs ----------
var galleryLandscape = document.getElementById('gallery-landscape');
var lightbox = document.getElementById('lightbox');
var lightboxImg = document.getElementById('lightbox-img');
var lightboxCounter = document.getElementById('lightbox-counter');
var btnClose = document.getElementById('lightbox-close');
var btnPrev = document.getElementById('lightbox-prev');
var btnNext = document.getElementById('lightbox-next');

// ---------- Lightbox state ----------
var currentIndex = -1;
var currentSrcs = [];

// ---------- Fisher-Yates shuffle ----------
function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
}

function getRandomIndices() {
    var all = [];
    for (var i = 0; i < TOTAL_IMAGES; i++) all.push(i);
    return shuffle(all).slice(0, CARDS_PER_GROUP);
}

// ---------- Create cards ----------
function createCards() {
    var fragment = document.createDocumentFragment();
    for (var i = 0; i < CARDS_PER_GROUP; i++) {
        var card = document.createElement('div');
        card.className = 'img-card';
        card.dataset.index = i;

        var img = document.createElement('img');
        img.className = 'gallery-img';
        img.alt = 'Landscape ' + (i + 1);
        card.appendChild(img);

        fragment.appendChild(card);
    }
    galleryLandscape.appendChild(fragment);
}

// ---------- Update gallery ----------
function updateGallery() {
    var cards = document.querySelectorAll('.img-card');
    var newIndices = getRandomIndices();
    currentSrcs = newIndices.map(function (i) {
        return imageBase + IMAGE_IDS[i] + '.jpg';
    });

    cards.forEach(function (card, i) {
        var img = card.querySelector('.gallery-img');
        var src = currentSrcs[i];

        img.classList.remove('loaded');
        setTimeout(function () {
            img.src = src;
            img.dataset.src = src;
            card.dataset.src = src;
            img.classList.add('loaded');
        }, 350);
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
    // Preload all images
    IMAGE_IDS.forEach(function (id) {
        var img = new Image();
        img.src = imageBase + id + '.jpg';
    });

    createCards();
    updateGallery();

    // Auto-rotate landscape images
    setInterval(updateGallery, SWITCH_INTERVAL);

    bindEvents();
}

window.addEventListener('DOMContentLoaded', init);

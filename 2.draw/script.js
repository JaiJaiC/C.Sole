// ========================================
// Draw Page — Gallery Script
// ========================================

// Images: 1,2,3,4,6,7,8,10,11 (5 and 9 removed)
var IMAGE_IDS = [1, 2, 3, 4, 6, 7, 8, 10, 11];
var TOTAL_IMAGES = IMAGE_IDS.length; // 9

// ---------- DOM refs ----------
var galleryDraw = document.getElementById('gallery-draw');
var lightbox = document.getElementById('lightbox');
var lightboxImg = document.getElementById('lightbox-img');
var lightboxCounter = document.getElementById('lightbox-counter');
var btnClose = document.getElementById('lightbox-close');
var btnPrev = document.getElementById('lightbox-prev');
var btnNext = document.getElementById('lightbox-next');

// ---------- Lightbox state ----------
var currentIndex = -1;
var imageSrcs = [];

// ---------- Preload all images ----------
function preloadAll() {
    IMAGE_IDS.forEach(function (id) {
        var img = new Image();
        img.src = 'draw/' + id + '.jpg';
    });
}

// ---------- Create cards ----------
function createCards() {
    var fragment = document.createDocumentFragment();
    IMAGE_IDS.forEach(function (id, i) {
        var card = document.createElement('div');
        card.className = 'img-card';
        card.dataset.index = i;
        card.dataset.src = 'draw/' + id + '.jpg';

        var img = document.createElement('img');
        img.className = 'gallery-img';
        img.alt = 'Draw ' + id;
        card.appendChild(img);

        fragment.appendChild(card);
        imageSrcs.push('draw/' + id + '.jpg');
    });
    galleryDraw.appendChild(fragment);
}

// ---------- Update gallery ----------
function updateGallery() {
    var cards = document.querySelectorAll('.img-card');
    cards.forEach(function (card, i) {
        var img = card.querySelector('.gallery-img');
        var src = imageSrcs[i];
        if (img.dataset.src !== src) {
            img.src = src;
            img.dataset.src = src;
            card.dataset.src = src;
            img.classList.add('loaded');
        }
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
    if (currentIndex < 0 || currentIndex >= imageSrcs.length) return;
    var src = imageSrcs[currentIndex];

    lightboxImg.style.opacity = '0';
    setTimeout(function () {
        lightboxImg.src = src;
        lightboxImg.style.opacity = '1';
        lightboxCounter.textContent = (currentIndex + 1) + ' / ' + imageSrcs.length;
    }, 150);
}

function prevImage() {
    if (currentIndex < 0) return;
    currentIndex = (currentIndex - 1 + imageSrcs.length) % imageSrcs.length;
    showCurrentImage();
}

function nextImage() {
    if (currentIndex < 0) return;
    currentIndex = (currentIndex + 1) % imageSrcs.length;
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
    preloadAll();
    createCards();
    updateGallery();
    bindEvents();
}

window.addEventListener('DOMContentLoaded', init);

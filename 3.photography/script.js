// ========================================
// Photography Page — Landscape + Portrait
// ========================================

var SWITCH_INTERVAL = 8000;
var CARDS_PER_GROUP = 10;

// ---------- Landscape images ----------
var IMAGE_IDS = [1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 21, 22];
var TOTAL_IMAGES = IMAGE_IDS.length; // 17
var imageBase = 'landscape/';

// ---------- Portrait images ----------
var PORTRAIT_IDS = [1, 2, 3, 4];
var portraitBase = 'portrait/';

// ---------- DOM refs ----------
var galleryLandscape = document.getElementById('gallery-landscape');
var galleryPortrait = document.getElementById('gallery-portrait');
var portraitGate = document.getElementById('portrait-gate');
var portraitInput = document.getElementById('portrait-password');
var portraitError = document.getElementById('portrait-error');
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

// Round-robin queue — avoids duplicate images across rotations
var _shuffledQueue = [];

function refillQueue() {
    var all = [];
    for (var i = 0; i < TOTAL_IMAGES; i++) all.push(i);
    _shuffledQueue = shuffle(all);
}

function getRandomIndices() {
    if (_shuffledQueue.length < CARDS_PER_GROUP) {
        var remaining = _shuffledQueue.slice();
        refillQueue();
        var seen = {};
        for (var r = 0; r < remaining.length; r++) seen[remaining[r]] = true;
        var fresh = [];
        for (var f = 0; f < _shuffledQueue.length; f++) {
            if (!seen[_shuffledQueue[f]]) fresh.push(_shuffledQueue[f]);
        }
        _shuffledQueue = fresh;
        var needed = CARDS_PER_GROUP - remaining.length;
        var batch = remaining.concat(_shuffledQueue.slice(0, needed));
        _shuffledQueue = _shuffledQueue.slice(needed);
        return batch;
    }
    var batch = _shuffledQueue.slice(0, CARDS_PER_GROUP);
    _shuffledQueue = _shuffledQueue.slice(CARDS_PER_GROUP);
    return batch;
}

refillQueue();

// ---------- Create landscape cards ----------
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

function updateGallery() {
    var cards = document.querySelectorAll('#gallery-landscape .img-card');
    var newIndices = getRandomIndices();
    var srcs = newIndices.map(function (i) {
        return imageBase + IMAGE_IDS[i] + '.jpg';
    });

    cards.forEach(function (card, i) {
        var img = card.querySelector('.gallery-img');
        var src = srcs[i];

        img.classList.remove('loaded');
        card.dataset.src = src;
        setTimeout(function () {
            img.src = src;
            img.dataset.src = src;
            img.classList.add('loaded');
        }, 350);
    });
}

// ---------- Create portrait cards ----------
function createPortraitCards() {
    var fragment = document.createDocumentFragment();
    for (var i = 0; i < PORTRAIT_IDS.length; i++) {
        var card = document.createElement('div');
        card.className = 'img-card';
        card.dataset.index = i;

        var img = document.createElement('img');
        img.className = 'gallery-img';
        img.alt = 'Portrait ' + (i + 1);

        var src = portraitBase + PORTRAIT_IDS[i] + (PORTRAIT_IDS[i] === 1 ? '.jpg' : '.JPG');
        img.src = src;
        img.dataset.src = src;
        card.dataset.src = src;

        // Reveal on load
        if (img.complete) {
            img.classList.add('loaded');
        } else {
            img.addEventListener('load', function () { img.classList.add('loaded'); });
        }

        fragment.appendChild(card);
    }
    galleryPortrait.appendChild(fragment);

    // Preload portrait images
    PORTRAIT_IDS.forEach(function (id) {
        var pre = new Image();
        pre.src = portraitBase + id + (id === 1 ? '.jpg' : '.JPG');
    });
}

// ---------- Password Gate ----------
var PORTRAIT_PASSWORD = 'c';

function initPortraitGate() {
    portraitInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.keyCode === 13) {
            e.preventDefault();
            checkPassword();
        }
    });

    // Clear error on typing
    portraitInput.addEventListener('input', function () {
        portraitError.classList.remove('show');
        portraitInput.classList.remove('shake');
    });
}

function checkPassword() {
    if (portraitInput.value.toLowerCase() === PORTRAIT_PASSWORD) {
        unlockPortrait();
    } else {
        portraitError.classList.add('show');
        portraitInput.classList.add('shake');
        portraitInput.value = '';
        setTimeout(function () {
            portraitInput.classList.remove('shake');
        }, 400);
    }
}

function unlockPortrait() {
    portraitGate.style.display = 'none';
    galleryPortrait.style.display = 'block';
    // Create cards now — images load because container is visible
    createPortraitCards();
}

// ---------- Lightbox ----------
function getGallerySrcs(card) {
    var gallery = card.closest('.masonry');
    if (!gallery) return [];
    var cards = gallery.querySelectorAll('.img-card');
    var srcs = [];
    cards.forEach(function (c) {
        srcs.push(c.dataset.src || '');
    });
    return srcs;
}

function openLightbox(card) {
    var index = parseInt(card.dataset.index, 10);
    currentSrcs = getGallerySrcs(card);
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
        openLightbox(card);
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
    // Preload all landscape images
    IMAGE_IDS.forEach(function (id) {
        var img = new Image();
        img.src = imageBase + id + '.jpg';
    });

    createCards();
    updateGallery();
    setInterval(updateGallery, SWITCH_INTERVAL);

    initPortraitGate();

    bindEvents();
}

window.addEventListener('DOMContentLoaded', init);

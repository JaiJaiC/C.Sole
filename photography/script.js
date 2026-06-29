// ========================================
// Photography Page — Landscape Gallery
// ========================================

const SWITCH_INTERVAL = 8000;
const CARDS_PER_GROUP = 10;

// Image source: ../artportfolio/landscape/1.jpg through 22.jpg
const TOTAL_IMAGES = 22;
const imageBase = '../artportfolio/landscape/';

// ---------- DOM refs ----------
const galleryLandscape = document.getElementById('gallery-landscape');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxCounter = document.getElementById('lightbox-counter');
const btnClose = document.getElementById('lightbox-close');
const btnPrev = document.getElementById('lightbox-prev');
const btnNext = document.getElementById('lightbox-next');

// ---------- Lightbox state ----------
let currentIndex = -1;
let currentSrcs = [];

// ---------- Fisher-Yates shuffle ----------
function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function getRandomIndices() {
    const all = Array.from({ length: TOTAL_IMAGES }, (_, i) => i);
    return shuffle(all).slice(0, CARDS_PER_GROUP);
}

// ---------- Create cards ----------
function createCards() {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < CARDS_PER_GROUP; i++) {
        const card = document.createElement('div');
        card.className = 'img-card';
        card.dataset.index = i;

        const img = document.createElement('img');
        img.className = 'gallery-img';
        img.alt = `Landscape ${i + 1}`;
        card.appendChild(img);

        fragment.appendChild(card);
    }
    galleryLandscape.appendChild(fragment);
}

// ---------- Update gallery ----------
function updateGallery() {
    const cards = document.querySelectorAll('.img-card');
    const newIndices = getRandomIndices();
    currentSrcs = newIndices.map(i => imageBase + (i + 1) + '.jpg');

    cards.forEach((card, i) => {
        const img = card.querySelector('.gallery-img');
        const src = currentSrcs[i];

        img.classList.remove('loaded');
        setTimeout(() => {
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
    const src = currentSrcs[currentIndex];

    lightboxImg.style.opacity = '0';
    setTimeout(() => {
        lightboxImg.src = src;
        lightboxImg.style.opacity = '1';
        lightboxCounter.textContent = `${currentIndex + 1} / ${currentSrcs.length}`;
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
    document.addEventListener('click', (e) => {
        const card = e.target.closest('.img-card');
        if (!card) return;
        const index = parseInt(card.dataset.index, 10);
        openLightbox(index);
    });

    btnClose.addEventListener('click', (e) => {
        e.stopPropagation();
        closeLightbox();
    });

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });

    btnPrev.addEventListener('click', (e) => {
        e.stopPropagation();
        prevImage();
    });

    btnNext.addEventListener('click', (e) => {
        e.stopPropagation();
        nextImage();
    });

    document.addEventListener('keydown', (e) => {
        if (currentIndex < 0) return;
        if (e.key === 'ArrowLeft') { e.preventDefault(); prevImage(); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); nextImage(); }
        else if (e.key === 'Escape') { e.preventDefault(); closeLightbox(); }
    });
}

// ---------- Init ----------
function init() {
    // Preload first batch
    for (let i = 1; i <= TOTAL_IMAGES; i++) {
        const img = new Image();
        img.src = imageBase + i + '.jpg';
    }

    createCards();
    updateGallery();

    // Auto-rotate landscape images
    setInterval(updateGallery, SWITCH_INTERVAL);

    bindEvents();
}

window.addEventListener('DOMContentLoaded', init);

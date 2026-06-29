// ========================================
// Draw Page — Gallery Script
// ========================================

const CARDS_PER_GROUP = 10;
const TOTAL_IMAGES = 11;

// ---------- DOM refs ----------
const galleryDraw = document.getElementById('gallery-draw');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxCounter = document.getElementById('lightbox-counter');
const btnClose = document.getElementById('lightbox-close');
const btnPrev = document.getElementById('lightbox-prev');
const btnNext = document.getElementById('lightbox-next');

// ---------- Lightbox state ----------
let currentIndex = -1;
const imageSrcs = [];

// ---------- Preload all images ----------
function preloadAll() {
    for (let i = 1; i <= TOTAL_IMAGES; i++) {
        const img = new Image();
        img.src = `draw/${i}.jpg`;
    }
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
        img.alt = `Draw ${i + 1}`;
        card.appendChild(img);

        fragment.appendChild(card);

        // Track src for lightbox
        imageSrcs.push(`draw/${i + 1}.jpg`);
    }
    galleryDraw.appendChild(fragment);
}

// ---------- Update gallery ----------
function updateGallery() {
    const cards = document.querySelectorAll('.img-card');
    cards.forEach((card, i) => {
        const img = card.querySelector('.gallery-img');
        const src = `draw/${i + 1}.jpg`;
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
    const src = imageSrcs[currentIndex];

    lightboxImg.style.opacity = '0';
    setTimeout(() => {
        lightboxImg.src = src;
        lightboxImg.style.opacity = '1';
        lightboxCounter.textContent = `${currentIndex + 1} / ${imageSrcs.length}`;
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
    preloadAll();
    createCards();
    updateGallery();
    bindEvents();
}

window.addEventListener('DOMContentLoaded', init);

// ========================================
// C.Sole — Circular Cropped Favicon
// ========================================
(function () {
  'use strict';

  // Find the favicon <link> to get the image path
  var link = document.querySelector('link[rel="icon"]');
  if (!link) return;
  var src = link.getAttribute('href');
  if (!src) return;

  var img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = function () {
    var size = 64;
    var canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    var ctx = canvas.getContext('2d');

    // Crop to center square
    var minDim = Math.min(img.width, img.height);
    var sx = (img.width - minDim) / 2;
    var sy = (img.height - minDim) / 2;

    // Draw circular clip
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Draw image centered and cropped
    ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

    // Replace favicon
    link.href = canvas.toDataURL('image/png');
  };
  img.src = src;
})();

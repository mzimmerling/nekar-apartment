'use strict';

(() => {
  const isGerman = document.documentElement.lang.toLowerCase().startsWith('de');
  const localize = (english, german) => isGerman ? german : english;
  const captionFor = photo => isGerman ? (photo.captionDe || photo.caption) : photo.caption;
  const photos = window.APARTMENT_PHOTOS || [];
  const grid = document.getElementById('gallery-grid');
  const moreButton = document.getElementById('show-more');
  const status = document.getElementById('gallery-status');
  const filterButtons = [...document.querySelectorAll('[data-filter]')];
  const viewer = document.getElementById('image-viewer');
  const viewerImage = document.getElementById('viewer-image');
  const viewerCaption = document.getElementById('viewer-caption');
  const viewerCounter = document.getElementById('viewer-counter');
  const viewerStage = document.getElementById('viewer-stage');
  const previousButton = document.getElementById('viewer-prev');
  const nextButton = document.getElementById('viewer-next');
  const zoomReset = document.getElementById('zoom-reset');
  let activeFilter = 'all';
  let showAll = false;
  let activeCollection = photos;
  let activeIndex = 0;
  let currentScale = 1;
  let baseWidth = 0;
  let baseHeight = 0;
  let lastTrigger = null;

  const filteredPhotos = () => photos.filter(photo => activeFilter === 'all' || photo.category === activeFilter);

  function renderGallery() {
    const filtered = filteredPhotos();
    const visible = activeFilter === 'all' && !showAll ? filtered.slice(0, 12) : filtered;
    grid.replaceChildren();
    for (const photo of visible) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'gallery-card';
      button.dataset.photoId = photo.id;
      button.setAttribute('aria-label', `${localize('Enlarge', 'Vergrößern')}: ${captionFor(photo)}`);
      const frame = document.createElement('span');
      frame.className = 'gallery-image';
      const image = document.createElement('img');
      image.src = `assets/${photo.id}-sm.webp`;
      image.srcset = `assets/${photo.id}-sm.webp 480w, assets/${photo.id}-md.webp 960w`;
      image.sizes = '(max-width: 600px) calc(100vw - 40px), (max-width: 800px) 48vw, 32vw';
      image.width = photo.width;
      image.height = photo.height;
      image.loading = 'lazy';
      image.decoding = 'async';
      image.alt = captionFor(photo);
      frame.append(image);
      const caption = document.createElement('span');
      caption.className = 'gallery-caption';
      const captionText = document.createElement('span');
      captionText.textContent = captionFor(photo);
      const arrow = document.createElement('span');
      arrow.textContent = '↗';
      arrow.setAttribute('aria-hidden', 'true');
      caption.append(captionText, arrow);
      button.append(frame, caption);
      grid.append(button);
    }
    moreButton.hidden = activeFilter !== 'all' || showAll;
    status.textContent = localize(
      `Showing ${visible.length} of ${filtered.length} photographs.`,
      `${visible.length} von ${filtered.length} Fotos werden angezeigt.`
    );
  }

  for (const button of filterButtons) {
    button.addEventListener('click', () => {
      activeFilter = button.dataset.filter;
      showAll = false;
      for (const candidate of filterButtons) candidate.setAttribute('aria-pressed', String(candidate === button));
      renderGallery();
    });
  }

  moreButton.addEventListener('click', () => {
    showAll = true;
    renderGallery();
    grid.children[12]?.focus({ preventScroll: true });
  });

  function resetZoom() {
    currentScale = 1;
    viewerStage.classList.remove('zoomed');
    viewerImage.style.width = '';
    viewerImage.style.height = '';
    zoomReset.textContent = '100%';
    viewerStage.scrollTop = viewerStage.scrollLeft = 0;
    requestAnimationFrame(() => {
      baseWidth = viewerImage.getBoundingClientRect().width;
      baseHeight = viewerImage.getBoundingClientRect().height;
    });
  }

  function displayActiveImage() {
    const photo = activeCollection[activeIndex];
    viewerImage.alt = captionFor(photo);
    viewerCaption.textContent = captionFor(photo);
    viewerImage.src = photo.src || `assets/${photo.id}-lg.webp`;
    viewerCounter.textContent = activeCollection.length === 1 ? localize('Floor plan', 'Grundriss') : `${activeIndex + 1} / ${activeCollection.length}`;
    const singleImage = activeCollection.length === 1;
    previousButton.disabled = singleImage;
    nextButton.disabled = singleImage;
    resetZoom();
  }

  function openViewer(collection, index, trigger) {
    activeCollection = collection;
    activeIndex = index;
    lastTrigger = trigger;
    if (typeof viewer.showModal !== 'function') {
      const photo = activeCollection[activeIndex];
      window.open(photo.src || `assets/${photo.id}-lg.webp`, '_blank', 'noopener');
      return;
    }
    displayActiveImage();
    document.body.classList.add('viewer-open');
    viewer.showModal();
    requestAnimationFrame(resetZoom);
  }

  document.addEventListener('click', event => {
    const trigger = event.target.closest('[data-photo-id]');
    if (!trigger) return;
    const collection = trigger.closest('#gallery-grid') ? filteredPhotos() : photos;
    const index = collection.findIndex(photo => photo.id === trigger.dataset.photoId);
    if (index >= 0) openViewer(collection, index, trigger);
  });

  document.getElementById('open-floorplan').addEventListener('click', event => {
    openViewer([{
      src: 'assets/floor-plan.png?v=2',
      caption: 'Floor plan · four bedrooms and a south-facing terrace',
      captionDe: 'Grundriss · vier Schlafzimmer und eine Südterrasse'
    }], 0, event.currentTarget);
  });

  const move = direction => {
    if (activeCollection.length < 2) return;
    activeIndex = (activeIndex + direction + activeCollection.length) % activeCollection.length;
    displayActiveImage();
  };
  previousButton.addEventListener('click', () => move(-1));
  nextButton.addEventListener('click', () => move(1));
  viewer.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
  });
  document.getElementById('viewer-close').addEventListener('click', () => viewer.close());
  viewer.addEventListener('click', event => { if (event.target === viewer) viewer.close(); });
  viewer.addEventListener('close', () => {
    document.body.classList.remove('viewer-open');
    lastTrigger?.focus({ preventScroll: true });
  });

  function setZoom(nextScale) {
    if (!viewerImage.complete || !viewerImage.naturalWidth) return;
    if (currentScale === 1) {
      baseWidth = viewerImage.getBoundingClientRect().width;
      baseHeight = viewerImage.getBoundingClientRect().height;
    }
    currentScale = Math.max(1, Math.min(3, nextScale));
    if (currentScale === 1) return resetZoom();
    viewerStage.classList.add('zoomed');
    viewerImage.style.width = `${Math.round(baseWidth * currentScale)}px`;
    viewerImage.style.height = `${Math.round(baseHeight * currentScale)}px`;
    zoomReset.textContent = `${Math.round(currentScale * 100)}%`;
  }
  document.getElementById('zoom-in').addEventListener('click', () => setZoom(currentScale + 0.5));
  document.getElementById('zoom-out').addEventListener('click', () => setZoom(currentScale - 0.5));
  zoomReset.addEventListener('click', resetZoom);
  viewerImage.addEventListener('load', resetZoom);
  window.addEventListener('resize', () => { if (viewer.open) resetZoom(); });

  const email = (window.APARTMENT_CONFIG?.contactEmail || '').trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const link = document.getElementById('email-link');
    const subject = localize('Heidelberg apartment · February–August 2027', 'Wohnung in Heidelberg · Februar–August 2027');
    link.href = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
    const arrow = document.createElement('span');
    arrow.textContent = '↗';
    arrow.setAttribute('aria-hidden', 'true');
    link.replaceChildren(document.createTextNode(email + ' '), arrow);
    link.hidden = false;
  }

  for (const link of document.querySelectorAll('.language-switch a')) {
    link.addEventListener('click', () => {
      link.hash = window.location.hash;
    });
  }
  renderGallery();
})();

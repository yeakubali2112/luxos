/**
 * Luxos - Dedicated Product Landing Page & Interactive Zoom Engine
 * Encapsulated in an IIFE to prevent variable collisions.
 */
(function () {
  'use strict';

  // Helper DOM selectors
  const $ = selector => document.querySelector(selector);
  const $$ = selector => document.querySelectorAll(selector);

  // State variables
  let currentProduct = null;
  let currentGalleryImages = [];
  let activeImageIndex = 0;
  let selectedColor = 'Noir Black';
  let selectedStarRating = 5;
  let uploadedPhotoData = null;
  let lightboxZoomLevel = 1;

  // Default Full Gallery for Product #1 (Executive RFID Card Holder)
  const DEFAULT_PRODUCT1_GALLERY = [
    'https://thepatchee.com/cdn/shop/files/654a7e83-c512-4ec1-8ebf-af44c488e776.png?v=1781362688',
    'https://thepatchee.com/cdn/shop/files/dc64c41d-ae95-4a7f-912f-1c2a664d35f1.jpg?v=1781362693',
    'https://thepatchee.com/cdn/shop/files/572c906d-1d96-48a7-9724-f99155bba413.jpg?v=1781362696',
    'https://thepatchee.com/cdn/shop/files/7_JDF6Lx.jpg?v=1781362700',
    'https://thepatchee.com/cdn/shop/files/16_oF8xw5.jpg?v=1781362703',
    'https://thepatchee.com/cdn/shop/files/1_Sr7vuQ.jpg?v=1781362706',
    'https://thepatchee.com/cdn/shop/files/17_9tpHkH.jpg?v=1781362710',
    'https://thepatchee.com/cdn/shop/files/18_2rgYCr.jpg?v=1781362713',
    'https://thepatchee.com/cdn/shop/files/15_1Knw4N.jpg?v=1781362716'
  ];

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    initProductPage();
    initImageZoomEngine();
    initCountdownTimer();

    // Live cross-tab sync when product data is updated in Admin panel
    window.addEventListener('storage', function (e) {
      if (e.key === 'luxos_products_data' || (e.key && e.key.startsWith('luxos_pdp_extra_'))) {
        initProductPage();
      }
    });

    // Cross-device Cloud Sync via Supabase
    if (typeof LuxosCloud !== 'undefined') {
      LuxosCloud.getAllConfigs().then(configs => {
        if (configs && configs.length > 0) {
          initProductPage();
        }
      }).catch(function (err) {
        console.warn('[LuxosCloud] Product page sync error:', err);
      });
    }
  }

  /**
   * Extract product ID from URL query param (?id=1)
   */
  function getProductIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get('id');
    if (idParam) return parseInt(idParam, 10);
    
    const slugParam = params.get('slug');
    if (slugParam && typeof LUXOS_PRODUCTS !== 'undefined') {
      const found = LUXOS_PRODUCTS.find(p => p.slug === slugParam);
      if (found) return found.id;
    }
    return 1;
  }

  /**
   * Initialize PDP data and gallery
   */
  function initProductPage() {
    const targetId = getProductIdFromUrl();
    const catalog = typeof LUXOS_PRODUCTS !== 'undefined' ? LUXOS_PRODUCTS : [];
    
    // Find product from catalog or custom storage
    let baseProduct = catalog.find(p => p.id == targetId) || catalog[0] || {};
    if (typeof getStoreProducts === 'function') {
      const customList = getStoreProducts();
      const foundCustom = customList.find(p => p.id == targetId);
      if (foundCustom) {
        baseProduct = { ...baseProduct, ...foundCustom };
      }
    }

    currentProduct = baseProduct;
    if (!currentProduct || !currentProduct.id) return;

    // Set page title & breadcrumbs
    document.title = `${currentProduct.title || 'Product'} | Luxos Official`;
    const metaTitleEl = $('#pageTitle');
    if (metaTitleEl) metaTitleEl.textContent = `${currentProduct.title} | Luxos`;

    const breadCategory = $('#breadcrumbCategory');
    const breadTitle = $('#breadcrumbTitle');
    if (breadCategory) breadCategory.textContent = currentProduct.category || 'Luxury Collection';
    if (breadTitle) breadTitle.textContent = currentProduct.title || '';

    // Setup Gallery
    setupGallery();

    // Setup Product Details / Meta
    renderProductDetails();

    // Setup Reviews Section
    initReviewsSection();

    // Setup Related Products
    renderRelatedProducts();
  }

  /**
   * Setup side thumbnail list and main image
   */
  function setupGallery() {
    const mainImg = document.getElementById('mainProductImage');
    const thumbContainer = document.getElementById('thumbnailContainer');
    if (!mainImg || !thumbContainer) return;

    const images = [];
    
    // Collect all product images
    if (currentProduct.image) images.push(currentProduct.image);
    if (currentProduct.hoverImage && !images.includes(currentProduct.hoverImage)) {
      images.push(currentProduct.hoverImage);
    }
    if (Array.isArray(currentProduct.gallery)) {
      currentProduct.gallery.forEach(img => {
        if (img && !images.includes(img)) images.push(img);
      });
    }
    if (Array.isArray(currentProduct.colors)) {
      currentProduct.colors.forEach(col => {
        if (col && col.image && !images.includes(col.image)) images.push(col.image);
      });
    }

    // Ensure Product #1 always has all 9 high-res studio photos
    if (currentProduct.id === 1) {
      DEFAULT_PRODUCT1_GALLERY.forEach(imgUrl => {
        if (!images.includes(imgUrl)) images.push(imgUrl);
      });
    }

    currentGalleryImages = images;
    activeImageIndex = 0;

    // Set initial main image
    if (images.length > 0) {
      mainImg.src = images[0];
      mainImg.alt = currentProduct.title || 'Luxos Product';
    }

    // Render vertical thumbnail buttons on the side
    thumbContainer.innerHTML = images.map((imgUrl, idx) => `
      <button 
        type="button"
        onclick="switchMainImage('${imgUrl}', this, ${idx})"
        class="thumbnail-btn w-14 h-14 md:w-16 md:h-16 rounded ${idx === 0 ? 'border-2 border-black ring-1 ring-black' : 'border border-gray-200'} overflow-hidden shrink-0 hover:border-black transition focus:outline-none bg-white p-0.5 shadow-sm cursor-pointer"
        title="View Photo ${idx + 1}">
        <img src="${imgUrl}" alt="Thumbnail ${idx + 1}" class="w-full h-full object-cover rounded-sm pointer-events-none" loading="lazy" />
      </button>
    `).join('');
  }

  /**
   * Switch main image when thumbnail is clicked
   */
  function switchMainImage(imgUrl, btnEl, index = 0) {
    const mainImg = document.getElementById('mainProductImage');
    if (mainImg) {
      mainImg.src = imgUrl;
    }

    activeImageIndex = index;

    // Highlight active thumbnail
    const buttons = document.querySelectorAll('.thumbnail-btn');
    buttons.forEach((btn, idx) => {
      if (btn === btnEl || idx === index) {
        btn.classList.remove('border', 'border-gray-200');
        btn.classList.add('border-2', 'border-black', 'ring-1', 'ring-black');
      } else {
        btn.classList.remove('border-2', 'border-black', 'ring-1', 'ring-black');
        btn.classList.add('border', 'border-gray-200');
      }
    });

    const lightboxImg = document.getElementById('lightboxImage');
    if (lightboxImg) {
      lightboxImg.src = imgUrl;
    }
  }
  window.switchMainImage = switchMainImage;

  /**
   * Interactive Zoom Engine:
   * 1) Magnifier Zoom on Hover
   * 2) Click Fullscreen HD Lightbox Modal
   */
  function initImageZoomEngine() {
    const container = document.getElementById('mainImageContainer');
    const img = document.getElementById('mainProductImage');
    if (!container || !img) return;

    // 1. Mousemove: Magnifier Zoom on Hover
    container.addEventListener('mousemove', (e) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      img.style.transformOrigin = `${x}% ${y}%`;
      img.style.transform = 'scale(2.2)';
    });

    // Mouseleave: Reset smoothly
    container.addEventListener('mouseleave', () => {
      img.style.transformOrigin = 'center center';
      img.style.transform = 'scale(1)';
    });

    // 2. Click: Open Fullscreen HD Lightbox Modal
    container.addEventListener('click', () => {
      openLightboxModal(img.src);
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      const modal = document.getElementById('imageLightboxModal');
      if (!modal || modal.classList.contains('hidden')) return;

      if (e.key === 'Escape') closeLightboxModal();
      if (e.key === 'ArrowRight') nextLightboxImage();
      if (e.key === 'ArrowLeft') prevLightboxImage();
    });
  }

  function openLightboxModal(imgSrc) {
    const modal = document.getElementById('imageLightboxModal');
    const lightboxImg = document.getElementById('lightboxImage');
    if (!modal || !lightboxImg) return;

    lightboxImg.src = imgSrc || (currentGalleryImages[activeImageIndex] || '');
    lightboxZoomLevel = 1;
    lightboxImg.style.transform = 'scale(1)';

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
  }
  window.openLightboxModal = openLightboxModal;

  function closeLightboxModal() {
    const modal = document.getElementById('imageLightboxModal');
    if (!modal) return;

    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = '';
  }
  window.closeLightboxModal = closeLightboxModal;

  function zoomLightbox(delta) {
    const lightboxImg = document.getElementById('lightboxImage');
    if (!lightboxImg) return;

    lightboxZoomLevel = Math.max(0.75, Math.min(3.5, lightboxZoomLevel + delta));
    lightboxImg.style.transform = `scale(${lightboxZoomLevel})`;
  }
  window.zoomLightbox = zoomLightbox;

  function resetLightboxZoom() {
    const lightboxImg = document.getElementById('lightboxImage');
    if (!lightboxImg) return;
    lightboxZoomLevel = 1;
    lightboxImg.style.transform = 'scale(1)';
  }
  window.resetLightboxZoom = resetLightboxZoom;

  function nextLightboxImage() {
    if (!currentGalleryImages.length) return;
    activeImageIndex = (activeImageIndex + 1) % currentGalleryImages.length;
    const newSrc = currentGalleryImages[activeImageIndex];
    const lightboxImg = document.getElementById('lightboxImage');
    if (lightboxImg) lightboxImg.src = newSrc;
    switchMainImage(newSrc, null, activeImageIndex);
  }
  window.nextLightboxImage = nextLightboxImage;

  function prevLightboxImage() {
    if (!currentGalleryImages.length) return;
    activeImageIndex = (activeImageIndex - 1 + currentGalleryImages.length) % currentGalleryImages.length;
    const newSrc = currentGalleryImages[activeImageIndex];
    const lightboxImg = document.getElementById('lightboxImage');
    if (lightboxImg) lightboxImg.src = newSrc;
    switchMainImage(newSrc, null, activeImageIndex);
  }
  window.prevLightboxImage = prevLightboxImage;

  /**
   * Render right column product details
   */
  function renderProductDetails() {
    const titleEl = document.getElementById('pdpTitle');
    if (titleEl) titleEl.textContent = currentProduct.title;

    const skuEl = document.getElementById('pdpSku');
    if (skuEl) skuEl.textContent = `SKU: ${currentProduct.sku || '190' + currentProduct.id + '32'}`;

    const priceEl = document.getElementById('pdpPrice');
    if (priceEl) priceEl.textContent = currentProduct.price;
    
    const origPriceEl = document.getElementById('pdpOriginalPrice');
    const youSaveContainer = document.getElementById('pdpYouSaveContainer');
    const youSaveEl = document.getElementById('pdpYouSave');

    if (origPriceEl && currentProduct.originalPrice) {
      origPriceEl.textContent = currentProduct.originalPrice;
      origPriceEl.classList.remove('hidden');

      const saleNum = parseInt(String(currentProduct.price).replace(/[^\d]/g, ''), 10) || 0;
      const origNum = parseInt(String(currentProduct.originalPrice).replace(/[^\d]/g, ''), 10) || 0;
      const saveAmt = origNum - saleNum;
      if (saveAmt > 0 && youSaveEl && youSaveContainer) {
        youSaveEl.textContent = `YOU SAVE ৳ ${saveAmt.toLocaleString('en-IN')}`;
        youSaveContainer.classList.remove('hidden');
      }
    } else {
      if (origPriceEl) origPriceEl.classList.add('hidden');
      if (youSaveContainer) youSaveContainer.classList.add('hidden');
    }

    const badgeEl = document.getElementById('pdpDiscountBadge');
    if (badgeEl) {
      const badgeText = currentProduct.badge || 'SAVE 46%';
      badgeEl.textContent = badgeText.toUpperCase();
    }

    const reviewCount = getProductReviewsCount(currentProduct.id);
    const revCountEl = document.getElementById('pdpReviewCount');
    if (revCountEl) revCountEl.textContent = `${reviewCount} reviews`;

    // Stock Status & Out of Stock Overlay
    const stockVal = typeof currentProduct.stock !== 'undefined' ? parseInt(currentProduct.stock, 10) : 10;
    const isOutOfStock = stockVal <= 0;
    const oosOverlay = document.getElementById('pdpOutOfStockOverlay');
    const stockBadge = document.getElementById('pdpStockBadge');
    const stockDot = document.getElementById('pdpStockDot');
    const stockText = document.getElementById('pdpStockText');
    const orderBtn = document.getElementById('pdpOrderNowBtn');

    if (oosOverlay) {
      if (isOutOfStock) {
        oosOverlay.classList.remove('hidden');
      } else {
        oosOverlay.classList.add('hidden');
      }
    }

    if (stockBadge && stockDot && stockText) {
      if (isOutOfStock) {
        stockBadge.className = 'inline-flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200';
        stockDot.className = 'w-1.5 h-1.5 rounded-full bg-red-500';
        stockText.textContent = 'Out of stock';
      } else {
        stockBadge.className = 'inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full';
        stockDot.className = 'w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse';
        stockText.textContent = 'In stock';
      }
    }

    if (orderBtn) {
      if (isOutOfStock) {
        orderBtn.disabled = true;
        orderBtn.classList.remove('bg-black', 'hover:bg-neutral-800', 'cursor-pointer');
        orderBtn.classList.add('bg-gray-400', 'cursor-not-allowed', 'opacity-75');
        const spanText = orderBtn.querySelector('span');
        if (spanText) spanText.textContent = 'Out of Stock';
      } else {
        orderBtn.disabled = false;
        orderBtn.classList.remove('bg-gray-400', 'cursor-not-allowed', 'opacity-75');
        orderBtn.classList.add('bg-black', 'hover:bg-neutral-800', 'cursor-pointer');
        const spanText = orderBtn.querySelector('span');
        if (spanText) spanText.textContent = 'Order Now - Cash on Delivery';
      }
    }

    // Render Description & Highlights (Requested Feature)
    const descEl = document.getElementById('pdpDescriptionText');
    if (descEl) {
      descEl.textContent = currentProduct.description || 'Crafted for modern executives, the Executive RFID Card Holder merges minimalist architectural design with smart functionality. Features an ergonomic one-click card ejector mechanism, aerospace-grade aluminum casing with 13.56 MHz RFID signal blocking, and premium hand-finished leather casing.';
    }
    renderProductVideo();

    // Render Bag Dimensions & Features (Only show if added in Admin panel)
    const keyFeaturesBlock = document.getElementById('pdpKeyFeaturesBlock');
    const dimLi = document.getElementById('pdpDimensionLi');
    const featLi = document.getElementById('pdpFeatureLi');
    const dimContainer = document.getElementById('pdpDimensionsItems');
    const featContainer = document.getElementById('pdpFeaturesItems');

    let dims = [];
    if (Array.isArray(currentProduct.dimensionsList)) {
      dims = currentProduct.dimensionsList.map(s => String(s).trim()).filter(Boolean);
    } else if (typeof currentProduct.dimensionsList === 'string' && currentProduct.dimensionsList.trim()) {
      dims = currentProduct.dimensionsList.split('\n').map(s => s.trim()).filter(Boolean);
    }

    let feats = [];
    if (Array.isArray(currentProduct.featuresList)) {
      feats = currentProduct.featuresList.map(s => String(s).trim()).filter(Boolean);
    } else if (typeof currentProduct.featuresList === 'string' && currentProduct.featuresList.trim()) {
      feats = currentProduct.featuresList.split('\n').map(s => s.trim()).filter(Boolean);
    }

    const hasDims = dims.length > 0;
    const hasFeats = feats.length > 0;

    if (keyFeaturesBlock) {
      if (!hasDims && !hasFeats) {
        keyFeaturesBlock.classList.add('hidden');
      } else {
        keyFeaturesBlock.classList.remove('hidden');

        if (dimLi) {
          if (hasDims) {
            dimLi.classList.remove('hidden');
            if (dimContainer) {
              dimContainer.innerHTML = dims.map(d => `<li>${d}</li>`).join('');
            }
          } else {
            dimLi.classList.add('hidden');
            if (dimContainer) dimContainer.innerHTML = '';
          }
        }

        if (featLi) {
          if (hasFeats) {
            featLi.classList.remove('hidden');
            if (featContainer) {
              featContainer.innerHTML = feats.map(f => `<li>${f}</li>`).join('');
            }
          } else {
            featLi.classList.add('hidden');
            if (featContainer) featContainer.innerHTML = '';
          }
        }
      }
    }

    if (currentProduct.specs) {
      if (currentProduct.specs.material && document.getElementById('pdpSpecMaterial')) {
        document.getElementById('pdpSpecMaterial').textContent = currentProduct.specs.material;
      }
      if (currentProduct.specs.capacity && document.getElementById('pdpSpecCapacity')) {
        document.getElementById('pdpSpecCapacity').textContent = currentProduct.specs.capacity;
      }
      if (currentProduct.specs.dimensions && document.getElementById('pdpSpecDimensions')) {
        document.getElementById('pdpSpecDimensions').textContent = currentProduct.specs.dimensions;
      }
      if (currentProduct.specs.weight && document.getElementById('pdpSpecWeight')) {
        document.getElementById('pdpSpecWeight').textContent = currentProduct.specs.weight;
      }
    }

    if (currentProduct.features && Array.isArray(currentProduct.features)) {
      currentProduct.features.forEach((f, idx) => {
        const titleEl = document.getElementById(`pdpFeatureTitle${idx + 1}`);
        const descEl = document.getElementById(`pdpFeatureDesc${idx + 1}`);
        if (titleEl && f.title) titleEl.textContent = f.title;
        if (descEl && f.desc) descEl.textContent = f.desc;
      });
    }

    // Render custom delivery notice
    const deliveryBanner = document.getElementById('estimatedDeliveryBanner');
    const delEl = document.getElementById('pdpDeliveryNoticeText') || document.querySelector('#estimatedDeliveryBanner span');
    
    let noticeText = null;
    if (typeof currentProduct.deliveryNotice === 'string') {
      noticeText = currentProduct.deliveryNotice.trim();
    } else {
      try {
        const extra = JSON.parse(localStorage.getItem(`luxos_pdp_extra_${currentProduct.id}`));
        if (extra && typeof extra.deliveryNotice === 'string') {
          noticeText = extra.deliveryNotice.trim();
        }
      } catch (e) {}
    }

    if (deliveryBanner) {
      if (noticeText !== null && noticeText !== '') {
        deliveryBanner.classList.remove('hidden');
        if (delEl) delEl.innerHTML = noticeText;
      } else if (noticeText === '') {
        // Explicitly cleared by admin
        deliveryBanner.classList.add('hidden');
      } else {
        // Default when not customized
        deliveryBanner.classList.remove('hidden');
        if (delEl) delEl.innerHTML = 'Estimated Delivery: <b>3–5 Days</b> — Ships directly from Dhaka';
      }
    }

    renderVariantSwatches();
  }

  function switchPdpTab(tabId) {
    document.querySelectorAll('.pdp-tab-btn').forEach(btn => {
      btn.classList.remove('border-black', 'text-black');
      btn.classList.add('border-transparent', 'text-gray-400');
    });
    const activeBtn = document.getElementById(`pdpTabBtn-${tabId}`);
    if (activeBtn) {
      activeBtn.classList.remove('border-transparent', 'text-gray-400');
      activeBtn.classList.add('border-black', 'text-black');
    }

    document.querySelectorAll('.pdp-tab-content').forEach(content => {
      content.classList.add('hidden');
    });
    const activeContent = document.getElementById(`pdpTabContent-${tabId}`);
    if (activeContent) {
      activeContent.classList.remove('hidden');
    }
  }
  window.switchPdpTab = switchPdpTab;

  /**
   * Render Color / Variant Swatches
   */
  function renderVariantSwatches() {
    let colors = currentProduct.colors;
    if (!colors || colors.length === 0) {
      colors = [
        { name: 'Noir Black', hex: '#111111', image: 'https://thepatchee.com/cdn/shop/files/654a7e83-c512-4ec1-8ebf-af44c488e776.png?v=1781362688' },
        { name: 'Mocha Brown', hex: '#5A3825', image: 'https://thepatchee.com/cdn/shop/files/572c906d-1d96-48a7-9724-f99155bba413.jpg?v=1781362696' },
        { name: 'Carbon Black', hex: '#252525', image: 'https://thepatchee.com/cdn/shop/files/1_Sr7vuQ.jpg?v=1781362706' },
        { name: 'Tan Camel', hex: '#B57B43', image: 'https://thepatchee.com/cdn/shop/files/17_9tpHkH.jpg?v=1781362710' },
        { name: 'Navy Blue', hex: '#1F2E4A', image: 'https://thepatchee.com/cdn/shop/files/16_oF8xw5.jpg?v=1781362703' }
      ];
    }

    selectedColor = colors[0].name;

    const container = document.getElementById('colorSwatchesContainer');
    if (!container) return;

    const selColorNameEl = document.getElementById('pdpSelectedColorName');
    if (selColorNameEl) selColorNameEl.textContent = selectedColor;

    container.innerHTML = colors.map((col, idx) => `
      <button 
        type="button"
        onclick="selectVariantColor('${col.name}', '${col.image || ''}', this)"
        class="variant-swatch-btn group relative border ${idx === 0 ? 'border-2 border-black ring-1 ring-black' : 'border-gray-200'} rounded p-1.5 flex items-center gap-2 hover:border-black transition bg-white cursor-pointer shadow-sm"
        title="${col.name}">
        <span class="w-5 h-5 rounded-full border border-gray-300 shadow-inner shrink-0" style="background-color: ${col.hex || '#111'};"></span>
        <span class="text-xs font-semibold text-gray-800 pr-1">${col.name}</span>
        <span class="text-[9px] bg-amber-100 text-amber-800 font-bold px-1 rounded">46%</span>
      </button>
    `).join('');
  }

  function selectVariantColor(colorName, colorImg, btnEl) {
    selectedColor = colorName;
    const selColorNameEl = document.getElementById('pdpSelectedColorName');
    if (selColorNameEl) selColorNameEl.textContent = colorName;

    document.querySelectorAll('.variant-swatch-btn').forEach(btn => {
      btn.classList.remove('border-2', 'border-black', 'ring-1', 'ring-black');
      btn.classList.add('border-gray-200');
    });
    if (btnEl) {
      btnEl.classList.remove('border-gray-200');
      btnEl.classList.add('border-2', 'border-black', 'ring-1', 'ring-black');
    }

    if (colorImg) {
      const idx = currentGalleryImages.indexOf(colorImg);
      switchMainImage(colorImg, null, idx !== -1 ? idx : 0);
    }
  }
  window.selectVariantColor = selectVariantColor;

  /**
   * Quantity controls
   */
  function updatePdpQty(delta) {
    const input = document.getElementById('pdpQuantity');
    if (!input) return;
    let val = parseInt(input.value, 10) || 1;
    val += delta;
    if (val < 1) val = 1;
    if (val > 10) val = 10;
    input.value = val;
  }
  window.updatePdpQty = updatePdpQty;

  /**
   * Add To Cart
   */
  function handleAddToCartPDP() {
    if (!currentProduct) return;
    const qty = parseInt(document.getElementById('pdpQuantity')?.value || 1, 10) || 1;
    const priceNum = parseInt(String(currentProduct.price).replace(/[^\d]/g, ''), 10) || 687;

    const prodToAdd = {
      id: currentProduct.id,
      title: currentProduct.title,
      price: currentProduct.price,
      priceNum: priceNum,
      originalPrice: currentProduct.originalPrice,
      image: currentProduct.image || (currentGalleryImages && currentGalleryImages[0]) || '',
      category: currentProduct.category || 'Luxury Collection',
      color: selectedColor || 'Standard',
      quantity: qty
    };

    if (typeof window.addToCart === 'function') {
      window.addToCart(prodToAdd, selectedColor, qty, false);
    } else {
      let cart = JSON.parse(localStorage.getItem('luxos_cart')) || [];
      cart = cart.filter(i => i && i.id && i.title && i.title !== 'undefined');
      const existing = cart.find(i => i.id === prodToAdd.id && i.color === (selectedColor || 'Standard'));
      if (existing) {
        existing.quantity += qty;
        existing.priceNum = priceNum;
      } else {
        cart.push(prodToAdd);
      }
      localStorage.setItem('luxos_cart', JSON.stringify(cart));
      if (typeof window.updateCartBadge === 'function') window.updateCartBadge();
      if (typeof window.openCartDrawer === 'function') window.openCartDrawer();
    }

    showToast(`Added ${qty}x ${currentProduct.title} to your bag!`);
  }
  window.handleAddToCartPDP = handleAddToCartPDP;

  /**
   * 1-Click Order Now (Cash on Delivery)
   */
  function handleOrderNowCOD() {
    if (!currentProduct) return;
    const stockVal = typeof currentProduct.stock !== 'undefined' ? parseInt(currentProduct.stock, 10) : 10;
    if (stockVal <= 0) {
      showToast('Sorry, this product is currently out of stock!');
      return;
    }
    const qty = parseInt(document.getElementById('pdpQuantity')?.value || 1, 10) || 1;
    const priceNum = parseInt(String(currentProduct.price).replace(/[^\d]/g, ''), 10) || 687;

    const prodToBuy = {
      id: currentProduct.id,
      title: currentProduct.title,
      price: currentProduct.price,
      priceNum: priceNum,
      originalPrice: currentProduct.originalPrice,
      image: currentProduct.image || (currentGalleryImages && currentGalleryImages[0]) || '',
      category: currentProduct.category || 'Luxury Collection',
      color: selectedColor || 'Standard',
      quantity: qty
    };

    // Close cart drawer if already open
    if (typeof window.closeCartDrawer === 'function') window.closeCartDrawer();

    // Add to cart without opening cart drawer
    if (typeof window.addToCart === 'function') {
      window.addToCart(prodToBuy, selectedColor, qty, true);
    } else {
      let cart = JSON.parse(localStorage.getItem('luxos_cart')) || [];
      cart = cart.filter(i => i && i.id && i.title && i.title !== 'undefined');
      const existing = cart.find(i => i.id === prodToBuy.id && i.color === (selectedColor || 'Standard'));
      if (existing) {
        existing.quantity = qty;
        existing.priceNum = priceNum;
        existing.price = prodToBuy.price;
        existing.image = prodToBuy.image;
      } else {
        cart.push(prodToBuy);
      }
      localStorage.setItem('luxos_cart', JSON.stringify(cart));
    }

    // Open Checkout Modal directly
    if (typeof window.openCheckoutModal === 'function') {
      window.openCheckoutModal();
    } else {
      const checkoutModal = document.getElementById('checkoutModal');
      if (checkoutModal) {
        checkoutModal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
      if (typeof window.updateCheckoutSummary === 'function') {
        window.updateCheckoutSummary();
      }
    }
  }
  window.handleOrderNowCOD = handleOrderNowCOD;

  /**
   * Countdown Timer
   */
  function initCountdownTimer() {
    const daysEl = document.getElementById('timerDays');
    const hoursEl = document.getElementById('timerHours');
    const minutesEl = document.getElementById('timerMinutes');
    const secondsEl = document.getElementById('timerSeconds');
    if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

    let hVal = 1, mVal = 29, sVal = 40;
    try {
      const extra = currentProduct ? JSON.parse(localStorage.getItem(`luxos_pdp_extra_${currentProduct.id}`)) : null;
      if (extra && extra.timer) {
        if (extra.timer.header && document.getElementById('timerHeaderTitle')) {
          document.getElementById('timerHeaderTitle').textContent = extra.timer.header;
        }
        if (typeof extra.timer.hours === 'number') hVal = extra.timer.hours;
        if (typeof extra.timer.minutes === 'number') mVal = extra.timer.minutes;
        if (typeof extra.timer.seconds === 'number') sVal = extra.timer.seconds;
      }
    } catch(e) {}

    let totalSeconds = (0 * 86400) + (hVal * 3600) + (mVal * 60) + sVal;

    function update() {
      if (totalSeconds <= 0) totalSeconds = 86400;
      const d = Math.floor(totalSeconds / 86400);
      const h = Math.floor((totalSeconds % 86400) / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;

      daysEl.textContent = String(d).padStart(2, '0');
      hoursEl.textContent = String(h).padStart(2, '0');
      minutesEl.textContent = String(m).padStart(2, '0');
      secondsEl.textContent = String(s).padStart(2, '0');

      totalSeconds--;
    }

    update();
    setInterval(update, 1000);
  }

  /**
   * Reviews & Ratings
   */
  const DEFAULT_REVIEWS = [
    {
      id: 101,
      productId: 1,
      author: "Tanvir Hasan",
      city: "Dhanmondi, Dhaka",
      rating: 5,
      title: "The pop-up card mechanism is buttery smooth!",
      date: "2 days ago",
      variant: "Carbon Black",
      verified: true,
      content: "Card ejector mechanism-টা একদম স্মুথ কাজ করে। একটা ক্লিকেই সব কার্ড সুন্দরভাবে ফ্যান হয়ে বের হয়। কার্বন ফাইবার ফিনিশিংটা হাতে নিলে ভীষণ প্রিমিয়াম ফিল পাওয়া যায়। ১ দিনের মধ্যে ঢাকায় ডেলিভারি পেয়েছি।",
      helpfulCount: 16,
      photos: ["https://thepatchee.com/cdn/shop/files/dc64c41d-ae95-4a7f-912f-1c2a664d35f1.jpg?v=1781362693"]
    },
    {
      id: 102,
      productId: 1,
      author: "Farhana Chowdhury",
      city: "Chittagong",
      rating: 5,
      title: "Perfect gift for husband, luxury packaging",
      date: "5 days ago",
      variant: "Noir Black",
      verified: true,
      content: "আমার হাজবেন্ডের বার্থডে গিফট হিসেবে নিয়েছিলাম। উনি অনেক খুশি হয়েছেন। প্রিমিয়াম ম্যাগনেটিক বক্স প্যাকেজিং এবং মেটাল ফ্রেমের কোয়ালিটি চমৎকার। ফাস্ট ডেলিভারির জন্য ধন্যবাদ Luxos টিমকে।",
      helpfulCount: 9,
      photos: []
    },
    {
      id: 103,
      productId: 1,
      author: "Mahmudur Rahman",
      city: "Sylhet",
      rating: 5,
      title: "RFID protection tested and verified!",
      date: "1 week ago",
      variant: "Mocha Brown",
      verified: true,
      content: "আমি অফিসে POS মেশিনে টেস্ট করে দেখেছি, ওয়ালেটের ভিতরে কার্ড থাকলে কোনো সিগনাল রিড করতে পারে না। ১০০% আরএফআইডি প্রটেকশন নিশ্চিত। ৬টা কার্ড চেম্বারে আর ক্যাশ মানি খুব সহজে রাখা যায়।",
      helpfulCount: 22,
      photos: ["https://thepatchee.com/cdn/shop/files/7_JDF6Lx.jpg?v=1781362700"]
    },
    {
      id: 104,
      productId: 1,
      author: "Nusrat Jahan",
      city: "Mirpur, Dhaka",
      rating: 5,
      title: "10/10 finish and design",
      date: "2 weeks ago",
      variant: "Tan Camel",
      verified: true,
      content: "ছবিতে যেমন দেখেছি সামনাসামনি তার চেয়েও সুন্দর। স্টিচিং আর ফিনিশিং খুবই নিখুঁত। কোয়ালিটি নিয়ে কোনো কমপ্লেইন নেই।",
      helpfulCount: 7,
      photos: []
    },
    {
      id: 105,
      productId: 1,
      author: "Abrar Fahad",
      city: "Uttara, Dhaka",
      rating: 4,
      title: "Super compact and lightweight",
      date: "3 weeks ago",
      variant: "Navy Blue",
      verified: true,
      content: "ওয়ালেটটা খুবই স্লিম। পকেটে ভারী ফিল হয় না। কালারটাও ক্লাসি। রিকমেন্ডেড!",
      helpfulCount: 4,
      photos: []
    }
  ];

  function getProductReviews(productId) {
    const customKey = `luxos_product_reviews_${productId}`;
    const storedCustom = JSON.parse(localStorage.getItem(customKey)) || [];
    const seeds = DEFAULT_REVIEWS.filter(r => r.productId === productId || productId === 1);
    return [...storedCustom, ...seeds];
  }

  function getProductReviewsCount(productId) {
    const revs = getProductReviews(productId);
    return revs.length > 0 ? revs.length : (currentProduct ? currentProduct.reviewsCount || 65 : 65);
  }

  function switchPdpTab(tabName) {
    const descTabBtn = document.getElementById('tabBtnDescription');
    const revTabBtn = document.getElementById('tabBtnReviews');
    const descPanel = document.getElementById('panelDescription');
    const revPanel = document.getElementById('panelReviews');

    if (tabName === 'description') {
      if (descTabBtn) {
        descTabBtn.classList.add('border-black', 'text-black');
        descTabBtn.classList.remove('border-transparent', 'text-gray-400');
      }
      if (revTabBtn) {
        revTabBtn.classList.remove('border-black', 'text-black');
        revTabBtn.classList.add('border-transparent', 'text-gray-400');
      }
      if (descPanel) descPanel.classList.remove('hidden');
      if (revPanel) revPanel.classList.add('hidden');
    } else if (tabName === 'reviews') {
      if (revTabBtn) {
        revTabBtn.classList.add('border-black', 'text-black');
        revTabBtn.classList.remove('border-transparent', 'text-gray-400');
      }
      if (descTabBtn) {
        descTabBtn.classList.remove('border-black', 'text-black');
        descTabBtn.classList.add('border-transparent', 'text-gray-400');
      }
      if (revPanel) revPanel.classList.remove('hidden');
      if (descPanel) descPanel.classList.add('hidden');
    }
  }
  window.switchPdpTab = switchPdpTab;

  const VIDEO_DB_NAME = 'luxos_video_db';
  const VIDEO_STORE_NAME = 'videos';

  function openVideoDB() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        return reject(new Error('IndexedDB not supported'));
      }
      const req = indexedDB.open(VIDEO_DB_NAME, 1);
      req.onupgradeneeded = function (e) {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(VIDEO_STORE_NAME)) {
          db.createObjectStore(VIDEO_STORE_NAME, { keyPath: 'id' });
        }
      };
      req.onsuccess = function (e) {
        resolve(e.target.result);
      };
      req.onerror = function (e) {
        reject(e.target.error);
      };
    });
  }

  async function getVideoFromDB(productId) {
    try {
      const db = await openVideoDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(VIDEO_STORE_NAME, 'readonly');
        const store = tx.objectStore(VIDEO_STORE_NAME);
        const req = store.get('pdp_video_' + productId);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('getVideoFromDB error:', err);
      return null;
    }
  }

  async function renderProductVideo() {
    const container = document.getElementById('pdpVideoContainer');
    if (!container) return;

    let videoUrl = currentProduct ? (currentProduct.videoUrl || '') : '';

    // Check IndexedDB if product has uploaded local file or if url starts with idb:
    if ((videoUrl && videoUrl.startsWith('idb:')) || (!videoUrl && currentProduct && currentProduct.id)) {
      try {
        const stored = await getVideoFromDB(currentProduct.id);
        if (stored && stored.blob) {
          const blobUrl = URL.createObjectURL(stored.blob);
          container.innerHTML = '<video class="w-full h-full object-cover" controls playsinline preload="metadata" src="' + blobUrl + '">Your browser does not support HTML5 video.</video>';
          container.classList.remove('hidden');
          return;
        }
      } catch (e) {
        console.warn('Error reading video from IndexedDB:', e);
      }
    }

    // Default showcase video for product 1 if no custom video set
    if (!videoUrl && currentProduct && currentProduct.id === 1) {
      videoUrl = 'https://www.youtube.com/watch?v=dJKiFbEDcmw';
    }

    if (!videoUrl) {
      container.classList.add('hidden');
      container.innerHTML = '';
      return;
    }

    const ytMatch = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
    if (ytMatch && ytMatch[1]) {
      container.innerHTML = '<iframe class="w-full h-full" src="https://www.youtube.com/embed/' + ytMatch[1] + '?autoplay=0&rel=0" title="Product Showcase Video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
      container.classList.remove('hidden');
    } else if (videoUrl.includes('vimeo.com/')) {
      const vimeoId = videoUrl.split('vimeo.com/')[1].split(/[?#]/)[0];
      container.innerHTML = '<iframe class="w-full h-full" src="https://player.vimeo.com/video/' + vimeoId + '" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>';
      container.classList.remove('hidden');
    } else {
      container.innerHTML = '<video class="w-full h-full object-cover" controls playsinline preload="metadata" src="' + videoUrl + '">Your browser does not support the video tag.</video>';
      container.classList.remove('hidden');
    }
  }

  function initReviewsSection() {
    if (!document.getElementById('reviewsSection') && !document.getElementById('panelReviews')) return;
    renderReviewsScorecard();
    renderReviewsList('all');
    initReviewStarsPicker();
    const tabBadge = document.getElementById('tabReviewsBadge');
    if (tabBadge && currentProduct) {
      tabBadge.textContent = getProductReviewsCount(currentProduct.id);
    }
  }

  function renderReviewsScorecard() {
    if (!currentProduct) return;
    const reviews = getProductReviews(currentProduct.id);
    const total = reviews.length;
    
    let sum = 0;
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      sum += (r.rating || 5);
      counts[r.rating || 5] = (counts[r.rating || 5] || 0) + 1;
    });

    const avg = total > 0 ? (sum / total).toFixed(1) : '4.9';

    const avgEl = document.getElementById('scorecardAvgRating');
    if (avgEl) avgEl.textContent = avg;

    const totalEl = document.getElementById('scorecardTotalReviews');
    if (totalEl) totalEl.textContent = `Based on ${total} verified reviews`;

    const starsEl = document.getElementById('scorecardStars');
    if (starsEl) starsEl.innerHTML = getStarRatingHTML(Math.round(avg));

    const barsContainer = document.getElementById('ratingBarsContainer');
    if (barsContainer) {
      barsContainer.innerHTML = [5, 4, 3, 2, 1].map(stars => {
        const count = counts[stars] || 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return `
          <div class="flex items-center gap-2 text-xs text-gray-600">
            <span class="w-12 text-right shrink-0">${stars} Star</span>
            <div class="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div class="h-full bg-amber-400 rounded-full transition-all duration-500" style="width: ${pct}%"></div>
            </div>
            <span class="w-10 text-gray-400 text-[11px] shrink-0 text-right">${count}</span>
          </div>
        `;
      }).join('');
    }
  }

  function renderReviewsList(filter = 'all') {
    if (!currentProduct) return;
    let reviews = getProductReviews(currentProduct.id);

    if (filter === '5') {
      reviews = reviews.filter(r => r.rating === 5);
    } else if (filter === 'photos') {
      reviews = reviews.filter(r => r.photos && r.photos.length > 0);
    }

    document.querySelectorAll('.review-filter-btn').forEach(btn => {
      btn.classList.remove('bg-black', 'text-white');
      btn.classList.add('bg-gray-100', 'text-gray-700');
    });
    const activeBtn = document.getElementById(`reviewFilterBtn_${filter}`);
    if (activeBtn) {
      activeBtn.classList.add('bg-black', 'text-white');
      activeBtn.classList.remove('bg-gray-100', 'text-gray-700');
    }

    const listContainer = document.getElementById('reviewsListContainer');
    if (!listContainer) return;

    if (reviews.length === 0) {
      listContainer.innerHTML = `
        <div class="text-center py-12 bg-white rounded border border-gray-100">
          <p class="text-sm text-gray-500">No reviews found under this filter.</p>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = reviews.map(rev => `
      <div class="p-6 bg-white border border-gray-100 rounded-sm shadow-sm space-y-3 transition hover:shadow-md">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-neutral-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
              ${rev.author ? rev.author.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div class="flex items-center gap-1.5">
                <span class="font-bold text-xs text-gray-900">${rev.author}</span>
                ${rev.verified ? `
                  <span class="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold">
                    <svg class="w-3 h-3 fill-emerald-600" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
                    Verified Buyer
                  </span>
                ` : ''}
              </div>
              ${rev.city ? `<span class="text-[10px] text-gray-400 block">${rev.city}</span>` : ''}
            </div>
          </div>

          <div class="flex items-center gap-3">
            <div class="text-amber-500 text-sm tracking-tighter">
              ${getStarRatingHTML(rev.rating)}
            </div>
            <span class="text-[11px] text-gray-400 font-mono">${rev.date || 'Recent'}</span>
          </div>
        </div>

        ${rev.variant ? `
          <div class="text-[11px] text-gray-500 font-medium">
            Color: <span class="text-gray-700">${rev.variant}</span>
          </div>
        ` : ''}

        <div>
          ${rev.title ? `<h5 class="text-xs font-bold text-gray-900 mb-1">${rev.title}</h5>` : ''}
          <p class="text-xs text-gray-700 leading-relaxed">${rev.content}</p>
        </div>

        ${rev.photos && rev.photos.length > 0 ? `
          <div class="flex gap-2 pt-1 flex-wrap">
            ${rev.photos.map(p => `
              <a href="${p}" target="_blank" class="w-16 h-16 rounded border border-gray-200 overflow-hidden shrink-0 hover:opacity-90 transition">
                <img src="${p}" alt="Customer Review Photo" class="w-full h-full object-cover" />
              </a>
            `).join('')}
          </div>
        ` : ''}

        <div class="pt-2 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-400">
          <button onclick="upvoteReview(this)" class="hover:text-black flex items-center gap-1 transition cursor-pointer">
            <span>👍 Helpful</span>
            <span>(${rev.helpfulCount || 0})</span>
          </button>
        </div>
      </div>
    `).join('');
  }
  window.renderReviewsList = renderReviewsList;

  function getStarRatingHTML(rating = 5) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
      html += i <= rating ? '★' : '<span class="text-gray-300">★</span>';
    }
    return html;
  }

  function toggleReviewForm() {
    const form = document.getElementById('writeReviewFormContainer');
    if (form) {
      form.classList.toggle('hidden');
      if (!form.classList.contains('hidden')) {
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }
  window.toggleReviewForm = toggleReviewForm;

  function initReviewStarsPicker() {
    const stars = document.querySelectorAll('.review-star-picker-btn');
    stars.forEach(btn => {
      btn.addEventListener('click', () => {
        const val = parseInt(btn.getAttribute('data-value'), 10) || 5;
        selectedStarRating = val;
        updateStarPickerVisuals(val);
      });
    });
    updateStarPickerVisuals(5);
  }

  function updateStarPickerVisuals(val) {
    const stars = document.querySelectorAll('.review-star-picker-btn');
    stars.forEach(btn => {
      const starVal = parseInt(btn.getAttribute('data-value'), 10);
      btn.textContent = starVal <= val ? '★' : '☆';
      btn.classList.toggle('text-amber-500', starVal <= val);
      btn.classList.toggle('text-gray-300', starVal > val);
    });
    const label = document.getElementById('starPickerLabel');
    if (label) {
      const labels = {
        5: 'Excellent — Loved it!',
        4: 'Very Good — High quality',
        3: 'Average — Met expectations',
        2: 'Below Average',
        1: 'Poor'
      };
      label.textContent = labels[val] || '';
    }
  }

  function handleReviewPhotoSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(evt) {
      uploadedPhotoData = evt.target.result;
      const preview = document.getElementById('reviewPhotoPreview');
      if (preview) {
        preview.src = uploadedPhotoData;
        preview.classList.remove('hidden');
      }
    };
    reader.readAsDataURL(file);
  }
  window.handleReviewPhotoSelect = handleReviewPhotoSelect;

  function handleReviewSubmit(e) {
    e.preventDefault();

    const nameInput = document.getElementById('reviewAuthorName');
    const cityInput = document.getElementById('reviewAuthorCity');
    const titleInput = document.getElementById('reviewHeadline');
    const contentInput = document.getElementById('reviewBody');
    const variantSelect = document.getElementById('reviewVariantSelect');

    const author = nameInput ? nameInput.value.trim() : '';
    const content = contentInput ? contentInput.value.trim() : '';

    if (!author || !content) {
      alert('Please provide your name and review message.');
      return;
    }

    const newReview = {
      id: Date.now(),
      productId: currentProduct.id,
      author: author,
      city: cityInput ? cityInput.value.trim() || 'Dhaka, Bangladesh' : 'Bangladesh',
      rating: selectedStarRating,
      title: titleInput ? titleInput.value.trim() : '',
      content: content,
      variant: variantSelect ? variantSelect.value : selectedColor,
      verified: true,
      date: 'Just now',
      helpfulCount: 0,
      photos: uploadedPhotoData ? [uploadedPhotoData] : []
    };

    const customKey = `luxos_product_reviews_${currentProduct.id}`;
    const existing = JSON.parse(localStorage.getItem(customKey)) || [];
    existing.unshift(newReview);
    localStorage.setItem(customKey, JSON.stringify(existing));

    e.target.reset();
    uploadedPhotoData = null;
    const preview = document.getElementById('reviewPhotoPreview');
    if (preview) preview.classList.add('hidden');
    toggleReviewForm();

    renderReviewsScorecard();
    renderReviewsList('all');

    const count = getProductReviewsCount(currentProduct.id);
    const revCountEl = document.getElementById('pdpReviewCount');
    if (revCountEl) revCountEl.textContent = `${count} reviews`;
    const tabBadge = document.getElementById('tabReviewsBadge');
    if (tabBadge) tabBadge.textContent = count;

    showToast('Thank you! Your verified review has been published.');
  }
  window.handleReviewSubmit = handleReviewSubmit;

  function upvoteReview(btn) {
    const textEl = btn.querySelector('span:last-child');
    if (textEl && !btn.dataset.voted) {
      btn.dataset.voted = 'true';
      let count = parseInt(textEl.textContent.replace(/[^\d]/g, ''), 10) || 0;
      count++;
      textEl.textContent = `(${count})`;
      btn.classList.add('text-black', 'font-bold');
    }
  }
  window.upvoteReview = upvoteReview;

  function getRelatedDiscountBadge(p) {
    if (p.badge) return p.badge.toUpperCase();
    const numP = parseInt(String(p.price || '').replace(/[^\d]/g, ''), 10);
    const numO = parseInt(String(p.originalPrice || '').replace(/[^\d]/g, ''), 10);
    if (numP && numO && numO > numP) {
      const pct = Math.round(((numO - numP) / numO) * 100);
      return `SAVE ${pct}%`;
    }
    return 'SAVE 40%';
  }

  function renderRelatedProducts() {
    const container = document.getElementById('relatedProductsTrack') || document.getElementById('relatedProductsGrid');
    if (!container) return;

    const catalog = (typeof getStoreProducts === 'function' ? getStoreProducts() : []) || (typeof LUXOS_PRODUCTS !== 'undefined' ? LUXOS_PRODUCTS : []);
    const related = catalog.filter(p => p.id !== (currentProduct ? currentProduct.id : -1));

    if (related.length === 0) return;

    container.innerHTML = related.map(p => {
      const discountBadge = getRelatedDiscountBadge(p);
      const isOos = typeof p.stock !== 'undefined' && parseInt(p.stock, 10) <= 0;
      return `
        <div class="snap-start shrink-0 w-[calc(50%-8px)] sm:w-[calc(33.333%-16px)] lg:w-[calc(25%-18px)] min-w-[calc(50%-8px)] sm:min-w-[calc(33.333%-16px)] lg:min-w-[calc(25%-18px)] bg-white border border-gray-100 rounded-sm overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all duration-300 group">
          <div class="relative aspect-square overflow-hidden bg-white p-3 flex items-center justify-center">
            <a href="product.html?id=${p.id}" class="block w-full h-full flex items-center justify-center">
              <img src="${p.image}" alt="${p.title}" class="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" loading="lazy" />
            </a>
            ${isOos ? `
              <div class="absolute inset-0 bg-white/55 backdrop-blur-[1px] flex items-center justify-center z-20 pointer-events-none">
                <span class="bg-red-600 text-white font-extrabold text-[10px] sm:text-xs uppercase tracking-wider px-2.5 py-1 rounded shadow">OUT OF STOCK</span>
              </div>
            ` : ''}
            <!-- Badges matching reference screenshot -->
            <span class="absolute top-2 left-2 text-[9px] sm:text-[10px] font-extrabold bg-black text-white px-2 py-0.5 tracking-wider uppercase">${discountBadge}</span>
            <span class="absolute top-2 right-2 text-[9px] sm:text-[10px] font-extrabold bg-black text-white px-2 py-0.5 tracking-wider uppercase">TRENDING</span>
          </div>
          <div class="p-3 sm:p-3.5 space-y-1.5 bg-white border-t border-gray-50 flex-1 flex flex-col justify-between">
            <div>
              <span class="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">${p.category || 'LUXURY BAGS'}</span>
              <h4 class="text-xs sm:text-sm font-semibold text-gray-900 line-clamp-1 mt-0.5">
                <a href="product.html?id=${p.id}" class="hover:text-amber-800 transition">${p.title}</a>
              </h4>
            </div>
            <div class="flex items-baseline gap-2 pt-1 text-xs sm:text-sm">
              <span class="font-bold text-gray-900">${p.price}</span>
              ${p.originalPrice ? `<span class="text-gray-400 line-through text-[11px] sm:text-xs">${p.originalPrice}</span>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  window.scrollRelatedSlider = function (direction) {
    const track = document.getElementById('relatedProductsTrack') || document.getElementById('relatedProductsGrid');
    if (!track) return;

    const card = track.querySelector('.snap-start');
    const cardWidth = card ? card.offsetWidth : 280;
    const gap = window.innerWidth >= 640 ? 24 : 16;
    const cardsToScroll = window.innerWidth >= 1024 ? 4 : (window.innerWidth >= 640 ? 3 : 2);
    const scrollAmount = (cardWidth + gap) * cardsToScroll;

    const maxScroll = track.scrollWidth - track.clientWidth;

    if (direction === 'next') {
      if (track.scrollLeft >= maxScroll - 15) {
        track.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    } else {
      if (track.scrollLeft <= 15) {
        track.scrollTo({ left: maxScroll, behavior: 'smooth' });
      } else {
        track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      }
    }
  };

  function showToast(msg) {
    let toast = document.getElementById('luxosToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'luxosToast';
      toast.className = 'fixed bottom-6 right-6 z-50 bg-black text-white text-xs font-medium px-4 py-3 rounded shadow-2xl flex items-center gap-2 transform translate-y-10 opacity-0 transition-all duration-300 pointer-events-none';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<span>✓</span><span>${msg}</span>`;
    toast.classList.remove('translate-y-10', 'opacity-0');
    setTimeout(() => {
      toast.classList.add('translate-y-10', 'opacity-0');
    }, 3500);
  }

})();

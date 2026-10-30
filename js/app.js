/**
 * Luxos - Luxury Fashion eCommerce Application
 * Frontend Logic, State Management & Interactivity
 */

// Helper: Get active products (from Admin localStorage if modified, otherwise default)
function getStoreProducts() {
  const stored = localStorage.getItem('luxos_products_data');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {
      console.error('Error parsing stored products', e);
    }
  }
  return LUXOS_PRODUCTS;
}

// Application State
const AppState = {
  cart: (function() {
    try {
      const stored = JSON.parse(localStorage.getItem('luxos_cart')) || [];
      return stored.filter(item => item && item.id && item.title && item.title !== 'undefined');
    } catch(e) {
      return [];
    }
  })(),
  wishlist: JSON.parse(localStorage.getItem('luxos_wishlist')) || [],
  activeCollection: 'all',
  currentSlide: 0,
  slideInterval: null,
  deliveryZone: 'inside_dhaka',
  deliveryFee: 70,
  couponCode: null,
  couponDiscount: 0,
  FREE_SHIPPING_THRESHOLD: 3000
};
window.AppState = AppState;
try {
  localStorage.setItem('luxos_cart', JSON.stringify(AppState.cart));
} catch(e) {}

// DOM Utility
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// Helper: parse price string like "৳ 1,450" into integer 1450
function parsePrice(str) {
  if (!str) return 0;
  const num = str.toString().replace(/[^\d]/g, '');
  return parseInt(num, 10) || 0;
}

// Helper: format integer to currency string "৳ 1,450"
function formatPrice(num) {
  return '৳ ' + Math.round(num).toLocaleString('en-US');
}

// Helper: format card price like "2,350.00৳" matching reference style
function formatCardPrice(val) {
  if (!val) return '';
  const num = typeof val === 'number' ? val : (parseFloat(val.toString().replace(/[^\d.]/g, '')) || 0);
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '৳';
}

// Initialize Application on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  // Load custom settings if modified from admin
  loadStoreSettings();
  renderTopBar();
  renderStorefrontTicker();
  initHeroSlideshow();
  renderProducts();
  renderFeaturedCategories();
  initEventListeners();
  updateCartBadge();
  updateWishlistBadge();
  initHotspots();
  renderLookbookSection();
  renderBrandStorySection();
  renderTimelessSection();
  if (typeof updateHeaderProfileIcon === 'function') updateHeaderProfileIcon();
});

function loadStoreSettings() {
  const settings = JSON.parse(localStorage.getItem('luxos_settings'));
  if (settings) {
    if (settings.insideDhakaFee) AppState.deliveryFee = parseInt(settings.insideDhakaFee, 10);
    if (settings.freeShippingThreshold) AppState.FREE_SHIPPING_THRESHOLD = parseInt(settings.freeShippingThreshold, 10);
  }
}

function renderStorefrontTicker() {
  const wrapper = $('#marqueeTickerWrapper');
  const track = $('#marqueeTickerTrack');
  if (!wrapper || !track) return;

  const stored = localStorage.getItem('luxos_ticker_settings');
  if (!stored) return;

  try {
    const settings = JSON.parse(stored);
    if (settings.enabled === false) {
      wrapper.classList.add('hidden');
      return;
    }

    wrapper.classList.remove('hidden');
    if (settings.bgColor) {
      wrapper.style.backgroundColor = settings.bgColor;
      wrapper.style.borderColor = settings.bgColor === '#111111' ? '#262626' : '#e5e5e5';
    }
    if (settings.textColor) {
      track.style.color = settings.textColor;
    }
    if (settings.speed) {
      track.style.animationDuration = `${settings.speed}s`;
    }

    if (Array.isArray(settings.items) && settings.items.length > 0) {
      const itemsHtml = settings.items.map(txt => `<span>${txt}</span><span>•</span>`).join(' ');
      track.innerHTML = itemsHtml + ' ' + itemsHtml;
    }
  } catch (err) {
    console.error('Error loading marquee ticker settings', err);
  }
}

// =========================================================================
// Persistent IndexedDB Storefront Sync (Banners & Collections)
// =========================================================================
function openLuxosDB() {
  return new Promise((resolve) => {
    if (!window.indexedDB) return resolve(null);
    try {
      const req = indexedDB.open('luxos_persistent_store', 1);
      req.onupgradeneeded = function (e) {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('kv_store')) {
          db.createObjectStore('kv_store', { keyPath: 'key' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch (e) {
      resolve(null);
    }
  });
}

async function getItemIndexedDB(key) {
  try {
    const db = await openLuxosDB();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction('kv_store', 'readonly');
      const store = tx.objectStore('kv_store');
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ? req.result.value : null);
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}

window.addEventListener('storage', (e) => {
  if (e.key === 'luxos_ticker_settings') {
    renderStorefrontTicker();
  }
  if (e.key === 'luxos_curated_collections' || e.key === 'luxos_collections_header') {
    renderFeaturedCategories();
  }
  if (e.key === 'luxos_hero_slides') {
    currentHeroSlidesCache = null;
    initHeroSlideshow();
  }
  if (e.key === 'luxos_lookbook_data') {
    renderLookbookSection();
  }
  if (e.key === 'luxos_brandstory_data') {
    renderBrandStorySection();
  }
  if (e.key === 'luxos_timeless_showcase') {
    renderTimelessSection();
  }
  if (e.key === 'luxos_topbar_settings') {
    renderTopBar();
  }
});

/* ==========================================================================
   Hero Slideshow (Dynamic from Admin or Default)
   ========================================================================== */
function getDefaultHeroSlides() {
  return [
    {
      id: 1,
      desktopImage: 'https://thepatchee.com/cdn/shop/files/DESKTOP_SIZE.webp?v=1791810459&width=1800',
      mobileImage: 'https://thepatchee.com/cdn/shop/files/MOBILE_SIZE.webp?v=1791810459&width=800',
      subheading: 'Mid-Season Exclusive',
      heading: 'The Grand Autumn Clearance',
      description: 'Indulge in handcrafted luxury totes, shoulder bags, and commuter essentials up to 70% off.',
      buttonText: 'Shop Clearance',
      buttonLink: 'The Prime Drop',
      showText: true,
      active: true
    },
    {
      id: 2,
      desktopImage: 'https://thepatchee.com/cdn/shop/files/Desktop_size_8.png?v=1790332863&width=1800',
      mobileImage: 'https://thepatchee.com/cdn/shop/files/Mobile_Size_4.png?v=1790332863&width=800',
      subheading: 'Travel & Beauty Series',
      heading: 'Cosmetic Organizers & Cases',
      description: 'Spacious, waterproof, and compartmentalized elegance for your everyday beauty routine.',
      buttonText: 'Explore Collection',
      buttonLink: 'Duffle Bags',
      showText: true,
      active: true
    },
    {
      id: 3,
      desktopImage: 'https://thepatchee.com/cdn/shop/files/BD_2.webp?v=1784095185&width=1800',
      mobileImage: 'https://thepatchee.com/cdn/shop/files/BD_2.webp?v=1784095185&width=800',
      subheading: 'New Silhouette',
      heading: 'The Prime Drop 2026',
      description: 'Architectural contours meet supple craftsmanship. Made for the modern professional.',
      buttonText: 'Discover Prime Drop',
      buttonLink: 'all',
      showText: true,
      active: true
    }
  ];
}

let currentHeroSlidesCache = null;

function getHeroSlides() {
  if (currentHeroSlidesCache && currentHeroSlidesCache.length > 0) {
    return currentHeroSlidesCache;
  }
  const custom = localStorage.getItem('luxos_hero_slides');
  if (custom) {
    try {
      const parsed = JSON.parse(custom);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter(s => s.active !== false);
      }
    } catch (e) {
      console.error('Error parsing stored hero slides', e);
    }
  }
  return getDefaultHeroSlides();
}

function renderHeroSlideshow() {
  const container = $('#heroSlidesContainer');
  if (!container) return;

  const slides = getHeroSlides();
  if (slides.length === 0) return;

  container.innerHTML = slides.map((slide, idx) => `
    <div class="hero-slide ${idx === 0 ? 'active' : ''}">
      <picture class="w-full h-full block">
        ${slide.mobileImage ? `<source media="(max-width: 699px)" srcset="${slide.mobileImage}" />` : ''}
        <img src="${slide.desktopImage}" alt="${slide.heading || 'Luxos Hero Banner'}" class="w-full h-full object-cover object-center" />
      </picture>
      ${slide.showText ? `
        <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 flex items-end sm:items-center p-6 sm:p-12 lg:p-20">
          <div class="hero-text-content max-w-xl text-white space-y-3">
            ${slide.subheading ? `<span class="text-xs uppercase tracking-[0.25em] text-amber-300 font-semibold drop-shadow">${slide.subheading}</span>` : ''}
            ${slide.heading ? `<h2 class="font-serif text-3xl sm:text-5xl font-bold leading-tight drop-shadow-md">${slide.heading}</h2>` : ''}
            ${slide.description ? `<p class="text-xs sm:text-sm text-neutral-200 line-clamp-2 drop-shadow">${slide.description}</p>` : ''}
            ${slide.buttonText ? `
              <div class="pt-2">
                <button onclick="filterByTab('${slide.buttonLink || 'all'}')" class="bg-white text-black text-xs uppercase tracking-luxury font-bold px-6 py-3 rounded-sm hover:bg-neutral-200 transition shadow-lg">
                  ${slide.buttonText}
                </button>
              </div>
            ` : ''}
          </div>
        </div>
      ` : `
        <a href="#collectionSection" onclick="filterByTab('${slide.buttonLink || 'all'}')" class="absolute inset-0 z-10" aria-label="${slide.heading || 'Banner'}"></a>
      `}
    </div>
  `).join('');
}

function initHeroSlideshow() {
  if (AppState.slideInterval) {
    clearInterval(AppState.slideInterval);
  }
  renderHeroSlideshow();

  // Async sync from IndexedDB in case high-res custom banner was saved
  if (!initHeroSlideshow.synced) {
    initHeroSlideshow.synced = true;
    getItemIndexedDB('luxos_hero_slides').then((idbSlides) => {
      if (Array.isArray(idbSlides) && idbSlides.length > 0) {
        const active = idbSlides.filter(s => s.active !== false);
        if (active.length > 0) {
          currentHeroSlidesCache = active;
          initHeroSlideshow();
        }
      }
    }).catch(() => {});
  }

  const slides = $$('.hero-slide');
  if (!slides.length) return;

  const bannerSettings = JSON.parse(localStorage.getItem('luxos_banner_settings')) || {
    autoplayDuration: 5,
    enableZoom: true
  };

  // Toggle zoom animation if configured in admin
  if (bannerSettings.enableZoom === false) {
    document.body.classList.add('disable-hero-zoom');
  } else {
    document.body.classList.remove('disable-hero-zoom');
  }

  function showSlide(index) {
    slides.forEach((s, i) => {
      const wasActive = s.classList.contains('active');
      const isNowActive = (i === index);
      s.classList.toggle('active', isNowActive);
      
      // Cleanly restart zoom animation on activation
      if (isNowActive && !wasActive) {
        const img = s.querySelector('img');
        if (img) {
          img.style.animation = 'none';
          void img.offsetHeight; // trigger reflow
          img.style.animation = '';
        }
      }
    });
    AppState.currentSlide = index;
  }

  window.nextSlide = function () {
    const next = (AppState.currentSlide + 1) % slides.length;
    showSlide(next);
  };

  window.prevSlide = function () {
    const prev = (AppState.currentSlide - 1 + slides.length) % slides.length;
    showSlide(prev);
  };

  window.goToSlide = function (index) {
    showSlide(index);
    resetSlideTimer();
  };

  function startSlideTimer() {
    const intervalSec = (bannerSettings.autoplayDuration || 5) * 1000;
    AppState.slideInterval = setInterval(window.nextSlide, intervalSec);
  }

  function resetSlideTimer() {
    clearInterval(AppState.slideInterval);
    startSlideTimer();
  }

  startSlideTimer();
}

/* ==========================================================================
   Render Products Grid
   ========================================================================== */
function renderProducts(collection = AppState.activeCollection) {
  const grid = $('#productsGrid');
  if (!grid) return;

  const currentProducts = getStoreProducts();
  let filtered = currentProducts;

  if (collection !== 'all') {
    if (collection === 'Just Landed') {
      filtered = currentProducts.filter(p => p.collection === 'Just Landed');
    } else if (collection === 'Best Sellers') {
      filtered = currentProducts.filter(p => p.collection === 'Best Sellers');
    } else if (collection === 'The Prime Drop') {
      filtered = currentProducts.filter(p => p.collection === 'The Prime Drop');
    } else if (collection === 'Prime Shoes') {
      filtered = currentProducts.filter(p => p.category === 'Footwear');
    } else if (collection === 'Wallets & Cards') {
      filtered = currentProducts.filter(p => p.category === 'Wallets & Cards');
    } else {
      filtered = currentProducts.filter(p => p.category.toLowerCase().includes(collection.toLowerCase()));
    }
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-16 text-center text-gray-500">
        <p class="text-lg">No products found in this category.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(p => createProductCardHtml(p)).join('');
}

function createProductCardHtml(p) {
  const isWishlisted = AppState.wishlist.includes(p.id);
  const isOutOfStock = typeof p.stock !== 'undefined' && parseInt(p.stock, 10) <= 0;

  return `
    <div class="product-card group flex flex-col justify-between" data-id="${p.id}">
      <div>
        <!-- Image Container -->
        <div class="product-image-container rounded-sm overflow-hidden mb-3 relative bg-[#f7f7f7]">
          ${isOutOfStock ? `
            <div class="absolute inset-0 bg-white/55 backdrop-blur-[1px] z-20 flex items-center justify-center pointer-events-none">
              <span class="bg-red-600 text-white font-extrabold text-[11px] sm:text-xs uppercase tracking-widest px-3.5 py-1 rounded shadow-lg border border-white/60">
                OUT OF STOCK
              </span>
            </div>
          ` : ''}

          ${p.badge ? `
            <div class="absolute top-2 left-2 z-10">
              <span class="${p.badge.toLowerCase().includes('save') ? 'badge-discount' : 'badge-tag'} uppercase tracking-wider text-[10px] font-semibold px-2 py-0.5 shadow-sm">
                ${p.badge}
              </span>
            </div>
          ` : ''}

          <!-- Wishlist Heart Button -->
          <button 
            onclick="toggleWishlist(${p.id}, event)"
            aria-label="Wishlist"
            class="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow flex items-center justify-center text-gray-700 hover:text-red-500 hover:scale-110 transition-transform">
            <svg class="w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : 'fill-none'}" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </button>

          <!-- Product Images with Hover Flip -->
          <a href="product.html?id=${p.id}" class="block w-full h-full">
            <img 
              src="${p.image}" 
              alt="${p.title}" 
              loading="lazy"
              class="product-primary-img w-full h-full object-cover object-center" />
            <img 
              src="${p.hoverImage || p.image}" 
              alt="${p.title}" 
              loading="lazy"
              class="product-hover-img w-full h-full object-cover object-center" />
          </a>

          <!-- Quick Action Bar On Hover (Desktop) -->
          <div class="quick-action-buttons absolute bottom-2 inset-x-2 z-10 flex gap-2">
            ${isOutOfStock ? `
              <button 
                disabled
                class="flex-1 bg-gray-400 text-white text-xs uppercase tracking-wider font-semibold py-2.5 px-3 rounded-sm cursor-not-allowed opacity-80 flex items-center justify-center gap-1.5 shadow-xs">
                <span>Out of Stock</span>
              </button>
            ` : `
              <button 
                onclick="quickAddToCart(${p.id}, event)"
                class="flex-1 bg-black text-white text-xs uppercase tracking-wider font-semibold py-2.5 px-3 rounded-sm hover:bg-neutral-800 transition flex items-center justify-center gap-1.5 shadow-md">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span>Add to Cart</span>
              </button>
            `}
            <button 
              onclick="window.location.href='product.html?id=${p.id}'"
              title="View Product Landing Page"
              class="bg-white text-black p-2.5 rounded-sm hover:bg-gray-100 transition shadow-md flex items-center justify-center">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Product Meta (Matching Reference: Category -> Blue Title -> Strike Original + Bold Sale) -->
        <div class="space-y-0.5 pt-1">
          <!-- Category -->
          <div class="text-[11px] uppercase tracking-wider text-neutral-400 font-medium">
            ${p.category || ''}
          </div>

          <!-- Title -->
          <h3 class="text-[13.5px] font-normal leading-snug line-clamp-1">
            <a href="product.html?id=${p.id}" class="text-[#1a56db] hover:underline">
              ${p.title}
            </a>
          </h3>

          <!-- Price & Mobile Quick Add -->
          <div class="flex items-center justify-between pt-0.5">
            <div class="flex items-baseline gap-2 text-[13.5px]">
              ${p.originalPrice ? `<span class="line-through text-neutral-400 font-normal">${formatCardPrice(p.originalPrice)}</span>` : ''}
              <span class="font-bold text-neutral-900">${formatCardPrice(p.price)}</span>
            </div>
            
            <!-- Mobile Quick Add -->
            <button 
              onclick="quickAddToCart(${p.id}, event)"
              class="md:hidden text-xs bg-black text-white px-2.5 py-1 rounded-sm font-medium">
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ==========================================================================
   Featured Category Bubbles (Dynamic from Admin or Default)
   ========================================================================== */
function getDefaultCategories() {
  return [
    { id: 1, title: 'Tote Bags', image: 'https://thepatchee.com/cdn/shop/files/d0783770-4668-4b3e-a3b5-2bbc89c2869f.jpg?v=1776151580&width=400', filter: 'Tote Bags', active: true },
    { id: 2, title: 'Shoulder Bags', image: 'https://thepatchee.com/cdn/shop/files/Main_Menu_2_22945876-366c-4cc9-9b68-83a3c7eceabf.jpg?v=1736164087&width=400', filter: 'Shoulder Bags', active: true },
    { id: 3, title: 'Crossbody', image: 'https://thepatchee.com/cdn/shop/files/c2ee0999-fc06-4942-aa71-6cd41e71d473.png?v=1782728863&width=400', filter: 'Crossbody Bags', active: true },
    { id: 4, title: 'Wallets & RFID', image: 'https://thepatchee.com/cdn/shop/files/654a7e83-c512-4ec1-8ebf-af44c488e776.png?v=1781362688&width=400', filter: 'Wallets & Cards', active: true },
    { id: 5, title: 'Backpacks', image: 'https://thepatchee.com/cdn/shop/files/6d8a6d9b-495a-4d68-ba90-1f87aa300435.jpg?v=1755610521&width=400', filter: 'Backpack', active: true },
    { id: 6, title: 'Duffle Bags', image: 'https://thepatchee.com/cdn/shop/files/625df22d-ff10-4b67-a4fc-3c43388fcd51.png?v=1776663753&width=400', filter: 'Duffle Bags', active: true },
    { id: 7, title: 'Prime Shoes', image: 'https://thepatchee.com/cdn/shop/files/BD.jpg?v=1749128949&width=400', filter: 'Prime Shoes', active: true },
    { id: 8, title: 'Clearance Sale', image: 'https://thepatchee.com/cdn/shop/files/DESKTOP_SIZE.webp?v=1791810459&width=400', filter: 'The Prime Drop', active: true }
  ];
}

function getStoreCollections() {
  const stored = localStorage.getItem('luxos_curated_collections');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {
      console.error('Error parsing stored collections', e);
    }
  }
  return getDefaultCategories();
}

function renderFeaturedCategories() {
  const container = $('#featuredCategories');
  const section = $('#shopByCollectionSection');
  if (!container) return;

  const headerSettings = JSON.parse(localStorage.getItem('luxos_collections_header') || '{}');
  if (headerSettings.enabled === false) {
    if (section) section.classList.add('hidden');
    return;
  }
  if (section) section.classList.remove('hidden');

  if (headerSettings.eyebrow && $('#curatedEyebrowText')) {
    $('#curatedEyebrowText').textContent = headerSettings.eyebrow;
  }
  if (headerSettings.heading && $('#curatedHeadingText')) {
    $('#curatedHeadingText').textContent = headerSettings.heading;
  }

  const collections = getStoreCollections().filter(c => c.active !== false);

  if (collections.length === 0) {
    if (section) section.classList.add('hidden');
    return;
  }

  container.innerHTML = collections.map(c => `
    <div onclick="filterByTab('${c.filter}')" class="category-bubble cursor-pointer flex flex-col items-center flex-shrink-0 group">
      <div class="bubble-img w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-transparent group-hover:border-black p-1 transition-all bg-neutral-100 shadow-sm">
        <img src="${c.image}" alt="${c.title}" class="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform" />
      </div>
      <span class="mt-2 text-xs font-medium text-gray-800 tracking-wide text-center uppercase group-hover:text-black">${c.title}</span>
    </div>
  `).join('');
}

/* ==========================================================================
   Filter by Collection Tab
   ========================================================================== */
window.filterByTab = function (tabName) {
  AppState.activeCollection = tabName;
  $$('.tab-btn').forEach(btn => {
    const isCurrent = btn.dataset.tab === tabName;
    btn.classList.toggle('bg-black', isCurrent);
    btn.classList.toggle('text-white', isCurrent);
    btn.classList.toggle('bg-gray-100', !isCurrent);
    btn.classList.toggle('text-gray-700', !isCurrent);
  });

  renderProducts(tabName);

  // Smooth scroll to product grid if triggered from category bubble
  const gridSection = $('#collectionSection');
  if (gridSection) {
    gridSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

/* ==========================================================================
   Cart System
   ========================================================================== */
window.quickAddToCart = function (productId, event) {
  if (event) event.stopPropagation();
  const currentProducts = getStoreProducts();
  const product = currentProducts.find(p => p.id === productId);
  if (!product) return;

  if (typeof product.stock !== 'undefined' && parseInt(product.stock, 10) <= 0) {
    showToast('Sorry, this product is currently out of stock!');
    return;
  }

  const defaultColor = product.colors && product.colors.length > 0 ? product.colors[0].name : 'Default';
  addToCart(product, defaultColor, 1);
};

window.quickOrderNow = function (productId, event) {
  if (event) {
    if (event.stopPropagation) event.stopPropagation();
    if (event.preventDefault) event.preventDefault();
  }

  const currentProducts = typeof getStoreProducts === 'function' ? getStoreProducts() : (typeof LUXOS_PRODUCTS !== 'undefined' ? LUXOS_PRODUCTS : []);
  const product = currentProducts.find(p => p.id === productId) || currentProducts.find(p => p.id == productId);
  if (!product) return;

  if (typeof product.stock !== 'undefined' && parseInt(product.stock, 10) <= 0) {
    if (typeof showToast === 'function') {
      showToast('Sorry, this product is currently out of stock!');
    } else {
      alert('Sorry, this product is currently out of stock!');
    }
    return;
  }

  const defaultColor = product.colors && product.colors.length > 0 ? product.colors[0].name : 'Standard';
  // Add product to cart without popping open cart drawer
  if (typeof addToCart === 'function') {
    addToCart(product, defaultColor, 1, true);
  }

  // Hide the lookbook card popup if open
  const card1 = $('#hotspotCard1');
  if (card1) card1.classList.add('hidden');

  // Directly open Checkout Modal for 1-click Cash on Delivery order
  if (typeof window.openCheckoutModal === 'function') {
    window.openCheckoutModal();
  } else {
    const modal = document.getElementById('checkoutModal');
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }
};

function addToCart(product, colorName, quantity = 1, skipOpenDrawer = false) {
  // If product is passed as an ID (number or numeric string), resolve the product object
  if (typeof product === 'number' || (typeof product === 'string' && /^\d+$/.test(product))) {
    const pId = parseInt(product, 10);
    const storeProds = typeof getStoreProducts === 'function' ? getStoreProducts() : [];
    const found = storeProds.find(p => p.id === pId) || (typeof LUXOS_PRODUCTS !== 'undefined' ? LUXOS_PRODUCTS.find(p => p.id === pId) : null);
    if (found) {
      product = found;
    }
  }

  if (!product || !product.id) return;

  if (typeof product.stock !== 'undefined' && parseInt(product.stock, 10) <= 0) {
    showToast('Sorry, this product is currently out of stock!');
    return;
  }

  // Purge any corrupted items from cart
  AppState.cart = (AppState.cart || []).filter(item => item && item.id && item.title && item.title !== 'undefined');

  const pPriceNum = typeof product.priceNum === 'number' && !isNaN(product.priceNum) && product.priceNum > 0 
    ? product.priceNum 
    : parsePrice(product.price);
  const color = colorName || (product.colors && product.colors[0]?.name) || 'Standard';

  const existingIndex = AppState.cart.findIndex(item => item.id === product.id && item.color === color);

  if (existingIndex > -1) {
    AppState.cart[existingIndex].quantity += quantity;
    AppState.cart[existingIndex].priceNum = pPriceNum;
    AppState.cart[existingIndex].price = product.price;
    AppState.cart[existingIndex].title = product.title;
    AppState.cart[existingIndex].image = product.image;
  } else {
    AppState.cart.push({
      id: product.id,
      title: product.title,
      price: product.price,
      priceNum: pPriceNum,
      originalPrice: product.originalPrice,
      image: product.image,
      category: product.category,
      color: color,
      quantity: quantity
    });
  }

  saveCart();
  updateCartBadge();
  renderCartDrawer();
  updateCheckoutSummary();

  if (!skipOpenDrawer) {
    openCartDrawer();
    showToast(`Added "${product.title}" to your cart.`);
  }
}
window.addToCart = addToCart;

window.updateCartQty = function (index, delta) {
  if (!AppState.cart[index]) return;
  AppState.cart[index].quantity += delta;
  if (AppState.cart[index].quantity <= 0) {
    AppState.cart.splice(index, 1);
  }
  saveCart();
  updateCartBadge();
  renderCartDrawer();
};

window.removeCartItem = function (index) {
  AppState.cart.splice(index, 1);
  saveCart();
  updateCartBadge();
  renderCartDrawer();
  showToast('Item removed from cart');
};

function saveCart() {
  localStorage.setItem('luxos_cart', JSON.stringify(AppState.cart));
}

function updateCartBadge() {
  const totalCount = AppState.cart.reduce((sum, item) => sum + item.quantity, 0);
  $$('.cart-count-badge').forEach(el => {
    el.textContent = totalCount;
    el.classList.toggle('hidden', totalCount === 0);
  });
}

function renderCartDrawer() {
  const container = $('#cartItemsList');
  const subtotalEl = $('#cartSubtotal');
  const progressEl = $('#freeShippingProgress');
  const progressText = $('#freeShippingText');
  if (!container) return;

  if (AppState.cart.length === 0) {
    container.innerHTML = `
      <div class="py-16 text-center text-gray-400 flex flex-col items-center">
        <svg class="w-16 h-16 text-gray-300 mb-3" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
        <p class="text-base font-medium text-gray-800">Your shopping bag is empty</p>
        <p class="text-xs text-gray-500 mt-1">Discover handcrafted luxury bags designed for you.</p>
        <button onclick="closeCartDrawer(); filterByTab('all');" class="mt-5 bg-black text-white text-xs uppercase tracking-wider font-semibold px-6 py-2.5 rounded-sm hover:bg-neutral-800 transition">
          Start Shopping
        </button>
      </div>
    `;
    if (subtotalEl) subtotalEl.textContent = '৳ 0';
    if (progressEl) progressEl.style.width = '0%';
    if (progressText) progressText.innerHTML = `Add <b>${formatPrice(AppState.FREE_SHIPPING_THRESHOLD)}</b> more for <b>FREE Delivery</b>!`;
    return;
  }

  const subtotal = AppState.cart.reduce((sum, item) => sum + item.priceNum * item.quantity, 0);
  if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);

  // Free shipping calculation
  const remaining = AppState.FREE_SHIPPING_THRESHOLD - subtotal;
  const percentage = Math.min(100, Math.round((subtotal / AppState.FREE_SHIPPING_THRESHOLD) * 100));

  if (progressEl) progressEl.style.width = `${percentage}%`;
  if (progressText) {
    if (remaining <= 0) {
      progressText.innerHTML = `🎉 Congratulations! You unlocked <b>FREE Delivery</b>!`;
    } else {
      progressText.innerHTML = `Add <b>${formatPrice(remaining)}</b> more for <b>FREE Delivery</b>!`;
    }
  }

  container.innerHTML = AppState.cart.map((item, index) => `
    <div class="flex gap-3 py-3 border-b border-gray-100">
      <img src="${item.image}" alt="${item.title}" class="w-18 h-18 w-20 h-20 object-cover rounded-sm bg-gray-50 flex-shrink-0" />
      <div class="flex-1 flex flex-col justify-between">
        <div>
          <div class="flex justify-between items-start">
            <h4 class="text-sm font-medium text-gray-900 leading-tight line-clamp-1">${item.title}</h4>
            <button onclick="removeCartItem(${index})" class="text-gray-400 hover:text-red-500 p-0.5">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p class="text-xs text-gray-500 mt-0.5">Color: <span class="text-gray-800">${item.color}</span></p>
          <p class="text-xs font-semibold text-gray-900 mt-1">${item.price}</p>
        </div>

        <div class="flex items-center justify-between mt-2">
          <div class="flex items-center border border-gray-300 rounded-sm">
            <button onclick="updateCartQty(${index}, -1)" class="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-gray-100 text-sm">-</button>
            <span class="w-8 text-center text-xs font-semibold">${item.quantity}</span>
            <button onclick="updateCartQty(${index}, 1)" class="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-gray-100 text-sm">+</button>
          </div>
          <span class="text-xs font-bold text-gray-900">${formatPrice(item.priceNum * item.quantity)}</span>
        </div>
      </div>
    </div>
  `).join('');
}

window.openCartDrawer = function () {
  renderCartDrawer();
  $('#cartBackdrop').classList.add('active');
  $('#cartDrawer').classList.add('active');
  document.body.style.overflow = 'hidden';
};

window.closeCartDrawer = function () {
  $('#cartBackdrop').classList.remove('active');
  $('#cartDrawer').classList.remove('active');
  document.body.style.overflow = '';
};

/* ==========================================================================
   Wishlist System
   ========================================================================== */
window.toggleWishlist = function (productId, event) {
  if (event) event.stopPropagation();
  const index = AppState.wishlist.indexOf(productId);
  const currentProducts = getStoreProducts();
  const product = currentProducts.find(p => p.id === productId);

  if (index > -1) {
    AppState.wishlist.splice(index, 1);
    showToast(`Removed from Wishlist.`);
  } else {
    AppState.wishlist.push(productId);
    showToast(`Saved to Wishlist.`);
  }

  localStorage.setItem('luxos_wishlist', JSON.stringify(AppState.wishlist));
  updateWishlistBadge();
  renderProducts(); // Refresh heart icon state
  renderWishlistModal();
};

function updateWishlistBadge() {
  const count = AppState.wishlist.length;
  $$('.wishlist-count-badge').forEach(el => {
    el.textContent = count;
    el.classList.toggle('hidden', count === 0);
  });
}

window.openWishlistModal = function () {
  renderWishlistModal();
  $('#wishlistModal').classList.add('active');
  document.body.style.overflow = 'hidden';
};

window.closeWishlistModal = function () {
  $('#wishlistModal').classList.remove('active');
  document.body.style.overflow = '';
};

window.openStoryModal = function () {
  const modal = $('#storyModal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
};

window.closeStoryModal = function () {
  const modal = $('#storyModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
};

function renderWishlistModal() {
  const container = $('#wishlistItems');
  if (!container) return;

  const currentProducts = getStoreProducts();
  const items = currentProducts.filter(p => AppState.wishlist.includes(p.id));

  if (items.length === 0) {
    container.innerHTML = `
      <div class="py-12 text-center text-gray-400">
        <svg class="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
        <p class="text-sm font-medium text-gray-700">No items in your wishlist yet</p>
        <p class="text-xs text-gray-500 mt-1">Tap the heart icon on any bag to save it for later.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(p => `
    <div class="flex items-center gap-3 py-3 border-b border-gray-100">
      <img src="${p.image}" alt="${p.title}" class="w-16 h-16 object-cover rounded-sm bg-gray-50 flex-shrink-0" />
      <div class="flex-1">
        <h4 class="text-sm font-medium text-gray-900 line-clamp-1">${p.title}</h4>
        <p class="text-xs font-semibold text-gray-800">${p.price}</p>
      </div>
      <div class="flex items-center gap-2">
        <button onclick="quickAddToCart(${p.id}); toggleWishlist(${p.id});" class="text-xs bg-black text-white px-3 py-1.5 rounded-sm font-medium hover:bg-neutral-800">
          Add to Bag
        </button>
        <button onclick="toggleWishlist(${p.id})" class="text-gray-400 hover:text-red-500 p-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  `).join('');
}

/* ==========================================================================
   Product Navigation / Landing Page
   ========================================================================== */
window.openQuickView = function (productId) {
  window.location.href = `product.html?id=${productId}`;
};

window.closeQuickView = function () {
  const modal = $('#quickViewModal');
  if (modal) modal.classList.remove('active');
  document.body.style.overflow = '';
};

window.selectModalColor = function (colorName, element) {
  $('#quickViewSelectedColor').textContent = colorName;
  $$('#quickViewContent .color-swatch').forEach(s => s.classList.remove('active'));
  element.classList.add('active');
};

window.incrementModalQty = function () {
  const input = $('#modalQuantity');
  input.value = Math.min(10, parseInt(input.value || 1, 10) + 1);
};

window.decrementModalQty = function () {
  const input = $('#modalQuantity');
  input.value = Math.max(1, parseInt(input.value || 1, 10) - 1);
};

window.addModalToCart = function (productId) {
  const currentProducts = getStoreProducts();
  const product = currentProducts.find(p => p.id === productId);
  if (!product) return;

  const color = $('#quickViewSelectedColor') ? $('#quickViewSelectedColor').textContent : 'Default';
  const qty = parseInt($('#modalQuantity').value || 1, 10);

  addToCart(product, color, qty);
  closeQuickView();
};

window.closeQuickView = function () {
  $('#quickViewModal').classList.remove('active');
  document.body.style.overflow = '';
};

/* ==========================================================================
   Live Search System
   ========================================================================== */
window.openSearchModal = function () {
  $('#searchModal').classList.add('active');
  document.body.style.overflow = 'hidden';
  setTimeout(() => $('#searchInput').focus(), 150);
  performSearch('');
};

window.closeSearchModal = function () {
  $('#searchModal').classList.remove('active');
  document.body.style.overflow = '';
};

window.performSearch = function (query) {
  const container = $('#searchResults');
  if (!container) return;

  const currentProducts = getStoreProducts();
  const clean = query.trim().toLowerCase();
  let results = currentProducts;

  if (clean.length > 0) {
    results = currentProducts.filter(p => 
      p.title.toLowerCase().includes(clean) || 
      p.category.toLowerCase().includes(clean) ||
      (p.description && p.description.toLowerCase().includes(clean))
    );
  }

  if (results.length === 0) {
    container.innerHTML = `
      <div class="py-12 text-center text-gray-500">
        <p class="text-sm">No bags or accessories found matching "<b>${query}</b>"</p>
        <p class="text-xs text-gray-400 mt-1">Try searching for "Tote", "Shoulder", "Wallet", "Backpack", or "Sneakers".</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="text-xs uppercase tracking-wider text-gray-400 mb-3 font-semibold">
      ${clean.length > 0 ? `Results (${results.length})` : 'Popular Recommendations'}
    </div>
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      ${results.slice(0, 8).map(p => {
        const isOos = typeof p.stock !== 'undefined' && parseInt(p.stock, 10) <= 0;
        return `
        <div onclick="closeSearchModal(); window.location.href='product.html?id=${p.id}';" class="group cursor-pointer">
          <div class="aspect-square bg-gray-100 rounded-sm overflow-hidden mb-2 relative">
            <img src="${p.image}" alt="${p.title}" class="w-full h-full object-cover group-hover:scale-105 transition" />
            ${isOos ? `
              <div class="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-20 pointer-events-none">
                <span class="bg-red-600 text-white font-extrabold text-[9px] uppercase px-1.5 py-0.5 rounded shadow">OUT OF STOCK</span>
              </div>
            ` : ''}
          </div>
          <p class="text-xs font-medium text-gray-900 line-clamp-1 group-hover:text-amber-800">${p.title}</p>
          <p class="text-xs font-bold text-gray-800 mt-0.5">${p.price}</p>
        </div>
      `;}).join('')}
    </div>
  `;
};

/* ==========================================================================
   Checkout System (Optimized for Bangladesh E-commerce)
   ========================================================================== */
window.openCheckoutModal = function () {
  // Sync AppState.cart from localStorage
  try {
    const stored = JSON.parse(localStorage.getItem('luxos_cart')) || [];
    if (stored.length > 0) {
      AppState.cart = stored.filter(item => item && item.id && item.title && item.title !== 'undefined');
    }
  } catch (e) {}

  // Purge any corrupted / undefined items from cart
  AppState.cart = (AppState.cart || []).filter(item => item && item.id && item.title && item.title !== 'undefined');
  saveCart();

  if (AppState.cart.length === 0) {
    showToast('Your cart is empty.');
    return;
  }
  closeCartDrawer();
  updateCheckoutSummary();

  // Auto pre-fill saved customer details
  const profile = JSON.parse(localStorage.getItem('luxos_user_profile'));
  if (profile) {
    if ($('#custName') && !$('#custName').value) $('#custName').value = profile.name || '';
    if ($('#custPhone') && !$('#custPhone').value) $('#custPhone').value = profile.phone || '';
    if ($('#custAddress') && !$('#custAddress').value) $('#custAddress').value = profile.address || '';
    if (profile.zone) {
      const radio = $(`input[name="deliveryZone"][value="${profile.zone}"]`);
      if (radio) {
        radio.checked = true;
        setDeliveryZone(profile.zone);
      }
    }
  }

  $('#checkoutModal').classList.add('active');
  document.body.style.overflow = 'hidden';
};

window.closeCheckoutModal = function () {
  $('#checkoutModal').classList.remove('active');
  document.body.style.overflow = '';
};

window.setDeliveryZone = function (zone) {
  AppState.deliveryZone = zone;
  const settings = JSON.parse(localStorage.getItem('luxos_settings')) || {};
  const insideFee = settings.insideDhakaFee ? parseInt(settings.insideDhakaFee, 10) : 70;
  const outsideFee = settings.outsideDhakaFee ? parseInt(settings.outsideDhakaFee, 10) : 130;
  AppState.deliveryFee = zone === 'inside_dhaka' ? insideFee : outsideFee;
  updateCheckoutSummary();
};

window.applyCoupon = function () {
  const codeInput = $('#couponInput');
  const code = codeInput.value.trim().toUpperCase();

  // Check stored coupons from admin or defaults
  const customCoupons = JSON.parse(localStorage.getItem('luxos_coupons')) || [
    { code: 'LUXOS10', discount: 0.10, type: 'percent', active: true },
    { code: 'FREESHIP', discount: 1, type: 'freeship', active: true }
  ];

  const matched = customCoupons.find(c => c.code.toUpperCase() === code && c.active);

  if (matched) {
    AppState.couponCode = matched.code;
    AppState.couponDiscount = matched.type === 'freeship' ? 'FREE_SHIPPING' : matched.discount;
    showToast(`Coupon "${matched.code}" applied!`);
  } else {
    showToast('Invalid or expired coupon code. Try "LUXOS10"');
    return;
  }
  updateCheckoutSummary();
};

function updateCheckoutSummary() {
  // Ensure every item has a valid numeric price
  AppState.cart.forEach(item => {
    if (!item.priceNum || isNaN(item.priceNum) || item.priceNum <= 0) {
      item.priceNum = parsePrice(item.price);
    }
  });

  const subtotal = AppState.cart.reduce((sum, item) => {
    const price = (item.priceNum && !isNaN(item.priceNum) && item.priceNum > 0) ? item.priceNum : parsePrice(item.price);
    return sum + (price * (item.quantity || 1));
  }, 0);
  
  let shipping = AppState.deliveryFee;
  if (subtotal >= AppState.FREE_SHIPPING_THRESHOLD || AppState.couponDiscount === 'FREE_SHIPPING') {
    shipping = 0;
  }

  let discount = 0;
  if (AppState.couponDiscount && typeof AppState.couponDiscount === 'number') {
    discount = Math.round(subtotal * AppState.couponDiscount);
  }

  const grandTotal = Math.max(0, subtotal - discount + shipping);

  if ($('#checkoutSubtotal')) $('#checkoutSubtotal').textContent = formatPrice(subtotal);
  if ($('#checkoutShipping')) $('#checkoutShipping').textContent = shipping === 0 ? 'FREE' : formatPrice(shipping);
  if ($('#checkoutDiscountRow')) {
    $('#checkoutDiscountRow').classList.toggle('hidden', discount === 0);
    if ($('#checkoutDiscount')) $('#checkoutDiscount').textContent = `- ${formatPrice(discount)}`;
  }
  if ($('#checkoutGrandTotal')) $('#checkoutGrandTotal').textContent = formatPrice(grandTotal);

  // Render items preview in checkout modal
  const preview = $('#checkoutItemsPreview');
  if (preview) {
    preview.innerHTML = AppState.cart.map(item => {
      const price = (item.priceNum && !isNaN(item.priceNum) && item.priceNum > 0) ? item.priceNum : parsePrice(item.price);
      const itemTotal = price * (item.quantity || 1);
      return `
        <div class="flex items-center gap-3 py-2.5 border-b border-gray-100 text-xs">
          <img src="${item.image || 'https://thepatchee.com/cdn/shop/files/654a7e83-c512-4ec1-8ebf-af44c488e776.png?v=1781362688'}" class="w-12 h-12 object-contain rounded border border-gray-200 bg-white p-1 shrink-0" alt="${item.title || 'Product'}" />
          <div class="flex-1 min-w-0">
            <p class="font-bold text-gray-900 truncate">${item.title || 'Luxos Product'}</p>
            <p class="text-gray-500 text-[11px]">${item.color || 'Standard'} × ${item.quantity || 1}</p>
          </div>
          <span class="font-bold text-gray-900 shrink-0">${formatPrice(itemTotal)}</span>
        </div>
      `;
    }).join('');
  }
}
window.updateCheckoutSummary = updateCheckoutSummary;
window.renderCheckoutSummary = updateCheckoutSummary;

window.placeOrder = function (e) {
  if (e) e.preventDefault();

  const nameInput = $('#custName');
  const phoneInput = $('#custPhone');
  const addressInput = $('#custAddress');
  const submitBtn = document.querySelector('#checkoutModal form button[type="submit"]') || $('#placeOrderBtn');

  const name = nameInput ? nameInput.value.trim() : '';
  const phone = phoneInput ? phoneInput.value.trim() : '';
  const address = addressInput ? addressInput.value.trim() : '';

  if (!name) {
    if (nameInput) {
      nameInput.focus();
      nameInput.classList.add('border-red-500');
      setTimeout(() => nameInput.classList.remove('border-red-500'), 3000);
    }
    showToast('Please enter your full name.');
    return;
  }

  if (!phone) {
    if (phoneInput) {
      phoneInput.focus();
      phoneInput.classList.add('border-red-500');
      setTimeout(() => phoneInput.classList.remove('border-red-500'), 3000);
    }
    showToast('Please enter your mobile number.');
    return;
  }

  if (!address) {
    if (addressInput) {
      addressInput.focus();
      addressInput.classList.add('border-red-500');
      setTimeout(() => addressInput.classList.remove('border-red-500'), 3000);
    }
    showToast('Please enter your full delivery address.');
    return;
  }

  // Flexible and smart phone validation:
  // Strip spaces, dashes, parentheses, +88, 88
  let cleanedPhone = phone.replace(/[\s\-\(\)\+]/g, '');
  if (cleanedPhone.startsWith('880')) {
    cleanedPhone = cleanedPhone.slice(2);
  } else if (cleanedPhone.startsWith('88')) {
    cleanedPhone = cleanedPhone.slice(2);
  }

  // Accept any numeric phone string with 10 to 14 digits (allowing 0100000000, 01712345678, test numbers, etc.)
  if (cleanedPhone.length < 10 || !/^\d+$/.test(cleanedPhone)) {
    if (phoneInput) {
      phoneInput.focus();
      phoneInput.classList.add('border-red-500');
      setTimeout(() => phoneInput.classList.remove('border-red-500'), 3000);
    }
    showToast('Please enter a valid mobile number (e.g. 01712345678)');
    return;
  }

  // Visual button loading state
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <span class="inline-flex items-center gap-2">
        <svg class="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
        <span>Placing Order...</span>
      </span>
    `;
  }

  // Ensure AppState.cart is synchronized from localStorage if empty
  if (!AppState.cart || !Array.isArray(AppState.cart) || AppState.cart.length === 0) {
    try {
      const stored = JSON.parse(localStorage.getItem('luxos_cart')) || [];
      AppState.cart = Array.isArray(stored) ? stored : [];
    } catch (err) {
      AppState.cart = [];
    }
  }

  // If still empty on PDP, try to reconstruct from current PDP product
  if ((!AppState.cart || AppState.cart.length === 0) && typeof currentProduct !== 'undefined' && currentProduct && currentProduct.id) {
    const qty = parseInt(document.getElementById('pdpQuantity')?.value || 1, 10) || 1;
    const priceNum = parseInt(String(currentProduct.price).replace(/[^\d]/g, ''), 10) || 687;
    AppState.cart = [{
      id: currentProduct.id,
      title: currentProduct.title,
      price: currentProduct.price,
      priceNum: priceNum,
      originalPrice: currentProduct.originalPrice,
      image: currentProduct.image || '',
      category: currentProduct.category || 'Luxury Collection',
      color: typeof selectedColor !== 'undefined' ? selectedColor : 'Standard',
      quantity: qty
    }];
  }

  if (!AppState.cart || AppState.cart.length === 0) {
    showToast('Your cart is empty. Please select a product.');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Confirm &amp; Place Order';
    }
    return;
  }

  const orderId = 'LX-' + Math.floor(100000 + Math.random() * 900000);
  const paymentMethod = $('input[name="paymentMethod"]:checked')?.value || 'Cash on Delivery';
  const subtotal = AppState.cart.reduce((sum, item) => {
    let price = (item.priceNum && !isNaN(item.priceNum) && item.priceNum > 0) ? item.priceNum : parsePrice(item.price);
    if (!price || isNaN(price) || price <= 0) price = 1000;
    return sum + (price * (item.quantity || 1));
  }, 0);

  let shipping = AppState.deliveryFee || 70;
  if (subtotal >= AppState.FREE_SHIPPING_THRESHOLD || AppState.couponDiscount === 'FREE_SHIPPING') {
    shipping = 0;
  }

  let discount = 0;
  if (AppState.couponDiscount && typeof AppState.couponDiscount === 'number') {
    discount = Math.round(subtotal * AppState.couponDiscount);
  }
  const grandTotal = Math.max(0, subtotal - discount + shipping);

  // Create persistent order object for Admin Panel
  const newOrder = {
    id: orderId,
    customer: {
      name,
      phone,
      address,
      zone: AppState.deliveryZone === 'inside_dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'
    },
    items: (AppState.cart || []).map(i => ({
      id: i.id,
      title: i.title || 'Luxos Product',
      price: i.price,
      priceNum: i.priceNum || parsePrice(i.price),
      quantity: i.quantity || 1,
      image: i.image || '',
      color: i.color || 'Standard'
    })),
    subtotal: subtotal,
    shippingFee: shipping,
    discount: discount,
    couponCode: AppState.couponCode || '',
    total: grandTotal,
    paymentMethod,
    paymentStatus: paymentMethod === 'Cash on Delivery' ? 'Unpaid (COD)' : 'Paid Online (bKash)',
    orderStatus: 'Pending',
    createdAt: new Date().toISOString()
  };

  // Save order to localStorage for Admin Panel
  try {
    let existingOrders = [];
    try {
      existingOrders = JSON.parse(localStorage.getItem('luxos_orders')) || [];
      if (!Array.isArray(existingOrders)) existingOrders = [];
    } catch (err) {
      existingOrders = [];
    }
    existingOrders.unshift(newOrder);
    if (existingOrders.length > 50) existingOrders.length = 50;
    localStorage.setItem('luxos_orders', JSON.stringify(existingOrders));

    // Save profile for fast checkout
    const profile = { name, phone, address, zone: AppState.deliveryZone, updatedAt: new Date().toISOString() };
    localStorage.setItem('luxos_user_profile', JSON.stringify(profile));
  } catch (err) {
    console.error('Error saving order', err);
  }

  // Order Confirmed Screen
  const body = $('#checkoutModalContent');
  if (body) {
    body.scrollTop = 0;
    body.innerHTML = `
      <div class="p-8 text-center">
        <div class="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>

        <span class="text-xs font-semibold text-emerald-600 uppercase tracking-widest">Order Confirmed</span>
        <h2 class="text-2xl font-bold text-gray-900 mt-1">Thank you, ${name}!</h2>
        <p class="text-xs text-gray-500 mt-1">Your order has been recorded in the Luxos system.</p>

        <div class="my-6 p-4 bg-gray-50 rounded-sm border border-gray-200 text-left text-xs space-y-2">
          <div class="flex justify-between">
            <span class="text-gray-500">Order ID:</span>
            <span class="font-bold text-gray-900">${orderId}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Recipient Phone:</span>
            <span class="font-semibold text-gray-800">${phone}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Delivery Address:</span>
            <span class="font-semibold text-gray-800 text-right">${address}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Payment Option:</span>
            <span class="font-semibold text-gray-800 uppercase">${paymentMethod}</span>
          </div>
          <div class="flex justify-between border-t border-gray-200 pt-2 font-bold text-sm">
            <span>Amount Payable:</span>
            <span class="text-gray-900">${formatPrice(grandTotal)}</span>
          </div>
        </div>

        <p class="text-xs text-gray-500 mb-6">Our delivery executive will contact you prior to delivery. You can track this order with ID <b>${orderId}</b>.</p>

        <div class="flex justify-center">
          <button onclick="finishCheckout()" class="w-full sm:w-auto bg-black text-white text-xs uppercase tracking-luxury font-bold py-3.5 px-8 rounded-sm hover:bg-neutral-800 transition shadow cursor-pointer">
            Continue Shopping
          </button>
        </div>
      </div>
    `;
  }

  // Clear cart
  AppState.cart = [];
  try {
    localStorage.removeItem('luxos_cart');
  } catch (err) {}
  saveCart();
  updateCartBadge();
};

window.finishCheckout = function () {
  closeCheckoutModal();
  window.location.reload();
};

/* ==========================================================================
   Interactive "Shop the Look" Hotspots & Street Style Lookbook
   ========================================================================== */
function getLookbookData() {
  const custom = localStorage.getItem('luxos_lookbook_data');
  if (custom) {
    try {
      const parsed = JSON.parse(custom);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch (e) {}
  }
  return {
    enabled: true,
    tag: 'Street Style Lookbook',
    title: 'Bag The Vibe',
    subtitle: 'Click the interactive pulse pins on our lookbook to reveal and shop the featured pieces directly.',
    image: 'https://thepatchee.com/cdn/shop/files/IMG_6745.JPG-ezgif.com-jpg-to-webp-converter.webp?v=1783519021&width=1600',
    campaignTag: 'Autumn Campaign',
    campaignTitle: 'Designed for Those Who Dare to Lead',
    campaignDesc: 'Every Luxos bag represents the intersection of urban functionality and high-fashion luxury. Engineered with reinforced stitching, water-repellent textures, and ergonomic hardware made for your dynamic lifestyle.',
    pinTop: 52,
    pinLeft: 46,
    productId: 3
  };
}

function renderLookbookSection() {
  const section = $('#lookbookSection');
  if (!section) return;

  const data = getLookbookData();
  if (data.enabled === false) {
    section.style.display = 'none';
    return;
  }
  section.style.display = 'block';

  if ($('#lookbookTag')) $('#lookbookTag').textContent = data.tag || 'Street Style Lookbook';
  if ($('#lookbookTitle')) $('#lookbookTitle').textContent = data.title || 'Bag The Vibe';
  if ($('#lookbookSubtitle')) $('#lookbookSubtitle').textContent = data.subtitle || '';
  if ($('#lookbookImage') && data.image) $('#lookbookImage').src = data.image;

  if ($('#lookbookCampaignTag')) $('#lookbookCampaignTag').textContent = data.campaignTag || '';
  if ($('#lookbookCampaignTitle')) $('#lookbookCampaignTitle').textContent = data.campaignTitle || '';
  if ($('#lookbookCampaignDesc')) $('#lookbookCampaignDesc').textContent = data.campaignDesc || '';

  const pin = $('#hotspotPin1');
  const card = $('#hotspotCard1');
  const top = typeof data.pinTop === 'number' ? data.pinTop : 52;
  const left = typeof data.pinLeft === 'number' ? data.pinLeft : 46;

  if (pin) {
    pin.style.top = top + '%';
    pin.style.left = left + '%';
  }
  if (card) {
    card.style.top = Math.min(top + 6, 75) + '%';
    card.style.left = Math.max(Math.min(left - 10, 65), 5) + '%';
  }

  // Tagged Product
  const products = typeof getStoreProducts === 'function' ? getStoreProducts() : (typeof LUXOS_PRODUCTS !== 'undefined' ? LUXOS_PRODUCTS : []);
  const prod = products.find(p => p.id == data.productId) || products.find(p => p.id == 3) || products[0];
  if (prod) {
    const pTitle = prod.title || prod.name || 'Croissant Chic Crossbody';
    const pPrice = String(prod.price || '').startsWith('৳') ? prod.price : `৳ ${Number(prod.price || 0).toLocaleString()}`;
    const pOrigPrice = prod.originalPrice ? (String(prod.originalPrice).startsWith('৳') ? prod.originalPrice : `৳ ${Number(prod.originalPrice || 0).toLocaleString()}`) : '';

    if ($('#hotspotCardImg')) $('#hotspotCardImg').src = prod.image;
    if ($('#hotspotCardTitle')) $('#hotspotCardTitle').textContent = pTitle;

    let badge = prod.badge || '';
    if (!badge && prod.originalPrice) {
      const origNum = parseInt(String(prod.originalPrice).replace(/[^\d]/g, ''), 10);
      const curNum = parseInt(String(prod.price).replace(/[^\d]/g, ''), 10);
      if (origNum && curNum && origNum > curNum) {
        badge = `Save ${Math.round((origNum - curNum) / origNum * 100)}%`;
      }
    }

    if ($('#hotspotCardBadge')) {
      $('#hotspotCardBadge').textContent = badge;
      $('#hotspotCardBadge').style.display = badge ? 'inline' : 'none';
    }
    if ($('#hotspotCardPrice')) {
      $('#hotspotCardPrice').innerHTML = `${pPrice} ${pOrigPrice ? `<span class="text-[10px] text-gray-400 line-through">${pOrigPrice}</span>` : ''}`;
    }
    if ($('#hotspotCardBtn')) {
      $('#hotspotCardBtn').textContent = 'Order Now';
      $('#hotspotCardBtn').onclick = (e) => quickOrderNow(prod.id, e);
    }
  }

  // Background IndexedDB sync
  if (!renderLookbookSection.idbSynced) {
    renderLookbookSection.idbSynced = true;
    try {
      getItemIndexedDB('luxos_lookbook_data').then(idbData => {
        if (idbData && typeof idbData === 'object') {
          try { localStorage.setItem('luxos_lookbook_data', JSON.stringify(idbData)); } catch(e){}
          renderLookbookSection();
        }
      }).catch(() => {});
    } catch (e) {}
  }
}

/* ==========================================================================
   Brand Story: "OWN IT. LEAD IT."
   ========================================================================== */
function getBrandStoryData() {
  const custom = localStorage.getItem('luxos_brandstory_data');
  if (custom) {
    try {
      const parsed = JSON.parse(custom);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch (e) {}
  }
  return {
    enabled: true,
    image: 'https://thepatchee.com/cdn/shop/files/about_us.jpg?v=1744978769&width=1600',
    title: 'OWN IT. LEAD IT.',
    desc: "At Luxos, we're driven by the belief that your bag is not just an accessory—it's a statement. We design bags that empower you to take on the world with confidence, style, and ease. We're constantly ahead of the curve, delivering the latest trends with unparalleled quality.",
    btnText: 'OUR STORY',
    btnLink: '',
    modalTag: 'Our Heritage & Craft',
    modalTitle: 'Own It. Lead It.',
    modalPara1: "At Luxos, we're driven by the belief that your bag is not just an accessory—it's a statement. We design bags that empower you to take on the world with confidence, style, and ease. We're constantly ahead of the curve, delivering the latest trends with unparalleled quality.",
    modalPara2: 'From executive smart RFID wallets to spacious commuter totes and evening statement bags, our Dhaka studio harmonizes international runway silhouettes with everyday resilience. Every stitch, zipper, and lining is meticulously crafted to accompany you on your journey.'
  };
}

function renderBrandStorySection() {
  const section = $('#brandStorySection');
  if (!section) return;

  const data = getBrandStoryData();
  if (data.enabled === false) {
    section.style.display = 'none';
    return;
  }
  section.style.display = 'block';

  if ($('#brandStoryImage') && data.image) {
    $('#brandStoryImage').src = data.image;
  }
  if ($('#brandStoryTitle')) {
    $('#brandStoryTitle').textContent = data.title || 'OWN IT. LEAD IT.';
  }
  if ($('#brandStoryDesc')) {
    $('#brandStoryDesc').textContent = data.desc || '';
  }
  if ($('#brandStoryBtn')) {
    $('#brandStoryBtn').textContent = data.btnText || 'OUR STORY';
  }

  // Update modal contents if present
  if ($('#storyModalTag')) $('#storyModalTag').textContent = data.modalTag || 'Our Heritage & Craft';
  if ($('#storyModalTitle')) $('#storyModalTitle').textContent = data.modalTitle || data.title || 'Own It. Lead It.';
  if ($('#storyModalPara1')) $('#storyModalPara1').textContent = data.modalPara1 || data.desc || '';
  if ($('#storyModalPara2')) {
    $('#storyModalPara2').textContent = data.modalPara2 || '';
    $('#storyModalPara2').style.display = data.modalPara2 ? 'block' : 'none';
  }

  // Background IndexedDB sync
  if (!renderBrandStorySection.idbSynced) {
    renderBrandStorySection.idbSynced = true;
    try {
      getItemIndexedDB('luxos_brandstory_data').then(idbData => {
        if (idbData && typeof idbData === 'object') {
          try { localStorage.setItem('luxos_brandstory_data', JSON.stringify(idbData)); } catch(e){}
          renderBrandStorySection();
        }
      }).catch(() => {});
    } catch (e) {}
  }
}

window.handleBrandStoryBtnClick = function () {
  const data = getBrandStoryData();
  if (data.btnLink && data.btnLink.trim()) {
    const link = data.btnLink.trim();
    if (link.startsWith('#')) {
      const target = document.querySelector(link);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    window.location.href = link;
  } else {
    if (typeof openStoryModal === 'function') {
      openStoryModal();
    }
  }
};

/* ==========================================================================
   Editorial Campaign Showcase: "TIMELESS. BOLD. UNSTOPPABLE."
   ========================================================================== */
function getDefaultTimelessData() {
  return {
    enabled: true,
    headline: 'TIMELESS. BOLD. UNSTOPPABLE.',
    cards: [
      {
        title: 'The Viral Shoulder Bag',
        badgeText: '',
        targetTab: 'Shoulder Bags',
        customUrl: '',
        image: 'images/timeless-viral-bag.png'
      },
      {
        title: 'Trending Now',
        badgeText: '',
        targetTab: 'Best Sellers',
        customUrl: '',
        image: 'images/timeless-trending-now.png'
      },
      {
        title: 'Back in Demand',
        badgeText: '',
        targetTab: 'Just Landed',
        customUrl: '',
        image: 'images/timeless-back-in-demand.png'
      }
    ]
  };
}

function getTimelessData() {
  const custom = localStorage.getItem('luxos_timeless_showcase');
  if (custom) {
    try {
      const parsed = JSON.parse(custom);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch (e) {}
  }
  return getDefaultTimelessData();
}

function renderTimelessSection() {
  const section = $('#timelessSection');
  if (!section) return;

  const data = getTimelessData();
  if (data.enabled === false) {
    section.style.display = 'none';
    return;
  }
  section.style.display = 'block';

  if ($('#timelessHeadline')) {
    $('#timelessHeadline').textContent = data.headline || 'TIMELESS. BOLD. UNSTOPPABLE.';
  }

  const cards = Array.isArray(data.cards) ? data.cards : getDefaultTimelessData().cards;

  // Card 1
  if (cards[0] && $('#timelessCard1Img') && cards[0].image) {
    $('#timelessCard1Img').src = cards[0].image;
  }
  if ($('#timelessCard1Badge')) {
    const b1 = $('#timelessCard1Badge').closest('.absolute');
    if (b1) b1.style.display = 'none';
  }

  // Card 2
  if (cards[1] && $('#timelessCard2Img') && cards[1].image) {
    $('#timelessCard2Img').src = cards[1].image;
  }
  if ($('#timelessCard2Badge')) {
    const b2 = $('#timelessCard2Badge').closest('.absolute');
    if (b2) b2.style.display = 'none';
  }

  // Card 3
  if (cards[2] && $('#timelessCard3Img') && cards[2].image) {
    $('#timelessCard3Img').src = cards[2].image;
  }
  if ($('#timelessCard3Badge')) {
    const b3 = $('#timelessCard3Badge').closest('.absolute');
    if (b3) b3.style.display = 'none';
  }

  // Background IndexedDB sync
  if (!renderTimelessSection.idbSynced) {
    renderTimelessSection.idbSynced = true;
    try {
      getItemIndexedDB('luxos_timeless_showcase').then(idbData => {
        if (idbData && typeof idbData === 'object') {
          try { localStorage.setItem('luxos_timeless_showcase', JSON.stringify(idbData)); } catch(e){}
          renderTimelessSection();
        }
      }).catch(() => {});
    } catch (e) {}
  }
}

window.handleTimelessCardClick = function (cardIndex) {
  const data = getTimelessData();
  const cards = Array.isArray(data.cards) ? data.cards : getDefaultTimelessData().cards;
  const card = cards[cardIndex];
  if (!card) return;

  if (card.customUrl && card.customUrl.trim()) {
    const url = card.customUrl.trim();
    if (url.startsWith('#')) {
      const el = document.querySelector(url);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    window.location.href = url;
    return;
  }

  const targetTab = card.targetTab || 'All Bags';
  if (typeof filterByTab === 'function') {
    filterByTab(targetTab);
  }
  const colSec = document.getElementById('collectionSection');
  if (colSec) {
    colSec.scrollIntoView({ behavior: 'smooth' });
  }
};

/* ==========================================================================
   Top Header Bar & Social Media Channels Controller
   ========================================================================== */
function getDefaultTopBarData() {
  return {
    enabled: true,
    phone: {
      enabled: true,
      number: '+8801701-800216',
      label: ''
    },
    socialLinks: {
      facebook: { enabled: true, url: 'https://facebook.com' },
      instagram: { enabled: true, url: 'https://instagram.com' },
      whatsapp: { enabled: true, url: 'https://wa.me/8801701800216' },
      tiktok: { enabled: true, url: 'https://tiktok.com' },
      youtube: { enabled: true, url: 'https://youtube.com' }
    }
  };
}

function getTopBarData() {
  const custom = localStorage.getItem('luxos_topbar_settings');
  if (custom) {
    try {
      const parsed = JSON.parse(custom);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch (e) {}
  }
  return getDefaultTopBarData();
}

function renderTopBar() {
  const bar = $('#topAnnouncementBar');
  if (!bar) return;

  const data = getTopBarData();
  if (data.enabled === false) {
    bar.style.display = 'none';
    return;
  }
  bar.style.display = 'block';

  // 1. Phone number (left side)
  const phoneContainer = $('#topBarPhoneContainer');
  const phoneLink = $('#topBarPhoneLink');
  const phoneDisplay = $('#topBarPhoneDisplay');
  const phone = data.phone || {};

  if (phoneContainer) {
    if (phone.enabled !== false && phone.number) {
      phoneContainer.style.display = 'flex';
      const cleanTel = phone.number.replace(/[^\d+]/g, '');
      if (phoneLink) phoneLink.href = `tel:${cleanTel}`;
      const displayText = phone.label ? `${phone.label} ${phone.number}` : phone.number;
      if (phoneDisplay) phoneDisplay.textContent = displayText;
    } else {
      phoneContainer.style.display = 'none';
    }
  }

  // 2. Social Media icons (right side)
  const socialContainer = $('#topBarSocialContainer');
  if (socialContainer) {
    const social = data.socialLinks || {};
    const icons = [];

    // Facebook
    if (social.facebook && social.facebook.enabled !== false && social.facebook.url) {
      icons.push(`
        <a href="${social.facebook.url}" target="_blank" rel="noopener noreferrer" aria-label="Facebook" title="Follow us on Facebook" class="hover:text-white transition-transform hover:scale-110 flex items-center">
          <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
        </a>
      `);
    }

    // Instagram
    if (social.instagram && social.instagram.enabled !== false && social.instagram.url) {
      icons.push(`
        <a href="${social.instagram.url}" target="_blank" rel="noopener noreferrer" aria-label="Instagram" title="Follow us on Instagram" class="hover:text-white transition-transform hover:scale-110 flex items-center">
          <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
        </a>
      `);
    }

    // WhatsApp
    if (social.whatsapp && social.whatsapp.enabled !== false && social.whatsapp.url) {
      let waHref = social.whatsapp.url.trim();
      if (!waHref.startsWith('http://') && !waHref.startsWith('https://')) {
        const cleanWa = waHref.replace(/[^\d]/g, '');
        waHref = `https://wa.me/${cleanWa.startsWith('88') ? cleanWa : '88' + cleanWa}`;
      }
      icons.push(`
        <a href="${waHref}" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" title="Chat on WhatsApp" class="hover:text-emerald-400 transition-transform hover:scale-110 flex items-center">
          <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
        </a>
      `);
    }

    // TikTok
    if (social.tiktok && social.tiktok.enabled !== false && social.tiktok.url) {
      icons.push(`
        <a href="${social.tiktok.url}" target="_blank" rel="noopener noreferrer" aria-label="TikTok" title="Follow us on TikTok" class="hover:text-white transition-transform hover:scale-110 flex items-center">
          <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
        </a>
      `);
    }

    // YouTube
    if (social.youtube && social.youtube.enabled !== false && social.youtube.url) {
      icons.push(`
        <a href="${social.youtube.url}" target="_blank" rel="noopener noreferrer" aria-label="YouTube" title="Subscribe on YouTube" class="hover:text-red-500 transition-transform hover:scale-110 flex items-center">
          <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
        </a>
      `);
    }

    socialContainer.innerHTML = icons.join('');
  }

  // Background IndexedDB sync
  if (!renderTopBar.idbSynced) {
    renderTopBar.idbSynced = true;
    try {
      getItemIndexedDB('luxos_topbar_settings').then(idbData => {
        if (idbData && typeof idbData === 'object') {
          try { localStorage.setItem('luxos_topbar_settings', JSON.stringify(idbData)); } catch(e){}
          renderTopBar();
        }
      }).catch(() => {});
    } catch (e) {}
  }
}

function initHotspots() {
  const pin1 = $('#hotspotPin1');
  const card1 = $('#hotspotCard1');
  if (pin1 && card1) {
    pin1.addEventListener('click', (e) => {
      e.stopPropagation();
      card1.classList.toggle('hidden');
    });
  }

  document.addEventListener('click', () => {
    if (card1) card1.classList.add('hidden');
  });
}

/* ==========================================================================
   Mobile Navigation Drawer
   ========================================================================== */
window.openMobileNav = function () {
  $('#mobileNavBackdrop').classList.add('active');
  $('#mobileNavDrawer').classList.add('active');
  document.body.style.overflow = 'hidden';
};

window.closeMobileNav = function () {
  $('#mobileNavBackdrop').classList.remove('active');
  $('#mobileNavDrawer').classList.remove('active');
  document.body.style.overflow = '';
};

/* ==========================================================================
   Toast Notification System
   ========================================================================== */
let toastTimeout;
function showToast(message) {
  let toast = $('#toastNotification');
  let text = $('#toastText');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toastNotification';
    toast.className = 'toast-notification fixed bottom-5 right-5 z-[9999] bg-black text-white text-xs px-4 py-3 rounded-sm shadow-2xl flex items-center gap-2 border border-neutral-700 pointer-events-none';
    toast.innerHTML = `
      <svg class="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
      <span id="toastText"></span>
    `;
    document.body.appendChild(toast);
    text = toast.querySelector('#toastText');
  } else if (!text) {
    text = toast.querySelector('#toastText');
  }

  if (text) text.textContent = message;
  toast.classList.add('show');

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}
window.showToast = showToast;

/* ==========================================================================
   Newsletter Subscription
   ========================================================================== */
window.handleNewsletter = function (e) {
  e.preventDefault();
  const emailInput = $('#newsletterEmail');
  if (!emailInput || !emailInput.value) return;

  showToast(`Thank you! Use promo code "LUXOS10" for 10% off.`);
  emailInput.value = '';
};

/* ==========================================================================
   Header Scroll Effect
   ========================================================================== */
function initEventListeners() {
  const header = $('header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

/* ==========================================================================
   Customer Account, Order Tracking & Profile Management
   ========================================================================== */

let isProfileEditing = false;
let tempEditPhoto = null;

window.getUserProfile = function () {
  try {
    return JSON.parse(localStorage.getItem('luxos_user_profile')) || null;
  } catch (e) {
    return null;
  }
};

window.openTrackOrderModal = function (orderId) {
  if (typeof closeAccountModal === 'function') closeAccountModal();
  if (typeof closeCartDrawer === 'function') closeCartDrawer();
  if (typeof closeMobileNav === 'function') closeMobileNav();

  const modal = $('#trackOrderModal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
      const input = $('#trackSearchInput');
      if (input) {
        if (orderId) {
          input.value = orderId;
          searchOrderStatus();
        } else if (!input.value) {
          const profile = getUserProfile();
          if (profile && profile.phone) {
            input.value = profile.phone;
            searchOrderStatus();
          }
        }
        input.focus();
      }
    }, 150);
  }
};

window.closeTrackOrderModal = function () {
  const modal = $('#trackOrderModal');
  if (modal) modal.classList.remove('active');
  document.body.style.overflow = '';
};

window.openAccountModal = function (tab) {
  if (tab === 'track') {
    openTrackOrderModal();
    return;
  }
  isProfileEditing = false;
  tempEditPhoto = null;

  if (typeof updateHeaderProfileIcon === 'function') updateHeaderProfileIcon();
  renderAccountTab();

  const accModal = $('#accountModal');
  if (accModal) {
    accModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
};

window.closeAccountModal = function () {
  const accModal = $('#accountModal');
  if (accModal) accModal.classList.remove('active');
  document.body.style.overflow = '';
};

window.switchAccountTab = function (tab) {
  if (tab === 'track') {
    closeAccountModal();
    openTrackOrderModal();
    return;
  }
  renderAccountTab();
};

window.renderAccountTab = function () {
  const container = $('#accountTabContentProfile');
  if (!container) return;
  container.classList.remove('hidden');

  const profile = getUserProfile();
  const modalHeaderAvatar = $('#accountModalHeaderAvatar');
  const modalTitle = $('#accountModalTitle');
  const modalSubtitle = $('#accountModalSubtitle');

  if (!profile) {
    // Mode 1: No account - Show Create Account Form (Only Name & Phone)
    if (modalHeaderAvatar) {
      modalHeaderAvatar.innerHTML = `
        <svg class="w-4 h-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="7.8" r="3.8"/>
          <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>
        </svg>
      `;
    }
    if (modalTitle) modalTitle.textContent = 'My Account';
    if (modalSubtitle) modalSubtitle.textContent = 'Create an account with Name & Mobile Number';

    container.innerHTML = `
      <div class="bg-neutral-50 p-5 rounded-sm border border-neutral-200">
        <div class="text-center mb-5">
          <div class="w-12 h-12 bg-black text-white rounded-full mx-auto flex items-center justify-center mb-2 shadow-sm">
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <circle cx="12" cy="7.8" r="3.8"/>
              <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>
            </svg>
          </div>
          <h4 class="font-bold text-sm uppercase tracking-wider text-gray-900">Create New Account</h4>
          <p class="text-xs text-gray-500 mt-1">Open an account instantly with just your Name &amp; Phone Number</p>
        </div>

        <form onsubmit="handleCreateAccount(event)" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Your Full Name *</label>
            <input id="createAccName" type="text" placeholder="e.g. Tanzim Ahmed" required class="w-full border border-gray-300 text-xs px-3.5 py-2.5 rounded-sm focus:outline-none focus:border-black bg-white" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Mobile Number (BD) *</label>
            <input id="createAccPhone" type="tel" placeholder="017XXXXXXXX" required pattern="[0-9]{11}" title="Please enter 11 digit Bangladeshi mobile number" class="w-full border border-gray-300 text-xs px-3.5 py-2.5 rounded-sm focus:outline-none focus:border-black bg-white" />
          </div>

          <button type="submit" class="w-full bg-black text-white text-xs uppercase tracking-widest font-bold py-3.5 rounded-sm hover:bg-neutral-800 transition shadow">
            Create Account
          </button>
          
          <p class="text-[11px] text-center text-gray-400">⚡ No password needed • 100% Secure &amp; Instant</p>
        </form>
      </div>
    `;
    return;
  }

  // Update modal header when profile exists
  if (modalHeaderAvatar) {
    if (profile.photo) {
      modalHeaderAvatar.innerHTML = `<img src="${profile.photo}" alt="${profile.name}" class="w-full h-full object-cover">`;
    } else {
      const initial = (profile.name || 'U').charAt(0).toUpperCase();
      modalHeaderAvatar.innerHTML = `<span class="font-bold text-xs">${initial}</span>`;
    }
  }
  if (modalTitle) modalTitle.textContent = profile.name || 'My Account';
  if (modalSubtitle) modalSubtitle.textContent = profile.phone || 'Customer Account';

  const initials = (profile.name || 'U').trim().split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  // Mode 2: Profile Exists - Editing Mode
  if (isProfileEditing) {
    const photoToDisplay = tempEditPhoto !== null ? tempEditPhoto : (profile.photo || '');
    container.innerHTML = `
      <div class="bg-neutral-50 p-5 rounded-sm border border-neutral-200">
        <div class="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
          <h4 class="font-bold text-xs uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"/></svg>
            Edit Profile
          </h4>
          <button type="button" onclick="toggleProfileEdit(false)" class="text-xs text-gray-500 hover:text-black font-medium">Cancel</button>
        </div>

        <!-- Profile Photo Selection -->
        <div class="flex items-center gap-4 mb-5 p-3 bg-white rounded-sm border border-gray-200">
          <div class="w-16 h-16 rounded-full overflow-hidden border-2 border-luxos-gold bg-neutral-100 flex items-center justify-center shrink-0">
            ${photoToDisplay 
              ? `<img src="${photoToDisplay}" alt="Preview" class="w-full h-full object-cover">` 
              : `<span class="font-bold text-xl text-neutral-600">${initials}</span>`}
          </div>
          <div class="flex-1">
            <input type="file" id="editProfilePhotoInput" accept="image/*" class="hidden" onchange="handleEditPhotoPreview(event)">
            <button type="button" onclick="$('#editProfilePhotoInput').click()" class="bg-black text-white hover:bg-neutral-800 text-xs font-semibold px-3 py-1.5 rounded-sm transition flex items-center gap-1.5 shadow-xs">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"/></svg>
              Upload Profile Photo
            </button>
            <p class="text-[10px] text-gray-500 mt-1">Upload JPG or PNG from your computer or phone</p>
          </div>
        </div>

        <form onsubmit="handleSaveProfileEdit(event)" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Full Name *</label>
            <input id="editNameInput" type="text" value="${profile.name || ''}" required class="w-full border border-gray-300 text-xs px-3 py-2 rounded-sm focus:outline-none focus:border-black bg-white" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Mobile Number (BD) *</label>
            <input id="editPhoneInput" type="tel" value="${profile.phone || ''}" required pattern="[0-9]{11}" class="w-full border border-gray-300 text-xs px-3 py-2 rounded-sm focus:outline-none focus:border-black bg-white" />
          </div>
          <div class="flex gap-2 pt-2">
            <button type="submit" class="flex-1 bg-black text-white text-xs uppercase tracking-widest font-bold py-2.5 rounded-sm hover:bg-neutral-800 transition">Save Changes</button>
            <button type="button" onclick="toggleProfileEdit(false)" class="px-4 border border-gray-300 text-gray-700 text-xs py-2.5 rounded-sm hover:bg-gray-100 transition">Cancel</button>
          </div>
        </form>
      </div>
    `;
    return;
  }

  // Mode 3: Profile Exists - View Mode
  const orders = JSON.parse(localStorage.getItem('luxos_orders')) || [];
  const cleanPhone = (profile.phone || '').replace(/\s+/g, '');
  const userOrders = orders.filter(o => o.customer && (o.customer.phone || '').replace(/\s+/g, '').includes(cleanPhone));

  container.innerHTML = `
    <div class="bg-neutral-50 p-4 rounded-sm border border-neutral-200">
      <div class="flex items-center gap-4">
        <!-- Avatar with click-to-change photo -->
        <div class="relative group cursor-pointer" onclick="$('#profilePhotoDirectInput').click()" title="Click to upload profile photo">
          <div class="w-16 h-16 rounded-full overflow-hidden border-2 border-luxos-gold bg-neutral-200 flex items-center justify-center shrink-0 shadow-sm">
            ${profile.photo 
              ? `<img src="${profile.photo}" alt="${profile.name}" class="w-full h-full object-cover">` 
              : `<span class="font-bold text-xl text-neutral-600">${initials}</span>`}
          </div>
          <div class="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"/></svg>
          </div>
          <button type="button" class="absolute -bottom-1 -right-1 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center shadow hover:bg-neutral-800 transition" title="Upload Photo">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          </button>
        </div>
        <input type="file" id="profilePhotoDirectInput" accept="image/*" class="hidden" onchange="handleProfilePhotoUpload(event)">

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <h4 class="font-bold text-sm text-gray-900 truncate">${profile.name}</h4>
            <span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded">Active</span>
          </div>
          <p class="text-xs text-gray-600 font-mono mt-0.5">📞 ${profile.phone}</p>
          <p class="text-[10px] text-gray-400 mt-1">Customer since ${profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-GB') : 'Recently'}</p>
        </div>
      </div>

      <div class="flex gap-2 mt-4 pt-3 border-t border-gray-200">
        <button onclick="toggleProfileEdit(true)" class="flex-1 bg-black text-white text-xs uppercase tracking-wider font-bold py-2 rounded-sm hover:bg-neutral-800 transition flex items-center justify-center gap-1.5">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"/></svg>
          Edit Profile
        </button>
        <button onclick="handleLogout()" class="px-3 border border-gray-300 text-gray-600 hover:text-red-600 hover:border-red-300 text-xs py-2 rounded-sm transition">
          Log Out
        </button>
      </div>
    </div>

    <!-- My Orders for this logged in phone -->
    <div class="mt-4">
      <div class="flex items-center justify-between mb-2">
        <h5 class="font-bold text-xs uppercase tracking-wider text-gray-800">My Orders (${userOrders.length})</h5>
        ${userOrders.length > 0 ? `<button onclick="openTrackOrderModal()" class="text-[11px] text-amber-600 font-semibold hover:underline cursor-pointer">Track with ID &rarr;</button>` : ''}
      </div>

      <div class="space-y-2">
        ${userOrders.length > 0 ? userOrders.map(order => renderOrderCardHTML(order)).join('') : `
          <div class="p-5 text-center bg-gray-50 rounded-sm border border-gray-200">
            <svg class="w-7 h-7 text-gray-400 mx-auto mb-1.5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
            <p class="font-bold text-xs text-gray-800">No Orders Yet</p>
            <p class="text-[11px] text-gray-500 mt-0.5">Orders placed with mobile <strong>${profile.phone}</strong> will automatically appear here!</p>
          </div>
        `}
      </div>
    </div>
  `;
};

window.handleCreateAccount = function (e) {
  if (e) e.preventDefault();
  const name = ($('#createAccName').value || '').trim();
  const phone = ($('#createAccPhone').value || '').trim();

  if (!name || !phone) {
    showToast('Please enter both your Name and Mobile Number.');
    return;
  }

  const profile = {
    name,
    phone,
    photo: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  localStorage.setItem('luxos_user_profile', JSON.stringify(profile));
  isProfileEditing = false;
  tempEditPhoto = null;

  updateHeaderProfileIcon();
  renderAccountTab();
  showToast(`Welcome, ${name}! Your account has been created.`);
};

window.toggleProfileEdit = function (isEdit) {
  isProfileEditing = isEdit;
  tempEditPhoto = null;
  renderAccountTab();
};

window.handleEditPhotoPreview = function (event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    showToast('Please select a valid image file');
    return;
  }
  const reader = new FileReader();
  reader.onload = function (e) {
    tempEditPhoto = e.target.result;
    renderAccountTab();
  };
  reader.readAsDataURL(file);
};

window.handleProfilePhotoUpload = function (event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    showToast('Please select a valid image file');
    return;
  }
  const reader = new FileReader();
  reader.onload = function (e) {
    const base64 = e.target.result;
    const profile = getUserProfile() || {};
    profile.photo = base64;
    profile.updatedAt = new Date().toISOString();
    localStorage.setItem('luxos_user_profile', JSON.stringify(profile));
    updateHeaderProfileIcon();
    renderAccountTab();
    showToast('Profile photo updated successfully!');
  };
  reader.readAsDataURL(file);
};

window.handleSaveProfileEdit = function (e) {
  if (e) e.preventDefault();
  const name = ($('#editNameInput').value || '').trim();
  const phone = ($('#editPhoneInput').value || '').trim();

  if (!name || !phone) {
    showToast('Name and Phone number are required.');
    return;
  }

  const profile = getUserProfile() || {};
  profile.name = name;
  profile.phone = phone;
  if (tempEditPhoto !== null) {
    profile.photo = tempEditPhoto;
  }
  profile.updatedAt = new Date().toISOString();

  localStorage.setItem('luxos_user_profile', JSON.stringify(profile));
  isProfileEditing = false;
  tempEditPhoto = null;

  updateHeaderProfileIcon();
  renderAccountTab();
  showToast('Profile updated successfully!');
};

window.handleLogout = function () {
  localStorage.removeItem('luxos_user_profile');
  isProfileEditing = false;
  tempEditPhoto = null;
  updateHeaderProfileIcon();
  renderAccountTab();
  showToast('Logged out of your account.');
};

window.updateHeaderProfileIcon = function () {
  const profile = getUserProfile();
  const iconContainer = $('#headerAccountIconContainer');
  if (iconContainer) {
    if (profile && profile.photo) {
      iconContainer.innerHTML = `<img src="${profile.photo}" alt="${profile.name}" class="w-7 h-7 rounded-full object-cover border border-luxos-gold shadow-xs">`;
    } else {
      iconContainer.innerHTML = `
        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="7.8" r="3.8" />
          <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
        </svg>
      `;
    }
  }
};

window.searchOrderStatus = function () {
  const query = ($('#trackSearchInput').value || '').trim();
  const container = $('#trackResultContainer');
  if (!container) return;

  if (!query) {
    container.innerHTML = `
      <div class="p-4 text-center text-xs text-gray-500 bg-gray-50 rounded-sm">
        Please enter an Order ID (e.g. LX-102948) or phone number.
      </div>
    `;
    return;
  }

  const orders = JSON.parse(localStorage.getItem('luxos_orders')) || [];
  const cleanQuery = query.toLowerCase().replace(/\s+/g, '');

  const matched = orders.filter(o => {
    const idMatch = (o.id || '').toLowerCase() === cleanQuery;
    const phoneMatch = o.customer && (o.customer.phone || '').replace(/\s+/g, '').includes(cleanQuery);
    return idMatch || phoneMatch;
  });

  if (matched.length === 0) {
    container.innerHTML = `
      <div class="p-6 text-center bg-gray-50 rounded-sm border border-gray-200">
        <svg class="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
        <p class="font-bold text-xs text-gray-800">No Orders Found</p>
        <p class="text-[11px] text-gray-500 mt-1">We couldn't find an order matching "${query}". Please verify your order ID or mobile number.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = matched.map(order => renderOrderCardHTML(order)).join('');
};

function renderAccountOrders() {
  const container = $('#accountRecentOrdersList');
  if (!container) return;

  const orders = JSON.parse(localStorage.getItem('luxos_orders')) || [];
  if (orders.length === 0) {
    container.innerHTML = `
      <div class="p-6 text-center bg-gray-50 rounded-sm border border-gray-200">
        <svg class="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
        <p class="font-bold text-xs text-gray-800">No Orders Placed Yet</p>
        <p class="text-[11px] text-gray-500 mt-1">When you place an order on Luxos, it will appear here with live tracking status.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = orders.map(order => renderOrderCardHTML(order)).join('');
}

function renderOrderCardHTML(order) {
  const statusColors = {
    Pending: 'bg-amber-100 text-amber-800 border-amber-300',
    Processing: 'bg-blue-100 text-blue-800 border-blue-300',
    Dispatched: 'bg-purple-100 text-purple-800 border-purple-300',
    Delivered: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    Cancelled: 'bg-red-100 text-red-800 border-red-300'
  };

  const status = order.orderStatus || 'Pending';
  const badgeClass = statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  const dateFormatted = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently';

  return `
    <div class="border border-gray-200 rounded-sm p-4 bg-white shadow-xs">
      <div class="flex items-center justify-between pb-3 border-b border-gray-100">
        <div>
          <span class="text-[10px] text-gray-400 font-mono tracking-wider">ORDER ID</span>
          <p class="text-xs font-bold text-gray-900">${order.id}</p>
        </div>
        <div class="text-right">
          <span class="inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badgeClass}">
            ${status}
          </span>
          <p class="text-[10px] text-gray-400 mt-0.5">${dateFormatted}</p>
        </div>
      </div>

      <!-- Items in Order -->
      <div class="py-3 space-y-2 border-b border-gray-100">
        ${(order.items || []).map(item => `
          <div class="flex items-center justify-between text-xs">
            <div class="flex items-center gap-2">
              <img src="${item.image}" alt="${item.title}" class="w-9 h-9 object-cover rounded-xs border border-gray-200" />
              <div>
                <p class="font-medium text-gray-900 line-clamp-1">${item.title}</p>
                <p class="text-[10px] text-gray-500">Qty: ${item.quantity} ${item.color ? '• ' + item.color : ''}</p>
              </div>
            </div>
            <span class="font-bold text-gray-900">৳ ${(item.priceNum * item.quantity).toLocaleString()}</span>
          </div>
        `).join('')}
      </div>

      <!-- Footer Info -->
      <div class="pt-3 flex items-center justify-between text-xs">
        <div>
          <p class="text-[10px] text-gray-500">Recipient: <span class="font-medium text-gray-800">${order.customer?.name || 'Customer'}</span> (${order.customer?.zone || 'Dhaka'})</p>
          <p class="text-[10px] text-gray-500">Payment: <span class="font-medium text-gray-800">${order.paymentMethod || 'COD'}</span></p>
        </div>
        <div class="text-right">
          <span class="text-[10px] text-gray-400 block">TOTAL AMOUNT</span>
          <span class="font-bold text-sm text-gray-900">৳ ${(order.total || 0).toLocaleString()}</span>
        </div>
      </div>
    </div>
  `;
}

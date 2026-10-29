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
  cart: JSON.parse(localStorage.getItem('luxos_cart')) || [],
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

// Initialize Application on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  // Load custom settings if modified from admin
  loadStoreSettings();
  renderStorefrontTicker();
  initHeroSlideshow();
  renderProducts();
  renderFeaturedCategories();
  initEventListeners();
  updateCartBadge();
  updateWishlistBadge();
  initHotspots();
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

window.addEventListener('storage', (e) => {
  if (e.key === 'luxos_ticker_settings') {
    renderStorefrontTicker();
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

function getHeroSlides() {
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
  renderHeroSlideshow();

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

  return `
    <div class="product-card group flex flex-col justify-between" data-id="${p.id}">
      <div>
        <!-- Image Container -->
        <div class="product-image-container rounded-sm overflow-hidden mb-3 relative bg-[#f7f7f7]">
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
          <a href="javascript:void(0)" onclick="openQuickView(${p.id})" class="block w-full h-full">
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
            <button 
              onclick="quickAddToCart(${p.id}, event)"
              class="flex-1 bg-black text-white text-xs uppercase tracking-wider font-semibold py-2.5 px-3 rounded-sm hover:bg-neutral-800 transition flex items-center justify-center gap-1.5 shadow-md">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>Add to Cart</span>
            </button>
            <button 
              onclick="openQuickView(${p.id})"
              title="Quick View"
              class="bg-white text-black p-2.5 rounded-sm hover:bg-gray-100 transition shadow-md flex items-center justify-center">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Product Meta -->
        <div class="space-y-1">
          <div class="flex items-center justify-between text-xs text-gray-500">
            <span class="uppercase tracking-widest text-[11px] font-medium">${p.category}</span>
            <div class="flex items-center gap-1 text-amber-500">
              <span>★</span>
              <span class="text-gray-700 font-semibold">${p.rating}</span>
              <span class="text-gray-400">(${p.reviewsCount})</span>
            </div>
          </div>

          <h3 class="text-sm font-medium text-gray-900 group-hover:text-black transition line-clamp-1">
            <a href="javascript:void(0)" onclick="openQuickView(${p.id})">${p.title}</a>
          </h3>

          <!-- Color options preview -->
          ${p.colors && p.colors.length > 0 ? `
            <div class="flex items-center gap-1.5 pt-1">
              ${p.colors.map((c, i) => `
                <span class="w-2.5 h-2.5 rounded-full border border-gray-300" style="background-color: ${c.hex};" title="${c.name}"></span>
              `).join('')}
              <span class="text-[10px] text-gray-400 pl-1">${p.colors.length} colors</span>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Price & Mobile Quick Add -->
      <div class="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between">
        <div class="flex items-baseline gap-2">
          <span class="text-base font-bold text-gray-900">${p.price}</span>
          ${p.originalPrice ? `<span class="text-xs text-gray-400 line-through">${p.originalPrice}</span>` : ''}
        </div>
        
        <!-- Mobile Add to Cart Button -->
        <button 
          onclick="quickAddToCart(${p.id}, event)"
          class="md:hidden text-xs bg-black text-white px-3 py-1.5 rounded-sm font-medium">
          Add
        </button>
      </div>
    </div>
  `;
}

/* ==========================================================================
   Featured Category Bubbles
   ========================================================================== */
function renderFeaturedCategories() {
  const container = $('#featuredCategories');
  if (!container) return;

  const categories = [
    { title: 'Tote Bags', image: 'https://thepatchee.com/cdn/shop/files/d0783770-4668-4b3e-a3b5-2bbc89c2869f.jpg?v=1776151580&width=400', filter: 'Tote Bags' },
    { title: 'Shoulder Bags', image: 'https://thepatchee.com/cdn/shop/files/Main_Menu_2_22945876-366c-4cc9-9b68-83a3c7eceabf.jpg?v=1736164087&width=400', filter: 'Shoulder Bags' },
    { title: 'Crossbody', image: 'https://thepatchee.com/cdn/shop/files/c2ee0999-fc06-4942-aa71-6cd41e71d473.png?v=1782728863&width=400', filter: 'Crossbody Bags' },
    { title: 'Wallets & RFID', image: 'https://thepatchee.com/cdn/shop/files/654a7e83-c512-4ec1-8ebf-af44c488e776.png?v=1781362688&width=400', filter: 'Wallets & Cards' },
    { title: 'Backpacks', image: 'https://thepatchee.com/cdn/shop/files/6d8a6d9b-495a-4d68-ba90-1f87aa300435.jpg?v=1755610521&width=400', filter: 'Backpacks' },
    { title: 'Duffle Bags', image: 'https://thepatchee.com/cdn/shop/files/625df22d-ff10-4b67-a4fc-3c43388fcd51.png?v=1776663753&width=400', filter: 'Duffle Bags' },
    { title: 'Prime Shoes', image: 'https://thepatchee.com/cdn/shop/files/BD.jpg?v=1749128949&width=400', filter: 'Prime Shoes' },
    { title: 'Clearance Sale', image: 'https://thepatchee.com/cdn/shop/files/DESKTOP_SIZE.webp?v=1791810459&width=400', filter: 'The Prime Drop' }
  ];

  container.innerHTML = categories.map(c => `
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

  const defaultColor = product.colors && product.colors.length > 0 ? product.colors[0].name : 'Default';
  addToCart(product, defaultColor, 1);
};

function addToCart(product, colorName, quantity = 1) {
  const existingIndex = AppState.cart.findIndex(item => item.id === product.id && item.color === colorName);

  if (existingIndex > -1) {
    AppState.cart[existingIndex].quantity += quantity;
  } else {
    AppState.cart.push({
      id: product.id,
      title: product.title,
      price: product.price,
      priceNum: parsePrice(product.price),
      originalPrice: product.originalPrice,
      image: product.image,
      category: product.category,
      color: colorName,
      quantity: quantity
    });
  }

  saveCart();
  updateCartBadge();
  renderCartDrawer();
  openCartDrawer();
  showToast(`Added "${product.title}" to your cart.`);
}

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
   Quick View Modal
   ========================================================================== */
window.openQuickView = function (productId) {
  const currentProducts = getStoreProducts();
  const product = currentProducts.find(p => p.id === productId);
  if (!product) return;

  const modal = $('#quickViewModal');
  const content = $('#quickViewContent');
  if (!modal || !content) return;

  let selectedColor = product.colors && product.colors.length > 0 ? product.colors[0].name : 'Default';

  content.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
      <!-- Image Gallery -->
      <div class="space-y-3">
        <div class="aspect-square bg-gray-50 rounded-sm overflow-hidden border border-gray-200">
          <img id="quickViewMainImage" src="${product.image}" alt="${product.title}" class="w-full h-full object-cover" />
        </div>
        <div class="flex gap-2">
          <button onclick="$('#quickViewMainImage').src = '${product.image}'" class="w-16 h-16 rounded border border-gray-300 overflow-hidden hover:border-black">
            <img src="${product.image}" class="w-full h-full object-cover" />
          </button>
          <button onclick="$('#quickViewMainImage').src = '${product.hoverImage || product.image}'" class="w-16 h-16 rounded border border-gray-300 overflow-hidden hover:border-black">
            <img src="${product.hoverImage || product.image}" class="w-full h-full object-cover" />
          </button>
        </div>
      </div>

      <!-- Details -->
      <div class="flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between">
            <span class="text-xs uppercase tracking-widest text-gray-500 font-semibold">${product.category}</span>
            <span class="badge-tag text-[10px]">${product.badge}</span>
          </div>

          <h2 class="text-xl font-bold text-gray-900 mt-1">${product.title}</h2>

          <div class="flex items-center gap-2 mt-2">
            <div class="flex text-amber-500 text-sm">★★★★★</div>
            <span class="text-xs text-gray-600 font-medium">${product.rating} (${product.reviewsCount} verified reviews)</span>
          </div>

          <!-- Price -->
          <div class="flex items-baseline gap-3 mt-4">
            <span class="text-2xl font-bold text-gray-900">${product.price}</span>
            ${product.originalPrice ? `<span class="text-sm text-gray-400 line-through">${product.originalPrice}</span>` : ''}
            <span class="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">In Stock</span>
          </div>

          <!-- Description -->
          <p class="text-xs text-gray-600 mt-4 leading-relaxed">${product.description}</p>

          <!-- Color Selector -->
          ${product.colors && product.colors.length > 0 ? `
            <div class="mt-5">
              <label class="block text-xs font-semibold text-gray-800 uppercase tracking-wider mb-2">
                Color: <span id="quickViewSelectedColor" class="font-normal text-gray-600">${selectedColor}</span>
              </label>
              <div class="flex items-center gap-2">
                ${product.colors.map((c, idx) => `
                  <button 
                    onclick="selectModalColor('${c.name}', this)"
                    class="color-swatch ${idx === 0 ? 'active' : ''}" 
                    style="background-color: ${c.hex};" 
                    title="${c.name}"></button>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Quantity Selector -->
          <div class="mt-5">
            <label class="block text-xs font-semibold text-gray-800 uppercase tracking-wider mb-2">Quantity</label>
            <div class="flex items-center border border-gray-300 w-28 rounded-sm">
              <button onclick="decrementModalQty()" class="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 font-bold">-</button>
              <input id="modalQuantity" type="number" value="1" min="1" max="10" class="w-12 text-center text-sm font-semibold border-none focus:outline-none" readonly />
              <button onclick="incrementModalQty()" class="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 font-bold">+</button>
            </div>
          </div>
        </div>

        <!-- Add to cart and CTA -->
        <div class="mt-6 pt-4 border-t border-gray-100 space-y-2">
          <button 
            onclick="addModalToCart(${product.id})"
            class="w-full bg-black text-white text-xs uppercase tracking-wider font-semibold py-3.5 px-4 rounded-sm hover:bg-neutral-800 transition flex items-center justify-center gap-2 shadow">
            <span>Add to Bag</span>
            <span>•</span>
            <span id="modalBtnPrice">${product.price}</span>
          </button>
          
          <div class="flex items-center justify-center gap-4 text-[11px] text-gray-500 pt-2">
            <span>✓ 100% Authentic Quality</span>
            <span>✓ Cash on Delivery</span>
            <span>✓ 7 Days Return</span>
          </div>
        </div>
      </div>
    </div>
  `;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
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
      ${results.slice(0, 8).map(p => `
        <div onclick="closeSearchModal(); openQuickView(${p.id});" class="group cursor-pointer">
          <div class="aspect-square bg-gray-100 rounded-sm overflow-hidden mb-2">
            <img src="${p.image}" alt="${p.title}" class="w-full h-full object-cover group-hover:scale-105 transition" />
          </div>
          <p class="text-xs font-medium text-gray-900 line-clamp-1 group-hover:text-amber-800">${p.title}</p>
          <p class="text-xs font-bold text-gray-800 mt-0.5">${p.price}</p>
        </div>
      `).join('')}
    </div>
  `;
};

/* ==========================================================================
   Checkout System (Optimized for Bangladesh E-commerce)
   ========================================================================== */
window.openCheckoutModal = function () {
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
  const subtotal = AppState.cart.reduce((sum, item) => sum + item.priceNum * item.quantity, 0);
  
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
    preview.innerHTML = AppState.cart.map(item => `
      <div class="flex items-center gap-2 py-2 border-b border-gray-100 text-xs">
        <img src="${item.image}" class="w-10 h-10 object-cover rounded bg-gray-50" />
        <div class="flex-1">
          <p class="font-medium text-gray-900 line-clamp-1">${item.title}</p>
          <p class="text-gray-500">${item.color} × ${item.quantity}</p>
        </div>
        <span class="font-semibold">${formatPrice(item.priceNum * item.quantity)}</span>
      </div>
    `).join('');
  }
}

window.placeOrder = function (e) {
  if (e) e.preventDefault();

  const name = $('#custName').value.trim();
  const phone = $('#custPhone').value.trim();
  const address = $('#custAddress').value.trim();

  if (!name || !phone || !address) {
    showToast('Please fill in your name, phone number, and address.');
    return;
  }

  // Bangladesh phone validation
  if (!/^01[3-9]\d{8}$/.test(phone.replace(/\s+/g, ''))) {
    showToast('Please enter a valid Bangladeshi mobile number (e.g. 01712345678)');
    return;
  }

  const orderId = 'LX-' + Math.floor(100000 + Math.random() * 900000);
  const paymentMethod = $('input[name="paymentMethod"]:checked').value;
  const subtotal = AppState.cart.reduce((sum, item) => sum + item.priceNum * item.quantity, 0);
  
  let shipping = AppState.deliveryFee;
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
    items: JSON.parse(JSON.stringify(AppState.cart)),
    subtotal: subtotal,
    shippingFee: shipping,
    discount: discount,
    couponCode: AppState.couponCode,
    total: grandTotal,
    paymentMethod,
    paymentStatus: paymentMethod === 'Cash on Delivery' ? 'Unpaid (COD)' : 'Paid Online (bKash)',
    orderStatus: 'Pending',
    createdAt: new Date().toISOString()
  };

  // Save order to localStorage for Admin Panel
  try {
    const existingOrders = JSON.parse(localStorage.getItem('luxos_orders')) || [];
    existingOrders.unshift(newOrder);
    localStorage.setItem('luxos_orders', JSON.stringify(existingOrders));

    // Save profile for fast checkout
    const profile = { name, phone, address, zone: AppState.deliveryZone, updatedAt: new Date().toISOString() };
    localStorage.setItem('luxos_user_profile', JSON.stringify(profile));
  } catch (err) {
    console.error('Error saving order', err);
  }

  // Order Confirmed Screen
  const body = $('#checkoutModalContent');
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

      <div class="flex gap-3 justify-center">
        <button onclick="finishCheckout()" class="bg-black text-white text-xs uppercase tracking-wider font-semibold py-3 px-6 rounded-sm hover:bg-neutral-800 transition">
          Continue Shopping
        </button>
        <a href="admin.html" target="_blank" class="border border-black text-black text-xs uppercase tracking-wider font-semibold py-3 px-6 rounded-sm hover:bg-gray-100 transition flex items-center gap-1.5">
          <span>View in Admin</span>
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
        </a>
      </div>
    </div>
  `;

  // Clear cart
  AppState.cart = [];
  saveCart();
  updateCartBadge();
};

window.finishCheckout = function () {
  closeCheckoutModal();
  window.location.reload();
};

/* ==========================================================================
   Interactive "Shop the Look" Hotspots
   ========================================================================== */
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
  const toast = $('#toastNotification');
  const text = $('#toastText');
  if (!toast || !text) return;

  text.textContent = message;
  toast.classList.add('show');

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}

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

window.openAccountModal = function (tab) {
  const profile = getUserProfile();
  const targetTab = tab || (profile ? 'profile' : 'track');

  isProfileEditing = false;
  tempEditPhoto = null;

  if (typeof updateHeaderProfileIcon === 'function') updateHeaderProfileIcon();
  renderAccountTab();
  switchAccountTab(targetTab);

  $('#accountModal').classList.add('active');
  document.body.style.overflow = 'hidden';

  if (targetTab === 'track') {
    setTimeout(() => {
      const input = $('#trackSearchInput');
      if (input) {
        if (!input.value && profile && profile.phone) {
          input.value = profile.phone;
          searchOrderStatus();
        }
        input.focus();
      }
    }, 150);
  }
};

window.closeAccountModal = function () {
  $('#accountModal').classList.remove('active');
  document.body.style.overflow = '';
};

window.switchAccountTab = function (tab) {
  const isTrack = tab === 'track';
  const trackBtn = $('#accountTabTrack');
  const profileBtn = $('#accountTabProfile');
  const trackContent = $('#accountTabContentTrack');
  const profileContent = $('#accountTabContentProfile');

  if (trackBtn) {
    trackBtn.className = isTrack
      ? 'flex-1 py-2.5 text-center border-b-2 border-black text-black font-bold transition'
      : 'flex-1 py-2.5 text-center text-gray-400 hover:text-black border-b-2 border-transparent transition';
  }
  if (profileBtn) {
    profileBtn.className = !isTrack
      ? 'flex-1 py-2.5 text-center border-b-2 border-black text-black font-bold transition'
      : 'flex-1 py-2.5 text-center text-gray-400 hover:text-black border-b-2 border-transparent transition';
  }

  if (trackContent) trackContent.classList.toggle('hidden', !isTrack);
  if (profileContent) {
    profileContent.classList.toggle('hidden', isTrack);
    if (!isTrack) renderAccountTab();
  }
};

window.renderAccountTab = function () {
  const container = $('#accountTabContentProfile');
  if (!container) return;

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
        ${userOrders.length > 0 ? `<button onclick="switchAccountTab('track')" class="text-[11px] text-luxos-gold font-semibold hover:underline">Track with ID &rarr;</button>` : ''}
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

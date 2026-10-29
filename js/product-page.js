/**
 * Luxos - Dedicated Product Landing Page & Customer Reviews Controller
 * Handles PDP dynamic data injection, gallery navigation, countdown timer,
 * variant switching, cart/COD actions, review submissions, and persistence.
 */

// Helper: Query selectors
const $ = selector => document.querySelector(selector);
const $$ = selector => document.querySelectorAll(selector);

// State for current product
let currentProduct = null;
let selectedColor = null;
let currentQuantity = 1;
let selectedStarRating = 5;
let uploadedPhotoData = null;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initProductPage();
  initCountdownTimer();
});

/**
 * Extract product ID from URL query param (?id=1 or ?slug=...)
 */
function getProductIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const idParam = params.get('id');
  if (idParam) return parseInt(idParam, 10);
  
  const slugParam = params.get('slug');
  if (slugParam) {
    const products = typeof getStoreProducts === 'function' ? getStoreProducts() : LUXOS_PRODUCTS;
    const found = products.find(p => p.slug === slugParam);
    if (found) return found.id;
  }
  
  // Default to Product #1 (Executive RFID Card Holder)
  return 1;
}

/**
 * Load and render the product landing page
 */
function initProductPage() {
  const productId = getProductIdFromUrl();
  const allProducts = typeof getStoreProducts === 'function' ? getStoreProducts() : LUXOS_PRODUCTS;
  currentProduct = allProducts.find(p => p.id === productId) || allProducts[0];
  
  if (!currentProduct) return;

  // Set page meta title
  document.title = `${currentProduct.title} | Luxos Official`;
  const metaTitleEl = $('#pageTitle');
  if (metaTitleEl) metaTitleEl.textContent = `${currentProduct.title} | Luxos`;

  // Breadcrumbs
  const breadcrumbCategory = $('#breadcrumbCategory');
  const breadcrumbTitle = $('#breadcrumbTitle');
  if (breadcrumbCategory) breadcrumbCategory.textContent = currentProduct.category || 'Luxury Collection';
  if (breadcrumbTitle) breadcrumbTitle.textContent = currentProduct.title;

  // Setup gallery images
  setupGallery();

  // Setup Product Details / Meta
  renderProductDetails();

  // Setup Details Section below gallery
  renderDetailsSection();

  // Setup and render customer reviews
  initReviewsSection();

  // Setup related products
  renderRelatedProducts();
}

/**
 * Setup thumbnail strip and main image
 */
function setupGallery() {
  const mainImg = $('#mainProductImage');
  const thumbContainer = $('#thumbnailContainer');
  if (!mainImg || !thumbContainer) return;

  // Collect all gallery images
  const images = [];
  if (currentProduct.image) images.push(currentProduct.image);
  if (currentProduct.hoverImage && !images.includes(currentProduct.hoverImage)) {
    images.push(currentProduct.hoverImage);
  }
  if (Array.isArray(currentProduct.gallery)) {
    currentProduct.gallery.forEach(img => {
      if (img && !images.includes(img)) images.push(img);
    });
  }

  // Fallback defaults for Product #1 if needed
  if (currentProduct.id === 1 && images.length < 5) {
    const defaults = [
      'https://thepatchee.com/cdn/shop/files/654a7e83-c512-4ec1-8ebf-af44c488e776.png?v=1781362688',
      'https://thepatchee.com/cdn/shop/files/dc64c41d-ae95-4a7f-912f-1c2a664d35f1.jpg?v=1781362693',
      'https://thepatchee.com/cdn/shop/files/572c906d-1d96-48a7-9724-f99155bba413.jpg?v=1781362696',
      'https://thepatchee.com/cdn/shop/files/7_JDF6Lx.jpg?v=1781362700',
      'https://thepatchee.com/cdn/shop/files/16_oF8xw5.jpg?v=1781362703',
      'https://thepatchee.com/cdn/shop/files/1_Sr7vuQ.jpg?v=1781362706',
      'https://thepatchee.com/cdn/shop/files/17_9tpHkH.jpg?v=1781362710',
      'https://thepatchee.com/cdn/shop/files/18_2rgYCr.jpg?v=1781362713'
    ];
    defaults.forEach(d => { if (!images.includes(d)) images.push(d); });
  }

  // Set initial main image
  mainImg.src = images[0];
  mainImg.alt = currentProduct.title;

  // Render thumbnails
  thumbContainer.innerHTML = images.map((imgUrl, idx) => `
    <button 
      type="button"
      onclick="switchMainImage('${imgUrl}', this)"
      class="thumbnail-btn w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded border ${idx === 0 ? 'border-2 border-black' : 'border-gray-200'} overflow-hidden shrink-0 hover:border-black transition focus:outline-none bg-white p-0.5">
      <img src="${imgUrl}" alt="Thumbnail ${idx + 1}" class="w-full h-full object-cover rounded-sm" />
    </button>
  `).join('');
}

/**
 * Switch main product preview image
 */
window.switchMainImage = function(imgUrl, btnEl) {
  const mainImg = $('#mainProductImage');
  if (mainImg) {
    mainImg.style.opacity = '0.4';
    setTimeout(() => {
      mainImg.src = imgUrl;
      mainImg.style.opacity = '1';
    }, 120);
  }

  // Highlight active thumbnail
  $$('.thumbnail-btn').forEach(btn => {
    btn.classList.remove('border-2', 'border-black');
    btn.classList.add('border-gray-200');
  });
  if (btnEl) {
    btnEl.classList.remove('border-gray-200');
    btnEl.classList.add('border-2', 'border-black');
  }
};

/**
 * Render right column product details
 */
function renderProductDetails() {
  $('#pdpTitle').textContent = currentProduct.title;
  $('#pdpSku').textContent = `SKU: ${currentProduct.sku || '190' + currentProduct.id + '32'}`;
  $('#pdpPrice').textContent = currentProduct.price;
  
  if (currentProduct.originalPrice) {
    $('#pdpOriginalPrice').textContent = currentProduct.originalPrice;
    $('#pdpOriginalPrice').classList.remove('hidden');

    // Calculate savings
    const saleNum = parseInt(currentProduct.price.replace(/[^\d]/g, ''), 10) || 0;
    const origNum = parseInt(currentProduct.originalPrice.replace(/[^\d]/g, ''), 10) || 0;
    const saveAmt = origNum - saleNum;
    if (saveAmt > 0) {
      $('#pdpYouSave').textContent = `YOU SAVE ৳ ${saveAmt.toLocaleString('en-IN')}`;
      $('#pdpYouSaveContainer').classList.remove('hidden');
    }
  } else {
    $('#pdpOriginalPrice').classList.add('hidden');
    $('#pdpYouSaveContainer').classList.add('hidden');
  }

  // Discount badge
  const badgeText = currentProduct.badge || 'SAVE 46%';
  $('#pdpDiscountBadge').textContent = badgeText.toUpperCase();

  // Ratings & review count in top header
  const reviewCount = getProductReviewsCount(currentProduct.id);
  $('#pdpReviewCount').textContent = `${reviewCount} reviews`;
  $('#pdpReviewHeaderCount').textContent = `${reviewCount} reviews`;

  // Render Variant / Color Swatches
  renderVariantSwatches();
}

/**
 * Render color / variant swatches
 */
function renderVariantSwatches() {
  const container = $('#colorSwatchesContainer');
  if (!container) return;

  let colors = currentProduct.colors;
  if (!colors || colors.length === 0) {
    colors = [
      { name: 'Noir Black', hex: '#111111', image: currentProduct.image },
      { name: 'Mocha Brown', hex: '#5A3825' },
      { name: 'Carbon Black', hex: '#252525' },
      { name: 'Tan Camel', hex: '#B57B43' },
      { name: 'Navy Blue', hex: '#1F2E4A' }
    ];
  }

  selectedColor = colors[0].name;
  $('#pdpSelectedColorName').textContent = selectedColor;

  container.innerHTML = colors.map((col, idx) => `
    <button 
      type="button"
      onclick="selectVariantColor('${col.name}', '${col.image || ''}', this)"
      class="variant-swatch-btn group relative border ${idx === 0 ? 'border-2 border-black ring-1 ring-black' : 'border-gray-200'} rounded p-1 flex items-center gap-1.5 hover:border-black transition bg-white"
      title="${col.name}">
      <span class="w-6 h-6 rounded-full border border-gray-300 shadow-inner shrink-0" style="background-color: ${col.hex || '#111'};"></span>
      <span class="text-xs font-medium text-gray-700 pr-1.5 hidden sm:inline-block">${col.name}</span>
      <span class="text-[9px] bg-amber-100 text-amber-800 font-bold px-1 rounded">46%</span>
    </button>
  `).join('');
}

/**
 * Select variant color
 */
window.selectVariantColor = function(colorName, colorImg, btnEl) {
  selectedColor = colorName;
  $('#pdpSelectedColorName').textContent = colorName;

  $$('.variant-swatch-btn').forEach(btn => {
    btn.classList.remove('border-2', 'border-black', 'ring-1', 'ring-black');
    btn.classList.add('border-gray-200');
  });
  if (btnEl) {
    btnEl.classList.remove('border-gray-200');
    btnEl.classList.add('border-2', 'border-black', 'ring-1', 'ring-black');
  }

  // Switch to variant image if available
  if (colorImg) {
    window.switchMainImage(colorImg);
  }
};

/**
 * Quantity controls
 */
window.updatePdpQty = function(delta) {
  const input = $('#pdpQuantity');
  if (!input) return;
  let val = parseInt(input.value, 10) || 1;
  val += delta;
  if (val < 1) val = 1;
  if (val > 10) val = 10;
  input.value = val;
  currentQuantity = val;
};

/**
 * Add To Cart handler
 */
window.handleAddToCartPDP = function() {
  if (!currentProduct) return;
  const qty = parseInt($('#pdpQuantity').value, 10) || 1;
  
  if (typeof addToCart === 'function') {
    addToCart(currentProduct.id, selectedColor, qty);
  } else {
    // Fallback direct storage
    const cart = JSON.parse(localStorage.getItem('luxos_cart')) || [];
    const existing = cart.find(i => i.id === currentProduct.id && i.color === selectedColor);
    if (existing) {
      existing.quantity += qty;
    } else {
      cart.push({
        id: currentProduct.id,
        title: currentProduct.title,
        price: currentProduct.price,
        image: currentProduct.image,
        color: selectedColor,
        quantity: qty
      });
    }
    localStorage.setItem('luxos_cart', JSON.stringify(cart));
    if (typeof updateCartCount === 'function') updateCartCount();
    if (typeof openCartDrawer === 'function') openCartDrawer();
  }

  showToast(`Added ${qty}x ${currentProduct.title} (${selectedColor}) to your bag!`);
};

/**
 * 1-Click Order Now (Cash on Delivery)
 */
window.handleOrderNowCOD = function() {
  if (!currentProduct) return;
  const qty = parseInt($('#pdpQuantity').value, 10) || 1;

  // Add to cart first
  if (typeof addToCart === 'function') {
    addToCart(currentProduct.id, selectedColor, qty);
  } else {
    const cart = JSON.parse(localStorage.getItem('luxos_cart')) || [];
    const existing = cart.find(i => i.id === currentProduct.id && i.color === selectedColor);
    if (existing) {
      existing.quantity += qty;
    } else {
      cart.push({
        id: currentProduct.id,
        title: currentProduct.title,
        price: currentProduct.price,
        image: currentProduct.image,
        color: selectedColor,
        quantity: qty
      });
    }
    localStorage.setItem('luxos_cart', JSON.stringify(cart));
  }

  // Open Checkout Modal directly
  if (typeof openCheckoutModal === 'function') {
    openCheckoutModal();
  } else {
    // Fallback trigger modal
    const checkoutModal = $('#checkoutModal');
    if (checkoutModal) {
      checkoutModal.classList.add('active');
      document.body.style.overflow = 'hidden';
      if (typeof renderCheckoutSummary === 'function') renderCheckoutSummary();
    }
  }
};

/**
 * Render DETAILS: Section below Gallery
 */
function renderDetailsSection() {
  const container = $('#detailsSectionContent');
  if (!container) return;

  // Macro detail images matching user's screenshot
  const macroImages = currentProduct.detailsImages || [
    'https://thepatchee.com/cdn/shop/files/1_Sr7vuQ.jpg?v=1781362706',
    'https://thepatchee.com/cdn/shop/files/15_1Knw4N.jpg?v=1781362716',
    'https://thepatchee.com/cdn/shop/files/dc64c41d-ae95-4a7f-912f-1c2a664d35f1.jpg?v=1781362693'
  ];

  container.innerHTML = `
    <!-- Macro Zoom Feature Images (As shown in screenshot) -->
    <div class="space-y-6">
      ${macroImages.map(img => `
        <div class="rounded-sm overflow-hidden bg-gray-50 border border-gray-100 shadow-sm">
          <img src="${img}" alt="${currentProduct.title} Detail" class="w-full h-auto object-cover" loading="lazy" />
        </div>
      `).join('')}
    </div>

    <!-- Technical Specifications Table -->
    <div class="mt-8 bg-neutral-50 border border-neutral-200 rounded-sm p-6">
      <h4 class="text-xs font-bold uppercase tracking-wider text-gray-900 mb-4 pb-2 border-b border-gray-200">
        Product Specifications &amp; Features
      </h4>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div>
          <span class="text-gray-500 block">Core Architecture:</span>
          <span class="font-semibold text-gray-900">Aerospace Grade Aluminum Alloy Casing</span>
        </div>
        <div>
          <span class="text-gray-500 block">Outer Finish:</span>
          <span class="font-semibold text-gray-900">Handcrafted Textured Vegan Leather</span>
        </div>
        <div>
          <span class="text-gray-500 block">Security Shielding:</span>
          <span class="font-semibold text-gray-900">13.56 MHz RFID / NFC Digital Anti-Theft</span>
        </div>
        <div>
          <span class="text-gray-500 block">Eject Mechanism:</span>
          <span class="font-semibold text-gray-900">Ergonomic One-Touch Step-Card Fan Out</span>
        </div>
        <div>
          <span class="text-gray-500 block">Capacity:</span>
          <span class="font-semibold text-gray-900">6–7 Pop-up Cards + 2 Inner Slots + Cash Band</span>
        </div>
        <div>
          <span class="text-gray-500 block">Warranty Coverage:</span>
          <span class="font-semibold text-gray-900">1-Year Full Structural Replacement</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Countdown Timer
 */
function initCountdownTimer() {
  const daysEl = $('#timerDays');
  const hoursEl = $('#timerHours');
  const minutesEl = $('#timerMinutes');
  const secondsEl = $('#timerSeconds');
  if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

  // Target time: 1 day, 1 hour, 29 mins, 40 secs from initial load
  let totalSeconds = (0 * 86400) + (1 * 3600) + (29 * 60) + 40;

  function update() {
    if (totalSeconds <= 0) {
      totalSeconds = 86400; // Reset
    }
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
 * ==============================================================================
 * Customer Reviews & Rating Engine
 * User Requirement:
 * "ei page er niche sei product er revire golo dekha jabe ar new review dite parbe user"
 * ==============================================================================
 */

// Default Seed Reviews for Products
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

/**
 * Get reviews for a specific product
 */
function getProductReviews(productId) {
  const customReviewsKey = `luxos_product_reviews_${productId}`;
  const storedCustom = JSON.parse(localStorage.getItem(customReviewsKey)) || [];

  // Match default seed reviews
  const seeds = DEFAULT_REVIEWS.filter(r => r.productId === productId || productId === 1);

  // User submitted reviews appear first
  return [...storedCustom, ...seeds];
}

/**
 * Get reviews count
 */
function getProductReviewsCount(productId) {
  const revs = getProductReviews(productId);
  return revs.length > 0 ? revs.length : (currentProduct ? currentProduct.reviewsCount : 65);
}

/**
 * Initialize Reviews Section UI
 */
function initReviewsSection() {
  renderReviewsScorecard();
  renderReviewsList('all');
  initReviewStarsPicker();
}

/**
 * Render the Scorecard & Rating Breakdown
 */
function renderReviewsScorecard() {
  const reviews = getProductReviews(currentProduct.id);
  const total = reviews.length;
  
  let sum = 0;
  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(r => {
    sum += (r.rating || 5);
    counts[r.rating || 5] = (counts[r.rating || 5] || 0) + 1;
  });

  const avg = total > 0 ? (sum / total).toFixed(1) : '4.9';

  $('#scorecardAvgRating').textContent = avg;
  $('#scorecardTotalReviews').textContent = `Based on ${total} verified reviews`;
  $('#scorecardStars').innerHTML = getStarRatingHTML(Math.round(avg));

  // Render distribution bars
  const barsContainer = $('#ratingBarsContainer');
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

/**
 * Render reviews list with filtering
 */
window.renderReviewsList = function(filter = 'all') {
  let reviews = getProductReviews(currentProduct.id);

  if (filter === '5') {
    reviews = reviews.filter(r => r.rating === 5);
  } else if (filter === 'photos') {
    reviews = reviews.filter(r => r.photos && r.photos.length > 0);
  }

  // Update active filter pill
  $$('.review-filter-btn').forEach(btn => {
    btn.classList.remove('bg-black', 'text-white');
    btn.classList.add('bg-gray-100', 'text-gray-700');
  });
  const activeBtn = $(`#reviewFilterBtn_${filter}`);
  if (activeBtn) {
    activeBtn.classList.add('bg-black', 'text-white');
    activeBtn.classList.remove('bg-gray-100', 'text-gray-700');
  }

  const listContainer = $('#reviewsListContainer');
  if (!listContainer) return;

  if (reviews.length === 0) {
    listContainer.innerHTML = `
      <div class="text-center py-12 bg-gray-50 rounded border border-gray-100">
        <p class="text-sm text-gray-500">No reviews found under this filter.</p>
      </div>
    `;
    return;
  }

  listContainer.innerHTML = reviews.map(rev => `
    <div class="p-6 bg-white border border-gray-100 rounded-sm shadow-sm space-y-3 transition hover:shadow-md">
      <!-- Top Line: Author, Badge, Stars, Date -->
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

      <!-- Variant purchased -->
      ${rev.variant ? `
        <div class="text-[11px] text-gray-500 font-medium">
          Color: <span class="text-gray-700">${rev.variant}</span>
        </div>
      ` : ''}

      <!-- Title & Content -->
      <div>
        ${rev.title ? `<h5 class="text-xs font-bold text-gray-900 mb-1">${rev.title}</h5>` : ''}
        <p class="text-xs text-gray-700 leading-relaxed">${rev.content}</p>
      </div>

      <!-- Attached Photos -->
      ${rev.photos && rev.photos.length > 0 ? `
        <div class="flex gap-2 pt-1 flex-wrap">
          ${rev.photos.map(p => `
            <a href="${p}" target="_blank" class="w-16 h-16 rounded border border-gray-200 overflow-hidden shrink-0 hover:opacity-90 transition">
              <img src="${p}" alt="Customer Review Photo" class="w-full h-full object-cover" />
            </a>
          `).join('')}
        </div>
      ` : ''}

      <!-- Helpful button -->
      <div class="pt-2 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-400">
        <button onclick="upvoteReview(this)" class="hover:text-black flex items-center gap-1 transition">
          <span>👍 Helpful</span>
          <span>(${rev.helpfulCount || 0})</span>
        </button>
      </div>
    </div>
  `).join('');
};

/**
 * Star HTML generator
 */
function getStarRatingHTML(rating = 5) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    html += i <= rating ? '★' : '<span class="text-gray-300">★</span>';
  }
  return html;
}

/**
 * Toggle Review Form
 */
window.toggleReviewForm = function() {
  const form = $('#writeReviewFormContainer');
  if (form) {
    form.classList.toggle('hidden');
    if (!form.classList.contains('hidden')) {
      form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
};

/**
 * Star Picker in the review form
 */
function initReviewStarsPicker() {
  const stars = $$('.review-star-picker-btn');
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
  const stars = $$('.review-star-picker-btn');
  stars.forEach(btn => {
    const starVal = parseInt(btn.getAttribute('data-value'), 10);
    btn.textContent = starVal <= val ? '★' : '☆';
    btn.classList.toggle('text-amber-500', starVal <= val);
    btn.classList.toggle('text-gray-300', starVal > val);
  });
  const label = $('#starPickerLabel');
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

/**
 * Handle Photo Attachment in review
 */
window.handleReviewPhotoSelect = function(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    uploadedPhotoData = evt.target.result;
    const preview = $('#reviewPhotoPreview');
    if (preview) {
      preview.src = uploadedPhotoData;
      preview.classList.remove('hidden');
    }
  };
  reader.readAsDataURL(file);
};

/**
 * Submit Review Action
 */
window.handleReviewSubmit = function(e) {
  e.preventDefault();

  const nameInput = $('#reviewAuthorName');
  const cityInput = $('#reviewAuthorCity');
  const titleInput = $('#reviewHeadline');
  const contentInput = $('#reviewBody');
  const variantSelect = $('#reviewVariantSelect');

  const author = nameInput.value.trim();
  const content = contentInput.value.trim();

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

  // Save to localStorage
  const customReviewsKey = `luxos_product_reviews_${currentProduct.id}`;
  const existing = JSON.parse(localStorage.getItem(customReviewsKey)) || [];
  existing.unshift(newReview);
  localStorage.setItem(customReviewsKey, JSON.stringify(existing));

  // Reset form
  e.target.reset();
  uploadedPhotoData = null;
  const preview = $('#reviewPhotoPreview');
  if (preview) preview.classList.add('hidden');
  toggleReviewForm();

  // Re-render scorecard & reviews
  renderReviewsScorecard();
  renderReviewsList('all');

  // Update top count badges
  const count = getProductReviewsCount(currentProduct.id);
  $('#pdpReviewCount').textContent = `${count} reviews`;
  $('#pdpReviewHeaderCount').textContent = `${count} reviews`;

  showToast('Thank you! Your verified review has been published.');
};

/**
 * Upvote helpful review
 */
window.upvoteReview = function(btn) {
  const textEl = btn.querySelector('span:last-child');
  if (textEl && !btn.dataset.voted) {
    btn.dataset.voted = 'true';
    let count = parseInt(textEl.textContent.replace(/[^\d]/g, ''), 10) || 0;
    count++;
    textEl.textContent = `(${count})`;
    btn.classList.add('text-black', 'font-bold');
  }
};

/**
 * Render Related Products carousel
 */
function renderRelatedProducts() {
  const container = $('#relatedProductsGrid');
  if (!container) return;

  const allProducts = typeof getStoreProducts === 'function' ? getStoreProducts() : LUXOS_PRODUCTS;
  const related = allProducts.filter(p => p.id !== currentProduct.id).slice(0, 4);

  container.innerHTML = related.map(p => `
    <div class="product-card group relative bg-white border border-gray-100 rounded-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition">
      <div class="relative aspect-square overflow-hidden bg-gray-50">
        <a href="product.html?id=${p.id}" class="block w-full h-full">
          <img src="${p.image}" alt="${p.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        </a>
        <span class="absolute top-2 left-2 text-[10px] uppercase font-bold bg-black text-white px-2 py-0.5 rounded-sm">${p.badge || 'New'}</span>
      </div>
      <div class="p-3.5 space-y-1">
        <span class="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">${p.category}</span>
        <h4 class="text-xs font-semibold text-gray-900 line-clamp-1">
          <a href="product.html?id=${p.id}" class="hover:text-blue-600 transition">${p.title}</a>
        </h4>
        <div class="flex items-baseline gap-2 pt-1 text-xs">
          <span class="font-bold text-gray-900">${p.price}</span>
          ${p.originalPrice ? `<span class="text-gray-400 line-through text-[11px]">${p.originalPrice}</span>` : ''}
        </div>
      </div>
    </div>
  `).join('');
}

/**
 * Minimal toast notification
 */
function showToast(msg) {
  let toast = $('#luxosToast');
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

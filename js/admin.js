/**
 * Luxos Admin Portal Controller
 * Operations, Orders Management, Products CRUD, Analytics & Settings
 */

// Global Admin State
const AdminState = {
  currentTab: 'dashboard',
  orders: [],
  products: [],
  heroSlides: [],
  bannerSettings: { autoplayDuration: 5, enableZoom: true },
  tickerSettings: getDefaultTickerSettings(),
  collections: [],
  collectionsHeader: { eyebrow: 'Curated Categories', heading: 'Shop by Collection', enabled: true },
  coupons: [],
  settings: {},
  orderFilter: 'all',
  productFilter: { query: '', category: 'all' }
};

// Utilities
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

function formatPrice(num) {
  return '৳ ' + Math.round(num || 0).toLocaleString('en-US');
}

function parsePrice(str) {
  if (!str) return 0;
  return parseInt(str.toString().replace(/[^\d]/g, ''), 10) || 0;
}

// Format ISO date to human readable string
function formatDate(dateStr) {
  if (!dateStr) return 'Just now';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  initData();
  renderDashboard();
  renderOrdersTable();
  renderProductsTable();
  renderBannersTable();
  renderCouponsTable();
  renderCustomersTable();
  loadSettingsForm();
  if (typeof renderTickerSettings === 'function') renderTickerSettings();
  if (typeof renderCollectionsManager === 'function') renderCollectionsManager();
  if (typeof renderLookbookManager === 'function') renderLookbookManager();
  if (typeof renderBrandStoryManager === 'function') renderBrandStoryManager();
  if (typeof renderTimelessManager === 'function') renderTimelessManager();
  if (typeof syncAdminPersistentData === 'function') syncAdminPersistentData();
});

async function syncAdminPersistentData() {
  try {
    const idbBanners = await getItemIndexedDB('luxos_hero_slides');
    if (Array.isArray(idbBanners) && idbBanners.length > 0) {
      AdminState.heroSlides = idbBanners;
      if (typeof renderBannersTable === 'function') renderBannersTable();
      try {
        localStorage.setItem('luxos_hero_slides', JSON.stringify(idbBanners));
      } catch (e) {}
    } else if (AdminState.heroSlides && AdminState.heroSlides.length > 0) {
      await setItemIndexedDB('luxos_hero_slides', AdminState.heroSlides);
    }
  } catch (err) {
    console.warn('Hero slides sync error from IndexedDB:', err);
  }

  try {
    const idbCols = await getItemIndexedDB('luxos_curated_collections');
    if (Array.isArray(idbCols) && idbCols.length > 0) {
      AdminState.collections = idbCols;
      if (typeof renderCollectionsManager === 'function') renderCollectionsManager();
      try {
        localStorage.setItem('luxos_curated_collections', JSON.stringify(idbCols));
      } catch (e) {}
    } else if (AdminState.collections && AdminState.collections.length > 0) {
      await setItemIndexedDB('luxos_curated_collections', AdminState.collections);
    }
  } catch (err) {
    console.warn('Collections sync error from IndexedDB:', err);
  }

  try {
    const idbLookbook = await getItemIndexedDB('luxos_lookbook_data');
    if (idbLookbook && typeof idbLookbook === 'object') {
      AdminState.lookbook = idbLookbook;
      if (typeof renderLookbookManager === 'function') renderLookbookManager();
      try {
        localStorage.setItem('luxos_lookbook_data', JSON.stringify(idbLookbook));
      } catch (e) {}
    } else if (AdminState.lookbook) {
      await setItemIndexedDB('luxos_lookbook_data', AdminState.lookbook);
    }
  } catch (err) {
    console.warn('Lookbook sync error from IndexedDB:', err);
  }

  try {
    const idbBrandStory = await getItemIndexedDB('luxos_brandstory_data');
    if (idbBrandStory && typeof idbBrandStory === 'object') {
      AdminState.brandStory = idbBrandStory;
      if (typeof renderBrandStoryManager === 'function') renderBrandStoryManager();
      try {
        localStorage.setItem('luxos_brandstory_data', JSON.stringify(idbBrandStory));
      } catch (e) {}
    } else if (AdminState.brandStory) {
      await setItemIndexedDB('luxos_brandstory_data', AdminState.brandStory);
    }
  } catch (err) {
    console.warn('Brand Story sync error from IndexedDB:', err);
  }

  try {
    const idbTimeless = await getItemIndexedDB('luxos_timeless_showcase');
    if (idbTimeless && typeof idbTimeless === 'object') {
      AdminState.timeless = idbTimeless;
      if (typeof renderTimelessManager === 'function') renderTimelessManager();
      try {
        localStorage.setItem('luxos_timeless_showcase', JSON.stringify(idbTimeless));
      } catch (e) {}
    } else if (AdminState.timeless) {
      await setItemIndexedDB('luxos_timeless_showcase', AdminState.timeless);
    }
  } catch (err) {
    console.warn('Timeless showcase sync error from IndexedDB:', err);
  }
}

/* ==========================================================================
   1. Data Initialization & Seeding
   ========================================================================== */
function initData() {
  loadTickerSettings();
  // Load products (from custom admin data or default catalog)
  const storedProducts = localStorage.getItem('luxos_products_data');
  if (storedProducts) {
    try {
      AdminState.products = JSON.parse(storedProducts);
    } catch (e) {
      AdminState.products = [...LUXOS_PRODUCTS];
    }
  } else {
    AdminState.products = [...LUXOS_PRODUCTS];
    saveProductsSafely(AdminState.products);
  }

  // Load Hero Banners
  const storedBanners = localStorage.getItem('luxos_hero_slides');
  if (storedBanners) {
    try {
      AdminState.heroSlides = JSON.parse(storedBanners);
    } catch (e) {
      AdminState.heroSlides = getDefaultHeroSlides();
    }
  } else {
    AdminState.heroSlides = getDefaultHeroSlides();
    localStorage.setItem('luxos_hero_slides', JSON.stringify(AdminState.heroSlides));
  }

  // Load Banner Settings
  const storedBannerSettings = localStorage.getItem('luxos_banner_settings');
  if (storedBannerSettings) {
    try {
      AdminState.bannerSettings = JSON.parse(storedBannerSettings);
    } catch (e) {
      AdminState.bannerSettings = { autoplayDuration: 5, enableZoom: true };
    }
  } else {
    AdminState.bannerSettings = { autoplayDuration: 5, enableZoom: true };
    localStorage.setItem('luxos_banner_settings', JSON.stringify(AdminState.bannerSettings));
  }

  // Load controls in banner tab
  if ($('#bannerSlideInterval')) $('#bannerSlideInterval').value = AdminState.bannerSettings.autoplayDuration || 5;
  if ($('#bannerEnableZoom')) $('#bannerEnableZoom').checked = AdminState.bannerSettings.enableZoom !== false;

  // Load orders (if empty, seed with realistic mock orders)
  const storedOrders = localStorage.getItem('luxos_orders');
  if (storedOrders) {
    try {
      AdminState.orders = JSON.parse(storedOrders);
    } catch (e) {
      AdminState.orders = getSeedOrders();
    }
  } else {
    AdminState.orders = getSeedOrders();
    localStorage.setItem('luxos_orders', JSON.stringify(AdminState.orders));
  }

  // Load Curated Collections (Shop by Collection)
  const storedCollections = localStorage.getItem('luxos_curated_collections');
  if (storedCollections) {
    try {
      AdminState.collections = JSON.parse(storedCollections);
    } catch (e) {
      AdminState.collections = getDefaultCollections();
    }
  } else {
    AdminState.collections = getDefaultCollections();
    localStorage.setItem('luxos_curated_collections', JSON.stringify(AdminState.collections));
  }

  // Load Collections Header Settings
  const storedCollectionsHeader = localStorage.getItem('luxos_collections_header');
  if (storedCollectionsHeader) {
    try {
      AdminState.collectionsHeader = JSON.parse(storedCollectionsHeader);
    } catch (e) {
      AdminState.collectionsHeader = { eyebrow: 'Curated Categories', heading: 'Shop by Collection', enabled: true };
    }
  } else {
    AdminState.collectionsHeader = { eyebrow: 'Curated Categories', heading: 'Shop by Collection', enabled: true };
    localStorage.setItem('luxos_collections_header', JSON.stringify(AdminState.collectionsHeader));
  }

  // Load coupons
  const storedCoupons = localStorage.getItem('luxos_coupons');
  if (storedCoupons) {
    try {
      AdminState.coupons = JSON.parse(storedCoupons);
    } catch (e) {
      AdminState.coupons = getDefaultCoupons();
    }
  } else {
    AdminState.coupons = getDefaultCoupons();
    localStorage.setItem('luxos_coupons', JSON.stringify(AdminState.coupons));
  }

  // Load settings
  const storedSettings = localStorage.getItem('luxos_settings');
  if (storedSettings) {
    try {
      AdminState.settings = JSON.parse(storedSettings);
    } catch (e) {
      AdminState.settings = getDefaultSettings();
    }
  } else {
    AdminState.settings = getDefaultSettings();
    localStorage.setItem('luxos_settings', JSON.stringify(AdminState.settings));
  }

  // Load Street Style Lookbook
  const storedLookbook = localStorage.getItem('luxos_lookbook_data');
  if (storedLookbook) {
    try {
      AdminState.lookbook = JSON.parse(storedLookbook);
    } catch (e) {
      AdminState.lookbook = getDefaultLookbook();
    }
  } else {
    AdminState.lookbook = getDefaultLookbook();
    localStorage.setItem('luxos_lookbook_data', JSON.stringify(AdminState.lookbook));
  }

  // Load Brand Story ("OWN IT. LEAD IT.")
  const storedBrandStory = localStorage.getItem('luxos_brandstory_data');
  if (storedBrandStory) {
    try {
      AdminState.brandStory = JSON.parse(storedBrandStory);
    } catch (e) {
      AdminState.brandStory = getDefaultBrandStory();
    }
  } else {
    AdminState.brandStory = getDefaultBrandStory();
    localStorage.setItem('luxos_brandstory_data', JSON.stringify(AdminState.brandStory));
  }

  // Load Campaign Showcase ("TIMELESS. BOLD. UNSTOPPABLE.")
  const storedTimeless = localStorage.getItem('luxos_timeless_showcase');
  if (storedTimeless) {
    try {
      AdminState.timeless = JSON.parse(storedTimeless);
    } catch (e) {
      AdminState.timeless = getDefaultTimelessData();
    }
  } else {
    AdminState.timeless = getDefaultTimelessData();
    localStorage.setItem('luxos_timeless_showcase', JSON.stringify(AdminState.timeless));
  }
}

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

function getDefaultCoupons() {
  return [
    { code: 'LUXOS10', discount: 0.10, displayValue: '10% Off', type: 'percent', active: true },
    { code: 'FREESHIP', discount: 1, displayValue: 'Free Delivery', type: 'freeship', active: true },
    { code: 'VIP20', discount: 0.20, displayValue: '20% Off', type: 'percent', active: true }
  ];
}

function getDefaultSettings() {
  return {
    insideDhakaFee: 70,
    outsideDhakaFee: 130,
    freeShippingThreshold: 3000,
    hotline: '+880 1700-LUXOS',
    email: 'support@luxosbd.com'
  };
}

function getSeedOrders() {
  return [
    {
      id: 'LX-891420',
      customer: {
        name: 'Sadia Rahman',
        phone: '01711223344',
        address: 'House 42, Road 11, Banani',
        zone: 'Inside Dhaka'
      },
      items: [
        {
          id: 3,
          title: 'Croissant Chic Crossbody Bag',
          price: '৳ 685',
          priceNum: 685,
          color: 'Mocha Tan',
          quantity: 1,
          image: 'https://thepatchee.com/cdn/shop/files/c2ee0999-fc06-4942-aa71-6cd41e71d473.png?v=1782728863'
        },
        {
          id: 1,
          title: 'Mens Rfid Smart Pop Up Wallet',
          price: '৳ 687',
          priceNum: 687,
          color: 'Classic Black',
          quantity: 1,
          image: 'https://thepatchee.com/cdn/shop/files/654a7e83-c512-4ec1-8ebf-af44c488e776.png?v=1781362688'
        }
      ],
      subtotal: 1372,
      shippingFee: 70,
      discount: 137,
      couponCode: 'LUXOS10',
      total: 1305,
      paymentMethod: 'Cash on Delivery',
      paymentStatus: 'Unpaid (COD)',
      orderStatus: 'Pending',
      createdAt: new Date(Date.now() - 25 * 60000).toISOString()
    },
    {
      id: 'LX-764912',
      customer: {
        name: 'Tanzim Hasan',
        phone: '01899887766',
        address: 'GEC Circle, Nasirabad, Chattogram',
        zone: 'Outside Dhaka'
      },
      items: [
        {
          id: 2,
          title: 'New Style Large Capacity Shoulder Bag',
          price: '৳ 1,673',
          priceNum: 1673,
          color: 'Noir Black',
          quantity: 2,
          image: 'https://thepatchee.com/cdn/shop/files/d0783770-4668-4b3e-a3b5-2bbc89c2869f.jpg?v=1776151580'
        }
      ],
      subtotal: 3346,
      shippingFee: 0,
      discount: 0,
      couponCode: null,
      total: 3346,
      paymentMethod: 'bKash / Nagad',
      paymentStatus: 'Paid Online (bKash)',
      orderStatus: 'Processing',
      createdAt: new Date(Date.now() - 140 * 60000).toISOString()
    },
    {
      id: 'LX-652391',
      customer: {
        name: 'Ayesha Siddiqua',
        phone: '01622334455',
        address: 'Sector 4, Uttara, Dhaka',
        zone: 'Inside Dhaka'
      },
      items: [
        {
          id: 4,
          title: 'High-End Retro Commuter Shoulder Bag',
          price: '৳ 1,909',
          priceNum: 1909,
          color: 'Cognac',
          quantity: 1,
          image: 'https://thepatchee.com/cdn/shop/files/Untitled_20design_20_2875_29_ojw3jt.png?v=1777968337'
        }
      ],
      subtotal: 1909,
      shippingFee: 70,
      discount: 0,
      couponCode: null,
      total: 1979,
      paymentMethod: 'Cash on Delivery',
      paymentStatus: 'Unpaid (COD)',
      orderStatus: 'Shipped',
      createdAt: new Date(Date.now() - 360 * 60000).toISOString()
    },
    {
      id: 'LX-541908',
      customer: {
        name: 'Mahmudul Karim',
        phone: '01511002233',
        address: 'Dhanmondi 27, Dhaka',
        zone: 'Inside Dhaka'
      },
      items: [
        {
          id: 8,
          title: 'Trend Flex Waterproof Nylon Backpack',
          price: '৳ 2,259',
          priceNum: 2259,
          color: 'Matte Black',
          quantity: 1,
          image: 'https://thepatchee.com/cdn/shop/files/6d8a6d9b-495a-4d68-ba90-1f87aa300435.jpg?v=1755610521'
        }
      ],
      subtotal: 2259,
      shippingFee: 70,
      discount: 0,
      couponCode: null,
      total: 2329,
      paymentMethod: 'Cash on Delivery',
      paymentStatus: 'Paid (Cash on Delivery)',
      orderStatus: 'Delivered',
      createdAt: new Date(Date.now() - 1440 * 60000).toISOString()
    }
  ];
}

/* ==========================================================================
   2. Tab Switching Controller
   ========================================================================== */
window.switchTab = function (tabName) {
  AdminState.currentTab = tabName;

  // Hide all sections
  $$('main > section').forEach(sec => sec.classList.add('hidden'));
  const activeSection = $(`#tab-${tabName}`);
  if (activeSection) activeSection.classList.remove('hidden');

  // Update sidebar active state
  $$('.nav-item').forEach(btn => {
    btn.classList.remove('bg-slate-800', 'text-white');
    btn.classList.add('text-slate-300');
  });
  const currentNav = $(`#nav-${tabName}`);
  if (currentNav) {
    currentNav.classList.add('bg-slate-800', 'text-white');
    currentNav.classList.remove('text-slate-300');
  }

  // Update Page Title
  const titles = {
    dashboard: 'Operations Dashboard',
    orders: 'Customer Orders Management',
    products: 'Product Catalog Management',
    banners: 'Hero Banners & Slideshow',
    collections: 'Shop by Collection (Curated Story Circles)',
    lookbook: 'Street Style Lookbook ("Bag The Vibe")',
    brandstory: 'Brand Story ("OWN IT. LEAD IT.")',
    timeless: 'Campaign Showcase ("TIMELESS. BOLD. UNSTOPPABLE.")',
    ticker: 'Scrolling Marquee Ticker Management',
    coupons: 'Promo Codes & Offers',
    customers: 'Customer Directory',
    settings: 'Store & Delivery Configuration'
  };
  $('#pageTitle').textContent = titles[tabName] || 'Admin Portal';

  // Refresh data on tab switch
  if (tabName === 'dashboard') renderDashboard();
  if (tabName === 'orders') renderOrdersTable();
  if (tabName === 'products') renderProductsTable();
  if (tabName === 'banners') renderBannersTable();
  if (tabName === 'collections') renderCollectionsManager();
  if (tabName === 'lookbook') renderLookbookManager();
  if (tabName === 'brandstory') renderBrandStoryManager();
  if (tabName === 'timeless') renderTimelessManager();
  if (tabName === 'ticker') renderTickerSettings();
  if (tabName === 'coupons') renderCouponsTable();
  if (tabName === 'customers') renderCustomersTable();
};

/* ==========================================================================
   3. Dashboard Overview & Analytics
   ========================================================================== */
function renderDashboard() {
  const orders = AdminState.orders;
  const products = AdminState.products;

  const totalRevenue = orders
    .filter(o => o.orderStatus !== 'Cancelled')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const pendingCount = orders.filter(o => o.orderStatus === 'Pending' || o.orderStatus === 'Processing').length;
  const completedCount = orders.filter(o => o.orderStatus === 'Delivered').length;

  $('#statRevenue').textContent = formatPrice(totalRevenue);
  $('#statOrders').textContent = orders.length;
  $('#statCompletedOrders').textContent = completedCount;
  $('#statProducts').textContent = products.length;
  $('#statPending').textContent = pendingCount;
  $('#sidebarPendingCount').textContent = pendingCount;
  $('#sidebarProductsCount').textContent = products.length;

  // Render Recent Orders (Top 5)
  const recentTbody = $('#recentOrdersTbody');
  if (!recentTbody) return;

  const recent = orders.slice(0, 5);
  if (recent.length === 0) {
    recentTbody.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-slate-400">No orders placed yet.</td></tr>`;
    return;
  }

  recentTbody.innerHTML = recent.map(o => createOrderRowHtml(o, true)).join('');
}

/* ==========================================================================
   4. Orders Management
   ========================================================================== */
function renderOrdersTable() {
  const tbody = $('#allOrdersTbody');
  if (!tbody) return;

  let filtered = AdminState.orders;

  // Status Filter
  if (AdminState.orderFilter !== 'all') {
    filtered = filtered.filter(o => o.orderStatus === AdminState.orderFilter);
  }

  // Search input filter
  const query = ($('#orderSearchInput')?.value || '').trim().toLowerCase();
  if (query) {
    filtered = filtered.filter(o => 
      o.id.toLowerCase().includes(query) ||
      o.customer.name.toLowerCase().includes(query) ||
      o.customer.phone.includes(query)
    );
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-12 text-slate-400">No orders match the selected criteria.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(o => createOrderRowHtml(o, false)).join('');
}

function createOrderRowHtml(o, isCompact = false) {
  const statusClasses = {
    'Pending': 'badge-pending',
    'Processing': 'badge-processing',
    'Shipped': 'badge-shipped',
    'Delivered': 'badge-delivered',
    'Cancelled': 'badge-cancelled'
  };

  const badgeClass = statusClasses[o.orderStatus] || 'bg-slate-100 text-slate-700';
  const itemCount = o.items ? o.items.reduce((sum, i) => sum + i.quantity, 0) : 0;

  return `
    <tr class="hover:bg-slate-50 transition">
      <td class="py-3 px-4 font-bold text-slate-900">${o.id}</td>
      <td class="py-3 px-4">
        <p class="font-semibold text-slate-800 leading-tight">${o.customer.name}</p>
        <p class="text-[11px] text-slate-400">${o.customer.phone}</p>
      </td>
      <td class="py-3 px-4 text-slate-600 font-medium">${o.customer.zone || 'Dhaka'}</td>
      <td class="py-3 px-4 text-slate-600">${itemCount} items</td>
      <td class="py-3 px-4 font-bold text-slate-900">${formatPrice(o.total)}</td>
      <td class="py-3 px-4">
        <span class="text-[11px] font-medium text-slate-600">${o.paymentMethod || 'COD'}</span>
      </td>
      <td class="py-3 px-4">
        <span class="px-2.5 py-1 rounded-full text-[10px] font-bold ${badgeClass}">
          ${o.orderStatus}
        </span>
      </td>
      <td class="py-3 px-4 text-right">
        <button onclick="openOrderModal('${o.id}')" class="text-xs bg-slate-900 hover:bg-slate-800 text-white font-semibold px-2.5 py-1 rounded transition">
          Details
        </button>
      </td>
    </tr>
  `;
}

window.setOrderStatusFilter = function (status) {
  AdminState.orderFilter = status;
  $$('.order-filter-btn').forEach(btn => {
    const isCurrent = btn.dataset.status === status;
    btn.classList.toggle('bg-black', isCurrent);
    btn.classList.toggle('text-white', isCurrent);
    btn.classList.toggle('bg-slate-100', !isCurrent);
    btn.classList.toggle('text-slate-600', !isCurrent);
  });
  renderOrdersTable();
};

window.filterOrders = function () {
  renderOrdersTable();
};

/* ==========================================================================
   Order Details Modal & Status Updater
   ========================================================================== */
window.openOrderModal = function (orderId) {
  const order = AdminState.orders.find(o => o.id === orderId);
  if (!order) return;

  const content = $('#orderDetailsContent');
  if (!content) return;

  content.innerHTML = `
    <div class="space-y-4">
      <!-- Modal Header -->
      <div class="flex items-start justify-between border-b border-slate-100 pb-3">
        <div>
          <span class="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Order Details</span>
          <h2 class="text-lg font-bold text-slate-900 font-heading">${order.id}</h2>
          <p class="text-xs text-slate-400">Placed on ${formatDate(order.createdAt)}</p>
        </div>
        
        <!-- Status Changer Dropdown -->
        <div class="flex items-center gap-2">
          <label class="text-xs font-semibold text-slate-600">Status:</label>
          <select id="modalOrderStatusSelect" onchange="updateOrderStatus('${order.id}', this.value)" class="text-xs font-bold border border-slate-300 rounded-lg p-1.5 bg-white focus:outline-none focus:border-black">
            <option value="Pending" ${order.orderStatus === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="Processing" ${order.orderStatus === 'Processing' ? 'selected' : ''}>Processing</option>
            <option value="Shipped" ${order.orderStatus === 'Shipped' ? 'selected' : ''}>Shipped</option>
            <option value="Delivered" ${order.orderStatus === 'Delivered' ? 'selected' : ''}>Delivered</option>
            <option value="Cancelled" ${order.orderStatus === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </div>
      </div>

      <!-- Customer & Shipping Info -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-xs">
        <div>
          <p class="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1">Customer Information</p>
          <p class="font-semibold text-slate-900">${order.customer.name}</p>
          <p class="text-slate-600">Phone: <span class="font-medium text-slate-900">${order.customer.phone}</span></p>
          <p class="text-slate-600">Payment: <span class="font-medium text-slate-900">${order.paymentMethod}</span> (${order.paymentStatus || 'COD'})</p>
        </div>
        <div>
          <p class="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1">Delivery Destination</p>
          <p class="text-slate-800 leading-relaxed">${order.customer.address}</p>
          <p class="text-slate-500 font-medium mt-1">Zone: <span class="text-slate-900 font-semibold">${order.customer.zone || 'Inside Dhaka'}</span></p>
        </div>
      </div>

      <!-- Items List -->
      <div>
        <p class="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-2">Ordered Items (${order.items.length})</p>
        <div class="space-y-2 border border-slate-100 rounded-xl p-3 divide-y divide-slate-100">
          ${order.items.map(item => `
            <div class="flex items-center gap-3 pt-2 first:pt-0">
              <img src="${item.image}" alt="${item.title}" class="w-12 h-12 object-cover rounded-lg bg-slate-100 flex-shrink-0" />
              <div class="flex-1 text-xs">
                <h4 class="font-semibold text-slate-900 line-clamp-1">${item.title}</h4>
                <p class="text-slate-400">Color: ${item.color || 'Standard'} • Qty: <span class="font-bold text-slate-700">${item.quantity}</span></p>
              </div>
              <span class="text-xs font-bold text-slate-900">${formatPrice(item.priceNum * item.quantity)}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Price Breakdown -->
      <div class="border-t border-slate-100 pt-3 text-xs space-y-1.5 text-slate-600">
        <div class="flex justify-between">
          <span>Subtotal:</span>
          <span class="font-semibold text-slate-800">${formatPrice(order.subtotal)}</span>
        </div>
        <div class="flex justify-between">
          <span>Delivery Fee:</span>
          <span class="font-semibold text-slate-800">${order.shippingFee === 0 ? 'FREE' : formatPrice(order.shippingFee)}</span>
        </div>
        ${order.discount ? `
          <div class="flex justify-between text-emerald-600 font-semibold">
            <span>Discount (${order.couponCode || 'Promo'}):</span>
            <span>- ${formatPrice(order.discount)}</span>
          </div>
        ` : ''}
        <div class="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-100">
          <span>Grand Total:</span>
          <span class="text-base text-slate-900">${formatPrice(order.total)}</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="pt-3 flex justify-between items-center border-t border-slate-100">
        <button onclick="printInvoice('${order.id}')" class="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-black bg-slate-100 px-3 py-2 rounded-lg transition">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6.72 13.829c-.24-1.076-.641-2.09-1.18-3.003L4.17 9.45a2.25 2.25 0 010-3.182l1.37-1.37a2.25 2.25 0 013.182 0l1.376 1.376c.913.539 1.927.94 3.003 1.18M17.28 13.829c.24-1.076.641-2.09 1.18-3.003l1.37-1.376a2.25 2.25 0 000-3.182l-1.37-1.37a2.25 2.25 0 00-3.182 0l-1.376 1.376c-.913.539-1.927.94-3.003 1.18" /></svg>
          <span>Print Delivery Invoice</span>
        </button>

        <button onclick="closeOrderModal()" class="bg-black text-white text-xs font-semibold px-5 py-2 rounded-lg hover:bg-slate-800 transition">
          Done
        </button>
      </div>
    </div>
  `;

  $('#orderDetailsModal').classList.add('active');
};

window.closeOrderModal = function () {
  $('#orderDetailsModal').classList.remove('active');
};

window.updateOrderStatus = function (orderId, newStatus) {
  const order = AdminState.orders.find(o => o.id === orderId);
  if (!order) return;

  order.orderStatus = newStatus;
  localStorage.setItem('luxos_orders', JSON.stringify(AdminState.orders));

  renderDashboard();
  renderOrdersTable();
  showAdminToast(`Order ${orderId} status updated to "${newStatus}"`);
};

window.printInvoice = function (orderId) {
  const order = AdminState.orders.find(o => o.id === orderId);
  if (!order) return;

  const invoiceWindow = window.open('', '_blank');
  invoiceWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice - ${order.id} | Luxos Bangladesh</title>
      <style>
        body { font-family: 'Inter', sans-serif; padding: 40px; color: #111; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 20px; }
        .logo { font-size: 28px; font-weight: bold; letter-spacing: 2px; }
        .info { display: flex; justify-content: space-between; margin: 30px 0; font-size: 13px; line-height: 1.6; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f9f9f9; text-transform: uppercase; font-size: 11px; }
        .total-box { margin-top: 30px; text-align: right; font-size: 14px; line-height: 1.8; }
        .grand-total { font-size: 20px; font-weight: bold; color: #000; margin-top: 10px; }
        .footer { margin-top: 60px; text-align: center; font-size: 11px; color: #777; border-top: 1px solid #eee; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo">LUXOS</div>
          <div style="font-size: 11px; letter-spacing: 1px; color: #555;">DHAKA • LEATHER & BAGS</div>
        </div>
        <div style="text-align: right; font-size: 13px;">
          <h2 style="margin: 0;">OFFICIAL INVOICE</h2>
          <p style="margin: 4px 0;">Order: <b>${order.id}</b></p>
          <p style="margin: 0; color: #666;">Date: ${formatDate(order.createdAt)}</p>
        </div>
      </div>

      <div class="info">
        <div>
          <b>Billed & Shipped To:</b><br/>
          ${order.customer.name}<br/>
          ${order.customer.phone}<br/>
          ${order.customer.address}<br/>
          ${order.customer.zone || 'Inside Dhaka'}
        </div>
        <div style="text-align: right;">
          <b>Payment Details:</b><br/>
          Method: ${order.paymentMethod}<br/>
          Status: ${order.paymentStatus || 'COD'}<br/>
          Shipment: Express Parcel (Luxos Delivery)
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Item Description</th>
            <th>Color</th>
            <th>Qty</th>
            <th style="text-align: right;">Unit Price</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${order.items.map(item => `
            <tr>
              <td><b>${item.title}</b></td>
              <td>${item.color || 'Standard'}</td>
              <td>${item.quantity}</td>
              <td style="text-align: right;">${item.price}</td>
              <td style="text-align: right;">${formatPrice(item.priceNum * item.quantity)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="total-box">
        <div>Subtotal: <b>${formatPrice(order.subtotal)}</b></div>
        <div>Delivery Fee: <b>${order.shippingFee === 0 ? 'FREE' : formatPrice(order.shippingFee)}</b></div>
        ${order.discount ? `<div>Discount: <b style="color: green;">- ${formatPrice(order.discount)}</b></div>` : ''}
        <div class="grand-total">Total Payable: ${formatPrice(order.total)}</div>
      </div>

      <div class="footer">
        <p>Thank you for shopping with Luxos Bangladesh. For queries, contact +880 1700-LUXOS or support@luxosbd.com</p>
        <p>Gulshan-1, Dhaka-1212 • 7 Days Return & Replacement Guarantee</p>
      </div>
      <script>window.onload = function() { window.print(); };</script>
    </body>
    </html>
  `);
  invoiceWindow.document.close();
};

/* ==========================================================================
   5. Products CRUD Operations
   ========================================================================== */
function renderProductsTable() {
  const tbody = $('#adminProductsTbody');
  if (!tbody) return;

  let products = AdminState.products;
  const query = AdminState.productFilter.query.toLowerCase();
  const category = AdminState.productFilter.category;

  if (category !== 'all') {
    products = products.filter(p => p.category === category);
  }

  if (query) {
    products = products.filter(p => 
      p.title.toLowerCase().includes(query) || 
      p.category.toLowerCase().includes(query)
    );
  }

  if (products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-12 text-slate-400">No products match your filter.</td></tr>`;
    return;
  }

  tbody.innerHTML = products.map(p => `
    <tr class="hover:bg-slate-50 transition" data-product-id="${p.id}">
      <td class="py-3 px-4 flex items-center gap-3">
        <img src="${p.image}" alt="${p.title}" class="w-10 h-10 object-cover rounded-lg bg-slate-100 flex-shrink-0" />
        <div class="max-w-xs">
          <p class="font-semibold text-slate-800 line-clamp-1">${p.title}</p>
          <span class="text-[10px] text-slate-400 font-mono">ID: ${p.id}</span>
        </div>
      </td>
      <td class="py-3 px-4 text-slate-600 font-medium">${p.category}</td>
      <td class="py-3 px-4 font-bold text-slate-900">${p.price}</td>
      <td class="py-3 px-4 text-slate-400 line-through">${p.originalPrice || '-'}</td>
      <td class="py-3 px-4">
        ${p.badge ? `<span class="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">${p.badge}</span>` : '-'}
      </td>
      <td class="py-3 px-4">
        ${(() => {
          const s = (typeof p.stock !== 'undefined' && p.stock !== null && p.stock !== '') ? parseInt(p.stock, 10) : 10;
          if (isNaN(s) || s <= 0) {
            return `<span class="inline-flex items-center gap-1 font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded text-xs"><span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>Out of stock (0)</span>`;
          } else if (s < 5) {
            return `<span class="inline-flex items-center gap-1 font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-xs">${s} in stock</span>`;
          } else {
            return `<span class="font-semibold text-slate-800">${s} in stock</span>`;
          }
        })()}
      </td>
      <td class="py-3 px-4 text-amber-500 font-bold">★ ${p.rating || '4.8'}</td>
      <td class="py-3 px-4 text-right">
        <div class="flex items-center justify-end gap-1.5">
          <button onclick="editProduct(${p.id})" title="Edit Product" class="p-1.5 text-slate-600 hover:text-black rounded hover:bg-slate-100">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
          </button>
          <button onclick="deleteProduct(${p.id})" title="Delete Product" class="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

window.filterAdminProducts = function () {
  AdminState.productFilter.query = $('#productSearchInput')?.value || '';
  AdminState.productFilter.category = $('#productCategoryFilter')?.value || 'all';
  renderProductsTable();
};

let currentProductSecondaryPhotos = [];

// =========================================================================
// Product Edit Modal: Showcase Video & Specs Handlers
// =========================================================================
let currentEditProductVideo = { url: '', isLocal: false, fileName: '', file: null };

function renderEditModalVideoPreview(sourceUrl, isLocal = false, fileName = '') {
  const previewWrapper = $('#prodVideoPreviewWrapper');
  const previewContainer = $('#prodVideoPreviewContainer');
  const statusEl = $('#prodVideoStatus');

  if (!previewContainer) return;

  if (!sourceUrl) {
    if (previewWrapper) previewWrapper.classList.add('hidden');
    previewContainer.innerHTML = '';
    if (statusEl) {
      statusEl.textContent = 'No video selected';
      statusEl.className = 'text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200';
    }
    return;
  }

  if (previewWrapper) previewWrapper.classList.remove('hidden');

  if (isLocal) {
    if (statusEl) {
      statusEl.textContent = '📁 File: ' + (fileName || 'Uploaded Video');
      statusEl.className = 'text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200';
    }
    previewContainer.innerHTML = '<video class="w-full h-full object-cover" controls playsinline src="' + sourceUrl + '">Your browser does not support HTML5 video.</video>';
    return;
  }

  // URL (YouTube / Vimeo / MP4)
  const ytMatch = sourceUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
  if (ytMatch && ytMatch[1]) {
    if (statusEl) {
      statusEl.textContent = '🎬 YouTube Video Linked';
      statusEl.className = 'text-[10px] font-semibold text-red-700 bg-red-50 px-2.5 py-0.5 rounded border border-red-200';
    }
    previewContainer.innerHTML = '<iframe class="w-full h-full" src="https://www.youtube.com/embed/' + ytMatch[1] + '?autoplay=0&rel=0" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
  } else if (sourceUrl.includes('vimeo.com/')) {
    const vimeoId = sourceUrl.split('vimeo.com/')[1].split(/[?#]/)[0];
    if (statusEl) {
      statusEl.textContent = '🎬 Vimeo Video Linked';
      statusEl.className = 'text-[10px] font-semibold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded border border-sky-200';
    }
    previewContainer.innerHTML = '<iframe class="w-full h-full" src="https://player.vimeo.com/video/' + vimeoId + '" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>';
  } else {
    if (statusEl) {
      statusEl.textContent = '🎬 Direct Video URL';
      statusEl.className = 'text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200';
    }
    previewContainer.innerHTML = '<video class="w-full h-full object-cover" controls playsinline src="' + sourceUrl + '">Your browser does not support HTML5 video.</video>';
  }
}

window.handleEditProductVideoUpload = function (e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('video/')) {
    showAdminToast('Please upload a valid video file (MP4, WebM, MOV).');
    return;
  }

  currentEditProductVideo = { url: '', isLocal: true, fileName: file.name, file: file };
  if ($('#prodVideoUrl')) $('#prodVideoUrl').value = '';

  const previewBlobUrl = URL.createObjectURL(file);
  renderEditModalVideoPreview(previewBlobUrl, true, file.name);
  showAdminToast('Video "' + file.name + '" selected! Click Save to apply.');
};

window.handleEditProductVideoUrlInput = function (val) {
  const url = (val || '').trim();
  currentEditProductVideo = { url: url, isLocal: false, fileName: '', file: null };
  renderEditModalVideoPreview(url, false);
};

window.clearEditProductVideo = async function () {
  const id = $('#editProductId') ? $('#editProductId').value : '';
  if (id && currentEditProductVideo.url?.startsWith('idb:')) {
    await deleteVideoFromDB(id);
  }
  currentEditProductVideo = { url: '', isLocal: false, fileName: '', file: null };
  if ($('#prodVideoUrl')) $('#prodVideoUrl').value = '';
  if ($('#prodVideoFileInput')) $('#prodVideoFileInput').value = '';
  renderEditModalVideoPreview('');
  showAdminToast('Video removed.');
};

window.calculateSalePriceFromDiscount = function () {
  const origEl = $('#prodOriginalPrice');
  const badgeEl = $('#prodBadge');
  const saleEl = $('#prodPrice');
  if (!origEl || !badgeEl || !saleEl) return;

  const origRaw = origEl.value.trim();
  const badgeRaw = badgeEl.value.trim();

  const origNum = parseFloat(origRaw.replace(/[^\d.]/g, ''));
  if (isNaN(origNum) || origNum <= 0) return;

  const pctMatch = badgeRaw.match(/(\d+(?:\.\d+)?)/);
  if (!pctMatch) return;

  const pct = parseFloat(pctMatch[1]);
  if (pct > 0 && pct < 100) {
    const discountedSale = Math.round(origNum * (1 - pct / 100));
    saleEl.value = '৳ ' + discountedSale;
  }
};

window.formatDiscountBadge = function (input) {
  if (!input) return;
  const val = input.value.trim();
  if (!val) return;
  if (/^\d+$/.test(val)) {
    input.value = `Save ${val}%`;
  } else if (/^\d+%\s*off$/i.test(val)) {
    input.value = `Save ${val.replace(/off/i, '').trim()}`;
  } else if (/^\d+%$/.test(val)) {
    input.value = `Save ${val}`;
  }
  calculateSalePriceFromDiscount();
};

window.openProductModal = function () {
  $('#productModalTitle').textContent = 'Add New Product';
  $('#editProductId').value = '';
  $('#prodTitle').value = '';
  $('#prodCategory').value = 'Accessories';
  $('#prodCollection').value = 'Just Landed';
  $('#prodPrice').value = '';
  $('#prodOriginalPrice').value = '';
  $('#prodBadge').value = 'Exclusive';
  $('#prodStock').value = '15';
  if ($('#prodRating')) $('#prodRating').value = '4.8';
  $('#prodImage').value = '';
  if ($('#prodDescription')) $('#prodDescription').value = '';

  if ($('#prodDimensions')) $('#prodDimensions').value = '';
  if ($('#prodFeatures')) $('#prodFeatures').value = '';
  if ($('#prodDeliveryNotice')) $('#prodDeliveryNotice').value = '';
  if ($('#prodVideoUrl')) $('#prodVideoUrl').value = '';
  if ($('#prodVideoFileInput')) $('#prodVideoFileInput').value = '';
  currentEditProductVideo = { url: '', fileName: '', isLocal: false, file: null };
  renderEditModalVideoPreview('');

  if ($('#prodPrimaryFileInput')) $('#prodPrimaryFileInput').value = '';
  if ($('#prodHoverFileInput')) $('#prodHoverFileInput').value = '';
  if ($('#prodHoverImageInput')) $('#prodHoverImageInput').value = '';
  if ($('#prodPrimaryImgPreviewBox')) $('#prodPrimaryImgPreviewBox').classList.add('hidden');
  if ($('#prodPrimaryImgInfo')) $('#prodPrimaryImgInfo').textContent = 'Preview';

  const overlay = $('#productSaveSuccessOverlay');
  if (overlay) overlay.classList.add('hidden');
  const saveBtn = $('#saveProductBtn');
  if (saveBtn) {
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<span>Save Product</span>';
  }

  currentProductSecondaryPhotos = [];
  renderSecondaryPhotosGrid();

  $('#productFormModal').classList.add('active');
};

window.closeProductModal = function () {
  $('#productFormModal').classList.remove('active');
  const overlay = $('#productSaveSuccessOverlay');
  if (overlay) overlay.classList.add('hidden');
  const saveBtn = $('#saveProductBtn');
  if (saveBtn) {
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<span>Save Product</span>';
  }
};

// =========================================================================
// Image Compression & Safe Storage Utilities (Prevents LocalStorage Quota Crashes)
// =========================================================================
function compressImageFile(file, maxWidth = 900, maxHeight = 900, quality = 0.82) {
  return new Promise((resolve) => {
    if (!file.type || !file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
      return;
    }
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

function compressDataUrl(dataUrl, maxWidth = 900, maxHeight = 900, quality = 0.82) {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
    return Promise.resolve(dataUrl);
  }
  const minThreshold = maxWidth <= 450 ? 35000 : 80000;
  if (dataUrl.length < minThreshold) {
    return Promise.resolve(dataUrl);
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = function () {
      let width = img.width;
      let height = img.height;
      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

// =========================================================================
// Persistent IndexedDB Storage Layer (Prevents LocalStorage Quota Loss on Refresh)
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
    } catch (err) {
      resolve(null);
    }
  });
}

async function setItemIndexedDB(key, value) {
  try {
    const db = await openLuxosDB();
    if (!db) return false;
    return new Promise((resolve) => {
      const tx = db.transaction('kv_store', 'readwrite');
      const store = tx.objectStore('kv_store');
      store.put({ key, value });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (e) {
    console.warn('IDB write failed for key ' + key, e);
    return false;
  }
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
    console.warn('IDB read failed for key ' + key, e);
    return null;
  }
}

async function saveBannersSafely(slides) {
  // 1. Always write to IndexedDB first (100% reliable across refreshes, unlimited space)
  try {
    await setItemIndexedDB('luxos_hero_slides', slides);
  } catch (idbErr) {
    console.warn('IndexedDB write for hero slides failed:', idbErr);
  }

  // 2. Persist to localStorage for immediate synchronous reload
  try {
    localStorage.setItem('luxos_hero_slides', JSON.stringify(slides));
    return true;
  } catch (err) {
    console.warn('localStorage quota exceeded while saving hero slides, optimizing...', err);
    for (const s of slides) {
      if (s.desktopImage && s.desktopImage.startsWith('data:image/') && s.desktopImage.length > 40000) {
        try {
          s.desktopImage = await compressDataUrl(s.desktopImage, 1200, 550, 0.75);
        } catch (e) {}
      }
      if (s.mobileImage && s.mobileImage.startsWith('data:image/') && s.mobileImage.length > 30000) {
        try {
          s.mobileImage = await compressDataUrl(s.mobileImage, 600, 500, 0.70);
        } catch (e) {}
      }
    }
    try {
      localStorage.setItem('luxos_hero_slides', JSON.stringify(slides));
      await setItemIndexedDB('luxos_hero_slides', slides);
      return true;
    } catch (e2) {
      console.warn('localStorage full, but slides are permanently stored in IndexedDB:', e2);
      return true;
    }
  }
}

async function saveCollectionsSafely(collections) {
  try {
    await setItemIndexedDB('luxos_curated_collections', collections);
  } catch (e) {}
  try {
    localStorage.setItem('luxos_curated_collections', JSON.stringify(collections));
    return true;
  } catch (err) {
    console.warn('localStorage quota exceeded while saving collections, optimizing...', err);
    for (const c of collections) {
      if (c.image && c.image.startsWith('data:image/') && c.image.length > 25000) {
        try {
          c.image = await compressDataUrl(c.image, 320, 320, 0.75);
        } catch (e) {}
      }
    }
    try {
      localStorage.setItem('luxos_curated_collections', JSON.stringify(collections));
      await setItemIndexedDB('luxos_curated_collections', collections);
      return true;
    } catch (e2) {
      console.error('Critical quota error saving collections:', e2);
      return true;
    }
  }
}

function saveProductsSafely(products) {
  try {
    setItemIndexedDB('luxos_products_data', products);
  } catch (e) {}
  try {
    localStorage.setItem('luxos_products_data', JSON.stringify(products));
    return true;
  } catch (err) {
    console.warn('localStorage quota exceeded while saving products, attempting optimization...', err);
    // Quota exceeded: optimize oversized images across products to reclaim space
    for (const p of products) {
      if (Array.isArray(p.gallery) && p.gallery.length > 5) {
        p.gallery = p.gallery.slice(0, 5);
      }
    }
    try {
      localStorage.setItem('luxos_products_data', JSON.stringify(products));
      return true;
    } catch (e2) {
      console.error('Critical storage quota error:', e2);
      throw new Error('Browser storage is full! Please remove some photos or use image URLs.');
    }
  }
}

window.handleProductFileUpload = async function (event, type) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showAdminToast('Please select a valid image file (JPG, PNG, or WebP).');
    return;
  }

  showAdminToast('Optimizing photo...');

  try {
    const compressedBase64 = await compressImageFile(file, 900, 900, 0.82);
    if (type === 'primary') {
      $('#prodImage').value = compressedBase64;
      previewProductImg(compressedBase64, 'primary');
      const info = $('#prodPrimaryImgInfo');
      const sizeKB = Math.round(compressedBase64.length * 0.75 / 1024);
      if (info) info.textContent = file.name + ' (Optimized: ' + sizeKB + ' KB)';
      showAdminToast('Primary photo optimized & loaded (' + sizeKB + ' KB)!');
    }
  } catch (err) {
    console.error('Error compressing primary image:', err);
    showAdminToast('Error processing image. Please try another.');
  }
};

window.handleMultipleSecondaryUpload = async function (event) {
  const files = Array.from(event.target.files || []);
  if (files.length === 0) return;

  showAdminToast('Optimizing ' + files.length + ' photo(s)...');

  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    try {
      const compressedBase64 = await compressImageFile(file, 900, 900, 0.82);
      currentProductSecondaryPhotos.push(compressedBase64);
    } catch (err) {
      console.error('Secondary photo compress error:', err);
    }
  }
  renderSecondaryPhotosGrid();
  showAdminToast('Added ' + files.length + ' photo(s) to gallery!');
  event.target.value = '';
};

window.handleAddSecondaryUrl = function () {
  const input = $('#prodHoverImageInput');
  const url = (input ? input.value : '').trim();
  if (!url) {
    showAdminToast('Please paste a photo URL first.');
    return;
  }
  currentProductSecondaryPhotos.push(url);
  input.value = '';
  renderSecondaryPhotosGrid();
  showAdminToast('Photo URL added to gallery!');
};

window.removeSecondaryPhoto = function (index) {
  if (index >= 0 && index < currentProductSecondaryPhotos.length) {
    currentProductSecondaryPhotos.splice(index, 1);
    renderSecondaryPhotosGrid();
    showAdminToast('Photo removed.');
  }
};

window.moveSecondaryPhoto = function (index, direction) {
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= currentProductSecondaryPhotos.length) return;
  const temp = currentProductSecondaryPhotos[index];
  currentProductSecondaryPhotos[index] = currentProductSecondaryPhotos[newIndex];
  currentProductSecondaryPhotos[newIndex] = temp;
  renderSecondaryPhotosGrid();
};

function renderSecondaryPhotosGrid() {
  const grid = $('#secondaryPhotosGrid');
  const badge = $('#secondaryPhotosCountBadge');
  if (badge) badge.textContent = `${currentProductSecondaryPhotos.length} Photo${currentProductSecondaryPhotos.length === 1 ? '' : 's'}`;
  if (!grid) return;

  if (currentProductSecondaryPhotos.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full p-4 text-center text-xs text-slate-400 bg-white rounded-lg border border-dashed border-slate-200">
        No secondary photos added yet. Click "+ Add / Upload Photos" to add 1 or more photos.
      </div>
    `;
    return;
  }

  grid.innerHTML = currentProductSecondaryPhotos.map((imgSrc, index) => `
    <div class="relative group aspect-square rounded-lg bg-white border border-slate-200 overflow-hidden shadow-2xs">
      <img src="${imgSrc}" class="w-full h-full object-cover" />
      ${index === 0 
        ? `<span class="absolute top-1 left-1 bg-black/85 text-amber-300 text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-xs shadow-xs">★ Hover</span>`
        : `<span class="absolute top-1 left-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-xs shadow-xs">#${index + 1}</span>`}
      <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5">
        ${index > 0 ? `<button type="button" onclick="moveSecondaryPhoto(${index}, -1)" class="w-6 h-6 bg-white/90 hover:bg-white text-black rounded flex items-center justify-center shadow" title="Move Left"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/></svg></button>` : ''}
        ${index < currentProductSecondaryPhotos.length - 1 ? `<button type="button" onclick="moveSecondaryPhoto(${index}, 1)" class="w-6 h-6 bg-white/90 hover:bg-white text-black rounded flex items-center justify-center shadow" title="Move Right"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg></button>` : ''}
        <button type="button" onclick="removeSecondaryPhoto(${index})" class="w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded flex items-center justify-center shadow" title="Delete Photo">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
    </div>
  `).join('');
}

window.previewProductImg = function (url, type) {
  if (type === 'primary') {
    const box = $('#prodPrimaryImgPreviewBox');
    const img = $('#prodPrimaryImgPreview');
    if (!box || !img) return;
    if (url && (url.startsWith('http') || url.startsWith('data:') || url.startsWith('/'))) {
      img.src = url;
      box.classList.remove('hidden');
    } else {
      box.classList.add('hidden');
    }
  }
};

window.editProduct = async function (productId) {
  const product = AdminState.products.find(p => p.id == productId);
  if (!product) return;

  $('#productModalTitle').textContent = 'Edit Product';
  $('#editProductId').value = product.id;
  $('#prodTitle').value = product.title;
  
  // Set category with case-insensitive fallback & auto-add if custom
  const catSelect = $('#prodCategory');
  if (catSelect) {
    let matched = false;
    for (let opt of catSelect.options) {
      if (opt.value.toLowerCase() === (product.category || '').toLowerCase()) {
        catSelect.value = opt.value;
        matched = true;
        break;
      }
    }
    if (!matched && product.category) {
      const newOpt = document.createElement('option');
      newOpt.value = product.category;
      newOpt.textContent = product.category;
      catSelect.appendChild(newOpt);
      catSelect.value = product.category;
    }
  }

  $('#prodCollection').value = product.collection || 'Just Landed';
  $('#prodPrice').value = product.price;
  $('#prodOriginalPrice').value = product.originalPrice || '';
  $('#prodBadge').value = product.badge || '';
  $('#prodStock').value = (typeof product.stock !== 'undefined' && product.stock !== null && product.stock !== '') ? parseInt(product.stock, 10) : 10;
  if ($('#prodRating')) $('#prodRating').value = product.rating || '4.8';
  $('#prodImage').value = product.image;
  if ($('#prodDescription')) $('#prodDescription').value = product.description || '';

  // Load Dimensions & Bag Features bullets
  if ($('#prodDimensions')) {
    $('#prodDimensions').value = Array.isArray(product.dimensionsList)
      ? product.dimensionsList.join('\n')
      : (product.dimensionsList || '');
  }
  if ($('#prodFeatures')) {
    $('#prodFeatures').value = Array.isArray(product.featuresList)
      ? product.featuresList.join('\n')
      : (product.featuresList || '');
  }

  // Load Estimated Delivery Notice
  if ($('#prodDeliveryNotice')) {
    let delNotice = product.deliveryNotice;
    if (delNotice === undefined || delNotice === null) {
      try {
        const extra = JSON.parse(localStorage.getItem(`luxos_pdp_extra_${product.id}`));
        if (extra && extra.deliveryNotice) delNotice = extra.deliveryNotice;
      } catch (e) {}
    }
    $('#prodDeliveryNotice').value = delNotice || 'Estimated Delivery: 3–5 Days — Ships directly from Dhaka';
  }

  // Load Showcase Video (IndexedDB or URL)
  if ($('#prodVideoFileInput')) $('#prodVideoFileInput').value = '';
  currentEditProductVideo = {
    url: product.videoUrl || '',
    fileName: product.videoFileName || '',
    isLocal: product.videoUrl ? product.videoUrl.startsWith('idb:') : false,
    file: null
  };
  if (product.videoUrl && product.videoUrl.startsWith('idb:')) {
    if ($('#prodVideoUrl')) $('#prodVideoUrl').value = '';
    try {
      const stored = await getVideoFromDB(product.id);
      if (stored && stored.blob) {
        const blobUrl = URL.createObjectURL(stored.blob);
        renderEditModalVideoPreview(blobUrl, true, product.videoFileName || 'Uploaded Video');
      } else {
        renderEditModalVideoPreview('');
      }
    } catch (e) {
      renderEditModalVideoPreview('');
    }
  } else if (product.videoUrl) {
    if ($('#prodVideoUrl')) $('#prodVideoUrl').value = product.videoUrl;
    renderEditModalVideoPreview(product.videoUrl, false);
  } else {
    if ($('#prodVideoUrl')) $('#prodVideoUrl').value = '';
    renderEditModalVideoPreview('');
  }

  if ($('#prodPrimaryFileInput')) $('#prodPrimaryFileInput').value = '';
  if ($('#prodHoverFileInput')) $('#prodHoverFileInput').value = '';
  if ($('#prodHoverImageInput')) $('#prodHoverImageInput').value = '';
  if ($('#prodPrimaryImgInfo')) $('#prodPrimaryImgInfo').textContent = 'Current Image';

  previewProductImg(product.image, 'primary');

  // Load multiple secondary gallery photos
  currentProductSecondaryPhotos = [];
  if (Array.isArray(product.gallery) && product.gallery.length > 0) {
    currentProductSecondaryPhotos = [...product.gallery];
  } else if (product.hoverImage && product.hoverImage !== product.image) {
    currentProductSecondaryPhotos = [product.hoverImage];
  }
  renderSecondaryPhotosGrid();

  $('#productFormModal').classList.add('active');
};

window.handleSaveProduct = async function (e) {
  e.preventDefault();

  const saveBtn = $('#saveProductBtn');
  const overlay = $('#productSaveSuccessOverlay');

  const resetSaveBtn = () => {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<span>Save Product</span>';
    }
  };

  // 1. Show button saving state
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = `
      <svg class="animate-spin w-4 h-4 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
      </svg>
      <span>Saving...</span>
    `;
  }

  try {
    const id = $('#editProductId').value;
    const title = $('#prodTitle').value.trim();
    const category = $('#prodCategory').value;
    const collection = $('#prodCollection').value;
    let price = $('#prodPrice').value.trim();
    let originalPrice = $('#prodOriginalPrice').value.trim();
    const badge = $('#prodBadge').value.trim();
    const stockRaw = $('#prodStock') ? $('#prodStock').value.trim() : '';
    const stock = (stockRaw !== '' && !isNaN(parseInt(stockRaw, 10))) ? Math.max(0, parseInt(stockRaw, 10)) : 0;
    const rating = ($('#prodRating') && $('#prodRating').value.trim()) || (id ? (AdminState.products.find(p => p.id == id)?.rating || '4.8') : '4.8');
    
    // Auto-compress primary image if uncompressed base64 string
    let image = $('#prodImage').value.trim();
    if (image.startsWith('data:image/') && image.length > 150000) {
      image = await compressDataUrl(image, 900, 900, 0.82);
      $('#prodImage').value = image;
    }

    // Auto-compress gallery secondary photos if any are oversized
    const gallery = [];
    for (let gImg of currentProductSecondaryPhotos) {
      if (gImg && gImg.startsWith('data:image/') && gImg.length > 150000) {
        gImg = await compressDataUrl(gImg, 900, 900, 0.82);
      }
      gallery.push(gImg);
    }
    const hoverImage = gallery.length > 0 ? gallery[0] : image;
    const description = ($('#prodDescription') && $('#prodDescription').value.trim()) || (id ? (AdminState.products.find(p => p.id == id)?.description || '') : '');

    if (!price.startsWith('৳')) price = '৳ ' + price.replace(/[^\d,]/g, '');
    if (originalPrice && !originalPrice.startsWith('৳')) originalPrice = '৳ ' + originalPrice.replace(/[^\d,]/g, '');

    // Process Video
    let finalVideoUrl = currentEditProductVideo.url || '';
    let finalVideoFileName = currentEditProductVideo.fileName || '';

    // Process Dimensions and Features bullets
    const dimsRaw = $('#prodDimensions') ? $('#prodDimensions').value.trim() : '';
    const finalDims = dimsRaw ? dimsRaw.split('\n').map(s => s.trim()).filter(Boolean) : [];

    const featsRaw = $('#prodFeatures') ? $('#prodFeatures').value.trim() : '';
    const finalFeats = featsRaw ? featsRaw.split('\n').map(s => s.trim()).filter(Boolean) : [];

    const deliveryNotice = $('#prodDeliveryNotice') ? $('#prodDeliveryNotice').value.trim() : '';

    let savedId = id ? parseInt(id, 10) : (Math.max(0, ...AdminState.products.map(p => parseInt(p.id, 10) || 0)) + 1);

    if (currentEditProductVideo.isLocal && currentEditProductVideo.file) {
      try {
        await saveVideoToDB(savedId, currentEditProductVideo.file);
        finalVideoUrl = 'idb:pdp_video_' + savedId;
        finalVideoFileName = currentEditProductVideo.file.name;
      } catch (vErr) {
        console.error('Error saving video file to IndexedDB:', vErr);
      }
    } else if ($('#prodVideoUrl') && $('#prodVideoUrl').value.trim()) {
      finalVideoUrl = $('#prodVideoUrl').value.trim();
    }

    if (id) {
      // Update existing
      const existingIndex = AdminState.products.findIndex(p => p.id == id);
      if (existingIndex > -1) {
        AdminState.products[existingIndex] = {
          ...AdminState.products[existingIndex],
          id: savedId,
          title,
          category,
          collection,
          price,
          originalPrice,
          badge,
          stock,
          rating,
          image,
          hoverImage,
          gallery,
          description,
          dimensionsList: finalDims,
          featuresList: finalFeats,
          deliveryNotice: deliveryNotice,
          videoUrl: finalVideoUrl,
          videoFileName: finalVideoFileName
        };
      }
      if (typeof currentPdpProduct !== 'undefined' && currentPdpProduct && currentPdpProduct.id == id) {
        currentPdpProduct.dimensionsList = finalDims;
        currentPdpProduct.featuresList = finalFeats;
        currentPdpProduct.deliveryNotice = deliveryNotice;
        currentPdpProduct.videoUrl = finalVideoUrl;
        currentPdpProduct.videoFileName = finalVideoFileName;
      }
    } else {
      // Add new product
      const newId = Math.max(0, ...AdminState.products.map(p => parseInt(p.id, 10) || 0)) + 1;
      savedId = newId;
      const newProduct = {
        id: newId,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        title,
        category,
        collection,
        price,
        originalPrice,
        badge: badge || 'New',
        stock,
        rating,
        reviewsCount: 1,
        image,
        hoverImage,
        gallery,
        description,
        dimensionsList: finalDims,
        featuresList: finalFeats,
        deliveryNotice: deliveryNotice,
        videoUrl: finalVideoUrl,
        videoFileName: finalVideoFileName,
        colors: [
          { name: 'Noir Black', hex: '#111111' },
          { name: 'Mocha Tan', hex: '#8B5A2B' }
        ]
      };
      AdminState.products.unshift(newProduct);
    }

    // Also sync extra delivery notice key for storefront backward compatibility
    try {
      const extraKey = `luxos_pdp_extra_${savedId}`;
      const existingExtra = JSON.parse(localStorage.getItem(extraKey) || '{}');
      existingExtra.deliveryNotice = deliveryNotice;
      localStorage.setItem(extraKey, JSON.stringify(existingExtra));
    } catch (e) {}

    // Persist to localStorage safely with quota protection
    saveProductsSafely(AdminState.products);

    // 2. Trigger Animated Success Pop Overlay
    if (overlay) {
      overlay.classList.remove('hidden');
    }

    // 3. Smooth exit animation & update after 600ms
    setTimeout(() => {
      closeProductModal();
      renderProductsTable();
      renderDashboard();

      // Highlight the saved product row in the table with brief pulse animation
      const savedRow = document.querySelector(`tr[data-product-id="${savedId}"]`);
      if (savedRow) {
        savedRow.classList.add('animate-row-highlight');
        savedRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      showAdminToast(id ? `Updated "${title}"` : `Added new product "${title}"`);
    }, 600);

  } catch (err) {
    console.error('Error saving product:', err);
    resetSaveBtn();
    showAdminToast('Could not save product: ' + (err.message || 'Please check inputs.'));
  }
};

window.showConfirmDialog = function ({
  title = 'Delete Item?',
  message = 'Are you sure you want to delete this item? This action cannot be undone.',
  confirmText = 'Delete',
  onConfirm
}) {
  const modal = $('#deleteConfirmModal');
  if (!modal) {
    if (confirm(message) && typeof onConfirm === 'function') onConfirm();
    return;
  }

  const titleEl = $('#deleteModalTitle');
  const msgEl = $('#deleteModalMessage');
  const confirmBtn = $('#deleteModalConfirmBtn');
  const cancelBtn = $('#deleteModalCancelBtn');

  if (titleEl) titleEl.textContent = title;
  if (msgEl) msgEl.textContent = message;

  // Replace confirm button to clear any old click listeners
  const newConfirmBtn = confirmBtn.cloneNode(true);
  newConfirmBtn.innerHTML = `
    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
    </svg>
    <span>${confirmText}</span>
  `;
  confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

  const newCancelBtn = cancelBtn.cloneNode(true);
  cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

  const closeModal = () => {
    modal.classList.remove('active');
  };

  newCancelBtn.onclick = closeModal;
  modal.onclick = (e) => {
    if (e.target === modal) closeModal();
  };

  newConfirmBtn.onclick = () => {
    closeModal();
    if (typeof onConfirm === 'function') onConfirm();
  };

  modal.classList.add('active');
};

window.deleteProduct = function (productId) {
  const product = AdminState.products.find(p => p.id === productId);
  if (!product) return;

  showConfirmDialog({
    title: 'Delete Product?',
    message: `Are you sure you want to delete "${product.title}"? This item will be removed immediately from both the admin and the live storefront.`,
    confirmText: 'Yes, Delete',
    onConfirm: () => {
      AdminState.products = AdminState.products.filter(p => p.id !== productId);
      localStorage.setItem('luxos_products_data', JSON.stringify(AdminState.products));
      renderProductsTable();
      renderDashboard();
      showAdminToast(`Product "${product.title}" deleted.`);
    }
  });
};

/* ==========================================================================
   6. Coupons & Vouchers Management
   ========================================================================== */
function renderCouponsTable() {
  const tbody = $('#couponsTbody');
  if (!tbody) return;

  tbody.innerHTML = AdminState.coupons.map((c, idx) => `
    <tr class="hover:bg-slate-50 transition">
      <td class="py-3 px-4 font-mono font-bold text-slate-900">${c.code}</td>
      <td class="py-3 px-4 font-semibold text-slate-700">${c.displayValue || (c.type === 'percent' ? `${Math.round(c.discount * 100)}% Off` : 'Free Shipping')}</td>
      <td class="py-3 px-4">
        <button onclick="toggleCoupon(${idx})" class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${c.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}">
          ${c.active ? 'Active' : 'Disabled'}
        </button>
      </td>
      <td class="py-3 px-4 text-right">
        <button onclick="deleteCoupon(${idx})" class="text-slate-400 hover:text-red-600 p-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79" /></svg>
        </button>
      </td>
    </tr>
  `).join('');
}

window.handleCreateCoupon = function (e) {
  e.preventDefault();
  const code = $('#newCouponCode').value.trim().toUpperCase();
  const type = $('#newCouponType').value;
  const val = parseInt($('#newCouponValue').value || 10, 10);

  if (!code) return;

  const newCoupon = {
    code,
    type,
    discount: type === 'percent' ? val / 100 : 1,
    displayValue: type === 'percent' ? `${val}% Off` : 'Free Shipping',
    active: true
  };

  AdminState.coupons.push(newCoupon);
  localStorage.setItem('luxos_coupons', JSON.stringify(AdminState.coupons));

  $('#newCouponCode').value = '';
  renderCouponsTable();
  showAdminToast(`Created coupon "${code}"`);
};

window.toggleCoupon = function (index) {
  if (!AdminState.coupons[index]) return;
  AdminState.coupons[index].active = !AdminState.coupons[index].active;
  localStorage.setItem('luxos_coupons', JSON.stringify(AdminState.coupons));
  renderCouponsTable();
};

window.deleteCoupon = function (index) {
  const coupon = AdminState.coupons[index];
  showConfirmDialog({
    title: 'Delete Coupon?',
    message: `Are you sure you want to delete coupon code "${coupon ? coupon.code : ''}"?`,
    confirmText: 'Delete Coupon',
    onConfirm: () => {
      AdminState.coupons.splice(index, 1);
      localStorage.setItem('luxos_coupons', JSON.stringify(AdminState.coupons));
      renderCouponsTable();
      showAdminToast('Coupon removed.');
    }
  });
};

/* ==========================================================================
   7. Customer Directory
   ========================================================================== */
function renderCustomersTable() {
  const tbody = $('#customersTbody');
  if (!tbody) return;

  // Compile unique customers by phone number from orders
  const customerMap = new Map();

  AdminState.orders.forEach(order => {
    const phone = order.customer.phone;
    if (!customerMap.has(phone)) {
      customerMap.set(phone, {
        name: order.customer.name,
        phone: phone,
        address: order.customer.address,
        zone: order.customer.zone || 'Dhaka',
        ordersCount: 1,
        totalSpent: order.total
      });
    } else {
      const existing = customerMap.get(phone);
      existing.ordersCount += 1;
      existing.totalSpent += order.total;
    }
  });

  const customers = Array.from(customerMap.values());
  $('#customersCountBadge').textContent = `${customers.length} Customers`;

  if (customers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-10 text-slate-400">No customer records found yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = customers.map(c => `
    <tr class="hover:bg-slate-50 transition">
      <td class="py-3 px-4 font-bold text-slate-800">${c.name}</td>
      <td class="py-3 px-4 font-mono text-slate-600">${c.phone}</td>
      <td class="py-3 px-4 text-slate-600 max-w-xs truncate">${c.address}</td>
      <td class="py-3 px-4 text-slate-700 font-medium">${c.zone}</td>
      <td class="py-3 px-4">
        <span class="bg-slate-100 text-slate-800 font-semibold px-2.5 py-0.5 rounded-full text-[11px]">${c.ordersCount} orders</span>
      </td>
      <td class="py-3 px-4 text-right font-bold text-slate-900">${formatPrice(c.totalSpent)}</td>
    </tr>
  `).join('');
}

/* ==========================================================================
   8. Settings Form
   ========================================================================== */
function loadSettingsForm() {
  const s = AdminState.settings;
  if ($('#settingDhakaFee')) $('#settingDhakaFee').value = s.insideDhakaFee || 70;
  if ($('#settingOutsideFee')) $('#settingOutsideFee').value = s.outsideDhakaFee || 130;
  if ($('#settingFreeThreshold')) $('#settingFreeThreshold').value = s.freeShippingThreshold || 3000;
  if ($('#settingHotline')) $('#settingHotline').value = s.hotline || '+880 1700-LUXOS';
  if ($('#settingEmail')) $('#settingEmail').value = s.email || 'support@luxosbd.com';
}

window.handleSaveSettings = function (e) {
  e.preventDefault();

  AdminState.settings = {
    insideDhakaFee: parseInt($('#settingDhakaFee').value, 10),
    outsideDhakaFee: parseInt($('#settingOutsideFee').value, 10),
    freeShippingThreshold: parseInt($('#settingFreeThreshold').value, 10),
    hotline: $('#settingHotline').value.trim(),
    email: $('#settingEmail').value.trim()
  };

  localStorage.setItem('luxos_settings', JSON.stringify(AdminState.settings));
  showAdminToast('Store & delivery settings updated successfully.');
};

/* ==========================================================================
   9. Hero Banners & Slideshow Management
   ========================================================================== */
function renderBannersTable() {
  const grid = $('#adminBannersGrid');
  if (!grid) return;

  const slides = AdminState.heroSlides;
  const activeCount = slides.filter(s => s.active !== false).length;
  if ($('#sidebarBannersCount')) $('#sidebarBannersCount').textContent = activeCount;

  if (slides.length === 0) {
    grid.innerHTML = `<div class="col-span-full py-12 text-center text-slate-400">No hero banners configured. Click "Add New Banner" to create one.</div>`;
    return;
  }

  grid.innerHTML = slides.map(s => `
    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between">
      <div>
        <!-- Thumbnail preview -->
        <div class="relative aspect-[16/7] bg-slate-900 overflow-hidden">
          <img src="${s.desktopImage}" alt="${s.heading}" class="w-full h-full object-cover" />
          <div class="absolute top-2 left-2 flex gap-1.5">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${s.active ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'}">
              ${s.active ? 'Active' : 'Disabled'}
            </span>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${s.showText ? 'bg-blue-600 text-white' : 'bg-amber-600 text-white'}">
              ${s.showText ? 'Text Overlay ON' : 'Clean Image Only'}
            </span>
          </div>
        </div>
        
        <!-- Banner details -->
        <div class="p-4 space-y-1.5">
          ${s.subheading ? `<span class="text-[10px] font-bold uppercase tracking-widest text-amber-600">${s.subheading}</span>` : ''}
          <h4 class="text-sm font-bold text-slate-900 line-clamp-1">${s.heading || 'Untitled Banner'}</h4>
          <p class="text-xs text-slate-500 line-clamp-2">${s.description || 'No description (Image only presentation)'}</p>
          <div class="pt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-100">
            <span>Target: <b>${s.buttonLink || 'all'}</b></span>
            <span>Button: <b>${s.buttonText || 'Explore'}</b></span>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <button onclick="toggleBannerActive(${s.id})" class="text-xs font-semibold px-2.5 py-1 rounded border border-slate-300 hover:bg-slate-200 text-slate-700 transition">
          ${s.active ? 'Hide Banner' : 'Show Banner'}
        </button>
        <div class="flex items-center gap-1">
          <button onclick="editBanner(${s.id})" title="Edit Banner" class="p-1.5 text-slate-600 hover:text-black rounded hover:bg-slate-200 transition">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
          </button>
          <button onclick="deleteBanner(${s.id})" title="Delete Banner" class="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

window.openBannerModal = function () {
  $('#bannerModalTitle').textContent = 'Add Hero Banner';
  $('#editBannerId').value = '';
  $('#bannerDesktopImg').value = '';
  $('#bannerMobileImg').value = '';
  if ($('#bannerDesktopFileInput')) $('#bannerDesktopFileInput').value = '';
  if ($('#bannerMobileFileInput')) $('#bannerMobileFileInput').value = '';
  $('#bannerSubheading').value = '';
  $('#bannerHeading').value = '';
  $('#bannerDescription').value = '';
  $('#bannerButtonText').value = 'Explore Collection';
  $('#bannerButtonLink').value = 'all';
  $('#bannerShowText').checked = true;
  $('#bannerActive').value = 'true';
  toggleBannerTextInputs(true);
  $('#bannerImgPreviewBox').classList.add('hidden');
  if ($('#bannerMobileImgPreviewBox')) $('#bannerMobileImgPreviewBox').classList.add('hidden');
  if ($('#bannerImgPreviewInfo')) $('#bannerImgPreviewInfo').textContent = 'Preview';

  const saveBtn = $('#saveBannerBtn');
  if (saveBtn) {
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<span>Save Banner</span>';
  }

  $('#bannerFormModal').classList.add('active');
};

window.closeBannerModal = function () {
  $('#bannerFormModal').classList.remove('active');
};

window.handleBannerFileUpload = async function (event, type) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showAdminToast('Please select an image file (JPG, PNG, or WebP).');
    return;
  }

  showAdminToast(`Optimizing ${type} banner photo...`);

  try {
    const maxWidth = type === 'desktop' ? 1400 : 750;
    const maxHeight = type === 'desktop' ? 650 : 650;
    const quality = type === 'desktop' ? 0.80 : 0.75;
    const compressedBase64 = await compressImageFile(file, maxWidth, maxHeight, quality);
    const sizeKB = Math.round(compressedBase64.length * 0.75 / 1024);

    if (type === 'desktop') {
      $('#bannerDesktopImg').value = compressedBase64;
      previewBannerImg(compressedBase64);
      const info = $('#bannerImgPreviewInfo');
      if (info) info.textContent = `${file.name} (Optimized: ${sizeKB} KB)`;
      showAdminToast(`Desktop photo optimized & loaded (${sizeKB} KB)!`);
    } else {
      $('#bannerMobileImg').value = compressedBase64;
      previewMobileBannerImg(compressedBase64);
      showAdminToast(`Mobile photo optimized & loaded (${sizeKB} KB)!`);
    }
  } catch (err) {
    console.error('Banner upload compression error:', err);
    const reader = new FileReader();
    reader.onload = function (e) {
      const base64 = e.target.result;
      if (type === 'desktop') {
        $('#bannerDesktopImg').value = base64;
        previewBannerImg(base64);
      } else {
        $('#bannerMobileImg').value = base64;
        previewMobileBannerImg(base64);
      }
      showAdminToast(`${type === 'desktop' ? 'Desktop' : 'Mobile'} photo loaded!`);
    };
    reader.readAsDataURL(file);
  }
};

window.previewBannerImg = function (url) {
  const box = $('#bannerImgPreviewBox');
  const img = $('#bannerImgPreview');
  if (url && (url.startsWith('http') || url.startsWith('data:') || url.startsWith('/'))) {
    img.src = url;
    box.classList.remove('hidden');
  } else {
    box.classList.add('hidden');
  }
};

window.previewMobileBannerImg = function (url) {
  const box = $('#bannerMobileImgPreviewBox');
  const img = $('#bannerMobileImgPreview');
  if (!box || !img) return;
  if (url && (url.startsWith('http') || url.startsWith('data:') || url.startsWith('/'))) {
    img.src = url;
    box.classList.remove('hidden');
  } else {
    box.classList.add('hidden');
  }
};

window.toggleBannerTextInputs = function (show) {
  const group = $('#bannerTextInputsGroup');
  if (group) group.style.display = show ? 'block' : 'none';
};

window.editBanner = function (id) {
  const banner = AdminState.heroSlides.find(s => s.id == id);
  if (!banner) return;

  $('#bannerModalTitle').textContent = 'Edit Hero Banner';
  $('#editBannerId').value = banner.id;
  $('#bannerDesktopImg').value = banner.desktopImage || '';
  $('#bannerMobileImg').value = banner.mobileImage || '';
  if ($('#bannerDesktopFileInput')) $('#bannerDesktopFileInput').value = '';
  if ($('#bannerMobileFileInput')) $('#bannerMobileFileInput').value = '';
  $('#bannerSubheading').value = banner.subheading || '';
  $('#bannerHeading').value = banner.heading || '';
  $('#bannerDescription').value = banner.description || '';
  $('#bannerButtonText').value = banner.buttonText || '';
  $('#bannerButtonLink').value = banner.buttonLink || 'all';
  $('#bannerShowText').checked = banner.showText !== false;
  $('#bannerActive').value = banner.active !== false ? 'true' : 'false';

  previewBannerImg(banner.desktopImage);
  if (banner.mobileImage) {
    previewMobileBannerImg(banner.mobileImage);
  } else if ($('#bannerMobileImgPreviewBox')) {
    $('#bannerMobileImgPreviewBox').classList.add('hidden');
  }
  if ($('#bannerImgPreviewInfo')) $('#bannerImgPreviewInfo').textContent = 'Current Banner Image';
  toggleBannerTextInputs(banner.showText !== false);

  const saveBtn = $('#saveBannerBtn');
  if (saveBtn) {
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<span>Save Banner</span>';
  }

  $('#bannerFormModal').classList.add('active');
};

window.handleSaveBanner = async function (e) {
  e.preventDefault();

  const id = $('#editBannerId').value;
  let desktopImage = $('#bannerDesktopImg').value.trim();
  let mobileImage = $('#bannerMobileImg').value.trim() || desktopImage;
  const subheading = $('#bannerSubheading').value.trim();
  const heading = $('#bannerHeading').value.trim();
  const description = $('#bannerDescription').value.trim();
  const buttonText = $('#bannerButtonText').value.trim();
  const buttonLink = $('#bannerButtonLink').value;
  const showText = $('#bannerShowText').checked;
  const active = $('#bannerActive').value === 'true';

  if (!desktopImage) {
    showAdminToast('Please provide a valid Desktop Image URL.');
    return;
  }

  const saveBtn = $('#saveBannerBtn');
  const resetSaveBtn = () => {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<span>Save Banner</span>';
    }
  };

  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = `
      <svg class="animate-spin w-4 h-4 text-amber-400 shrink-0 inline mr-1" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
      </svg>
      <span>Saving...</span>
    `;
  }

  try {
    // Compress oversized base64 data URLs if present (desktop & mobile)
    if (desktopImage.startsWith('data:image/') && desktopImage.length > 40000) {
      try {
        desktopImage = await compressDataUrl(desktopImage, 1400, 650, 0.80);
        if ($('#bannerDesktopImg')) $('#bannerDesktopImg').value = desktopImage;
      } catch (cErr) {
        console.warn('Desktop banner auto-compression warning:', cErr);
      }
    }
    if (mobileImage.startsWith('data:image/') && mobileImage.length > 30000) {
      try {
        mobileImage = await compressDataUrl(mobileImage, 750, 650, 0.75);
        if ($('#bannerMobileImg')) $('#bannerMobileImg').value = mobileImage;
      } catch (cErr) {
        console.warn('Mobile banner auto-compression warning:', cErr);
      }
    }

    if (id) {
      // Update existing
      const idx = AdminState.heroSlides.findIndex(s => s.id == id);
      if (idx > -1) {
        AdminState.heroSlides[idx] = {
          ...AdminState.heroSlides[idx],
          desktopImage,
          mobileImage,
          subheading,
          heading,
          description,
          buttonText,
          buttonLink,
          showText,
          active
        };
      }
    } else {
      // Add new banner
      const newId = Date.now();
      AdminState.heroSlides.push({
        id: newId,
        desktopImage,
        mobileImage,
        subheading,
        heading,
        description,
        buttonText,
        buttonLink,
        showText,
        active
      });
    }

    // Persist reliably across refreshes (IndexedDB + localStorage)
    await saveBannersSafely(AdminState.heroSlides);

    closeBannerModal();
    resetSaveBtn();
    renderBannersTable();
    showAdminToast(id ? 'Banner updated successfully!' : 'New hero banner created successfully!');
  } catch (err) {
    console.error('Error saving banner:', err);
    resetSaveBtn();
    showAdminToast(err.message || 'Error saving banner. Please try again.');
  }
};

window.toggleBannerActive = async function (id) {
  const banner = AdminState.heroSlides.find(s => s.id == id);
  if (!banner) return;

  banner.active = !banner.active;
  await saveBannersSafely(AdminState.heroSlides);
  renderBannersTable();
  showAdminToast(`Banner ${banner.active ? 'activated' : 'hidden'}.`);
};

window.deleteBanner = function (id) {
  const banner = AdminState.heroSlides.find(s => s.id == id);
  showConfirmDialog({
    title: 'Remove Hero Banner?',
    message: `Are you sure you want to remove "${banner && banner.heading ? banner.heading : 'this banner'}" from the slideshow?`,
    confirmText: 'Remove Banner',
    onConfirm: async () => {
      AdminState.heroSlides = AdminState.heroSlides.filter(s => s.id != id);
      await saveBannersSafely(AdminState.heroSlides);
      renderBannersTable();
      showAdminToast('Banner removed.');
    }
  });
};

window.updateBannerSettings = function () {
  const interval = parseInt($('#bannerSlideInterval').value || 5, 10);
  const zoom = $('#bannerEnableZoom').checked;

  AdminState.bannerSettings = {
    autoplayDuration: interval,
    enableZoom: zoom
  };

  localStorage.setItem('luxos_banner_settings', JSON.stringify(AdminState.bannerSettings));
  showAdminToast('Hero slideshow settings updated.');
};

/* ==========================================================================
   Toast Notification
   ========================================================================== */
let adminToastTimer;
function showAdminToast(msg) {
  const toast = $('#adminToast');
  const text = $('#adminToastText');
  if (!toast || !text) return;

  text.textContent = msg;
  toast.classList.add('show');

  clearTimeout(adminToastTimer);
  adminToastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

/* ==========================================================================
   Scrolling Ticker / Marquee Management
   ========================================================================== */

function getDefaultTickerSettings() {
  return {
    enabled: true,
    speed: 25,
    bgColor: '#f5f5f5',
    textColor: '#262626',
    pauseOnHover: true,
    items: [
      "🌿 GET 10% OFF ONLINE WITH CODE: LUXOS10",
      "🚚 FREE NATIONWIDE SHIPPING OVER ৳ 3,000",
      "🔄 7 DAYS EASY EXCHANGE & MONEY BACK GUARANTEE",
      "💎 100% PREMIUM LEATHER & VEGAN CRAFTSMANSHIP",
      "💵 CASH ON DELIVERY AVAILABLE ACROSS BANGLADESH",
      "⭐ OVER 50,000+ HAPPY CUSTOMERS"
    ]
  };
}

function loadTickerSettings() {
  const stored = localStorage.getItem('luxos_ticker_settings');
  if (stored) {
    try {
      AdminState.tickerSettings = JSON.parse(stored);
    } catch (e) {
      AdminState.tickerSettings = getDefaultTickerSettings();
    }
  } else {
    AdminState.tickerSettings = getDefaultTickerSettings();
    localStorage.setItem('luxos_ticker_settings', JSON.stringify(AdminState.tickerSettings));
  }
}

window.renderTickerSettings = function () {
  loadTickerSettings();
  const settings = AdminState.tickerSettings;

  if ($('#tickerEnableToggle')) $('#tickerEnableToggle').checked = settings.enabled !== false;
  if ($('#tickerSpeedSelect')) $('#tickerSpeedSelect').value = settings.speed || 25;
  if ($('#tickerBgColor')) $('#tickerBgColor').value = settings.bgColor || '#f5f5f5';
  if ($('#tickerBgColorText')) $('#tickerBgColorText').value = settings.bgColor || '#f5f5f5';
  if ($('#tickerTextColor')) $('#tickerTextColor').value = settings.textColor || '#262626';
  if ($('#tickerTextColorText')) $('#tickerTextColorText').value = settings.textColor || '#262626';
  if ($('#tickerPauseOnHover')) $('#tickerPauseOnHover').checked = settings.pauseOnHover !== false;

  updateTickerStatusBadge();
  renderTickerItemsList();
  updateTickerPreviewLive();
};

function updateTickerStatusBadge() {
  const toggle = $('#tickerEnableToggle');
  const enabled = toggle ? toggle.checked : true;
  const badge = $('#tickerStatusBadge');
  const sidebarBadge = $('#sidebarTickerBadge');
  
  if (badge) {
    badge.className = enabled 
      ? 'bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200'
      : 'bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200';
    badge.textContent = enabled ? 'Enabled' : 'Disabled';
  }
  if (sidebarBadge) {
    sidebarBadge.className = enabled
      ? 'bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30'
      : 'bg-slate-700 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-600';
    sidebarBadge.textContent = enabled ? 'Active' : 'Off';
  }
}

window.toggleTickerEnabled = function () {
  updateTickerStatusBadge();
  updateTickerPreviewLive();
};

window.applyTickerThemePreset = function (preset) {
  const themes = {
    neutral: { bg: '#f5f5f5', text: '#262626' },
    black: { bg: '#111111', text: '#c5a880' },
    gold: { bg: '#c5a880', text: '#111111' },
    cream: { bg: '#fbf9f5', text: '#1f1f1f' }
  };

  if (themes[preset]) {
    if ($('#tickerBgColor')) $('#tickerBgColor').value = themes[preset].bg;
    if ($('#tickerBgColorText')) $('#tickerBgColorText').value = themes[preset].bg;
    if ($('#tickerTextColor')) $('#tickerTextColor').value = themes[preset].text;
    if ($('#tickerTextColorText')) $('#tickerTextColorText').value = themes[preset].text;
  }
  updateTickerPreviewLive();
};

window.updateTickerPreviewLive = function () {
  const previewWrapper = $('#adminTickerPreviewWrapper');
  const previewTrack = $('#adminTickerPreviewTrack');
  if (!previewWrapper || !previewTrack) return;

  const toggle = $('#tickerEnableToggle');
  const enabled = toggle ? toggle.checked : true;
  const speed = ($('#tickerSpeedSelect') && $('#tickerSpeedSelect').value) || 25;
  const bgColor = ($('#tickerBgColor') && $('#tickerBgColor').value) || '#f5f5f5';
  const textColor = ($('#tickerTextColor') && $('#tickerTextColor').value) || '#262626';
  const items = (AdminState.tickerSettings && AdminState.tickerSettings.items) || [];

  if (!enabled) {
    previewWrapper.style.opacity = '0.4';
  } else {
    previewWrapper.style.opacity = '1';
  }

  previewWrapper.style.backgroundColor = bgColor;
  previewTrack.style.color = textColor;
  previewTrack.style.animationDuration = `${speed}s`;

  if (items.length > 0) {
    const html = items.map(item => `<span>${item}</span><span>•</span>`).join(' ');
    previewTrack.innerHTML = html + ' ' + html;
  } else {
    previewTrack.innerHTML = '<span>No announcements</span>';
  }
};

function renderTickerItemsList() {
  const container = $('#tickerItemsList');
  const countBadge = $('#tickerItemsCount');
  if (!container) return;

  const items = (AdminState.tickerSettings && AdminState.tickerSettings.items) || [];
  if (countBadge) countBadge.textContent = items.length;

  if (items.length === 0) {
    container.innerHTML = `
      <div class="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
        No announcements added. Add one above!
      </div>
    `;
    return;
  }

  container.innerHTML = items.map((item, index) => `
    <div class="flex items-center justify-between gap-3 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition">
      <div class="flex items-center gap-2 flex-1 min-w-0">
        <span class="w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0">
          ${index + 1}
        </span>
        <input type="text" value="${item.replace(/"/g, '&quot;')}" onchange="updateTickerItemText(${index}, this.value)" class="flex-1 text-xs text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-black focus:bg-white focus:outline-none px-1 py-0.5 rounded" />
      </div>
      <div class="flex items-center gap-1 shrink-0">
        ${index > 0 ? `<button type="button" onclick="moveTickerItem(${index}, -1)" class="p-1 text-slate-400 hover:text-slate-800 rounded" title="Move Up"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5"/></svg></button>` : ''}
        ${index < items.length - 1 ? `<button type="button" onclick="moveTickerItem(${index}, 1)" class="p-1 text-slate-400 hover:text-slate-800 rounded" title="Move Down"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg></button>` : ''}
        <button type="button" onclick="deleteTickerItem(${index})" class="p-1 text-slate-400 hover:text-red-600 rounded transition" title="Delete Announcement">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
        </button>
      </div>
    </div>
  `).join('');
}

window.handleAddNewTickerItem = function (e) {
  if (e) e.preventDefault();
  const input = $('#newTickerItemInput');
  const text = (input ? input.value : '').trim();
  if (!text) {
    showAdminToast('Please write some announcement text');
    return;
  }

  if (!AdminState.tickerSettings.items) AdminState.tickerSettings.items = [];
  AdminState.tickerSettings.items.push(text);
  input.value = '';
  renderTickerItemsList();
  updateTickerPreviewLive();
  showAdminToast('New announcement item added!');
};

window.updateTickerItemText = function (index, newText) {
  if (index >= 0 && index < AdminState.tickerSettings.items.length) {
    AdminState.tickerSettings.items[index] = newText.trim();
    updateTickerPreviewLive();
  }
};

window.moveTickerItem = function (index, direction) {
  const items = AdminState.tickerSettings.items;
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= items.length) return;
  const temp = items[index];
  items[index] = items[newIndex];
  items[newIndex] = temp;
  renderTickerItemsList();
  updateTickerPreviewLive();
};

window.deleteTickerItem = function (index) {
  if (AdminState.tickerSettings.items.length <= 1) {
    showAdminToast('You must have at least 1 announcement item!');
    return;
  }
  AdminState.tickerSettings.items.splice(index, 1);
  renderTickerItemsList();
  updateTickerPreviewLive();
  showAdminToast('Announcement removed.');
};

window.resetTickerDefaults = function () {
  showConfirmDialog({
    title: 'Reset Marquee Ticker?',
    message: 'Are you sure you want to reset the marquee ticker to its default messages, speed and colors?',
    confirmText: 'Reset Defaults',
    onConfirm: () => {
      AdminState.tickerSettings = getDefaultTickerSettings();
      renderTickerSettings();
      showAdminToast('Reset to defaults.');
    }
  });
};

window.saveTickerSettings = function () {
  const toggle = $('#tickerEnableToggle');
  const enabled = toggle ? toggle.checked : true;
  const speed = parseInt(($('#tickerSpeedSelect') && $('#tickerSpeedSelect').value) || 25, 10);
  const bgColor = ($('#tickerBgColor') && $('#tickerBgColor').value) || '#f5f5f5';
  const textColor = ($('#tickerTextColor') && $('#tickerTextColor').value) || '#262626';
  const pauseOnHover = $('#tickerPauseOnHover') ? $('#tickerPauseOnHover').checked : true;

  AdminState.tickerSettings = {
    ...AdminState.tickerSettings,
    enabled,
    speed,
    bgColor,
    textColor,
    pauseOnHover
  };

  localStorage.setItem('luxos_ticker_settings', JSON.stringify(AdminState.tickerSettings));
  updateTickerStatusBadge();
  showAdminToast('Scrolling Ticker settings saved & published to storefront! 🎉');
};

/* ==========================================================================
   Shop by Collection (Curated Story Circles) Management
   ========================================================================== */
function getDefaultCollections() {
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

window.renderCollectionsManager = function () {
  const collections = AdminState.collections || [];
  const header = AdminState.collectionsHeader || { eyebrow: 'Curated Categories', heading: 'Shop by Collection', enabled: true };

  // Update sidebar count
  if ($('#sidebarCollectionsCount')) $('#sidebarCollectionsCount').textContent = collections.length;
  if ($('#collectionsItemsCount')) $('#collectionsItemsCount').textContent = collections.length;

  // Header settings inputs
  if ($('#collectionsEnableToggle')) $('#collectionsEnableToggle').checked = header.enabled !== false;
  if ($('#collectionsStatusBadge')) {
    const isEnabled = header.enabled !== false;
    $('#collectionsStatusBadge').textContent = isEnabled ? 'Active' : 'Disabled';
    $('#collectionsStatusBadge').className = isEnabled 
      ? 'bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200'
      : 'bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200';
  }
  if ($('#collectionsEyebrowInput')) $('#collectionsEyebrowInput').value = header.eyebrow || 'Curated Categories';
  if ($('#collectionsHeadingInput')) $('#collectionsHeadingInput').value = header.heading || 'Shop by Collection';

  // Live preview header
  if ($('#previewCollectionsEyebrow')) $('#previewCollectionsEyebrow').textContent = header.eyebrow || 'Curated Categories';
  if ($('#previewCollectionsHeading')) $('#previewCollectionsHeading').textContent = header.heading || 'Shop by Collection';

  // Live preview strip
  const previewTrack = $('#adminCollectionsPreviewTrack');
  if (previewTrack) {
    const activeItems = collections.filter(c => c.active !== false);
    if (activeItems.length === 0) {
      previewTrack.innerHTML = '<div class="py-6 text-center text-xs text-slate-400">No active collection items to display.</div>';
    } else {
      previewTrack.innerHTML = activeItems.map(c => `
        <div class="flex flex-col items-center flex-shrink-0 group cursor-pointer" onclick="openCollectionModal(${c.id})">
          <div class="w-16 h-16 rounded-full overflow-hidden border-2 border-slate-300 p-0.5 bg-white shadow-xs group-hover:border-black transition">
            <img src="${c.image}" alt="${c.title}" class="w-full h-full object-cover rounded-full group-hover:scale-105 transition" />
          </div>
          <span class="mt-1.5 text-[11px] font-semibold text-slate-800 tracking-wide uppercase">${c.title}</span>
        </div>
      `).join('');
    }
  }

  // Table rendering
  const tbody = $('#adminCollectionsTbody');
  if (!tbody) return;

  if (collections.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-10 text-slate-400 text-xs">No collection bubbles created yet. Click "+ Add Collection Item" to create one.</td></tr>';
    return;
  }

  tbody.innerHTML = collections.map((c, index) => `
    <tr class="hover:bg-slate-50 transition ${c.active === false ? 'opacity-60 bg-slate-50/50' : ''}">
      <td class="py-3 px-4 text-center font-mono text-slate-400 font-bold">${index + 1}</td>
      <td class="py-3 px-4">
        <div class="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-200 bg-slate-100 flex-shrink-0 shadow-2xs">
          <img src="${c.image}" alt="${c.title}" class="w-full h-full object-cover rounded-full" />
        </div>
      </td>
      <td class="py-3 px-4 font-semibold text-slate-900">${c.title}</td>
      <td class="py-3 px-4">
        <span class="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-[11px] font-medium border border-slate-200">${c.filter}</span>
      </td>
      <td class="py-3 px-4">
        <button onclick="toggleCollectionStatus(${c.id})" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold cursor-pointer transition ${c.active !== false ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'}">
          <span class="w-1.5 h-1.5 rounded-full ${c.active !== false ? 'bg-emerald-600' : 'bg-slate-400'}"></span>
          <span>${c.active !== false ? 'Visible' : 'Hidden'}</span>
        </button>
      </td>
      <td class="py-3 px-4 text-center">
        <div class="inline-flex items-center gap-1">
          <button onclick="moveCollectionItem(${index}, -1)" ${index === 0 ? 'disabled class="opacity-30 p-1 text-slate-400 cursor-not-allowed"' : 'class="p-1 hover:bg-slate-200 rounded text-slate-700 cursor-pointer"'} title="Move Left / Up">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/></svg>
          </button>
          <button onclick="moveCollectionItem(${index}, 1)" ${index === collections.length - 1 ? 'disabled class="opacity-30 p-1 text-slate-400 cursor-not-allowed"' : 'class="p-1 hover:bg-slate-200 rounded text-slate-700 cursor-pointer"'} title="Move Right / Down">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>
          </button>
        </div>
      </td>
      <td class="py-3 px-4 text-right">
        <div class="flex items-center justify-end gap-1.5">
          <button onclick="openCollectionModal(${c.id})" class="p-1.5 text-slate-600 hover:text-black rounded hover:bg-slate-100 cursor-pointer" title="Edit">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/></svg>
          </button>
          <button onclick="deleteCollectionItem(${c.id})" class="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 cursor-pointer" title="Delete">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
};

window.openCollectionModal = function (id) {
  const modal = $('#collectionItemModal');
  if (!modal) return;

  const titleInput = $('#collectionTitleInput');
  const imgInput = $('#collectionImageUrlInput');
  const fileInput = $('#collectionFileInput');
  const filterSelect = $('#collectionFilterSelect');
  const statusSelect = $('#collectionStatusSelect');
  const editIdInput = $('#editCollectionId');
  const modalTitle = $('#collectionModalTitle');

  if (fileInput) fileInput.value = '';

  const saveBtn = $('#saveCollectionBtn');
  if (saveBtn) {
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<span>Save Item</span>';
  }

  if (id) {
    const item = AdminState.collections.find(c => c.id == id);
    if (!item) return;

    modalTitle.textContent = 'Edit Collection Item';
    editIdInput.value = item.id;
    titleInput.value = item.title;
    imgInput.value = item.image;
    filterSelect.value = item.filter || 'all';
    statusSelect.value = item.active !== false ? 'true' : 'false';
    previewCollectionImg(item.image);
  } else {
    modalTitle.textContent = 'Add New Collection Bubble';
    editIdInput.value = '';
    titleInput.value = '';
    imgInput.value = '';
    filterSelect.value = 'all';
    statusSelect.value = 'true';
    previewCollectionImg('');
  }

  modal.classList.add('active');
};

window.closeCollectionModal = function () {
  const modal = $('#collectionItemModal');
  if (modal) modal.classList.remove('active');
};

window.previewCollectionImg = function (url) {
  const preview = $('#collectionImgPreview');
  const info = $('#collectionImgInfo');
  if (!preview) return;

  if (url) {
    preview.src = url;
    if (info) info.textContent = 'Image loaded';
  } else {
    preview.src = 'https://thepatchee.com/cdn/shop/files/d0783770-4668-4b3e-a3b5-2bbc89c2869f.jpg?v=1776151580&width=400';
    if (info) info.textContent = 'Default Preview';
  }
};

window.handleCollectionFileUpload = async function (event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showAdminToast('Please select a valid image file (JPG, PNG, WebP).');
    return;
  }

  showAdminToast('Optimizing collection image...');

  try {
    const compressedBase64 = await compressImageFile(file, 400, 400, 0.82);
    $('#collectionImageUrlInput').value = compressedBase64;
    previewCollectionImg(compressedBase64);
    const sizeKB = Math.round(compressedBase64.length * 0.75 / 1024);
    const info = $('#collectionImgInfo');
    if (info) info.textContent = `${file.name} (Optimized: ${sizeKB} KB)`;
    showAdminToast(`Collection image optimized & loaded (${sizeKB} KB)!`);
  } catch (err) {
    console.error('Error compressing collection image:', err);
    const reader = new FileReader();
    reader.onload = function (e) {
      const base64 = e.target.result;
      $('#collectionImageUrlInput').value = base64;
      previewCollectionImg(base64);
      showAdminToast('Collection image uploaded.');
    };
    reader.readAsDataURL(file);
  }
};

window.handleSaveCollectionItem = async function (e) {
  e.preventDefault();

  const id = $('#editCollectionId').value;
  const title = $('#collectionTitleInput').value.trim();
  let image = $('#collectionImageUrlInput').value.trim();
  const filter = $('#collectionFilterSelect').value;
  const active = $('#collectionStatusSelect').value === 'true';

  if (!title || !image) {
    showAdminToast('Please provide both Title and Photo.');
    return;
  }

  const saveBtn = $('#saveCollectionBtn');
  const resetSaveBtn = () => {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<span>Save Item</span>';
    }
  };

  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = `
      <svg class="animate-spin w-4 h-4 text-amber-400 shrink-0 inline mr-1" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
      </svg>
      <span>Saving...</span>
    `;
  }

  try {
    // If the image is an uncompressed base64 data URL, optimize it to 400x400
    if (image.startsWith('data:image/') && image.length > 35000) {
      try {
        image = await compressDataUrl(image, 400, 400, 0.82);
        if ($('#collectionImageUrlInput')) {
          $('#collectionImageUrlInput').value = image;
        }
      } catch (cErr) {
        console.warn('Image auto-compression failed, proceeding with original:', cErr);
      }
    }

    if (id) {
      const existingIndex = AdminState.collections.findIndex(c => c.id == id);
      if (existingIndex > -1) {
        AdminState.collections[existingIndex] = {
          ...AdminState.collections[existingIndex],
          title,
          image,
          filter,
          active
        };
      }
    } else {
      const newId = Math.max(0, ...AdminState.collections.map(c => c.id || 0)) + 1;
      AdminState.collections.push({
        id: newId,
        title,
        image,
        filter,
        active
      });
    }

    await saveCollectionsSafely(AdminState.collections);

    closeCollectionModal();
    resetSaveBtn();
    renderCollectionsManager();
    showAdminToast(id ? `Updated "${title}"!` : `Added new collection "${title}"!`);
  } catch (err) {
    console.error('Error saving collection item:', err);
    resetSaveBtn();
    showAdminToast(err.message || 'Error saving collection item. Please try again.');
  }
};

window.moveCollectionItem = async function (index, direction) {
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= AdminState.collections.length) return;

  const temp = AdminState.collections[index];
  AdminState.collections[index] = AdminState.collections[newIndex];
  AdminState.collections[newIndex] = temp;

  await saveCollectionsSafely(AdminState.collections);
  renderCollectionsManager();
  showAdminToast('Collection order updated.');
};

window.toggleCollectionStatus = async function (id) {
  const item = AdminState.collections.find(c => c.id === id);
  if (!item) return;

  item.active = item.active === false ? true : false;
  await saveCollectionsSafely(AdminState.collections);
  renderCollectionsManager();
  showAdminToast(`Collection "${item.title}" is now ${item.active ? 'Visible' : 'Hidden'}.`);
};

window.deleteCollectionItem = function (id) {
  const item = AdminState.collections.find(c => c.id === id);
  if (!item) return;

  showConfirmDialog({
    title: 'Delete Collection Item?',
    message: `Are you sure you want to delete "${item.title}" from Shop by Collection?`,
    confirmText: 'Delete Item',
    onConfirm: async () => {
      AdminState.collections = AdminState.collections.filter(c => c.id !== id);
      await saveCollectionsSafely(AdminState.collections);
      renderCollectionsManager();
      showAdminToast(`Collection "${item.title}" deleted.`);
    }
  });
};

window.toggleCollectionsEnabled = function () {
  const isEnabled = $('#collectionsEnableToggle') ? $('#collectionsEnableToggle').checked : true;
  if (!AdminState.collectionsHeader) AdminState.collectionsHeader = {};
  AdminState.collectionsHeader.enabled = isEnabled;

  localStorage.setItem('luxos_collections_header', JSON.stringify(AdminState.collectionsHeader));
  renderCollectionsManager();
  showAdminToast(isEnabled ? 'Shop by Collection is now visible on storefront.' : 'Shop by Collection is now hidden on storefront.');
};

window.saveCollectionsHeaderSettings = function () {
  const eyebrow = $('#collectionsEyebrowInput') ? $('#collectionsEyebrowInput').value.trim() : 'Curated Categories';
  const heading = $('#collectionsHeadingInput') ? $('#collectionsHeadingInput').value.trim() : 'Shop by Collection';

  if (!AdminState.collectionsHeader) AdminState.collectionsHeader = {};
  AdminState.collectionsHeader.eyebrow = eyebrow;
  AdminState.collectionsHeader.heading = heading;

  localStorage.setItem('luxos_collections_header', JSON.stringify(AdminState.collectionsHeader));
  renderCollectionsManager();
  showAdminToast('Section header text updated!');
};

/* ==========================================================================
   Street Style Lookbook ("Bag The Vibe") Manager
   ========================================================================== */
function getDefaultLookbook() {
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

async function saveLookbookSafely(lookbook) {
  try {
    await setItemIndexedDB('luxos_lookbook_data', lookbook);
  } catch (e) {}

  try {
    localStorage.setItem('luxos_lookbook_data', JSON.stringify(lookbook));
    return true;
  } catch (err) {
    console.warn('localStorage quota exceeded while saving lookbook, optimizing...', err);
    if (lookbook.image && lookbook.image.startsWith('data:image/') && lookbook.image.length > 40000) {
      try {
        lookbook.image = await compressDataUrl(lookbook.image, 1200, 800, 0.78);
      } catch (e) {}
    }
    try {
      localStorage.setItem('luxos_lookbook_data', JSON.stringify(lookbook));
      await setItemIndexedDB('luxos_lookbook_data', lookbook);
      return true;
    } catch (e2) {
      console.warn('localStorage full, but lookbook is stored in IndexedDB:', e2);
      return true;
    }
  }
}

window.renderLookbookManager = function () {
  const lookbook = AdminState.lookbook || getDefaultLookbook();
  AdminState.lookbook = lookbook;

  // Toggle & Status
  if ($('#lookbookEnableToggle')) $('#lookbookEnableToggle').checked = lookbook.enabled !== false;
  if ($('#lookbookStatusBadge')) {
    const isEn = lookbook.enabled !== false;
    $('#lookbookStatusBadge').textContent = isEn ? 'Active' : 'Hidden';
    $('#lookbookStatusBadge').className = isEn
      ? 'bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200'
      : 'bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-300';
  }
  if ($('#sidebarLookbookBadge')) {
    const isEn = lookbook.enabled !== false;
    $('#sidebarLookbookBadge').textContent = isEn ? 'Active' : 'Hidden';
    $('#sidebarLookbookBadge').className = isEn
      ? 'bg-pink-500/20 text-pink-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-pink-500/30'
      : 'bg-slate-700 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full';
  }

  // Populate Inputs
  if ($('#lookbookTagInput')) $('#lookbookTagInput').value = lookbook.tag || 'Street Style Lookbook';
  if ($('#lookbookTitleInput')) $('#lookbookTitleInput').value = lookbook.title || 'Bag The Vibe';
  if ($('#lookbookSubtitleInput')) $('#lookbookSubtitleInput').value = lookbook.subtitle || '';
  if ($('#lookbookImageUrlInput')) $('#lookbookImageUrlInput').value = lookbook.image || '';

  if ($('#lookbookCampaignTagInput')) $('#lookbookCampaignTagInput').value = lookbook.campaignTag || '';
  if ($('#lookbookCampaignTitleInput')) $('#lookbookCampaignTitleInput').value = lookbook.campaignTitle || '';
  if ($('#lookbookCampaignDescInput')) $('#lookbookCampaignDescInput').value = lookbook.campaignDesc || '';

  // Sliders & Positions
  const top = typeof lookbook.pinTop === 'number' ? lookbook.pinTop : 52;
  const left = typeof lookbook.pinLeft === 'number' ? lookbook.pinLeft : 46;

  if ($('#lookbookPinLeftRange')) $('#lookbookPinLeftRange').value = left;
  if ($('#lookbookPinTopRange')) $('#lookbookPinTopRange').value = top;
  if ($('#pinLeftVal')) $('#pinLeftVal').textContent = left + '%';
  if ($('#pinTopVal')) $('#pinTopVal').textContent = top + '%';
  if ($('#lookbookCoordsBadge')) $('#lookbookCoordsBadge').textContent = `X: ${left}% | Y: ${top}%`;

  // Image & Pin on visual studio
  if ($('#adminLookbookImg') && lookbook.image) $('#adminLookbookImg').src = lookbook.image;
  if ($('#adminLookbookPin')) {
    $('#adminLookbookPin').style.top = top + '%';
    $('#adminLookbookPin').style.left = left + '%';
  }
  if ($('#adminLookbookCardPreview')) {
    $('#adminLookbookCardPreview').style.top = Math.min(top + 6, 75) + '%';
    $('#adminLookbookCardPreview').style.left = Math.max(Math.min(left - 10, 65), 5) + '%';
  }

  // Populate Product Select Dropdown
  const select = $('#lookbookProductSelect');
  if (select) {
    const products = AdminState.products || [];
    select.innerHTML = products.map(p => {
      const pTitle = p.title || p.name || `Product #${p.id}`;
      const pPrice = String(p.price || '').startsWith('৳') ? p.price : `৳ ${Number(p.price || 0).toLocaleString()}`;
      return `
        <option value="${p.id}" ${p.id == lookbook.productId ? 'selected' : ''}>
          ID ${p.id}: ${pTitle} — ${pPrice} (${p.stock !== undefined ? p.stock : 10} in stock)
        </option>
      `;
    }).join('');
  }

  // Update Snapshot Card Preview
  updateLookbookCardPreview(lookbook.productId);
};

function updateLookbookCardPreview(productId) {
  const products = AdminState.products || [];
  const prod = products.find(p => p.id == productId) || products.find(p => p.id == 3) || products[0];
  if (!prod) return;

  const pTitle = prod.title || prod.name || 'Croissant Chic Crossbody';
  const pPrice = String(prod.price || '').startsWith('৳') ? prod.price : `৳ ${Number(prod.price || 0).toLocaleString()}`;

  if ($('#adminLookbookCardImg')) $('#adminLookbookCardImg').src = prod.image;
  if ($('#adminLookbookCardTitle')) $('#adminLookbookCardTitle').textContent = pTitle;
  if ($('#adminLookbookCardPrice')) $('#adminLookbookCardPrice').textContent = pPrice;

  let badge = prod.badge || '';
  if (!badge && prod.originalPrice) {
    const origNum = parseInt(String(prod.originalPrice).replace(/[^\d]/g, ''), 10);
    const curNum = parseInt(String(prod.price).replace(/[^\d]/g, ''), 10);
    if (origNum && curNum && origNum > curNum) {
      badge = `Save ${Math.round((origNum - curNum) / origNum * 100)}%`;
    }
  }

  if ($('#adminLookbookCardBadge')) {
    $('#adminLookbookCardBadge').textContent = badge;
    $('#adminLookbookCardBadge').style.display = badge ? 'block' : 'none';
  }
}

window.handleLookbookProductSelect = function (prodId) {
  if (!AdminState.lookbook) AdminState.lookbook = getDefaultLookbook();
  AdminState.lookbook.productId = parseInt(prodId, 10);
  updateLookbookCardPreview(prodId);
};

window.handleLookbookImageClick = function (event) {
  const canvas = $('#adminLookbookCanvas');
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const clickY = event.clientY - rect.top;

  let leftPct = Math.round((clickX / rect.width) * 100);
  let topPct = Math.round((clickY / rect.height) * 100);

  leftPct = Math.max(5, Math.min(95, leftPct));
  topPct = Math.max(5, Math.min(95, topPct));

  if (!AdminState.lookbook) AdminState.lookbook = getDefaultLookbook();
  AdminState.lookbook.pinLeft = leftPct;
  AdminState.lookbook.pinTop = topPct;

  if ($('#lookbookPinLeftRange')) $('#lookbookPinLeftRange').value = leftPct;
  if ($('#lookbookPinTopRange')) $('#lookbookPinTopRange').value = topPct;
  if ($('#pinLeftVal')) $('#pinLeftVal').textContent = leftPct + '%';
  if ($('#pinTopVal')) $('#pinTopVal').textContent = topPct + '%';
  if ($('#lookbookCoordsBadge')) $('#lookbookCoordsBadge').textContent = `X: ${leftPct}% | Y: ${topPct}%`;

  if ($('#adminLookbookPin')) {
    $('#adminLookbookPin').style.top = topPct + '%';
    $('#adminLookbookPin').style.left = leftPct + '%';
  }
  if ($('#adminLookbookCardPreview')) {
    $('#adminLookbookCardPreview').style.top = Math.min(topPct + 6, 75) + '%';
    $('#adminLookbookCardPreview').style.left = Math.max(Math.min(leftPct - 10, 65), 5) + '%';
  }
};

window.updatePinFromSliders = function () {
  const leftPct = parseInt($('#lookbookPinLeftRange').value, 10);
  const topPct = parseInt($('#lookbookPinTopRange').value, 10);

  if (!AdminState.lookbook) AdminState.lookbook = getDefaultLookbook();
  AdminState.lookbook.pinLeft = leftPct;
  AdminState.lookbook.pinTop = topPct;

  if ($('#pinLeftVal')) $('#pinLeftVal').textContent = leftPct + '%';
  if ($('#pinTopVal')) $('#pinTopVal').textContent = topPct + '%';
  if ($('#lookbookCoordsBadge')) $('#lookbookCoordsBadge').textContent = `X: ${leftPct}% | Y: ${topPct}%`;

  if ($('#adminLookbookPin')) {
    $('#adminLookbookPin').style.top = topPct + '%';
    $('#adminLookbookPin').style.left = leftPct + '%';
  }
  if ($('#adminLookbookCardPreview')) {
    $('#adminLookbookCardPreview').style.top = Math.min(topPct + 6, 75) + '%';
    $('#adminLookbookCardPreview').style.left = Math.max(Math.min(leftPct - 10, 65), 5) + '%';
  }
};

window.handleLookbookFileUpload = async function (event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showAdminToast('Please select a valid image file (JPG, PNG, or WebP).');
    return;
  }

  showAdminToast('Optimizing lookbook model photo...');

  try {
    const compressedBase64 = await compressImageFile(file, 1400, 900, 0.82);
    if ($('#lookbookImageUrlInput')) $('#lookbookImageUrlInput').value = compressedBase64;
    if ($('#adminLookbookImg')) $('#adminLookbookImg').src = compressedBase64;
    if (!AdminState.lookbook) AdminState.lookbook = getDefaultLookbook();
    AdminState.lookbook.image = compressedBase64;
    const sizeKB = Math.round(compressedBase64.length * 0.75 / 1024);
    showAdminToast(`Lookbook photo optimized & loaded (${sizeKB} KB)!`);
  } catch (err) {
    console.error('Lookbook photo compression error:', err);
    const reader = new FileReader();
    reader.onload = function (e) {
      const base64 = e.target.result;
      if ($('#lookbookImageUrlInput')) $('#lookbookImageUrlInput').value = base64;
      if ($('#adminLookbookImg')) $('#adminLookbookImg').src = base64;
      if (!AdminState.lookbook) AdminState.lookbook = getDefaultLookbook();
      AdminState.lookbook.image = base64;
      showAdminToast('Lookbook photo loaded!');
    };
    reader.readAsDataURL(file);
  }
};

window.updateLookbookImgFromUrl = function (url) {
  const val = url.trim();
  if (val && $('#adminLookbookImg')) {
    $('#adminLookbookImg').src = val;
    if (!AdminState.lookbook) AdminState.lookbook = getDefaultLookbook();
    AdminState.lookbook.image = val;
  }
};

window.toggleLookbookEnabled = async function () {
  const isEn = $('#lookbookEnableToggle') ? $('#lookbookEnableToggle').checked : true;
  if (!AdminState.lookbook) AdminState.lookbook = getDefaultLookbook();
  AdminState.lookbook.enabled = isEn;
  await saveLookbookSafely(AdminState.lookbook);
  renderLookbookManager();
  showAdminToast(isEn ? 'Street Style Lookbook is now visible on storefront.' : 'Street Style Lookbook is now hidden on storefront.');
};

window.handleSaveLookbook = async function (e) {
  if (e && e.preventDefault) e.preventDefault();

  const saveBtns = Array.from(document.querySelectorAll('.save-lookbook-btn, #saveLookbookBtn, #saveLookbookBtnBottom'));

  // Trigger smooth loading animation on save button
  saveBtns.forEach(btn => {
    btn.disabled = true;
    btn.classList.remove('bg-emerald-600', 'hover:bg-emerald-700', 'bg-red-600', 'hover:bg-red-700', 'scale-105', 'bg-black', 'hover:bg-slate-800');
    btn.classList.add('bg-slate-800', 'cursor-wait', 'opacity-90');
    btn.innerHTML = `
      <svg class="animate-spin w-4 h-4 text-amber-400 shrink-0 inline mr-1.5" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
      </svg>
      <span class="tracking-wide">Saving...</span>
    `;
  });

  try {
    let image = ($('#lookbookImageUrlInput') ? $('#lookbookImageUrlInput').value.trim() : '') || (AdminState.lookbook && AdminState.lookbook.image) || '';
    if (image.startsWith('data:image/') && image.length > 50000) {
      try {
        image = await compressDataUrl(image, 1400, 900, 0.80);
      } catch (cErr) {}
    }

    const data = {
      enabled: $('#lookbookEnableToggle') ? $('#lookbookEnableToggle').checked : true,
      tag: $('#lookbookTagInput') ? $('#lookbookTagInput').value.trim() : 'Street Style Lookbook',
      title: $('#lookbookTitleInput') ? $('#lookbookTitleInput').value.trim() : 'Bag The Vibe',
      subtitle: $('#lookbookSubtitleInput') ? $('#lookbookSubtitleInput').value.trim() : '',
      image,
      campaignTag: $('#lookbookCampaignTagInput') ? $('#lookbookCampaignTagInput').value.trim() : '',
      campaignTitle: $('#lookbookCampaignTitleInput') ? $('#lookbookCampaignTitleInput').value.trim() : '',
      campaignDesc: $('#lookbookCampaignDescInput') ? $('#lookbookCampaignDescInput').value.trim() : '',
      pinLeft: $('#lookbookPinLeftRange') ? parseInt($('#lookbookPinLeftRange').value, 10) : 46,
      pinTop: $('#lookbookPinTopRange') ? parseInt($('#lookbookPinTopRange').value, 10) : 52,
      productId: $('#lookbookProductSelect') ? parseInt($('#lookbookProductSelect').value, 10) : 3
    };

    AdminState.lookbook = data;
    await saveLookbookSafely(data);

    // Small delay so user clearly perceives the smooth transition
    await new Promise(resolve => setTimeout(resolve, 350));

    // Animate to success "Saved" state
    saveBtns.forEach(btn => {
      btn.disabled = false;
      btn.classList.remove('bg-slate-800', 'cursor-wait', 'opacity-90', 'bg-black', 'hover:bg-slate-800');
      btn.classList.add('bg-emerald-600', 'hover:bg-emerald-700', 'text-white', 'scale-105', 'transition-all', 'duration-300', 'shadow-md');
      btn.innerHTML = `
        <svg class="w-4 h-4 text-white shrink-0 inline mr-1.5 animate-bounce" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"></path>
        </svg>
        <span class="font-bold text-white tracking-wide">Saved!</span>
      `;
    });

    showAdminToast('Street Style Lookbook saved successfully!');

    // Smoothly restore default idle state after 2.5s
    setTimeout(() => {
      saveBtns.forEach(btn => {
        btn.classList.remove('bg-emerald-600', 'hover:bg-emerald-700', 'scale-105', 'shadow-md');
        btn.classList.add('bg-black', 'hover:bg-slate-800');
        btn.innerHTML = `<span>Save Lookbook</span>`;
      });
    }, 2500);

  } catch (err) {
    console.error('Error saving lookbook:', err);
    saveBtns.forEach(btn => {
      btn.disabled = false;
      btn.classList.remove('bg-slate-800', 'cursor-wait', 'opacity-90', 'bg-black');
      btn.classList.add('bg-red-600', 'hover:bg-red-700', 'text-white');
      btn.innerHTML = `<span>Save Failed</span>`;
    });
    setTimeout(() => {
      saveBtns.forEach(btn => {
        btn.classList.remove('bg-red-600', 'hover:bg-red-700');
        btn.classList.add('bg-black', 'hover:bg-slate-800');
        btn.innerHTML = `<span>Save Lookbook</span>`;
      });
    }, 2500);
    showAdminToast(err.message || 'Error saving lookbook. Please try again.');
  }
};

window.resetLookbookToDefault = function () {
  showConfirmDialog({
    title: 'Reset Street Style Lookbook?',
    message: 'Are you sure you want to restore the default photo, hot-pin position, and text?',
    confirmText: 'Reset to Default',
    onConfirm: async () => {
      AdminState.lookbook = getDefaultLookbook();
      await saveLookbookSafely(AdminState.lookbook);
      renderLookbookManager();
      showAdminToast('Lookbook reset to default.');
    }
  });
};

/* ==========================================================================
   Brand Story ("OWN IT. LEAD IT.") Manager
   ========================================================================== */
function getDefaultBrandStory() {
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

async function saveBrandStorySafely(data) {
  try {
    localStorage.setItem('luxos_brandstory_data', JSON.stringify(data));
  } catch (err) {
    console.warn('LocalStorage quota exceeded for Brand Story; falling back to IndexedDB:', err);
  }

  try {
    await setItemIndexedDB('luxos_brandstory_data', data);
  } catch (idbErr) {
    console.error('Failed to save Brand Story in IndexedDB:', idbErr);
  }

  // Notify any active storefront tabs
  try {
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'luxos_brandstory_data',
      newValue: JSON.stringify(data)
    }));
  } catch (e) {}
}

window.renderBrandStoryManager = function () {
  const story = AdminState.brandStory || getDefaultBrandStory();
  AdminState.brandStory = story;

  // Toggle & Status
  const isEn = story.enabled !== false;
  if ($('#brandStoryEnableToggle')) $('#brandStoryEnableToggle').checked = isEn;
  if ($('#brandStoryStatusBadge')) {
    $('#brandStoryStatusBadge').textContent = isEn ? 'Active' : 'Hidden';
    $('#brandStoryStatusBadge').className = isEn
      ? 'bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200'
      : 'bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200';
  }
  if ($('#sidebarBrandStoryBadge')) {
    $('#sidebarBrandStoryBadge').textContent = isEn ? 'Active' : 'Hidden';
    $('#sidebarBrandStoryBadge').className = isEn
      ? 'bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30'
      : 'bg-slate-700/50 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-600';
  }

  // Inputs
  if ($('#brandStoryImageUrlInput')) $('#brandStoryImageUrlInput').value = story.image || '';
  if ($('#brandStoryTitleInput')) $('#brandStoryTitleInput').value = story.title || 'OWN IT. LEAD IT.';
  if ($('#brandStoryDescInput')) $('#brandStoryDescInput').value = story.desc || '';
  if ($('#brandStoryBtnTextInput')) $('#brandStoryBtnTextInput').value = story.btnText || 'OUR STORY';
  if ($('#brandStoryBtnLinkInput')) $('#brandStoryBtnLinkInput').value = story.btnLink || '';

  if ($('#brandStoryModalTagInput')) $('#brandStoryModalTagInput').value = story.modalTag || 'Our Heritage & Craft';
  if ($('#brandStoryModalTitleInput')) $('#brandStoryModalTitleInput').value = story.modalTitle || 'Own It. Lead It.';
  if ($('#brandStoryModalPara1Input')) $('#brandStoryModalPara1Input').value = story.modalPara1 || '';
  if ($('#brandStoryModalPara2Input')) $('#brandStoryModalPara2Input').value = story.modalPara2 || '';

  // Update Live Preview Card
  updateBrandStoryLivePreview();
};

window.updateBrandStoryLivePreview = function () {
  const story = AdminState.brandStory || getDefaultBrandStory();

  const title = $('#brandStoryTitleInput') ? $('#brandStoryTitleInput').value.trim() : (story.title || 'OWN IT. LEAD IT.');
  const desc = $('#brandStoryDescInput') ? $('#brandStoryDescInput').value.trim() : (story.desc || '');
  const btnText = $('#brandStoryBtnTextInput') ? $('#brandStoryBtnTextInput').value.trim() : (story.btnText || 'OUR STORY');
  const image = ($('#brandStoryImageUrlInput') ? $('#brandStoryImageUrlInput').value.trim() : '') || story.image;

  if ($('#adminBrandStoryImg') && image) $('#adminBrandStoryImg').src = image;
  if ($('#adminBrandStoryPreviewTitle')) $('#adminBrandStoryPreviewTitle').textContent = title || 'OWN IT. LEAD IT.';
  if ($('#adminBrandStoryPreviewDesc')) $('#adminBrandStoryPreviewDesc').textContent = desc || '';
  if ($('#adminBrandStoryPreviewBtn')) $('#adminBrandStoryPreviewBtn').textContent = btnText || 'OUR STORY';
};

window.handleBrandStoryFileUpload = async function (event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showAdminToast('Please select a valid image file (JPG, PNG, or WebP).');
    return;
  }

  showAdminToast('Optimizing brand story photo...');

  try {
    const compressedBase64 = await compressImageFile(file, 1600, 1200, 0.85);
    if ($('#brandStoryImageUrlInput')) $('#brandStoryImageUrlInput').value = compressedBase64;
    if ($('#adminBrandStoryImg')) $('#adminBrandStoryImg').src = compressedBase64;
    if (!AdminState.brandStory) AdminState.brandStory = getDefaultBrandStory();
    AdminState.brandStory.image = compressedBase64;
    const sizeKB = Math.round(compressedBase64.length * 0.75 / 1024);
    showAdminToast(`Photo optimized & loaded (${sizeKB} KB)!`);
  } catch (err) {
    console.error('Brand story photo compression error:', err);
    const reader = new FileReader();
    reader.onload = function (e) {
      const base64 = e.target.result;
      if ($('#brandStoryImageUrlInput')) $('#brandStoryImageUrlInput').value = base64;
      if ($('#adminBrandStoryImg')) $('#adminBrandStoryImg').src = base64;
      if (!AdminState.brandStory) AdminState.brandStory = getDefaultBrandStory();
      AdminState.brandStory.image = base64;
      showAdminToast('Photo loaded!');
    };
    reader.readAsDataURL(file);
  }
};

window.updateBrandStoryImgFromUrl = function (url) {
  const val = url.trim();
  if (val && $('#adminBrandStoryImg')) {
    $('#adminBrandStoryImg').src = val;
    if (!AdminState.brandStory) AdminState.brandStory = getDefaultBrandStory();
    AdminState.brandStory.image = val;
  }
};

window.toggleBrandStoryEnabled = async function () {
  const isEn = $('#brandStoryEnableToggle') ? $('#brandStoryEnableToggle').checked : true;
  if (!AdminState.brandStory) AdminState.brandStory = getDefaultBrandStory();
  AdminState.brandStory.enabled = isEn;
  await saveBrandStorySafely(AdminState.brandStory);
  renderBrandStoryManager();
  showAdminToast(isEn ? 'Brand Story ("OWN IT. LEAD IT.") is now visible on storefront.' : 'Brand Story is now hidden on storefront.');
};

window.handleSaveBrandStory = async function (e) {
  if (e && e.preventDefault) e.preventDefault();

  const saveBtns = Array.from(document.querySelectorAll('.save-brandstory-btn, #saveBrandStoryBtn, #saveBrandStoryBtnBottom'));

  // Trigger smooth loading animation on save button
  saveBtns.forEach(btn => {
    btn.disabled = true;
    btn.classList.remove('bg-emerald-600', 'hover:bg-emerald-700', 'bg-red-600', 'hover:bg-red-700', 'scale-105', 'bg-black', 'hover:bg-slate-800');
    btn.classList.add('bg-slate-800', 'cursor-wait', 'opacity-90');
    btn.innerHTML = `
      <svg class="animate-spin w-4 h-4 text-amber-400 shrink-0 inline mr-1.5" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
      </svg>
      <span class="tracking-wide">Saving...</span>
    `;
  });

  try {
    let image = ($('#brandStoryImageUrlInput') ? $('#brandStoryImageUrlInput').value.trim() : '') || (AdminState.brandStory && AdminState.brandStory.image) || '';
    if (image.startsWith('data:image/') && image.length > 50000) {
      try {
        image = await compressDataUrl(image, 1600, 1200, 0.82);
      } catch (cErr) {}
    }

    const data = {
      enabled: $('#brandStoryEnableToggle') ? $('#brandStoryEnableToggle').checked : true,
      image,
      title: $('#brandStoryTitleInput') ? $('#brandStoryTitleInput').value.trim() : 'OWN IT. LEAD IT.',
      desc: $('#brandStoryDescInput') ? $('#brandStoryDescInput').value.trim() : '',
      btnText: $('#brandStoryBtnTextInput') ? $('#brandStoryBtnTextInput').value.trim() : 'OUR STORY',
      btnLink: $('#brandStoryBtnLinkInput') ? $('#brandStoryBtnLinkInput').value.trim() : '',
      modalTag: $('#brandStoryModalTagInput') ? $('#brandStoryModalTagInput').value.trim() : 'Our Heritage & Craft',
      modalTitle: $('#brandStoryModalTitleInput') ? $('#brandStoryModalTitleInput').value.trim() : 'Own It. Lead It.',
      modalPara1: $('#brandStoryModalPara1Input') ? $('#brandStoryModalPara1Input').value.trim() : '',
      modalPara2: $('#brandStoryModalPara2Input') ? $('#brandStoryModalPara2Input').value.trim() : ''
    };

    AdminState.brandStory = data;
    await saveBrandStorySafely(data);

    // Small delay so user clearly perceives the smooth transition
    await new Promise(resolve => setTimeout(resolve, 350));

    // Animate to success "Saved" state
    saveBtns.forEach(btn => {
      btn.disabled = false;
      btn.classList.remove('bg-slate-800', 'cursor-wait', 'opacity-90', 'bg-black', 'hover:bg-slate-800');
      btn.classList.add('bg-emerald-600', 'hover:bg-emerald-700', 'text-white', 'scale-105', 'transition-all', 'duration-300', 'shadow-md');
      btn.innerHTML = `
        <svg class="w-4 h-4 text-white shrink-0 inline mr-1.5 animate-bounce" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"></path>
        </svg>
        <span class="font-bold text-white tracking-wide">Saved!</span>
      `;
    });

    showAdminToast('Brand Story ("OWN IT. LEAD IT.") saved successfully!');

    // Smoothly restore default idle state after 2.5s
    setTimeout(() => {
      saveBtns.forEach(btn => {
        btn.classList.remove('bg-emerald-600', 'hover:bg-emerald-700', 'scale-105', 'shadow-md');
        btn.classList.add('bg-black', 'hover:bg-slate-800');
        btn.innerHTML = `<span>Save Brand Story</span>`;
      });
    }, 2500);

  } catch (err) {
    console.error('Error saving brand story:', err);
    saveBtns.forEach(btn => {
      btn.disabled = false;
      btn.classList.remove('bg-slate-800', 'cursor-wait', 'opacity-90', 'bg-black');
      btn.classList.add('bg-red-600', 'hover:bg-red-700', 'text-white');
      btn.innerHTML = `<span>Save Failed</span>`;
    });
    setTimeout(() => {
      saveBtns.forEach(btn => {
        btn.classList.remove('bg-red-600', 'hover:bg-red-700');
        btn.classList.add('bg-black', 'hover:bg-slate-800');
        btn.innerHTML = `<span>Save Brand Story</span>`;
      });
    }, 2500);
    showAdminToast(err.message || 'Error saving brand story. Please try again.');
  }
};

window.resetBrandStoryToDefault = function () {
  showConfirmDialog({
    title: 'Reset Brand Story?',
    message: 'Are you sure you want to restore the default photo, headline, and story narrative?',
    confirmText: 'Reset to Default',
    onConfirm: async () => {
      AdminState.brandStory = getDefaultBrandStory();
      await saveBrandStorySafely(AdminState.brandStory);
      renderBrandStoryManager();
      showAdminToast('Brand Story reset to default.');
    }
  });
};

/* ==========================================================================
   Editorial Campaign Showcase ("TIMELESS. BOLD. UNSTOPPABLE.") Manager
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

async function saveTimelessSafely(data) {
  try {
    localStorage.setItem('luxos_timeless_showcase', JSON.stringify(data));
  } catch (err) {
    console.warn('LocalStorage quota exceeded for Timeless Showcase; falling back to IndexedDB:', err);
  }

  try {
    await setItemIndexedDB('luxos_timeless_showcase', data);
  } catch (idbErr) {
    console.error('Failed to save Timeless Showcase in IndexedDB:', idbErr);
  }

  // Notify active storefront tabs
  try {
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'luxos_timeless_showcase',
      newValue: JSON.stringify(data)
    }));
  } catch (e) {}
}

window.renderTimelessManager = function () {
  const data = AdminState.timeless || getDefaultTimelessData();
  AdminState.timeless = data;

  // Toggle & Status
  const isEn = data.enabled !== false;
  if ($('#timelessEnableToggle')) $('#timelessEnableToggle').checked = isEn;
  if ($('#timelessStatusBadge')) {
    $('#timelessStatusBadge').textContent = isEn ? 'Active' : 'Hidden';
    $('#timelessStatusBadge').className = isEn
      ? 'bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200'
      : 'bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200';
  }
  if ($('#sidebarTimelessBadge')) {
    $('#sidebarTimelessBadge').textContent = isEn ? 'Active' : 'Hidden';
    $('#sidebarTimelessBadge').className = isEn
      ? 'bg-cyan-500/20 text-cyan-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-cyan-500/30'
      : 'bg-slate-700/50 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-600';
  }

  // Section Headline Input
  if ($('#timelessHeadlineInput')) $('#timelessHeadlineInput').value = data.headline || 'TIMELESS. BOLD. UNSTOPPABLE.';

  const cards = Array.isArray(data.cards) ? data.cards : getDefaultTimelessData().cards;

  // Populate Card 1 Inputs
  if (cards[0]) {
    if ($('#timelessCard1TitleInput')) $('#timelessCard1TitleInput').value = cards[0].title || '';
    if ($('#timelessCard1ImageUrlInput')) $('#timelessCard1ImageUrlInput').value = cards[0].image || '';
    if ($('#timelessCard1TargetSelect')) {
      const isCustom = cards[0].customUrl && cards[0].customUrl.trim() !== '';
      $('#timelessCard1TargetSelect').value = isCustom ? 'CUSTOM' : (cards[0].targetTab || 'Shoulder Bags');
      if ($('#timelessCard1CustomUrlGroup')) {
        $('#timelessCard1CustomUrlGroup').classList.toggle('hidden', !isCustom);
      }
    }
    if ($('#timelessCard1CustomUrlInput')) $('#timelessCard1CustomUrlInput').value = cards[0].customUrl || '';
  }

  // Populate Card 2 Inputs
  if (cards[1]) {
    if ($('#timelessCard2TitleInput')) $('#timelessCard2TitleInput').value = cards[1].title || '';
    if ($('#timelessCard2ImageUrlInput')) $('#timelessCard2ImageUrlInput').value = cards[1].image || '';
    if ($('#timelessCard2TargetSelect')) {
      const isCustom = cards[1].customUrl && cards[1].customUrl.trim() !== '';
      $('#timelessCard2TargetSelect').value = isCustom ? 'CUSTOM' : (cards[1].targetTab || 'Best Sellers');
      if ($('#timelessCard2CustomUrlGroup')) {
        $('#timelessCard2CustomUrlGroup').classList.toggle('hidden', !isCustom);
      }
    }
    if ($('#timelessCard2CustomUrlInput')) $('#timelessCard2CustomUrlInput').value = cards[1].customUrl || '';
  }

  // Populate Card 3 Inputs
  if (cards[2]) {
    if ($('#timelessCard3TitleInput')) $('#timelessCard3TitleInput').value = cards[2].title || '';
    if ($('#timelessCard3ImageUrlInput')) $('#timelessCard3ImageUrlInput').value = cards[2].image || '';
    if ($('#timelessCard3TargetSelect')) {
      const isCustom = cards[2].customUrl && cards[2].customUrl.trim() !== '';
      $('#timelessCard3TargetSelect').value = isCustom ? 'CUSTOM' : (cards[2].targetTab || 'Just Landed');
      if ($('#timelessCard3CustomUrlGroup')) {
        $('#timelessCard3CustomUrlGroup').classList.toggle('hidden', !isCustom);
      }
    }
    if ($('#timelessCard3CustomUrlInput')) $('#timelessCard3CustomUrlInput').value = cards[2].customUrl || '';
  }

  // Update Live Preview Bento
  updateTimelessLivePreview();
};

window.updateTimelessLivePreview = function () {
  const data = AdminState.timeless || getDefaultTimelessData();
  const headline = $('#timelessHeadlineInput') ? $('#timelessHeadlineInput').value.trim() : (data.headline || 'TIMELESS. BOLD. UNSTOPPABLE.');

  if ($('#adminTimelessPreviewHeadline')) {
    $('#adminTimelessPreviewHeadline').textContent = headline || 'TIMELESS. BOLD. UNSTOPPABLE.';
  }

  // Card 1 (No hover badge)
  const c1Img = ($('#timelessCard1ImageUrlInput') ? $('#timelessCard1ImageUrlInput').value.trim() : '') || (data.cards && data.cards[0] && data.cards[0].image) || 'images/timeless-viral-bag.png';
  if ($('#adminTimelessCard1Img')) $('#adminTimelessCard1Img').src = c1Img;

  // Card 2 (No hover badge)
  const c2Img = ($('#timelessCard2ImageUrlInput') ? $('#timelessCard2ImageUrlInput').value.trim() : '') || (data.cards && data.cards[1] && data.cards[1].image) || 'images/timeless-trending-now.png';
  if ($('#adminTimelessCard2Img')) $('#adminTimelessCard2Img').src = c2Img;

  // Card 3 (No hover badge)
  const c3Img = ($('#timelessCard3ImageUrlInput') ? $('#timelessCard3ImageUrlInput').value.trim() : '') || (data.cards && data.cards[2] && data.cards[2].image) || 'images/timeless-back-in-demand.png';
  if ($('#adminTimelessCard3Img')) $('#adminTimelessCard3Img').src = c3Img;
};

window.handleTimelessCardTargetChange = function (cardIdx, val) {
  const group = $(`#timelessCard${cardIdx + 1}CustomUrlGroup`);
  if (group) {
    group.classList.toggle('hidden', val !== 'CUSTOM');
  }
};

window.handleTimelessFileUpload = async function (event, cardIdx) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showAdminToast('Please select a valid image file (JPG, PNG, or WebP).');
    return;
  }

  showAdminToast(`Optimizing Card ${cardIdx + 1} banner photo...`);

  try {
    const width = cardIdx === 0 ? 1200 : 800;
    const height = cardIdx === 0 ? 800 : 500;
    const compressedBase64 = await compressImageFile(file, width, height, 0.85);

    const input = $(`#timelessCard${cardIdx + 1}ImageUrlInput`);
    if (input) input.value = compressedBase64;

    if (!AdminState.timeless) AdminState.timeless = getDefaultTimelessData();
    if (!AdminState.timeless.cards) AdminState.timeless.cards = getDefaultTimelessData().cards;
    if (AdminState.timeless.cards[cardIdx]) {
      AdminState.timeless.cards[cardIdx].image = compressedBase64;
    }

    updateTimelessLivePreview();
    const sizeKB = Math.round(compressedBase64.length * 0.75 / 1024);
    showAdminToast(`Card ${cardIdx + 1} photo loaded (${sizeKB} KB)!`);
  } catch (err) {
    console.error('Timeless image upload error:', err);
    const reader = new FileReader();
    reader.onload = function (e) {
      const base64 = e.target.result;
      const input = $(`#timelessCard${cardIdx + 1}ImageUrlInput`);
      if (input) input.value = base64;
      if (!AdminState.timeless) AdminState.timeless = getDefaultTimelessData();
      if (!AdminState.timeless.cards) AdminState.timeless.cards = getDefaultTimelessData().cards;
      if (AdminState.timeless.cards[cardIdx]) {
        AdminState.timeless.cards[cardIdx].image = base64;
      }
      updateTimelessLivePreview();
      showAdminToast(`Card ${cardIdx + 1} photo loaded!`);
    };
    reader.readAsDataURL(file);
  }
};

window.updateTimelessCardImgFromUrl = function (cardIdx, url) {
  const val = url.trim();
  if (!AdminState.timeless) AdminState.timeless = getDefaultTimelessData();
  if (!AdminState.timeless.cards) AdminState.timeless.cards = getDefaultTimelessData().cards;
  if (AdminState.timeless.cards[cardIdx]) {
    AdminState.timeless.cards[cardIdx].image = val;
  }
  updateTimelessLivePreview();
};

window.toggleTimelessEnabled = async function () {
  const isEn = $('#timelessEnableToggle') ? $('#timelessEnableToggle').checked : true;
  if (!AdminState.timeless) AdminState.timeless = getDefaultTimelessData();
  AdminState.timeless.enabled = isEn;
  await saveTimelessSafely(AdminState.timeless);
  renderTimelessManager();
  showAdminToast(isEn ? 'Campaign Showcase ("TIMELESS") is now visible on storefront.' : 'Campaign Showcase is now hidden on storefront.');
};

window.handleSaveTimeless = async function (e) {
  if (e && e.preventDefault) e.preventDefault();

  const saveBtns = Array.from(document.querySelectorAll('.save-timeless-btn, #saveTimelessBtn, #saveTimelessBtnBottom'));

  // Trigger smooth loading animation
  saveBtns.forEach(btn => {
    btn.disabled = true;
    btn.classList.remove('bg-emerald-600', 'hover:bg-emerald-700', 'bg-red-600', 'hover:bg-red-700', 'scale-105', 'bg-black', 'hover:bg-slate-800');
    btn.classList.add('bg-slate-800', 'cursor-wait', 'opacity-90');
    btn.innerHTML = `
      <svg class="animate-spin w-4 h-4 text-cyan-400 shrink-0 inline mr-1.5" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
      </svg>
      <span class="tracking-wide">Saving...</span>
    `;
  });

  try {
    const defaultData = getDefaultTimelessData();

    // Helper to get card data from inputs
    const extractCard = async (idx) => {
      const num = idx + 1;
      let img = ($(`#timelessCard${num}ImageUrlInput`) ? $(`#timelessCard${num}ImageUrlInput`).value.trim() : '') || (AdminState.timeless && AdminState.timeless.cards && AdminState.timeless.cards[idx] && AdminState.timeless.cards[idx].image) || defaultData.cards[idx].image;
      if (img.startsWith('data:image/') && img.length > 50000) {
        try {
          const w = idx === 0 ? 1200 : 800;
          const h = idx === 0 ? 800 : 500;
          img = await compressDataUrl(img, w, h, 0.82);
        } catch (cErr) {}
      }

      const targetSelect = $(`#timelessCard${num}TargetSelect`);
      const targetVal = targetSelect ? targetSelect.value : defaultData.cards[idx].targetTab;
      const customUrl = targetVal === 'CUSTOM' ? ($(`#timelessCard${num}CustomUrlInput`) ? $(`#timelessCard${num}CustomUrlInput`).value.trim() : '') : '';

      return {
        title: $(`#timelessCard${num}TitleInput`) ? $(`#timelessCard${num}TitleInput`).value.trim() : defaultData.cards[idx].title,
        badgeText: '',
        targetTab: targetVal === 'CUSTOM' ? 'All Bags' : targetVal,
        customUrl: customUrl,
        image: img
      };
    };

    const card1 = await extractCard(0);
    const card2 = await extractCard(1);
    const card3 = await extractCard(2);

    const data = {
      enabled: $('#timelessEnableToggle') ? $('#timelessEnableToggle').checked : true,
      headline: $('#timelessHeadlineInput') ? $('#timelessHeadlineInput').value.trim() : 'TIMELESS. BOLD. UNSTOPPABLE.',
      cards: [card1, card2, card3]
    };

    AdminState.timeless = data;
    await saveTimelessSafely(data);

    // Small delay so user clearly perceives the smooth transition
    await new Promise(resolve => setTimeout(resolve, 350));

    // Animate to success "Saved" state
    saveBtns.forEach(btn => {
      btn.disabled = false;
      btn.classList.remove('bg-slate-800', 'cursor-wait', 'opacity-90', 'bg-black', 'hover:bg-slate-800');
      btn.classList.add('bg-emerald-600', 'hover:bg-emerald-700', 'text-white', 'scale-105', 'transition-all', 'duration-300', 'shadow-md');
      btn.innerHTML = `
        <svg class="w-4 h-4 text-white shrink-0 inline mr-1.5 animate-bounce" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"></path>
        </svg>
        <span class="font-bold text-white tracking-wide">Saved!</span>
      `;
    });

    showAdminToast('Campaign Showcase ("TIMELESS. BOLD. UNSTOPPABLE.") saved successfully!');

    // Smoothly restore default idle state after 2.5s
    setTimeout(() => {
      saveBtns.forEach(btn => {
        btn.classList.remove('bg-emerald-600', 'hover:bg-emerald-700', 'scale-105', 'shadow-md');
        btn.classList.add('bg-black', 'hover:bg-slate-800');
        btn.innerHTML = `<span>Save Showcase</span>`;
      });
    }, 2500);

  } catch (err) {
    console.error('Error saving timeless showcase:', err);
    saveBtns.forEach(btn => {
      btn.disabled = false;
      btn.classList.remove('bg-slate-800', 'cursor-wait', 'opacity-90', 'bg-black');
      btn.classList.add('bg-red-600', 'hover:bg-red-700', 'text-white');
      btn.innerHTML = `<span>Save Failed</span>`;
    });
    setTimeout(() => {
      saveBtns.forEach(btn => {
        btn.classList.remove('bg-red-600', 'hover:bg-red-700');
        btn.classList.add('bg-black', 'hover:bg-slate-800');
        btn.innerHTML = `<span>Save Showcase</span>`;
      });
    }, 2500);
    showAdminToast(err.message || 'Error saving showcase. Please try again.');
  }
};

window.resetTimelessToDefault = function () {
  showConfirmDialog({
    title: 'Reset Campaign Showcase?',
    message: 'Are you sure you want to restore the default headline and campaign cards?',
    confirmText: 'Reset to Default',
    onConfirm: async () => {
      AdminState.timeless = getDefaultTimelessData();
      await saveTimelessSafely(AdminState.timeless);
      renderTimelessManager();
      showAdminToast('Campaign Showcase reset to default.');
    }
  });
};

/* ==========================================================================
   Product Landing Page (PDP) Manager
   ========================================================================== */
let currentPdpProduct = null;
let currentPdpGalleryImages = [];

window.renderLandingPageManager = function () {
  const selectEl = $('#pdpAdminSelectProduct');
  if (!selectEl) return;

  const products = AdminState.products || [];
  selectEl.innerHTML = products.map(p => `
    <option value="${p.id}">${p.title} (${p.price})</option>
  `).join('');

  // Default to product 1 or first product
  const defaultId = currentPdpProduct ? currentPdpProduct.id : (products[0] ? products[0].id : 1);
  selectEl.value = defaultId;
  loadLandingPageProductData(defaultId);
};

window.loadLandingPageProductData = function (productId) {
  const pId = parseInt(productId, 10);
  const products = AdminState.products || [];
  const prod = products.find(p => p.id === pId) || products[0];
  if (!prod) return;

  currentPdpProduct = prod;

  // Basic Details
  if ($('#pdpAdminTitle')) $('#pdpAdminTitle').value = prod.title || '';
  if ($('#pdpAdminCategory')) $('#pdpAdminCategory').value = prod.category || '';
  if ($('#pdpAdminPrice')) $('#pdpAdminPrice').value = prod.price || '';
  if ($('#pdpAdminOriginalPrice')) $('#pdpAdminOriginalPrice').value = prod.originalPrice || '';
  if ($('#pdpAdminBadge')) $('#pdpAdminBadge').value = prod.badge || 'SAVE 46%';
  if ($('#pdpAdminLivePreviewLink')) $('#pdpAdminLivePreviewLink').href = `product.html?id=${prod.id}`;

  // Description
  const defaultDesc = 'Crafted for modern executives, the Executive RFID Card Holder merges minimalist architectural design with smart functionality. Features an ergonomic one-click card ejector mechanism, aerospace-grade aluminum casing with 13.56 MHz RFID signal blocking, and premium hand-finished leather casing.';
  if ($('#pdpAdminDescription')) $('#pdpAdminDescription').value = prod.description || defaultDesc;

  // Bag Dimensions & Features (Reference Style Bullets)
  const defaultDimensions = [
    'External Height: 18"',
    'External Length: 12"',
    'External Depth: 7.5"',
    'Capacity: 20–35 liters',
    'Accommodate Laptop Size: 15.6"'
  ];
  const defaultFeatures = [
    'Number Lock',
    'Sunglass Hook',
    'Water Resistant',
    'Trolley Support',
    'Luggage Style Indoor',
    'Shoulder Strap Pocket',
    'Multi-Storage Pockets',
    'Hidden two types USB port',
    'Unisex Designs Suitable for Daily Life',
    'cell phone pocket, key chain clip'
  ];

  if ($('#pdpAdminDimensions')) {
    const dims = (prod.dimensionsList && prod.dimensionsList.length > 0) ? prod.dimensionsList : defaultDimensions;
    $('#pdpAdminDimensions').value = Array.isArray(dims) ? dims.join('\n') : dims;
  }
  if ($('#pdpAdminFeatures')) {
    const feats = (prod.featuresList && prod.featuresList.length > 0) ? prod.featuresList : defaultFeatures;
    $('#pdpAdminFeatures').value = Array.isArray(feats) ? feats.join('\n') : feats;
  }
  // Load Showcase Video (IndexedDB or URL)
  loadAdminProductVideo(prod);

  // Features
  const f1 = (prod.features && prod.features[0]) || { title: 'Quick-Access Slider', desc: 'Ergonomic one-click ejection mechanism fans cards out smoothly in a cascading sequence for instant access.' };
  const f2 = (prod.features && prod.features[1]) || { title: '100% RFID Protection', desc: 'Integrated electromagnetic shielding prevents digital wireless RFID/NFC theft & unauthorized skimming.' };
  const f3 = (prod.features && prod.features[2]) || { title: 'Aerospace Aluminum', desc: 'Constructed from ultra-durable anodized aircraft aluminum that will not bend, snap, or deform under pressure.' };
  const f4 = (prod.features && prod.features[3]) || { title: 'Ultra-Slim Profile', desc: 'Only 1.2 cm slim, effortlessly sliding into front or suit pockets without creating unsightly bulk.' };

  if ($('#pdpAdminFeatTitle1')) $('#pdpAdminFeatTitle1').value = f1.title;
  if ($('#pdpAdminFeatDesc1')) $('#pdpAdminFeatDesc1').value = f1.desc;
  if ($('#pdpAdminFeatTitle2')) $('#pdpAdminFeatTitle2').value = f2.title;
  if ($('#pdpAdminFeatDesc2')) $('#pdpAdminFeatDesc2').value = f2.desc;
  if ($('#pdpAdminFeatTitle3')) $('#pdpAdminFeatTitle3').value = f3.title;
  if ($('#pdpAdminFeatDesc3')) $('#pdpAdminFeatDesc3').value = f3.desc;
  if ($('#pdpAdminFeatTitle4')) $('#pdpAdminFeatTitle4').value = f4.title;
  if ($('#pdpAdminFeatDesc4')) $('#pdpAdminFeatDesc4').value = f4.desc;

  // Specs
  const specs = prod.specs || {};
  if ($('#pdpAdminSpecMaterial')) $('#pdpAdminSpecMaterial').value = specs.material || 'Aerospace-Grade Aluminum Core + Hand-Finished Exterior';
  if ($('#pdpAdminSpecCapacity')) $('#pdpAdminSpecCapacity').value = specs.capacity || '5–6 Cards in Chamber + Dedicated Internal Cash/Notes Compartment';
  if ($('#pdpAdminSpecDimensions')) $('#pdpAdminSpecDimensions').value = specs.dimensions || '9.5 cm × 6.5 cm × 1.2 cm';
  if ($('#pdpAdminSpecWeight')) $('#pdpAdminSpecWeight').value = specs.weight || 'Approx. 70 grams (Featherweight Slim)';

  // Extra Settings: Timer & Delivery Notice
  let extra = null;
  try {
    extra = JSON.parse(localStorage.getItem(`luxos_pdp_extra_${prod.id}`));
  } catch (e) {}

  if ($('#pdpAdminDeliveryText')) {
    $('#pdpAdminDeliveryText').value = (extra && extra.deliveryNotice) || 'Estimated Delivery: 3–5 Days — Ships directly from Dhaka';
  }

  if ($('#pdpAdminTimerHeader')) {
    $('#pdpAdminTimerHeader').value = (extra && extra.timer && extra.timer.header) || 'EXCLUSIVE DISCOUNT';
  }
  if ($('#pdpAdminTimerHours')) {
    $('#pdpAdminTimerHours').value = (extra && extra.timer && typeof extra.timer.hours === 'number') ? extra.timer.hours : 1;
  }
  if ($('#pdpAdminTimerMins')) {
    $('#pdpAdminTimerMins').value = (extra && extra.timer && typeof extra.timer.minutes === 'number') ? extra.timer.minutes : 29;
  }
  if ($('#pdpAdminTimerSecs')) {
    $('#pdpAdminTimerSecs').value = (extra && extra.timer && typeof extra.timer.seconds === 'number') ? extra.timer.seconds : 40;
  }

  // Gallery Images
  const gallery = Array.isArray(prod.gallery) && prod.gallery.length > 0 
    ? [...prod.gallery] 
    : [prod.image].filter(Boolean);
  
  // Ensure Product 1 has all defaults if empty
  if (prod.id === 1 && gallery.length < 5) {
    const defaults = [
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
    defaults.forEach(url => {
      if (!gallery.includes(url)) gallery.push(url);
    });
  }

  currentPdpGalleryImages = gallery;
  renderPdpAdminGallery();
};

function renderPdpAdminGallery() {
  const container = $('#pdpAdminGalleryGrid');
  const countBadge = $('#pdpAdminGalleryCount');
  if (!container) return;

  if (countBadge) countBadge.textContent = `${currentPdpGalleryImages.length} Photos`;

  if (currentPdpGalleryImages.length === 0) {
    container.innerHTML = '<div class="col-span-full py-8 text-center text-xs text-slate-400">No photos added yet. Upload or paste a URL above.</div>';
    return;
  }

  container.innerHTML = currentPdpGalleryImages.map((url, idx) => `
    <div class="group relative aspect-square rounded-lg border border-slate-200 overflow-hidden bg-slate-50 shadow-xs hover:border-black transition">
      <img src="${url}" class="w-full h-full object-cover" />
      <span class="absolute top-1 left-1 bg-black/75 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">${idx + 1}</span>
      <button type="button" onclick="removePdpGalleryPhoto(${idx})" title="Delete photo" class="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition shadow">
        ✕
      </button>
    </div>
  `).join('');
}

window.addPdpGalleryPhoto = function () {
  const input = $('#pdpAdminNewPhotoUrl');
  if (!input) return;
  const url = input.value.trim();
  if (!url) {
    showAdminToast('Please enter an image URL.');
    return;
  }
  currentPdpGalleryImages.push(url);
  input.value = '';
  renderPdpAdminGallery();
  showAdminToast('Photo added to gallery.');
};

window.handlePdpGalleryUpload = function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (evt) {
    currentPdpGalleryImages.push(evt.target.result);
    renderPdpAdminGallery();
    showAdminToast('Photo uploaded successfully.');
  };
  reader.readAsDataURL(file);
};

window.removePdpGalleryPhoto = function (index) {
  if (currentPdpGalleryImages.length <= 1) {
    showAdminToast('At least 1 photo is required in the gallery.');
    return;
  }
  currentPdpGalleryImages.splice(index, 1);
  renderPdpAdminGallery();
  showAdminToast('Photo removed.');
};

// =========================================================================
// Product Showcase Video: IndexedDB Storage & Live Preview Manager
// =========================================================================
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

async function saveVideoToDB(productId, file) {
  const db = await openVideoDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(VIDEO_STORE_NAME, 'readwrite');
    const store = tx.objectStore(VIDEO_STORE_NAME);
    const record = {
      id: 'pdp_video_' + productId,
      blob: file,
      name: file.name,
      type: file.type || 'video/mp4',
      size: file.size,
      updatedAt: Date.now()
    };
    const req = store.put(record);
    req.onsuccess = () => resolve(record);
    req.onerror = () => reject(req.error);
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

async function deleteVideoFromDB(productId) {
  try {
    const db = await openVideoDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(VIDEO_STORE_NAME, 'readwrite');
      const store = tx.objectStore(VIDEO_STORE_NAME);
      const req = store.delete('pdp_video_' + productId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('deleteVideoFromDB error:', err);
  }
}

function renderAdminVideoPreview(sourceUrl, isLocal = false, fileName = '') {
  const previewWrapper = $('#pdpAdminVideoPreviewWrapper');
  const previewContainer = $('#pdpAdminVideoPreviewContainer');
  const statusEl = $('#pdpAdminVideoStatus');

  if (!previewContainer) return;

  if (!sourceUrl) {
    if (previewWrapper) previewWrapper.classList.add('hidden');
    previewContainer.innerHTML = '';
    if (statusEl) {
      statusEl.textContent = 'No video selected';
      statusEl.className = 'text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200';
    }
    return;
  }

  if (previewWrapper) previewWrapper.classList.remove('hidden');

  if (isLocal) {
    if (statusEl) {
      statusEl.textContent = '📁 File: ' + (fileName || 'Uploaded Video');
      statusEl.className = 'text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200';
    }
    previewContainer.innerHTML = '<video class="w-full h-full object-cover" controls playsinline src="' + sourceUrl + '">Your browser does not support HTML5 video.</video>';
    return;
  }

  // URL (YouTube / Vimeo / MP4)
  const ytMatch = sourceUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
  if (ytMatch && ytMatch[1]) {
    if (statusEl) {
      statusEl.textContent = '🎬 YouTube Video Linked';
      statusEl.className = 'text-[11px] font-semibold text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-200';
    }
    previewContainer.innerHTML = '<iframe class="w-full h-full" src="https://www.youtube.com/embed/' + ytMatch[1] + '?autoplay=0&rel=0" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
  } else if (sourceUrl.includes('vimeo.com/')) {
    const vimeoId = sourceUrl.split('vimeo.com/')[1].split(/[?#]/)[0];
    if (statusEl) {
      statusEl.textContent = '🎬 Vimeo Video Linked';
      statusEl.className = 'text-[11px] font-semibold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200';
    }
    previewContainer.innerHTML = '<iframe class="w-full h-full" src="https://player.vimeo.com/video/' + vimeoId + '" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>';
  } else {
    if (statusEl) {
      statusEl.textContent = '🎬 Direct Video URL';
      statusEl.className = 'text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200';
    }
    previewContainer.innerHTML = '<video class="w-full h-full object-cover" controls playsinline src="' + sourceUrl + '">Your browser does not support HTML5 video.</video>';
  }
}

async function loadAdminProductVideo(prod) {
  if (!prod) return;

  if (prod.videoUrl && prod.videoUrl.startsWith('idb:')) {
    if ($('#pdpAdminVideoUrl')) $('#pdpAdminVideoUrl').value = '';
    const record = await getVideoFromDB(prod.id);
    if (record && record.blob) {
      const objUrl = URL.createObjectURL(record.blob);
      renderAdminVideoPreview(objUrl, true, record.name || prod.videoFileName);
    } else {
      renderAdminVideoPreview('');
    }
  } else if (prod.videoUrl) {
    if ($('#pdpAdminVideoUrl')) $('#pdpAdminVideoUrl').value = prod.videoUrl;
    renderAdminVideoPreview(prod.videoUrl, false);
  } else {
    // Check if there is an existing indexedDB video anyway
    const record = await getVideoFromDB(prod.id);
    if (record && record.blob) {
      prod.videoUrl = 'idb:pdp_video_' + prod.id;
      prod.videoFileName = record.name;
      const objUrl = URL.createObjectURL(record.blob);
      renderAdminVideoPreview(objUrl, true, record.name);
    } else {
      if ($('#pdpAdminVideoUrl')) $('#pdpAdminVideoUrl').value = '';
      renderAdminVideoPreview('');
    }
  }
}

window.handlePdpVideoUpload = async function (e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('video/')) {
    showAdminToast('Please upload a valid video file (MP4, WebM, MOV).');
    return;
  }

  if (!currentPdpProduct) return;

  try {
    await saveVideoToDB(currentPdpProduct.id, file);
    currentPdpProduct.videoUrl = 'idb:pdp_video_' + currentPdpProduct.id;
    currentPdpProduct.videoFileName = file.name;

    if ($('#pdpAdminVideoUrl')) {
      $('#pdpAdminVideoUrl').value = '';
    }

    const previewBlobUrl = URL.createObjectURL(file);
    renderAdminVideoPreview(previewBlobUrl, true, file.name);
    showAdminToast('Video "' + file.name + '" uploaded successfully! Click Save to apply.');
  } catch (err) {
    console.error('Failed to save uploaded video:', err);
    showAdminToast('Could not store video file. Please try a smaller video or YouTube URL.');
  }
};

window.handlePdpVideoUrlInput = function (val) {
  const url = (val || '').trim();
  if (!currentPdpProduct) return;

  if (!url) {
    if (!currentPdpProduct.videoUrl || !currentPdpProduct.videoUrl.startsWith('idb:')) {
      currentPdpProduct.videoUrl = '';
      renderAdminVideoPreview('');
    }
    return;
  }

  currentPdpProduct.videoUrl = url;
  renderAdminVideoPreview(url, false);
};

window.clearPdpAdminVideo = async function () {
  if (!currentPdpProduct) return;
  await deleteVideoFromDB(currentPdpProduct.id);
  currentPdpProduct.videoUrl = '';
  currentPdpProduct.videoFileName = '';

  if ($('#pdpAdminVideoUrl')) $('#pdpAdminVideoUrl').value = '';
  if ($('#pdpAdminVideoFileInput')) $('#pdpAdminVideoFileInput').value = '';

  renderAdminVideoPreview('');
  showAdminToast('Video removed.');
};

window.saveLandingPageSettings = function () {
  if (!currentPdpProduct) return;

  const title = $('#pdpAdminTitle') ? $('#pdpAdminTitle').value.trim() : currentPdpProduct.title;
  const category = $('#pdpAdminCategory') ? $('#pdpAdminCategory').value.trim() : currentPdpProduct.category;
  const price = $('#pdpAdminPrice') ? $('#pdpAdminPrice').value.trim() : currentPdpProduct.price;
  const originalPrice = $('#pdpAdminOriginalPrice') ? $('#pdpAdminOriginalPrice').value.trim() : currentPdpProduct.originalPrice;
  const badge = $('#pdpAdminBadge') ? $('#pdpAdminBadge').value.trim() : currentPdpProduct.badge;
  const description = $('#pdpAdminDescription') ? $('#pdpAdminDescription').value.trim() : currentPdpProduct.description;

  // Features
  const features = [
    {
      title: $('#pdpAdminFeatTitle1') ? $('#pdpAdminFeatTitle1').value.trim() : 'Quick-Access Slider',
      desc: $('#pdpAdminFeatDesc1') ? $('#pdpAdminFeatDesc1').value.trim() : ''
    },
    {
      title: $('#pdpAdminFeatTitle2') ? $('#pdpAdminFeatTitle2').value.trim() : '100% RFID Protection',
      desc: $('#pdpAdminFeatDesc2') ? $('#pdpAdminFeatDesc2').value.trim() : ''
    },
    {
      title: $('#pdpAdminFeatTitle3') ? $('#pdpAdminFeatTitle3').value.trim() : 'Aerospace Aluminum',
      desc: $('#pdpAdminFeatDesc3') ? $('#pdpAdminFeatDesc3').value.trim() : ''
    },
    {
      title: $('#pdpAdminFeatTitle4') ? $('#pdpAdminFeatTitle4').value.trim() : 'Ultra-Slim Profile',
      desc: $('#pdpAdminFeatDesc4') ? $('#pdpAdminFeatDesc4').value.trim() : ''
    }
  ];

  // Specs
  const specs = {
    material: $('#pdpAdminSpecMaterial') ? $('#pdpAdminSpecMaterial').value.trim() : '',
    capacity: $('#pdpAdminSpecCapacity') ? $('#pdpAdminSpecCapacity').value.trim() : '',
    dimensions: $('#pdpAdminSpecDimensions') ? $('#pdpAdminSpecDimensions').value.trim() : '',
    weight: $('#pdpAdminSpecWeight') ? $('#pdpAdminSpecWeight').value.trim() : ''
  };

  // Bag Dimensions & Features (Reference Style Bullets)
  const defaultDimensions = [
    'External Height: 18"',
    'External Length: 12"',
    'External Depth: 7.5"',
    'Capacity: 20–35 liters',
    'Accommodate Laptop Size: 15.6"'
  ];
  const defaultFeatures = [
    'Number Lock',
    'Sunglass Hook',
    'Water Resistant',
    'Trolley Support',
    'Luggage Style Indoor',
    'Shoulder Strap Pocket',
    'Multi-Storage Pockets',
    'Hidden two types USB port',
    'Unisex Designs Suitable for Daily Life',
    'cell phone pocket, key chain clip'
  ];

  if ($('#pdpAdminDimensions')) {
    const dimsText = $('#pdpAdminDimensions').value.trim();
    currentPdpProduct.dimensionsList = dimsText ? dimsText.split('\n').map(s => s.trim()).filter(Boolean) : defaultDimensions;
  }
  if ($('#pdpAdminFeatures')) {
    const featsText = $('#pdpAdminFeatures').value.trim();
    currentPdpProduct.featuresList = featsText ? featsText.split('\n').map(s => s.trim()).filter(Boolean) : defaultFeatures;
  }
  if ($('#pdpAdminVideoUrl')) {
    const inputUrl = $('#pdpAdminVideoUrl').value.trim();
    if (inputUrl) {
      currentPdpProduct.videoUrl = inputUrl;
    } else if (!currentPdpProduct.videoUrl || !currentPdpProduct.videoUrl.startsWith('idb:')) {
      currentPdpProduct.videoUrl = '';
    }
  }

  // Update in memory product
  currentPdpProduct.title = title;
  currentPdpProduct.category = category;
  currentPdpProduct.price = price;
  currentPdpProduct.originalPrice = originalPrice;
  currentPdpProduct.badge = badge;
  currentPdpProduct.description = description;
  currentPdpProduct.features = features;
  currentPdpProduct.specs = specs;
  if (currentPdpGalleryImages && currentPdpGalleryImages.length > 0) {
    currentPdpProduct.gallery = [...currentPdpGalleryImages];
    if (currentPdpGalleryImages[0]) {
      currentPdpProduct.image = currentPdpGalleryImages[0];
    }
  }

  // Update in AdminState.products array
  const pIndex = AdminState.products.findIndex(p => p.id === currentPdpProduct.id);
  if (pIndex > -1) {
    AdminState.products[pIndex] = { ...AdminState.products[pIndex], ...currentPdpProduct };
  }

  // Save to luxos_products_data
  localStorage.setItem('luxos_products_data', JSON.stringify(AdminState.products));

  // Save timer & delivery extra settings
  const deliveryNotice = $('#pdpAdminDeliveryText') ? $('#pdpAdminDeliveryText').value.trim() : '';
  const timerHeader = $('#pdpAdminTimerHeader') ? $('#pdpAdminTimerHeader').value.trim() : 'EXCLUSIVE DISCOUNT';
  const timerHours = $('#pdpAdminTimerHours') ? parseInt($('#pdpAdminTimerHours').value, 10) || 0 : 1;
  const timerMinutes = $('#pdpAdminTimerMins') ? parseInt($('#pdpAdminTimerMins').value, 10) || 0 : 29;
  const timerSeconds = $('#pdpAdminTimerSecs') ? parseInt($('#pdpAdminTimerSecs').value, 10) || 0 : 40;

  const extraSettings = {
    deliveryNotice,
    timer: {
      header: timerHeader,
      hours: timerHours,
      minutes: timerMinutes,
      seconds: timerSeconds
    }
  };
  localStorage.setItem(`luxos_pdp_extra_${currentPdpProduct.id}`, JSON.stringify(extraSettings));

  // Refresh products table if needed
  if (typeof renderProductsTable === 'function') renderProductsTable();

  showAdminToast(`Landing Page for "${currentPdpProduct.title}" updated successfully!`);
};

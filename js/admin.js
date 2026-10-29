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
});

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
    'landing-page': 'Product Landing Page Management (PDP)',
    banners: 'Hero Banners & Slideshow',
    collections: 'Shop by Collection (Curated Story Circles)',
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
  if (tabName === 'landing-page') renderLandingPageManager();
  if (tabName === 'banners') renderBannersTable();
  if (tabName === 'collections') renderCollectionsManager();
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
        <span class="font-semibold ${p.stock < 5 ? 'text-red-600' : 'text-slate-800'}">${p.stock || 12} in stock</span>
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
  $('#prodRating').value = '4.8';
  $('#prodImage').value = '';
  $('#prodDescription').value = '';

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
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/') || dataUrl.length < 150000) {
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

function saveProductsSafely(products) {
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
  $('#prodStock').value = product.stock || 10;
  $('#prodRating').value = product.rating || '4.8';
  $('#prodImage').value = product.image;
  $('#prodDescription').value = product.description || '';

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
    const stock = parseInt($('#prodStock').value || 10, 10);
    const rating = $('#prodRating').value.trim() || '4.8';
    
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
    const description = $('#prodDescription').value.trim();

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

  $('#bannerFormModal').classList.add('active');
};

window.closeBannerModal = function () {
  $('#bannerFormModal').classList.remove('active');
};

window.handleBannerFileUpload = function (event, type) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showAdminToast('Please select an image file (JPG, PNG, or WebP).');
    return;
  }

  // Size guideline check
  const maxBytes = 3 * 1024 * 1024; // 3MB limit check
  const sizeKB = Math.round(file.size / 1024);
  const sizeStr = sizeKB > 1024 ? (sizeKB / 1024).toFixed(1) + ' MB' : sizeKB + ' KB';

  if (file.size > maxBytes) {
    showAdminToast(`Warning: File is ${sizeStr}! For fast website loading, under 2 MB is recommended.`);
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const base64 = e.target.result;
    if (type === 'desktop') {
      $('#bannerDesktopImg').value = base64;
      previewBannerImg(base64);
      const info = $('#bannerImgPreviewInfo');
      if (info) info.textContent = `${file.name} (${sizeStr})`;
      showAdminToast(`Desktop photo loaded (${sizeStr})!`);
    } else {
      $('#bannerMobileImg').value = base64;
      previewMobileBannerImg(base64);
      showAdminToast(`Mobile photo loaded (${sizeStr})!`);
    }
  };
  reader.readAsDataURL(file);
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
  const banner = AdminState.heroSlides.find(s => s.id === id);
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

  $('#bannerFormModal').classList.add('active');
};

window.handleSaveBanner = function (e) {
  e.preventDefault();

  const id = $('#editBannerId').value;
  const desktopImage = $('#bannerDesktopImg').value.trim();
  const mobileImage = $('#bannerMobileImg').value.trim() || desktopImage;
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
      showAdminToast('Banner updated successfully.');
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
    showAdminToast('New hero banner created.');
  }

  // Persist to localStorage for storefront sync
  localStorage.setItem('luxos_hero_slides', JSON.stringify(AdminState.heroSlides));

  closeBannerModal();
  renderBannersTable();
};

window.toggleBannerActive = function (id) {
  const banner = AdminState.heroSlides.find(s => s.id === id);
  if (!banner) return;

  banner.active = !banner.active;
  localStorage.setItem('luxos_hero_slides', JSON.stringify(AdminState.heroSlides));
  renderBannersTable();
  showAdminToast(`Banner ${banner.active ? 'activated' : 'hidden'}.`);
};

window.deleteBanner = function (id) {
  const banner = AdminState.heroSlides.find(s => s.id === id);
  showConfirmDialog({
    title: 'Remove Hero Banner?',
    message: `Are you sure you want to remove "${banner && banner.heading ? banner.heading : 'this banner'}" from the slideshow?`,
    confirmText: 'Remove Banner',
    onConfirm: () => {
      AdminState.heroSlides = AdminState.heroSlides.filter(s => s.id !== id);
      localStorage.setItem('luxos_hero_slides', JSON.stringify(AdminState.heroSlides));
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

  if (id) {
    const item = AdminState.collections.find(c => c.id === id);
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

window.handleCollectionFileUpload = function (event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showAdminToast('Please select a valid image file (JPG, PNG, WebP).');
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const base64 = e.target.result;
    $('#collectionImageUrlInput').value = base64;
    previewCollectionImg(base64);
    showAdminToast('Collection image uploaded successfully!');
  };
  reader.readAsDataURL(file);
};

window.handleSaveCollectionItem = function (e) {
  e.preventDefault();

  const id = $('#editCollectionId').value;
  const title = $('#collectionTitleInput').value.trim();
  const image = $('#collectionImageUrlInput').value.trim();
  const filter = $('#collectionFilterSelect').value;
  const active = $('#collectionStatusSelect').value === 'true';

  if (!title || !image) {
    showAdminToast('Please provide both Title and Photo.');
    return;
  }

  const saveBtn = $('#saveCollectionBtn');
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

  localStorage.setItem('luxos_curated_collections', JSON.stringify(AdminState.collections));

  setTimeout(() => {
    closeCollectionModal();
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<span>Save Item</span>';
    }
    renderCollectionsManager();
    showAdminToast(id ? `Updated "${title}"!` : `Added new collection "${title}"!`);
  }, 400);
};

window.moveCollectionItem = function (index, direction) {
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= AdminState.collections.length) return;

  const temp = AdminState.collections[index];
  AdminState.collections[index] = AdminState.collections[newIndex];
  AdminState.collections[newIndex] = temp;

  localStorage.setItem('luxos_curated_collections', JSON.stringify(AdminState.collections));
  renderCollectionsManager();
  showAdminToast('Collection order updated.');
};

window.toggleCollectionStatus = function (id) {
  const item = AdminState.collections.find(c => c.id === id);
  if (!item) return;

  item.active = item.active === false ? true : false;
  localStorage.setItem('luxos_curated_collections', JSON.stringify(AdminState.collections));
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
    onConfirm: () => {
      AdminState.collections = AdminState.collections.filter(c => c.id !== id);
      localStorage.setItem('luxos_curated_collections', JSON.stringify(AdminState.collections));
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

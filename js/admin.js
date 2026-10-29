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
    localStorage.setItem('luxos_products_data', JSON.stringify(AdminState.products));
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
    banners: 'Hero Banners & Slideshow',
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
    <tr class="hover:bg-slate-50 transition">
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

window.openProductModal = function () {
  $('#productModalTitle').textContent = 'Add New Product';
  $('#editProductId').value = '';
  $('#prodTitle').value = '';
  $('#prodCategory').value = 'Tote Bags';
  $('#prodCollection').value = 'Just Landed';
  $('#prodPrice').value = '';
  $('#prodOriginalPrice').value = '';
  $('#prodBadge').value = 'Exclusive';
  $('#prodStock').value = '15';
  $('#prodRating').value = '4.8';
  $('#prodImage').value = '';
  $('#prodHoverImage').value = '';
  $('#prodDescription').value = '';

  $('#productFormModal').classList.add('active');
};

window.closeProductModal = function () {
  $('#productFormModal').classList.remove('active');
};

window.editProduct = function (productId) {
  const product = AdminState.products.find(p => p.id === productId);
  if (!product) return;

  $('#productModalTitle').textContent = 'Edit Product';
  $('#editProductId').value = product.id;
  $('#prodTitle').value = product.title;
  $('#prodCategory').value = product.category;
  $('#prodCollection').value = product.collection || 'Just Landed';
  $('#prodPrice').value = product.price;
  $('#prodOriginalPrice').value = product.originalPrice || '';
  $('#prodBadge').value = product.badge || '';
  $('#prodStock').value = product.stock || 10;
  $('#prodRating').value = product.rating || '4.8';
  $('#prodImage').value = product.image;
  $('#prodHoverImage').value = product.hoverImage || product.image;
  $('#prodDescription').value = product.description || '';

  $('#productFormModal').classList.add('active');
};

window.handleSaveProduct = function (e) {
  e.preventDefault();

  const id = $('#editProductId').value;
  const title = $('#prodTitle').value.trim();
  const category = $('#prodCategory').value;
  const collection = $('#prodCollection').value;
  let price = $('#prodPrice').value.trim();
  let originalPrice = $('#prodOriginalPrice').value.trim();
  const badge = $('#prodBadge').value.trim();
  const stock = parseInt($('#prodStock').value || 10, 10);
  const rating = $('#prodRating').value.trim() || '4.8';
  const image = $('#prodImage').value.trim();
  const hoverImage = $('#prodHoverImage').value.trim() || image;
  const description = $('#prodDescription').value.trim();

  if (!price.startsWith('৳')) price = '৳ ' + price.replace(/[^\d,]/g, '');
  if (originalPrice && !originalPrice.startsWith('৳')) originalPrice = '৳ ' + originalPrice.replace(/[^\d,]/g, '');

  if (id) {
    // Update existing
    const existingIndex = AdminState.products.findIndex(p => p.id == id);
    if (existingIndex > -1) {
      AdminState.products[existingIndex] = {
        ...AdminState.products[existingIndex],
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
        description
      };
      showAdminToast(`Updated "${title}"`);
    }
  } else {
    // Add new product
    const newId = Math.max(0, ...AdminState.products.map(p => p.id)) + 1;
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
      description,
      colors: [
        { name: 'Noir Black', hex: '#111111' },
        { name: 'Mocha Tan', hex: '#8B5A2B' }
      ]
    };
    AdminState.products.unshift(newProduct);
    showAdminToast(`Added new product "${title}"`);
  }

  // Persist to localStorage so storefront index.html sees it immediately!
  localStorage.setItem('luxos_products_data', JSON.stringify(AdminState.products));

  closeProductModal();
  renderProductsTable();
  renderDashboard();
};

window.deleteProduct = function (productId) {
  const product = AdminState.products.find(p => p.id === productId);
  if (!product) return;

  if (confirm(`Are you sure you want to delete "${product.title}"?`)) {
    AdminState.products = AdminState.products.filter(p => p.id !== productId);
    localStorage.setItem('luxos_products_data', JSON.stringify(AdminState.products));
    renderProductsTable();
    renderDashboard();
    showAdminToast(`Product deleted.`);
  }
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
  AdminState.coupons.splice(index, 1);
  localStorage.setItem('luxos_coupons', JSON.stringify(AdminState.coupons));
  renderCouponsTable();
  showAdminToast('Coupon removed.');
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
  $('#bannerSubheading').value = '';
  $('#bannerHeading').value = '';
  $('#bannerDescription').value = '';
  $('#bannerButtonText').value = 'Explore Collection';
  $('#bannerButtonLink').value = 'all';
  $('#bannerShowText').checked = true;
  $('#bannerActive').value = 'true';
  toggleBannerTextInputs(true);
  $('#bannerImgPreviewBox').classList.add('hidden');

  $('#bannerFormModal').classList.add('active');
};

window.closeBannerModal = function () {
  $('#bannerFormModal').classList.remove('active');
};

window.previewBannerImg = function (url) {
  const box = $('#bannerImgPreviewBox');
  const img = $('#bannerImgPreview');
  if (url && url.startsWith('http')) {
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
  $('#bannerSubheading').value = banner.subheading || '';
  $('#bannerHeading').value = banner.heading || '';
  $('#bannerDescription').value = banner.description || '';
  $('#bannerButtonText').value = banner.buttonText || '';
  $('#bannerButtonLink').value = banner.buttonLink || 'all';
  $('#bannerShowText').checked = banner.showText !== false;
  $('#bannerActive').value = banner.active !== false ? 'true' : 'false';

  previewBannerImg(banner.desktopImage);
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
  if (confirm('Are you sure you want to remove this banner from slideshow?')) {
    AdminState.heroSlides = AdminState.heroSlides.filter(s => s.id !== id);
    localStorage.setItem('luxos_hero_slides', JSON.stringify(AdminState.heroSlides));
    renderBannersTable();
    showAdminToast('Banner removed.');
  }
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
  if (confirm('Reset marquee ticker to default messages and colors?')) {
    AdminState.tickerSettings = getDefaultTickerSettings();
    renderTickerSettings();
    showAdminToast('Reset to defaults.');
  }
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

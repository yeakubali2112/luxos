/**
 * Luxos Cloud Synchronization Bridge
 * Powered by Supabase Cloud Database
 * Enables real-time cross-device sync for products, orders, banners, payment logos, and settings.
 */

(function (window) {
  'use strict';

  const SUPABASE_URL = 'https://eohuizhsqqdebtzateon.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_k2D8FEV-EQEzg6cCbXKh4g_JlQ96UGr';

  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY,
    'Content-Type': 'application/json'
  };

  function mapStorageToConfigKey(storageKey) {
    if (!storageKey) return null;
    if (storageKey.startsWith('luxos_pdp_extra_') || storageKey.startsWith('luxos_product_reviews_')) return storageKey;
    const map = {
      'luxos_products_data': 'products',
      'luxos_footer_settings': 'footer',
      'luxos_trust_badges': 'trust_badges',
      'luxos_trust_badges_v2': 'trust_badges',
      'luxos_topbar_settings': 'top_bar',
      'luxos_scrolling_ticker': 'scrolling_ticker',
      'luxos_ticker_settings': 'scrolling_ticker',
      'luxos_lookbook_data': 'lookbook',
      'luxos_brandstory_data': 'brand_story',
      'luxos_timeless_campaign': 'timeless_bold',
      'luxos_timeless_showcase': 'timeless_bold',
      'luxos_hero_slides': 'hero_banners',
      'luxos_banner_settings': 'banner_settings',
      'luxos_curated_collections': 'curated_collections',
      'luxos_collections_header': 'collections_header',
      'luxos_coupons': 'coupons',
      'luxos_settings': 'store_settings'
    };
    return map[storageKey] || null;
  }

  function mapConfigKeyToStorage(key) {
    if (!key) return null;
    if (key.startsWith('luxos_pdp_extra_') || key.startsWith('luxos_product_reviews_')) return key;
    const map = {
      'products': 'luxos_products_data',
      'footer': 'luxos_footer_settings',
      'trust_badges': 'luxos_trust_badges',
      'top_bar': 'luxos_topbar_settings',
      'scrolling_ticker': 'luxos_ticker_settings',
      'lookbook': 'luxos_lookbook_data',
      'brand_story': 'luxos_brandstory_data',
      'timeless_bold': 'luxos_timeless_showcase',
      'hero_banners': 'luxos_hero_slides',
      'banner_settings': 'luxos_banner_settings',
      'curated_collections': 'luxos_curated_collections',
      'collections_header': 'luxos_collections_header',
      'coupons': 'luxos_coupons',
      'store_settings': 'luxos_settings'
    };
    return map[key] || null;
  }

  const LuxosCloud = {
    isOnline: true,
    isInitialized: false,

    // 1. Fetch single store config from cloud
    async getConfig(key, fallback = null) {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/luxos_store_config?id=eq.${encodeURIComponent(key)}&select=*`, {
          method: 'GET',
          headers
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const rows = await res.json();
        if (rows && rows.length > 0 && rows[0].data !== undefined) {
          const storageKey = mapConfigKeyToStorage(key);
          if (storageKey) {
            try {
              origSetItem(storageKey, JSON.stringify(rows[0].data));
            } catch (e) {}
          }
          return rows[0].data;
        }
      } catch (err) {
        console.warn(`[LuxosCloud] Failed to fetch config '${key}' from cloud:`, err.message);
      }
      return fallback;
    },

    // 2. Fetch all configs from cloud in a single request (super fast initial load!)
    async getAllConfigs() {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/luxos_store_config?select=*`, {
          method: 'GET',
          headers
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const rows = await res.json();
        if (Array.isArray(rows)) {
          rows.forEach(row => {
            const storageKey = mapConfigKeyToStorage(row.id);
            if (storageKey && row.data !== undefined) {
              try {
                // Bypass interception when populating from cloud
                origSetItem(storageKey, JSON.stringify(row.data));
              } catch (e) {}
            }
          });
          return rows;
        }
      } catch (err) {
        console.warn('[LuxosCloud] Failed to fetch all configs from cloud:', err.message);
      }
      return [];
    },

    // 3. Save config to cloud (upsert)
    async saveConfig(key, data) {
      try {
        const payload = {
          id: key,
          data: data,
          updated_at: new Date().toISOString()
        };
        const res = await fetch(`${SUPABASE_URL}/rest/v1/luxos_store_config`, {
          method: 'POST',
          headers: {
            ...headers,
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return true;
      } catch (err) {
        console.error(`[LuxosCloud] Failed to save config '${key}' to cloud:`, err.message);
        return false;
      }
    },

    // 4. Fetch orders from cloud
    async getOrders() {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/luxos_orders?select=*&order=created_at.desc`, {
          method: 'GET',
          headers
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const rows = await res.json();
        if (Array.isArray(rows)) {
          const orders = rows.map(r => ({
            id: r.id,
            customer: r.customer || {},
            items: r.items || [],
            subtotal: Number(r.subtotal) || 0,
            shippingFee: Number(r.shipping_fee) || 0,
            discount: Number(r.discount) || 0,
            couponCode: r.coupon_code || '',
            total: Number(r.total) || 0,
            paymentMethod: r.payment_method || 'Cash on Delivery',
            paymentStatus: r.payment_status || 'Unpaid (COD)',
            orderStatus: r.order_status || 'Pending',
            createdAt: r.created_at
          }));
          try {
            origSetItem('luxos_orders', JSON.stringify(orders));
          } catch (e) {}
          return orders;
        }
      } catch (err) {
        console.warn('[LuxosCloud] Failed to fetch orders from cloud:', err.message);
      }

      try {
        const cached = localStorage.getItem('luxos_orders');
        return cached ? JSON.parse(cached) : [];
      } catch (e) {
        return [];
      }
    },

    // 5. Place/save new order to cloud
    async saveOrder(order) {
      try {
        const row = {
          id: order.id,
          customer: order.customer,
          items: order.items,
          subtotal: order.subtotal,
          shipping_fee: order.shippingFee,
          discount: order.discount,
          coupon_code: order.couponCode,
          total: order.total,
          payment_method: order.paymentMethod,
          payment_status: order.paymentStatus,
          order_status: order.orderStatus,
          created_at: order.createdAt || new Date().toISOString()
        };
        const res = await fetch(`${SUPABASE_URL}/rest/v1/luxos_orders`, {
          method: 'POST',
          headers: {
            ...headers,
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify(row)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return true;
      } catch (err) {
        console.error('[LuxosCloud] Failed to save order to cloud:', err.message);
        return false;
      }
    },

    // 6. Update order status in cloud
    async updateOrderStatus(orderId, newStatus) {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/luxos_orders?id=eq.${encodeURIComponent(orderId)}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ order_status: newStatus })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return true;
      } catch (err) {
        console.error('[LuxosCloud] Failed to update order status in cloud:', err.message);
        return false;
      }
    },

    // 7. Delete single order
    async deleteOrder(orderId) {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/luxos_orders?id=eq.${encodeURIComponent(orderId)}`, {
          method: 'DELETE',
          headers
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return true;
      } catch (err) {
        console.error('[LuxosCloud] Failed to delete order in cloud:', err.message);
        return false;
      }
    },

    // 8. Clear all orders (for admin reset)
    async clearAllOrders() {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/luxos_orders?id=neq.placeholder`, {
          method: 'DELETE',
          headers
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return true;
      } catch (err) {
        console.error('[LuxosCloud] Failed to clear all orders in cloud:', err.message);
        return false;
      }
    },

    // 9. Initial sync: If cloud is empty, seed it with current settings so all devices get the data!
    async seedCloudIfEmpty(localData) {
      try {
        const existing = await this.getAllConfigs();
        const existingIds = new Set(existing.map(r => r.id));

        const keysToSeed = [
          { id: 'products', val: localData.products },
          { id: 'footer', val: localData.footer },
          { id: 'trust_badges', val: localData.trustBadges },
          { id: 'top_bar', val: localData.topBar },
          { id: 'scrolling_ticker', val: localData.scrollingTicker },
          { id: 'lookbook', val: localData.lookbook },
          { id: 'brand_story', val: localData.brandStory },
          { id: 'timeless_bold', val: localData.timelessBold },
          { id: 'hero_banners', val: localData.heroBanners },
          { id: 'curated_collections', val: localData.curatedCollections },
          { id: 'coupons', val: localData.coupons },
          { id: 'store_settings', val: localData.storeSettings }
        ];

        for (const item of keysToSeed) {
          if (item.val && !existingIds.has(item.id)) {
            await this.saveConfig(item.id, item.val);
          }
        }
      } catch (e) {
        console.warn('[LuxosCloud] Seed check warning:', e);
      }
    }
  };

  // Intercept localStorage.setItem to auto-sync every save to Supabase Cloud in background
  const origSetItem = localStorage.setItem.bind(localStorage);
  const pendingDebounces = {};

  localStorage.setItem = function (key, value) {
    origSetItem(key, value);

    const configKey = mapStorageToConfigKey(key);
    if (configKey) {
      if (pendingDebounces[configKey]) clearTimeout(pendingDebounces[configKey]);
      pendingDebounces[configKey] = setTimeout(async () => {
        try {
          const parsed = JSON.parse(value);
          await LuxosCloud.saveConfig(configKey, parsed);
        } catch (e) {}
      }, 400);
    }
  };

  window.LuxosCloud = LuxosCloud;

})(window);

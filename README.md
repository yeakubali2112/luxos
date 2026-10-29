# Luxos - Luxury Handbags, Crossbody & Leather Goods + Admin Panel

Modern, high-end e-commerce storefront and operations admin dashboard crafted for **Luxos** (Dhaka, Bangladesh), inspired by and recreated from `thepatchee.com`.

---

## 🚀 Quick Access URLs

When running the local server (`node server.js`):
* 🛍️ **Customer Storefront:** [http://localhost:3000](http://localhost:3000) (or open [index.html](file:///g:/My%20Drive/Luxos/index.html))
* ⚙️ **Admin Operations Portal:** [http://localhost:3000/admin.html](http://localhost:3000/admin.html) (or open [admin.html](file:///g:/My%20Drive/Luxos/admin.html))

---

## 🌟 Storefront Highlights
1. **Brand Identity ("Luxos")**:
   - Modern luxury typography using Google Fonts `Jost` and `Playfair Display`.
   - Dhaka-focused e-commerce experience with Bangladeshi Taka (৳ BDT) currency formatting.
2. **Hero Slideshow Banner**:
   - High-resolution responsive banner slides (Clearance Sale, Travel/Cosmetics, and The Prime Drop).
3. **Infinite Marquee Ticker**:
   - Continuous banner highlighting promo codes, free shipping thresholds, and return guarantees.
4. **Dynamic Product Catalog (38 Real Products)**:
   - Real photos, hover flip image swap, discount badges ("Save 46%", "Save 59%"), star ratings.
   - Filter tabs: All, Just Landed, Best Sellers, The Prime Drop, Prime Shoes, Wallets & Cards.
5. **Interactive "Shop The Look" Hotspots**:
   - Interactive pulsing pins on lifestyle imagery revealing instant popovers.
6. **Full Cart Drawer**:
   - Free shipping progress bar, quantity adjustments, and automatic local storage persistence.
7. **Fast Checkout (Optimized for Bangladesh)**:
   - Delivery zone selection (Inside Dhaka ৳ 70 / Outside Dhaka ৳ 130).
   - Cash on Delivery & bKash payment options.
   - Coupon codes (`LUXOS10` for 10% off).
   - Generates unique Order ID (`LX-XXXXXX`) and immediately registers in the Admin Panel!

---

## ⚙️ Admin Panel Capabilities (`admin.html`)
1. **Operations Dashboard**:
   - Real-time KPI statistics: Total Revenue (৳), Total Orders, In-Stock Products, Pending Deliveries.
   - Weekly revenue visual bar trends.
   - Recent orders queue.
2. **Hero Banners & Slideshow Management**:
   - Add, edit, disable, or delete hero banner slides.
   - Configure Desktop & Mobile image URLs with instant preview.
   - Control Text Overlays: Toggle between "Text & Button Overlay" or "Clean Graphic Image Only".
   - Control Zoom In/Out animation (Enable/Disable) and custom slide transition speed (4s, 5s, 7s, 10s).
   - Instant synchronization with the customer storefront.
3. **Orders Management**:
   - View all customer orders placed from the storefront.
   - Search by Order ID, customer name, or phone number.
   - Filter by status (Pending, Processing, Shipped, Delivered, Cancelled).
   - Detailed Order View Modal with customer address and products.
   - Order Status dropdown with instant update.
   - **Print Delivery Invoice**: Generates official formatted delivery slips/invoices ready to print.
3. **Products Catalog Management (Full CRUD)**:
   - Add new products with title, category, collection, prices, badges, images, stock, and descriptions.
   - Edit existing products with live synchronization to `index.html`.
   - Delete products.
4. **Coupons & Offers**:
   - Create custom promo codes with percentage discounts or free delivery.
   - Toggle active/disabled status.
5. **Customer Directory**:
   - View unique customer profiles compiled from orders, total spent, and contact details.
6. **Store Settings**:
   - Customize Inside Dhaka / Outside Dhaka delivery fees, free shipping threshold, and support contacts.

---

## 📁 File Structure
- `index.html`: Customer e-commerce storefront.
- `admin.html`: Operations admin dashboard.
- `css/styles.css`: Luxury storefront styling, marquee, animations, and modal overlays.
- `js/products.js`: 38 authentic product models with images, prices, colors, and descriptions.
- `js/app.js`: Storefront state, cart, wishlist, live search, and checkout persistence.
- `js/admin.js`: Admin dashboard controller, orders queue, product CRUD, and synchronization.
- `server.js`: Lightweight local development server.

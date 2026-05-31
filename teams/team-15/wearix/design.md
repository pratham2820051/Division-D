Create a modern, minimalist clothing e-commerce web application with full functionality for a demo/judge presentation. Use Framer or React-based framework with the Wearix design system.

### CORE PAGES TO BUILD (Priority Order)

#### 1. AUTHENTICATION PAGES (Build Basic)
**Login Page** (/login)
- Centered card layout, max-width 400px
- Form fields: Email, Password
- "Login" button (black, white text, full-width)
- "Don't have an account? Register" link
- JWT authentication (basic implementation)
- Store token in localStorage

**Register Page** (/register)
- Same layout as login
- Form fields: Name, Email, Password, Confirm Password
- "Register" button
- "Already have an account? Login" link
- Role selection: "Buyer" (default) or "Seller" (checkbox)

### 2. BUYER PAGES

#### Homepage (/)
- Navigation bar (sticky header): Logo (left), Nav links (Shop, About, Blog, Contact), Cart icon with badge showing item count, User avatar/dropdown (right)
- Hero Section: Full-viewport height, fashion model image, overlay text "Fresh fits in our latest drop", "Wearix Since 2014", CTA button "Shop Now"
- Brand Story Section: Two-column layout, text "Defining modern style", brand history paragraph
- Featured Products Section: H2 "Our signature best selling pieces", 3-column product grid (see Product Card specs below)
- Collections Section: H2 "Modern collections defined by simplicity", 3 collection cards (Men's Wear $45-$180, Women's Wear $40-$160, Children's Wear $30-$120)
- Reviews Section: H2 "The voice of quality", 4.9/5 rating, 1k+ reviews badge, 3 customer testimonial cards
- Features Section: H2 "Where style meets ease", 6 feature cards with icons
- Footer: Logo, navigation links, social icons, "© 2026 Wearix"

#### Product Listing Page (/shop)
- H1 "Shop All Products"
- Sidebar filters (left, 250px width):
  - Category checkboxes (Men, Women, Children)
  - Price range slider ($0-$200)
  - Size checkboxes (S, M, L, XL, XXL)
  - Color checkboxes
- Product Grid (main area, 2-3 columns desktop, 1 column mobile):
  - 12-16 mock products from static data
  - Each product card (see Product Card specs)
- Pagination: 8 products per page, numbered page buttons

#### Product Detail Page (/product/[id])
- Two-column layout (desktop):
  - Left: Large product image (500x600px)
  - Right: Product info
    - Product name (H1, 32px)
    - Price: "$XX.XX" (24px, bold)
    - Size selector: Radio buttons or dropdown (S, M, L, XL)
    - Color selector: Color swatches (3-4 options)
    - Quantity selector: [-] 1 [+] buttons
    - "Add to Cart" button (black, full-width, 48px height)
    - "Buy Now" button (secondary style, outlines)
    - Product description (16px, line-height 1.6)
    - Shipping info, return policy text
- Related Products section below: 4-product grid

#### Shopping Cart Page (/cart)
- H1 "Your Shopping Cart"
- Left Column (70% width):
  - Cart items list:
    - Each item: Product image (80x80px), name, size, color, quantity selector, price, delete trash icon
  - Subtotal, shipping estimate, total calculation
  - "Continue Shopping" link
  - "Proceed to Checkout" button (black, full-width)
- Right Column (30% width, desktop only):
  - Order summary card
  - Promo code input field
  - "Apply" button
  - Final total display

#### Checkout Page (/checkout)
- H1 "Checkout"
- Two-column layout:
  - Left (60%):
    - Shipping Address Form: Name, Street, City, State, ZIP, Phone
    - Payment Section: "Pay Now" button (mock - no real gateway)
      - Display: "Secure payment powered by [mock logo]"
      - On click: Show success modal, create order, redirect to order confirmation
  - Right (40%):
    - Order summary with product thumbnails
    - Itemized pricing, total

#### Order History Page (/orders)
- H1 "My Orders"
- Tab navigation: "All Orders" | "Processing" | "Delivered" | "Cancelled"
- Order List:
  - Show 5 mock past orders per user (static data)
  - Each order card:
    - Order ID (#ORD-XXXXX), Date, Status badge (color-coded: green=Delivered, yellow=Processing, red=Cancelled)
    - Product thumbnails (2-3 items)
    - Total price
    - "View Details" button
- Order Detail Modal/Page:
  - Full order information
  - Shipping address
  - Tracking number (mock)
  - Product list with quantities
  - "Track Order" button

### 3. SELLER PAGES

#### Seller Dashboard (/seller/dashboard)
- Navigation: Seller-specific nav (Dashboard, Products, Orders, Analytics, Settings)
- Quick Stats Cards (4 cards, 4-column grid):
  - Total Products, Total Sales, Pending Orders, Revenue (with mock numbers)
- Recent Orders Table:
  - Columns: Order ID, Customer, Product, Amount, Status, Date
  - 5-10 recent mock orders
- Low Stock Alerts:
  - List of products with <5 items in stock
- Quick Actions:
  - "Add New Product" button
  - "View All Orders" button

#### Seller Product Upload Page (/seller/products/upload)
- H1 "Add New Product"
- Form Fields:
  - Product Name (text input, required)
  - Description (textarea, required)
  - Category (dropdown: Men, Women, Children)
  - Price (number input, required)
  - Compare-at Price (number input, optional)
  - Size Options (checkboxes: S, M, L, XL, XXL)
  - Color Options (color picker + text input)
  - Stock Quantity (number input, required)
  - Product Images (file upload, multiple, max 5 images)
    - Show preview thumbnails
  - Tags (text input with comma separation)
  - Is Featured (checkbox)
- "Save Product" button (black, full-width)
- "Cancel" button (secondary)
- On submit: Add to seller's product list, show success toast, redirect to seller products page

#### Seller Products Management (/seller/products)
- H1 "My Products"
- Search bar + filter dropdowns
- Product Table:
  - Columns: Thumbnail, Name, Category, Price, Stock, Status, Actions
  - Actions: Edit (pencil icon), Delete (trash icon), View
- Pagination: 10 products per page
- "Add New Product" button (top-right)

#### Seller Orders Page (/seller/orders)
- H1 "Customer Orders"
- Filter by status dropdown
- Order Table:
  - Order ID, Customer Name, Product, Quantity, Amount, Status, Date
  - Actions: "View Details", "Update Status"
- Order Detail Modal:
  - Full order info, shipping address
  - Status update dropdown (Processing, Shipped, Delivered, Cancelled)
  - "Update Status" button

### 4. SUPPORT PAGES (FULLY BUILT - CORE FEATURE)

#### Support Chat Widget (Persistent on all pages)
- Fixed position: Bottom-right corner, 60px from bottom, 60px from right
- Chat Toggle Button:
  - Circular button, 60px diameter, black background, white chat icon
  - Badge showing unread count (if any)
  - On click: Opens chat window
- Chat Window (when open):
  - Width: 360px, Height: 500px
  - Header: "Wearix Support" + close button
  - Message Area:
    - Message bubbles (user: right, bot: left)
    - Timestamp below each message
    - Auto-scroll to bottom
  - Input Area:
    - Text input (full-width, 48px height)
    - Send button (paper plane icon)
    - Attach file button (optional)
  - Quick Reply Buttons: "Track Order", "Return Policy", "Product Info", "Contact Human"
- Chat Functionality:
  - Mock chatbot responses (pre-defined answers)
  - 5-minute simulated response delay for "human agent"
  - Chat history saved per session
  - "Start New Chat" option

#### Support Dashboard (/support) - FULLY BUILT (DEMO PAGE)
- Agent view (for admin/support team)
- Navigation: Support-specific nav (Dashboard, Active Chats, History, Analytics, Settings)
- Dashboard Stats (4 cards):
  - Active Chats, Pending Tickets, Resolved Today, Avg Response Time
- Active Chats Panel (left, 40% width):
  - List of current chat sessions
  - Customer name, last message preview, time, unread count
  - Click to open chat
- Chat Interface (right, 60% width):
  - Full chat window with customer
  - Message history
  - Input area with typing indicator
  - Actions: "Mark as Resolved", "Transfer to Agent", "Close Chat"
- Ticket Queue (below active chats):
  - List of support tickets
  - Ticket ID, Customer, Subject, Priority, Status, Age
  - Priority badges: High (red), Medium (yellow), Low (green)
- Quick Response Templates:
  - Pre-defined response snippets
  - One-click insert into chat

#### Support Ticket History (/support/tickets)
- H1 "Support Ticket History"
- Filter by status, priority, date range
- Ticket Table:
  - Ticket ID, Customer, Subject, Agent, Priority, Status, Created, Resolved
  - Actions: "View Details"
- Ticket Detail Modal:
  - Full conversation history
  - Customer info
  - Resolution notes
  - Rating (if provided)

### 5. ADDITIONAL PAGES

#### About Page (/about)
- H1 "About Wearix"
- Brand story section (2-column)
- Team section: 3-4 team member cards
- Values section: 4 value cards (Quality, Sustainability, Comfort, Style)

#### Blog Page (/blog)
- H1 "Latest Stories"
- Blog post grid (2 columns desktop, 1 mobile)
- Each post card: Image, category tag, title, excerpt, date, "Read More" link
- 6-8 mock blog posts

#### Blog Post Page (/blog/[slug])
- Full blog post with image, title, date, author, content
- Related posts section at bottom

#### Contact Page (/contact)
- H1 "Get in Touch"
- Two-column layout:
  - Left: Contact form (Name, Email, Subject, Message, Submit button)
  - Right: Contact info (Email, Phone, Address, Social links)

#### 404 Page (/404)
- Centered layout
- Large "404" text
- "Page not found" message
- "Go Home" button

---

### DESIGN SYSTEM (Wearix Style)

#### COLOR PALETTE (HEX)
- Background: #FFFFFF (primary), #F9F9F9 (secondary)
- Text: #1A1A1A (primary), #666666 (secondary), #999999 (tertiary)
- Accent/Buttons: #000000 (black with white text)
- Border: #E5E5E5
- Hover: #F0F0F0
- Status Colors:
  - Success/Delivered: #22C55E (green)
  - Warning/Processing: #F59E0B (yellow)
  - Error/Cancelled: #EF4444 (red)
  - Info: #3B82F6 (blue)

#### TYPOGRAPHY (Inter Font)
- Hero Headline: 56px (desktop), 36px (mobile), weight 600, line-height 1.1
- H1 Page Title: 40px, weight 600, line-height 1.2
- H2 Section: 32px, weight 600, line-height 1.2
- H3 Subsection: 24px, weight 500, line-height 1.3
- Body Text: 16px, weight 400, line-height 1.6-1.7
- Small Text: 14px, weight 400
- Button Text: 16px, weight 500
- Navigation: 15px, weight 500

#### SPACING & LAYOUT
- Section padding: 80px vertical (desktop), 48px (mobile)
- Container max-width: 1200px, centered with 24px margins
- Grid gap: 32px (desktop), 16px (mobile)
- Element spacing multiples of 8: 8, 16, 24, 32, 48, 64
- Border radius: 8px (cards/buttons), 4px (small elements)
- Box shadow: 0 2px 8px rgba(0,0,0,0.08) on hover

#### PRODUCT CARD SPECIFICATIONS
- Width: 280px (desktop grid item)
- Structure:
  - Product image (280x350px, aspect ratio 4:5)
  - Category tag (small, top-left overlay)
  - Product name (16px, weight 500, 2 lines max, truncate)
  - Price: "$XX.XX" (18px, weight 600)
  - "Add to Cart" button (appears on hover, black, full-width, 40px height)
- Hover effects:
  - Image zoom: 1.05x
  - Shadow increase: 0 4px 16px rgba(0,0,0,0.12)
  - Card lift: translateY(-4px)

#### ANIMATIONS
- Scroll animations: Fade-in-up for all sections
  - Duration: 0.6s, easing: ease-out
  - Stagger delay: 0.1s between elements
- Page transitions: Fade 0.3s
- Hover effects:
  - Buttons: Background darkens 10%, lift 2px
  - Product cards: Scale 1.02x, shadow increase
  - Navigation links: Underline slide from left (0.3s)
- Loading states: Skeleton loaders for product grids
- Success/error toasts: Slide-in from top-right, 3s duration

#### RESPONSIVE BREAKPOINTS
- Desktop: 1200px+ (3-column grids, full navigation, multi-column layouts)
- Tablet: 768px-1199px (2-column grids, condensed nav)
- Mobile: <768px (1-column, hamburger menu, stacked layouts)

---

### TECHNICAL IMPLEMENTATION

#### STATE MANAGEMENT
- Cart state: Use context/Redux, persist to localStorage
- User state: JWT token in localStorage, user info in state
- Chat state: WebSocket or mock polling, session-based history
- Product state: Static mock data array (see below)

#### MOCK DATA STRUCTURES

**Products (12-16 items):**
```javascript
{
  id: 1,
  name: "Classic Cotton Tee",
  category: "Men",
  price: 45.00,
  comparePrice: 65.00,
  sizes: ["S", "M", "L", "XL"],
  colors: ["#000000", "#FFFFFF", "#808080"],
  stock: 120,
  images: ["url1", "url2"],
  description: "Premium cotton t-shirt...",
  isFeatured: true
}
```

**Orders (5 per user):**
```javascript
{
  id: "ORD-12345",
  userId: 1,
  date: "2026-05-15",
  status: "Delivered",
  items: [
    { productId: 1, name: "Classic Cotton Tee", quantity: 2, price: 45.00 }
  ],
  total: 90.00,
  shippingAddress: {...},
  trackingNumber: "TRK123456789"
}
```

**Chat Messages:**
```javascript
{
  id: 1,
  chatId: "chat_001",
  sender: "user" | "agent" | "bot",
  message: "Hello, I need help...",
  timestamp: "2026-05-30T21:00:00"
}
```

#### AUTHENTICATION (Basic JWT)
- Login endpoint: POST /api/auth/login → returns { token, user }
- Register endpoint: POST /api/auth/register → returns { token, user }
- Protected routes: Check token in localStorage
- Role-based access: Buyer vs Seller dashboards

#### CART FUNCTIONALITY
- Add to cart: Check if item exists (by productId + size + color), update quantity or add new
- Update quantity: Increment/decrement, remove if 0
- Remove item: Filter out from cart array
- Calculate totals: Subtotal, shipping, tax, total
- Persist: Save to localStorage on every change

#### PAYMENT (Mock)
- "Pay Now" button on checkout
- On click:
  1. Show loading spinner (2s)
  2. Show success modal: "Payment Successful! Order #ORD-XXXXX"
  3. Create order in mock database
  4. Clear cart
  5. Redirect to order confirmation page

#### SUPPORT CHAT (Fully Functional Mock)
- Bot responses (pre-defined):
  - "Track Order" → "Please provide your order ID. You can find it in your Order History."
  - "Return Policy" → "We offer 30-day returns for unworn items..."
  - "Product Info" → "Which product would you like to know about?"
- Human agent simulation:
  - After 5 minutes, respond with more detailed answers
  - Show "Agent is typing..." indicator
- Chat persistence: Save to localStorage per session

---

### DELIVERABLE CHECKLIST

**Must Build Fully (Demo Quality):**
✅ Support Chat Widget (persistent, functional)
✅ Support Dashboard (agent view with active chats, ticket queue)
✅ Product Listing Page (with filters, grid)
✅ Shopping Cart Page (add/remove items, quantity update)
✅ Order History Page (5 mock orders per user)
✅ Seller Product Upload Page (form with image upload preview)
✅ Seller Dashboard (stats, recent orders)

**Build Basic (Functional but Simple):**
✅ Auth (Login/Register with JWT)
✅ Product Detail Page
✅ Checkout Page (mock "Pay Now" button)
✅ Seller Orders Page
✅ Homepage
✅ Contact Page

**Skip/Optional:**
❌ Real payment gateway (mock only)
❌ Email notifications
❌ Real-time WebSocket (use mock polling)
❌ Advanced analytics

---

### FILE STRUCTURE
src
/components
/common (Navbar, Footer, Button, Input, Card)
/product (ProductCard, ProductGrid, ProductFilters)
/cart (CartItem, CartSummary)
/support (ChatWidget, ChatWindow, SupportDashboard)
/seller (SellerNav, ProductForm, OrderTable)
/pages
/auth (Login, Register)
/buyer (Home, Shop, ProductDetail, Cart, Checkout, Orders)
/seller (Dashboard, Products, ProductsUpload, Orders)
/support (Dashboard, Tickets)
/blog (Blog, BlogPost)
About, Contact, NotFound
/context (AuthContext, CartContext, ChatContext)
/data (mockProducts.js, mockOrders.js, mockChats.js)
/utils (auth.js, cart.js, format.js)
/styles (global.css, variables.css)
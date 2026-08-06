/**
 * Flasho frontend
 * Talks to the backend at the same origin ("/api/...").
 * Start the backend first: cd server && npm install && npm start
 * then open http://localhost:4000
 */

/* ---------------------------------------------------------
   MENU DATA
--------------------------------------------------------- */
const MENUS = {
  bhojan: [
    { name: "Samosa", price: 20, veg: true, emoji: "🥟" },
    { name: "Samosa Chat", price: 30, veg: true, emoji: "🥗" },
    { name: "Channa Masala", price: 45, veg: true, emoji: "🍛" },
    { name: "Chicken Puff", price: 30, veg: false, emoji: "🥐" },
    { name: "Egg Puff", price: 25, veg: true, emoji: "🥐" },
    { name: "Veg Puff", price: 20, veg: true, emoji: "🥐" },
    { name: "Cauliflower Pakoda", price: 40, veg: true, emoji: "🧆" },
    { name: "Pani Puri", price: 25, veg: true, emoji: "🥣" },
    { name: "Bhel Puri", price: 35, veg: true, emoji: "🥗" },
    { name: "Maggie", price: 40, veg: true, emoji: "🍜" },
    { name: "Coffee", price: 20, veg: true, emoji: "☕" },
    { name: "Tea", price: 15, veg: true, emoji: "☕" },
    { name: "Goa Candy", sub: "per piece", price: 1, veg: true, emoji: "🍬" },
    { name: "Donut", price: 30, veg: true, emoji: "🍩" }
  ],
  amrit: [
    { name: "Parota", sub: "with salna", price: 60, veg: true, emoji: "🫓" },
    { name: "Chapati", price: 30, veg: true, emoji: "🫓" },
    { name: "Veg Fried Rice", price: 60, veg: true, emoji: "🍚" },
    { name: "Egg Fried Rice", price: 80, veg: false, emoji: "🍳" },
    { name: "Chicken Biryani", price: 120, veg: false, emoji: "🍗" },
    { name: "Chicken Fried Rice", price: 120, veg: false, emoji: "🍗" },
    { name: "Choola Puri", price: 50, veg: true, emoji: "🫓" },
    { name: "Bread Omelet", price: 40, veg: true, emoji: "🍳" },
    { name: "Mushroom Soup", sub: "roadsides style", price: 25, veg: true, emoji: "🍲" },
    { name: "Rose Milk", price: 40, veg: true, emoji: "🥤" },
    { name: "Badam Milk", price: 40, veg: true, emoji: "🥛" },
    { name: "Pista Milk", price: 40, veg: true, emoji: "🥛" },
    { name: "7Up", sub: "glass bottle", price: 20, veg: true, emoji: "🥤" },
    { name: "Masti Masala", sub: "glass bottle", price: 20, veg: true, emoji: "🧃" }
  ],
  coffeekudi: [
    { name: "Tea", price: 10, veg: true, emoji: "☕" },
    { name: "Coffee", sub: "Filter coffee", price: 15, veg: true, emoji: "☕" },
    { name: "Butter Biscuits", sub: "4 pieces", price: 10, veg: true, emoji: "🍪" },
    { name: "Cream Bun", price: 20, veg: true, emoji: "🥐" },
    { name: "Jam Bun", price: 20, veg: true, emoji: "🍞" },
    { name: "Tea Bun Cake", sub: "per slice", price: 5, veg: true, emoji: "🍰" },
    { name: "Samosa", price: 15, veg: true, emoji: "🥟" },
    { name: "Vada", price: 10, veg: true, emoji: "🍩" },
    { name: "Rose Milk", price: 35, veg: true, emoji: "🥤" },
    { name: "Badam Milk", price: 35, veg: true, emoji: "🥛" }
  ],
  saisri: [
    { name: "Sambar Rice", price: 45, veg: true, emoji: "🍛" },
    { name: "Curd Rice", price: 40, veg: true, emoji: "🍚" },
    { name: "Veg Biryani", price: 60, veg: true, emoji: "🍚" },
    { name: "Parota", sub: "2 pieces with salna", price: 40, veg: true, emoji: "🫓" },
    { name: "Kothu Parota", sub: "with egg", price: 70, veg: false, emoji: "🌯" },
    { name: "Fried Rice", price: 60, veg: true, emoji: "🍚" },
    { name: "Samosa", price: 15, veg: true, emoji: "🥟" },
    { name: "Bonda", price: 15, veg: true, emoji: "🟠" },
    { name: "Vada", price: 15, veg: true, emoji: "🍩" },
    { name: "Bhajji", price: 15, veg: true, emoji: "🧆" }
  ]
};

const CANTEEN_LABELS = {
  bhojan: "Bhojan",
  amrit: "AMRIT Cafe",
  coffeekudi: "CoffeeKudi",
  saisri: "Sai Sri"
};

/* ---------------------------------------------------------
   STATE
--------------------------------------------------------- */
const cart = {};          // key -> { canteenKey, name, price, qty }
let timerSeconds = 2 * 60 * 60; // 2 hours
let timerStarted = false;
let timerInterval = null;
let currentOrderId = null;
let authMode = 'student';
let currentUserRole = null;
let currentUserCanteenKey = null;
let currentUserCanteenLabel = null;
let adminOrders = [];
let adminSearch = '';
let adminStatusFilterValue = 'all';
const API_BASE = window.location.protocol === 'file:' ? 'http://127.0.0.1:4000' : '';

function updateAuthFields(view) {
  const isStudent = authMode === 'student';
  const isStaff = authMode === 'staff';
  const isAdmin = authMode === 'admin';
  document.body.classList.toggle('auth-staff', isStaff || isAdmin);
  document.body.classList.toggle('auth-student', isStudent);

  document.querySelectorAll(`.auth-switch__btn[data-view="${view}"]`).forEach(btn => {
    const isActive = btn.dataset.authMode === authMode;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', String(isActive));
  });

  const loginIdentifierLabel = document.getElementById('loginIdentifierLabel');
  const loginPasswordLabel = document.getElementById('loginPasswordLabel');
  const signupIdentifierLabel = document.getElementById('signupIdentifierLabel');
  const signupPasswordLabel = document.getElementById('signupPasswordLabel');
  const signupNameField = document.getElementById('signupNameField');
  const signupNameInput = document.getElementById('signupName');

  if (loginIdentifierLabel) loginIdentifierLabel.textContent = isStudent ? 'Register no.' : 'Email';
  if (loginPasswordLabel) loginPasswordLabel.textContent = 'Password';
  if (signupIdentifierLabel) signupIdentifierLabel.textContent = isStudent ? 'Register no.' : 'Email';
  if (signupPasswordLabel) signupPasswordLabel.textContent = 'Password';

  const loginIdentifier = document.getElementById('loginIdentifier');
  const signupIdentifier = document.getElementById('signupIdentifier');
  const forgotIdentifierLabel = document.getElementById('forgotIdentifierLabel');
  const forgotIdentifier = document.getElementById('forgotIdentifier');
  const forgotNameField = document.getElementById('forgotNameField');
  const forgotPhoneField = document.getElementById('forgotPhoneField');
  const forgotNameInput = document.getElementById('forgotName');

  if (loginIdentifier) {
    loginIdentifier.placeholder = isStudent ? 'e.g. 21CS045' : 'e.g. staff@flasho.com';
    loginIdentifier.setAttribute('autocomplete', isStudent ? 'username' : 'email');
  }
  if (signupIdentifier) {
    signupIdentifier.placeholder = isStudent ? 'e.g. 21CS045' : 'e.g. staff@flasho.com';
    signupIdentifier.setAttribute('autocomplete', isStudent ? 'username' : 'email');
  }
  if (forgotIdentifierLabel) forgotIdentifierLabel.textContent = isStudent ? 'Register no.' : 'Email';
  if (forgotIdentifier) {
    forgotIdentifier.placeholder = isStudent ? 'e.g. 21CS045' : 'e.g. staff@flasho.com';
    forgotIdentifier.setAttribute('autocomplete', isStudent ? 'username' : 'email');
  }

  if (signupNameField) signupNameField.style.display = 'block';
  if (signupNameInput) signupNameInput.required = true;
  if (forgotNameField) forgotNameField.style.display = 'block';
  if (forgotPhoneField) forgotPhoneField.style.display = 'block';
  if (forgotNameInput) forgotNameInput.required = true;

  const loginError = document.getElementById('loginError');
  const signupError = document.getElementById('signupError');
  if (loginError) {
    loginError.textContent = isStudent
      ? 'Enter your register no. and password to continue.'
      : 'Enter your email and password to continue.';
  }
  if (signupError) {
    signupError.textContent = isStudent
      ? 'Create your student account to continue.'
      : 'Create your staff account to continue.';
  }
}

/* ---------------------------------------------------------
   PAGE NAVIGATION
--------------------------------------------------------- */
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  cartBar.classList.toggle('hidden', id === 'page-timeslot' || id === 'page-owner' || id === 'page-admin' || id === 'page-admin-login' || id === 'page-my-orders');
  window.scrollTo(0, 0);
}

let myOrders = [];
let myOrdersPage = 1;
const MY_ORDERS_PAGE_SIZE = 6;
let myOrdersSearch = '';
let myOrdersStatusFilter = 'all';
let myOrdersDateFrom = '';
let myOrdersDateTo = '';

function formatStatusLabel(status) {
  return {
    awaiting_payment: 'Awaiting Payment',
    accepted: 'Accepted',
    preparing: 'Preparing',
    ready: 'Ready for Pickup',
    completed: 'Completed',
    cancelled: 'Cancelled'
  }[status] || status.replace(/_/g, ' ');
}

function renderStatusBadge(status) {
  return `<span class="order-badge badge-${status}">${formatStatusLabel(status)}</span>`;
}

function formatPaymentStatus(status) {
  return status === 'paid' ? 'Paid' : status === 'pending' ? 'Pending' : status;
}

function formatDateTime(value) {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function getMyOrderPageItems() {
  const filtered = myOrders.filter(order => {
    const search = myOrdersSearch.trim().toLowerCase();
    if (search && !order.id.toLowerCase().includes(search)) return false;
    if (myOrdersStatusFilter !== 'all' && order.status !== myOrdersStatusFilter) return false;
    if (myOrdersDateFrom) {
      const fromDate = new Date(`${myOrdersDateFrom}T00:00:00`);
      if (new Date(order.createdAt) < fromDate) return false;
    }
    if (myOrdersDateTo) {
      const toDate = new Date(`${myOrdersDateTo}T23:59:59`);
      if (new Date(order.createdAt) > toDate) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / MY_ORDERS_PAGE_SIZE));
  if (myOrdersPage > totalPages) myOrdersPage = totalPages;
  const start = (myOrdersPage - 1) * MY_ORDERS_PAGE_SIZE;
  return { pageOrders: filtered.slice(start, start + MY_ORDERS_PAGE_SIZE), total: filtered.length, totalPages };
}

function updateMyOrdersPageInfo(total, totalPages) {
  const pageInfo = document.getElementById('myOrdersPageInfo');
  if (pageInfo) {
    pageInfo.textContent = `Page ${myOrdersPage} of ${totalPages} · ${total} orders`;
  }
}

function renderMyOrderCard(order) {
  const card = document.createElement('article');
  card.className = 'order-card';
  card.innerHTML = `
    <div class="order-card-header">
      <div>
        <p class="order-number">Order #${order.id}</p>
        <p class="order-meta">${order.canteen} • ${formatDateTime(order.createdAt)}</p>
      </div>
      <div class="order-badge-group">
        ${renderStatusBadge(order.status)}
        <span class="payment-badge ${order.paymentStatus === 'paid' ? 'paid' : 'pending'}">${formatPaymentStatus(order.paymentStatus)}</span>
      </div>
    </div>
    <div class="order-card-body">
      <p>${order.items.map(item => `${item.name} × ${item.qty}`).join(', ')}</p>
      <div class="order-card-summary">
        <span>${order.items.reduce((sum, item) => sum + item.qty, 0)} items</span>
        <strong>₹${order.total}</strong>
      </div>
      <div class="order-card-meta">
        <span>${order.estimatedPreparationTimeMinutes ? `${order.estimatedPreparationTimeMinutes} min prep` : 'Prep time unavailable'}</span>
      </div>
    </div>
  `;
  card.addEventListener('click', () => openOrderDetails(order));
  return card;
}

function renderMyOrders() {
  const list = document.getElementById('myOrderList');
  if (!list) return;
  const { pageOrders, total, totalPages } = getMyOrderPageItems();
  list.innerHTML = '';

  if (total === 0) {
    list.innerHTML = `<div class="orders-empty-state">
      <div class="orders-illustration" aria-hidden="true">
        <div class="illustration-circle"></div>
        <div class="illustration-line"></div>
        <div class="illustration-dot"></div>
      </div>
      <p>No orders yet</p>
      <span>Start ordering from any canteen and track your orders from here.</span>
    </div>`;
    updateMyOrdersPageInfo(0, 1);
    return;
  }

  pageOrders.forEach(order => list.appendChild(renderMyOrderCard(order)));
  updateMyOrdersPageInfo(total, totalPages);
  document.getElementById('myOrdersCount').textContent = `${total} order${total === 1 ? '' : 's'} found`;

  const prev = document.getElementById('myOrdersPrevBtn');
  const next = document.getElementById('myOrdersNextBtn');
  if (prev) prev.disabled = myOrdersPage <= 1;
  if (next) next.disabled = myOrdersPage >= totalPages;
}

function openOrderDetails(order) {
  const modal = document.getElementById('orderDetailsModal');
  if (!modal) return;
  document.getElementById('detailOrderId').textContent = `Order #${order.id}`;
  document.getElementById('detailOrderDate').textContent = `Placed on ${formatDateTime(order.createdAt)}`;
  document.getElementById('detailCustomerName').textContent = order.orderedBy?.name || order.orderedBy?.identifier || 'Unknown';
  document.getElementById('detailCanteen').textContent = order.canteen;
  document.getElementById('detailStatus').textContent = formatStatusLabel(order.status);
  document.getElementById('detailPaymentStatus').textContent = formatPaymentStatus(order.paymentStatus);
  document.getElementById('detailEstimate').textContent = order.estimatedPreparationTimeMinutes ? `${order.estimatedPreparationTimeMinutes} min` : 'Unavailable';
  document.getElementById('detailItemList').innerHTML = order.items.map(item => `
    <div class="order-item-detail">
      <span>${item.name} × ${item.qty}</span>
      <span>₹${item.price * item.qty}</span>
    </div>
  `).join('');
  document.getElementById('detailGrandTotal').textContent = `₹${order.total}`;
  modal.classList.remove('hidden');
  document.body.classList.add('modal-open');
}

function closeOrderDetails() {
  const modal = document.getElementById('orderDetailsModal');
  if (!modal) return;
  modal.classList.add('hidden');
  document.body.classList.remove('modal-open');
}

async function loadMyOrders() {
  try {
    const res = await fetch(`${API_BASE}/api/orders`, { credentials: 'include' });
    if (!res.ok) {
      if (res.status === 401) {
        showPage('page-login');
        return;
      }
      throw new Error('Could not load orders.');
    }
    myOrders = await res.json();
    myOrdersPage = 1;
    renderMyOrders();
  } catch (err) {
    const list = document.getElementById('myOrderList');
    if (list) list.innerHTML = `<div class="orders-empty-state"><p>${err.message}</p></div>`;
  }
}

function filterAdminOrders() {
  return adminOrders.filter(order => {
    if (adminStatusFilterValue !== 'all' && order.status !== adminStatusFilterValue) {
      return false;
    }
    const search = adminSearch.trim().toLowerCase();
    if (!search) return true;
    const text = [order.id, order.canteen, order.status, order.orderedBy?.name, order.orderedBy?.identifier, order.orderedBy?.email].filter(Boolean).join(' ').toLowerCase();
    return text.includes(search);
  });
}

function updateAdminStats() {
  const totalOrders = adminOrders.length;
  const pendingOrders = adminOrders.filter(o => o.status === 'awaiting_payment').length;
  const preparingOrders = adminOrders.filter(o => o.status === 'preparing').length;
  const readyOrders = adminOrders.filter(o => o.status === 'ready').length;
  const completedOrders = adminOrders.filter(o => o.status === 'completed').length;
  const cancelledOrders = adminOrders.filter(o => o.status === 'cancelled').length;
  const totalRevenue = adminOrders.filter(o => o.status === 'completed').reduce((sum, order) => sum + Number(order.total || 0), 0);

  document.getElementById('adminTotalOrders').textContent = totalOrders;
  document.getElementById('adminPendingOrders').textContent = pendingOrders;
  document.getElementById('adminPreparingOrders').textContent = preparingOrders;
  document.getElementById('adminReadyOrders').textContent = readyOrders;
  document.getElementById('adminCompletedOrders').textContent = completedOrders;
  document.getElementById('adminCancelledOrders').textContent = cancelledOrders;
  document.getElementById('adminTotalRevenue').textContent = `₹${totalRevenue}`;
  document.getElementById('adminOrdersCount').textContent = `${filterAdminOrders().length} orders`;
}

function renderAdminOrderCard(order) {
  const card = document.createElement('article');
  card.className = 'admin-order-card';
  const orderedBy = order.orderedBy || {};
  const userLabel = orderedBy.role === 'student' ? 'Student' : orderedBy.role === 'staff' ? 'Staff' : 'User';

  card.innerHTML = `
    <div class="admin-order-card__header">
      <div>
        <p class="admin-order-id">Order #${order.id}</p>
        <p class="admin-order-meta">${order.canteen} • ${userLabel}</p>
      </div>
      <div class="admin-order-actions">
        <span class="admin-order-status-pill">${order.status.replace('_', ' ')}</span>
        <select class="admin-status-select" data-order-id="${order.id}">
          <option value="awaiting_payment" ${order.status === 'awaiting_payment' ? 'selected' : ''}>Pending</option>
          <option value="accepted" ${order.status === 'accepted' ? 'selected' : ''}>Accepted</option>
          <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>Preparing</option>
          <option value="ready" ${order.status === 'ready' ? 'selected' : ''}>Ready</option>
          <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
          <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
        </select>
      </div>
    </div>
    <div class="admin-order-body">
      <div>
        <p><strong>Total</strong> ₹${order.total}</p>
        <p><strong>Placed</strong> ${new Date(order.createdAt).toLocaleString()}</p>
      </div>
      <div>
        <p><strong>${userLabel}</strong></p>
        <p>${orderedBy.name || orderedBy.identifier || 'Unknown'}</p>
        ${orderedBy.email ? `<p>${orderedBy.email}</p>` : ''}
      </div>
    </div>
    <div class="admin-order-items">
      ${order.items.map(item => `<div class="admin-order-item"><span>${item.name} × ${item.qty}</span><strong>₹${item.qty * item.price}</strong></div>`).join('')}
    </div>
  `;
  card.dataset.status = order.status;

  const select = card.querySelector('.admin-status-select');
  select.addEventListener('change', async (event) => {
    const newStatus = event.target.value;
    try {
      const res = await fetch(`${API_BASE}/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Could not update order status.');
      const updated = await res.json();
      const index = adminOrders.findIndex(o => o.id === updated.id);
      if (index !== -1) {
        adminOrders[index] = updated;
      }
      updateAdminStats();
      renderAdminOrders();
      showToast('Order status updated.');
    } catch (err) {
      event.target.value = order.status;
      showToast(err.message || 'Failed to update order.');
    }
  });

  return card;
}

function renderAdminOrders() {
  const list = document.getElementById('adminOrderList');
  if (!list) return;
  const filtered = filterAdminOrders();
  list.innerHTML = '';
  if (filtered.length === 0) {
    list.innerHTML = '<div class="admin-empty-state"><p>No orders found. Refresh to fetch the latest activity.</p></div>';
    updateAdminStats();
    return;
  }
  filtered.forEach(order => list.appendChild(renderAdminOrderCard(order)));
  updateAdminStats();
}

async function loadAdminOrders() {
  try {
    const res = await fetch(`${API_BASE}/api/admin/orders`, { credentials: 'include' });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        showPage('page-admin-login');
        authMode = 'admin';
        updateAuthFields('login');
        return;
      }
      throw new Error('Could not load admin orders.');
    }
    adminOrders = await res.json();
    renderAdminOrders();
  } catch (err) {
    const list = document.getElementById('adminOrderList');
    if (list) list.innerHTML = `<div class="admin-empty-state"><p>${err.message}</p></div>`;
  }
}

/* ---------------------------------------------------------
   TOAST
--------------------------------------------------------- */
const toast = document.createElement('div');
toast.className = 'toast';
document.body.appendChild(toast);
let toastTimer;
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

/* ---------------------------------------------------------
   BUILD MENU GRIDS
--------------------------------------------------------- */
function buildMenus() {
  Object.keys(MENUS).forEach(canteenKey => {
    const grid = document.querySelector(`.menu-grid[data-menu="${canteenKey}"]`);
    if (!grid) return;
    grid.innerHTML = '';
    MENUS[canteenKey].forEach((item, idx) => {
      const key = `${canteenKey}::${idx}`;
      const row = document.createElement('div');
      row.className = 'menu-item';
      row.innerHTML = `
        <div class="item-thumb">${item.emoji}</div>
        <div class="item-info">
          <p class="item-name"><span class="dot ${item.veg ? 'dot--veg' : 'dot--nonveg'}"></span>${item.name}</p>
          ${item.sub ? `<p class="item-sub">${item.sub}</p>` : ''}
          <p class="item-price">₹${item.price}</p>
        </div>
        <div class="item-action" data-key="${key}"></div>
      `;
      grid.appendChild(row);
      renderAction(row.querySelector('.item-action'), canteenKey, item, key);
    });
  });
}

function renderAction(container, canteenKey, item, key) {
  const qty = cart[key] ? cart[key].qty : 0;
  if (qty <= 0) {
    container.innerHTML = `<button class="add-btn" type="button">Add <span class="arrow">+</span></button>`;
    container.querySelector('.add-btn').addEventListener('click', () => {
      setQty(canteenKey, item, key, 1, container);
    });
  } else {
    container.innerHTML = `
      <div class="stepper">
        <button type="button" data-action="minus" aria-label="Remove one">−</button>
        <span class="qty">${qty}</span>
        <button type="button" data-action="plus" aria-label="Add one">+</button>
      </div>
    `;
    container.querySelector('[data-action="minus"]').addEventListener('click', () => {
      setQty(canteenKey, item, key, qty - 1, container);
    });
    container.querySelector('[data-action="plus"]').addEventListener('click', () => {
      setQty(canteenKey, item, key, qty + 1, container);
    });
  }
}

function setQty(canteenKey, item, key, newQty, container) {
  if (newQty <= 0) {
    delete cart[key];
  } else {
    cart[key] = { canteenKey, name: item.name, price: item.price, qty: newQty };
  }
  renderAction(container, canteenKey, item, key);
  updateCartBar();
}

/* ---------------------------------------------------------
   CART BAR
--------------------------------------------------------- */
const cartBar = document.getElementById('cartBar');
const cartSummary = document.getElementById('cartSummary');
const ownerOrderList = document.getElementById('ownerOrderList');
const ownerOrdersCount = document.getElementById('ownerOrdersCount');
const ownerTitle = document.getElementById('ownerTitle');
const ownerRefreshBtn = document.getElementById('ownerRefreshBtn');
const ownerLogoutBtn = document.getElementById('ownerLogoutBtn');

function cartTotals() {
  let totalItems = 0;
  let totalPrice = 0;
  Object.values(cart).forEach(c => {
    totalItems += c.qty;
    totalPrice += c.qty * c.price;
  });
  return { totalItems, totalPrice };
}

function updateCartBar() {
  const { totalItems, totalPrice } = cartTotals();
  cartSummary.textContent = `${totalItems} item${totalItems === 1 ? '' : 's'} · ₹${totalPrice}`;
  cartBar.classList.toggle('show', totalItems > 0);
}

function renderOwnerOrders(orders) {
  if (!ownerOrderList) return;
  ownerOrderList.innerHTML = '';
  if (!orders || orders.length === 0) {
    ownerOrderList.innerHTML = '<div class="owner-empty-state"><p>No orders yet. Refresh to check again.</p></div>';
    ownerOrdersCount.textContent = '0 orders';
    return;
  }

  ownerOrdersCount.textContent = `${orders.length} order${orders.length === 1 ? '' : 's'}`;
  orders.forEach(order => {
    const card = document.createElement('article');
    card.className = 'owner-order-card';
    const orderedBy = order.orderedBy || {};
    const orderedName = orderedBy.name || orderedBy.identifier || 'Unknown';
    const orderedRole = orderedBy.role === 'staff' ? 'Staff' : 'Student';
    const orderedEmail = orderedBy.email ? `<span>${orderedBy.email}</span>` : '';

    card.innerHTML = `
      <div class="order-card-header">
        <div>
          <p class="order-number">Order #${order.id}</p>
          <p class="order-meta">${orderedRole} · ${orderedName}</p>
          ${orderedEmail}
        </div>
        <span class="order-status ${order.status}">${order.status.replace('_', ' ')}</span>
      </div>
      <div class="order-details">
        <p class="order-info"><strong>Canteen:</strong> ${order.canteen}</p>
        <p class="order-info"><strong>Total:</strong> ₹${order.total}</p>
        <p class="order-info"><strong>Placed:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
      </div>
      <div class="order-items">
        ${order.items.map(item => `<div class="order-item"><span>${item.name} × ${item.qty}</span><strong>₹${item.price * item.qty}</strong></div>`).join('')}
      </div>
    `;
    ownerOrderList.appendChild(card);
  });
}

async function loadOwnerOrders() {
  if (!ownerOrderList) return;
  try {
    const res = await fetch(`${API_BASE}/api/owner/orders`, { credentials: 'include' });
    if (!res.ok) {
      if (res.status === 401) {
        showPage('page-login');
        return;
      }
      throw new Error('Could not load orders.');
    }
    const orders = await res.json();
    renderOwnerOrders(orders);
  } catch (err) {
    ownerOrderList.innerHTML = `<div class="owner-empty-state"><p>${err.message}</p></div>`;
  }
}

/* ---------------------------------------------------------
   CHECKOUT / PAYMENT
--------------------------------------------------------- */
const orderListEl = document.getElementById('orderList');
const orderTotalEl = document.getElementById('orderTotal');
const payAmountEl = document.getElementById('payAmount');
const confirmPaidBtn = document.getElementById('confirmPaidBtn');
const orderErrorEl = document.getElementById('orderError');
const checkoutSummaryEl = document.getElementById('checkoutSummary');
const checkoutConfirmationEl = document.getElementById('checkoutConfirmation');
const selectedTimeDisplay = document.getElementById('selectedTimeDisplay');
const timeslotGrid = document.getElementById('timeslotGrid');
const shift1Btn = document.getElementById('shift1Btn');
const shift2Btn = document.getElementById('shift2Btn');
const gasBtn = document.getElementById('gasBtn');
const confirmTimeslotBtn = document.getElementById('confirmTimeslotBtn');
const timeslotError = document.getElementById('timeslotError');
const timeslotNote = document.getElementById('timeslotNote');
const timeslotCard = document.getElementById('timeslotCard');
const timeBackBtn = document.getElementById('timeBack');
const timeslotData = {
  sfs1: ['10:00 to 10:30', '11:00 to 11:30', '12:00 to 12:30'],
  sfs2: ['2:00 to 2:30', '3:00 to 3:30', '4:00 to 4:30'],
  gas: ['10:00 to 10:30', '11:00 to 11:30', '12:00 to 12:30']
};
let selectedShift = 'sfs1';
let selectedSlot = null;

function renderOrderSummary() {
  const items = Object.values(cart);
  orderListEl.innerHTML = '';

  if (items.length === 0) {
    orderListEl.innerHTML = `<p class="order-empty">Your cart is empty. Go back and add something tasty.</p>`;
  } else {
    items.forEach(c => {
      const row = document.createElement('div');
      row.className = 'order-row';
      row.innerHTML = `
        <span class="row-name">${c.name}<span class="row-qty"> × ${c.qty}</span></span>
        <span class="row-price">₹${c.price * c.qty}</span>
      `;
      orderListEl.appendChild(row);
    });
  }

  const { totalPrice } = cartTotals();
  orderTotalEl.textContent = `₹${totalPrice}`;
  payAmountEl.textContent = `₹${totalPrice}`;
}

function goToCheckout() {
  const { totalItems } = cartTotals();
  if (totalItems === 0) return;

  selectedShift = 'sfs1';
  selectedSlot = null;
  renderTimeSlots();
  updateShiftButtons();
  if (timeslotError) {
    timeslotError.classList.remove('show');
    timeslotError.textContent = '';
  }

  showPage('page-timeslot');
}

function renderTimeSlots() {
  if (!timeslotGrid) return;
  timeslotGrid.innerHTML = '';
  timeslotData[selectedShift].forEach(slot => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'timeslot-item';
    button.textContent = slot;
    button.dataset.slot = slot;
    if (selectedSlot === slot) {
      button.classList.add('selected');
    }
    button.addEventListener('click', () => {
      selectedSlot = slot;
      renderTimeSlots();
      if (timeslotError) {
        timeslotError.classList.remove('show');
        timeslotError.textContent = '';
      }
      updateTimeslotNote(slot);
    });
    timeslotGrid.appendChild(button);
  });
  updateTimeslotNote(selectedSlot);
}

function updateTimeslotNote(slot) {
  if (!timeslotNote) return;
  const heavySlots = ['4:00 to 4:30', '10:00 to 10:30'];
  if (heavySlots.includes(slot)) {
    timeslotNote.textContent = `Orders for ${slot} may be delayed because of a high amount of orders.`;
    timeslotNote.classList.remove('hidden');
  } else {
    timeslotNote.classList.add('hidden');
  }
}

function updateShiftButtons() {
  if (shift1Btn) shift1Btn.classList.toggle('active', selectedShift === 'sfs1');
  if (shift2Btn) shift2Btn.classList.toggle('active', selectedShift === 'sfs2');
  if (gasBtn) gasBtn.classList.toggle('active', selectedShift === 'gas');
  if (timeslotCard) {
    timeslotCard.classList.toggle('shift1-active', selectedShift === 'sfs1');
    timeslotCard.classList.toggle('shift2-active', selectedShift === 'sfs2');
    timeslotCard.classList.toggle('gas-active', selectedShift === 'gas');
  }
}

async function confirmTimeslot() {
  if (!selectedSlot) {
    if (timeslotError) {
      timeslotError.textContent = 'Please choose a pickup slot to continue.';
      timeslotError.classList.add('show');
    }
    return;
  }

  if (selectedTimeDisplay) {
    selectedTimeDisplay.innerHTML = `Pickup time: <strong>${selectedSlot}</strong>`;
  }
  showPage('page-checkout');
  checkoutSummaryEl.style.display = 'block';
  checkoutConfirmationEl.style.display = 'none';
  renderOrderSummary();
  orderErrorEl.classList.remove('show');
  confirmPaidBtn.disabled = true;
  confirmPaidBtn.textContent = 'Preparing your order…';
  await createOrder();
}

async function createOrder() {
  const items = Object.values(cart).map(c => ({ name: c.name, price: c.price, qty: c.qty, canteenKey: c.canteenKey }));
  const canteenKeys = [...new Set(Object.values(cart).map(c => c.canteenKey))];
  const canteenLabel = canteenKeys.length === 1 ? CANTEEN_LABELS[canteenKeys[0]] : 'Flasho (multiple canteens)';
  const canteenKey = canteenKeys.length === 1 ? canteenKeys[0] : null;

  try {
    const res = await fetch(`${API_BASE}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ items, canteen: canteenLabel, canteenKey })
    });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('Session expired or not logged in. Please log in first.');
      }
      throw new Error(data.error || 'Server responded with an error.');
    }
    currentOrderId = data.id;
    confirmPaidBtn.disabled = false;
    confirmPaidBtn.textContent = "I've completed the payment";
  } catch (err) {
    currentOrderId = null;
    confirmPaidBtn.disabled = true;
    confirmPaidBtn.textContent = "I've completed the payment";
    orderErrorEl.textContent = err.message || "Couldn't reach the Flasho server. Make sure the backend is running (see README.md), then reopen checkout.";
    orderErrorEl.classList.add('show');
  }
}

confirmPaidBtn.addEventListener('click', async () => {
  if (!currentOrderId) return;
  confirmPaidBtn.disabled = true;
  confirmPaidBtn.textContent = 'Confirming…';

  try {
    const res = await fetch(`${API_BASE}/api/orders/${currentOrderId}/confirm`, {
      method: 'POST',
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Could not confirm order.');
    const order = await res.json();

    document.getElementById('confirmOrderId').textContent = `#${order.id}`;
    document.getElementById('confirmTotal').textContent = `${order.items.reduce((n, i) => n + i.qty, 0)} items · ₹${order.total} paid`;

    checkoutSummaryEl.style.display = 'none';
    checkoutConfirmationEl.style.display = 'block';

    // clear cart for next order
    Object.keys(cart).forEach(k => delete cart[k]);
    updateCartBar();
    currentOrderId = null;
  } catch (err) {
    orderErrorEl.textContent = 'Could not confirm the payment with the server. Please try again.';
    orderErrorEl.classList.add('show');
    confirmPaidBtn.disabled = false;
    confirmPaidBtn.textContent = "I've completed the payment";
  }
});

document.getElementById('cartCheckout').addEventListener('click', goToCheckout);
document.getElementById('checkoutBack').addEventListener('click', () => showPage('page-home'));
document.getElementById('timeBack').addEventListener('click', () => showPage('page-home'));
if (shift1Btn) {
  shift1Btn.addEventListener('click', () => {
    selectedShift = 'sfs1';
    selectedSlot = null;
    renderTimeSlots();
    updateShiftButtons();
    if (timeslotNote) timeslotNote.classList.add('hidden');
  });
}
if (shift2Btn) {
  shift2Btn.addEventListener('click', () => {
    selectedShift = 'sfs2';
    selectedSlot = null;
    renderTimeSlots();
    updateShiftButtons();
    if (timeslotNote) timeslotNote.classList.add('hidden');
  });
}
if (gasBtn) {
  gasBtn.addEventListener('click', () => {
    selectedShift = 'gas';
    selectedSlot = null;
    renderTimeSlots();
    updateShiftButtons();
    if (timeslotNote) timeslotNote.classList.add('hidden');
  });
}
document.getElementById('confirmTimeslotBtn').addEventListener('click', confirmTimeslot);
document.getElementById('newOrderBtn').addEventListener('click', () => showPage('page-home'));

/* ---------------------------------------------------------
   TIMER
--------------------------------------------------------- */
const minutesLeftEl = document.getElementById('minutesLeft');
const mmssEls = document.querySelectorAll('.timer-mmss');

function renderTimer() {
  const hrs = Math.floor(timerSeconds / 3600);
  const mins = Math.floor((timerSeconds % 3600) / 60);
  const secs = timerSeconds % 60;
  const displayMinutes = hrs > 0 ? `${hrs}h ${String(mins).padStart(2, '0')}m` : `${mins} min`;
  minutesLeftEl.textContent = displayMinutes;
  const hhmmss = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  mmssEls.forEach(el => el.textContent = hhmmss);
}

function startTimer() {
  if (timerStarted) return;
  timerStarted = true;
  renderTimer();
  timerInterval = setInterval(() => {
    timerSeconds = Math.max(0, timerSeconds - 1);
    renderTimer();
    if (timerSeconds === 0) clearInterval(timerInterval);
  }, 1000);
}

function resetTimer() {
  clearInterval(timerInterval);
  timerSeconds = 2 * 60 * 60;
  timerStarted = false;
  renderTimer();
}

/* ---------------------------------------------------------
   AUTH & EVENT WIRING
--------------------------------------------------------- */
async function checkAuthSession() {
  try {
    let res = await fetch(`${API_BASE}/api/me`, { credentials: 'include' });
    if (res.ok) {
      const user = await res.json();
      authMode = 'student';
      currentUserRole = 'student';
      updateAuthFields('login');
      showPage('page-home');
      startTimer();
      showToast(`Welcome back, ${user.name || user.roll}!`);
      return;
    }

    res = await fetch(`${API_BASE}/api/staff/me`, { credentials: 'include' });
    if (res.ok) {
      const staffUser = await res.json();
      authMode = 'staff';
      currentUserRole = staffUser.role;
      currentUserCanteenKey = staffUser.canteenKey || null;
      updateAuthFields('login');
      if (staffUser.role === 'owner') {
        if (ownerTitle) ownerTitle.textContent = `${CANTEEN_LABELS[staffUser.canteenKey] || 'Canteen'} orders`;
        showPage('page-owner');
        loadOwnerOrders();
      } else if (staffUser.role === 'canteen_admin') {
        currentUserCanteenKey = staffUser.canteenKey || null;
        currentUserCanteenLabel = CANTEEN_LABELS[currentUserCanteenKey] || 'Admin';
        updateAdminDashboardTitle();
        showPage('page-admin');
        loadAdminOrders();
      } else {
        showPage('page-home');
      }
      startTimer();
      showToast(`Welcome back, ${staffUser.name || staffUser.email}!`);
      return;
    }
  } catch (err) {
    // Guest or disconnected - stay on login screen
  }
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const identifier = document.getElementById('loginIdentifier').value.trim();
  const pass = document.getElementById('loginPassword').value.trim();
  const err = document.getElementById('loginError');
  if (!identifier || !pass) {
    err.classList.add('show');
    return;
  }
  err.classList.remove('show');
  err.textContent = 'Signing you in…';

  try {
    const endpoint = authMode === 'student' ? '/api/login' : '/api/staff/login';
    const payload = authMode === 'student'
      ? { roll: identifier, password: pass }
      : { email: identifier, password: pass };

    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not log in.');

    currentUserRole = authMode === 'staff' ? data.role || 'staff' : 'student';
    currentUserCanteenKey = authMode === 'staff' ? data.canteenKey || null : null;
    if (currentUserRole === 'owner') {
      if (ownerTitle) ownerTitle.textContent = `${CANTEEN_LABELS[currentUserCanteenKey] || 'Canteen'} orders`;
      showPage('page-owner');
      loadOwnerOrders();
      showToast('Owner login successful.');
    } else {
      showPage('page-home');
      startTimer();
      showToast(authMode === 'student' ? 'Student login successful.' : 'Staff login successful.');
    }
  } catch (error) {
    err.textContent = error.message || 'Could not log in.';
    err.classList.add('show');
  }
});

document.getElementById('signupForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const identifier = document.getElementById('signupIdentifier').value.trim();
  const pass = document.getElementById('signupPassword').value.trim();
  const name = document.getElementById('signupName').value.trim();
  const err = document.getElementById('signupError');

  if (!identifier || !pass || !name) {
    err.classList.add('show');
    return;
  }

  err.classList.remove('show');
  err.textContent = 'Creating your account…';

  try {
    const endpoint = authMode === 'student' ? '/api/register' : '/api/staff/register';
    const payload = authMode === 'student'
      ? { roll: identifier, name, password: pass }
      : { name, email: identifier, password: pass };

    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not create account.');

    currentUserRole = authMode === 'staff' ? data.role || 'staff' : 'student';
    currentUserCanteenKey = authMode === 'staff' ? data.canteenKey || null : null;
    if (currentUserRole === 'owner') {
      if (ownerTitle) ownerTitle.textContent = `${CANTEEN_LABELS[currentUserCanteenKey] || 'Canteen'} orders`;
      showPage('page-owner');
      loadOwnerOrders();
      showToast('Owner account created.');
    } else {
      showPage('page-home');
      startTimer();
      showToast(authMode === 'student' ? 'Student account created.' : 'Staff account created.');
    }
  } catch (error) {
    err.textContent = error.message || 'Could not create account.';
    err.classList.add('show');
  }
});

const forgotForm = document.getElementById('forgotForm');
const forgotRequestStage = document.getElementById('forgotRequestStage');
const forgotOtpStage = document.getElementById('forgotOtpStage');
const forgotVerifyBtn = document.getElementById('forgotVerifyBtn');
const forgotError = document.getElementById('forgotError');
const otpInputs = Array.from(document.querySelectorAll('.otp-input'));
let currentDemoOtp = '0000';

function resetForgotFlow() {
  const forgotSuccess = document.getElementById('forgotSuccess');
  if (forgotError) {
    forgotError.classList.remove('show');
    forgotError.textContent = '';
  }
  if (forgotSuccess) {
    forgotSuccess.classList.remove('show');
  }
  if (forgotRequestStage) forgotRequestStage.classList.remove('hidden');
  if (forgotOtpStage) forgotOtpStage.classList.add('hidden');
  otpInputs.forEach(input => {
    input.value = '';
    input.removeAttribute('disabled');
  });
  if (forgotVerifyBtn) {
    forgotVerifyBtn.disabled = false;
    forgotVerifyBtn.textContent = 'Verify OTP';
  }
  document.body.classList.remove('otp-active');
}

function generateOtp() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function getOtpValue() {
  return otpInputs.map(input => input.value.trim()).join('');
}

function bindOtpInputs() {
  otpInputs.forEach((input, index) => {
    input.addEventListener('input', () => {
      input.value = input.value.replace(/[^0-9]/g, '').slice(0, 1);
      if (input.value && index < otpInputs.length - 1) {
        otpInputs[index + 1].focus();
      }
    });
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Backspace' && !input.value && index > 0) {
        otpInputs[index - 1].focus();
      }
    });
  });
}

if (forgotForm) {
  forgotForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('forgotName').value.trim();
    const identifier = document.getElementById('forgotIdentifier').value.trim();
    const phone = document.getElementById('forgotPhone').value.trim();

    if (!name || !identifier || !phone) {
      if (forgotError) {
        forgotError.textContent = 'Please complete all fields to receive your OTP.';
        forgotError.classList.add('show');
      }
      return;
    }

    resetForgotFlow();
    currentDemoOtp = generateOtp();
    if (forgotOtpStage) forgotOtpStage.classList.remove('hidden');
    if (forgotRequestStage) forgotRequestStage.classList.add('hidden');
    document.body.classList.add('otp-active');
    showToast(`Demo OTP sent: ${currentDemoOtp}`);
  });
}

if (forgotVerifyBtn) {
  forgotVerifyBtn.addEventListener('click', () => {
    const otpValue = getOtpValue();
    if (otpValue.length !== 4) {
      if (forgotError) {
        forgotError.textContent = 'Enter the 4-digit OTP to continue.';
        forgotError.classList.add('show');
      }
      return;
    }

    const forgotSuccess = document.getElementById('forgotSuccess');
    if (forgotSuccess) {
      forgotSuccess.classList.add('show');
    }
    if (forgotError) {
      forgotError.classList.remove('show');
    }
    otpInputs.forEach(input => input.setAttribute('disabled', 'true'));
    if (forgotVerifyBtn) {
      forgotVerifyBtn.disabled = true;
      forgotVerifyBtn.textContent = 'Password changed';
    }
    setTimeout(() => {
      resetForgotFlow();
      showPage('page-login');
      updateAuthFields('login');
    }, 400);
  });
}

document.getElementById('forgotLink').addEventListener('click', (e) => {
  e.preventDefault();
  resetForgotFlow();
  showPage('page-forgot');
  updateAuthFields('forgot');
});
document.getElementById('createLink').addEventListener('click', (e) => {
  e.preventDefault();
  showPage('page-signup');
  updateAuthFields('signup');
});
document.getElementById('backToLoginLink').addEventListener('click', (e) => {
  e.preventDefault();
  showPage('page-login');
  updateAuthFields('login');
});

document.querySelectorAll('.auth-switch__btn').forEach(btn => {
  btn.addEventListener('click', () => {
    authMode = btn.dataset.authMode;
    const targetView = btn.dataset.view;
    updateAuthFields(targetView);
    if (authMode === 'admin' && targetView === 'login') {
      showPage('page-admin-login');
    } else if (targetView === 'login') {
      showPage('page-login');
    } else if (targetView === 'signup') {
      showPage('page-signup');
    } else if (targetView === 'forgot') {
      showPage('page-forgot');
    }
  });
});

const adminLoginForm = document.getElementById('adminLoginForm');
const adminIdentifier = document.getElementById('adminIdentifier');
const adminPassword = document.getElementById('adminPassword');
const adminLoginError = document.getElementById('adminLoginError');
const adminBackLink = document.getElementById('adminBackLink');
const adminRefreshBtn = document.getElementById('adminRefreshBtn');
const adminLogoutBtn = document.getElementById('adminLogoutBtn');
const adminSearchInput = document.getElementById('adminSearchInput');
const adminStatusFilter = document.getElementById('adminStatusFilter');

function updateAdminDashboardTitle() {
  const title = document.getElementById('adminDashboardTitle');
  if (title) {
    title.textContent = `${currentUserCanteenLabel} Admin Dashboard`;
  }
}

function redirectToAdminDashboard() {
  updateAdminDashboardTitle();
  showPage('page-admin');
  loadAdminOrders();
}

if (adminLoginForm) {
  adminLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!adminIdentifier.value.trim() || !adminPassword.value.trim()) {
      adminLoginError.textContent = 'Enter both email and password.';
      adminLoginError.classList.add('show');
      return;
    }
    adminLoginError.classList.remove('show');
    adminLoginError.textContent = 'Signing in…';
    try {
      const res = await fetch(`${API_BASE}/api/staff/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: adminIdentifier.value.trim(), password: adminPassword.value.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not log in.');
      if (data.role !== 'canteen_admin') throw new Error('Admin account required.');
      currentUserRole = 'canteen_admin';
      currentUserCanteenKey = data.canteenKey || null;
      currentUserCanteenLabel = CANTEEN_LABELS[currentUserCanteenKey] || 'Admin';
      updateAdminDashboardTitle();
      showToast('Admin login successful.');
      redirectToAdminDashboard();
    } catch (error) {
      adminLoginError.textContent = error.message || 'Could not log in.';
      adminLoginError.classList.add('show');
    }
  });
}

if (adminBackLink) {
  adminBackLink.addEventListener('click', (e) => {
    e.preventDefault();
    authMode = 'student';
    showPage('page-login');
    updateAuthFields('login');
  });
}

if (adminRefreshBtn) {
  adminRefreshBtn.addEventListener('click', () => loadAdminOrders());
}

if (adminLogoutBtn) {
  adminLogoutBtn.addEventListener('click', async () => {
    try {
      await fetch(`${API_BASE}/api/staff/logout`, { method: 'POST', credentials: 'include' });
    } catch (error) {
      // ignore
    }
    currentUserRole = null;
    currentUserCanteenKey = null;
    currentUserCanteenLabel = null;
    authMode = 'student';
    showPage('page-login');
    updateAuthFields('login');
    resetTimer();
    showToast('Logged out.');
  });
}

if (adminSearchInput) {
  adminSearchInput.addEventListener('input', (event) => {
    adminSearch = event.target.value;
    renderAdminOrders();
  });
}

if (adminStatusFilter) {
  adminStatusFilter.addEventListener('change', (event) => {
    adminStatusFilterValue = event.target.value;
    renderAdminOrders();
  });
}

bindOtpInputs();

document.querySelectorAll('.canteen-card').forEach(card => {
  card.addEventListener('click', () => showPage(card.dataset.target));
});

document.querySelectorAll('[data-back]').forEach(btn => {
  btn.addEventListener('click', () => showPage('page-home'));
});

const myOrdersBtn = document.getElementById('myOrdersBtn');
const myOrdersRefreshBtn = document.getElementById('myOrdersRefreshBtn');
const myOrdersBackBtn = document.getElementById('myOrdersBackBtn');
const myOrdersSearchInput = document.getElementById('myOrdersSearchInput');
const myOrdersStatusFilterEl = document.getElementById('myOrdersStatusFilter');
const myOrdersDateFromEl = document.getElementById('myOrdersDateFrom');
const myOrdersDateToEl = document.getElementById('myOrdersDateTo');
const myOrdersPrevBtn = document.getElementById('myOrdersPrevBtn');
const myOrdersNextBtn = document.getElementById('myOrdersNextBtn');
const orderDetailsCloseBtn = document.getElementById('orderDetailsCloseBtn');

if (myOrdersBtn) {
  myOrdersBtn.addEventListener('click', async () => {
    await loadMyOrders();
    showPage('page-my-orders');
  });
}

if (myOrdersRefreshBtn) {
  myOrdersRefreshBtn.addEventListener('click', async () => {
    await loadMyOrders();
  });
}

if (myOrdersBackBtn) {
  myOrdersBackBtn.addEventListener('click', () => showPage('page-home'));
}

if (myOrdersSearchInput) {
  myOrdersSearchInput.addEventListener('input', (event) => {
    myOrdersSearch = event.target.value;
    myOrdersPage = 1;
    renderMyOrders();
  });
}

if (myOrdersStatusFilterEl) {
  myOrdersStatusFilterEl.addEventListener('change', (event) => {
    myOrdersStatusFilter = event.target.value;
    myOrdersPage = 1;
    renderMyOrders();
  });
}

if (myOrdersDateFromEl) {
  myOrdersDateFromEl.addEventListener('change', (event) => {
    myOrdersDateFrom = event.target.value;
    myOrdersPage = 1;
    renderMyOrders();
  });
}

if (myOrdersDateToEl) {
  myOrdersDateToEl.addEventListener('change', (event) => {
    myOrdersDateTo = event.target.value;
    myOrdersPage = 1;
    renderMyOrders();
  });
}

if (myOrdersPrevBtn) {
  myOrdersPrevBtn.addEventListener('click', () => {
    if (myOrdersPage > 1) {
      myOrdersPage -= 1;
      renderMyOrders();
    }
  });
}

if (myOrdersNextBtn) {
  myOrdersNextBtn.addEventListener('click', () => {
    myOrdersPage += 1;
    renderMyOrders();
  });
}

if (orderDetailsCloseBtn) {
  orderDetailsCloseBtn.addEventListener('click', closeOrderDetails);
}

document.getElementById('orderDetailsModal')?.addEventListener('click', (event) => {
  if (event.target === event.currentTarget) {
    closeOrderDetails();
  }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  try {
    if (authMode === 'staff') {
      await fetch(`${API_BASE}/api/staff/logout`, { method: 'POST', credentials: 'include' });
    } else {
      await fetch(`${API_BASE}/api/logout`, { method: 'POST', credentials: 'include' });
    }
  } catch (error) {
    // ignore logout errors and still return to the login screen
  }

  currentUserRole = null;
  currentUserCanteenKey = null;
  showPage('page-login');
  updateAuthFields('login');
  resetTimer();
  showToast('Logged out.');
});

if (ownerRefreshBtn) {
  ownerRefreshBtn.addEventListener('click', async () => {
    await loadOwnerOrders();
  });
}

if (ownerLogoutBtn) {
  ownerLogoutBtn.addEventListener('click', async () => {
    try {
      await fetch(`${API_BASE}/api/staff/logout`, { method: 'POST', credentials: 'include' });
    } catch (error) {
      // ignore logout errors
    }
    currentUserRole = null;
    currentUserCanteenKey = null;
    showPage('page-login');
    updateAuthFields('login');
    resetTimer();
    showToast('Logged out.');
  });
}

/* ---------------------------------------------------------
   INIT
--------------------------------------------------------- */
buildMenus();
renderTimer();
updateCartBar();
updateAuthFields('login');
checkAuthSession();
const express = require('express');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();
const { ordersDB, studentsDB, staffDB, ready: dbReady } = require('./db');
const bcrypt = require('bcryptjs');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// CORS with credentials support
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,PUT,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// ---------- helpers ----------
function calcTotal(items) {
  return items.reduce((sum, i) => sum + Number(i.price) * Number(i.qty), 0);
}

function normalizeOrder(order) {
  if (!order) return order;
  const normalized = { ...order };

  if (normalized.status === 'paid') {
    normalized.paymentStatus = 'paid';
    normalized.status = 'awaiting_payment';
  }

  if (!normalized.paymentStatus) {
    normalized.paymentStatus = normalized.status === 'awaiting_payment' ? 'pending' : 'paid';
  }

  if (normalized.estimatedPreparationTimeMinutes === undefined) {
    normalized.estimatedPreparationTimeMinutes = {
      bhojan: 12,
      amrit: 10,
      coffeekudi: 8,
      saisri: 14
    }[normalized.canteenKey] || null;
  }

  return normalized;
}

function isOrderAccessibleBySession(order, req) {
  const studentUser = req.session.user;
  const staffUser = req.session.staff;
  if (!studentUser && !staffUser) return false;

  if (studentUser) {
    return order.orderedBy?.role === 'student' && order.orderedBy?.identifier === studentUser.roll;
  }

  if (staffUser) {
    if (staffUser.role === 'canteen_admin' || staffUser.role === 'owner') {
      return order.canteenKey === staffUser.canteenKey;
    }
    return order.orderedBy?.role === 'staff' && order.orderedBy?.identifier === staffUser.email;
  }

  return false;
}

async function seedDemoAccounts() {
  const existingStudents = await studentsDB.find({});
  if (existingStudents.length === 0) {
    await studentsDB.insert({
      roll: '21CS001',
      name: 'Demo Student',
      email: 'student@flasho.com',
      passwordHash: bcrypt.hashSync('demo123', 10),
      createdAt: new Date().toISOString()
    });
  }

  const existingAdminStudent = await studentsDB.findOne({ roll: '80838' });
  if (!existingAdminStudent) {
    await studentsDB.insert({
      roll: '80838',
      name: 'Admin User',
      email: 'admin@flasho.com',
      passwordHash: bcrypt.hashSync('surya9597', 10),
      createdAt: new Date().toISOString()
    });
  }

  const existingStaff = await staffDB.find({});
  if (existingStaff.length === 0) {
    await staffDB.insert({
      name: 'Demo Staff',
      email: 'staff@flasho.com',
      role: 'manager',
      passwordHash: bcrypt.hashSync('staff123', 10),
      createdAt: new Date().toISOString()
    });
  }

  const adminSeeds = [
    { name: 'Bhojan Admin', email: 'bhojan@gnc.com', role: 'canteen_admin', canteenKey: 'bhojan', password: 'bhojan123' },
    { name: 'AMRIT Admin', email: 'amrit@gnc.com', role: 'canteen_admin', canteenKey: 'amrit', password: 'amrit123' },
    { name: 'CoffeeKudi Admin', email: 'coffeekudi@gnc.com', role: 'canteen_admin', canteenKey: 'coffeekudi', password: 'coffee123' },
    { name: 'SaiSri Admin', email: 'saisri@gnc.com', role: 'canteen_admin', canteenKey: 'saisri', password: 'saisri123' }
  ];

  for (const admin of adminSeeds) {
    const existingAdmin = await staffDB.findOne({ email: admin.email });
    if (!existingAdmin) {
      await staffDB.insert({
        name: admin.name,
        email: admin.email,
        role: admin.role,
        canteenKey: admin.canteenKey,
        passwordHash: bcrypt.hashSync(admin.password, 10),
        createdAt: new Date().toISOString()
      });
    }
  }

  const ownerSeeds = [
    { name: 'Bhojan Owner', email: 'bhojan-owner@flasho.com', canteenKey: 'bhojan' },
    { name: 'AMRIT Owner', email: 'amrit-owner@flasho.com', canteenKey: 'amrit' },
    { name: 'CoffeeKudi Owner', email: 'coffeekudi-owner@flasho.com', canteenKey: 'coffeekudi' },
    { name: 'Sai Sri Owner', email: 'saisri-owner@flasho.com', canteenKey: 'saisri' }
  ];

  for (const owner of ownerSeeds) {
    const existingOwner = await staffDB.findOne({ email: owner.email });
    if (!existingOwner) {
      await staffDB.insert({
        name: owner.name,
        email: owner.email,
        role: 'owner',
        canteenKey: owner.canteenKey,
        passwordHash: bcrypt.hashSync('owner123', 10),
        createdAt: new Date().toISOString()
      });
    }
  }
}

// ---------- routes ----------

// Create an order — accepts either student or staff session
app.post('/api/orders', async (req, res) => {
  const user = req.session && (req.session.user || req.session.staff);
  if (!user) return res.status(401).json({ error: 'Authentication required. Please log in.' });
  const { items } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty.' });
  }
  for (const item of items) {
    if (!item.name || typeof item.price !== 'number' || typeof item.qty !== 'number' || !item.canteenKey) {
      return res.status(400).json({ error: 'Each item needs a name, price, qty, and canteenKey.' });
    }
  }

  const canteenKeys = [...new Set(items.map(item => item.canteenKey).filter(Boolean))];
  if (canteenKeys.length === 0) {
    return res.status(400).json({ error: 'Unable to determine canteen for the order.' });
  }
  if (canteenKeys.length > 1) {
    return res.status(400).json({ error: 'All items must belong to the same canteen.' });
  }

  const orderCanteenKey = canteenKeys[0];
  const order = {
    id: crypto.randomUUID().slice(0, 8).toUpperCase(),
    canteen: req.body.canteen || orderCanteenKey,
    canteenKey: orderCanteenKey,
    items,
    total: calcTotal(items),
    status: 'awaiting_payment',
    paymentStatus: 'pending',
    estimatedPreparationTimeMinutes: {
      bhojan: 12,
      amrit: 10,
      coffeekudi: 8,
      saisri: 14
    }[orderCanteenKey] || null,
    createdAt: new Date().toISOString(),
    orderedBy: {
      role: user.roll ? 'student' : 'staff',
      identifier: user.roll || user.email,
      name: user.name || null,
      email: user.email || null
    }
  };
  try {
    await ordersDB.insert(order);
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create order.' });
  }
});

app.get('/api/owner/orders', async (req, res) => {
  const staffUser = req.session.staff;
  if (!staffUser || staffUser.role !== 'owner') {
    return res.status(401).json({ error: 'Owner authentication required.' });
  }

  const orders = await ordersDB.find({ canteenKey: staffUser.canteenKey });
  orders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  res.json(orders);
});

app.get('/api/admin/orders', async (req, res) => {
  const staffUser = req.session.staff;
  if (!staffUser || staffUser.role !== 'canteen_admin') {
    return res.status(401).json({ error: 'Admin authentication required.' });
  }

  const orders = await ordersDB.find({ canteenKey: staffUser.canteenKey });
  orders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  res.json(orders);
});

app.patch('/api/admin/orders/:id', async (req, res) => {
  const staffUser = req.session.staff;
  if (!staffUser || staffUser.role !== 'canteen_admin') {
    return res.status(401).json({ error: 'Admin authentication required.' });
  }

  const { status } = req.body || {};
  const allowed = ['awaiting_payment', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'];
  if (!status || !allowed.includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }

  const order = await ordersDB.findOne({ id: req.params.id });
  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }
  if (order.canteenKey !== staffUser.canteenKey) {
    return res.status(403).json({ error: 'Access denied for this order.' });
  }

  await ordersDB.update({ id: req.params.id }, { $set: { status } });
  const updated = await ordersDB.findOne({ id: req.params.id });
  res.json(updated);
});

// Register new student
app.post('/api/register', async (req, res) => {
  const { roll, name, email, password } = req.body || {};
  if (!roll || !name || !password) return res.status(400).json({ error: 'roll, name and password required.' });
  const existing = await studentsDB.findOne({ roll });
  if (existing) return res.status(400).json({ error: 'Student with this roll already exists.' });
  const passwordHash = bcrypt.hashSync(password, 10);
  const student = { roll, name, email: email || null, passwordHash, createdAt: new Date().toISOString() };
  await studentsDB.insert(student);
  const { passwordHash: _, ...publicStudent } = student;
  req.session.user = { roll: student.roll, name: student.name, email: student.email };
  res.status(201).json(publicStudent);
});

// Login
app.post('/api/login', async (req, res) => {
  const { roll, password } = req.body || {};
  if (!roll || !password) return res.status(400).json({ error: 'roll and password required.' });
  const student = await studentsDB.findOne({ roll });
  if (!student) return res.status(400).json({ error: 'Invalid credentials.' });
  const ok = bcrypt.compareSync(password, student.passwordHash || '');
  if (!ok) return res.status(400).json({ error: 'Invalid credentials.' });
  req.session.user = { roll: student.roll, name: student.name, email: student.email };
  const { passwordHash: _, ...publicStudent } = student;
  res.json(publicStudent);
});

// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({}));
});

// Current user
app.get('/api/me', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not authenticated.' });
  res.json(req.session.user);
});

// Fetch a single order
app.get('/api/orders/:id', async (req, res) => {
  const order = await ordersDB.findOne({ id: req.params.id });
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  res.json(order);
});

// Manually confirm payment
app.post('/api/orders/:id/confirm', async (req, res) => {
  const order = await ordersDB.findOne({ id: req.params.id });
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  if (order.paymentStatus === 'paid') return res.json(order);

  await ordersDB.update({ id: req.params.id }, { $set: { paymentStatus: 'paid', confirmedAt: new Date().toISOString() } });
  const updated = await ordersDB.findOne({ id: req.params.id });
  res.json(normalizeOrder(updated));
});

app.get('/api/orders/:id', async (req, res) => {
  const order = await ordersDB.findOne({ id: req.params.id.toUpperCase() });
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  if (!isOrderAccessibleBySession(order, req)) {
    return res.status(403).json({ error: 'Access denied.' });
  }
  res.json(normalizeOrder(order));
});

// List orders for the current student or staff user
app.get('/api/orders', async (req, res) => {
  const studentUser = req.session.user;
  const staffUser = req.session.staff;

  if (!studentUser && !staffUser) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const query = {};
  const { status, orderId, dateFrom, dateTo } = req.query;

  if (status && status !== 'all') {
    query.status = status;
  }
  if (orderId) {
    query.id = orderId.toUpperCase();
  }

  if (studentUser) {
    query['orderedBy.identifier'] = studentUser.roll;
  } else if (staffUser) {
    if (staffUser.role === 'owner' || staffUser.role === 'canteen_admin') {
      query.canteenKey = staffUser.canteenKey;
    } else {
      query['orderedBy.identifier'] = staffUser.email;
    }
  }

  let orders = await ordersDB.find(query);

  if (dateFrom || dateTo) {
    orders = orders.filter(order => {
      const createdAt = new Date(order.createdAt || '');
      if (Number.isNaN(createdAt.getTime())) return false;
      if (dateFrom && createdAt < new Date(`${dateFrom}T00:00:00`)) return false;
      if (dateTo && createdAt > new Date(`${dateTo}T23:59:59`)) return false;
      return true;
    });
  }

  orders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  res.json(orders.map(normalizeOrder));
});

// ---------- students API ----------
app.post('/api/students', async (req, res) => {
  const { roll, name, email } = req.body || {};
  if (!roll || !name) return res.status(400).json({ error: 'roll and name are required.' });
  const existing = await studentsDB.findOne({ roll });
  if (existing) return res.status(400).json({ error: 'Student with this roll already exists.' });

  const student = { roll, name, email: email || null, createdAt: new Date().toISOString() };
  await studentsDB.insert(student);
  res.status(201).json(student);
});

app.get('/api/students/:roll', async (req, res) => {
  const student = await studentsDB.findOne({ roll: req.params.roll });
  if (!student) return res.status(404).json({ error: 'Student not found.' });
  res.json(student);
});

app.get('/api/students', async (req, res) => {
  const students = await studentsDB.find({});
  students.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  res.json(students);
});

// ---------- staff API ----------
app.post('/api/staff/register', async (req, res) => {
  const { name, email, password, role } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password are required.' });
  const existing = await staffDB.findOne({ email });
  if (existing) return res.status(400).json({ error: 'Staff with this email already exists.' });

  const passwordHash = bcrypt.hashSync(password, 10);
  const staff = {
    name: name || 'Staff',
    email,
    role: role || null,
    canteenKey: role === 'owner' ? (req.body.canteenKey || null) : null,
    passwordHash,
    createdAt: new Date().toISOString()
  };
  await staffDB.insert(staff);
  const { passwordHash: _, ...publicStaff } = staff;
  req.session.staff = { name: staff.name, email: staff.email, role: staff.role, canteenKey: staff.canteenKey };
  res.status(201).json(publicStaff);
});

app.post('/api/staff/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password are required.' });
  const staff = await staffDB.findOne({ email });
  if (!staff) return res.status(400).json({ error: 'Invalid credentials.' });
  const ok = bcrypt.compareSync(password, staff.passwordHash || '');
  if (!ok) return res.status(400).json({ error: 'Invalid credentials.' });
  req.session.staff = { name: staff.name, email: staff.email, role: staff.role, canteenKey: staff.canteenKey };
  const { passwordHash: _, ...publicStaff } = staff;
  res.json(publicStaff);
});

app.post('/api/staff/logout', (req, res) => {
  req.session.destroy(() => res.json({}));
});

app.get('/api/staff/me', (req, res) => {
  if (!req.session.staff) return res.status(401).json({ error: 'Not authenticated.' });
  res.json(req.session.staff);
});

async function startServer() {
  try {
    await dbReady;
    await seedDemoAccounts();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Flasho server running at http://0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const DB_FILE = path.join(__dirname, "../db.json");

app.use(express.json());

// Helper to write default Arabic seed data
function getInitialData() {
  return {
    revenues: [],
    expenses: [],
    cashbox: [],
    invoices: [],
    payroll: [],
    assets: [],
    settings: {
      clinicName: "مركز ياس الطبي",
      currency: "₪",
      currencyName: "شيكل",
      taxRate: 15,
      alertLowCash: 5000,
      darkMode: false,
      adminName: "م. أمل أبو عيد",
      adminEmail: "aeid44304@gmail.com",
      address: "مواصي خانيونس - شمال مفترق النص ب 200 متر"
    }
  };
}

function isPlainObject(value: any): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeDb(data: any) {
  const initial = getInitialData();
  return {
    revenues: Array.isArray(data?.revenues) ? data.revenues : [],
    expenses: Array.isArray(data?.expenses) ? data.expenses : [],
    cashbox: Array.isArray(data?.cashbox) ? data.cashbox : [],
    invoices: Array.isArray(data?.invoices) ? data.invoices : [],
    payroll: Array.isArray(data?.payroll) ? data.payroll : [],
    assets: Array.isArray(data?.assets) ? data.assets : [],
    settings: isPlainObject(data?.settings) ? { ...initial.settings, ...data.settings } : initial.settings,
  };
}

// Ensure database file exists
function loadDb() {
  if (!fs.existsSync(DB_FILE)) {
    const data = getInitialData();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    return data;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (!isPlainObject(parsed)) {
      throw new Error("Invalid DB format");
    }
    const normalized = normalizeDb(parsed);
    if (JSON.stringify(normalized) !== JSON.stringify(parsed)) {
      saveDb(normalized);
    }
    return normalized;
  } catch (err) {
    const data = getInitialData();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    return data;
  }
}

function saveDb(data: any) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// GET all data
app.get("/all", (req, res) => {
  const db = loadDb();
  res.json(db);
});

// SYNC entire database from client
app.post("/sync", (req, res) => {
  if (req.body && typeof req.body === "object") {
    saveDb(req.body);
    res.json(req.body);
  } else {
    res.status(400).json({ error: "Invalid sync database payload" });
  }
});

// Update settings
app.put("/settings", (req, res) => {
  const db = loadDb();
  db.settings = { ...db.settings, ...req.body };
  saveDb(db);
  res.json(db.settings);
});

// REVENUE CRUD
app.post("/revenues", (req, res) => {
  const db = loadDb();
  const newRevenue = {
    id: `REV-${1000 + db.revenues.length + 1}`,
    ...req.body,
    date: req.body.date || new Date().toISOString().split("T")[0]
  };
  db.revenues.unshift(newRevenue);
  if (req.body.paymentMethod === "نقدي" && req.body.amount) {
    const newCash = {
      id: `CSH-${3000 + db.cashbox.length + 1}`,
      type: "إيداع",
      description: `إيراد نقدي تلقائي - ${req.body.patientName}`,
      amount: Number(req.body.amount),
      date: req.body.date || new Date().toISOString().split("T")[0],
      employee: "النظام المالي الموحد"
    };
    db.cashbox.unshift(newCash);
  }
  saveDb(db);
  res.json(newRevenue);
});

app.put("/revenues/:id", (req, res) => {
  const db = loadDb();
  const index = db.revenues.findIndex((r: any) => r.id === req.params.id);
  if (index !== -1) {
    db.revenues[index] = { ...db.revenues[index], ...req.body };
    saveDb(db);
    res.json(db.revenues[index]);
  } else {
    res.status(404).json({ error: "Revenue not found" });
  }
});

app.delete("/revenues/:id", (req, res) => {
  const db = loadDb();
  const index = db.revenues.findIndex((r: any) => r.id === req.params.id);
  if (index !== -1) {
    db.revenues.splice(index, 1);
    saveDb(db);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Revenue not found" });
  }
});

// EXPENSES CRUD
app.post("/expenses", (req, res) => {
  const db = loadDb();
  const newExpense = {
    id: `EXP-${2000 + db.expenses.length + 1}`,
    ...req.body,
    date: req.body.date || new Date().toISOString().split("T")[0]
  };
  db.expenses.unshift(newExpense);
  saveDb(db);
  res.json(newExpense);
});

app.put("/expenses/:id", (req, res) => {
  const db = loadDb();
  const index = db.expenses.findIndex((e: any) => e.id === req.params.id);
  if (index !== -1) {
    db.expenses[index] = { ...db.expenses[index], ...req.body };
    saveDb(db);
    res.json(db.expenses[index]);
  } else {
    res.status(404).json({ error: "Expense not found" });
  }
});

app.delete("/expenses/:id", (req, res) => {
  const db = loadDb();
  const index = db.expenses.findIndex((e: any) => e.id === req.params.id);
  if (index !== -1) {
    db.expenses.splice(index, 1);
    saveDb(db);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Expense not found" });
  }
});

// CASHBOX CRUD
app.post("/cashbox", (req, res) => {
  const db = loadDb();
  const newCash = {
    id: `CSH-${3000 + db.cashbox.length + 1}`,
    ...req.body,
    date: req.body.date || new Date().toISOString().split("T")[0]
  };
  db.cashbox.unshift(newCash);
  saveDb(db);
  res.json(newCash);
});

app.put("/cashbox/:id", (req, res) => {
  const db = loadDb();
  const index = db.cashbox.findIndex((c: any) => c.id === req.params.id);
  if (index !== -1) {
    db.cashbox[index] = { ...db.cashbox[index], ...req.body };
    saveDb(db);
    res.json(db.cashbox[index]);
  } else {
    res.status(404).json({ error: "Cash transaction not found" });
  }
});

app.delete("/cashbox/:id", (req, res) => {
  const db = loadDb();
  const index = db.cashbox.findIndex((c: any) => c.id === req.params.id);
  if (index !== -1) {
    db.cashbox.splice(index, 1);
    saveDb(db);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Cash transaction not found" });
  }
});

// INVOICES CRUD
app.post("/invoices", (req, res) => {
  const db = loadDb();
  const newInvoice = {
    id: `INV-${4000 + db.invoices.length + 1}`,
    ...req.body,
    date: req.body.date || new Date().toISOString().split("T")[0]
  };
  db.invoices.unshift(newInvoice);
  saveDb(db);
  res.json(newInvoice);
});

app.put("/invoices/:id", (req, res) => {
  const db = loadDb();
  const index = db.invoices.findIndex((i: any) => i.id === req.params.id);
  if (index !== -1) {
    db.invoices[index] = { ...db.invoices[index], ...req.body };
    saveDb(db);
    res.json(db.invoices[index]);
  } else {
    res.status(404).json({ error: "Invoice not found" });
  }
});

app.delete("/invoices/:id", (req, res) => {
  const db = loadDb();
  const index = db.invoices.findIndex((i: any) => i.id === req.params.id);
  if (index !== -1) {
    db.invoices.splice(index, 1);
    saveDb(db);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Invoice not found" });
  }
});

// PAYROLL CRUD
app.post("/payroll", (req, res) => {
  const db = loadDb();
  const newPayroll = {
    id: `PAY-${5000 + db.payroll.length + 1}`,
    ...req.body,
    date: req.body.date || new Date().toISOString().split("T")[0]
  };
  db.payroll.unshift(newPayroll);
  saveDb(db);
  res.json(newPayroll);
});

app.put("/payroll/:id", (req, res) => {
  const db = loadDb();
  const index = db.payroll.findIndex((p: any) => p.id === req.params.id);
  if (index !== -1) {
    db.payroll[index] = { ...db.payroll[index], ...req.body };
    saveDb(db);
    res.json(db.payroll[index]);
  } else {
    res.status(404).json({ error: "Payroll not found" });
  }
});

app.delete("/payroll/:id", (req, res) => {
  const db = loadDb();
  const index = db.payroll.findIndex((p: any) => p.id === req.params.id);
  if (index !== -1) {
    db.payroll.splice(index, 1);
    saveDb(db);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Payroll not found" });
  }
});

// ASSETS CRUD
app.post("/assets", (req, res) => {
  const db = loadDb();
  const newAsset = {
    id: `AST-${6000 + db.assets.length + 1}`,
    ...req.body,
    date: req.body.date || new Date().toISOString().split("T")[0]
  };
  db.assets.unshift(newAsset);
  saveDb(db);
  res.json(newAsset);
});

app.put("/assets/:id", (req, res) => {
  const db = loadDb();
  const index = db.assets.findIndex((a: any) => a.id === req.params.id);
  if (index !== -1) {
    db.assets[index] = { ...db.assets[index], ...req.body };
    saveDb(db);
    res.json(db.assets[index]);
  } else {
    res.status(404).json({ error: "Asset not found" });
  }
});

app.delete("/assets/:id", (req, res) => {
  const db = loadDb();
  const index = db.assets.findIndex((a: any) => a.id === req.params.id);
  if (index !== -1) {
    db.assets.splice(index, 1);
    saveDb(db);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Asset not found" });
  }
});

export default app;

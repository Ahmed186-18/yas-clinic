import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "db.json");

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

// Serve the clinic's custom PWA logo asset
app.get("/logo.png", (req, res) => {
  const customPath = path.join(process.cwd(), "public/images/logo.png");
  if (fs.existsSync(customPath)) {
    res.sendFile(customPath);
  } else {
    res.status(404).send("Logo not uploaded yet. Place it under public/images/logo.png");
  }
});

// GET all data
app.get("/api/all", (req, res) => {
  const db = loadDb();
  res.json(db);
});

// SYNC entire database from client (handles container recyclings)
app.post("/api/sync", (req, res) => {
  if (req.body && typeof req.body === "object") {
    saveDb(req.body);
    res.json(req.body);
  } else {
    res.status(400).json({ error: "Invalid sync database payload" });
  }
});

// Update settings
app.put("/api/settings", (req, res) => {
  const db = loadDb();
  db.settings = { ...db.settings, ...req.body };
  saveDb(db);
  res.json(db.settings);
});

// REVENUE CRUD
app.post("/api/revenues", (req, res) => {
  const db = loadDb();
  const newRevenue = {
    id: `REV-${1000 + db.revenues.length + 1}`,
    ...req.body,
    date: req.body.date || new Date().toISOString().split("T")[0]
  };
  db.revenues.unshift(newRevenue);
  // Periodically add cash transaction automatically for cash cashbox integration
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

app.put("/api/revenues/:id", (req, res) => {
  const db = loadDb();
  const index = db.revenues.findIndex((r: any) => r.id === req.params.id);
  if (index !== -1) {
    db.revenues[index] = { ...db.revenues[index], ...req.body };
    saveDb(db);
    res.json(db.revenues[index]);
  } else {
    res.status(404).json({ error: "Revision not found" });
  }
});

app.delete("/api/revenues/:id", (req, res) => {
  const db = loadDb();
  db.revenues = db.revenues.filter((r: any) => r.id !== req.params.id);
  saveDb(db);
  res.json({ success: true, id: req.params.id });
});

// EXPENSE CRUD
app.post("/api/expenses", (req, res) => {
  const db = loadDb();
  const newExpense = {
    id: `EXP-${2000 + db.expenses.length + 1}`,
    ...req.body,
    date: req.body.date || new Date().toISOString().split("T")[0]
  };
  db.expenses.unshift(newExpense);
  
  // Expenses paid in cash also automatically affect the cashbox
  const newCash = {
    id: `CSH-${3000 + db.cashbox.length + 1}`,
    type: "سحب",
    description: `صرف تلقائي مصروف: ${req.body.expenseName}`,
    amount: Number(req.body.amount),
    date: req.body.date || new Date().toISOString().split("T")[0],
    employee: "النظام المالي الموحد"
  };
  db.cashbox.unshift(newCash);

  saveDb(db);
  res.json(newExpense);
});

app.put("/api/expenses/:id", (req, res) => {
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

app.delete("/api/expenses/:id", (req, res) => {
  const db = loadDb();
  db.expenses = db.expenses.filter((e: any) => e.id !== req.params.id);
  saveDb(db);
  res.json({ success: true, id: req.params.id });
});

// CASHBOX CRUD
app.post("/api/cashbox", (req, res) => {
  const db = loadDb();
  const newCash = {
    id: `CSH-${3000 + db.cashbox.length + 1}`,
    ...req.body,
    amount: Number(req.body.amount),
    date: req.body.date || new Date().toISOString().split("T")[0]
  };
  db.cashbox.unshift(newCash);
  saveDb(db);
  res.json(newCash);
});

// INVOICES CRUD
app.post("/api/invoices", (req, res) => {
  const db = loadDb();
  const newInvoice = {
    id: `INV-${4000 + db.invoices.length + 1}`,
    ...req.body,
    invoiceDate: req.body.invoiceDate || new Date().toISOString().split("T")[0],
    dueDate: req.body.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    status: req.body.status || "معلقة"
  };
  db.invoices.unshift(newInvoice);
  saveDb(db);
  res.json(newInvoice);
});

app.put("/api/invoices/:id", (req, res) => {
  const db = loadDb();
  const index = db.invoices.findIndex((inv: any) => inv.id === req.params.id);
  if (index !== -1) {
    const oldInv = db.invoices[index];
    db.invoices[index] = { ...db.invoices[index], ...req.body };

    // If marked as paid, trigger an automatic revenue creation
    if (req.body.status === "مدفوعة" && oldInv.status !== "مدفوعة") {
      const newRev = {
        id: `REV-${1000 + db.revenues.length + 1}`,
        patientName: oldInv.patientName,
        department: oldInv.department,
        serviceType: oldInv.service,
        amount: Number(oldInv.amount),
        paymentMethod: "تحويل بنكي",
        date: new Date().toISOString().split("T")[0],
        status: "مقبول",
        notes: `إيراد تسوية تلقائي للفاتورة رقم ${oldInv.id}`
      };
      db.revenues.unshift(newRev);
    }

    saveDb(db);
    res.json(db.invoices[index]);
  } else {
    res.status(404).json({ error: "Invoice not found" });
  }
});

app.delete("/api/invoices/:id", (req, res) => {
  const db = loadDb();
  db.invoices = db.invoices.filter((inv: any) => inv.id !== req.params.id);
  saveDb(db);
  res.json({ success: true, id: req.params.id });
});

// PAYROLL CRUD
app.post("/api/payroll", (req, res) => {
  const db = loadDb();
  const baseSalary = Number(req.body.baseSalary || 0);
  const bonus = Number(req.body.bonus || 0);
  const deductions = Number(req.body.deductions || 0);
  const finalSalary = baseSalary + bonus - deductions;

  const newPayroll = {
    id: `EMP-${5000 + db.payroll.length + 1}`,
    employeeName: req.body.employeeName,
    department: req.body.department,
    baseSalary,
    bonus,
    deductions,
    finalSalary,
    paymentStatus: req.body.paymentStatus || "معلق"
  };
  db.payroll.push(newPayroll);
  saveDb(db);
  res.json(newPayroll);
});

app.put("/api/payroll/:id", (req, res) => {
  const db = loadDb();
  const index = db.payroll.findIndex((e: any) => e.id === req.params.id);
  if (index !== -1) {
    const base = Number(req.body.baseSalary ?? db.payroll[index].baseSalary);
    const bon = Number(req.body.bonus ?? db.payroll[index].bonus);
    const ded = Number(req.body.deductions ?? db.payroll[index].deductions);
    const finalSalary = base + bon - ded;

    const updated = {
      ...db.payroll[index],
      ...req.body,
      baseSalary: base,
      bonus: bon,
      deductions: ded,
      finalSalary
    };

    // If marked as Paid, also log this as an expense in 'Salaries' category automatically
    if (updated.paymentStatus === "تم الدفع" && db.payroll[index].paymentStatus !== "تم الدفع") {
      const newExp = {
        id: `EXP-${2000 + db.expenses.length + 1}`,
        expenseName: `صرف راتب الموظف: ${updated.employeeName}`,
        category: "الرواتب",
        amount: updated.finalSalary,
        date: new Date().toISOString().split("T")[0],
        notes: `دفعة راتب آلية لشهر مايو`
      };
      db.expenses.unshift(newExp);
      
      // Also record cashbox withdrawal
      const newCash = {
        id: `CSH-${3000 + db.cashbox.length + 1}`,
        type: "سحب",
        description: `سحب راتب الموظف: ${updated.employeeName}`,
        amount: updated.finalSalary,
        date: new Date().toISOString().split("T")[0],
        employee: "القسم المالي الموحد"
      };
      db.cashbox.unshift(newCash);
    }

    db.payroll[index] = updated;
    saveDb(db);
    res.json(updated);
  } else {
    res.status(404).json({ error: "Employee payroll record not found" });
  }
});

app.delete("/api/payroll/:id", (req, res) => {
  const db = loadDb();
  db.payroll = db.payroll.filter((e: any) => e.id !== req.params.id);
  saveDb(db);
  res.json({ success: true, id: req.params.id });
});

// ASSETS CRUD (إدارة الأصول الطبية وصيانتها)
app.get("/api/assets", (req, res) => {
  const db = loadDb();
  res.json(db.assets);
});

app.post("/api/assets", (req, res) => {
  const db = loadDb();
  const newAsset = {
    id: `AST-${6000 + db.assets.length + 1}`,
    assetName: req.body.assetName,
    department: req.body.department,
    location: req.body.location,
    status: req.body.status || "ممتاز",
    purchaseDate: req.body.purchaseDate || new Date().toISOString().split("T")[0],
    cost: Number(req.body.cost || 0),
    lastMaintenanceDate: req.body.lastMaintenanceDate || "",
    nextMaintenanceDate: req.body.nextMaintenanceDate || "",
    maintenanceLogs: []
  };
  db.assets.unshift(newAsset);
  saveDb(db);
  res.json(newAsset);
});

app.put("/api/assets/:id", (req, res) => {
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

app.delete("/api/assets/:id", (req, res) => {
  const db = loadDb();
  db.assets = db.assets.filter((a: any) => a.id !== req.params.id);
  saveDb(db);
  res.json({ success: true, id: req.params.id });
});

app.post("/api/assets/:id/maintenance", (req, res) => {
  const db = loadDb();
  const index = db.assets.findIndex((a: any) => a.id === req.params.id);
  if (index !== -1) {
    const asset = db.assets[index];
    const logId = `m-${Date.now()}`;
    const log = {
      id: logId,
      date: req.body.date || new Date().toISOString().split("T")[0],
      note: req.body.note || "صيانة روتينية",
      cost: Number(req.body.cost || 0),
      technician: req.body.technician || "مهندس خارجي"
    };
    
    asset.maintenanceLogs = asset.maintenanceLogs || [];
    asset.maintenanceLogs.unshift(log);
    
    // Update dates
    asset.lastMaintenanceDate = log.date;
    if (req.body.nextDate) {
      asset.nextMaintenanceDate = req.body.nextDate;
    }
    
    // Auto-create an expense under 'صيانة' (Maintenance) category
    const expense = {
      id: `EXP-${2000 + db.expenses.length + 1}`,
      expenseName: `صيانة جهاز: ${asset.assetName} - ${log.note}`,
      category: "صيانة",
      amount: log.cost,
      date: log.date,
      notes: `صيانة دورية للأجهزة الطبية بواسطة ${log.technician}`
    };
    db.expenses.unshift(expense);

    // Auto-create cash withdrawal
    const newCash = {
      id: `CSH-${3000 + db.cashbox.length + 1}`,
      type: "سحب",
      description: `تكلفة صيانة جهاز: ${asset.assetName}`,
      amount: log.cost,
      date: log.date,
      employee: "قسم الصيانة الطبية والتمريض"
    };
    db.cashbox.unshift(newCash);

    saveDb(db);
    res.json(asset);
  } else {
    res.status(404).json({ error: "Asset not found" });
  }
});


// Serve static Vite compiled files in production, use Vite middleware in dev
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT} http://localhost:3000`);
  });
}

startServer();

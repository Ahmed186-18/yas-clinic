import express from "express";
import { supabaseAdmin, initializeSettings } from "./supabaseAdmin.js";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());

// Initialize settings on startup
await initializeSettings();

// GET all data
app.get("/all", async (req, res) => {
  try {
    const [revenues, expenses, cashbox, invoices, payroll, assets, settings] = await Promise.all([
      supabaseAdmin.from("revenues").select("*").order("date", { ascending: false }),
      supabaseAdmin.from("expenses").select("*").order("date", { ascending: false }),
      supabaseAdmin.from("cashbox").select("*").order("date", { ascending: false }),
      supabaseAdmin.from("invoices").select("*").order("date", { ascending: false }),
      supabaseAdmin.from("payroll").select("*").order("date", { ascending: false }),
      supabaseAdmin.from("assets").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("settings").select("*").eq("id", "default").single(),
    ]);

    res.json({
      revenues: revenues.data || [],
      expenses: expenses.data || [],
      cashbox: cashbox.data || [],
      invoices: invoices.data || [],
      payroll: payroll.data || [],
      assets: assets.data || [],
      settings: settings.data || {},
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "فشل تحميل البيانات" });
  }
});

// SYNC entire database from client
app.post("/sync", async (req, res) => {
  try {
    if (!req.body || typeof req.body !== "object") {
      return res.status(400).json({ error: "Invalid sync payload" });
    }
    // Verification only - actual sync handled by individual endpoints
    res.json(req.body);
  } catch (error) {
    console.error("Error syncing:", error);
    res.status(500).json({ error: "فشل مزامنة البيانات" });
  }
});

// Update settings
app.put("/settings", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("settings")
      .update(req.body)
      .eq("id", "default")
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({ error: "فشل تحديث الإعدادات" });
  }
});

// REVENUE CRUD
app.post("/revenues", async (req, res) => {
  try {
    const newRevenue = {
      id: `REV-${Date.now()}`,
      ...req.body,
      date: req.body.date || new Date().toISOString().split("T")[0],
    };

    const { data, error } = await supabaseAdmin.from("revenues").insert([newRevenue]).select().single();

    if (error) throw error;

    // Auto-add cash transaction if payment method is cash
    if (req.body.payment_method === "نقدي" && req.body.amount) {
      await supabaseAdmin.from("cashbox").insert([
        {
          id: `CSH-${Date.now()}`,
          type: "إيداع",
          description: `إيراد نقدي تلقائي - ${req.body.patient_name}`,
          amount: Number(req.body.amount),
          date: newRevenue.date,
          employee: "النظام المالي الموحد",
        },
      ]);
    }

    res.json(data);
  } catch (error) {
    console.error("Error adding revenue:", error);
    res.status(500).json({ error: "فشل إضافة الإيراد" });
  }
});

app.put("/revenues/:id", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("revenues")
      .update(req.body)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "الإيراد غير موجود" });

    res.json(data);
  } catch (error) {
    console.error("Error updating revenue:", error);
    res.status(500).json({ error: "فشل تحديث الإيراد" });
  }
});

app.delete("/revenues/:id", async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from("revenues").delete().eq("id", req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting revenue:", error);
    res.status(500).json({ error: "فشل حذف الإيراد" });
  }
});

// EXPENSES CRUD
app.post("/expenses", async (req, res) => {
  try {
    const newExpense = {
      id: `EXP-${Date.now()}`,
      ...req.body,
      date: req.body.date || new Date().toISOString().split("T")[0],
    };

    const { data, error } = await supabaseAdmin.from("expenses").insert([newExpense]).select().single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Error adding expense:", error);
    res.status(500).json({ error: "فشل إضافة المصروف" });
  }
});

app.put("/expenses/:id", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("expenses")
      .update(req.body)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "المصروف غير موجود" });

    res.json(data);
  } catch (error) {
    console.error("Error updating expense:", error);
    res.status(500).json({ error: "فشل تحديث المصروف" });
  }
});

app.delete("/expenses/:id", async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from("expenses").delete().eq("id", req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ error: "فشل حذف المصروف" });
  }
});

// CASHBOX CRUD
app.post("/cashbox", async (req, res) => {
  try {
    const newCash = {
      id: `CSH-${Date.now()}`,
      ...req.body,
      date: req.body.date || new Date().toISOString().split("T")[0],
    };

    const { data, error } = await supabaseAdmin.from("cashbox").insert([newCash]).select().single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Error adding cashbox transaction:", error);
    res.status(500).json({ error: "فشل إجراء حركة الصندوق" });
  }
});

app.put("/cashbox/:id", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("cashbox")
      .update(req.body)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "المعاملة غير موجودة" });

    res.json(data);
  } catch (error) {
    console.error("Error updating cashbox:", error);
    res.status(500).json({ error: "فشل تحديث معاملة الصندوق" });
  }
});

app.delete("/cashbox/:id", async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from("cashbox").delete().eq("id", req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting cashbox:", error);
    res.status(500).json({ error: "فشل حذف معاملة الصندوق" });
  }
});

// INVOICES CRUD
app.post("/invoices", async (req, res) => {
  try {
    const newInvoice = {
      id: `INV-${Date.now()}`,
      ...req.body,
      date: req.body.date || new Date().toISOString().split("T")[0],
    };

    const { data, error } = await supabaseAdmin.from("invoices").insert([newInvoice]).select().single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Error adding invoice:", error);
    res.status(500).json({ error: "فشل إضافة الفاتورة" });
  }
});

app.put("/invoices/:id", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("invoices")
      .update(req.body)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "الفاتورة غير موجودة" });

    res.json(data);
  } catch (error) {
    console.error("Error updating invoice:", error);
    res.status(500).json({ error: "فشل تحديث الفاتورة" });
  }
});

app.delete("/invoices/:id", async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from("invoices").delete().eq("id", req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    res.status(500).json({ error: "فشل حذف الفاتورة" });
  }
});

// PAYROLL CRUD
app.post("/payroll", async (req, res) => {
  try {
    const newPayroll = {
      id: `PAY-${Date.now()}`,
      ...req.body,
      date: req.body.date || new Date().toISOString().split("T")[0],
    };

    const { data, error } = await supabaseAdmin.from("payroll").insert([newPayroll]).select().single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Error adding payroll:", error);
    res.status(500).json({ error: "فشل إضافة الراتب" });
  }
});

app.put("/payroll/:id", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("payroll")
      .update(req.body)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "سجل الراتب غير موجود" });

    res.json(data);
  } catch (error) {
    console.error("Error updating payroll:", error);
    res.status(500).json({ error: "فشل تحديث الراتب" });
  }
});

app.delete("/payroll/:id", async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from("payroll").delete().eq("id", req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting payroll:", error);
    res.status(500).json({ error: "فشل حذف الراتب" });
  }
});

// ASSETS CRUD
app.post("/assets", async (req, res) => {
  try {
    const newAsset = {
      id: `AST-${Date.now()}`,
      ...req.body,
      date: req.body.date || new Date().toISOString().split("T")[0],
    };

    const { data, error } = await supabaseAdmin.from("assets").insert([newAsset]).select().single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Error adding asset:", error);
    res.status(500).json({ error: "فشل إضافة الأصل" });
  }
});

app.put("/assets/:id", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("assets")
      .update(req.body)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "الأصل غير موجود" });

    res.json(data);
  } catch (error) {
    console.error("Error updating asset:", error);
    res.status(500).json({ error: "فشل تحديث الأصل" });
  }
});

app.delete("/assets/:id", async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from("assets").delete().eq("id", req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting asset:", error);
    res.status(500).json({ error: "فشل حذف الأصل" });
  }
});

export default app;

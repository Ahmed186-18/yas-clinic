import { useState, useEffect, useCallback } from "react";
import { DashboardData, Revenue, Expense, CashTransaction, Invoice, Payroll, ClinicalAsset, ClinicSettings } from "./types";

export function useFinanceData() {
  const [data, setData] = useState<DashboardData | null>(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("medfinance_db") : null;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.revenues && parsed.revenues.some((r: any) => r.id === "REV-1001")) {
          localStorage.removeItem("medfinance_db");
          return null;
        }
        return parsed;
      }
    } catch (e) {
      console.error("Local storage load error:", e);
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(() => {
    try {
      if (typeof window !== "undefined" && localStorage.getItem("medfinance_db")) {
        const saved = localStorage.getItem("medfinance_db");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.revenues && parsed.revenues.some((r: any) => r.id === "REV-1001")) {
            return true;
          }
        }
        return false;
      }
    } catch (e) {}
    return true;
  });
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<{ id: string; message: string; type: "success" | "error" | "warning" }[]>([]);

  const addToast = useCallback((message: string, type: "success" | "error" | "warning" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/all");
      if (!res.ok) throw new Error("فشل تحميل البيانات المالية من الخادم");
      const json = await res.json();
      setData(json);
      localStorage.setItem("medfinance_db", JSON.stringify(json));
    } catch (err: any) {
      console.error(err);
      // Only set error screen if we also don't have local cache to show
      if (!localStorage.getItem("medfinance_db")) {
        setError(err.message || "حدث خطأ غير متوقع");
        addToast("خطأ في الاتصال بالخادم الرئيسي للمركز", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeAndSync = async () => {
      try {
        const saved = localStorage.getItem("medfinance_db");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.revenues && parsed.revenues.some((r: any) => r.id === "REV-1001")) {
            localStorage.removeItem("medfinance_db");
          } else {
            setData(parsed);
            setLoading(false);
            
            // Restore state to ephemeral container
            await fetch("/api/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(parsed),
            });
          }
        }
      } catch (err) {
        console.error("Initialization sync with localStorage failed:", err);
      } finally {
        await fetchData();
      }
    };

    initializeAndSync();
  }, [addToast]);

  // REVENUES HANDLERS
  const addRevenue = async (revenue: Omit<Revenue, "id">) => {
    try {
      const res = await fetch("/api/revenues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(revenue),
      });
      if (!res.ok) throw new Error("فشل إضافة الإيراد");
      addToast("تم تسجيل الإيراد الطبي بنجاح", "success");
      await fetchData();
      return true;
    } catch (err: any) {
      addToast(err.message, "error");
      return false;
    }
  };

  const updateRevenue = async (id: string, revenue: Partial<Revenue>) => {
    try {
      const res = await fetch(`/api/revenues/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(revenue),
      });
      if (!res.ok) throw new Error("فشل تعديل الإيراد");
      addToast("تم تحديث بيانات المعاملة الإيرادية", "success");
      await fetchData();
      return true;
    } catch (err: any) {
      addToast(err.message, "error");
      return false;
    }
  };

  const deleteRevenue = async (id: string) => {
    try {
      const res = await fetch(`/api/revenues/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("فشل حذف الإيراد");
      addToast("تم حذف معاملة الإيراد من النظام بسلام", "warning");
      await fetchData();
      return true;
    } catch (err: any) {
      addToast(err.message, "error");
      return false;
    }
  };

  // EXPENSES HANDLERS
  const addExpense = async (expense: Omit<Expense, "id">) => {
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expense),
      });
      if (!res.ok) throw new Error("فشل إضافة مصروف");
      addToast("تمت جدولة وقيد المصروف وصرفه بنجاح", "success");
      await fetchData();
      return true;
    } catch (err: any) {
      addToast(err.message, "error");
      return false;
    }
  };

  const updateExpense = async (id: string, expense: Partial<Expense>) => {
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expense),
      });
      if (!res.ok) throw new Error("فشل تحديث المصروف");
      addToast("تم تعديل تفاصيل المصروف الطبي بنجاح", "success");
      await fetchData();
      return true;
    } catch (err: any) {
      addToast(err.message, "error");
      return false;
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("فشل حذف المصروف");
      addToast("تم شطب المصروف من السجل المالي", "warning");
      await fetchData();
      return true;
    } catch (err: any) {
      addToast(err.message, "error");
      return false;
    }
  };

  // CASHBOX HANDLERS
  const addCashboxTransaction = async (tx: Omit<CashTransaction, "id">) => {
    try {
      const res = await fetch("/api/cashbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tx),
      });
      if (!res.ok) throw new Error("فشل إجراء حركة الصندوق");
      addToast("تم تقييد حركة الصندوق النقدي فثواني", "success");
      await fetchData();
      return true;
    } catch (err: any) {
      addToast(err.message, "error");
      return false;
    }
  };

  // INVOICES HANDLERS
  const addInvoice = async (invoice: Omit<Invoice, "id">) => {
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoice),
      });
      if (!res.ok) throw new Error("فشل توليد الفاتورة الطبية");
      addToast("تم إنشاء الفاتورة الطبية للمريض بنجاح", "success");
      await fetchData();
      return true;
    } catch (err: any) {
      addToast(err.message, "error");
      return false;
    }
  };

  const updateInvoice = async (id: string, invoice: Partial<Invoice>) => {
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoice),
      });
      if (!res.ok) throw new Error("فشل تحديث الفاتورة");
      addToast("تم حفظ التعديلات على الفاتورة", "success");
      await fetchData();
      return true;
    } catch (err: any) {
      addToast(err.message, "error");
      return false;
    }
  };

  const deleteInvoice = async (id: string) => {
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("فشل إتلاف الفاتورة");
      addToast("تم حذف الفاتورة الطبية نهائياً", "warning");
      await fetchData();
      return true;
    } catch (err: any) {
      addToast(err.message, "error");
      return false;
    }
  };

  // PAYROLL HANDLERS
  const addPayroll = async (payroll: Omit<Payroll, "id">) => {
    try {
      const res = await fetch("/api/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payroll),
      });
      if (!res.ok) throw new Error("فشل تقييد عقد الموظف والراتب");
      addToast("تم تسجيل سجل رواتب الموظف بنجاح", "success");
      await fetchData();
      return true;
    } catch (err: any) {
      addToast(err.message, "error");
      return false;
    }
  };

  const updatePayroll = async (id: string, payroll: Partial<Payroll>) => {
    try {
      const res = await fetch(`/api/payroll/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payroll),
      });
      if (!res.ok) throw new Error("فشل تحديث بيانات الرواتب");
      addToast("تم تحديث راتب الموظف/معالجة الصرف بنجاح", "success");
      await fetchData();
      return true;
    } catch (err: any) {
      addToast(err.message, "error");
      return false;
    }
  };

  const deletePayroll = async (id: string) => {
    try {
      const res = await fetch(`/api/payroll/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("فشل حذف الموظف");
      addToast("تم شطب ملف راتب الموظف", "warning");
      await fetchData();
      return true;
    } catch (err: any) {
      addToast(err.message, "error");
      return false;
    }
  };

  // ASSETS HANDLERS
  const addAsset = async (asset: Omit<ClinicalAsset, "id" | "maintenanceLogs">) => {
    try {
      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(asset),
      });
      if (!res.ok) throw new Error("فشل تسجيل الأصل الطبي");
      addToast("تمت إضافة الجهاز الطبي الجديد إلى الأصول", "success");
      await fetchData();
      return true;
    } catch (err: any) {
      addToast(err.message, "error");
      return false;
    }
  };

  const updateAsset = async (id: string, asset: Partial<ClinicalAsset>) => {
    try {
      const res = await fetch(`/api/assets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(asset),
      });
      if (!res.ok) throw new Error("فشل تعديل الأصل");
      addToast("تم تحديث بيانات وموقع الجهاز الطبي", "success");
      await fetchData();
      return true;
    } catch (err: any) {
      addToast(err.message, "error");
      return false;
    }
  };

  const deleteAsset = async (id: string) => {
    try {
      const res = await fetch(`/api/assets/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("فشل شطب الأصل");
      addToast("تم شطب الجهاز الطبي من الأصول الفعّالة", "warning");
      await fetchData();
      return true;
    } catch (err: any) {
      addToast(err.message, "error");
      return false;
    }
  };

  const recordAssetMaintenance = async (id: string, maintenance: { date: string; note: string; cost: number; technician: string; nextDate?: string }) => {
    try {
      const res = await fetch(`/api/assets/${id}/maintenance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(maintenance),
      });
      if (!res.ok) throw new Error("فشل تقييد عملية الصيانة");
      addToast("تم قيد الصيانة، وإدراج التكلفة في المصروفات", "success");
      await fetchData();
      return true;
    } catch (err: any) {
      addToast(err.message, "error");
      return false;
    }
  };

  // SETTINGS HANDLERS
  const updateSettings = async (settings: Partial<ClinicSettings>) => {
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("فشل تحديث الإعدادات");
      addToast("تم حفظ الإعدادات بنجاح", "success");
      await fetchData();
      return true;
    } catch (err: any) {
      addToast(err.message, "error");
      return false;
    }
  };

  return {
    data,
    loading,
    error,
    toasts,
    addToast,
    // CRUD Handlers
    addRevenue,
    updateRevenue,
    deleteRevenue,
    addExpense,
    updateExpense,
    deleteExpense,
    addCashboxTransaction,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    addPayroll,
    updatePayroll,
    deletePayroll,
    addAsset,
    updateAsset,
    deleteAsset,
    recordAssetMaintenance,
    updateSettings,
    refresh: fetchData,
  };
}

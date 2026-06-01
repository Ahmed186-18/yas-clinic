import React, { useState } from "react";
import { Expense, ClinicSettings } from "../types";
import { Plus, Search, Edit2, Trash2, X, AlertTriangle, Filter, DollarSign, Calendar, TrendingUp, FileSpreadsheet } from "lucide-react";
import { exportToExcel } from "../utils";

interface Props {
  expenses: Expense[];
  settings: ClinicSettings;
  onAdd: (exp: Omit<Expense, "id">) => Promise<boolean>;
  onEdit: (id: string, exp: Partial<Expense>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

export default function ExpensesSection({ expenses, settings, onAdd, onEdit, onDelete }: Props) {
  const currency = settings?.currency || "₪";

  // Categories list per guidelines
  const categories = [
    "الرواتب",
    "مستلزمات طبية",
    "أجهزة",
    "صيانة",
    "كهرباء",
    "مياه",
    "إنترنت",
    "مصاريف إدارية",
    "أخرى"
  ];

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Expense | null>(null);

  // Form Fields State
  const [expenseName, setExpenseName] = useState("");
  const [category, setCategory] = useState("مستلزمات طبية");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  // Filtering
  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch = 
      e.expenseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.notes || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCat = selectedCategory === "all" || e.category === selectedCategory;

    return matchesSearch && matchesCat;
  });

  // Analytics for Summary Blocks
  const totalExpensesSum = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Current Month calculation
  const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const monthlyExpensesSum = expenses
    .filter((e) => e.date.startsWith(currentMonth))
    .reduce((sum, e) => sum + e.amount, 0);

  // Largest category calculation
  const categoryTotals: { [key: string]: number } = {};
  expenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });

  let largestCategory = "لا توجد مصروفات";
  let largestAmount = 0;
  Object.entries(categoryTotals).forEach(([cat, val]) => {
    if (val > largestAmount) {
      largestAmount = val;
      largestCategory = cat;
    }
  });

  // Handlers
  const handleOpenAdd = () => {
    setEditingItem(null);
    setExpenseName("");
    setCategory("مستلزمات طبية");
    setAmount("");
    setDate(new Date().toISOString().split("T")[0]);
    setNotes("");
    setShowModal(true);
  };

  const handleOpenEdit = (item: Expense) => {
    setEditingItem(item);
    setExpenseName(item.expenseName);
    setCategory(item.category);
    setAmount(item.amount.toString());
    setDate(item.date);
    setNotes(item.notes);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseName || !amount || !date) return;

    const payload = {
      expenseName,
      category,
      amount: Number(amount),
      date,
      notes,
    };

    let success = false;
    if (editingItem) {
      success = await onEdit(editingItem.id, payload);
    } else {
      success = await onAdd(payload);
    }

    if (success) {
      setShowModal(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("تحذير: هل أنت متأكد من حذف هذا المصروف؟ هذه العملية غير قابلة للتراجع.")) {
      await onDelete(id);
    }
  };

  const handleExportExcel = () => {
    const headers = [
      "رقم المصروف",
      "البند / البيان",
      "الفئة / التصنيف",
      "المبلغ",
      "التاريخ",
      "الملاحظات"
    ];
    const exportData = filteredExpenses.map((e) => [
      e.id,
      e.expenseName,
      e.category,
      e.amount,
      e.date,
      e.notes || ""
    ]);
    exportToExcel(exportData, headers, "سجل_المصاريف_التشغيلية");
  };

  return (
    <div className="space-y-6">
      {/* Header and Add Button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">إدارة وترشيد المصاريف التشغيلية</h2>
          <p className="text-xs text-slate-500">مراقبة المصروفات، فواتير الخدمات الرواتب ومشتريات الأجهزة الطبية</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={handleExportExcel}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2"
          >
            <FileSpreadsheet size={16} />
            تصدير Excel
          </button>
          <button 
            onClick={handleOpenAdd}
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2"
          >
            <Plus size={16} />
            تسجيل فاتورة مصروف جديدة
          </button>
        </div>
      </div>

      {/* Analytics widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-rose-100 dark:border-slate-700 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400">إجمالي المصروفات التاريخي</p>
            <p className="text-xl font-black text-rose-600 mt-1">{totalExpensesSum.toLocaleString()} {currency}</p>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-900/40 text-rose-600 rounded-xl">
            <DollarSign size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-rose-100 dark:border-slate-700 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400">مصروفات الشهر الحالي (مايو)</p>
            <p className="text-xl font-black text-slate-800 dark:text-white mt-1">{monthlyExpensesSum.toLocaleString()} {currency}</p>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-700/50 text-slate-500 rounded-xl">
            <Calendar size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-rose-100 dark:border-slate-700 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400">أكبر باب منصرفات</p>
            <p className="text-base font-black text-rose-700 dark:text-rose-400 mt-1 truncate">{largestCategory}</p>
            <p className="text-[10px] text-slate-400 font-bold">بقمية: {largestAmount.toLocaleString()} {currency}</p>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-900/40 text-rose-700 rounded-xl">
            <TrendingUp size={20} />
          </div>
        </div>
      </div>

      {/* Advanced Filter and Search */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search Box */}
          <div className="relative">
            <span className="absolute inset-y-0 right-3 flex items-center text-slate-400">
              <Search size={16} />
            </span>
            <input 
              type="text" 
              placeholder="ابحث باسم المصروف، البيانات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pr-10 pl-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 whitespace-nowrap">حسب فئة المصروف:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full text-xs px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
            >
              <option value="all">كل أبواب المصروفات</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Expenses Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-400 font-bold text-xs border-b border-slate-100 dark:border-slate-700">
              <tr>
                <th className="p-4">رقم المصون</th>
                <th className="p-4">اسم المصروف ووصف الفاتورة</th>
                <th className="p-4">الفئة وباب الصرف</th>
                <th className="p-4">القيمة الإجمالية</th>
                <th className="p-4">تاريخ الصرف</th>
                <th className="p-4">ملاحظات تسليم الدفعة</th>
                <th className="p-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                    لم يتقيد أي مصاريف مطابقة للخرائط المبحوثة بعد.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="p-4 font-mono text-xs text-slate-400 font-bold">{exp.id}</td>
                    <td className="p-4 font-bold text-slate-800 dark:text-slate-100">{exp.expenseName}</td>
                    <td className="p-4 text-xs font-semibold">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 dark:bg-rose-950/40">
                        {exp.category}
                      </span>
                    </td>
                    <td className="p-4 font-black text-rose-600 dark:text-rose-400">{exp.amount.toLocaleString()} {currency}</td>
                    <td className="p-4 text-xs text-slate-400 font-medium">{exp.date}</td>
                    <td className="p-4 text-xs text-slate-500 dark:text-slate-400">{exp.notes || <span className="text-slate-300">-</span>}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleOpenEdit(exp)}
                          className="p-1 px-2 text-[11px] text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/20 rounded-lg flex items-center gap-1 transition-all"
                        >
                          <Edit2 size={11} />
                          تعديل
                        </button>
                        <button 
                          onClick={() => handleDelete(exp.id)}
                          className="p-1 px-2 text-[11px] text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg flex items-center gap-1 transition-all"
                        >
                          <Trash2 size={11} />
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-xl border border-slate-100 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <span className="font-bold text-slate-800 dark:text-white text-sm">
                {editingItem ? "تعديل تفاصيل المصروف" : "تسجيل عملية مصروفات جديدة"}
              </span>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">اسم بيان المصروف (توضيحي)</label>
                <input 
                  type="text" 
                  required
                  placeholder="اشتراك الإنترنت السنوي للعيادة / كشف المعمل"
                  value={expenseName}
                  onChange={(e) => setExpenseName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">الفئة والتبويب المالي</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-white"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">قيمة المصروف الكلية ({currency})</label>
                  <input 
                    type="number" 
                    required
                    placeholder="2500"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">تاريخ القيد المالي والفوترة</label>
                <input 
                  type="date" 
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 focus:outline-none text-slate-800 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">بيانات تسوية إضافية / المورد والمسؤول</label>
                <textarea 
                  placeholder="شركة التوريد الطبي السريع - فاتورة رقم 84293"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 focus:outline-none text-slate-800 dark:text-white"
                ></textarea>
              </div>

              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-[10px] text-rose-700 dark:text-rose-400 rounded-xl flex items-start gap-2 border border-rose-100 dark:border-rose-900/40">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span>ملاحظة: حفظ أي مصروف هنا سيؤدي تلقائياً إلى خصمه وسحب قيمته المكافئة من السيولة النقدية المتوفرة بصندوق الخزينة لإظهار جرد دقيق.</span>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl transition-all"
                >
                  تراجع وإلغاء
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-xs"
                >
                  {editingItem ? "تحديث التعديلات" : "صرف وتدوين المصروف"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

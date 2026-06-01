import React, { useState } from "react";
import { Revenue, ClinicSettings } from "../types";
import { Search, Filter, Calendar, Edit2, Trash2, Plus, Download, X, Tag, DollarSign, Wallet, CreditCard, Shield, FileSpreadsheet } from "lucide-react";
import { exportToExcel } from "../utils";

interface Props {
  revenues: Revenue[];
  settings: ClinicSettings;
  onAdd: (rev: Omit<Revenue, "id">) => Promise<boolean>;
  onEdit: (id: string, rev: Partial<Revenue>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

export default function RevenuesSection({ revenues, settings, onAdd, onEdit, onDelete }: Props) {
  const currency = settings?.currency || "₪";
  
  // States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedMethod, setSelectedMethod] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Revenue | null>(null);

  // Form Fields State
  const [patientName, setPatientName] = useState("");
  const [department, setDepartment] = useState("قسم الطوارئ");
  const [serviceType, setServiceType] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("بطاقة ائتمان");
  const [status, setStatus] = useState("مقبول");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  // Get departments
  const departments = [
    "قسم الطوارئ",
    "قسم الأطفال",
    "قسم الأسنان",
    "قسم العيون",
    "قسم العظام",
    "قسم القلب",
    "قسم الأشعة",
    "قسم المختبر",
    "قسم النساء والولادة"
  ];

  // Filtering logic
  const filteredRevenues = revenues.filter((r) => {
    const matchesSearch = 
      r.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.serviceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.id.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesDept = selectedDept === "all" || r.department === selectedDept;
    const matchesMethod = selectedMethod === "all" || r.paymentMethod === selectedMethod;
    const matchesStatus = selectedStatus === "all" || r.status === selectedStatus;
    
    let matchesDate = true;
    if (startDate) {
      matchesDate = matchesDate && r.date >= startDate;
    }
    if (endDate) {
      matchesDate = matchesDate && r.date <= endDate;
    }

    return matchesSearch && matchesDept && matchesMethod && matchesStatus && matchesDate;
  });

  // KPI Calculations
  const todayStr = new Date().toISOString().split("T")[0];
  const todayRevenue = revenues
    .filter((r) => r.date === todayStr)
    .reduce((sum, r) => sum + r.amount, 0);

  // Weekly KPI (past 7 days)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weeklyRevenue = revenues
    .filter((r) => r.date >= oneWeekAgo.toISOString().split("T")[0])
    .reduce((sum, r) => sum + r.amount, 0);

  // Monthly KPI
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const monthlyRevenue = revenues
    .filter((r) => r.date.startsWith(currentMonth))
    .reduce((sum, r) => sum + r.amount, 0);

  // Handlers
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setPatientName("");
    setDepartment("قسم الطوارئ");
    setServiceType("");
    setAmount("");
    setPaymentMethod("بطاقة ائتمان");
    setStatus("مقبول");
    setDate(new Date().toISOString().split("T")[0]);
    setNotes("");
    setShowModal(true);
  };

  const handleOpenEditModal = (item: Revenue) => {
    setEditingItem(item);
    setPatientName(item.patientName);
    setDepartment(item.department);
    setServiceType(item.serviceType);
    setAmount(item.amount.toString());
    setPaymentMethod(item.paymentMethod);
    setStatus(item.status);
    setDate(item.date);
    setNotes(item.notes);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !serviceType || !amount) return;

    const payload = {
      patientName,
      department,
      serviceType,
      amount: Number(amount),
      paymentMethod,
      date,
      status,
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
    if (window.confirm("هل أنت متأكد من شطب وحذف معاملة الإيراد الطبي هذه؟")) {
      await onDelete(id);
    }
  };

  const handleExportExcel = () => {
    const headers = [
      "رقم العملية",
      "اسم المريض / المصدر",
      "القسم المالي",
      "نوع الخدمة الطبية",
      "المبلغ",
      "طريقة الدفع",
      "التاريخ",
      "الحالة",
      "البيان / ملاحظات"
    ];
    const exportData = filteredRevenues.map((r) => [
      r.id,
      r.patientName,
      r.department,
      r.serviceType,
      r.amount,
      r.paymentMethod,
      r.date,
      r.status,
      r.notes || ""
    ]);
    exportToExcel(exportData, headers, "سجل_الايرادات_والمقبوظات_الطبية");
  };

  return (
    <div className="space-y-6">
      {/* Visual Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">إدارة الإيرادات والمقبوضات الطبية</h2>
          <p className="text-xs text-slate-500">مراقبة وتسجيل فوري لجميع إيرادات الأقسام والصناديق التابعة</p>
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
            onClick={handleOpenAddModal}
            className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2"
          >
            <Plus size={16} />
            تسجيل إيراد طبي جديد
          </button>
        </div>
      </div>

      {/* Summary KPI Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-teal-50 dark:border-slate-700 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400">إيرادات اليوم النقديّة</p>
            <p className="text-xl font-black text-teal-600 mt-1">{todayRevenue.toLocaleString()} {currency}</p>
          </div>
          <div className="p-3 bg-teal-50 dark:bg-teal-900/40 text-teal-600 rounded-xl">
            <Calendar size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-teal-50 dark:border-slate-700 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400">مجموع المقبوضات الأسبوعية</p>
            <p className="text-xl font-black text-slate-800 dark:text-white mt-1">{weeklyRevenue.toLocaleString()} {currency}</p>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-700/50 text-slate-500 rounded-xl">
            <DollarSign size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-teal-50 dark:border-slate-700 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400">الإيراد التراكمي للشهر الحالي</p>
            <p className="text-xl font-black text-teal-700 dark:text-teal-400 mt-1">{monthlyRevenue.toLocaleString()} {currency}</p>
          </div>
          <div className="p-3 bg-teal-50 dark:bg-teal-900/40 text-teal-700 rounded-xl">
            <Wallet size={20} />
          </div>
        </div>
      </div>

      {/* Advanced Filter Box */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search Box */}
          <div className="relative">
            <span className="absolute inset-y-0 right-3 flex items-center text-slate-400">
              <Search size={16} />
            </span>
            <input 
              type="text" 
              placeholder="ابحث باسم المريض، رقم المعاملة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pr-10 pl-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full text-xs px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">جميع الأقسام والعيادات</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Payment Method */}
          <div>
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="w-full text-xs px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">كل طرق الدفع</option>
              <option value="نقدي">نقدي</option>
              <option value="بطاقة ائتمان">بطاقة ائتمان (شبكة)</option>
              <option value="تحويل بنكي">تحويل بنكي مباشر</option>
              <option value="تأمين طبي">تأمين طبي (بالمطالبة)</option>
            </select>
          </div>

          {/* Status Select */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-xs px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">كل الحالات المعاملات</option>
              <option value="مقبول">مقبولة ومثبتة</option>
              <option value="معلق">قيد الانتظار / المراجعة</option>
            </select>
          </div>
        </div>

        {/* Date Ranges */}
        <div className="flex flex-wrap items-center gap-4 pt-1 border-t border-slate-50 dark:border-slate-700/50 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>من تاريخ:</span>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-700 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <span>إلى تاريخ:</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-700 dark:text-white"
            />
          </div>
          {(startDate || endDate || searchTerm || selectedDept !== "all" || selectedMethod !== "all" || selectedStatus !== "all") && (
            <button 
              onClick={() => {
                setSearchTerm("");
                setSelectedDept("all");
                setSelectedMethod("all");
                setSelectedStatus("all");
                setStartDate("");
                setEndDate("");
              }}
              className="text-xs text-rose-500 font-semibold hover:underline"
            >
              تصفير الفلاتر
            </button>
          )}
        </div>
      </div>

      {/* Main Revenues Data Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
          <span className="text-xs font-bold text-slate-500">تصفية المعاملات المقبولة: {filteredRevenues.length} سجل مالي</span>
          <span className="text-xs text-slate-400">ترتيب تنازلي تنازجياً حسب الأحدث قيداً</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-400 font-bold text-xs border-b border-slate-100 dark:border-slate-700">
              <tr>
                <th className="p-4">رقم الحركة</th>
                <th className="p-4">اسم المريض</th>
                <th className="p-4">القسم الطبي</th>
                <th className="p-4">مسمى الخدمة الطبية</th>
                <th className="p-4">المبلغ</th>
                <th className="p-4">طريقة الدفع</th>
                <th className="p-4">تاريخ المعاملة</th>
                <th className="p-4">الحالة</th>
                <th className="p-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredRevenues.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 text-xs">
                    لا تتوفر أي إيرادات تطابق معايير ومحددات البحث المعينة حالياً.
                  </td>
                </tr>
              ) : (
                filteredRevenues.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="p-4 font-mono font-bold text-xs text-slate-400">{r.id}</td>
                    <td className="p-4 font-bold text-slate-800 dark:text-slate-100">{r.patientName}</td>
                    <td className="p-4 text-xs font-semibold text-slate-700 dark:text-slate-300">{r.department}</td>
                    <td className="p-4 text-xs text-slate-500 dark:text-slate-400">{r.serviceType}</td>
                    <td className="p-4 font-extrabold text-teal-600 dark:text-teal-400">{r.amount.toLocaleString()} {currency}</td>
                    <td className="p-4 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        {r.paymentMethod === "نقدي" && <Wallet size={12} className="text-amber-500" />}
                        {r.paymentMethod === "بطاقة ائتمان" && <CreditCard size={12} className="text-indigo-500" />}
                        {r.paymentMethod === "تأمين طبي" && <Shield size={12} className="text-teal-500" />}
                        <span>{r.paymentMethod}</span>
                      </div>
                    </td>
                    <td className="p-4 text-xs text-slate-400 font-medium">{r.date}</td>
                    <td className="p-4 text-xs">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${r.status === "مقبول" ? "bg-teal-50 text-teal-700 dark:bg-teal-950/40" : "bg-amber-50 text-amber-700 dark:bg-amber-950/40"}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleOpenEditModal(r)}
                          className="p-1 px-2 text-[11px] text-teal-600 hover:bg-teal-50 rounded-lg flex items-center gap-1 transition-all"
                        >
                          <Edit2 size={11} />
                          تعديل
                        </button>
                        <button 
                          onClick={() => handleDelete(r.id)}
                          className="p-1 px-2 text-[11px] text-rose-500 hover:bg-rose-50 rounded-lg flex items-center gap-1 transition-all"
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

      {/* Add / Edit Revenue Dynamic Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-xl border border-slate-100 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <span className="font-bold text-slate-800 dark:text-white text-sm">
                {editingItem ? "تعديل تفاصيل الإيراد الطبي" : "تسجيل إيراد مالي جديد"}
              </span>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">اسم المريض المستفيد</label>
                <input 
                  type="text" 
                  required
                  placeholder="محمد أحمد عبدالله"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">العيادة / القسم</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-white"
                  >
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">الخدمة الطبية المقدمة</label>
                  <input 
                    type="text" 
                    required
                    placeholder="فحص روتيني / أشعة"
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">تكلفة الخدمة ({currency})</label>
                  <input 
                    type="number" 
                    required
                    placeholder="500"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">طريقة الدفع والقيد</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-white"
                  >
                    <option value="نقدي">نقدي (توصيل مباشر للخزينة)</option>
                    <option value="بطاقة ائتمان">بطاقة ائتمان (شبكة مدى/فيزا)</option>
                    <option value="تحويل بنكي">تحويل بنكي</option>
                    <option value="تأمين طبي">تأمين طبي</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">تاريخ القبول اليوم</label>
                  <input 
                    type="date" 
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">حالة الدفع</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-white"
                  >
                    <option value="مقبول">مقبولة ومحررة (مدفوعة)</option>
                    <option value="معلق">معلقة بالمراجعة</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">ملاحظات تسوية المعاملة</label>
                <textarea 
                  placeholder="بيانات التأمين أو أوراق التحويل بالبنك التوضيحية..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-white"
                ></textarea>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl transition-all"
                >
                  إلغاء التراجع
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-xs"
                >
                  {editingItem ? "تأكيد واستبدال البيانات" : "قيد وحفظ الإيراد"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

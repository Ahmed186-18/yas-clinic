import React, { useState } from "react";
import { Invoice, ClinicSettings } from "../types";
import { Plus, Search, CheckCircle2, Clock, ShieldAlert, Edit2, Trash2, Printer, Download, Eye, X, Receipt, FileSpreadsheet } from "lucide-react";
import { exportToExcel } from "../utils";

interface Props {
  invoices: Invoice[];
  settings: ClinicSettings;
  onAdd: (inv: Omit<Invoice, "id">) => Promise<boolean>;
  onEdit: (id: string, inv: Partial<Invoice>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onMarkAsPaid: (id: string) => Promise<boolean>;
}

export default function InvoicesSection({ invoices, settings, onAdd, onEdit, onDelete, onMarkAsPaid }: Props) {
  const currency = settings?.currency || "₪";
  const taxRate = settings?.taxRate || 15;

  // Search filter
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Invoice | null>(null);
  
  // Printable view receipt modal
  const [printableInvoice, setPrintableInvoice] = useState<Invoice | null>(null);

  // Form Fields State
  const [patientName, setPatientName] = useState("");
  const [department, setDepartment] = useState("قسم الطوارئ");
  const [service, setService] = useState("");
  const [amount, setAmount] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("معلقة");

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

  // Filters
  const filteredInvoices = invoices.filter((i) => {
    const matchesSearch = 
      i.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      i.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.service.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatus === "all" || i.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  // KPI calculations
  const totalInvoicesCount = invoices.length;
  const paidInvoicesCount = invoices.filter((i) => i.status === "مدفوعة").length;
  const pendingInvoicesCount = invoices.filter((i) => i.status === "معلقة").length;
  const overdueInvoicesCount = invoices.filter((i) => i.status === "متأخرة").length;

  const totalInvoicesSum = invoices.reduce((sum, i) => sum + i.amount, 0);
  const paidInvoicesSum = invoices.filter((i) => i.status === "مدفوعة").reduce((sum, i) => sum + i.amount, 0);

  // Handlers
  const handleOpenAdd = () => {
    setEditingItem(null);
    setPatientName("");
    setDepartment("قسم الطوارئ");
    setService("");
    setAmount("");
    setInvoiceDate(new Date().toISOString().split("T")[0]);
    // Set due date to 30 days of standard credit terms
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setDueDate(d.toISOString().split("T")[0]);
    setStatus("معلقة");
    setShowModal(true);
  };

  const handleOpenEdit = (item: Invoice) => {
    setEditingItem(item);
    setPatientName(item.patientName);
    setDepartment(item.department);
    setService(item.service);
    setAmount(item.amount.toString());
    setInvoiceDate(item.invoiceDate);
    setDueDate(item.dueDate);
    setStatus(item.status);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !service || !amount) return;

    const payload = {
      patientName,
      department,
      service,
      amount: Number(amount),
      invoiceDate,
      dueDate,
      status,
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
    if (window.confirm("هل ترغب في شطب وإتلاف سجل هذه الفاتورة الطبية؟")) {
      await onDelete(id);
    }
  };

  const handlePaymentSettle = async (id: string) => {
    if (window.confirm("تأكيد تسوية قيمة الفاتورة نقداً/شبكة بالحقوق المكتسبة لمصلحة المركز؟")) {
      await onMarkAsPaid(id);
    }
  };

  const handleExportExcel = () => {
    const headers = [
      "رقم العملية / الفاتورة",
      "اسم المريض",
      "القسم الطبي",
      "الخدمة / الإجراء المالي",
      "قيمة الفاتورة الأساسية",
      "قيمة الضريبة",
      "المجموع شامل الضريبة",
      "حالة الفاتورة",
      "تاريخ الإرساء",
      "تاريخ الاستحقاق"
    ];
    const exportData = filteredInvoices.map((i) => {
      const taxAmount = Math.round(i.amount * (taxRate / 100));
      const totalAndTax = i.amount + taxAmount;
      return [
        i.id,
        i.patientName,
        i.department,
        i.service,
        i.amount,
        taxAmount,
        totalAndTax,
        i.status,
        i.invoiceDate,
        i.dueDate
      ];
    });
    exportToExcel(exportData, headers, "سجل_الفواتير_الطبية_للمرضى");
  };

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">إصدار وإدارة الفواتير الطبية للمرضى</h2>
          <p className="text-xs text-slate-500 font-medium">متابعة الفواتير المحصلة والمعلقة للتأمين والمواطنين</p>
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
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2"
          >
            <Plus size={16} />
            توليد فاتورة طبية جديدة
          </button>
        </div>
      </div>

      {/* Summary Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Invoices Count */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 rounded-xl flex items-center justify-center">
            <Receipt size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400">إجمالي الفواتير الصادرة</p>
            <p className="text-lg font-black text-slate-800 dark:text-white">{totalInvoicesCount} فاتورة</p>
            <p className="text-[10px] text-slate-400">إجمالي: {totalInvoicesSum.toLocaleString()} {currency}</p>
          </div>
        </div>

        {/* Paid Invoices Count */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-50 dark:bg-teal-900/40 text-teal-600 rounded-xl flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400">الفواتير المدفوعة بنجاح</p>
            <p className="text-lg font-black text-teal-600">{paidInvoicesCount} مسددة</p>
            <p className="text-[10px] text-slate-400">محصل: {paidInvoicesSum.toLocaleString()} {currency}</p>
          </div>
        </div>

        {/* Pending Invoices Count */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/40 text-amber-600 rounded-xl flex items-center justify-center">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400">فواتير معلّقة للإستحقاق</p>
            <p className="text-lg font-black text-slate-800 dark:text-white">{pendingInvoicesCount} مطلوبة</p>
            <p className="text-[10px] text-slate-400">تحت المراجعة والتحصيل</p>
          </div>
        </div>

        {/* Overdue Invoices Count */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/40 text-rose-500 rounded-xl flex items-center justify-center">
            <ShieldAlert size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400">فواتير متأخرة الإستلام</p>
            <p className="text-lg font-black text-rose-600">{overdueInvoicesCount} متأخرة</p>
            <p className="text-[10px] text-rose-400">تجاوزت تاريخ الإستحقاق</p>
          </div>
        </div>
      </div>

      {/* Simple Search bar and Filter status block */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-sm">
          <span className="absolute inset-y-0 right-3 flex items-center text-slate-400">
            <Search size={16} />
          </span>
          <input 
            type="text" 
            placeholder="ابحث باسم المريض أو الخدمة الطبية..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pr-10 pl-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 w-full md:w-auto">
          <span>تحديد حالة السداد الفوري:</span>
          <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-xl text-xs w-full md:w-auto">
            <button 
              onClick={() => setSelectedStatus("all")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${selectedStatus === "all" ? "bg-white dark:bg-slate-600 text-indigo-700 dark:text-white shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
            >
              الكل
            </button>
            <button 
              onClick={() => setSelectedStatus("مدفوعة")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${selectedStatus === "مدفوعة" ? "bg-white dark:bg-slate-600 text-teal-600 dark:text-white shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
            >
              مدفوعة
            </button>
            <button 
              onClick={() => setSelectedStatus("معلقة")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${selectedStatus === "معلقة" ? "bg-white dark:bg-slate-600 text-amber-600 dark:text-white shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
            >
              معلقة
            </button>
            <button 
              onClick={() => setSelectedStatus("متأخرة")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${selectedStatus === "متأخرة" ? "bg-white dark:bg-slate-600 text-rose-600 dark:text-white shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
            >
              متأخرة
            </button>
          </div>
        </div>
      </div>

      {/* Main Invoices Table Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 text-slate-400 font-bold text-xs">
              <tr>
                <th className="p-4">رقم الفاتورة</th>
                <th className="p-4">اسم المريض</th>
                <th className="p-4">القسم الطبي</th>
                <th className="p-4">الخدمة الطبية</th>
                <th className="p-4">المبلغ الأصلي</th>
                <th className="p-4">تاريخ الفاتورة</th>
                <th className="p-4">تاريخ الاستحقاق</th>
                <th className="p-4">حالة الفاتورة</th>
                <th className="p-4 text-center">خدمات وإجراءات سريعة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 text-xs">
                    لا تتوفر أي سجل لفاتورة مطابقة لملفات البحث الحالية.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="p-4 font-mono font-bold text-xs text-slate-400">{inv.id}</td>
                    <td className="p-4 font-bold text-slate-800 dark:text-slate-100">{inv.patientName}</td>
                    <td className="p-4 text-xs font-semibold text-slate-700 dark:text-slate-300">{inv.department}</td>
                    <td className="p-4 text-xs text-slate-500 dark:text-slate-400">{inv.service}</td>
                    <td className="p-4 font-extrabold text-indigo-600 dark:text-indigo-400">{(inv.amount).toLocaleString()} {currency}</td>
                    <td className="p-4 text-xs text-slate-400 font-medium">{inv.invoiceDate}</td>
                    <td className="p-4 text-xs font-medium text-slate-400">{inv.dueDate}</td>
                    <td className="p-4 text-xs">
                      <span className={`px-2 py-1 rounded-md text-[9px] font-bold ${inv.status === "مدفوعة" ? "bg-teal-50 text-teal-700 dark:bg-teal-950/40" : inv.status === "معلقة" ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40" : "bg-rose-50 text-rose-700 dark:bg-rose-955/40"}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        {inv.status !== "مدفوعة" && (
                          <button 
                            onClick={() => handlePaymentSettle(inv.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2 py-1 rounded-lg transition-all"
                          >
                            تسجيل التحصيل
                          </button>
                        )}
                        <button 
                          onClick={() => setPrintableInvoice(inv)}
                          className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-lg transition-all"
                          title="عرض الفاتورة بالتفصيل وطباعتها"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          onClick={() => handleOpenEdit(inv)}
                          className="p-1 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/20 rounded-lg transition-all"
                          title="تعديل"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button 
                          onClick={() => handleDelete(inv.id)}
                          className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-all"
                          title="حذف"
                        >
                          <Trash2 size={12} />
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

      {/* Invoice Generator/Modifier Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-xl border border-slate-100 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <span className="font-bold text-slate-800 dark:text-white text-sm">
                {editingItem ? "تعديل تفاصيل الفاتورة" : "إصدار وتوليد فاتورة طبية"}
              </span>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">اسم المريض الكامل</label>
                <input 
                  type="text" 
                  required
                  placeholder="مريم ممدوح الحربي"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 focus:outline-[#0D9488] text-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">القسم والعيادة المختصة</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 font-semibold focus:outline-none"
                  >
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">تفصيل المعاينة / الإجراء الطبي</label>
                  <input 
                    type="text" 
                    required
                    placeholder="عملية إزالة الساد بالليزر"
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 focus:outline-[#0D9488] text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">التكلفة (قبل احتساب ضريبة القيمة المضافة)</label>
                  <input 
                    type="number" 
                    required
                    placeholder="5200"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 focus:outline-[#0D9488] text-slate-800 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">حالة الفوترة المؤقتة</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 focus:outline-none"
                  >
                    <option value="معلقة">معلقة بانتظار السداد / شركات التأمين</option>
                    <option value="مدفوعة">تم السداد بالكامل</option>
                    <option value="متأخرة">متجاوزة لتاريخ الاستحقاق (متأخرة)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">تاريخ الفاتورة</label>
                  <input 
                    type="date" 
                    required
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">تاريخ استحقاق المطالبة</label>
                  <input 
                    type="date" 
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="text-[10px] text-indigo-700 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 p-2.5 rounded-lg">
                📝 ملاحظة: سيضاف معدل ضريبة القيمة المضافة السائدة بقيمة <strong className="font-extrabold">{taxRate}٪</strong> تلقائياً على واجهة الطباعة والتحصيل وتدقيق الحساب للمريض.
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl transition-all"
                >
                  تراجع
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-xs"
                >
                  {editingItem ? "حفظ التغييرات الفنية" : "إصدار الفاتورة وتثبيتها"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Receipt Preview Modal */}
      {printableInvoice && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Action Bar */}
            <div className="p-3 bg-slate-100 border-b border-slate-200 flex justify-between items-center text-slate-800">
              <span className="font-bold text-xs flex items-center gap-1.5">
                <Receipt className="text-teal-600" size={16} />
                معاينة الفاتورة الضريبية المبسطة
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => window.print()}
                  className="bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1"
                >
                  <Printer size={12} />
                  طباعة الإيصال
                </button>
                <button 
                  onClick={() => setPrintableInvoice(null)}
                  className="p-1 hover:bg-slate-200 rounded-lg text-slate-500"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Receipt template to print */}
            <div className="p-8 text-slate-800 space-y-6" id="printable-receipt-content" dir="rtl">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 bg-teal-600 rounded-full mx-auto flex items-center justify-center text-white font-extrabold text-xl shadow-md">
                  M
                </div>
                <h4 className="font-bold text-lg text-slate-900">{settings?.clinicName}</h4>
                <p className="text-[10px] text-slate-400 font-medium">{settings?.address}</p>
                <p className="text-[10px] text-slate-400 font-medium">الرقم الضريبي للمنشأة: #390210023400003</p>
              </div>

              <hr className="border-dashed border-slate-200" />

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">رقم الفاتورة:</span>
                  <span className="font-mono font-bold text-slate-800">{printableInvoice.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">تاريخ الإصدار:</span>
                  <span className="text-slate-700 font-medium">{printableInvoice.invoiceDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">اسم المريض:</span>
                  <span className="font-bold text-slate-900">{printableInvoice.patientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">القسم/العيادة الطبية:</span>
                  <span className="text-slate-700 font-semibold">{printableInvoice.department}</span>
                </div>
              </div>

              <hr className="border-slate-200" />

              {/* Items */}
              <div className="space-y-2 text-xs">
                <p className="font-bold text-slate-900 mb-2 bg-slate-50 p-1.5 rounded-md text-center">الخدمة والرسوم الضريبية</p>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-800">{printableInvoice.service}</p>
                    <p className="text-[9px] text-slate-400">إجراء واستشارة متطورة</p>
                  </div>
                  <span className="font-bold text-slate-900">{(printableInvoice.amount).toLocaleString()} {currency}</span>
                </div>
              </div>

              <hr className="border-dashed border-slate-200" />

              {/* Total calculations */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>المبلغ الفرعي:</span>
                  <span>{(printableInvoice.amount).toLocaleString()} {currency}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>ضريبة القيمة المضافة ({taxRate}٪):</span>
                  <span>{(printableInvoice.amount * taxRate / 100).toLocaleString()} {currency}</span>
                </div>
                <div className="flex justify-between font-black text-slate-900 text-sm bg-slate-100 p-2 rounded-lg">
                  <span>المبلغ الإجمالي المطلق:</span>
                  <span>{(printableInvoice.amount * (1 + taxRate / 100)).toLocaleString()} {currency}</span>
                </div>
              </div>

              <div className="text-center pt-4 space-y-1 text-[9px] text-slate-400 font-medium">
                <p className="text-teal-600 font-bold">شكراً لثقتكم برعايتنا الطبية المتخصصة.</p>
                <p>تم استصدار هذه الفاتورة الموحدة إلكترونياً وتخضع للرقابة المالية للمركز.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

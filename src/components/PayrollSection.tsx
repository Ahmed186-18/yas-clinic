import React, { useState } from "react";
import { Payroll, ClinicSettings } from "../types";
import { Users, DollarSign, CheckCircle2, Clock, Plus, Search, Edit2, Trash2, Heart, RefreshCw, X, FileSpreadsheet } from "lucide-react";
import { exportToExcel } from "../utils";

interface Props {
  payroll: Payroll[];
  settings: ClinicSettings;
  onAdd: (pay: Omit<Payroll, "id">) => Promise<boolean>;
  onEdit: (id: string, pay: Partial<Payroll>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onPaySalary: (id: string) => Promise<boolean>;
}

export default function PayrollSection({ payroll, settings, onAdd, onEdit, onDelete, onPaySalary }: Props) {
  const currency = settings?.currency || "₪";

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Payroll | null>(null);

  // Form Fields State
  const [employeeName, setEmployeeName] = useState("");
  const [department, setDepartment] = useState("قسم الطوارئ");
  const [baseSalary, setBaseSalary] = useState("");
  const [bonus, setBonus] = useState("");
  const [deductions, setDeductions] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("معلق");

  const departments = [
    "القسم المالي والإداري",
    "قسم الهندسة الطبية والصيانة",
    "قسم الطوارئ",
    "قسم الأطفال",
    "قسم القلب",
    "قسم الأشعة",
    "قسم المختبر",
    "قسم التمريض"
  ];

  // Filtering
  const filteredPayroll = payroll.filter((p) => {
    const matchesSearch = 
      p.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = selectedDept === "all" || p.department === selectedDept;
    const matchesStatus = selectedStatus === "all" || p.paymentStatus === selectedStatus;

    return matchesSearch && matchesDept && matchesStatus;
  });

  // Payroll Metrics
  const totalEmployeesCount = payroll.length;
  const totalPayrollCost = payroll.reduce((sum, p) => sum + p.finalSalary, 0);
  const paidPayrollCost = payroll.filter((p) => p.paymentStatus === "تم الدفع").reduce((sum, p) => sum + p.finalSalary, 0);
  const pendingPayrollCost = payroll.filter((p) => p.paymentStatus === "معلق").reduce((sum, p) => sum + p.finalSalary, 0);

  // Department-wise payroll cost distribution
  const deptCosts: { [key: string]: number } = {};
  payroll.forEach((p) => {
    deptCosts[p.department] = (deptCosts[p.department] || 0) + p.finalSalary;
  });

  // Handlers
  const handleOpenAdd = () => {
    setEditingItem(null);
    setEmployeeName("");
    setDepartment("قسم الطوارئ");
    setBaseSalary("");
    setBonus("0");
    setDeductions("0");
    setPaymentStatus("معلق");
    setShowModal(true);
  };

  const handleOpenEdit = (item: Payroll) => {
    setEditingItem(item);
    setEmployeeName(item.employeeName);
    setDepartment(item.department);
    setBaseSalary(item.baseSalary.toString());
    setBonus(item.bonus.toString());
    setDeductions(item.deductions.toString());
    setPaymentStatus(item.paymentStatus);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeName || !baseSalary) return;

    const payload = {
      employeeName,
      department,
      baseSalary: Number(baseSalary),
      bonus: Number(bonus || 0),
      deductions: Number(deductions || 0),
      finalSalary: Number(baseSalary) + Number(bonus || 0) - Number(deductions || 0),
      paymentStatus: paymentStatus as "تم الدفع" | "معلق",
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
    if (window.confirm("هل ترغب في إزالة قيد هذا الموظف وصرف الرواتب التابع له؟")) {
      await onDelete(id);
    }
  };

  const handleProcessSalary = async (id: string) => {
    if (window.confirm("هل ترغب في صرف راتب هذا الموظف رسمياً وسحب القيمة الإجمالية من الكاش؟")) {
      await onPaySalary(id);
    }
  };

  const handleExportExcel = () => {
    const headers = [
      "رقم العملية",
      "اسم الموظف",
      "القسم المالي / الإداري",
      "الراتب الأساسي",
      "الحوافز والبدلات",
      "الخصومات والمستقطعات",
      "الراتب الصافي",
      "حالة الصرف"
    ];
    const exportData = filteredPayroll.map((p) => [
      p.id,
      p.employeeName,
      p.department,
      p.baseSalary,
      p.bonus,
      p.deductions,
      p.finalSalary,
      p.paymentStatus
    ]);
    exportToExcel(exportData, headers, "جدول_مسيرات_الرواتب_الطبية");
  };

  return (
    <div className="space-y-6">
      {/* Title section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">جدولة مسيرات الرواتب وأجور الطاقم الطبي</h2>
          <p className="text-xs text-slate-500 font-medium">مراقبة الأجور الأساسية والبدلات والصرف اللامركزي للرواتب للكوادر الإدارية والتمريضية</p>
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
            إدراج الموظف في مسيرات الرواتب
          </button>
        </div>
      </div>

      {/* KPI statistics cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Employees */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 rounded-xl flex items-center justify-center">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400">إجمالي الكادر والوظائف</p>
            <p className="text-lg font-black text-slate-800 dark:text-white">{totalEmployeesCount} موظفاً</p>
            <p className="text-[10px] text-slate-400">طاقم المركز الطبي</p>
          </div>
        </div>

        {/* Total Payroll Cost */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/40 text-rose-500 rounded-xl flex items-center justify-center">
            <DollarSign size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400">كتلة الأجور والمستحقات المجدولة</p>
            <p className="text-lg font-black text-rose-600">{totalPayrollCost.toLocaleString()} {currency}</p>
            <p className="text-[10px] text-slate-400">الرواتب الأساسية والبدلات</p>
          </div>
        </div>

        {/* Paid Salaries */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-50 dark:bg-teal-900/40 text-teal-600 rounded-xl flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400">الرواتب المصروفة بنجاح</p>
            <p className="text-lg font-black text-teal-600">{paidPayrollCost.toLocaleString()} {currency}</p>
            <p className="text-[10px] text-slate-400">مجموع الرواتب المحولة</p>
          </div>
        </div>

        {/* Pending Salaries */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/40 text-amber-600 rounded-xl flex items-center justify-center">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400">رواتب بانتظار الاعتماد والصرف</p>
            <p className="text-lg font-black text-slate-800 dark:text-white">{pendingPayrollCost.toLocaleString()} {currency}</p>
            <p className="text-[10px] text-slate-400">مسيرات قيد الانتظار</p>
          </div>
        </div>
      </div>

      {/* Advanced charts and filters row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Department Costs distributions */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 h-64 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-sm mb-4">توزع تكلفة الرواتب والأجور حسب الإدارات الطبية</h3>
            
            <div className="space-y-2">
              {Object.keys(deptCosts).length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">لا توجد بيانات رواتب لعرضها حالياً</p>
              ) : (
                Object.entries(deptCosts).slice(0, 3).map(([dept, total]) => {
                  const percentage = Math.max(10, Math.min(100, (total / Math.max(1, totalPayrollCost)) * 100));
                  return (
                    <div key={dept} className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300 font-bold">
                        <span>{dept}</span>
                        <span>{total.toLocaleString()} {currency} ({Math.round(percentage)}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full" style={{ width: `${percentage}%` }}></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">ملاحظة: تقتطع قيم التأمينات الاجتماعية والخصومات من الراتب الإجمالي تلقائياً قبل التحويل المصرفي.</span>
        </div>

        {/* Right: Search / Filters Panel */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-white text-sm">البحث والتصفية السريعة</h3>
          
          <div className="space-y-3">
            <div className="relative">
              <span className="absolute inset-y-0 right-3 flex items-center text-slate-400">
                <Search size={14} />
              </span>
              <input 
                type="text" 
                placeholder="ابحث باسم الموظف، المسمى الرقمي..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs pr-10 pl-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-[#0D9488]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400">فلتر حسب الإدارة/العيادة:</label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full text-xs px-2 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
              >
                <option value="all">كل الأقسام</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400">حالة الصرف والمسيرات:</label>
              <div className="flex gap-2">
                <button 
                  onClick={() => setSelectedStatus("all")}
                  className={`flex-1 py-1 text-[9px] font-bold rounded-md ${selectedStatus === "all" ? "bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-white" : "bg-slate-50 dark:bg-slate-900 text-slate-500"}`}
                >
                  الكل
                </button>
                <button 
                  onClick={() => setSelectedStatus("تم الدفع")}
                  className={`flex-1 py-1 text-[9px] font-bold rounded-md ${selectedStatus === "تم الدفع" ? "bg-teal-50 text-teal-700 dark:bg-teal-900/40" : "bg-slate-50 dark:bg-slate-900 text-slate-500"}`}
                >
                  تم الدفع
                </button>
                <button 
                  onClick={() => setSelectedStatus("معلق")}
                  className={`flex-1 py-1 text-[9px] font-bold rounded-md ${selectedStatus === "معلق" ? "bg-amber-50 text-amber-700 dark:bg-amber-900/45" : "bg-slate-50 dark:bg-slate-900 text-slate-500"}`}
                >
                  تحت الانتظار
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Employee Payroll Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-400 font-bold text-xs border-b border-slate-100 dark:border-slate-700 animate-in">
              <tr>
                <th className="p-4">الرقم التعريفي</th>
                <th className="p-4">اسم الموظف</th>
                <th className="p-4">القسم والعيادة</th>
                <th className="p-4">الراتب الأساسي</th>
                <th className="p-4">الحوافز والبدلات (+)</th>
                <th className="p-4">الخصومات والتأمين (-)</th>
                <th className="p-4">الراتب الإجمالي المنصرف</th>
                <th className="p-4">حالة الصرف والمسيرات</th>
                <th className="p-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredPayroll.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 text-xs">
                    لا تتوفر أي سجلات رواتب وموظفين تطابق الفلاتر النشطة حالياً.
                  </td>
                </tr>
              ) : (
                filteredPayroll.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="p-4 font-mono text-xs font-bold text-slate-400">{p.id}</td>
                    <td className="p-4 font-bold text-slate-800 dark:text-slate-100">{p.employeeName}</td>
                    <td className="p-4 text-xs font-bold text-slate-500">{p.department}</td>
                    <td className="p-4 font-medium text-slate-600 dark:text-slate-300">{p.baseSalary.toLocaleString()} {currency}</td>
                    <td className="p-4 text-emerald-600 font-bold text-xs">+{p.bonus.toLocaleString()} {currency}</td>
                    <td className="p-4 text-rose-500 font-bold text-xs">-{p.deductions.toLocaleString()} {currency}</td>
                    <td className="p-4 font-black text-indigo-600 dark:text-indigo-400">{p.finalSalary.toLocaleString()} {currency}</td>
                    <td className="p-4 text-xs">
                      <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold ${p.paymentStatus === "تم الدفع" ? "bg-teal-50 text-teal-700 dark:bg-teal-950/40" : "bg-amber-50 text-amber-700 dark:bg-amber-950/40"}`}>
                        {p.paymentStatus}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {p.paymentStatus === "معلق" && (
                          <button 
                            onClick={() => handleProcessSalary(p.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2 py-1.5 rounded-lg transition-all"
                          >
                            صرف الراتب المالي
                          </button>
                        )}
                        <button 
                          onClick={() => handleOpenEdit(p)}
                          className="p-1 px-2 text-[10px] text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/20 rounded-lg flex items-center gap-1 transition-all"
                        >
                          <Edit2 size={10} />
                          تعديل
                        </button>
                        <button 
                          onClick={() => handleDelete(p.id)}
                          className="p-1 px-2 text-[10px] text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg flex items-center gap-1 transition-all"
                        >
                          <Trash2 size={10} />
                          حذف الموظف
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

      {/* Employee payroll Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-xl border border-slate-100 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <span className="font-bold text-slate-800 dark:text-white text-sm">
                {editingItem ? "تعديل مستحقات الموظف المالي بالتفصيل" : "تسجيل موظف وقيد مسيرة الراتب"}
              </span>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">اسم الموظف أو الطبيب الكامل</label>
                <input 
                  type="text" 
                  required
                  placeholder="د. فهد عبدالعزيز آل سعود"
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">القسم والملاك الوظيفي</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50"
                  >
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">الراتب الأساسي المعتمد ({currency})</label>
                  <input 
                    type="number" 
                    required
                    placeholder="12000"
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">الحوافز والبدلات (+) ({currency})</label>
                  <input 
                    type="number" 
                    placeholder="500"
                    value={bonus}
                    onChange={(e) => setBonus(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">الخصومات والتأمينات (-) ({currency})</label>
                  <input 
                    type="number" 
                    placeholder="150"
                    value={deductions}
                    onChange={(e) => setDeductions(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">حالة الدفع للأجور</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 text-slate-800"
                >
                  <option value="معلق">قيد المعالجة (معلق)</option>
                  <option value="تم الدفع">تم صرف الراتب وتحويله</option>
                </select>
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
                  {editingItem ? "حفظ وتثبيت" : "إدراج مسند الراتب"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

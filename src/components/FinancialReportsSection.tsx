import React, { useState } from "react";
import { Revenue, Expense, ClinicalAsset, ClinicSettings, Payroll } from "../types";
import { TrendingUp, AlertTriangle, Printer, Download, Eye, FileText, ChevronLeft, Plus, Calendar, Coins, ShieldCheck, DownloadCloud } from "lucide-react";
import { exportToExcel } from "../utils";

interface Props {
  revenues: Revenue[];
  expenses: Expense[];
  payroll: Payroll[];
  assets: ClinicalAsset[];
  settings: ClinicSettings;
}

export default function FinancialReportsSection({ revenues, expenses, payroll, assets, settings }: Props) {
  const currency = settings?.currency || "₪";
  const [reportMonth, setReportMonth] = useState("all");
  const [reportYear, setReportYear] = useState("2026");

  // Sums
  const totalRevenues = revenues.reduce((sum, r) => sum + r.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  
  // Payroll expenses
  const totalPayroll = payroll.reduce((sum, p) => sum + p.finalSalary, 0);
  const totalAssetsCost = assets.reduce((sum, a) => sum + a.cost, 0);

  // Profit/Loss
  const totalOutflows = totalExpenses + totalPayroll;
  const netProfit = totalRevenues - totalOutflows;
  const profitMarginPercent = totalRevenues > 0 ? (netProfit / totalRevenues) * 100 : 0;
  
  // Month string calculations
  const months = [
    { label: "يناير (01)", value: "-01-" },
    { label: "فبراير (02)", value: "-02-" },
    { label: "مارس (03)", value: "-03-" },
    { label: "أبريل (04)", value: "-04-" },
    { label: "مايو (05)", value: "-05-" },
    { label: "يونيو (06)", value: "-06-" },
    { label: "يوليو (07)", value: "-07-" },
    { label: "أغسطس (08)", value: "-08-" },
    { label: "سبتمبر (09)", value: "-09-" },
    { label: "أكتوبر (10)", value: "-10-" },
    { label: "نوفمبر (11)", value: "-11-" },
    { label: "ديسمبر (12)", value: "-12-" }
  ];

  // Filtering reports based on selection
  const filteredRevenues = revenues.filter((r) => {
    const matchesYear = r.date.startsWith(reportYear);
    const matchesMonth = reportMonth === "all" || r.date.includes(reportMonth);
    return matchesYear && matchesMonth;
  });

  const filteredExpenses = expenses.filter((e) => {
    const matchesYear = e.date.startsWith(reportYear);
    const matchesMonth = reportMonth === "all" || e.date.includes(reportMonth);
    return matchesYear && matchesMonth;
  });

  const sectionRevenuesSum = filteredRevenues.reduce((sum, r) => sum + r.amount, 0);
  const sectionExpensesSum = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const sectionNetProfit = sectionRevenuesSum - sectionExpensesSum;

  // Department wise breakdown
  const deptRevenues: { [key: string]: number } = {};
  filteredRevenues.forEach((r) => {
    deptRevenues[r.department] = (deptRevenues[r.department] || 0) + r.amount;
  });

  // Expense categories breakdown
  const catExpenses: { [key: string]: number } = {};
  filteredExpenses.forEach((e) => {
    catExpenses[e.category] = (catExpenses[e.category] || 0) + e.amount;
  });

  // Export CSV triggers
  const handleExportCSV = () => {
    const headers = ["الرقم التعريفي", "النوع", "البيان/المريض", "القسم أو التصنيف", "المبلغ الكلي", "التاريخ والتقييد"];
    const rows = [
      ...filteredRevenues.map((r) => [r.id, "إيراد مريض", r.patientName, r.department, r.amount, r.date]),
      ...filteredExpenses.map((e) => [e.id, "مصروف تشغيلي", e.expenseName, e.category, e.amount, e.date])
    ];

    exportToExcel(rows, headers, `تقرير_كلينيك_المالي_${reportYear}_${reportMonth}`);
  };

  return (
    <div className="space-y-6">
      {/* Title page */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white font-sans">التقارير المالية والتحليلات السنوية</h2>
          <p className="text-xs text-slate-500 font-medium">عرض فوري لهوامش الرابحين، ومراجعة التدفقات النقدية الصادرة والواردة للأقسام</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExportCSV}
            className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2"
          >
            <DownloadCloud size={16} />
            تصدير التقرير الحالي (تنسيق Excel)
          </button>
          <button 
            onClick={() => window.print()}
            className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2"
          >
            <Printer size={16} />
            طباعة نموذج الميزانية العمومية
          </button>
        </div>
      </div>

      {/* Selector box for dynamic reporting period */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-wrap gap-4 items-center">
        <span className="text-xs font-black text-slate-400">فترة المعاينة والتقوير:</span>
        
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">العام المالي:</span>
          <select 
            value={reportYear} 
            onChange={(e) => setReportYear(e.target.value)}
            className="text-xs px-2 py-1.5 border border-slate-200 rounded-lg bg-slate-50"
          >
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">الشهر المستهدف:</span>
          <select
            value={reportMonth}
            onChange={(e) => setReportMonth(e.target.value)}
            className="text-xs px-2 py-1.5 border border-slate-200 rounded-lg bg-slate-50"
          >
            <option value="all">كل شهور السنة المالية</option>
            {months.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Visual reporting grid summary metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col justify-between h-24">
          <span className="text-[10px] font-bold text-slate-400">الإيرادات في هذه الفترة</span>
          <p className="text-xl font-black text-teal-600">{sectionRevenuesSum.toLocaleString()} {currency}</p>
          <span className="text-[10px] text-slate-400">مجموع المقبوضات المسددة</span>
        </div>

        {/* Metric 2 */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col justify-between h-24">
          <span className="text-[10px] font-bold text-slate-400">المصروفات في هذه الفترة</span>
          <p className="text-xl font-black text-rose-500">{sectionExpensesSum.toLocaleString()} {currency}</p>
          <span className="text-[10px] text-slate-400">مشتريات تشغيل وصيانة</span>
        </div>

        {/* Metric 3 */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col justify-between h-24">
          <span className="text-[10px] font-bold text-slate-400">صافي هوامش الأرباح</span>
          <p className={`text-xl font-black ${sectionNetProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            {sectionNetProfit.toLocaleString()} {currency}
          </p>
          <span className="text-[10px] text-slate-400">عائد الفروقات المباشرة</span>
        </div>

        {/* Metric 4 */}
        <div className="bg-indigo-900 text-white p-4 rounded-xl flex flex-col justify-between h-24 relative overflow-hidden shadow-xs">
          <span className="text-[10px] font-bold text-indigo-200">الربحية الإجمالية للمركز</span>
          <p className="text-xl font-black">{profitMarginPercent.toFixed(1)}%</p>
          <span className="text-[10px] text-indigo-300">نسبة الربح من المقبوضات</span>
          <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
        </div>
      </div>

      {/* Visual charts block representing breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left widget: Detailed Revenues by department */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs flex flex-col">
          <h3 className="font-bold text-slate-800 dark:text-white text-sm mb-4">كفاءة الأقسام الطبية من حيث الإيراد ومساهمتها</h3>
          
          <div className="space-y-4 flex-1">
            {Object.keys(deptRevenues).length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">لا تتوفر أي حركات إيرادات في فترة المطابقة المحددة.</p>
            ) : (
              Object.entries(deptRevenues).map(([dept, amount]) => {
                const percentage = Math.max(5, (amount / Math.max(1, sectionRevenuesSum)) * 100);
                return (
                  <div key={dept} className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-700 dark:text-slate-300 font-bold">
                      <span>{dept}</span>
                      <span>{amount.toLocaleString()} {currency} ({Math.round(percentage)}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div className="bg-teal-600 h-full rounded-full" style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right widget: Expense Breakdown */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs flex flex-col">
          <h3 className="font-bold text-slate-800 dark:text-white text-sm mb-4">توزع المصروفات التشغيلية حسب الفئات</h3>

          <div className="space-y-4 flex-1">
            {Object.keys(catExpenses).length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">لا توجد مصاريف مسجلة في فترة المطابقة المحددة حالياً.</p>
            ) : (
              Object.entries(catExpenses).map(([cat, amount]) => {
                const percentage = Math.max(5, (amount / Math.max(1, sectionExpensesSum)) * 100);
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-700 dark:text-slate-300 font-bold">
                      <span>{cat}</span>
                      <span>{amount.toLocaleString()} {currency} ({Math.round(percentage)}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div className="bg-rose-500 h-full rounded-full" style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Asset values audit summary panel */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div>
            <span className="text-[10px] text-indigo-400 font-extrabold tracking-wider uppercase">تقرير تقييم استثمارات الأصول والأجهزة</span>
            <h4 className="text-lg font-bold mt-1 text-slate-100">إجمالي الموجودات الطبية للمنشأة</h4>
            <p className="text-xs text-slate-400 mt-1">القيم التراكمية لشراء أجهزة الأشعة التوليدية والمساير الصقلية المعقمة لتقارير الجرد المالي القانوني.</p>
          </div>

          <div className="text-center font-mono py-2 bg-slate-800/40 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 font-bold">القيمة الشرائية الكلية</span>
            <p className="text-2xl font-extrabold text-teal-400 mt-1">{totalAssetsCost.toLocaleString()} {currency}</p>
          </div>

          <div className="text-center font-mono py-2 bg-slate-800/40 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 font-bold">مخصصات الرواتب السنوية المتوقعة</span>
            <p className="text-2xl font-extrabold text-indigo-400 mt-1">{(totalPayroll * 12).toLocaleString()} {currency}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { DashboardData } from "../types";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Activity, 
  Briefcase, 
  ShieldAlert,
  Server,
  Wrench
} from "lucide-react";

interface Props {
  data: DashboardData;
  onNavigate: (section: string) => void;
  onDepositClick: () => void;
  onWithdrawClick: () => void;
}

export default function OverviewSection({ data, onNavigate, onDepositClick, onWithdrawClick }: Props) {
  const { revenues = [], expenses = [], cashbox = [], invoices = [], payroll = [], assets = [], settings } = data;
  const currency = settings?.currency || "₪";

  // Calculate high-level financial stats
  const totalRevenue = revenues.reduce((sum, r) => sum + r.amount, 0);
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - totalExpense;

  // Cashbox integration calculations
  const openingBalance = 0; // Set to 0 to align with fresh starting ledger requirement
  const cashIn = cashbox.filter((c) => c.type === "إيداع").reduce((sum, c) => sum + c.amount, 0);
  const cashOut = cashbox.filter((c) => c.type === "سحب").reduce((sum, c) => sum + c.amount, 0);
  const currentCash = openingBalance + cashIn - cashOut;

  // Check if there are any financial movements (revenues, expenses, or cash transactions)
  const hasMovements = revenues.length > 0 || expenses.length > 0 || cashbox.length > 0;

  // Unpaid invoices
  const unpaidInvoicesAmount = invoices
    .filter((inv) => inv.status !== "مدفوعة")
    .reduce((sum, inv) => sum + inv.amount, 0);
  
  // Pending salary cost
  const monthlyPayrollCost = payroll.reduce((sum, p) => sum + p.finalSalary, 0);
  const pendingPayrollCost = payroll
    .filter((p) => p.paymentStatus === "معلق")
    .reduce((sum, p) => sum + p.finalSalary, 0);

  // Department-wise Revenue data
  const deptRevenues: { [key: string]: number } = {};
  revenues.forEach((r) => {
    deptRevenues[r.department] = (deptRevenues[r.department] || 0) + r.amount;
  });

  // Category-wise Expense data
  const categoryExpenses: { [key: string]: number } = {};
  expenses.forEach((e) => {
    categoryExpenses[e.category] = (categoryExpenses[e.category] || 0) + e.amount;
  });

  // Calculate alerts
  const lowCashAlert = currentCash < (settings?.alertLowCash || 5000);
  const overdueInvoicesCount = invoices.filter((i) => i.status === "متأخرة").length;
  const pendingSalariesCount = payroll.filter((p) => p.paymentStatus === "معلق").length;
  const activeUnpaidInvoicesCount = invoices.filter((i) => i.status === "معلقة").length;
  const brokenAssetsCount = assets.filter((a) => a.status === "يحتاج صيانة" || a.status === "خارج الخدمة").length;

  // Active sub-tab in Recent Activities
  const [activeTab, setActiveTab] = useState<"rev" | "exp" | "cash">("rev");

  return (
    <div className="space-y-6">
      {/* 4 Block Metric Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Revenues KPI Block */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-xs border border-teal-100 dark:border-slate-700 transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">إجمالي الإيرادات الطبية</span>
            <div className="p-2.5 bg-teal-50 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400 rounded-xl">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-800 dark:text-white">{totalRevenue.toLocaleString()}</span>
            <span className="text-xs font-semibold text-slate-400">{currency}</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[10px] text-teal-600 font-bold bg-teal-50 dark:bg-teal-900/40 self-start px-2 py-0.5 rounded-full w-fit">
            <span>+12.5% هذا الشهر</span>
          </div>
        </div>

        {/* Total Expenses KPI Block */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-xs border border-rose-100 dark:border-slate-700 transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">إجمالي المصروفات والتشغيل</span>
            <div className="p-2.5 bg-rose-50 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 rounded-xl">
              <TrendingDown size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-800 dark:text-white">{totalExpense.toLocaleString()}</span>
            <span className="text-xs font-semibold text-slate-400">{currency}</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[10px] text-rose-500 font-bold bg-rose-50 dark:bg-rose-900/40 self-start px-2 py-0.5 rounded-full w-fit">
            <span>تشمل الرواتب والمشتريات</span>
          </div>
        </div>

        {/* Net Profit KPI Block */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-xs border border-emerald-100 dark:border-slate-700 transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">صافي الأرباح التشغيلية</span>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl font-black ${netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600"}`}>
              {netProfit.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-slate-400">{currency}</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-900/40 self-start px-2 py-0.5 rounded-full w-fit">
            <span>أداء مالي متزن وممتاز</span>
          </div>
        </div>

        {/* Current Cash reserves in Cashbox */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-xs border border-teal-100 dark:border-slate-700 transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">رصيد الخزينة المباشر</span>
            <div className="p-2.5 bg-amber-50 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 rounded-xl">
              <Activity size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl font-black ${currentCash < 0 ? "text-rose-600" : "text-slate-800 dark:text-white"}`}>
              {currentCash.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-slate-400">{currency}</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[10px] text-amber-600 font-bold bg-amber-50 dark:bg-amber-900/40 self-start px-2 py-0.5 rounded-full w-fit">
            <span>{lowCashAlert ? "⚠️ رصيد منخفض!" : "نقدية جرد الخزينة اليومية"}</span>
          </div>
        </div>
      </div>

      {/* 2 Additional Micro KPI Blocks for deeper financial context */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-amber-50/50 dark:bg-slate-800/50 border border-amber-200/60 p-4 rounded-xl flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-600 text-white rounded-lg flex items-center justify-center">
              <CreditCard size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">فواتير مستحقّة معلّقة</p>
              <p className="text-lg font-black text-slate-800 dark:text-white">
                {unpaidInvoicesAmount.toLocaleString()} {currency}
              </p>
            </div>
          </div>
          <button 
            onClick={() => onNavigate("invoices")} 
            className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-white hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg transition-all"
          >
            استعراض الفواتير
          </button>
        </div>

        <div className="bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/60 p-4 rounded-xl flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-lg flex items-center justify-center">
              <Briefcase size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">كتلة الرواتب والأجور الشهرية</p>
              <p className="text-lg font-black text-slate-800 dark:text-white">
                {monthlyPayrollCost.toLocaleString()} {currency}
              </p>
            </div>
          </div>
          <button 
            onClick={() => onNavigate("payroll")} 
            className="text-xs font-bold text-indigo-700 dark:text-indigo-400 bg-white hover:bg-indigo-50 border border-slate-200 px-3 py-1.5 rounded-lg transition-all"
          >
            إدارة مسيرات الرواتب
          </button>
        </div>
      </div>

      {/* Charts & Interactive Statistics Visualizers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dynamic comparative dashboard chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">مقارنة الإيرادات بالمصاريف التشغيلية</h3>
              <p className="text-xs text-slate-400">تحليل ربع سنوي وقيم النسب</p>
            </div>
            <div className="flex gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600 block"></span>
                <span className="text-slate-500 dark:text-slate-400">الإيرادات ({totalRevenue.toLocaleString()})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 block"></span>
                <span className="text-slate-500 dark:text-slate-400">المصاريف ({totalExpense.toLocaleString()})</span>
              </div>
            </div>
          </div>

          {/* Handcrafted, Responsive pure SVG comparative bar graph */}
          {!hasMovements ? (
            <div className="h-44 flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-slate-700/80 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 p-4 text-center">
              <p className="text-xs text-slate-400 font-bold max-w-xs leading-relaxed">
                لا تتوفر حركات مالية مسجلة لعرض مخطط المقارنة المالي. يرجى تسجيل إيرادات أو مصروفات أولاً.
              </p>
            </div>
          ) : (
            <div className="h-44 flex items-end justify-between px-4 pb-2 border-b border-slate-100 dark:border-slate-700">
              <div className="flex flex-col items-center w-12 gap-1 group">
                <div className="w-full flex justify-center items-end gap-1 h-32">
                  <div className="w-4 bg-teal-600 rounded-t-xs" style={{ height: "65%" }} title="إيرادات مارس"></div>
                  <div className="w-4 bg-rose-500 rounded-t-xs" style={{ height: "45%" }} title="مصاريف مارس"></div>
                </div>
                <span className="text-[10px] text-slate-400 font-bold">مارس</span>
              </div>

              <div className="flex flex-col items-center w-12 gap-1 group">
                <div className="w-full flex justify-center items-end gap-1 h-32">
                  <div className="w-4 bg-teal-600 rounded-t-xs" style={{ height: "80%" }} title="إيرادات أبريل"></div>
                  <div className="w-4 bg-rose-500 rounded-t-xs" style={{ height: "55%" }} title="مصاريف أبريل"></div>
                </div>
                <span className="text-[10px] text-slate-400 font-bold">أبريل</span>
              </div>

              <div className="flex flex-col items-center w-12 gap-1 group">
                <div className="w-full flex justify-center items-end gap-1 h-32">
                  {/* Dynamically calculate height for May */}
                  <div className="w-4 bg-teal-600 rounded-t-xs" style={{ height: "95%" }} title="إيرادات مايو الحالية"></div>
                  <div className="w-4 bg-rose-500 rounded-t-xs" style={{ height: `${Math.min(95, Math.max(15, (totalExpense / Math.max(1, totalRevenue)) * 95))}%` }} title="مصاريف مايو الحالية"></div>
                </div>
                <span className="text-[10px] text-teal-600 font-bold">مايو (الحالي)</span>
              </div>

              <div className="flex flex-col items-center w-12 gap-1 group">
                <div className="w-full flex justify-center items-end gap-1 h-32">
                  <div className="w-4 bg-teal-600/50 rounded-t-xs" style={{ height: "70%" }} title="المتوقع ليوليو"></div>
                  <div className="w-4 bg-rose-500/50 rounded-t-xs" style={{ height: "40%" }} title="المتوقع ليوليو"></div>
                </div>
                <span className="text-[10px] text-slate-400 font-bold">يونيو (متوقع)</span>
              </div>
            </div>
          )}
          <div className="mt-4 text-[11px] text-slate-400 dark:text-slate-500 text-center font-medium">
            ملاحظة: تُحتسب بيانات وإحصاءات المعاملات بالترابط والتحليل المباشر مع حركة الصناديق.
          </div>
        </div>

        {/* Breakdown of Revenue by department & expenses by category */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-base mb-4">توزيع الإيرادات والمصروفات حسب الأقسام التشغيلية</h3>
            
            {/* Dept revenues */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-teal-600">أعلى العيادات والأقسام الطبية كفاءة إيرادية:</h4>
              {Object.keys(deptRevenues).length === 0 ? (
                <p className="text-xs text-slate-400">لا توجد بيانات كافية للأقسام حالياً</p>
              ) : (
                Object.entries(deptRevenues).slice(0, 3).map(([dept, amt]) => {
                  const pct = Math.max(10, Math.min(100, (amt / Math.max(1, totalRevenue)) * 100));
                  return (
                    <div key={dept} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span>{dept}</span>
                        <span>{amt.toLocaleString()} {currency} ({Math.round(pct)}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div className="bg-teal-600 h-full rounded-full" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Expense categories */}
              <h4 className="text-xs font-bold text-rose-500 pt-2">أعلى أبواب المصروفات كلفة:</h4>
              {Object.keys(categoryExpenses).length === 0 ? (
                <p className="text-xs text-slate-400">لا توجد مصاريف مسجلة لشهر مايو</p>
              ) : (
                Object.entries(categoryExpenses).slice(0, 2).map(([cat, amt]) => {
                  const pct = Math.max(10, Math.min(100, (amt / Math.max(1, totalExpense)) * 100));
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span>{cat}</span>
                        <span>{amt.toLocaleString()} {currency} ({Math.round(pct)}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div className="bg-rose-500 h-full rounded-full" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-700 mt-4 flex justify-between items-center text-xs">
            <span className="text-slate-500">مجموع الأصول الطبية المسجلة: <strong className="text-slate-800 dark:text-white font-bold">{assets.length} أجهزة</strong></span>
            <button onClick={() => onNavigate("assets")} className="text-teal-600 hover:underline font-bold">إدارة الأصول الطبيّة ←</button>
          </div>
        </div>
      </div>

      {/* Lower section with Alerts / Critical Action and Recent Transactions Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions list (Tabs: Revenues, Expenses, Cashbox movements) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 dark:text-white text-base">النشاط والعمليات المالية الأخيرة</h3>
              <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-xl text-xs">
                <button 
                  onClick={() => setActiveTab("rev")}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${activeTab === "rev" ? "bg-white dark:bg-slate-600 text-teal-700 dark:text-white shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
                >
                  الإيرادات
                </button>
                <button 
                  onClick={() => setActiveTab("exp")}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${activeTab === "exp" ? "bg-white dark:bg-slate-600 text-rose-600 dark:text-white shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
                >
                  المصاريف
                </button>
                <button 
                  onClick={() => setActiveTab("cash")}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${activeTab === "cash" ? "bg-white dark:bg-slate-600 text-amber-600 dark:text-white shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
                >
                  الخزينة
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="text-[11px] text-slate-400 font-bold uppercase bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700">
                  {activeTab === "rev" && (
                    <tr>
                      <th className="p-3">المريض</th>
                      <th className="p-3">القسم والخدمة</th>
                      <th className="p-3">المبلغ</th>
                      <th className="p-3">طريقة الدفع</th>
                      <th className="p-3">التاريخ</th>
                    </tr>
                  )}
                  {activeTab === "exp" && (
                    <tr>
                      <th className="p-3">اسم المصروف</th>
                      <th className="p-3">الفئة</th>
                      <th className="p-3">المبلغ</th>
                      <th className="p-3">التاريخ</th>
                    </tr>
                  )}
                  {activeTab === "cash" && (
                    <tr>
                      <th className="p-3">المسؤول</th>
                      <th className="p-3">البيان والحركة</th>
                      <th className="p-3">المبلغ</th>
                      <th className="p-3">النوع</th>
                      <th className="p-3">التاريخ</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                  {activeTab === "rev" && (
                    revenues.slice(0, 4).map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                        <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{r.patientName}</td>
                        <td className="p-3">
                          <span className="text-xs text-slate-500 dark:text-slate-400 block">{r.department}</span>
                          <span className="text-[10px] text-slate-400">{r.serviceType}</span>
                        </td>
                        <td className="p-3 font-bold text-teal-600 dark:text-teal-400">{r.amount} {currency}</td>
                        <td className="p-3 text-slate-500 text-xs">{r.paymentMethod}</td>
                        <td className="p-3 text-slate-400 text-xs">{r.date}</td>
                      </tr>
                    ))
                  )}

                  {activeTab === "exp" && (
                    expenses.slice(0, 4).map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                        <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{e.expenseName}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-md text-[10px] font-bold">
                            {e.category}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-rose-500">{e.amount} {currency}</td>
                        <td className="p-3 text-slate-400 text-xs">{e.date}</td>
                      </tr>
                    ))
                  )}

                  {activeTab === "cash" && (
                    cashbox.slice(0, 4).map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                        <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{c.employee}</td>
                        <td className="p-3 text-xs text-slate-600 dark:text-slate-300">{c.description}</td>
                        <td className={`p-3 font-bold ${c.type === "إيداع" ? "text-emerald-600" : "text-rose-500"}`}>
                          {c.type === "إيداع" ? "+" : "-"}{c.amount} {currency}
                        </td>
                        <td className="p-3 text-xs">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${c.type === "إيداع" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30" : "bg-rose-50 text-rose-700 dark:bg-rose-900/30"}`}>
                            {c.type}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400 text-xs">{c.date}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="pt-4 border-t border-slate-100 dark:border-slate-700 mt-4 text-center">
            <button 
              onClick={() => onNavigate(activeTab === "rev" ? "revenues" : activeTab === "exp" ? "expenses" : "cashbox")} 
              className="text-xs text-slate-500 hover:text-teal-600 font-bold"
            >
              عرض السجلات الكاملة والمعاملات ←
            </button>
          </div>
        </div>

        {/* Executive Alerts Panel */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-base mb-4 flex items-center gap-2">
              <ShieldAlert className="text-rose-500" size={18} />
              لوحة التنبيهات والتدخل المالي
            </h3>

            <div className="space-y-3">
              {/* Alert 1: Low Cash Warning */}
              {lowCashAlert && (
                <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-100 dark:border-amber-900/40">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold">
                    ⚠️
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-amber-900 dark:text-amber-400">سيولة الخزينة منخفضة جداً</p>
                    <p className="text-[10px] text-amber-700 dark:text-amber-500">رصيد الصندوق الحالي أقل من {settings?.alertLowCash || 5000} {currency}. يرجى تغذية الصندوق أو تحصيل الفواتير.</p>
                  </div>
                </div>
              )}

              {/* Alert 2: Overdue Invoices */}
              {overdueInvoicesCount > 0 && (
                <div className="flex items-start gap-3 p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-100 dark:border-rose-900/40">
                  <div className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center font-bold">
                    !
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-rose-900 dark:text-rose-400">فواتير متأخرة على المرضى</p>
                    <p className="text-[10px] text-rose-700 dark:text-rose-500">هناك عدد ({overdueInvoicesCount}) فواتير غير مسددة وتجاوزت تاريخ الاستحقاق المطلوب.</p>
                  </div>
                </div>
              )}

              {/* Alert 3: Pending salaries */}
              {pendingSalariesCount > 0 && (
                <div className="flex items-start gap-3 p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500 text-white flex items-center justify-center font-bold">
                    ⏳
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-indigo-900 dark:text-indigo-400">رواتب طاقم العمل بانتظار الصرف</p>
                    <p className="text-[10px] text-indigo-700 dark:text-indigo-500">يوجد عدد ({pendingSalariesCount}) موظفين لم يتم معالجة أو تحويل رواتبهم لشهر مايو.</p>
                  </div>
                </div>
              )}

              {/* Alert 4: Medical device broken requiring urgent maintenance */}
              {brokenAssetsCount > 0 && (
                <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-100 dark:border-red-900/40">
                  <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center">
                    <Wrench size={14} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-red-900 dark:text-red-400">أجهزة طبية متوقفة / صيانة طارئة</p>
                    <p className="text-[10px] text-red-700 dark:text-red-400">هناك ({brokenAssetsCount}) أجهزة تعاني من أعطال فنية أو خارج المعايرة المعتمدة حرصاً على سلامة المرضى.</p>
                  </div>
                </div>
              )}

              {/* Safe status if no alerts */}
              {!lowCashAlert && overdueInvoicesCount === 0 && pendingSalariesCount === 0 && brokenAssetsCount === 0 && (
                <div className="text-center py-8 text-slate-400 text-xs">
                  <CheckCircle className="text-emerald-500 mx-auto mb-2" size={32} />
                  نظام الأمان والالتزام المالي مستقر تماماً ولا توجد إجراءات عاجلة مطلوبة.
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 mt-4">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">إجراءات الخزينة السريعة:</h4>
            <div className="flex gap-2">
              <button 
                onClick={onDepositClick}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold py-2 px-3 rounded-lg transition-all"
              >
                + إيداع نقدي بالخزينة
              </button>
              <button 
                onClick={onWithdrawClick}
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold py-2 px-3 rounded-lg transition-all"
              >
                - صرف نقدي طارئ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

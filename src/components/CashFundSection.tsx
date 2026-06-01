import React, { useState } from "react";
import { CashTransaction, ClinicSettings } from "../types";
import { Plus, Minus, Search, RefreshCw, AlertTriangle, ShieldCheck, User, Calendar, FileText, ArrowUpCircle, ArrowDownCircle, X, FileSpreadsheet } from "lucide-react";
import { exportToExcel } from "../utils";

interface Props {
  cashbox: CashTransaction[];
  settings: ClinicSettings;
  onAddTransaction: (tx: Omit<CashTransaction, "id">) => Promise<boolean>;
  onDepositClick: () => void;
  onWithdrawClick: () => void;
}

export default function CashFundSection({ cashbox, settings, onAddTransaction, onDepositClick, onWithdrawClick }: Props) {
  const currency = settings?.currency || "₪";
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");

  const [showReconciliation, setShowReconciliation] = useState(false);
  const [physicalCashInput, setPhysicalCashInput] = useState("");
  const [reconciliationResult, setReconciliationResult] = useState<{
    status: "متطابق" | "عجز" | "زيادة" | null;
    diff: number;
  }>({ status: null, diff: 0 });

  // Deposit and withdrawal local modals state
  const [showTxModal, setShowTxModal] = useState(false);
  const [txType, setTxType] = useState<"إيداع" | "سحب">("إيداع");
  const [txAmount, setTxAmount] = useState("");
  const [txDescription, setTxDescription] = useState("");
  const [txEmployee, setTxEmployee] = useState("");
  const [txDate, setTxDate] = useState("");

  const handleOpenTxModal = (type: "إيداع" | "سحب") => {
    setTxType(type);
    setTxAmount("");
    setTxDescription("");
    setTxEmployee(settings?.adminName || "م. أمل أبو عيد");
    setTxDate(new Date().toISOString().split("T")[0]);
    setShowTxModal(true);
  };

  const handleTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(txAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const success = await onAddTransaction({
      type: txType,
      amount: amountNum,
      description: txDescription,
      employee: txEmployee || "موظف الخزينة",
      date: txDate,
    });

    if (success) {
      setShowTxModal(false);
      setTxAmount("");
      setTxDescription("");
    }
  };

  // Calculation parameters
  const openingBalance = 0; // zeroed out opening balance per user requirement
  const cashIn = cashbox.filter((c) => c.type === "إيداع").reduce((sum, c) => sum + c.amount, 0);
  const cashOut = cashbox.filter((c) => c.type === "سحب").reduce((sum, c) => sum + c.amount, 0);
  const currentBalance = openingBalance + cashIn - cashOut;

  // Generate dynamic path and points for sparkline line graph
  const getSparklineData = () => {
    if (cashbox.length === 0) return { path: "", areaPath: "", points: [] };

    // Sort transactions chronologically
    const sorted = [...cashbox].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Accumulate balances
    let runningBalance = openingBalance;
    const history = sorted.map(tx => {
      if (tx.type === "إيداع") runningBalance += tx.amount;
      else runningBalance -= tx.amount;
      return { balance: runningBalance, date: tx.date };
    });

    const balances = history.map(h => h.balance);
    const maxBal = Math.max(...balances, 100);
    const minBal = Math.min(...balances, 0);
    const balRange = maxBal - minBal === 0 ? 1 : maxBal - minBal;

    const width = 400;
    const height = 100;
    const paddingX = 15;
    const paddingY = 15;

    const points = history.map((h, i) => {
      const x = history.length > 1 
        ? paddingX + (i / (history.length - 1)) * (width - 2 * paddingX) 
        : width / 2;

      const ratio = (h.balance - minBal) / balRange;
      const y = height - paddingY - ratio * (height - 2 * paddingY);

      return { x, y, balance: h.balance, date: h.date };
    });

    let path = "";
    let areaPath = "";

    if (points.length === 1) {
      const p = points[0];
      path = `M 15 50 L ${width - 15} 50`;
      areaPath = `M 15 50 L ${width - 15} 50 L ${width - 15} 100 L 15 100 Z`;
    } else {
      path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
      for (let i = 1; i < points.length; i++) {
        path += ` L ${points[i].x.toFixed(1)} ${points[i].y.toFixed(1)}`;
      }
      areaPath = path + ` L ${points[points.length - 1].x.toFixed(1)} 100 L ${points[0].x.toFixed(1)} 100 Z`;
    }

    return { path, areaPath, points };
  };

  const sparkline = getSparklineData();

  // Filter list
  const filteredTransactions = cashbox.filter((c) => {
    const matchesSearch = 
      c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = selectedType === "all" || c.type === selectedType;

    return matchesSearch && matchesType;
  });

  const lowCashAlert = currentBalance < (settings?.alertLowCash || 5000);

  // Handle reconciliation
  const handleReconcile = (e: React.FormEvent) => {
    e.preventDefault();
    const phys = Number(physicalCashInput);
    if (isNaN(phys)) return;

    const diff = phys - currentBalance;
    let status: "متطابق" | "عجز" | "زيادة" = "متطابق";
    if (diff < 0) status = "عجز";
    else if (diff > 0) status = "زيادة";

    setReconciliationResult({ status, diff });
  };

  const handleExportExcel = () => {
    const headers = [
      "رقم الحركة",
      "نوع الحركة",
      "المبلغ",
      "البيان / التفاصيل",
      "المسؤول عن الحركة",
      "التاريخ"
    ];
    const exportData = filteredTransactions.map((c) => [
      c.id,
      c.type,
      c.amount,
      c.description,
      c.employee,
      c.date
    ]);
    exportToExcel(exportData, headers, "حركة_الخزينة_والصندوق_اليومي");
  };

  return (
    <div className="space-y-6">
      {/* Header and Quick action buttons */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">صندوق النقد المباشر والعهدة المالية (الخزينة)</h2>
          <p className="text-xs text-slate-500">مراقبة السيولة الفيزيائية بصندوق المركز، ومطابقتها دورياً مع المعاملات اليومية</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={handleExportExcel}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
          >
            <FileSpreadsheet size={14} />
            تصدير Excel
          </button>
          <button 
            onClick={() => setShowReconciliation(true)}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold px-3 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
          >
            <RefreshCw size={14} />
            مطابقة الصندوق (جرد نقد)
          </button>
          <button 
            onClick={() => handleOpenTxModal("إيداع")}
            className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-3 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
          >
            <Plus size={14} />
            إيداع نقدي
          </button>
          <button 
            onClick={() => handleOpenTxModal("سحب")}
            className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-3 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
          >
            <Minus size={14} />
            سحب عاجل
          </button>
        </div>
      </div>

      {/* Security alerts in case of low funds */}
      {lowCashAlert && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="text-xs font-bold text-amber-900 dark:text-amber-400">تنبيه فوري: انخفاض فائض النقد عن الحد الآمن!</h4>
            <p className="text-[11px] text-amber-700 dark:text-amber-500 mt-1">
              الرصيد الفعلي الحالي المتوفر في الخزينة هو {currentBalance.toLocaleString()} {currency} وهو أقل من عتبة التحذير ({settings?.alertLowCash || 5000} {currency}).
              يرجى الحد من نفقات المصاريف النقدية وتفضيل وسيلة الدفع (شبكة أو تحويل بنكي) للمشتريات الكبيرة.
            </p>
          </div>
        </div>
      )}

      {/* Grid status cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1: Opening balance */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col justify-between h-24">
          <span className="text-[11px] font-bold text-slate-400">رصيد الافتتاح المعياري</span>
          <p className="text-xl font-black text-slate-500">{openingBalance.toLocaleString()} {currency}</p>
          <span className="text-[10px] text-slate-400">عهدة الصباح الدورية</span>
        </div>

        {/* Card 2: Current Actual Balance */}
        <div className="bg-teal-800 text-white p-4 rounded-xl flex flex-col justify-between h-24 relative overflow-hidden shadow-md">
          <span className="text-[11px] font-bold text-teal-200">الرصيد الفعلي المتوفر</span>
          <p className="text-2xl font-extrabold">{currentBalance.toLocaleString()} {currency}</p>
          <span className="text-[10px] text-teal-300 font-medium">جرد حي لحساب الخزينة</span>
          <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-teal-600/30 rounded-full blur-xl"></div>
        </div>

        {/* Card 3: Total Cash In */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col justify-between h-24">
          <span className="text-[11px] font-bold text-slate-400">مجموع التدفقات النقدية الداخلة (+)</span>
          <p className="text-xl font-black text-emerald-600">{cashIn.toLocaleString()} {currency}</p>
          <span className="text-[10px] text-slate-400">المقبوضات والإيداعات</span>
        </div>

        {/* Card 4: Total Cash Out */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col justify-between h-24">
          <span className="text-[11px] font-bold text-slate-400">مجموع السحوبات والتشغيل (-)</span>
          <p className="text-xl font-black text-rose-500">{cashOut.toLocaleString()} {currency}</p>
          <span className="text-[10px] text-slate-400">المصروفات والتسويات الصادرة</span>
        </div>
      </div>

      {/* Cashflow visual trend and Reconciliation block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Daily Cash movement sparkline chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-sm mb-4">منحنى حركة النقدية اليومية السائلة</h3>
            
            {/* Customized SVG line graph */}
            {cashbox.length === 0 ? (
              <div className="h-32 w-full mt-4 flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-slate-700/80 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 p-4 text-center">
                <p className="text-xs text-slate-400 font-bold max-w-sm leading-relaxed">
                  لا توجد حركات مسجلة حالياً على الخزينة. قم بتسجيل إيداع نقدي أو سحب عاجل أعلاه لرسم منحنى حركة السيولة التراكمي تفاعلياً.
                </p>
              </div>
            ) : (
              <div className="h-32 w-full mt-4 flex items-end">
                <svg className="w-full h-full text-teal-600 overflow-visible" viewBox="0 0 400 100">
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgb(13, 148, 136)" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="rgb(13, 148, 136)" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {/* Spark Graph path */}
                  <path
                    d={sparkline.path}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Gradient area */}
                  <path
                    d={sparkline.areaPath}
                    fill="url(#chartGrad)"
                  />
                  {/* Data Points */}
                  {sparkline.points.map((p, idx) => (
                    <circle 
                      key={idx} 
                      cx={p.x} 
                      cy={p.y} 
                      r="4.5" 
                      fill="rgb(13, 148, 136)" 
                      stroke="white" 
                      strokeWidth="1.5" 
                      className="cursor-pointer transition-all hover:r-6"
                    >
                      <title>{`${p.date}: ${p.balance.toLocaleString()} ${currency}`}</title>
                    </circle>
                  ))}
                </svg>
              </div>
            )}
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold pt-2 border-t border-slate-50 dark:border-slate-700/50">
            <span>بداية الأسبوع (السبت)</span>
            <span>منتصف الأسبوع (الثلاثاء)</span>
            <span>نهاية الأسبوع (الخميس)</span>
          </div>
        </div>

        {/* Right column: Quick transaction stats / filters */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-sm mb-4">التصفية والبحث في الصندوق</h3>
            
            <div className="space-y-4">
              <div className="relative">
                <span className="absolute inset-y-0 right-3 flex items-center text-slate-400">
                  <Search size={14} />
                </span>
                <input 
                  type="text" 
                  placeholder="ابحث بالوصف، الموظف المسؤول..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-xs pr-10 pl-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400">فرز حسب نوع العملية:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => setSelectedType("all")}
                    className={`py-1.5 text-[10px] font-bold rounded-lg transition-all ${selectedType === "all" ? "bg-teal-50 text-teal-700 dark:bg-teal-900/30" : "bg-slate-50 dark:bg-slate-900 text-slate-500 hover:text-slate-800"}`}
                  >
                    تفحص الكل
                  </button>
                  <button 
                    onClick={() => setSelectedType("إيداع")}
                    className={`py-1.5 text-[10px] font-bold rounded-lg transition-all ${selectedType === "إيداع" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30" : "bg-slate-50 dark:bg-slate-900 text-slate-500"}`}
                  >
                    فقط إيداعات
                  </button>
                  <button 
                    onClick={() => setSelectedType("سحب")}
                    className={`py-1.5 text-[10px] font-bold rounded-lg transition-all ${selectedType === "سحب" ? "bg-rose-50 text-rose-700 dark:bg-rose-900/30" : "bg-slate-50 dark:bg-slate-900 text-slate-500"}`}
                  >
                    فقط سحوبات
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800 mt-4 text-[10px] space-y-1.5 text-slate-500">
            <p className="font-bold text-slate-700 dark:text-slate-300">💡 آلية دمج إيرادات نقدية:</p>
            <p>تسجيل الإيرادات الطبية في صفحة (الإيرادات) مع تحديد وسيلة الدفع "نقدي" يقوم تلقائياً بضخه كإيداع بالصندوق وتفعيل العملية دون الحاجة لمنصة يدوية مكررة.</p>
          </div>
        </div>
      </div>

      {/* Main Transactions Log Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-400 font-bold text-xs border-b border-slate-100 dark:border-slate-700">
              <tr>
                <th className="p-4">رقم السند</th>
                <th className="p-4">نوع الحركة النقدية</th>
                <th className="p-4">البيان / تفصيل الصرف الداخلي</th>
                <th className="p-4">المبلغ المنقول</th>
                <th className="p-4">المسؤول عن العملية</th>
                <th className="p-4">تاريخ السند</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                    لا تتوفر أي حركات صندوق نقدي تطابق مرئيات فلتر البحث الحالي.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="p-4 font-mono text-xs text-slate-400 font-bold">{tx.id}</td>
                    <td className="p-4 text-xs font-bold">
                      <div className="flex items-center gap-1.5">
                        {tx.type === "إيداع" ? (
                          <>
                            <ArrowUpCircle size={14} className="text-emerald-500" />
                            <span className="text-emerald-600 dark:text-emerald-400">إيداع وارد</span>
                          </>
                        ) : (
                          <>
                            <ArrowDownCircle size={14} className="text-rose-500" />
                            <span className="text-rose-500">سحب من الخزينة</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-slate-700 dark:text-slate-300 font-semibold">{tx.description}</td>
                    <td className={`p-4 font-black ${tx.type === "إيداع" ? "text-emerald-600" : "text-rose-600"}`}>
                      {tx.type === "إيداع" ? "+" : "-"}{tx.amount.toLocaleString()} {currency}
                    </td>
                    <td className="p-4 text-xs">
                      <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <User size={12} />
                        <span>{tx.employee}</span>
                      </div>
                    </td>
                    <td className="p-4 text-xs text-slate-400 font-medium">{tx.date}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Daily Cash Reconciliation Modal */}
      {showReconciliation && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-xl border border-slate-100 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <span className="font-bold text-slate-800 dark:text-white text-sm">
                نموذج الجرد الفعلي ومطابقة الخزينة اليومية
              </span>
              <button 
                onClick={() => {
                  setShowReconciliation(false);
                  setPhysicalCashInput("");
                  setReconciliationResult({ status: null, diff: 0 });
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleReconcile} className="p-6 space-y-4">
              <div className="p-3 bg-teal-50 dark:bg-teal-950/20 text-slate-800 dark:text-slate-200 rounded-xl space-y-1">
                <div className="text-xs font-bold">الرصيد الدفتري المسجل إدارياً بالنظام الموحد:</div>
                <div className="text-xl font-black text-teal-600 dark:text-teal-400">{currentBalance.toLocaleString()} {currency}</div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">قم بإدخال عهدة الكاش الفيزيائي بالدرج الآن:</label>
                <div className="relative">
                  <input 
                    type="number" 
                    required
                    placeholder="قم بعد الأوراق النقدية وكتابتها..."
                    value={physicalCashInput}
                    onChange={(e) => setPhysicalCashInput(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 focus:outline-none text-slate-800 dark:text-white"
                  />
                  <span className="absolute left-3 inset-y-0 flex items-center text-xs text-slate-400 font-bold">{currency}</span>
                </div>
              </div>

              {/* Show Reconciliation Results */}
              {reconciliationResult.status && (
                <div className={`p-4 rounded-xl border text-xs ${reconciliationResult.status === "متطابق" ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900" : reconciliationResult.status === "عجز" ? "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900" : "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/20"}`}>
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    {reconciliationResult.status === "متطابق" ? (
                      <>
                        <ShieldCheck size={16} className="text-emerald-600" />
                        <span>متطابق 100٪ بدون عجز</span>
                      </>
                    ) : reconciliationResult.status === "عجز" ? (
                      <>
                        <AlertTriangle size={16} className="text-rose-600" />
                        <span>عجز في الصندوق بمقدار {Math.abs(reconciliationResult.diff).toLocaleString()} {currency}</span>
                      </>
                    ) : (
                      <>
                        <Plus size={16} className="text-amber-600" />
                        <span>فائض وزيادة غير مبررة بمقدار {reconciliationResult.diff.toLocaleString()} {currency}</span>
                      </>
                    )}
                  </div>
                  <p className="text-[10px] opacity-90 mt-1">
                    {reconciliationResult.status === "متطابق" && "لقد تم توثيق عملية الجرد وإصدار تفويض المطابقة الفورية."}
                    {reconciliationResult.status === "عجز" && "يرجى مراجعة إيصالات السحب الأخيرة مع الموظفين المسؤولين لتوضيح الفروقات."}
                    {reconciliationResult.status === "زيادة" && "يرجى مقارنة قيد الفواتير النقدية لليوم للتأكد من تسجيل جميع المدخلات المالية."}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex gap-2">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowReconciliation(false);
                    setPhysicalCashInput("");
                    setReconciliationResult({ status: null, diff: 0 });
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl transition-all"
                >
                  إغلاق نافذة المطابقة
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-xs"
                >
                  حساب الفارق وتوثيق الجرد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deposit and Withdrawal Transaction Modal */}
      {showTxModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-xl border border-slate-100 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-150" dir="rtl">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <span className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                {txType === "إيداع" ? (
                  <>
                    <ArrowUpCircle className="text-emerald-500" size={18} />
                    <span>تسجيل إيداع نقدي جديد للخزينة</span>
                  </>
                ) : (
                  <>
                    <ArrowDownCircle className="text-rose-500" size={18} />
                    <span>تسجيل سحب عاجل جديد من الخزينة</span>
                  </>
                )}
              </span>
              <button 
                onClick={() => setShowTxModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleTxSubmit} className="p-6 space-y-4">
              {/* Amount field */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">المبلغ ({currency}):</label>
                <div className="relative">
                  <input 
                    type="number" 
                    required
                    min="1"
                    step="any"
                    placeholder="أدخل قيمة المبلغ النقدي..."
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 focus:outline-none font-bold text-slate-800 dark:text-white"
                  />
                  <span className="absolute left-3 inset-y-0 flex items-center text-xs text-slate-400 font-bold">{currency}</span>
                </div>
              </div>

              {/* Description field */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">البيان / تفصيل قيد العملية:</label>
                <input 
                  type="text" 
                  required
                  placeholder={txType === "إيداع" ? "مثال: رصيد افتتاحي، عهدة إضافية، تسوية مالية..." : "مثال: شراء قرطاسية مستعجل، نفقات صيانة طارئة..."}
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 focus:outline-none text-slate-800 dark:text-white"
                />
              </div>

              {/* Responsible Employee field */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block font-sans">المسؤول عن الحركة:</label>
                <input 
                  type="text" 
                  required
                  placeholder="اسم الموظف المسؤول..."
                  value={txEmployee}
                  onChange={(e) => setTxEmployee(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 focus:outline-none text-slate-800 dark:text-white"
                />
              </div>

              {/* Transaction Date field */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">التاريخ:</label>
                <input 
                  type="date" 
                  required
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 focus:outline-none text-slate-800 dark:text-white"
                />
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowTxModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl transition-all"
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className={`flex-1 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-xs ${txType === "إيداع" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-500 hover:bg-rose-600"}`}
                >
                  {txType === "إيداع" ? "حفظ الإيداع" : "تأكيد السحب"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

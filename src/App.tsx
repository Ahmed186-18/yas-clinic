import React, { useState, useEffect } from "react";
import { useFinanceData } from "./useFinanceData";

// Components
import OverviewSection from "./components/OverviewSection";
import RevenuesSection from "./components/RevenuesSection";
import ExpensesSection from "./components/ExpensesSection";
import CashFundSection from "./components/CashFundSection";
import InvoicesSection from "./components/InvoicesSection";
import PayrollSection from "./components/PayrollSection";
import FinancialReportsSection from "./components/FinancialReportsSection";
import SettingsSection from "./components/SettingsSection";
import AssetsSection from "./components/AssetsSection";

// Icons
import {
  LayoutDashboard,
  Coins,
  TrendingDown,
  Wallet,
  Receipt,
  Users,
  FileBarChart2,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Sparkles,
  Wrench
} from "lucide-react";

export default function App() {
  const {
    data,
    loading,
    error,
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
    toasts,
  } = useFinanceData();

  // Helper Mappings
  const addEmployee = addPayroll;
  const updateEmployee = updatePayroll;
  const deleteEmployee = deletePayroll;
  const paySalary = (id: string) => updatePayroll(id, { paymentStatus: "تم الدفع" });
  const markInvoiceAsPaid = (id: string) => updateInvoice(id, { status: "مدفوعة" });

  const [dismissedToasts, setDismissedToasts] = useState<string[]>([]);
  const activeToasts = toasts.filter((t) => !dismissedToasts.includes(t.id));
  const removeToast = (id: string) => setDismissedToasts((prev) => [...prev, id]);

  // Selected Sidebar Tab
  const [activeTab, setActiveTabInternal] = useState<string>(() => {
    try {
      const saved = localStorage.getItem("medfinance_active_tab");
      return saved || "overview";
    } catch (_) {
      return "overview";
    }
  });

  const setActiveTab = (tab: string) => {
    setActiveTabInternal(tab);
    try {
      localStorage.setItem("medfinance_active_tab", tab);
    } catch (_) {}
  };
  
  // Responsive sidebar toggles
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [logoError, setLogoError] = useState<boolean>(false);
  const [avatarError, setAvatarError] = useState<boolean>(false);
  const darkMode = false;

  // Render handlers with bulletproof fallbacks for user upload convenience
  const renderLogo = (sizeClass: string = "w-8 h-8") => {
    if (logoError) {
      return (
        <div className={`${sizeClass} bg-teal-600 rounded-lg flex items-center justify-center font-bold text-white text-[11px] shrink-0 shadow-md`}>
          ياس
        </div>
      );
    }
    return (
      <img 
        src="/images/logo.png" 
        alt="لوجو" 
        className={`${sizeClass} rounded-lg object-contain bg-white shrink-0 shadow-md border border-slate-100`}
        referrerPolicy="no-referrer"
        onError={() => setLogoError(true)}
      />
    );
  };

  const renderAvatar = () => {
    if (avatarError) {
      return (
        <div className="w-9 h-9 rounded-xl border border-teal-200 bg-teal-100 flex items-center justify-center font-black text-xs text-teal-800 shrink-0 shadow-sm">
          أمل
        </div>
      );
    }
    return (
      <img 
        src="/images/director_amal.png" 
        alt={clinicSettings.adminName || "م. أمل أبو عيد"} 
        className="w-full h-full object-cover"
        referrerPolicy="no-referrer"
        onError={() => setAvatarError(true)}
      />
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center space-y-4" dir="rtl">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-slate-500 animate-pulse">جاري تحميل النظام المالي وحسابات العُهد...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-rose-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4 space-y-4" dir="rtl">
        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-rose-100 dark:border-slate-700 w-full max-w-md text-center space-y-3 shadow-md">
          <p className="text-sm font-black text-rose-600">للأسف، حدث خطأ أثناء تشغيل النظام المالي:</p>
          <code className="text-xs text-rose-500 bg-rose-50 p-2.5 rounded-lg block font-mono">{error}</code>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all"
          >
            إعادة محاولة الاتصال بالخادم
          </button>
        </div>
      </div>
    );
  }

  // Current clinical settings
  const clinicSettings = data?.settings || {
    clinicName: "مركز ياس الطبي",
    currency: "₪",
    taxRate: 15,
    address: "مواصي خانيونس - شمال مفترق النص ب200 متر",
    alertLowCash: 5000,
    adminName: "م. أمل أبو عيد",
    adminEmail: "aeid44304@gmail.com"
  };

  // Nav categories matching user layout requirements exactly
  const navItems = [
    { id: "overview", label: "لوحة التحكم الرئيسية", icon: LayoutDashboard },
    { id: "revenues", label: "العيادات والإيرادات الطبية", icon: Coins },
    { id: "expenses", label: "التكاليف والمصروفات", icon: TrendingDown },
    { id: "cashbox", label: "صندوق النقد المباشر", icon: Wallet },
    { id: "invoices", label: "الفواتير والمطالبات السنوية", icon: Receipt },
    { id: "payroll", label: "سلم الأجور والرواتب", icon: Users },
    { id: "assets", label: "الأصول والأجهزة الطبية", icon: Wrench },
    { id: "reports", label: "الموازنات والتقارير المالية", icon: FileBarChart2 },
    { id: "settings", label: "إعدادات المنشأة العامة", icon: Settings },
  ];



  return (
    <div className={`min-h-screen flex bg-[#FAFAF9] text-slate-800 dark:bg-slate-900 dark:text-slate-105 transition-colors duration-300 font-sans`} dir="rtl">
      
      {/* Toast Notifications Panel */}
      <div className="fixed bottom-5 left-5 z-[9999] space-y-2.5 max-w-sm">
        {activeToasts.map((toast) => (
          <div 
            key={toast.id}
            className={`p-3.5 rounded-xl border shadow-lg flex items-start gap-2.5 animate-in slide-in-from-left duration-250 ${toast.type === "success" ? "bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300" : toast.type === "error" ? "bg-rose-50 border-rose-200 text-rose-800" : "bg-blue-50 border-blue-200 text-blue-800"}`}
          >
            <div className="flex-1 text-xs font-bold leading-normal">{toast.message}</div>
            <button 
              onClick={() => removeToast(toast.id)}
              className="p-0.5 hover:bg-slate-100 rounded text-slate-400"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* MOBILE DRAWER SIDEBAR */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 lg:hidden" onClick={() => setMobileSidebarOpen(false)}>
          <div 
            className="w-72 bg-[#1C1917] h-full p-5 space-y-6 flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className="text-teal-400 font-extrabold text-xs flex items-center gap-2 leading-none">
                  {renderLogo("w-7 h-7")}
                  <span>{clinicSettings.clinicName}</span>
                </span>
                <button onClick={() => setMobileSidebarOpen(false)} className="p-1 text-slate-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              {/* Items */}
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-xs font-bold transition-all ${activeTab === item.id ? "bg-teal-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>


          </div>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <aside 
        className={`hidden lg:flex flex-col justify-between bg-[#1C1917] hover:shadow-2xl border-l border-slate-800 transition-all duration-300 ${sidebarOpen ? "w-64 p-5" : "w-20 p-4"}`}
      >
        <div className="space-y-8">
          {/* Clinic Brand */}
          <div className="flex items-center justify-between">
            {sidebarOpen ? (
              <div className="flex items-center gap-2.5 text-white">
                {renderLogo("w-8 h-8")}
                <div className="min-w-0">
                  <span className="text-xs font-black text-slate-105 block leading-tight truncate">{clinicSettings.clinicName}</span>
                  <span className="text-[9px] text-teal-400 font-bold block">نظام الإدارة المتكامل</span>
                </div>
              </div>
            ) : (
              <div className="w-10 h-10 bg-white rounded-xl overflow-hidden flex items-center justify-center shadow-md mx-auto">
                {renderLogo("w-8 h-8")}
              </div>
            )}
            
            {sidebarOpen && (
              <button 
                onClick={() => setSidebarOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                title="طي الجدار الجانبي"
              >
                <ChevronRight size={16} />
              </button>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center rounded-xl p-3 text-xs font-bold transition-all ${isActive ? "bg-teal-600 text-white shadow-md" : "text-slate-400 hover:text-white hover:bg-slate-800/40"} ${sidebarOpen ? "justify-start gap-3.5" : "justify-center"}`}
                  title={item.label}
                >
                  <Icon size={18} className="shrink-0" />
                  {sidebarOpen && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footers and Logout */}
        <div className="space-y-4">
          {!sidebarOpen && (
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 bg-slate-800/80 rounded-xl text-slate-300 hover:text-white mx-auto flex"
              title="توسيع"
            >
              <ChevronLeft size={16} />
            </button>
          )}


        </div>
      </aside>

      {/* MAIN CONTAINER WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOP COMPREHENSIVE HEADER */}
        <header className="sticky top-0 z-40 bg-[#FAFAF9]/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between ml-0.5">
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <img 
              src="../public/images/logo.jpeg" 
              alt="القائمة" 
              onClick={() => setMobileSidebarOpen(true)}
              className="w-10 h-10 object-contain rounded-lg cursor-pointer bg-white p-1 hover:opacity-85 border border-slate-100 dark:border-slate-800 lg:hidden shrink-0 shadow-xs active:scale-95 transition-all duration-200"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/5087/5087579.png";
              }}
            />
            
            {/* Medical settings Title */}
            <div>
              <h1 className="text-base font-bold text-slate-850 dark:text-white">{clinicSettings.clinicName}</h1>
              <p className="text-[10px] text-slate-400 font-medium">لوحة المراقبة والتحكم المالي الموحد</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Profile Avatar */}
            <div className="flex items-center gap-2.5 pl-2">
              <img 
                src="../public/images/photo.jpeg" 
                alt={clinicSettings.adminName || "م. أمل أبو عيد"} 
                className="w-9 h-9 object-cover rounded-xl border border-teal-100 dark:border-teal-900 shrink-0 bg-teal-50"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
                }}
              />
              <div className="hidden md:block">
                <span className="text-xs font-bold text-slate-705 dark:text-slate-205 block leading-none">{clinicSettings.adminName || "م. أمل أبو عيد"}</span>
                <span className="text-[9px] text-slate-400 block mt-0.5 font-bold">المدير المالي والتشغيلي</span>
              </div>
            </div>
          </div>
        </header>

        {/* WORKSPACE SECTION INJECTIONS */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6">
          
          {activeTab === "overview" && (
            <OverviewSection 
              data={data!} 
              onNavigate={(tab) => {
                const tabLower = tab.toLowerCase();
                const mapped = {
                  invoices: "invoices",
                  payroll: "payroll",
                  revenues: "revenues",
                  expenses: "expenses",
                  cashfund: "cashbox",
                  cashbox: "cashbox",
                  assets: "assets",
                  reports: "reports",
                  overview: "overview",
                  settings: "settings"
                }[tabLower] || tabLower;
                setActiveTab(mapped);
              }}
              onDepositClick={() => {
                setActiveTab("cashbox");
              }}
              onWithdrawClick={() => {
                setActiveTab("cashbox");
              }}
            />
          )}

          {activeTab === "revenues" && (
            <RevenuesSection 
              revenues={data?.revenues || []}
              settings={clinicSettings}
              onAdd={addRevenue}
              onEdit={updateRevenue}
              onDelete={deleteRevenue}
            />
          )}

          {activeTab === "expenses" && (
            <ExpensesSection 
              expenses={data?.expenses || []}
              settings={clinicSettings}
              onAdd={addExpense}
              onEdit={updateExpense}
              onDelete={deleteExpense}
            />
          )}

          {activeTab === "cashbox" && (
            <CashFundSection 
              cashbox={data?.cashbox || []}
              settings={clinicSettings}
              onAddTransaction={addCashboxTransaction}
              onDepositClick={async () => {
                const amount = window.prompt("قم بإدخال قيمة الإيداع إلى صندوق الخزينة:");
                if (!amount || isNaN(Number(amount))) return;
                const desc = window.prompt("أدخل بيان سبب الإيداع (مثال: عهدة تكميلية، تحويل من رصيد السداد):");
                if (!desc) return;
                await addCashboxTransaction({
                  type: "إيداع",
                  amount: Number(amount),
                  description: desc,
                  employee: `${clinicSettings.adminName} (المدير العام)`,
                  date: new Date().toISOString().split("T")[0]
                });
              }}
              onWithdrawClick={async () => {
                const amount = window.prompt("قم بكتابة القيمة المالية المطلوب سحبها من الخزينة:");
                if (!amount || isNaN(Number(amount))) return;
                const desc = window.prompt("أدخل غرض أو سبب سحب العهد النقدية الفوري:");
                if (!desc) return;
                await addCashboxTransaction({
                  type: "سحب",
                  amount: Number(amount),
                  description: desc,
                  employee: `${clinicSettings.adminName} (المدير العام)`,
                  date: new Date().toISOString().split("T")[0]
                });
              }}
            />
          )}

          {activeTab === "invoices" && (
            <InvoicesSection 
              invoices={data?.invoices || []}
              settings={clinicSettings}
              onAdd={addInvoice}
              onEdit={updateInvoice}
              onDelete={deleteInvoice}
              onMarkAsPaid={markInvoiceAsPaid}
            />
          )}

           {activeTab === "payroll" && (
             <PayrollSection 
               payroll={data?.payroll || []}
               settings={clinicSettings}
               onAdd={addEmployee}
               onEdit={updateEmployee}
               onDelete={deleteEmployee}
               onPaySalary={paySalary}
             />
           )}
 
          {activeTab === "assets" && (
            <AssetsSection 
              assets={data?.assets || []}
              settings={clinicSettings}
              onAdd={addAsset}
              onEdit={updateAsset}
              onDelete={deleteAsset}
              onRecordMaintenance={recordAssetMaintenance}
            />
          )}
           {activeTab === "reports" && (
             <FinancialReportsSection 
               revenues={data?.revenues || []}
              expenses={data?.expenses || []}
              payroll={data?.payroll || []}
              assets={data?.assets || []}
              settings={clinicSettings}
            />
          )}

          {activeTab === "settings" && (
            <SettingsSection 
              settings={clinicSettings}
              onUpdateSettings={updateSettings}
            />
          )}

        </main>

        {/* BOTTOM SIMPLE HUMAN DESIGN CREDIT BRANDING */}
        <footer className="py-4 border-t border-slate-100 dark:border-slate-800 text-center text-[10px] text-slate-400 font-bold bg-white/20">
          Yas Medical Clinic - نظام الإدارة المالية وإصدار التقارير للأصول والأجهزة الطبية © جميع الحقوق محفوظة لمركز ياس الطبي.
        </footer>
      </div>
    </div>
  );
}

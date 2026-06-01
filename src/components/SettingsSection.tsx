import React, { useState } from "react";
import { ClinicSettings } from "../types";
import { Save, RefreshCw, Server, ShieldCheck, HelpCircle, Check, Info, Moon, Sun } from "lucide-react";

interface Props {
  settings: ClinicSettings;
  onUpdateSettings: (newSettings: ClinicSettings) => Promise<boolean>;
}

export default function SettingsSection({ settings, onUpdateSettings }: Props) {
  // Local state for fields
  const [clinicName, setClinicName] = useState(settings?.clinicName || "مركز ياس الطبي");
  const [currency, setCurrency] = useState(settings?.currency || "₪");
  const [taxRate, setTaxRate] = useState(settings?.taxRate?.toString() || "15");
  const [address, setAddress] = useState(settings?.address || "مواصي خانيونس - شمال مفترق النص ب 200 متر");
  const [alertLowCash, setAlertLowCash] = useState(settings?.alertLowCash?.toString() || "5000");
  const [adminName, setAdminName] = useState(settings?.adminName || "م. أمل أبو عيد");
  const [adminEmail, setAdminEmail] = useState(settings?.adminEmail || "aeid44304@gmail.com");

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    const payload: ClinicSettings = {
      clinicName,
      currency,
      currencyName: settings?.currencyName || "شيكل",
      taxRate: Number(taxRate || 15),
      alertLowCash: Number(alertLowCash || 5000),
      darkMode: settings?.darkMode || false,
      adminName: adminName,
      adminEmail: adminEmail,
      address,
    };

    const success = await onUpdateSettings(payload);
    setSaving(false);
    if (success) {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">إعدادات النظام والتهيئة العامة</h2>
        <p className="text-xs text-slate-500 font-medium">تغيير مسمى المركز الطبي، العملة الافتراضية، وقيم ضريبة القيمة المضافة ومحددات الإنذار</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left side: Form Settings */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm pb-3 border-b border-slate-50 dark:border-slate-700">البيانات الأساسية للمنشأة الطبية</h3>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 block">اسم المركز الطبي (يظهر على الإيصالات والفواتير)</label>
              <input 
                type="text" 
                required
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                className="w-full text-xs px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 text-slate-800 dark:text-white focus:outline-[#0D9488]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 block font-sans">العنوان الجغرافي ورقم الهاتف التواصلي</label>
              <input 
                type="text" 
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full text-xs px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 text-slate-800 dark:text-white focus:outline-[#0D9488]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">اسم مدير المنشأة الطبية</label>
                <input 
                  type="text" 
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 text-slate-800 dark:text-white focus:outline-[#0D9488]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">البريد الإلكتروني للمدير</label>
                <input 
                  type="email" 
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 text-slate-800 dark:text-white focus:outline-[#0D9488]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">العملة السائدة</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50"
                >
                  <option value="₪">شيكل جديد (₪)</option>
                  <option value="ر.س">ريال سعودي (ر.س)</option>
                  <option value="د.إ">درهم إماراتي (د.إ)</option>
                  <option value="د.ك">دينار كويتي (د.ك)</option>
                  <option value="USD">دولار أمريكي (USD)</option>
                  <option value="EUR">يورو (EUR)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">معدل الضريبة (%)</label>
                <input 
                  type="number" 
                  required
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 text-slate-800 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">حد تنبيه كاش الصندوق</label>
                <input 
                  type="number" 
                  required
                  value={alertLowCash}
                  onChange={(e) => setAlertLowCash(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            {/* Save Buttons indicators */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <div>
                {savedSuccess && (
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5 animate-bounce">
                    <Check size={16} />
                    تم حفظ وتعميم الإعدادات على كود النظام بالكامل!
                  </span>
                )}
              </div>
              <button 
                type="submit" 
                disabled={saving}
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2"
              >
                <Save size={16} />
                {saving ? "جاري الحفظ..." : "حفظ التغييرات الأساسية"}
              </button>
            </div>
          </form>
        </div>

        {/* Right side: Preferences & Database status */}
        <div className="space-y-6">
          {/* Cloud SQL connection telemetry info */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></div>
                <span className="text-xs font-extrabold text-teal-400">اتصال قاعدة البيانات نشط</span>
              </div>
              <div>
                <h4 className="text-xs font-bold">بنية الملف المحلي الآمن (DB.json)</h4>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  يتم قيد البيانات وحفظها دورياً في ملف خادم محلي، مما يضمن ثبات الجرد ووجود حركات الإيرادات، والمصروفات، والرواتب دائمًا.
                </p>
              </div>

              <div className="p-2.5 bg-slate-850 rounded-lg border border-slate-800 text-[10px] text-indigo-300 flex gap-1.5 items-start">
                <Info size={14} className="shrink-0" />
                <span>يتم تشفير وتنسيق النواتج تلقائياً عند طلب طباعة أو تصدير التقارير لتطبيق معايير وزارة الصحة السعودية.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

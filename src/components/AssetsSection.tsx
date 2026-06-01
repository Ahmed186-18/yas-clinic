import React, { useState } from "react";
import { ClinicalAsset, ClinicSettings, MaintenanceLog } from "../types";
import { Plus, Search, MapPin, Wrench, Edit2, Trash2, Calendar, FileText, CheckCircle2, AlertTriangle, AlertCircle, RefreshCw, X, Tag, DollarSign, FileSpreadsheet } from "lucide-react";
import { exportToExcel } from "../utils";

interface Props {
  assets: ClinicalAsset[];
  settings: ClinicSettings;
  onAdd: (asset: Omit<ClinicalAsset, "id" | "maintenanceLogs">) => Promise<boolean>;
  onEdit: (id: string, asset: Partial<ClinicalAsset>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onRecordMaintenance: (id: string, maintenance: { date: string; note: string; cost: number; technician: string; nextDate?: string }) => Promise<boolean>;
}

export default function AssetsSection({ assets, settings, onAdd, onEdit, onDelete, onRecordMaintenance }: Props) {
  const currency = settings?.currency || "₪";

  // Search filter
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDept, setSelectedDept] = useState("all");

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ClinicalAsset | null>(null);

  // Maintenance Log Modal state
  const [reportingAsset, setReportingAsset] = useState<ClinicalAsset | null>(null);
  const [maintenanceCost, setMaintenanceCost] = useState("");
  const [maintenanceNote, setMaintenanceNote] = useState("");
  const [maintenanceTechnician, setMaintenanceTechnician] = useState("");
  const [maintenanceDate, setMaintenanceDate] = useState("");
  const [maintenanceNextDate, setMaintenanceNextDate] = useState("");

  // Asset Form State
  const [assetName, setAssetName] = useState("");
  const [department, setDepartment] = useState("قسم الأشعة");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<ClinicalAsset["status"]>("ممتاز");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [cost, setCost] = useState("");
  const [lastMaintenanceDate, setLastMaintenanceDate] = useState("");
  const [nextMaintenanceDate, setNextMaintenanceDate] = useState("");
  const [serialNumber, setSerialNumber] = useState("");

  const departments = [
    "قسم الأشعة",
    "قسم الطوارئ",
    "قسم الأطفال",
    "قسم الأسنان",
    "قسم العيون",
    "قسم العظام",
    "قسم القلب",
    "قسم المختبر",
    "قسم النساء والولادة"
  ];

  // Filtering
  const filteredAssets = assets.filter((a) => {
    const matchesSearch = 
      a.assetName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      a.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatus === "all" || a.status === selectedStatus;
    const matchesDept = selectedDept === "all" || a.department === selectedDept;

    return matchesSearch && matchesStatus && matchesDept;
  });

  // Telemetry Calculations
  const excellentAssetsCount = assets.filter((a) => a.status === "ممتاز").length;
  const requireMaintenanceCount = assets.filter((a) => a.status === "يحتاج صيانة").length;
  const outOfServiceCount = assets.filter((a) => a.status === "خارج الخدمة").length;

  // Handlers
  const handleOpenAdd = () => {
    setEditingItem(null);
    setAssetName("");
    setDepartment("قسم الأشعة");
    setLocation("");
    setStatus("ممتاز");
    setPurchaseDate(new Date().toISOString().split("T")[0]);
    setCost("");
    setLastMaintenanceDate("");
    setNextMaintenanceDate("");
    setSerialNumber("");
    setShowAddModal(true);
  };

  const handleOpenEdit = (item: ClinicalAsset) => {
    setEditingItem(item);
    setAssetName(item.assetName);
    setDepartment(item.department);
    setLocation(item.location || "");
    setStatus(item.status);
    setPurchaseDate(item.purchaseDate || "");
    setCost(item.cost ? item.cost.toString() : "");
    setLastMaintenanceDate(item.lastMaintenanceDate || "");
    setNextMaintenanceDate(item.nextMaintenanceDate || "");
    setSerialNumber(item.serialNumber || "");
    setShowAddModal(true);
  };

  const handleSubmitAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName) return;

    const payload = {
      assetName,
      department,
      location: location || "",
      status,
      purchaseDate: purchaseDate || new Date().toISOString().split("T")[0],
      cost: Number(cost) || 0,
      lastMaintenanceDate: lastMaintenanceDate || "",
      nextMaintenanceDate: nextMaintenanceDate || "",
      serialNumber: serialNumber || undefined,
    };

    let success = false;
    if (editingItem) {
      success = await onEdit(editingItem.id, payload);
    } else {
      success = await onAdd(payload);
    }

    if (success) {
      setShowAddModal(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("تحذير: هل أنت متأكد من حذف هذا الجهاز الطبي بالكامل من قائمة أصول المركز؟")) {
      await onDelete(id);
    }
  };

  // Open maintenance logging panel
  const handleOpenMaintenanceForm = (asset: ClinicalAsset) => {
    setReportingAsset(asset);
    setMaintenanceCost("");
    setMaintenanceNote("");
    setMaintenanceTechnician("");
    setMaintenanceDate(new Date().toISOString().split("T")[0]);
    // Next maintenance 6 months by default
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    setMaintenanceNextDate(d.toISOString().split("T")[0]);
  };

  const handleSubmitMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingAsset || !maintenanceCost || !maintenanceNote || !maintenanceTechnician) return;

    const success = await onRecordMaintenance(reportingAsset.id, {
      date: maintenanceDate,
      note: maintenanceNote,
      cost: Number(maintenanceCost),
      technician: maintenanceTechnician,
      nextDate: maintenanceNextDate,
    });

    if (success) {
      // Also update the asset status checklist to 'ممتاز' or 'متوسط' since it has just been maintained
      await onEdit(reportingAsset.id, { status: "ممتاز" });
      setReportingAsset(null);
    }
  };

  const handleExportExcel = () => {
    const headers = [
      "رقم الأداة / الأصل",
      "اسم الجهاز الطبي",
      "القسم",
      "الموقع التفصيلي",
      "الحالة التشغيلية",
      "تاريخ الشراء",
      "القيمة المالية",
      "تاريخ آخر صيانة",
      "تاريخ الصيانة القادمة",
      "الرقم التسلسلي"
    ];
    const exportData = filteredAssets.map((a) => [
      a.id,
      a.assetName,
      a.department,
      a.location || "",
      a.status,
      a.purchaseDate || "",
      a.cost,
      a.lastMaintenanceDate || "",
      a.nextMaintenanceDate || "",
      a.serialNumber || ""
    ]);
    exportToExcel(exportData, headers, "سجل_الاصول_والاجهزة_الطبية");
  };

  return (
    <div className="space-y-6">
      {/* Title page */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">إدارة الأصول الطبيّة وصيانة الأجهزة</h2>
          <p className="text-xs text-slate-500 font-medium font-sans">متابعة الأجهزة الطبية والمعدات وحالة تشغيلها وصيانتها</p>
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
            className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2"
          >
            <Plus size={16} />
            تسجيل أصل طبي جديد
          </button>
        </div>
      </div>

      {/* Grid of metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total asset values */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-50 dark:bg-teal-900/40 text-teal-600 rounded-xl flex items-center justify-center font-bold">
            <Wrench size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400">إجمالي الأجهزة المسجلة</p>
            <p className="text-lg font-black text-slate-800 dark:text-white">{assets.length} أجهزة</p>
            <p className="text-[10px] text-slate-400">العدد الكلي للأصول المعتمدة</p>
          </div>
        </div>

        {/* Excellent Assets */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 rounded-xl flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400">أجهزة بحالة ممتازة</p>
            <p className="text-lg font-black text-emerald-600">{excellentAssetsCount} أجهزة</p>
            <p className="text-[10px] text-slate-400">كفاءة تشغيلية كاملة</p>
          </div>
        </div>

        {/* Require Maintenance */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/40 text-amber-600 rounded-xl flex items-center justify-center">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400">أجهزة تحتاج صيانة</p>
            <p className="text-lg font-black text-amber-600">{requireMaintenanceCount} أجهزة</p>
            <p className="text-[10px] text-slate-400">تحتاج جدولة عاجلة</p>
          </div>
        </div>

        {/* Out of service */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center gap-3">
          <div className="w-10 h-10 bg-red-50 dark:bg-red-900/40 text-red-500 rounded-xl flex items-center justify-center">
            <AlertCircle size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400">خارج الخدمة معطلة</p>
            <p className="text-lg font-black text-red-655">{outOfServiceCount} أجهزة</p>
            <p className="text-[10px] text-red-400">تنتظر قطع غيار</p>
          </div>
        </div>
      </div>

      {/* Search and Filters panel */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:max-w-sm">
          <span className="absolute inset-y-0 right-3 flex items-center text-slate-400">
            <Search size={16} />
          </span>
          <input 
            type="text" 
            placeholder="ابحث بالاسم أو الرقم التعريفي..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pr-10 pl-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-3 items-center w-full md:w-auto text-xs font-bold text-slate-500">
          <div className="flex items-center gap-1.5">
            <span>القسم:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-2 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 rounded-lg text-xs"
            >
              <option value="all">الأقسام الطبية</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span>حالة التشغيل:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 rounded-lg text-xs"
            >
              <option value="all">جميع الحالات</option>
              <option value="ممتاز">ممتاز</option>
              <option value="متوسط">متوسط</option>
              <option value="يحتاج صيانة">يحتاج صيانة</option>
              <option value="خارج الخدمة">خارج الخدمة</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Assets Table card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 text-slate-400 font-bold text-xs">
              <tr>
                <th className="p-4">رقم الأصل</th>
                <th className="p-4">اسم الجهاز الطبي والموديل</th>
                <th className="p-4">القسم الطبي المالك</th>
                <th className="p-4">حالة الجهاز</th>
                <th className="p-4 text-center">إدارة الصيانة والخيارات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 text-xs">
                    لا تتوفر أي أجهزة تطابق خيارات التصفية والبحث حالياً.
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="p-4 font-mono font-bold text-xs text-slate-400">{asset.id}</td>
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-100 p-4">
                      <div>{asset.assetName}</div>
                      {asset.serialNumber && (
                        <span className="inline-block mt-0.5 font-mono text-[10px] text-teal-650 bg-teal-50 dark:bg-teal-950/30 px-1.5 py-0.5 rounded-md" dir="ltr">
                          S/N: {asset.serialNumber}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-xs font-semibold text-slate-755">{asset.department}</td>
                    <td className="p-4 text-xs">
                      <span className={`px-2 py-1 rounded text-[9px] font-bold ${asset.status === "ممتاز" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40" : asset.status === "متوسط" ? "bg-slate-100 text-slate-700 dark:bg-slate-600/30" : asset.status === "يحتاج صيانة" ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40" : "bg-red-100 text-red-800 dark:bg-red-950/40"}`}>
                        {asset.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleOpenMaintenanceForm(asset)}
                          className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold px-2 py-1 rounded-md transition-all flex items-center gap-1"
                        >
                          <Wrench size={10} />
                          قيد صيانة
                        </button>
                        <button 
                          onClick={() => handleOpenEdit(asset)}
                          className="p-1 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/20 rounded-md"
                          title="تعديل بيانات الأصل"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button 
                          onClick={() => handleDelete(asset.id)}
                          className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-md"
                          title="شطب الأصل"
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

      {/* Part 1: New Maintenance Logging Modal */}
      {reportingAsset && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-xl border border-slate-100 dark:border-slate-700 animate-in fade-in duration-150">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <span className="font-bold text-slate-800 dark:text-white text-sm">
                توثيق عملية جرد وصيانة للجهاز
              </span>
              <button 
                onClick={() => setReportingAsset(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body form */}
            <form onSubmit={handleSubmitMaintenance} className="p-6 space-y-4">
              <div className="p-3 bg-teal-50 dark:bg-teal-950/30 text-slate-800 dark:text-slate-200 rounded-xl">
                <span className="text-[10px] font-bold text-teal-600 uppercase">جاري جدولة صيانة لـ:</span>
                <p className="font-bold text-xs mt-1">{reportingAsset.assetName}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">قسم: {reportingAsset.department} | الغرفة: {reportingAsset.location}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">تكلفة الصيانة المباشرة ({currency})</label>
                  <input 
                    type="number" 
                    required
                    placeholder="1500"
                    value={maintenanceCost}
                    onChange={(e) => setMaintenanceCost(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 rounded-lg text-slate-800 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">المسؤول/الشركة الفنية المصلحة</label>
                  <input 
                    type="text" 
                    required
                    placeholder="م. خالد جلال / سيمنس"
                    value={maintenanceTechnician}
                    onChange={(e) => setMaintenanceTechnician(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 rounded-lg text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">تاريخ الإجراء</label>
                  <input 
                    type="date" 
                    required
                    value={maintenanceDate}
                    onChange={(e) => setMaintenanceDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 rounded-lg"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">موعد الفحص القادم</label>
                  <input 
                    type="date" 
                    required
                    value={maintenanceNextDate}
                    onChange={(e) => setMaintenanceNextDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">وصف وتفصيل العطل والمعالجة</label>
                <textarea 
                  required
                  placeholder="استبدال لوحة الحساسات الحرارية وتنظيف المبدد المغناطيسي..."
                  value={maintenanceNote}
                  onChange={(e) => setMaintenanceNote(e.target.value)}
                  rows={2}
                  className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 focus:outline-none text-slate-800 dark:text-white"
                ></textarea>
              </div>

              <div className="text-[10px] text-rose-700 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 p-2.5 rounded-lg flex gap-1.5 items-start">
                <AlertTriangle size={14} className="shrink-0" />
                <span>إشعار تلقائي: تأكيد الصيانة يقوم تلقائياً بقيد دفعة (مصروف) بقيمة الصيانة تحت تبويب "صيانة"، وسحب التمويل من الخزينة لتوثيق التدفق المالي المنعكس.</span>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex gap-2">
                <button 
                  type="button" 
                  onClick={() => setReportingAsset(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl transition-all"
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-amber-500 hover:bg-amber-655 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-xs"
                >
                  حفظ الصيانة وقيد الفاتورة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Part 2: Register/Modify Asset modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-xl border border-slate-100 dark:border-slate-700 animate-in fade-in duration-150">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <span className="font-bold text-slate-800 dark:text-white text-sm">
                {editingItem ? "تحديث بيانات الأصل الطبي والعيادة" : "إدراج وتسجيل جهاز طبي جديد بالأصول"}
              </span>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitAsset} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">اسم الجهاز التجاري والموديل الفني الكامل</label>
                <input 
                  type="text" 
                  required
                  placeholder="Philips Digital Compact X-Ray DR"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 text-slate-800 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">الرقم التسلسلي (S/N Serial Number) - إن وجد</label>
                <input 
                  type="text" 
                  placeholder="مثال: SN-583921-X"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 text-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">القسم المستضيف</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 text-slate-850"
                  >
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">حالة التشغيل والمواصفات</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ClinicalAsset["status"])}
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 text-slate-850"
                  >
                    <option value="ممتاز">ممتاز (جاهزية مطلقة)</option>
                    <option value="متوسط">متوسط (يحتاج فحص قريب)</option>
                    <option value="يحتاج صيانة">تحت الصيانة / يحتاج إصلاح</option>
                    <option value="خارج الخدمة">خارج الخدمة (معطل نهائياً)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">تاريخ شراء وتفعيل الجهاز</label>
                <input 
                  type="date" 
                  required
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 text-slate-850 rounded-lg"
                />
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl transition-all"
                >
                  إلغاء التراجع
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-xs"
                >
                  {editingItem ? "حفظ التغييرات بالأصل" : "حفظ الأصل الطبي وتفعيله"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

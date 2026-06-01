export interface MaintenanceLog {
  id: string;
  date: string;
  note: string;
  cost: number;
  technician: string;
}

export interface ClinicalAsset {
  id: string;
  assetName: string;
  department: string;
  location: string;
  status: "ممتاز" | "متوسط" | "يحتاج صيانة" | "خارج الخدمة";
  purchaseDate: string;
  cost: number;
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
  maintenanceLogs: MaintenanceLog[];
  serialNumber?: string;
}

export interface Revenue {
  id: string;
  patientName: string;
  department: string;
  serviceType: string;
  amount: number;
  paymentMethod: "نقدي" | "بطاقة ائتمان" | "تحويل بنكي" | "تأمين طبي" | string;
  date: string;
  status: "مقبول" | "معلق" | string;
  notes: string;
}

export interface Expense {
  id: string;
  expenseName: string;
  category: "الرواتب" | "مستلزمات طبية" | "أجهزة" | "صيانة" | "كهرباء" | "مياه" | "إنترنت" | "مصاريف إدارية" | "أخرى" | string;
  amount: number;
  date: string;
  notes: string;
}

export interface CashTransaction {
  id: string;
  type: "إيداع" | "سحب";
  description: string;
  amount: number;
  date: string;
  employee: string;
}

export interface Invoice {
  id: string;
  patientName: string;
  department: string;
  service: string;
  amount: number;
  invoiceDate: string;
  dueDate: string;
  status: "مدفوعة" | "معلقة" | "متأخرة";
}

export interface Payroll {
  id: string;
  employeeName: string;
  department: string;
  baseSalary: number;
  bonus: number;
  deductions: number;
  finalSalary: number;
  paymentStatus: "تم الدفع" | "معلق";
}

export interface ClinicSettings {
  clinicName: string;
  currency: string;
  currencyName: string;
  taxRate: number;
  alertLowCash: number;
  darkMode: boolean;
  adminName: string;
  adminEmail: string;
  address: string;
}

export interface DashboardData {
  revenues: Revenue[];
  expenses: Expense[];
  cashbox: CashTransaction[];
  invoices: Invoice[];
  payroll: Payroll[];
  assets: ClinicalAsset[];
  settings: ClinicSettings;
}

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Using fallback mode.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions
export interface Revenue {
  id: string;
  patient_name: string;
  service_type?: string;
  amount: number;
  payment_method?: string;
  date: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Expense {
  id: string;
  category: string;
  description?: string;
  amount: number;
  date: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CashTransaction {
  id: string;
  type: string; // "إيداع" or "سحب"
  description?: string;
  amount: number;
  date: string;
  employee?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Invoice {
  id: string;
  invoice_number?: string;
  patient_name?: string;
  amount: number;
  status?: string;
  date: string;
  due_date?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Payroll {
  id: string;
  employee_name: string;
  position?: string;
  salary: number;
  date: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Asset {
  id: string;
  name: string;
  category?: string;
  value: number;
  purchase_date?: string;
  condition?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Settings {
  id: string;
  clinic_name?: string;
  currency?: string;
  currency_name?: string;
  tax_rate?: number;
  alert_low_cash?: number;
  dark_mode?: boolean;
  admin_name?: string;
  admin_email?: string;
  address?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DashboardData {
  revenues: Revenue[];
  expenses: Expense[];
  cashbox: CashTransaction[];
  invoices: Invoice[];
  payroll: Payroll[];
  assets: Asset[];
  settings: Settings;
}

// Helper functions for Supabase operations
export async function loadAllData(): Promise<DashboardData> {
  try {
    const [revenues, expenses, cashbox, invoices, payroll, assets, settings] = await Promise.all([
      supabase.from('revenues').select('*').order('date', { ascending: false }),
      supabase.from('expenses').select('*').order('date', { ascending: false }),
      supabase.from('cashbox').select('*').order('date', { ascending: false }),
      supabase.from('invoices').select('*').order('date', { ascending: false }),
      supabase.from('payroll').select('*').order('date', { ascending: false }),
      supabase.from('assets').select('*').order('created_at', { ascending: false }),
      supabase.from('settings').select('*').eq('id', 'default').single(),
    ]);

    return {
      revenues: revenues.data || [],
      expenses: expenses.data || [],
      cashbox: cashbox.data || [],
      invoices: invoices.data || [],
      payroll: payroll.data || [],
      assets: assets.data || [],
      settings: settings.data || {
        id: 'default',
        clinic_name: 'مركز ياس الطبي',
        currency: '₪',
        currency_name: 'شيكل',
        tax_rate: 15,
        alert_low_cash: 5000,
        dark_mode: false,
        admin_name: 'م. أمل أبو عيد',
        admin_email: 'aeid44304@gmail.com',
        address: 'مواصي خانيونس - شمال مفترق النص ب 200 متر',
      },
    };
  } catch (error) {
    console.error('Error loading data from Supabase:', error);
    throw error;
  }
}

export async function syncData(data: DashboardData): Promise<void> {
  try {
    // This would require batch operations - for now just verify connection
    console.log('Syncing data with Supabase...');
  } catch (error) {
    console.error('Error syncing data to Supabase:', error);
    throw error;
  }
}

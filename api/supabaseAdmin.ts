import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for server-side operations
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials in environment variables');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Helper to get default settings
export function getDefaultSettings() {
  return {
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
  };
}

export async function initializeSettings() {
  try {
    const { data, error } = await supabaseAdmin
      .from('settings')
      .select('*')
      .eq('id', 'default')
      .single();

    if (error && error.code === 'PGRST116') {
      // No settings found, create default
      const { error: insertError } = await supabaseAdmin
        .from('settings')
        .insert([getDefaultSettings()]);

      if (insertError) {
        console.error('Error creating default settings:', insertError);
      }
    }
  } catch (error) {
    console.error('Error initializing settings:', error);
  }
}

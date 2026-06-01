# Supabase Integration Guide

## Prerequisites

1. **Create Supabase Account**
   - Go to https://supabase.com
   - Sign up with GitHub or email
   - Create a new project

2. **Get Supabase Credentials**
   - Project URL (from Settings > API)
   - Anon Public Key (from Settings > API)
   - Service Role Secret (from Settings > API)

## Installation Steps

### 1. Install Dependencies

```bash
npm install @supabase/supabase-js
```

### 2. Environment Variables

Add to your `.env.local`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 3. Database Schema

Create these tables in Supabase SQL Editor:

```sql
-- Revenues Table
CREATE TABLE revenues (
  id TEXT PRIMARY KEY,
  patient_name TEXT NOT NULL,
  service_type TEXT,
  amount DECIMAL(10, 2),
  payment_method TEXT,
  date TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Expenses Table
CREATE TABLE expenses (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10, 2),
  date TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Cashbox Transactions Table
CREATE TABLE cashbox (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- "إيداع" or "سحب"
  description TEXT,
  amount DECIMAL(10, 2),
  date TEXT,
  employee TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Invoices Table
CREATE TABLE invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT,
  patient_name TEXT,
  amount DECIMAL(10, 2),
  status TEXT, -- "pending", "paid", "overdue"
  date TEXT,
  due_date TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Payroll Table
CREATE TABLE payroll (
  id TEXT PRIMARY KEY,
  employee_name TEXT NOT NULL,
  position TEXT,
  salary DECIMAL(10, 2),
  date TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Assets Table
CREATE TABLE assets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  value DECIMAL(10, 2),
  purchase_date TEXT,
  condition TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Settings Table
CREATE TABLE settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  clinic_name TEXT,
  currency TEXT,
  currency_name TEXT,
  tax_rate DECIMAL(5, 2),
  alert_low_cash DECIMAL(10, 2),
  dark_mode BOOLEAN DEFAULT FALSE,
  admin_name TEXT,
  admin_email TEXT,
  address TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE revenues ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create policies for anon access (for development - restrict in production)
CREATE POLICY "Enable read access for all users" ON revenues FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON revenues FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON revenues FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON revenues FOR DELETE USING (true);

-- Repeat for other tables...
CREATE POLICY "Enable read access for all users" ON expenses FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON expenses FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON expenses FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON cashbox FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON cashbox FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON cashbox FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON cashbox FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON invoices FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON invoices FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON invoices FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON payroll FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON payroll FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON payroll FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON payroll FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON assets FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON assets FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON assets FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON assets FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON settings FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON settings FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON settings FOR DELETE USING (true);
```

## What You'll Get

✅ **Data Persistence** - Data survives Vercel deployments
✅ **Real-time Sync** - Changes sync across devices instantly
✅ **Authentication Ready** - Built-in auth system
✅ **Backups** - Automatic daily backups
✅ **Scalability** - Handles growth automatically
✅ **No Server Maintenance** - Fully managed service

## Free Tier Limits (Supabase)

- **Storage**: 500MB
- **Database**: Postgres with 500MB
- **Realtime**: 2 concurrent connections
- **RESTful API**: Unlimited requests
- **Auth Users**: Unlimited

Perfect for your clinic management system!

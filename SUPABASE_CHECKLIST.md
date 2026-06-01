# Supabase Integration - Quick Checklist

## Step 1: Create Supabase Project ✓
- [ ] Go to https://supabase.com and sign up
- [ ] Create a new project
- [ ] Wait for project to be ready (usually 2-3 minutes)

## Step 2: Get Your Credentials ✓
- [ ] Go to Settings → API in your Supabase dashboard
- [ ] Copy the **Project URL** (looks like: `https://xxxx.supabase.co`)
- [ ] Copy the **anon public key** (under "Project API keys")
- [ ] Copy the **service_role key** (also under "Project API keys")

## Step 3: Set Up Environment Variables ✓

Create `.env.local` in your project root:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

For Vercel deployment, add the same variables in:
- Vercel Dashboard → Your Project → Settings → Environment Variables

## Step 4: Create Database Tables ✓
- [ ] In Supabase, go to SQL Editor
- [ ] Paste the SQL schema from `SUPABASE_SETUP.md`
- [ ] Click "Run"

## Step 5: Install Supabase Package ✓

```bash
npm install @supabase/supabase-js
```

## Step 6: Choose Your Approach ✓

### Option A: Keep Using File System (Current Setup)
- **Use**: `api/index.ts` (current file)
- **Pros**: No code changes needed
- **Cons**: Data resets on Vercel redeploy

### Option B: Migrate to Supabase (Recommended)
- **Use**: `api/index-supabase.ts`
- **Steps**:
  1. Complete Steps 1-5 above
  2. Rename `api/index.ts` to `api/index-old.ts`
  3. Rename `api/index-supabase.ts` to `api/index.ts`
  4. Test locally: `npm run dev`
  5. Push to GitHub and deploy

## What Each File Does

- **`SUPABASE_SETUP.md`** - Database schema and configuration
- **`src/supabaseClient.ts`** - Client-side Supabase utilities
- **`api/supabaseAdmin.ts`** - Server-side admin functions
- **`api/index-supabase.ts`** - REST API using Supabase backend

## Testing Locally

```bash
# Install dependencies
npm install

# Add your Supabase credentials to .env.local
# Then run the dev server
npm run dev

# Visit http://localhost:5173
# All data will now save to Supabase!
```

## Important Security Notes

⚠️ **For Production**:
- Don't expose `service_role` key in frontend
- Enable RLS (Row Level Security) policies
- Implement proper authentication
- Use more restrictive policies than the example

## Free Tier Includes

- 500MB database storage
- 500MB file storage
- 2GB bandwidth/month
- Daily automatic backups
- Realtime subscriptions
- Built-in PostgreSQL

**No credit card required to get started!**

## Troubleshooting

### "Missing Supabase credentials"
- Check `.env.local` has correct values
- Reload the dev server

### "Table does not exist"
- Make sure you ran the SQL schema
- Check table names match exactly

### "Permission denied"
- Enable RLS policies (see SUPABASE_SETUP.md)
- Or temporarily allow anon access for testing

## Next Steps

1. ✅ Create Supabase project
2. ✅ Copy credentials
3. ✅ Add to `.env.local`
4. ✅ Run SQL schema
5. ✅ Update API (rename files)
6. ✅ Test locally
7. ✅ Deploy to Vercel

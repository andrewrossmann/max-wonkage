# Max Wonkage Setup Checklist

## ✅ Current Status
- [x] Environment file created (`.env.local`)
- [x] Development server running at http://localhost:3000
- [x] Database migration script ready
- [x] AI test script ready

## 🔑 Next Steps - Get Your API Keys

### 1. OpenAI API Key (Required)
- [ ] Go to https://platform.openai.com/
- [ ] Sign up/login to your account
- [ ] Navigate to API Keys section
- [ ] Create new secret key
- [ ] Copy the key (starts with `sk-`)
- [ ] Update `.env.local` file with your key

### 2. Supabase Keys (Required)
- [ ] Go to https://supabase.com/dashboard
- [ ] Select your project
- [ ] Go to Settings → API
- [ ] Copy these three values:
  - [ ] Project URL (for `NEXT_PUBLIC_SUPABASE_URL`)
  - [ ] anon/public key (for `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
  - [ ] service_role key (for `SUPABASE_SERVICE_ROLE_KEY`)
- [ ] Update `.env.local` file with these keys

### 3. Database Migration
- [ ] Go to Supabase Dashboard → SQL Editor
- [ ] Copy the migration script from `database/migrations/001_add_ai_curriculum_fields.sql`
- [ ] Paste and run the migration
- [ ] Verify tables have new columns

### 4. Test the System
- [ ] Run: `cd frontend && node test-ai.js`
- [ ] Should see "✅ OpenAI API connection successful!"
- [ ] Run: `cd frontend && node test-auth-config.js`
- [ ] Should see "✅ Configuration test complete!"
- [ ] Go to http://localhost:3000/onboarding
- [ ] Fill out the form and test curriculum generation

## 🎯 Expected Results
After completing setup, you should be able to:
1. Fill out the onboarding form
2. See AI generation progress animation
3. Review a personalized curriculum
4. Approve and generate individual sessions
5. View the complete learning experience

## 🆘 Need Help?
- Check browser console for error messages
- Verify all environment variables are set
- Ensure OpenAI account has credits
- Check Supabase connection is working

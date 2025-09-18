# 🚀 Development & Deployment Workflow

This guide outlines the complete workflow for developing and deploying Max Wonkage, including the new Supabase authentication configuration.

## 📋 Overview

Your workflow now supports seamless development and production deployment with automatic environment detection for authentication.

## 🏠 Local Development Workflow

### 1. **Initial Setup** (One-time)
```bash
# Clone and setup
git clone <your-repo>
cd max-wonkage
./setup-local-dev.sh
```

### 2. **Daily Development**
```bash
# Start development server
./restart-dev.sh
# OR
cd frontend && npm run dev
```

### 3. **Making Changes**
1. **Edit files** in `frontend/src/`
2. **Test locally** - changes auto-reload at `http://localhost:3000`
3. **Test authentication** - sign up with test email
4. **Verify email links** point to `localhost:3000`

### 4. **Testing & Validation**
```bash
# Test AI configuration
cd frontend && node test-ai.js

# Test auth configuration
cd frontend && node test-auth-config.js

# Test full flow
# 1. Go to http://localhost:3000/onboarding
# 2. Fill out form and generate curriculum
# 3. Test email confirmation flow
```

### 5. **Commit Changes**
```bash
git add .
git commit -m "feat: Your feature description"
git push
```

## 🚀 Production Deployment Workflow

### 1. **Automatic Deployment**
- **Trigger**: Every `git push` to `main` branch
- **Platform**: Vercel automatically deploys
- **URL**: `https://max-wonkage.vercel.app`

### 2. **Environment Configuration**
- **Supabase**: Configured with both localhost and production URLs
- **Environment Variables**: Set in Vercel Dashboard
- **Authentication**: Automatically uses correct URLs

### 3. **Production Testing**
1. **Visit**: `https://max-wonkage.vercel.app`
2. **Test signup**: Use real email address
3. **Verify email**: Check confirmation link points to production URL
4. **Test full flow**: Complete curriculum generation

## 🔧 Environment Configuration

### Local Development
```bash
# frontend/.env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
OPENAI_API_KEY=your_openai_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # ← New!
```

### Production (Vercel Dashboard)
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
OPENAI_API_KEY=your_openai_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
NEXT_PUBLIC_SITE_URL=https://max-wonkage.vercel.app  # ← New!
```

## 🔐 Authentication Flow

### Development (localhost:3000)
1. User signs up → Supabase sends email
2. Email contains: `http://localhost:3000/auth/confirm?token=...`
3. User clicks link → Confirms email → Redirected to dashboard

### Production (max-wonkage.vercel.app)
1. User signs up → Supabase sends email
2. Email contains: `https://max-wonkage.vercel.app/auth/confirm?token=...`
3. User clicks link → Confirms email → Redirected to dashboard

## 📁 Project Structure

```
max-wonkage/
├── frontend/                 # Next.js app
│   ├── src/
│   │   ├── app/             # App router pages
│   │   ├── components/      # React components
│   │   └── lib/             # Utilities (Supabase, AI)
│   ├── .env.local           # Local environment variables
│   └── test-*.js            # Test scripts
├── database/                 # SQL migrations
├── plan/                     # Project documentation
└── SUPABASE_AUTH_SETUP.md   # Auth configuration guide
```

## 🛠 Available Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `./setup-local-dev.sh` | Initial setup | One-time setup |
| `./restart-dev.sh` | Start dev server | Daily development |
| `./start.sh` | Alternative start | Alternative to restart |
| `cd frontend && npm run dev` | Direct Next.js | Manual start |
| `cd frontend && node test-ai.js` | Test AI config | Validation |
| `cd frontend && node test-auth-config.js` | Test auth config | Validation |

## 🔄 Complete Workflow Example

### Day 1: New Feature Development
```bash
# 1. Start development
./restart-dev.sh

# 2. Make changes
# Edit files in frontend/src/

# 3. Test locally
cd frontend && node test-auth-config.js
# Go to http://localhost:3000 and test

# 4. Commit and deploy
git add .
git commit -m "feat: Add new feature"
git push  # Auto-deploys to Vercel
```

### Day 2: Production Testing
```bash
# 1. Test production
# Visit https://max-wonkage.vercel.app

# 2. Test authentication
# Sign up with real email
# Verify email link points to production

# 3. Test full flow
# Complete curriculum generation
```

## 🚨 Troubleshooting

### Common Issues

**Port 3000 in use:**
```bash
./restart-dev.sh  # Kills existing processes
```

**Environment issues:**
```bash
rm frontend/.env.local
./setup-local-dev.sh
```

**Authentication not working:**
```bash
cd frontend && node test-auth-config.js
# Check Supabase dashboard for redirect URLs
```

**Production deployment issues:**
- Check Vercel dashboard for environment variables
- Verify `NEXT_PUBLIC_SITE_URL` is set correctly
- Check Vercel build logs

### Debug Steps

1. **Check environment variables:**
   ```bash
   cd frontend && node test-auth-config.js
   ```

2. **Test authentication flow:**
   - Sign up with test email
   - Check email for confirmation link
   - Verify URL points to correct domain

3. **Check Supabase configuration:**
   - Go to Supabase Dashboard
   - Check Authentication > URL Configuration
   - Verify both URLs are present

## 📊 Monitoring & Maintenance

### Regular Checks
- [ ] Test local development weekly
- [ ] Test production deployment after major changes
- [ ] Monitor Vercel deployment logs
- [ ] Check Supabase authentication logs

### Environment Updates
- [ ] Update API keys when they expire
- [ ] Rotate Supabase service role key quarterly
- [ ] Update dependencies monthly

## 🎯 Best Practices

1. **Always test locally first** before pushing to production
2. **Use descriptive commit messages** for better tracking
3. **Test authentication flow** in both environments
4. **Monitor deployment logs** for any issues
5. **Keep environment variables secure** (never commit .env files)
6. **Use the test scripts** to validate configuration

## 🚀 Quick Reference

### Start Development
```bash
./restart-dev.sh
```

### Test Configuration
```bash
cd frontend && node test-auth-config.js
```

### Deploy to Production
```bash
git add . && git commit -m "Your changes" && git push
```

### Check Production
Visit: `https://max-wonkage.vercel.app`

---

**Your workflow is now fully automated and environment-aware!** 🎉

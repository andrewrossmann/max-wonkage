# Supabase Authentication Setup Guide

This guide explains how to configure Supabase authentication to work correctly with both localhost (development) and production (Vercel) environments.

## Overview

The key to making email confirmation links work correctly in both environments is configuring the proper redirect URLs in Supabase and using environment variables to dynamically set the correct URL.

## Step 1: Configure Supabase Dashboard

### 1.1 Set up Site URL and Redirect URLs

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** > **URL Configuration**

### 1.2 Configure URLs

Set the following URLs in your Supabase dashboard:

**Site URL:**
- This should be your production URL: `https://max-wonkage.vercel.app`

**Redirect URLs:**
Add both URLs (comma-separated):
```
http://localhost:3000/auth/confirm,https://max-wonkage.vercel.app/auth/confirm
```

**Additional Redirect URLs (if needed):**
You can also add these for more flexibility:
```
http://localhost:3000/**/auth/confirm,https://max-wonkage.vercel.app/**/auth/confirm
```

### 1.3 Email Templates (Optional)

If you want to customize the email templates:

1. Go to **Authentication** > **Email Templates**
2. Select **Confirm signup**
3. You can customize the template, but the redirect URL will be automatically handled by the configuration above

## Step 2: Environment Variables

### 2.1 Local Development (.env.local)

Create or update `frontend/.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Service Role Key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Site URL for email redirects (localhost for development)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 2.2 Production (Vercel Dashboard)

In your Vercel dashboard, set these environment variables:

```bash
# Supabase Configuration (same as local)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# OpenAI Configuration (same as local)
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Service Role Key (same as local)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Site URL for email redirects (production URL)
NEXT_PUBLIC_SITE_URL=https://max-wonkage.vercel.app
```

## Step 3: How It Works

### 3.1 Dynamic URL Detection

The code automatically detects the environment:

- **Client-side**: Uses `window.location.origin` to get the current domain
- **Server-side**: Uses `NEXT_PUBLIC_SITE_URL` environment variable
- **Fallback**: Defaults to `http://localhost:3000` for development

### 3.2 Email Confirmation Flow

1. User signs up with email
2. Supabase sends confirmation email
3. Email contains link to: `{detected_url}/auth/confirm?token=...`
4. User clicks link
5. App processes confirmation at `/auth/confirm` page
6. User is redirected to dashboard

## Step 4: Testing

### 4.1 Test Local Development

1. Start your development server: `./restart-dev.sh`
2. Go to `http://localhost:3000/onboarding`
3. Sign up with a test email
4. Check your email for confirmation link
5. Click the link - it should redirect to `http://localhost:3000/auth/confirm`
6. Verify you're redirected to the dashboard

### 4.2 Test Production

1. Deploy to Vercel: `git push`
2. Go to `https://max-wonkage.vercel.app/onboarding`
3. Sign up with a test email
4. Check your email for confirmation link
5. Click the link - it should redirect to `https://max-wonkage.vercel.app/auth/confirm`
6. Verify you're redirected to the dashboard

## Troubleshooting

### Common Issues

1. **"Invalid redirect URL" error**
   - Check that both URLs are added to Supabase redirect URLs
   - Ensure no trailing slashes in the URLs
   - Verify the URLs match exactly

2. **Email confirmation not working**
   - Check that `NEXT_PUBLIC_SITE_URL` is set correctly
   - Verify the `/auth/confirm` page exists and is working
   - Check browser console for errors

3. **Production emails still pointing to localhost**
   - Ensure `NEXT_PUBLIC_SITE_URL` is set in Vercel environment variables
   - Redeploy after setting the environment variable
   - Check that the environment variable is actually being used

### Debug Steps

1. Check environment variables:
   ```bash
   # In your app, add this to see what's being used
   console.log('Site URL:', process.env.NEXT_PUBLIC_SITE_URL)
   console.log('Current origin:', typeof window !== 'undefined' ? window.location.origin : 'server-side')
   ```

2. Test the redirect URL generation:
   ```bash
   # Add this to your Supabase client creation
   console.log('Redirect URL:', getRedirectUrl())
   ```

## Security Notes

- Never commit `.env.local` files to git
- Use different API keys for development and production if needed
- Regularly rotate your Supabase service role key
- Monitor authentication logs in Supabase dashboard

## Additional Configuration

### Custom Email Templates

If you want to customize the email templates:

1. Go to Supabase Dashboard > Authentication > Email Templates
2. Select the template you want to customize
3. Use the `{{ .ConfirmationURL }}` variable for the confirmation link
4. The URL will automatically use the correct domain based on your configuration

### Multiple Environments

If you have staging or other environments, add their URLs to the Supabase redirect URLs list:

```
http://localhost:3000/auth/confirm,https://staging.max-wonkage.vercel.app/auth/confirm,https://max-wonkage.vercel.app/auth/confirm
```

And set the appropriate `NEXT_PUBLIC_SITE_URL` for each environment.

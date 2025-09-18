# Max Wonkage Setup Guide

## Environment Variables Setup

To get the AI curriculum generation working, you need to set up the following environment variables:

### 1. Frontend Environment Variables

Create a `.env.local` file in the `frontend` directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Service Role Key (for server-side operations)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Site URL for email redirects (localhost for development)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 2. Database Migration

Run the database migration to add the new AI curriculum fields:

```sql
-- Run this in your Supabase SQL editor or via psql
-- File: database/migrations/001_add_ai_curriculum_fields.sql
```

### 3. Getting Your API Keys

#### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Go to API Keys section
4. Create a new API key
5. Copy the key and add it to your `.env.local`

#### Supabase Keys
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Settings > API
4. Copy the following:
   - Project URL (for `NEXT_PUBLIC_SUPABASE_URL`)
   - anon/public key (for `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - service_role key (for `SUPABASE_SERVICE_ROLE_KEY`)

### 4. Production Environment Variables

For production deployment on Vercel, set these environment variables in your Vercel dashboard:

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

**Important**: The `NEXT_PUBLIC_SITE_URL` is crucial for email confirmation links to work correctly in production.

## Testing the AI Curriculum Generation

### 1. Start the Development Server

```bash
cd frontend
npm run dev
```

### 2. Test the Complete Flow

1. **Go to the onboarding page** (`http://localhost:3000/onboarding`)
2. **Fill out the form:**
   - Choose a subject (e.g., "AI for Business")
   - Provide your background information
   - Set your time availability
   - Select skill level and goals
3. **Click "Generate My Curriculum"**
4. **Watch the generation progress** - you should see:
   - Analyzing Your Profile
   - Calculating Optimal Structure
   - Generating Curriculum Content
   - Structuring Sessions
   - Finalizing Your Curriculum
5. **Review the generated curriculum** - you should see:
   - Curriculum overview with session count and type
   - Detailed session breakdown
   - Learning outcomes
6. **Approve the curriculum** - this will generate individual sessions

### 3. Expected Behavior

- **Generation Time**: 30-60 seconds for curriculum generation
- **Session Count**: Automatically calculated based on your time availability
- **Content Density**: Scales based on session length (light/moderate/intensive)
- **Curriculum Type**: Automatically determined (crash_course/standard/comprehensive/mastery)

## Troubleshooting

### Common Issues

1. **"OpenAI API Key not found"**
   - Make sure you've added `OPENAI_API_KEY` to your `.env.local`
   - Restart the development server after adding the key

2. **"Failed to generate curriculum"**
   - Check your OpenAI API key is valid
   - Ensure you have credits in your OpenAI account
   - Check the browser console for detailed error messages

3. **"Database error"**
   - Make sure you've run the database migration
   - Check your Supabase connection settings
   - Verify the `SUPABASE_SERVICE_ROLE_KEY` is correct

4. **"Unauthorized" errors**
   - Make sure you're logged in
   - Check your Supabase authentication setup

### Debug Mode

To see detailed logs, open your browser's developer console and look for:
- API request/response logs
- AI generation progress
- Database operation results

## Next Steps

Once the basic flow is working, you can:

1. **Customize the AI prompts** in `src/lib/ai.ts`
2. **Add more curriculum types** and content density options
3. **Implement session customization** features
4. **Add progress tracking** and completion features
5. **Integrate with the expert marketplace** (future feature)

## Support

If you encounter any issues:
1. Check the browser console for error messages
2. Verify all environment variables are set correctly
3. Ensure your OpenAI account has sufficient credits
4. Check that the database migration was applied successfully

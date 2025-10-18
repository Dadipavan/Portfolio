# Portfolio Database Migration Instructions

## Step 1: Run Database Schema in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `ijmgudtcveirnzijbgua`
3. Navigate to **SQL Editor** in the left sidebar
4. Create a new query and paste the SQL from `database/init.sql`
5. Click **Run** to execute the schema creation and data seeding

## Step 2: Verify Database Setup

After running the SQL, verify the tables were created:

1. Go to **Table Editor** in your Supabase dashboard
2. You should see two new tables:
   - `portfolio_data` (contains all portfolio sections)
   - `resumes` (for file management)

3. Check the `portfolio_data` table contains 9 rows:
   - personalInfo
   - technicalSkills
   - projects
   - experience
   - education
   - certifications
   - achievements
   - quickFacts
   - currentFocus

## Step 3: Test the Migration

1. **Deploy your changes** to Vercel (or test locally)
2. **Visit the homepage** - should load data from database
3. **Test admin forms**:
   - Go to `/admin` (password: TryPa$$wordDadi@6563or129)
   - Try updating personal info, skills, or projects
   - Changes should persist and appear on homepage

## Key Changes Made

### Database Schema
- ✅ Created `portfolio_data` table with JSONB columns for flexible data storage
- ✅ Seeded all default data from `src/lib/data.ts`
- ✅ Added proper indexes and RLS policies
- ✅ Set up automatic `updated_at` timestamps

### API Endpoints
- ✅ `/api/portfolio/data` - GET/POST for all portfolio data
- ✅ `/api/portfolio/sections` - POST for individual section updates
- ✅ Enhanced error handling and logging

### Data Manager
- ✅ Replaced localStorage with database API calls
- ✅ Added localStorage as backup/fallback
- ✅ Made all update operations async
- ✅ Maintained same interface for backward compatibility

### Admin Forms
- ✅ Updated all admin pages to use async database operations
- ✅ Added proper error handling and user feedback
- ✅ Made save operations await database responses

## Benefits
1. **Production Ready**: Data persists properly in deployed environment
2. **Scalable**: Database storage instead of browser limitations
3. **Reliable**: Server-side persistence with client-side fallback
4. **Consistent**: Same data across all devices and sessions

## Troubleshooting

If you encounter issues:

1. **Check Supabase logs**: Dashboard > Logs
2. **Verify environment variables** in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. **Check browser console** for error messages
4. **Test API endpoints** directly: `/api/portfolio/data`

The migration maintains all existing functionality while providing robust database persistence!
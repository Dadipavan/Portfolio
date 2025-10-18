# 🎯 **Supabase Cloud Storage Setup Guide**

Follow these steps to set up cloud storage for your resume files:

## 🚀 **Step 1: Create Supabase Project**

1. **Visit Supabase Dashboard**
   ```
   https://supabase.com/dashboard
   ```

2. **Create New Project**
   - Click "New Project"
   - Choose your organization
   - Enter project name: `sai-pavan-portfolio`
   - Set database password (save this securely)
   - Select region (choose closest to you)
   - Click "Create new project"

3. **Wait for Setup**
   - Project creation takes 2-3 minutes
   - You'll see a progress indicator

## 🔑 **Step 2: Get API Credentials**

1. **Navigate to API Settings**
   ```
   Dashboard > Settings > API
   ```

2. **Copy These Values:**
   - **Project URL**: `https://your-project-id.supabase.co`
   - **Anon/Public Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## 📦 **Step 3: Create Storage Bucket**

1. **Go to Storage**
   ```
   Dashboard > Storage
   ```

2. **Create New Bucket**
   - Click "New bucket"
   - Bucket name: `resumes`
   - Make it **Public**: ✅ (for direct downloads)
   - File size limit: `10 MB`
   - Allowed MIME types: 
     ```
     application/pdf
     application/msword
     application/vnd.openxmlformats-officedocument.wordprocessingml.document
     text/plain
     ```

3. **Configure Bucket Policies**
   ```sql
   -- Allow public read access
   CREATE POLICY "Public read access" ON storage.objects
   FOR SELECT USING (bucket_id = 'resumes');
   
   -- Allow authenticated upload
   CREATE POLICY "Authenticated upload" ON storage.objects
   FOR INSERT WITH CHECK (bucket_id = 'resumes');
   
   -- Allow authenticated delete
   CREATE POLICY "Authenticated delete" ON storage.objects
   FOR DELETE USING (bucket_id = 'resumes');
   ```

## ⚙️ **Step 4: Configure Environment Variables**

1. **Copy Environment File**
   ```bash
   cp .env.example .env.local
   ```

2. **Update .env.local with Your Values**
   ```bash
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://ijmgudtcveirnzijbgua.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqbWd1ZHRjdmVpcm56aWpiZ3VhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MTgxODIsImV4cCI6MjA3NjI5NDE4Mn0.PDykca8okpAp9t39-xRlRMbe0V3m0xSzbg8uWOljWlA
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqbWd1ZHRjdmVpcm56aWpiZ3VhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDcxODE4MiwiZXhwIjoyMDc2Mjk0MTgyfQ.nj8F8Q9zGxIK87HNhlNEClKZ1qZtaF5Fn4XgVVqyQ5M
   
   # Resume Storage
   NEXT_PUBLIC_RESUME_BUCKET=resumes
   
   # Admin Authentication (already configured)
   ADMIN_PASSWORD_HASH=$2a$12$existing_hash_here
   ```

## 🔒 **Step 5: Security Configuration**

1. **Set Row Level Security (RLS)**
   ```sql
   -- Enable RLS on storage.objects
   ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
   ```

2. **Configure CORS (if needed)**
   ```
   Dashboard > Settings > API > CORS
   ```
   Add your domain: `https://your-vercel-app.vercel.app`

## 🧪 **Step 6: Test Configuration**

1. **Restart Development Server**
   ```bash
   npm run dev
   ```

2. **Test Upload**
   - Go to `/admin`
   - Try uploading a resume
   - Check if it appears in Supabase Storage

3. **Test Download**
   - Click download on any resume
   - Verify file downloads correctly

## 📊 **Features You'll Get**

✅ **Cloud Storage**: Files stored securely in Supabase  
✅ **Global Access**: Download from anywhere with internet  
✅ **Automatic Fallback**: Local storage if cloud fails  
✅ **File Management**: Upload, download, delete operations  
✅ **Smart Migration**: Convert existing local files to cloud  
✅ **Size Limits**: 10MB per file with validation  
✅ **Format Support**: PDF, DOC, DOCX, TXT files  

## 🎯 **Next Steps**

After completing setup:

1. **Upload Test Resume**: Try uploading a file
2. **Verify Cloud Storage**: Check Supabase dashboard
3. **Test Downloads**: Ensure files download correctly
4. **Migration**: Run migration for existing local files

## 🆘 **Troubleshooting**

**Connection Issues:**
- Verify environment variables
- Check Supabase project status
- Ensure bucket exists and is public

**Upload Failures:**
- Check file size (max 10MB)
- Verify file format is supported
- Check browser console for errors

**Download Issues:**
- Verify bucket policies
- Check CORS configuration
- Ensure file exists in storage

---

**Ready to proceed? Create your Supabase project and share your credentials!** 🚀
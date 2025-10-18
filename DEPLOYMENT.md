# Production Deployment Guide

## File-Based Data Storage (Recommended for Portfolio)

Your portfolio now supports both development (localStorage) and production (JSON file) data storage.

### 🚀 **Deployment Options:**

## Option 1: Vercel (Recommended - Free)

1. **Deploy to Vercel:**
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Environment Variables:**
   - No database needed
   - Data stored in JSON files
   - Automatic deployments from GitHub

3. **Features:**
   - ✅ Free tier available
   - ✅ Automatic HTTPS
   - ✅ Global CDN
   - ✅ Git integration

## Option 2: Netlify

1. **Deploy to Netlify:**
   ```bash
   npm run build
   # Upload dist folder to Netlify
   ```

2. **Configuration:**
   - Build command: `npm run build`
   - Publish directory: `.next`

## Option 3: Railway/Render (For Database)

If you need a database later, these platforms offer:
- PostgreSQL databases
- Easy deployment
- Environment variables

### 🛠 **Current Data Flow:**

**Development:**
- Data stored in localStorage
- Instant updates
- Persists in browser

**Production:**
- Data stored in JSON files
- API endpoints handle CRUD operations
- File-based persistence

### 📁 **File Structure:**
```
data/
  portfolio.json     # All portfolio data
  README.md          # Documentation

src/api/
  portfolio-data/
    route.ts         # API endpoints for data management
```

### 🔧 **How It Works:**

1. **Admin Updates:** When you edit data in admin panel
2. **API Call:** Data sent to `/api/portfolio-data`
3. **File Storage:** JSON file updated on server
4. **Public Display:** Portfolio reads from same JSON file

### ✅ **Benefits:**

- **No Database Costs:** Free file-based storage
- **Simple Deployment:** No complex setup required
- **Fast Performance:** Direct file access
- **Easy Backup:** Just copy the JSON file
- **Version Control:** Data changes tracked in Git

### 🚨 **For High-Traffic Sites:**

If your portfolio gets heavy traffic, consider:
- **Supabase** (Free PostgreSQL)
- **PlanetScale** (Free MySQL)
- **MongoDB Atlas** (Free tier)

But for a personal portfolio, file-based storage is perfect!
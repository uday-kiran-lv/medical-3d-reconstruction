# 🚀 Quick Deploy Guide

## What Was Fixed

**Root Cause of 500 Error**: The backend was calling `process.exit(1)` when MongoDB connection failed. Vercel serverless functions cannot use `process.exit()` - they crash immediately with a 500 error.

## Critical Changes

### 1. Database Connection (server/src/config/database.js)
- ❌ OLD: `process.exit(1)` → Crashes serverless
- ✅ NEW: Return `false` → App continues running

### 2. Server Startup (server/src/index.js)  
- ❌ OLD: Synchronous DB connection call → Blocks startup
- ✅ NEW: Async background init → Server starts immediately

### 3. New Health Endpoint
- Endpoint: `GET /api/health`
- Returns actual database connection status
- Use for monitoring: `curl https://api-url/api/health`

## Pre-Deployment Checklist

### ✅ Code Changes
- [x] Fixed database.js (no process.exit)
- [x] Fixed index.js (async DB init)
- [x] Added favicon handling
- [x] Added health endpoint
- [x] Updated vercel.json

### ⚠️ Environment Variables (Do This Now!)
- [ ] Go to Vercel Dashboard → Select backend project
- [ ] Settings → Environment Variables
- [ ] Add: `MONGODB_URI=mongodb+srv://root:123@med.ynofzir.mongodb.net/medical_3d_db`
- [ ] Add: `NODE_ENV=production`
- [ ] Click "Save"

### ✅ Dependencies
- All dependencies already in package.json
- No additional npm install needed

## Deployment (Step by Step)

### Step 1: Deploy Backend
```bash
cd server
vercel deploy --prod
# Note the URL (e.g., https://medical-api-xyz.vercel.app)
```

### Step 2: Test Health Endpoint
```bash
curl https://your-api-url.vercel.app/api/health

# Should return:
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**If you get 500 error**: 
- Check Vercel logs: `vercel logs --prod`
- Verify MONGODB_URI is set in environment variables
- Ensure MongoDB Atlas allows 0.0.0.0/0 connections

### Step 3: Update Frontend
1. Go to Vercel Dashboard → Frontend project
2. Settings → Environment Variables  
3. Set `VITE_API_URL=https://your-api-url.vercel.app`
4. Save

### Step 4: Deploy Frontend
```bash
cd ../client
vercel deploy --prod
```

## Verify Deployment

✅ **Health Check**:
```bash
curl https://your-api.vercel.app/api/health
```
Should return status "ok" with database "connected"

✅ **Root Endpoint**:
```bash
curl https://your-api.vercel.app/
```
Should return API info

✅ **No Favicon Errors**:
Browser console should have no 404 errors

✅ **Frontend Works**:
- Frontend loads without errors
- API calls go to backend (check Network tab)
- Image upload/3D reconstruction works

## Troubleshooting

### 500 Error Still Appears
```bash
# Check what's happening
vercel logs --prod

# Most likely causes:
# 1. MONGODB_URI not set in environment variables
# 2. MongoDB doesn't allow Vercel IPs (set to 0.0.0.0/0)
# 3. Credentials incorrect

# Fix: Verify and redeploy
vercel deploy --prod
```

### CORS Errors
- Frontend and backend must be on same Vercel account
- Or set ALLOWED_ORIGINS in backend env vars

### Database Connection Timeout
- MongoDB Atlas → Network Access
- Allow 0.0.0.0/0 (all IPs)
- Wait 10 seconds first (first connection can be slow)

### Frontend Still Connects to Localhost
- Verify VITE_API_URL is set correctly
- Rebuild frontend: `vercel deploy --prod`
- Clear browser cache

## Success Looks Like

```bash
$ curl https://api.example.com/api/health
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

✅ No errors in Vercel logs  
✅ Health endpoint returns "connected"  
✅ Frontend loads and works  
✅ Image upload succeeds  
✅ 3D reconstruction completes  

---

## Important Notes

- **First Request**: May take 5-10 seconds (serverless cold start)
- **Database**: Connects in background, doesn't block startup
- **Health Endpoint**: Shows real-time database status
- **All Routes**: Work even if DB is temporarily connecting
- **Memory**: 1024MB per function (should be plenty)
- **Timeout**: 60 seconds per request (plenty for medical imaging)

---

## Timeline Estimate

1. **Environment Setup**: 2 minutes
2. **Backend Deploy**: 2-3 minutes
3. **Health Check**: 1 minute
4. **Frontend Update**: 2 minutes  
5. **Frontend Deploy**: 2-3 minutes
6. **Full Test**: 2-3 minutes

**Total**: ~15 minutes to full deployment ✨

---

## One-Liner Commands

```bash
# Deploy everything (from root directory)
cd server && vercel deploy --prod && cd ../client && vercel deploy --prod

# Check logs
vercel logs --prod

# Quick health check
curl $(vercel list | grep medical | awk '{print $2}')/api/health
```

---

**Status**: ✅ All code changes complete  
**Next**: Set environment variables in Vercel Dashboard and deploy

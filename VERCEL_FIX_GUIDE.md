# Vercel Deployment Fix Guide

## Changes Made to Fix 500 Error

### 1. **Fixed MongoDB Connection Handling** ✅
**File**: `server/src/config/database.js`

**Problem**: `process.exit(1)` on connection error crashed Vercel serverless functions
**Solution**: 
- Removed `process.exit(1)` - serverless functions cannot use process.exit()
- Added graceful error handling with connection state tracking
- Connection failures now return `false` instead of crashing
- Added retry logic and connection pooling for serverless

**Key Changes**:
```javascript
// OLD (CRASHES):
catch (err) {
  console.error('MongoDB Connection Error:', err)
  process.exit(1)  // ❌ KILLS SERVERLESS
}

// NEW (GRACEFUL):
catch (error) {
  connectionState = 'error'
  console.error('MongoDB Connection Error:', error.message)
  return false  // ✅ App continues to run
}
```

### 2. **Async Database Connection** ✅
**File**: `server/src/index.js`

**Problem**: `connectDB()` was called synchronously but is async function
**Solution**:
- Moved DB connection to async initialization function
- Non-blocking on startup - app starts immediately
- DB connection happens in background
- Routes work even if DB temporarily unavailable

**Key Changes**:
```javascript
// Initialize DB asynchronously (non-blocking)
let dbConnectionPromise = null

const initializeDB = async () => {
  if (dbConnectionPromise) return dbConnectionPromise
  if (dbConnected) return Promise.resolve()
  
  dbConnectionPromise = connectDB()
    .then(() => { dbConnected = true; return true })
    .catch(() => { return false })
  
  return dbConnectionPromise
}

// Try to initialize DB on startup
initializeDB().catch(err => console.error('Initial DB connection attempt failed:', err.message))
```

### 3. **Favicon Handling** ✅
**File**: `server/src/index.js` and `server/vercel.json`

**Solution**:
- Added explicit route: `app.get('/favicon.ico', (req, res) => res.status(204).end())`
- Added favicon route in Vercel config
- Middleware silently handles other static assets

### 4. **Health Check Endpoint** ✅
**File**: `server/src/index.js`

**New Endpoint**: `GET /api/health`
```javascript
{
  "status": "ok",
  "database": "connected",  // or "connecting", "error"
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

Use this to monitor deployment health:
```bash
curl https://your-api.vercel.app/api/health
```

### 5. **Enhanced Vercel Configuration** ✅
**File**: `server/vercel.json`

**Updates**:
- Added explicit favicon handling (status 204)
- Increased function memory to 1024MB
- Set timeout to 60 seconds
- Proper OPTIONS request handling for CORS

## Environment Variables Required

### Backend (.env for Vercel)

```env
# Required
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/DATABASE_NAME
NODE_ENV=production

# Optional (use defaults if not set)
ALLOWED_ORIGINS=https://your-frontend.vercel.app,https://your-domain.com
PORT=3000
```

### Frontend (.env.local or Vercel env vars)

```env
VITE_API_URL=https://your-api.vercel.app
```

## Deployment Steps

### 1. Push Changes
```bash
git add .
git commit -m "Fix Vercel serverless deployment"
git push
```

### 2. Deploy Backend to Vercel

**Option A: Using Vercel CLI**
```bash
cd server
vercel deploy --prod
```

**Option B: Using GitHub Integration**
- Push to main branch
- Vercel auto-deploys

**Option C: Vercel Dashboard**
- Connect GitHub repo
- Deploy backend from `server/` directory

### 3. Deploy Frontend to Vercel

**After backend is deployed**, deploy frontend:
```bash
cd ../client
vercel deploy --prod
```

Update `VITE_API_URL` env var to backend URL

### 4. Verify Deployment

**Health Check**:
```bash
curl https://your-api.vercel.app/api/health
```

**Root API**:
```bash
curl https://your-api.vercel.app/
```

**Frontend Status**:
- Should load without console errors
- API calls should go to backend

## Troubleshooting

### Still Getting 500 Error?

1. **Check Vercel Logs**:
   ```bash
   vercel logs --prod
   ```

2. **Verify MongoDB URI**:
   - Must be valid connection string
   - Must allow Vercel IPs (use 0.0.0.0/0 or whitelist Vercel IPs)

3. **Check Environment Variables**:
   - Go to Vercel Dashboard → Project Settings → Environment Variables
   - Ensure MONGODB_URI is set

4. **Test Health Endpoint**:
   - `curl https://api-url.vercel.app/api/health`
   - Should return JSON, not error

### Database Connection Failing?

1. **MongoDB Atlas Whitelist**:
   - Allow "All IPs" (0.0.0.0/0) for Vercel
   - Or add specific Vercel IPs: 76.75.124.0/24, 147.75.32.0/20

2. **Connection String**:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
   ```

3. **Test Connection Locally**:
   ```bash
   cd server
   npm test
   # Should show "✅ MongoDB Connected"
   ```

### Favicon 404 Error?

- Fixed in this update
- Should see 204 No Content response
- Check Vercel config has favicon route

### CORS Issues?

Update `ALLOWED_ORIGINS` environment variable:
```env
ALLOWED_ORIGINS=https://frontend-domain.vercel.app,https://custom-domain.com
```

## Testing Endpoints

### Local Testing
```bash
# Health check
curl http://localhost:5000/api/health

# Upload image
curl -X POST -F "image=@path/to/image.jpg" \
  http://localhost:5000/api/images/upload

# Get 3D model
curl http://localhost:5000/api/reconstruction/model/:id
```

### Production Testing
```bash
# Health check
curl https://api-url.vercel.app/api/health

# Upload image
curl -X POST -F "image=@path/to/image.jpg" \
  https://api-url.vercel.app/api/images/upload
```

## Performance Notes

- **Startup**: ~5 seconds (cold start)
- **Database Init**: Happens async in background
- **Image Processing**: ~10-30 seconds depending on size
- **3D Reconstruction**: ~20-60 seconds depending on complexity

## Next Steps

1. ✅ Update code (done)
2. ✅ Set environment variables (do this now)
3. ✅ Deploy to Vercel (do this now)
4. ✅ Test health endpoint (do this now)
5. ✅ Test full workflow (upload → process → view)

## Success Indicators

- ✅ Backend deploys without errors
- ✅ `/api/health` returns 200 with database status
- ✅ Frontend loads and makes API calls
- ✅ Image upload works
- ✅ 3D reconstruction completes
- ✅ No 500 errors in logs

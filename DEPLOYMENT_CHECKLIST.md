# Deployment Checklist

## Pre-Deployment ✅

- [ ] All code changes committed
- [ ] `.env` files configured with correct MongoDB URI
- [ ] MongoDB Atlas allows Vercel IP ranges (0.0.0.0/0 or specific Vercel IPs)
- [ ] `server/src/config/database.js` updated (no process.exit)
- [ ] `server/src/index.js` updated (async DB init)
- [ ] `server/vercel.json` updated with function config
- [ ] `server/package.json` has all dependencies

## Environment Variables Setup

### Backend (server/.env and Vercel Dashboard)

**Required**:
```
MONGODB_URI=mongodb+srv://root:123@med.ynofzir.mongodb.net/medical_3d_db
NODE_ENV=production
```

**Optional** (for custom origins):
```
ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

### Frontend (client/.env.local and Vercel Dashboard)

**Required**:
```
VITE_API_URL=https://your-backend-api.vercel.app
```

## Deployment Steps

### Step 1: Deploy Backend

```bash
# From server directory
cd server

# Deploy to Vercel
vercel deploy --prod

# Note the API URL (e.g., https://medical-api.vercel.app)
```

### Step 2: Verify Backend

```bash
# Test health endpoint
curl https://your-api-url.vercel.app/api/health

# Expected response:
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2024-01-15T..."
}
```

### Step 3: Update Frontend API URL

1. Go to Vercel Dashboard
2. Select frontend project
3. Settings → Environment Variables
4. Set `VITE_API_URL` to backend URL from Step 1

### Step 4: Deploy Frontend

```bash
# From client directory
cd ../client

# Deploy to Vercel
vercel deploy --prod
```

### Step 5: Verify Complete Workflow

1. Open frontend URL in browser
2. Check console for no API errors
3. Upload a medical image
4. Verify 3D reconstruction works
5. Check Vercel logs for any errors

## Rollback Plan

If deployment has issues:

```bash
# View previous deployments
vercel list

# Rollback to previous version
vercel rollback
```

## Monitoring

### Check Logs
```bash
# Real-time logs
vercel logs --follow

# Production logs
vercel logs --prod
```

### Key Metrics to Monitor
- [ ] Health endpoint response time
- [ ] Database connection status
- [ ] Image upload success rate
- [ ] Reconstruction completion time
- [ ] Error rate (should be 0%)

## Success Criteria

- ✅ Health endpoint returns "connected"
- ✅ No 500 errors in production
- ✅ Image upload to 3D reconstruction works
- ✅ No CORS errors
- ✅ No favicon 404 errors
- ✅ Frontend and backend communicate successfully

## Quick Fixes

### If 500 Error Returns
1. Check Vercel logs: `vercel logs --prod`
2. Verify MONGODB_URI env var is set
3. Verify MongoDB allows 0.0.0.0/0 IP access
4. Redeploy: `vercel deploy --prod`

### If CORS Error
1. Verify `ALLOWED_ORIGINS` includes frontend domain
2. Check if OPTIONS request is handled
3. Redeploy backend

### If No Database Connection
1. Test MongoDB connection string locally
2. Verify cluster allows 0.0.0.0/0
3. Check credentials are correct
4. Wait 5-10 seconds (first connection can be slow)

## Important Notes

- First request may take 5-10 seconds (serverless cold start)
- Database connects in background (app doesn't wait)
- Health endpoint shows actual database status
- All requests work even if DB is connecting
- Memory limit: 1024MB per function
- Timeout: 60 seconds per request

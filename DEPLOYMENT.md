# Medical 3D Reconstruction - Vercel Deployment Guide

This guide explains how to deploy the Medical 3D Reconstruction application to Vercel with separate frontend and backend deployments.

## 📁 Project Structure

```
medical-3d-reconstruction/
├── client/                 # Frontend (React + Vite + Three.js)
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vercel.json         # Vercel config for frontend
│   ├── vite.config.js
│   └── .env.example
│
├── server/                 # Backend (Node.js + Express + MongoDB)
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── index.js
│   ├── package.json
│   ├── vercel.json         # Vercel config for backend
│   └── .env.example
│
└── README.md
```

## 🚀 Deployment Steps

### Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Push your code to GitHub
3. **MongoDB Atlas**: Create a free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)

---

## Step 1: Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a free cluster
3. Create a database user with password
4. Get your connection string:
   ```
   mongodb+srv://<username>:<password>@cluster.mongodb.net/medical_3d_db?retryWrites=true&w=majority
   ```
5. Add `0.0.0.0/0` to IP Whitelist (for Vercel serverless functions)

---

## Step 2: Deploy Backend to Vercel

### Option A: Using Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. **Configure the project:**
   - **Root Directory**: `server`
   - **Framework Preset**: Other
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: (leave empty)

4. **Add Environment Variables:**
   | Variable | Value |
   |----------|-------|
   | `MONGODB_URI` | Your MongoDB Atlas connection string |
   | `NODE_ENV` | `production` |
   | `ALLOWED_ORIGINS` | `https://your-frontend-app.vercel.app` (update after frontend deploy) |

5. Click **Deploy**

### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to server folder
cd server

# Deploy
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name? medical-3d-api
# - Which directory? ./
# - Override settings? No

# After deployment, set environment variables:
vercel env add MONGODB_URI
vercel env add NODE_ENV
vercel env add ALLOWED_ORIGINS

# Redeploy to apply environment variables
vercel --prod
```

**Backend URL**: Copy your backend URL (e.g., `https://medical-3d-api.vercel.app`)

---

## Step 3: Deploy Frontend to Vercel

### Option A: Using Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the same GitHub repository (create a new project)
3. **Configure the project:**
   - **Root Directory**: `client`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. **Add Environment Variables:**
   | Variable | Value |
   |----------|-------|
   | `VITE_API_URL` | Your backend URL (e.g., `https://medical-3d-api.vercel.app`) |
   | `VITE_APP_NAME` | `Medical 3D Reconstruction` |

5. Click **Deploy**

### Option B: Using Vercel CLI

```bash
# Navigate to client folder
cd client

# Deploy
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name? medical-3d-app
# - Which directory? ./
# - Override settings? No

# After deployment, set environment variables:
vercel env add VITE_API_URL
# Enter: https://your-backend-url.vercel.app

# Redeploy to apply environment variables
vercel --prod
```

---

## Step 4: Update CORS Settings

After both deployments are complete:

1. Go to your **Backend** project in Vercel Dashboard
2. Go to **Settings** → **Environment Variables**
3. Update `ALLOWED_ORIGINS` to include your frontend URL:
   ```
   https://medical-3d-app.vercel.app,https://your-custom-domain.com
   ```
4. **Redeploy** the backend for changes to take effect

---

## 🔧 Environment Variables Reference

### Backend (`server/.env`)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `MONGODB_URI` | ✅ | MongoDB connection string | `mongodb+srv://...` |
| `NODE_ENV` | ✅ | Environment mode | `production` |
| `PORT` | ❌ | Server port (local only) | `5000` |
| `ALLOWED_ORIGINS` | ✅ | Allowed CORS origins (comma-separated) | `https://app.vercel.app` |

### Frontend (`client/.env`)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_API_URL` | ✅ | Backend API URL | `https://api.vercel.app` |
| `VITE_APP_NAME` | ❌ | App display name | `Medical 3D Reconstruction` |

---

## 🔄 Automatic Deployments

Once connected to GitHub, Vercel will automatically:
- Deploy on every push to `main` branch
- Create preview deployments for pull requests
- Roll back on deployment failures

---

## 🐛 Troubleshooting

### Backend Issues

**MongoDB Connection Failed**
- Verify `MONGODB_URI` is correct
- Check IP whitelist in MongoDB Atlas (add `0.0.0.0/0`)
- Ensure database user has read/write permissions

**CORS Errors**
- Verify `ALLOWED_ORIGINS` includes frontend URL
- Check for trailing slashes in URLs
- Redeploy after updating environment variables

**500 Server Errors**
- Check Vercel Functions logs in dashboard
- Verify all environment variables are set
- Check MongoDB Atlas connection limits

### Frontend Issues

**API Connection Failed**
- Verify `VITE_API_URL` is correct (no trailing slash)
- Check browser console for CORS errors
- Ensure backend is deployed and running

**Build Failures**
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check for TypeScript/ESLint errors
- Verify all dependencies are in `package.json`

---

## 📊 Monitoring

### Vercel Dashboard
- View deployment logs
- Monitor function invocations
- Check bandwidth usage

### MongoDB Atlas
- Monitor database connections
- View slow queries
- Check storage usage

---

## 🔗 Quick Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **MongoDB Atlas**: https://cloud.mongodb.com
- **Vercel Docs**: https://vercel.com/docs
- **Vite Docs**: https://vitejs.dev

---

## 📝 Post-Deployment Checklist

- [ ] Backend deployed and health check passes (`/api/health`)
- [ ] Frontend deployed and accessible
- [ ] CORS configured correctly
- [ ] MongoDB connected successfully
- [ ] Image upload working
- [ ] 3D reconstruction working
- [ ] Custom domain configured (optional)

---

## 🎉 Your URLs

After deployment, your app will be available at:

- **Frontend**: `https://medical-3d-app.vercel.app`
- **Backend**: `https://medical-3d-api.vercel.app`
- **API Health**: `https://medical-3d-api.vercel.app/api/health`

Replace with your actual Vercel URLs!

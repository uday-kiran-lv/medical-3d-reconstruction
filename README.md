# 🏥 Medical 3D Reconstruction

> **AI-Powered 2D to 3D Medical Image Reconstruction Application**

An advanced full-stack web application that converts 2D medical images into interactive 3D reconstructions using cutting-edge AI and WebGL visualization technology.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green.svg)](https://www.mongodb.com/)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Local Development](#-local-development)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

- 🖼️ **Image Upload & Processing** - Upload 2D medical images (DICOM, PNG, JPG)
- 🤖 **AI Reconstruction** - Advanced algorithms convert 2D images to 3D models
- 🎨 **Interactive 3D Viewer** - Rotate, zoom, and explore reconstructed models in real-time
- 💾 **Result Storage** - Save and retrieve previous reconstructions
- 🔐 **User Authentication** - Secure account management and data privacy
- 📊 **Processing Status** - Real-time progress tracking for reconstructions
- ☁️ **Cloud Deployment** - Ready for Vercel serverless deployment
- 🌙 **Responsive Design** - Works seamlessly on desktop and tablet devices

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Next-generation build tool
- **Three.js** - 3D graphics library
- **React Three Fiber** - React renderer for Three.js
- **Tailwind CSS** - Utility-first CSS framework
- **React Dropzone** - File upload component

### Backend
- **Node.js 18+** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **CORS** - Cross-origin resource sharing

### Deployment
- **Vercel** - Frontend and serverless backend hosting
- **MongoDB Atlas** - Cloud database service
- **GitHub** - Version control

---

## 🏗️ Project Structure

```
medical-3d-reconstruction/
├── client/                          # React Frontend
│   ├── public/                      # Static assets
│   ├── src/
│   │   ├── components/              # React components
│   │   ├── hooks/                   # Custom hooks
│   │   ├── utils/                   # Utilities
│   │   └── styles/                  # CSS files
│   └── package.json
├── server/                          # Express Backend
│   ├── src/
│   │   ├── config/                  # Configuration
│   │   ├── controllers/             # Route handlers
│   │   ├── middleware/              # Middleware
│   │   ├── models/                  # DB models
│   │   ├── routes/                  # API routes
│   │   └── index.js
│   └── package.json
└── DEPLOYMENT.md
```

---

## 📋 Prerequisites

- **Node.js** v18+ ([Download](https://nodejs.org/))
- **npm** v9+ or **yarn**
- **Git** ([Download](https://git-scm.com/))
- **MongoDB Atlas** ([Sign up](https://www.mongodb.com/atlas))

---

## 💻 Installation

### 1. Clone Repository

```bash
git clone https://github.com/uday-kiran-lv/medical-3d-reconstruction.git
cd medical-3d-reconstruction
```

### 2. Setup Backend

```bash
cd server
npm install
```

Create `.env`:
```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/medical_3d_db
NODE_ENV=development
PORT=5000
ALLOWED_ORIGINS=http://localhost:5173
```

### 3. Setup Frontend

```bash
cd ../client
npm install
```

Create `.env`:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 🚀 Local Development

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

Open: `http://localhost:5173`

---

## 📡 API Documentation

**Base URL:** `http://localhost:5000/api`

### Image Upload
```http
POST /api/images/upload
Content-Type: multipart/form-data
```

### Start Reconstruction
```http
POST /api/reconstructions/start
```

### Get Results
```http
GET /api/reconstructions/:id/result
```

---

## 🌐 Deployment

1. **Deploy Backend** to Vercel with root directory `server`
2. **Deploy Frontend** to Vercel with root directory `client`
3. Set environment variables in both projects

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed steps.

---

## 🆘 Troubleshooting

**MongoDB Connection Error:**
- Check connection string in `.env`
- Allow `0.0.0.0/0` in MongoDB Atlas whitelist

**Port Already in Use:**
- Change PORT in `.env` or run: `lsof -i :5000`

**CORS Errors:**
- Update `ALLOWED_ORIGINS` in server `.env`

---

## 🤝 Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m 'Add feature'`
4. Push: `git push origin feature/my-feature`
5. Open Pull Request

---

## 📝 License

MIT License - See [LICENSE](./LICENSE)

---

**Last Updated:** January 9, 2026 | **Version:** 1.0.0

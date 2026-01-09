# Medical 3D Reconstruction - Backend API

Express.js backend API for the AI-Powered 2D to 3D Body Organ Reconstruction Application.

## Tech Stack

- Node.js
- Express.js
- MongoDB / Mongoose
- CORS enabled for cross-origin requests

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- MongoDB (local or Atlas)

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
MONGODB_URI=your_mongodb_connection_string
PORT=5000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000
```

### Development

```bash
npm run dev
```

The server will run at `http://localhost:5000`

### Production

```bash
npm start
```

## Deployment to Vercel

1. Push this folder to a GitHub repository
2. Import the project in Vercel
3. Set the environment variables:
   - `MONGODB_URI` = Your MongoDB Atlas connection string
   - `NODE_ENV` = production
   - `ALLOWED_ORIGINS` = Your deployed frontend URL (e.g., `https://your-frontend.vercel.app`)
4. Deploy

## API Endpoints

### Health Check
- `GET /api/health` - API health status

### Images
- `POST /api/images/upload` - Upload image metadata
- `GET /api/images/status/:imageId` - Get image status with reconstruction result

### Reconstruction
- `POST /api/reconstruction/start` - Start 3D reconstruction processing
- `GET /api/reconstruction/:id` - Get reconstruction result by ID

## Project Structure

```
server/
├── src/
│   ├── config/
│   │   ├── index.js          # App configuration
│   │   └── database.js       # MongoDB connection
│   ├── controllers/
│   │   ├── imageController.js
│   │   ├── reconstructionController.js
│   │   └── index.js
│   ├── middleware/
│   │   ├── errorHandler.js
│   │   └── index.js
│   ├── models/
│   │   ├── User.js
│   │   ├── MedicalImage.js
│   │   ├── ReconstructionResult.js
│   │   ├── Log.js
│   │   ├── SystemSetting.js
│   │   └── index.js
│   ├── routes/
│   │   ├── imageRoutes.js
│   │   ├── reconstructionRoutes.js
│   │   └── index.js
│   └── index.js              # Server entry point
├── .env.example
├── package.json
├── vercel.json
└── README.md
```

## Connecting Frontend

After deploying both frontend and backend:

1. Get your backend Vercel URL (e.g., `https://medical-3d-api.vercel.app`)
2. In your frontend Vercel project, add environment variable:
   - `VITE_API_URL` = `https://medical-3d-api.vercel.app`
3. In your backend Vercel project, update:
   - `ALLOWED_ORIGINS` = `https://your-frontend.vercel.app`
4. Redeploy both projects

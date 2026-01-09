# Medical 3D Reconstruction - Frontend

React-based frontend for the AI-Powered 2D to 3D Body Organ Reconstruction Application.

## Tech Stack

- React 18
- Vite
- Three.js / React Three Fiber
- Tailwind CSS
- Lucide React Icons

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build

```bash
npm run build
```

### Environment Variables

Create a `.env.local` file based on `.env.example`:

```env
VITE_API_URL=http://localhost:5000
```

After deploying the backend, update `VITE_API_URL` with your backend URL.

## Deployment to Vercel

1. Push this folder to a GitHub repository
2. Import the project in Vercel
3. Set the environment variable:
   - `VITE_API_URL` = Your deployed backend URL (e.g., `https://your-backend.vercel.app`)
4. Deploy

## Project Structure

```
client/
├── public/
├── src/
│   ├── assets/images/
│   ├── components/
│   │   ├── common/
│   │   ├── features/
│   │   │   ├── upload/
│   │   │   ├── viewer/
│   │   │   ├── reconstruction/
│   │   │   └── processing/
│   │   └── layout/
│   ├── hooks/
│   ├── styles/
│   ├── utils/
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── vercel.json
└── README.md
```

## Features

- Upload medical images (CT, MRI, X-ray, Ultrasound)
- Support for DICOM, NIFTI, JPEG, PNG formats
- Interactive image viewer with zoom, pan, rotate
- Real-time processing status
- Interactive 3D model viewer
- Region of Interest (ROI) selection

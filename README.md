# 🥗 NutriTrack — AI-Powered Nutrition Tracker

> A full-stack nutrition tracking application with AI food detection, personalized diet planning, BMI analysis, an intelligent chatbot, and weekly PDF reports.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the App](#running-the-app)
- [API Endpoints](#-api-endpoints)
- [Screenshots](#-screenshots)
- [License](#-license)

---

## 🌟 Overview

NutriTrack helps users monitor their daily nutrition intake, analyze food through AI-powered image recognition, track macronutrients, calculate BMI, and get personalized diet recommendations — all from a clean, responsive dashboard.

---

## ✨ Features

### 🔐 Authentication
- JWT-based registration and login
- Protected routes on both frontend and backend
- Persistent sessions via `localStorage`

### 📊 Dashboard
- Real-time daily calorie progress bar (consumed vs. target)
- Macronutrient breakdown (Protein, Carbs, Fats) with stacked overview bar
- BMI card with SVG gauge and health category badge
- Shimmer skeleton loader during data fetch
- Dismissible alert notifications (success / error)

### 📸 AI Food Analysis
- Drag-and-drop image upload (JPEG, PNG, WebP — max 5 MB)
- Image storage via **Cloudinary**
- AI food identification and nutrition data via **Spoonacular API**
- Detection confidence bar
- One-click "Save to Daily Log" button

### 🗓️ Food Logging
- Manual food log entries (name, calories, protein, carbs, fats)
- Full CRUD operations with today's log table
- Empty state UI when no entries exist

### 🧮 BMI Calculator
- Auto-calculated from user's weight and height
- Categories: Underweight · Normal · Overweight · Obese
- Color-coded badge and actionable health suggestion

### 🥦 Diet Planner
- Personalized calorie goal based on weight, height, age, and goal
- Supported goals: Lose Weight · Gain Muscle · Maintain · Eat Healthy
- Macro target breakdown (protein / carbs / fats in grams)

### 🤖 NutriBot Chatbot
- Floating widget available on all authenticated pages
- Rule-based engine covering 20+ nutrition topics
- Quick-suggestion chips, typing animation, unread badge
- Supports bold markdown rendering in responses

### 📄 PDF Weekly Report
- Download a formatted A4 PDF report with one click
- Includes: daily breakdown table, macro totals, summary cards
- Streamed directly — no temp files saved on the server

### 👤 Profile Management
- Edit name, age, weight, height, and goal
- Profile updates auto-recalculate calorie and macro targets
- `AuthContext` keeps user state synced globally

---

## 🛠️ Tech Stack

| Layer        | Technology                                      |
|--------------|-------------------------------------------------|
| **Frontend** | React 18, Vite, React Router v6, Axios          |
| **Styling**  | Vanilla CSS (CSS custom properties, no Tailwind)|
| **Backend**  | Node.js, Express.js                             |
| **Database** | MongoDB, Mongoose                               |
| **Auth**     | JSON Web Tokens (JWT), bcryptjs                 |
| **File Upload** | Multer, Cloudinary                           |
| **AI / APIs**| Spoonacular (food detection & nutrition data)   |
| **PDF**      | PDFKit (server-side streaming)                  |
| **Dev Tools**| Nodemon, Vite HMR, dotenv                       |

---

## 📁 Project Structure

```
fullstackP/
├── controllers/
│   ├── authController.js        # Register, login, profile, BMI
│   ├── dashboardController.js   # Daily summary with BMI injection
│   ├── foodLogController.js     # CRUD for daily food entries
│   ├── uploadController.js      # Cloudinary + Spoonacular analysis
│   ├── chatController.js        # NutriBot rule-based responses
│   └── reportController.js      # Weekly PDF generation
│
├── models/
│   ├── User.js
│   └── FoodLog.js
│
├── routes/
│   ├── authRoutes.js            # /api/auth
│   ├── dashboardRoutes.js       # /api/dashboard
│   ├── foodLogRoutes.js         # /api/logs
│   ├── uploadRoutes.js          # /api/upload
│   ├── chatRoutes.js            # /api/chat
│   └── reportRoutes.js          # /api/report
│
├── middleware/
│   └── authMiddleware.js        # JWT protect middleware
│
├── utils/
│   └── dietCalculator.js        # Calorie/macro/BMI calculations
│
├── client/                      # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Alert.jsx        # Reusable dismissible alert
│   │   │   ├── Spinner.jsx      # Reusable spinner (sm/md/lg)
│   │   │   ├── EmptyState.jsx   # Reusable empty state
│   │   │   ├── PageLoader.jsx   # Shimmer skeleton loader
│   │   │   └── Chatbot.jsx      # NutriBot floating widget
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── FoodUpload.jsx
│   │   ├── services/
│   │   │   ├── api.js           # Axios instance + interceptors
│   │   │   ├── authService.js
│   │   │   ├── dashboardService.js
│   │   │   ├── foodLogService.js
│   │   │   ├── uploadService.js
│   │   │   └── reportService.js
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # Global auth state
│   │   ├── App.jsx
│   │   └── index.css
│   └── vite.config.js
│
├── server.js
├── package.json
└── .env
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+ and **npm** v9+
- **MongoDB** (local instance or [MongoDB Atlas](https://www.mongodb.com/atlas))
- **Cloudinary** account (free tier works)
- **Spoonacular** API key (free tier: 150 req/day)

---

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/your-username/nutritrack.git
cd nutritrack
```

**2. Install backend dependencies**
```bash
npm install
```

**3. Install frontend dependencies**
```bash
cd client
npm install
cd ..
```

---

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server
PORT=5000
CLIENT_URL=http://localhost:5173

# MongoDB
MONGO_URI=mongodb://localhost:27017/nutritrack

# JWT
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Spoonacular
SPOONACULAR_API_KEY=your_spoonacular_key
```

> ⚠️ Never commit your `.env` file. It is already listed in `.gitignore`.

---

### Running the App

**Start the backend (from root):**
```bash
npm run dev
# Server runs on http://localhost:5000
```

**Start the frontend (in a new terminal):**
```bash
cd client
npm run dev
# App runs on http://localhost:5173
```

The Vite dev server proxies all `/api` requests to `http://localhost:5000`, so no CORS issues during development.

---

## 📡 API Endpoints

All protected routes require the header:
```
Authorization: Bearer <token>
```

### Auth — `/api/auth`

| Method | Endpoint              | Auth | Description                         |
|--------|-----------------------|------|-------------------------------------|
| POST   | `/api/auth/register`  | ✗    | Register new user                   |
| POST   | `/api/auth/login`     | ✗    | Login and receive JWT               |
| GET    | `/api/auth/profile`   | ✓    | Get authenticated user profile      |
| PUT    | `/api/auth/profile`   | ✓    | Update user profile                 |
| GET    | `/api/auth/bmi`       | ✓    | Get BMI, category, and suggestion   |

### Dashboard — `/api/dashboard`

| Method | Endpoint                    | Auth | Description                              |
|--------|-----------------------------|------|------------------------------------------|
| GET    | `/api/dashboard/today`      | ✓    | Today's calorie/macro summary + BMI      |

### Food Logs — `/api/logs`

| Method | Endpoint          | Auth | Description                    |
|--------|-------------------|------|--------------------------------|
| GET    | `/api/logs`       | ✓    | Get all logs for today         |
| POST   | `/api/logs`       | ✓    | Add a new food log entry       |
| DELETE | `/api/logs/:id`   | ✓    | Delete a food log entry        |

### Food Upload & Analysis — `/api/upload`

| Method | Endpoint        | Auth | Description                                   |
|--------|-----------------|------|-----------------------------------------------|
| POST   | `/api/upload`   | ✓    | Upload image → Cloudinary + Spoonacular AI    |

### NutriBot Chat — `/api/chat`

| Method | Endpoint       | Auth | Description                          |
|--------|----------------|------|--------------------------------------|
| POST   | `/api/chat`    | ✓    | Send message, receive bot response   |

### Report — `/api/report`

| Method | Endpoint              | Auth | Description                            |
|--------|-----------------------|------|----------------------------------------|
| GET    | `/api/report/weekly`  | ✓    | Stream weekly PDF report download      |

---

### Example API Requests

**Register:**
```json
POST /api/auth/register
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "secret123",
  "age": 28,
  "weight": 65,
  "height": 168,
  "goal": "lose_weight"
}
```

**Add Food Log:**
```json
POST /api/logs
Authorization: Bearer <token>
{
  "foodName": "Grilled Chicken",
  "calories": 320,
  "protein": 42,
  "carbs": 0,
  "fats": 14
}
```

---

## 📸 Screenshots

| Page | Description |
|------|-------------|
| **Dashboard** | Calorie progress bar, macro panel, BMI gauge |
| **Food Analyzer** | Drag-and-drop upload, AI detection result |
| **Login / Register** | Clean auth forms with inline spinner |
| **PDF Report** | Weekly A4 report with daily breakdown table |

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>Built with ❤️ using React, Node.js, and MongoDB</p>
  <p><strong>NutriTrack</strong> — Track smarter. Eat better.</p>
</div>

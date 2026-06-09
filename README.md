<<<<<<< HEAD
# 🎬 Cinema Universe v2.0

A full-stack movie search web application with admin dashboard, download permission control, responsive design, and automatic cache clearing.

---

## ⚡ Quick Start

### 1. Set your MongoDB password

Open `server/.env` and replace `YOUR_PASSWORD`:

```
MONGODB_URI=mongodb+srv://aniket8204:YOUR_PASSWORD@cluster0.rfawosm.mongodb.net/moviedb?appName=Cluster0
```

### 2. Install dependencies

```bash
# From the root cinema-universe/ folder:
npm run install:all

# Or manually:
cd server && npm install
cd ../client && npm install
```

### 3. Start the backend

```bash
cd server
npm start
# → Server runs on http://localhost:5000
# → MongoDB connects and seeds 12 movies + default admin
```

### 4. Start the frontend

```bash
# In a new terminal:
cd client
npm run dev
# → App runs on http://localhost:3000
```

---

## 🔐 Admin Access

Click the **"Admin →"** button in the top-right corner.

| Field    | Value                  |
|----------|------------------------|
| Email    | `admin@mob.com`    |
| Password | `admin`             |

---

## 🎬 Features

### User Side
- **Hero search** — find movies by title, director, cast, or description
- **Genre filter** — Action, Drama, Sci-Fi, Horror, etc.
- **Sort options** — Newest, Top Rated, Most Viewed, A–Z, Latest Year
- **Movie cards** — poster, rating badge, genre tags, download indicator
- **Detail modal** — full info including cast, duration, language, views
- **Download button** — visible only when admin has enabled download for that movie
- **Pagination** — 12 movies per page
- **Fully responsive** — works on mobile, tablet, and desktop
- **Auto cache clear** — outdated cache cleared on every page load

### Admin Dashboard
- **Overview tab**
  - Stats: total movies, active, archived, downloadable count, total views
  - Top 5 movies by views
  - Genre distribution bar chart
- **Movies tab**
  - Full movie table with search
  - Edit movie details (title, year, director, cast, genres, categories, poster, rating…)
  - **Download toggle** — enable/disable download per movie (inline switch)
  - **Download URL** — set a custom download link per movie
  - Archive / Activate toggle
  - Delete movie permanently
  - Add new movie with full form

---

## 🏗️ Tech Stack

| Layer    | Tech                               |
|----------|------------------------------------|
| Frontend | React 18, Vite, custom CSS-in-JS   |
| Backend  | Node.js, Express 5                 |
| Database | MongoDB Atlas via Mongoose         |
| Auth     | JWT (jsonwebtoken) + bcryptjs      |
| Fonts    | Bebas Neue + DM Sans (Google)      |

---

## 📁 Project Structure

```
cinema-universe/
├── package.json              ← Root scripts
├── README.md
├── server/
│   ├── .env                  ← MongoDB URI + JWT secret
│   ├── index.js              ← Express app + seed logic + cache endpoint
│   ├── models/
│   │   ├── Movie.js          ← Movie schema (includes downloadable, downloadUrl, categories)
│   │   └── Admin.js          ← Admin schema with bcrypt
│   ├── routes/
│   │   ├── movies.js         ← Public + admin movie routes incl. download toggle
│   │   └── auth.js           ← Login / register
│   └── middleware/
│       └── auth.js           ← JWT verification
└── client/
    ├── index.html            ← Bebas Neue + DM Sans fonts loaded
    ├── vite.config.js
    └── src/
        ├── main.jsx          ← React entry point
        └── App.jsx           ← Full app (all components, auto cache clear)
```

---

## 🔌 API Reference

### Public Endpoints
| Method | Route             | Description                          |
|--------|-------------------|--------------------------------------|
| GET    | `/api/movies`     | List/search movies (paginated)       |
| GET    | `/api/movies/:id` | Get single movie (increments views)  |
| POST   | `/api/cache/clear`| Clear outdated server-side cache     |

**Query params for `/api/movies`:** `search`, `genre`, `category`, `year`, `page`, `limit`, `sort`

### Admin Endpoints (require `Authorization: Bearer <token>`)
| Method | Route                       | Description               |
|--------|-----------------------------|---------------------------|
| GET    | `/api/movies/admin/all`     | All movies (any status)   |
| GET    | `/api/movies/admin/stats`   | Dashboard stats           |
| POST   | `/api/movies`               | Create movie              |
| PUT    | `/api/movies/:id`           | Update movie              |
| DELETE | `/api/movies/:id`           | Delete movie              |
| PATCH  | `/api/movies/:id/status`    | Toggle active/archive     |
| PATCH  | `/api/movies/:id/download`  | Toggle download permission|
| POST   | `/api/auth/login`           | Admin login → JWT         |
| POST   | `/api/auth/register`        | Create new admin          |

---

## 🆕 What's New in v2.0

- ✅ **Download permission control** — admin toggle per movie; download button visible to users only when enabled
- ✅ **Download URL field** — admins can set a custom download link per movie
- ✅ **Auto cache clearing** — client-side localStorage cache + server-side cache cleared on app load
- ✅ **Fully responsive** — optimised layouts for mobile (≥320px), tablet, and desktop
- ✅ **Categories** — additional classification beyond genres (Blockbuster, Classic, Cult, etc.)
- ✅ **Downloadable stat card** — admin overview shows count of downloadable movies
- ✅ **Bebas Neue / DM Sans** typography — distinctive cinematic aesthetic
- ✅ **Inline download toggle** — fast switch in admin movie table without opening edit modal
=======
# cinemamovie
>>>>>>> b00b5c7cff68fa72bdf2473e7a8b48095b95de8d

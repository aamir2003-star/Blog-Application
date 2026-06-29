# Writen | Share Your Engineering Voice

Writen is a multi-user engineering blog platform built using **Next.js** for the frontend and **Node.js/Express** with **MongoDB** for the backend. It features a sleek, responsive design system, secure session persistence using First-Party cookies, Google/GitHub OAuth, read-time tracking metrics, PDF export, and robust transaction/verification handling.

---

## 🚀 Key Features

* **🎨 Rich Responsive UI:** Built with custom design tokens matching a modern, premium engineering blog layout.
* **🛡️ Secure Auth & Session Persistence:** Incorporates a Dual-Token authentication flow (15-min Access Tokens & 7-day HttpOnly Refresh Tokens) that persists across page refreshes.
* **🌐 Custom API Route Proxy:** Custom Serverless Route Handler Proxy (`/api/*`) on Next.js to forward HTTP cookies securely without cross-domain browser blocking or Vercel Edge header stripping.
* **🔐 Multi-provider Login:** Fully supports Email/Password with OTP verification, Google Social Login (One-Tap & redirect), and GitHub Social Login.
* **⚡ Telemetry & Analytics:** Real-time user metrics recording unique views, scroll depth, and total read time.
* **📄 PDF Generation:** Export clean, branded articles directly to PDF in the browser (powered by `@react-pdf/renderer`) featuring layout-constrained headers/footers.
* **📚 User Library & Dashboard:** Personal library tracking bookmarks, notes, read history, and creator tools to publish/draft stories.

---

## 🛠️ Tech Stack

### Frontend
* **Core:** React 19 (Next.js App Router)
* **Styling:** CSS Variables + TailwindCSS
* **State & Data Fetching:** TanStack Query (React Query)
* **Auth State:** React Context
* **PDF Utility:** `@react-pdf/renderer`

### Backend
* **Runtime:** Node.js (ES Modules)
* **Framework:** Express.js
* **Database:** MongoDB Atlas (Mongoose ODM)
* **Authentication:** Passport.js (Google & GitHub Strategies), JSON Web Tokens (JWT)
* **Mailing:** Nodemailer (SMTP) & Resend HTTP API (for Render Free Tier port-block bypass)

---

## 📂 Project Structure

```text
Blog-Application/
├── frontend/             # Next.js App Router Frontend
│   ├── app/              # Router pages, layouts, and API Route Handler Proxy
│   ├── components/       # Custom React UI components (feed, write, library)
│   ├── hooks/            # TanStack Query & Telemetry hooks
│   └── lib/              # API Client (Axios), Auth Context, and SEO helpers
└── backend/              # Node.js Express REST API Backend
    ├── src/
    │   ├── config/       # Databases, Mailer, and Passport configurations
    │   ├── controllers/  # API endpoint handlers (auth, posts, bookmarks, analytics)
    │   ├── middleware/   # Rate limiting, auth validation, error handler
    │   ├── models/       # Mongoose schemas (User, Post, Bookmark, OTP, Analytics)
    │   ├── routes/       # API routes mapping
    │   └── utils/        # JWT generators, OTP generators, and helper tools
    └── server.js         # Entry point for backend
```

---

## 💻 Local Setup & Development

### 1. Prerequisites
* Install Node.js (version 22 or higher recommended).
* Set up a free MongoDB Atlas Cluster or run local MongoDB.

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file (copied from `.env.example`) and fill in your local secrets:
   ```env
   PORT=5001
   NODE_ENV=development
   MONGODB_URI=mongodb+srv://...
   ACCESS_TOKEN_SECRET=your_local_access_secret
   REFRESH_TOKEN_SECRET=your_local_refresh_secret
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_16char_gmail_app_password
   CLIENT_URL=http://localhost:3000
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_BACKEND_URL=http://localhost:5001
   NEXT_PUBLIC_API_URL=http://localhost:5001/api
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
   ```
4. Start the frontend Next.js dev server:
   ```bash
   npm run dev
   ```

---

## 🌐 Production Environment Configuration Guide

When deploying this project to production (Vercel for the frontend, Render for the backend), configure the following environment settings:

### 1. Vercel Dashboard (Frontend Env Variables)
* `NEXT_PUBLIC_APP_URL` ➡️ `https://your-app-name.vercel.app`
* `NEXT_PUBLIC_BACKEND_URL` ➡️ `https://your-api-name.onrender.com`
* `NEXT_PUBLIC_API_URL` ➡️ `https://your-api-name.onrender.com/api`

### 2. Render Dashboard (Backend Env Variables)
* `NODE_ENV` ➡️ `production`
* `CLIENT_URL` ➡️ `https://your-app-name.vercel.app`
* `COOKIE_SECURE` ➡️ `true`
* `COOKIE_SAME_SITE` ➡️ `lax`
* **Google/GitHub Redirect Callbacks:**
  * `GOOGLE_CALLBACK_URL` ➡️ `https://your-app-name.vercel.app/api/auth/google/callback`
  * `GITHUB_CALLBACK_URL` ➡️ `https://your-app-name.vercel.app/api/auth/github/callback`
* **SMTP (Bypassing Render Free Tier Port Restrictions):**
  Since Render blocks traditional SMTP ports (25, 465, 587) on their free plans, standard mailers will time out. 
  To send OTP registration emails in production, set:
  * `RESEND_API_KEY` ➡️ `re_your_api_key_from_resend`
  This configures the app to send emails over secure **HTTPS (port 443)** using the Resend API, bypassing the firewall.

---

## 🏗️ Technical Architecture Details

### The Cookie Propagation & Proxy Solution
To solve modern browser tracking protections (which block third-party cookies) and prevent Vercel's edge routers from dropping the `Set-Cookie` headers:
1. The Axios client on the browser calls relative path `/api/...`.
2. A Next.js catch-all Route Handler `app/api/[...path]/route.ts` captures this request on the same domain.
3. The Route Handler reads client cookies, forwards the request to Render, intercepts the response, and manually pipes the `Set-Cookie` headers back to the browser.
4. The browser accepts the `refreshToken` as a **first-party** cookie on the Vercel domain, enabling session persistence on reload.

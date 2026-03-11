# 🎓 PlaceMe: Student Placement Tracker

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)

**PlaceMe** is a beautifully designed, full-stack web application built specifically for college students to track their job and internship applications throughout the placement season. It replaces messy spreadsheets with an intelligent dashboard, detailed application routing, and AI-powered Resume against Job Description (JD) matching.

---

## ✨ Features

*   **📊 Intelligent Dashboard & Insights:** Visualize your application progress at a glance. Track *Apps Per Interview*, *Total Offers*, and *Rejection by Stage* through interactive Chart.js visualizations.
*   **💼 Application Pipeline:** Track every role from `Applied` → `Shortlisted` → `Interview Scheduled` → `Selected` (or `Rejected`). 
*   **📑 Resume Analysis (ATS Matcher):** Paste a Job Description and your Resume text to instantly see your match score, matched skills, and critically missing skills so you know exactly what to study.
*   **📝 Interview Experience Logger:** Log the difficulty, specific questions asked, and your personal notes for every single interview round.
*   **🌓 Dark/Light Mode:** A sleek, animated UI that is fully responsive on desktop and mobile browsers.

---

## 📸 Screenshots

<div align="center">
  
### The Insights Dashboard
*Detailed analysis to identify where you're failing in the funnel.*
<img src="https://raw.githubusercontent.com/Renusri-Naraharasetty/place-me-tracker/main/docs/dashboard.png" alt="Dashboard" width="800">

### Resume Matcher
*Find out exactly which skills the ATS scanner says you are missing.*
<img src="https://raw.githubusercontent.com/Renusri-Naraharasetty/place-me-tracker/main/docs/resume-analysis.png" alt="Resume Analysis" width="800">

### Application Pipeline
*Log outcomes, rounds, and offers directly in the application detail page.*
<img src="https://raw.githubusercontent.com/Renusri-Naraharasetty/place-me-tracker/main/docs/application-detail.png" alt="Application Details" width="800">

</div>

---

## 🛠️ Tech Stack

*   **Frontend:** React 18, Vite, React Router, Chart.js, Vanilla CSS Modules
*   **Backend:** Node.js, Express.js
*   **Database:** SQLite (`better-sqlite3`)
*   **Security:** `bcryptjs` for password hashing, UUIDs for sessions

---

## 🚀 Running Locally

Want to run PlaceMe on your own machine? It's incredibly easy.

### Prerequisites
*   Node.js (v18 or higher)
*   Git

### Installation Steps

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Renusri-Naraharasetty/place-me-tracker.git
    cd place-me-tracker
    ```

2.  **Install all dependencies (Frontend & Backend):**
    ```bash
    npm install
    ```

3.  **Start the development servers:**
    ```bash
    npm run dev
    ```
    *This single command starts both the Vite frontend (`localhost:5173`) and the Express/SQLite backend (`localhost:3001`) simultaneously!*

---

## ☁️ Deployment (Free Tier)

PlaceMe is designed to be hosted 24/7 for zero cost using **Render** and **Netlify** (or Vercel). 

1.  **Backend (Render.com)**
    *   Create a "Web Service" connected to this repo.
    *   Build Command: `npm install`
    *   Start Command: `npm run dev:server`
    *   **Crucial:** Add a Persistent Disk mounted to `/data` so your SQLite database (`placement.db`) isn't wiped when Render restarts the server.

2.  **Frontend (Netlify.com)**
    *   Import this repo to Netlify.
    *   Build command: `npm run build`
    *   Publish directory: `dist`
    *   Add an Environment Variable: `VITE_API_URL` pointing to your Render backend URL (e.g., `https://your-api.onrender.com/api`).

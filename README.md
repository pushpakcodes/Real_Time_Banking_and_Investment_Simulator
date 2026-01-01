# 🏦 Real-Life Real-Time Banking & Investment Simulator

A comprehensive **MERN Stack** application that simulates a complete financial ecosystem. Users can manage bank accounts, invest in real-time stock markets, plan financial goals, and "time travel" to see how their wealth grows over time.

![FinTech Simulator](https://img.shields.io/badge/Status-Production-green)
![Stack](https://img.shields.io/badge/Stack-MERN-blue)

## 🚀 Features

### 1. 💳 Advanced Banking
*   **Accounts**: Open Savings and Checking accounts with unique account numbers.
*   **Transactions**: Deposit, Withdraw, and Transfer funds seamlessly.
*   **Credit Cards**: Apply for credit cards, manage limits, and pay bills.
*   **Fixed Deposits (FDs)**: Invest in FDs with variable interest rates and maturity periods.
*   **Loans**: Apply for loans and manage monthly EMIs.

### 2. 📈 Real-Time Stock Market
*   **Live Data**: Integrates with **Twelve Data**, **Alpha Vantage**, and **Finnhub** for real-time market data.
*   **Portfolio Management**: Buy and Sell stocks at real-time market prices.
*   **Market Trends**: Visual stock charts and historical data analysis.
*   **Net Worth Tracking**: Real-time calculation of total assets (Cash + Investments - Liabilities).

### 3. 🎯 Financial Planning
*   **Financial Goals**: Set custom goals (e.g., "Buy a House"), track progress, and update savings.
*   **Interactive UI**: Inline editing and visual progress bars for goal tracking.
*   **Analytics Dashboard**: Visual breakdown of expenses, income, and net worth history.

### 4. ⏳ Simulation Engine
*   **Time Travel**: Unique feature to "Fast Forward" time (e.g., 6 months).
*   **Compound Interest**: Automatically calculates and credits interest for Savings and FDs.
*   **Market Simulation**: Simulates stock price movements and market volatility over the skipped period.

---

## 🛠️ Tech Stack

### Frontend
*   **Framework**: React 19 (Vite)
*   **Styling**: TailwindCSS, Framer Motion
*   **Charts**: Recharts
*   **State Management**: React Context API
*   **HTTP Client**: Axios

### Backend
*   **Runtime**: Node.js & Express.js
*   **Database**: MongoDB Atlas (Mongoose)
*   **Authentication**: JWT (JSON Web Tokens) & Bcrypt
*   **Security**: Helmet, CORS

### External APIs
*   **Twelve Data** (Stock Prices)
*   **Alpha Vantage** (Market Search)
*   **Finnhub** (News & Sentiment)

---

## ⚙️ Environment Variables

To run this project, you will need to add the following environment variables to your `.env` files.

### Backend (`backend/.env`)
```env
PORT=8000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/dbname
JWT_SECRET=your_super_secret_key
NODE_ENV=development

# External APIs (Get free keys from their websites)
ALPHA_VANTAGE_KEY=your_key
TWELVE_DATA_API_KEY=your_key
FINNHUB_API_KEY=your_key
```

### Frontend (`frontend/.env`)
```env
# For Local Development
VITE_API_URL=http://localhost:8000/api

# For Production (Vercel)
# VITE_API_URL=https://your-backend.railway.app/api
```

---

## 🖥️ Local Installation Guide

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/fintech-simulator.git
cd fintech-simulator
```

### 2. Backend Setup
```bash
cd backend
npm install
# Create .env file and add variables (see above)
npm run dev
```
*Server runs on `http://localhost:8000`*

### 3. Frontend Setup
```bash
cd frontend
npm install
# Create .env file and add variables (see above)
npm run dev
```
*Client runs on `http://localhost:5173`*

---

## ☁️ Deployment Guide

### Backend (Railway)
1.  Connect GitHub repo to **Railway**.
2.  Set **Root Directory** to `/backend`.
3.  Add all variables from `backend/.env` to Railway Variables.
4.  Railway will auto-deploy. Copy the generated **Public Domain**.

### Frontend (Vercel)
1.  Connect GitHub repo to **Vercel**.
2.  Set **Root Directory** to `/frontend`.
3.  Add Environment Variable:
    *   `VITE_API_URL` = `https://<YOUR_RAILWAY_URL>/api`
4.  Deploy!

---

## 📂 Project Structure
```
├── backend/             # Node.js/Express Server
│   ├── src/
│   │   ├── config/      # DB & App Config
│   │   ├── controllers/ # Logic for Routes
│   │   ├── models/      # Mongoose Schemas
│   │   ├── routes/      # API Endpoints
│   │   └── services/    # Business Logic (Simulation, APIs)
│   └── server.js        # Entry Point
│
├── frontend/            # React Client
│   ├── public/          # Static Assets
│   └── src/
│       ├── components/  # Reusable UI Components
│       ├── context/     # Global State (Auth, Toast)
│       ├── pages/       # Application Views
│       └── api.js       # Axios Configuration
```

## 📄 License
This project is licensed under the MIT License.

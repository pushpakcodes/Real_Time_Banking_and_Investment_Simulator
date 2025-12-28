# Real-Time Banking & Investment Simulator

A full-stack MERN application simulating a realistic fintech environment.

## Features

*   **Real-Time Banking**: Create accounts (Savings/Current), Deposit, Withdraw, Transfer.
*   **Stock Market**: Real-time simulation with volatility, trends, and growth bias. Buy/Sell stocks.
*   **Investment**: Fixed Deposits and Loans with amortization logic.
*   **Time Simulation Engine**: Advance time by days/months to see interest accrual, stock movements, and net worth growth.
*   **Analytics**: Dashboard with Net Worth history and recent transactions.
*   **Prediction Engine**: 30-day stock price forecasting.

## Tech Stack

*   **Frontend**: React (Vite), Recharts, Axios, React Router.
*   **Backend**: Node.js, Express, MongoDB (Mongoose).
*   **Auth**: JWT Authentication.

## Setup Instructions

### Prerequisites
*   Node.js installed.
*   MongoDB installed and running locally on port 27017.

### 1. Backend Setup
```bash
cd server
npm install
# Create .env file (already created)
# PORT=5000
# MONGO_URI=mongodb://localhost:27017/fintech_simulator
npm run dev
```
Server runs on http://localhost:5000

### 2. Frontend Setup
```bash
cd client
npm install
npm run dev
```
Client runs on http://localhost:5173

## How to Use
1.  **Register** a new user.
2.  **Dashboard**: View your initial status.
3.  **Banking**: Open a new Savings Account. Deposit some money.
4.  **Stocks**: Go to Stocks page, buy some stocks.
5.  **Simulation**: Use the input in the top header to simulate e.g., 30 days.
6.  **Check Back**: See your interest accrued, stock prices changed, and net worth updated on the Dashboard.

## Architecture
*   **API-First**: All logic resides in REST APIs (`/api/bank`, `/api/stocks`, `/api/simulate`).
*   **Services**: Core logic separated into `simulationService.js`.
*   **Security**: JWT protected routes.

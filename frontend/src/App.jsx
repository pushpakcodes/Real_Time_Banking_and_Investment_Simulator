import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import AuthContext from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Layout from './components/Layout';

import Dashboard from './pages/Dashboard';
import Banking from './pages/Banking';
import Stocks from './pages/Stocks';
import Loans from './pages/Loans';
import FDs from './pages/FDs';
import Transactions from './pages/Transactions';

import Home from './pages/Home';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div>Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route path="/dashboard" element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="banking" element={<Banking />} />
              <Route path="stocks" element={<Stocks />} />
              <Route path="loans" element={<Loans />} />
              <Route path="fds" element={<FDs />} />
              <Route path="transactions" element={<Transactions />} />
            </Route>
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;

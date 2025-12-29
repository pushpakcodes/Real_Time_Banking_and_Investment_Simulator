import { useContext, useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import api from '../api';
import { LayoutDashboard, Wallet, TrendingUp, DollarSign, Clock, LogOut, Menu, X, Play } from 'lucide-react';
import { AnimatedBackground } from './ui/AnimatedBackground';
import { motion } from 'framer-motion';

const Layout = () => {
  const { user, logout, refreshProfile } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [simDays, setSimDays] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSimulate = async () => {
    try {
      const { data } = await api.post('/simulate/advance', { days: simDays });
      alert(data.message);
      refreshProfile(); 
      window.location.reload(); 
    } catch (err) {
      alert('Simulation failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/dashboard/banking', label: 'Banking', icon: <Wallet size={20} /> },
    { path: '/dashboard/stocks', label: 'Stocks', icon: <TrendingUp size={20} /> },
    { path: '/dashboard/loans', label: 'Loans', icon: <DollarSign size={20} /> },
    { path: '/dashboard/fds', label: 'Fixed Deposits', icon: <Clock size={20} /> },
  ];

  return (
    <div className="flex min-h-screen text-gray-100 font-sans relative overflow-hidden">
      <AnimatedBackground />

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 256 : 80 }}
        className="bg-black/40 backdrop-blur-xl border-r border-white/5 flex flex-col fixed h-full z-30"
      >
        <div className="h-20 flex items-center justify-between px-5 border-b border-white/5">
          {isSidebarOpen && (
            <motion.span 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent"
            >
              FinSim
            </motion.span>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 py-8 px-3 space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                  isActive 
                    ? 'bg-gradient-to-r from-purple-600/20 to-blue-600/20 text-white border border-white/10' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className={`relative z-10 ${isActive ? 'text-purple-400' : 'group-hover:text-purple-400 transition-colors'}`}>
                    {item.icon}
                </div>
                {isSidebarOpen && <span className="relative z-10 font-medium">{item.label}</span>}
                
                {/* Active Glow */}
                {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 blur-xl" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button 
            onClick={handleLogout}
            className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors ${!isSidebarOpen && 'justify-center'}`}
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <motion.div 
        animate={{ marginLeft: isSidebarOpen ? 256 : 80 }}
        className="flex-1 flex flex-col min-h-screen transition-all duration-300"
      >
        {/* Header */}
        <header className="h-20 bg-black/20 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-8 sticky top-0 z-20">
          <div className="flex items-center space-x-8 text-sm">
            <div className="flex flex-col">
              <span className="text-gray-500 text-xs uppercase tracking-wider font-semibold">User</span>
              <span className="font-medium text-white text-base">{user?.username}</span>
            </div>
            <div className="h-8 w-px bg-white/10"></div>
            <div className="flex flex-col">
              <span className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Net Worth</span>
              <span className="font-bold text-emerald-400 text-base">${user?.virtualNetWorth?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="h-8 w-px bg-white/10"></div>
            <div className="flex flex-col">
              <span className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Sim Date</span>
              <span className="font-medium text-blue-400 text-base">{user?.simulationDate ? new Date(user.simulationDate).toDateString() : 'N/A'}</span>
            </div>
          </div>

          <div className="flex items-center space-x-4 bg-black/40 rounded-2xl p-1.5 border border-white/10">
            <button 
              onClick={async () => {
                const amount = prompt('Enter amount to add:');
                if (!amount) return;
                try {
                  const accRes = await api.get('/bank/accounts');
                  if (accRes.data.length === 0) return alert('Please open a bank account first!');
                  await api.post('/bank/deposit', { accountId: accRes.data[0]._id, amount });
                  alert(`Successfully added $${amount} to ${accRes.data[0].bankName}`);
                  window.location.reload();
                } catch (err) {
                  alert('Error: ' + err.message);
                }
              }}
              className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 px-4 py-2 rounded-xl font-medium text-sm transition-all border border-emerald-500/30"
            >
              + Add Money
            </button>
            <div className="flex items-center px-3">
              <input 
                type="number" 
                min="1" 
                value={simDays} 
                onChange={(e) => setSimDays(e.target.value)} 
                className="bg-transparent text-white w-12 text-center focus:outline-none font-bold"
              />
              <span className="text-gray-500 text-sm ml-1">Days</span>
            </div>
            <button 
              onClick={handleSimulate}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-2 rounded-xl font-medium text-sm transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2"
            >
              <Play size={16} fill="currentColor" />
              Simulate
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </motion.div>
    </div>
  );
};

export default Layout;

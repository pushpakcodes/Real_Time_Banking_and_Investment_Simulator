import { useContext, useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api';
import { LayoutDashboard, Wallet, TrendingUp, IndianRupee, Clock, LogOut, Menu, X, Play, User, ArrowRightLeft, CreditCard } from 'lucide-react';
import { AnimatedBackground } from './ui/AnimatedBackground';
import { motion } from 'framer-motion';

const Layout = () => {
  const { user, logout, refreshProfile } = useContext(AuthContext);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [simYears, setSimYears] = useState(0);
  const [simMonths, setSimMonths] = useState(1);
  const [depositAmount, setDepositAmount] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [simulationActive, setSimulationActive] = useState(false);
  const [depositMode, setDepositMode] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSimulate = async () => {
    try {
      const totalMonths = (simYears * 12) + simMonths;
      const days = totalMonths * 30; // approx conversion
      const { data } = await api.post('/simulate/advance', { days });
      toast.success(data.message || `Simulated ${simYears}y ${simMonths}m successfully!`);
      refreshProfile(); 
      window.location.reload(); 
    } catch (err) {
      toast.error('Simulation failed: ' + (err.response?.data?.message || err.message));
    }
  };
  
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/simulate/session/status');
        setSimulationActive(!!data.active);
      } catch {}
    })();
  }, []);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/dashboard/banking', label: 'Banking', icon: <Wallet size={20} /> },
    { path: '/dashboard/stocks', label: 'Stocks', icon: <TrendingUp size={20} /> },
    { path: '/dashboard/loans', label: 'Loans', icon: <IndianRupee size={20} /> },
    { path: '/dashboard/fds', label: 'FDs & Savings', icon: <Clock size={20} /> },
    { path: '/dashboard/credit-cards', label: 'Credit Cards', icon: <CreditCard size={20} /> },
    { path: '/dashboard/transactions', label: 'Transactions', icon: <ArrowRightLeft size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-black text-gray-100 font-sans selection:bg-purple-500/30 overflow-hidden relative">
      <AnimatedBackground />

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 256 : 80 }}
        className="h-full bg-black/40 backdrop-blur-xl border-r border-white/5 flex flex-col fixed left-0 top-0 z-30 transition-all duration-300"
      >
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/5">
          <div className={`flex items-center space-x-3 overflow-hidden transition-all duration-300 ${!isSidebarOpen && 'opacity-0 w-0'}`}>
            <User className="h-6 w-6 text-white" />
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">FinSim</span>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
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
              <span className="font-bold text-emerald-400 text-base">₹{user?.virtualNetWorth?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="h-8 w-px bg-white/10"></div>
            <div className="flex flex-col">
              <span className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Sim Date</span>
              <span className="font-medium text-blue-400 text-base">{user?.simulationDate ? new Date(user.simulationDate).toDateString() : 'N/A'}</span>
            </div>
          </div>

          <div className="flex items-center space-x-4 bg-black/40 rounded-2xl p-1.5 border border-white/10">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSimulationActive(prev => prev || false)}
                className="hidden"
              >
                .
              </button>
              <button
                onClick={() => setDepositAmount('')}
                className="hidden"
              >
                .
              </button>
              <button
                onClick={() => setSimYears(simYears)}
                className="hidden"
              >
                .
              </button>
              <button
                onClick={() => setSimMonths(simMonths)}
                className="hidden"
              >
                .
              </button>
              <button
                onClick={() => setDepositMode('one')}
                className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 px-4 py-2 rounded-xl font-medium text-sm transition-all border border-emerald-500/30"
              >
                Deposit Money
              </button>
              <button
                onClick={() => setDepositMode('monthly')}
                className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 px-4 py-2 rounded-xl font-medium text-sm transition-all border border-blue-500/30"
              >
                Deposit Monthly
              </button>
              {depositMode && (
                <>
                  <input 
                    type="number" 
                    placeholder="₹0.00"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-56 bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:outline-none"
                  />
                  <button 
                    onClick={async () => {
                      if (!depositAmount || Number(depositAmount) <= 0) {
                        toast.error('Enter a valid amount');
                        return;
                      }
                      try {
                        const accRes = await api.get('/bank/accounts');
                        if (accRes.data.length === 0) {
                          toast.error('No bank account found. Create one first.');
                          return;
                        }
                        const targetId = accRes.data[0]._id;
                        if (depositMode === 'one') {
                          await api.post('/bank/deposit', { accountId: targetId, amount: Number(depositAmount) });
                          toast.success('Deposit successful');
                        } else if (depositMode === 'monthly') {
                          const simDay = user?.simulationDate ? new Date(user.simulationDate).getDate() : 1;
                          await api.post('/bank/deposit-plan', { accountId: targetId, amount: Number(depositAmount), dayOfMonth: simDay, active: true });
                          toast.success('Monthly deposit plan set');
                        }
                        await refreshProfile();
                        setDepositAmount('');
                        setDepositMode(null);
                      } catch (err) {
                        const msg = err.response?.data?.message || 'Request failed';
                        toast.error(msg);
                      }
                    }}
                    className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl font-medium text-sm transition-all border border-white/20"
                  >
                    {depositMode === 'monthly' ? 'Set Monthly' : 'Deposit'}
                  </button>
                  <button
                    onClick={() => { setDepositAmount(''); setDepositMode(null); }}
                    className="bg-white/5 hover:bg-white/10 text-gray-200 px-4 py-2 rounded-xl font-medium text-sm transition-all border border-white/10"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
            <div className="flex items-center px-3 border-l border-white/10 ml-2 pl-4">
              <div className="flex items-center gap-2 text-sm">
                <label className="text-gray-400">Years</label>
                <input 
                  type="number" 
                  min={0}
                  value={simYears}
                  onChange={(e) => setSimYears(Number(e.target.value))}
                  className="w-16 bg-white/5 border border-white/10 rounded px-2 py-1 text-white focus:outline-none"
                />
                <label className="text-gray-400">Months</label>
                <input 
                  type="number" 
                  min={0}
                  value={simMonths}
                  onChange={(e) => setSimMonths(Number(e.target.value))}
                  className="w-16 bg-white/5 border border-white/10 rounded px-2 py-1 text-white focus:outline-none"
                />
              </div>
            </div>
            <button 
              onClick={handleSimulate}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-2 rounded-xl font-medium text-sm transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2"
            >
              <Play size={16} fill="currentColor" />
              Simulate
            </button>
            {simulationActive && (
            <button
              onClick={async () => {
                try {
                  await api.post('/simulate/session/end');
                  window.location.reload();
                } catch {}
              }}
              className="bg-white/5 hover:bg-white/10 text-gray-200 px-3 py-1.5 rounded-xl font-medium text-xs transition-all border border-white/10"
            >
              Exit
            </button>
            )}
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

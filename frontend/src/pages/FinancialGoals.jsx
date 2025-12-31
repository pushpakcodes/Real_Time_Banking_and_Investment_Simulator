import { useState, useEffect } from 'react';
import api from '../api';
import { Target, Plus, Trash2, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { GlassCard } from '../components/ui/GlassCard';
import { GlowingButton } from '../components/ui/GlowingButton';
import { useToast } from '../context/ToastContext';

const FinancialGoals = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    targetAmount: '',
    currentAmount: '',
    deadline: '',
    priority: 'MEDIUM',
    notes: ''
  });

  const [editingGoalId, setEditingGoalId] = useState(null);
  const [editValue, setEditValue] = useState('');

  const fetchData = async () => {
    try {
      const { data } = await api.get('/goals');
      setGoals(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/goals', formData);
      toast.success('Goal created successfully!');
      setShowCreateForm(false);
      setFormData({ title: '', targetAmount: '', currentAmount: '', deadline: '', priority: 'MEDIUM', notes: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating goal');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/goals/${id}`);
      toast.success('Goal removed');
      fetchData();
    } catch (err) {
      toast.error('Error deleting goal');
    }
  };

  const handleStartEdit = (goal) => {
    setEditingGoalId(goal._id);
    setEditValue(goal.currentAmount);
  };

  const handleCancelEdit = () => {
    setEditingGoalId(null);
    setEditValue('');
  };

  const handleSaveProgress = async (id) => {
    if (editValue === '' || isNaN(editValue)) {
        return toast.error('Invalid amount');
    }

    try {
        await api.put(`/goals/${id}`, { currentAmount: Number(editValue) });
        toast.success('Progress updated!');
        setEditingGoalId(null);
        fetchData();
    } catch (err) {
        toast.error('Update failed');
    }
  };

  const getPriorityColor = (p) => {
    switch (p) {
        case 'HIGH': return 'text-red-400 border-red-400/30 bg-red-400/10';
        case 'MEDIUM': return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10';
        case 'LOW': return 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10';
        default: return 'text-gray-400';
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (loading) return <div className="text-gray-400 p-8">Loading Goals...</div>;

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 pb-8"
    >
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-rose-400">
            Financial Goals
          </h1>
          <p className="text-gray-400 mt-2">Plan and track your future</p>
        </div>
        <GlowingButton 
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500"
        >
          <Plus className="h-5 w-5 mr-2" /> New Goal
        </GlowingButton>
      </div>

      {showCreateForm && (
        <GlassCard className="p-6 border-pink-500/30">
            <h3 className="text-xl font-semibold text-white mb-4">Set New Goal</h3>
            <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Goal Title</label>
                        <input 
                            required
                            type="text" 
                            placeholder="e.g. Buy a Car, World Tour"
                            value={formData.title}
                            onChange={e => setFormData({...formData, title: e.target.value})}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-pink-500/50"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Target Amount (₹)</label>
                        <input 
                            required
                            type="number" 
                            placeholder="500000"
                            value={formData.targetAmount}
                            onChange={e => setFormData({...formData, targetAmount: e.target.value})}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-pink-500/50"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Target Date</label>
                        <input 
                            required
                            type="date" 
                            value={formData.deadline}
                            onChange={e => setFormData({...formData, deadline: e.target.value})}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-pink-500/50"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Priority</label>
                        <select 
                            value={formData.priority}
                            onChange={e => setFormData({...formData, priority: e.target.value})}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-pink-500/50"
                        >
                            <option value="HIGH">High</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="LOW">Low</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Notes (Optional)</label>
                    <textarea 
                        rows="2"
                        value={formData.notes}
                        onChange={e => setFormData({...formData, notes: e.target.value})}
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-pink-500/50"
                    />
                </div>
                <div className="flex justify-end gap-3">
                    <button 
                        type="button"
                        onClick={() => setShowCreateForm(false)}
                        className="px-4 py-2 rounded-xl text-gray-400 hover:bg-white/5"
                    >
                        Cancel
                    </button>
                    <GlowingButton type="submit" className="from-pink-600 to-rose-600">
                        Create Goal
                    </GlowingButton>
                </div>
            </form>
        </GlassCard>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => {
            const progress = Math.max(0, Math.min((goal.currentAmount / goal.targetAmount) * 100, 100));
            const isCompleted = goal.status === 'COMPLETED';
            
            return (
                <GlassCard key={goal._id} variants={itemVariants} className="group hover:border-pink-500/30 transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-xl font-bold text-white group-hover:text-pink-400 transition-colors">{goal.title}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded border ${getPriorityColor(goal.priority)}`}>
                                {goal.priority}
                            </span>
                        </div>
                        <button 
                            onClick={() => handleDelete(goal._id)}
                            className="text-gray-500 hover:text-red-400 transition-colors"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-400">Progress</span>
                                <span className="text-white font-medium">{Math.round(progress)}%</span>
                            </div>
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    className={`h-full ${isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-pink-500 to-rose-500'}`}
                                />
                            </div>
                        </div>

                        <div className="flex justify-between items-center text-sm">
                            <div>
                                <p className="text-gray-400">Current</p>
                                <p className="text-white font-medium">₹{goal.currentAmount.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-gray-400">Target</p>
                                <p className="text-white font-medium">₹{goal.targetAmount.toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <AlertCircle size={14} />
                            <span>Target: {new Date(goal.deadline).toLocaleDateString()}</span>
                        </div>

                        {!isCompleted && (
                            <div className="mt-4">
                                {editingGoalId === goal._id ? (
                                    <div className="flex gap-2">
                                        <input 
                                            type="number" 
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500/50"
                                            placeholder="Amount"
                                            autoFocus
                                        />
                                        <button 
                                            onClick={() => handleSaveProgress(goal._id)}
                                            className="px-3 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors"
                                        >
                                            Save
                                        </button>
                                        <button 
                                            onClick={handleCancelEdit}
                                            className="px-3 py-2 bg-white/5 text-gray-400 rounded-lg hover:bg-white/10 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => handleStartEdit(goal)}
                                        className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-medium text-pink-400 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <TrendingUp size={16} /> Update Progress
                                    </button>
                                )}
                            </div>
                        )}
                        
                        {isCompleted && (
                            <div className="w-full py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium text-center flex items-center justify-center gap-2">
                                <CheckCircle size={16} /> Goal Achieved!
                            </div>
                        )}
                    </div>
                </GlassCard>
            );
        })}
        
        {goals.length === 0 && !loading && (
            <div className="col-span-full text-center py-12 text-gray-500">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No financial goals set yet. Start planning today!</p>
            </div>
        )}
      </div>
    </motion.div>
  );
};

export default FinancialGoals;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Home, DollarSign, LayoutDashboard, Plus, Settings, 
  LogOut, AlertCircle, CheckCircle, Edit, Trash2, ArrowLeft,
  Building, MapPin, Calendar, HardHat, PaintBucket, PenTool,
  Wrench, Zap, Briefcase
} from 'lucide-react';

// Setup axios
axios.defaults.baseURL = 'http://localhost:8080/api';
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => Promise.reject(error));

const CATEGORIES = [
  'Labour Charges',
  'Materials (Bricks, Steel, Cement)',
  'Interiors & Finishing',
  'Paint & Flooring',
  'Plumbing',
  'Electrician'
];

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedHouseId, setSelectedHouseId] = useState(null);
  
  // Navigation function
  const navigate = (view, houseId = null) => {
    setCurrentView(view);
    setSelectedHouseId(houseId);
  };

  const handleLoginSuccess = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify({ name: data.name, email: data.email }));
    setToken(data.token);
    setUser({ name: data.name, email: data.email });
    navigate('dashboard');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  if (!token) {
    return <AuthPage onLogin={handleLoginSuccess} />;
  }

  return (
    <div className="animate-fade-in">
      <Navbar user={user} logout={logout} navigate={navigate} currentView={currentView} />
      <div className="container mt-4">
        {currentView === 'dashboard' && <Dashboard navigate={navigate} />}
        {currentView === 'houseForm' && <HouseForm navigate={navigate} houseId={selectedHouseId} />}
        {currentView === 'houseDetail' && <HouseDetail navigate={navigate} houseId={selectedHouseId} />}
      </div>
    </div>
  );
}

// --- Components ---

function AuthPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const res = await axios.post(endpoint, formData);
      onLogin(res.data);
    } catch (err) {
      setError(err.response?.data || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="card auth-card">
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2 text-2xl font-bold">
            <Building className="text-cyan" size={32} />
            <span>Build<span className="text-cyan">Track</span></span>
          </div>
        </div>
        
        <div className="auth-tabs">
          <div className={`auth-tab ${isLogin ? 'active' : ''}`} onClick={() => {setIsLogin(true); setError('');}}>Sign In</div>
          <div className={`auth-tab ${!isLogin ? 'active' : ''}`} onClick={() => {setIsLogin(false); setError('');}}>Register</div>
        </div>

        {error && (
          <div className="alert alert-error animate-fade-in">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" className="form-control" required
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} 
                placeholder="John Doe" />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input type="email" className="form-control" required
              value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} 
              placeholder="john@example.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="form-control" required
              value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} 
              placeholder="••••••••" />
          </div>
          <button type="submit" className="btn btn-primary" style={{width: '100%', marginTop: '1rem'}} disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>
      </div>
    </div>
  );
}

function Navbar({ user, logout, navigate, currentView }) {
  return (
    <nav className="navbar">
      <div className="navbar-brand" onClick={() => navigate('dashboard')}>
        <Building size={28} />
        <span>Build<span className="text-cyan">Track</span></span>
      </div>
      <div className="navbar-nav">
        <div className={`nav-link ${currentView === 'dashboard' ? 'active' : ''}`} onClick={() => navigate('dashboard')}>
          Dashboard
        </div>
        <div className="user-profile">
          <div className="flex flex-col text-right">
            <span className="font-bold text-sm" style={{color: 'white'}}>{user?.name}</span>
            <span className="text-xs text-muted">{user?.email}</span>
          </div>
          <div className="btn-icon" onClick={logout} title="Logout">
            <LogOut size={20} />
          </div>
        </div>
      </div>
    </nav>
  );
}

function Dashboard({ navigate }) {
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHouses();
  }, []);

  const fetchHouses = async () => {
    try {
      const res = await axios.get('/houses');
      // Fetch total spent for each house to display on dashboard
      const housesWithTotals = await Promise.all(res.data.map(async (house) => {
        try {
          const totalRes = await axios.get(`/expenses/house/${house.id}/total`);
          return { ...house, totalSpent: totalRes.data };
        } catch {
          return { ...house, totalSpent: 0 };
        }
      }));
      setHouses(housesWithTotals);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const dashboardStats = {
    totalProjects: houses.length,
    inProgress: houses.filter(h => h.status === 'IN_PROGRESS').length,
    completed: houses.filter(h => h.status === 'SOLD').length,
    totalSpent: houses.reduce((sum, h) => sum + (h.totalSpent || 0), 0)
  };

  if (loading) return <div className="text-center mt-6">Loading dashboard...</div>;

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Projects Overview</h1>
        <button className="btn btn-primary" onClick={() => navigate('houseForm')}>
          <Plus size={18} /> New Project
        </button>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="card stat-card">
          <Briefcase className="text-cyan mb-2" size={32} />
          <div className="stat-label">Total Projects</div>
          <div className="stat-value">{dashboardStats.totalProjects}</div>
        </div>
        <div className="card stat-card">
          <Zap className="text-warning mb-2" size={32} />
          <div className="stat-label">In Progress</div>
          <div className="stat-value">{dashboardStats.inProgress}</div>
        </div>
        <div className="card stat-card">
          <CheckCircle className="text-success mb-2" size={32} />
          <div className="stat-label">Sold Projects</div>
          <div className="stat-value">{dashboardStats.completed}</div>
        </div>
        <div className="card stat-card">
          <DollarSign className="text-danger mb-2" size={32} />
          <div className="stat-label">Total Spent</div>
          <div className="stat-value">₹{dashboardStats.totalSpent.toLocaleString('en-IN')}</div>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">Your Houses</h2>
      {houses.length === 0 ? (
        <div className="card text-center py-6 text-muted">
          No projects found. Click "New Project" to start tracking.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {houses.map(house => (
            <div key={house.id} className="card card-hover cursor-pointer" onClick={() => navigate('houseDetail', house.id)}>
              <div className="flex justify-between items-start mb-2">
                <h3 className="card-title truncate">{house.name}</h3>
                <span className={`badge ${house.status === 'SOLD' ? 'badge-success' : 'badge-warning'}`}>
                  {house.status.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted text-sm mb-4">
                <MapPin size={14} /> {house.location}
              </div>
              <div className="flex justify-between items-center mt-4 pt-4" style={{borderTop: '1px solid var(--border-color)'}}>
                <div>
                  <div className="text-xs text-muted">Total Spent</div>
                  <div className="font-bold text-danger">₹{(house.totalSpent || 0).toLocaleString('en-IN')}</div>
                </div>
                {house.status === 'SOLD' && (
                  <div className="text-right">
                    <div className="text-xs text-muted">Profit/Loss</div>
                    <div className={`font-bold ${house.salePrice - (house.totalSpent || 0) >= 0 ? 'text-success' : 'text-danger'}`}>
                      {house.salePrice - (house.totalSpent || 0) >= 0 ? '+' : ''}
                      ₹{(house.salePrice - (house.totalSpent || 0)).toLocaleString('en-IN')}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 mt-4 text-xs text-muted">
                <Calendar size={12} /> 
                {house.startDate ? new Date(house.startDate).toLocaleDateString() : 'N/A'} - {house.endDate ? new Date(house.endDate).toLocaleDateString() : 'Active'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HouseForm({ navigate, houseId }) {
  const isEditing = !!houseId;
  const [formData, setFormData] = useState({
    name: '', location: '', startDate: '', endDate: '', salePrice: 0, status: 'IN_PROGRESS'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditing) {
      axios.get(`/houses/${houseId}`).then(res => {
        setFormData({
          name: res.data.name,
          location: res.data.location,
          startDate: res.data.startDate || '',
          endDate: res.data.endDate || '',
          salePrice: res.data.salePrice || 0,
          status: res.data.status
        });
      });
    }
  }, [houseId, isEditing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditing) {
        await axios.put(`/houses/${houseId}`, formData);
        navigate('houseDetail', houseId);
      } else {
        const res = await axios.post('/houses', formData);
        navigate('houseDetail', res.data.id);
      }
    } catch (err) {
      alert('Error saving house');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-2xl mx-auto" style={{maxWidth: '800px'}}>
      <button className="btn btn-secondary mb-6" onClick={() => navigate(isEditing ? 'houseDetail' : 'dashboard', isEditing ? houseId : null)}>
        <ArrowLeft size={16} /> Back
      </button>
      
      <div className="card">
        <h2 className="card-title mb-6">{isEditing ? 'Edit Project' : 'Add New Project'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group mb-4">
              <label className="form-label">Project Name</label>
              <input type="text" className="form-control" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="form-group mb-4">
              <label className="form-label">Location</label>
              <input type="text" className="form-control" required value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
            </div>
            <div className="form-group mb-4">
              <label className="form-label">Start Date</label>
              <input type="date" className="form-control" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
            </div>
            <div className="form-group mb-4">
              <label className="form-label">End Date</label>
              <input type="date" className="form-control" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
            </div>
            <div className="form-group mb-4">
              <label className="form-label">Status</label>
              <select className="form-control" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="SOLD">Sold</option>
              </select>
            </div>
            {formData.status === 'SOLD' && (
              <div className="form-group mb-4">
                <label className="form-label">Sale Price (₹)</label>
                <input type="number" step="0.01" className="form-control" required={formData.status === 'SOLD'} value={formData.salePrice} onChange={e => setFormData({...formData, salePrice: parseFloat(e.target.value)})} />
              </div>
            )}
          </div>
          <div className="flex justify-end mt-4">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function HouseDetail({ navigate, houseId }) {
  const [house, setHouse] = useState(null);
  const [totalSpent, setTotalSpent] = useState(0);
  const [expenses, setExpenses] = useState([]);
  const [categorySummary, setCategorySummary] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Expense Form State
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [expenseForm, setExpenseForm] = useState({ category: CATEGORIES[0], description: '', amount: '', expenseDate: new Date().toISOString().split('T')[0] });

  useEffect(() => {
    fetchData();
  }, [houseId]);

  const fetchData = async () => {
    try {
      const [houseRes, totalRes, expenseRes, catRes] = await Promise.all([
        axios.get(`/houses/${houseId}`),
        axios.get(`/expenses/house/${houseId}/total`),
        axios.get(`/expenses/house/${houseId}`),
        axios.get(`/expenses/house/${houseId}/category-summary`),
      ]);
      setHouse(houseRes.data);
      setTotalSpent(totalRes.data);
      setExpenses(expenseRes.data);
      setCategorySummary(catRes.data);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403) {
        alert("Access Denied.");
        navigate('dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { 
        id: editingExpenseId || undefined,
        ...expenseForm, 
        house: { id: houseId }, 
        amount: parseFloat(expenseForm.amount) || 0
      };
      if (editingExpenseId) {
        await axios.put(`/expenses/${editingExpenseId}`, payload);
      } else {
        await axios.post('/expenses', payload);
      }
      setShowExpenseForm(false);
      setEditingExpenseId(null);
      resetExpenseForm();
      fetchData();
    } catch (err) {
      alert('Failed to save expense');
    }
  };

  const resetExpenseForm = () => {
    setExpenseForm({ category: CATEGORIES[0], description: '', amount: '', expenseDate: new Date().toISOString().split('T')[0] });
  };

  const editExpense = (exp) => {
    let fmtDate = exp.expenseDate;
    if (Array.isArray(fmtDate)) {
      fmtDate = `${fmtDate[0]}-${String(fmtDate[1]).padStart(2, '0')}-${String(fmtDate[2]).padStart(2, '0')}`;
    } else if (typeof fmtDate === 'string' && fmtDate.includes('T')) {
      fmtDate = fmtDate.split('T')[0];
    }
    setExpenseForm({
      category: exp.category,
      description: exp.description || '',
      amount: exp.amount,
      expenseDate: fmtDate || new Date().toISOString().split('T')[0]
    });
    setEditingExpenseId(exp.id);
    setShowExpenseForm(true);
  };

  const deleteExpense = async (id) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      await axios.delete(`/expenses/${id}`);
      fetchData();
    } catch (err) {
      alert('Delete failed');
    }
  };

  const deleteHouse = async () => {
    if (!confirm('Delete this entire project? This action cannot be undone.')) return;
    try {
      await axios.delete(`/houses/${houseId}`);
      navigate('dashboard');
    } catch (err) {
      alert('Delete failed');
    }
  };

  if (loading || !house) return <div className="text-center mt-6">Loading details...</div>;

  const profitLoss = house.salePrice - totalSpent;
  const pnlClass = profitLoss >= 0 ? 'text-success' : 'text-danger';

  // Helper for category icons
  const getCatIcon = (cat) => {
    if (cat.includes('Labour')) return <HardHat size={16} />;
    if (cat.includes('Material')) return <Building size={16} />;
    if (cat.includes('Paint')) return <PaintBucket size={16} />;
    if (cat.includes('Plumb')) return <Wrench size={16} />;
    if (cat.includes('Elect')) return <Zap size={16} />;
    return <PenTool size={16} />;
  };

  const maxCatAmount = Math.max(...categorySummary.map(c => c.total), 1);

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button className="btn btn-secondary btn-icon" onClick={() => navigate('dashboard')}>
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-2xl font-bold">{house.name}</h1>
          <span className={`badge ${house.status === 'SOLD' ? 'badge-success' : 'badge-warning'}`}>
            {house.status.replace('_', ' ')}
          </span>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={() => navigate('houseForm', houseId)}>
            <Edit size={16} /> Edit
          </button>
          <button className="btn btn-danger" onClick={deleteHouse}>
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="card">
          <div className="text-sm text-muted mb-1 uppercase tracking-wider">Total Expenses</div>
          <div className="text-3xl font-bold text-white">₹{totalSpent.toLocaleString('en-IN')}</div>
        </div>
        
        {house.status === 'SOLD' ? (
          <>
            <div className="card">
              <div className="text-sm text-muted mb-1 uppercase tracking-wider">Sale Price</div>
              <div className="text-3xl font-bold text-info">₹{house.salePrice?.toLocaleString('en-IN') || 0}</div>
            </div>
            <div className="card" style={{borderLeft: `4px solid ${profitLoss >= 0 ? 'var(--success)' : 'var(--error)'}`}}>
              <div className="text-sm text-muted mb-1 uppercase tracking-wider">Profit / Loss</div>
              <div className={`text-3xl font-bold ${pnlClass}`}>
                {profitLoss >= 0 ? '+' : ''}₹{profitLoss.toLocaleString('en-IN')}
              </div>
            </div>
          </>
        ) : (
          <div className="card grid-cols-2" style={{gridColumn: 'span 2'}}>
             <div className="text-muted flex h-full items-center justify-center">
               Mark project as "Sold" and add Sale Price to view Profit & Loss.
             </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="card" style={{gridColumn: 'span 1'}}>
          <h3 className="card-title">Expense Breakdown</h3>
          <div className="mt-4 flex flex-col gap-4">
            {categorySummary.length === 0 ? (
              <div className="text-muted text-sm text-center py-4">No expenses yet</div>
            ) : (
              categorySummary.map((cat, i) => {
                const percent = (cat.total / maxCatAmount) * 100;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <div className="flex items-center gap-2">
                         <span className="text-cyan">{getCatIcon(cat.category)}</span>
                         <span>{cat.category}</span>
                      </div>
                      <span className="font-bold">₹{cat.total.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="progress-container">
                      <div className="progress-bar custom-gradient" style={{width: `${percent}%`, background: 'var(--accent-cyan)'}}></div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="card" style={{gridColumn: 'span 2'}}>
          <div className="flex justify-between items-center card-header">
            <h3 className="card-title m-0 border-0">Expense Ledger</h3>
            <button className="btn btn-primary" onClick={() => { resetExpenseForm(); setShowExpenseForm(!showExpenseForm); }}>
              {showExpenseForm && !editingExpenseId ? 'Cancel' : <><Plus size={16}/> Add Expense</>}
            </button>
          </div>

          {showExpenseForm && (
            <div className="mb-6 p-4 bg-gray-900 rounded-lg animate-fade-in border border-blue-900" style={{backgroundColor: 'rgba(59, 130, 246, 0.05)', borderColor: 'rgba(59, 130, 246, 0.2)'}}>
              <h4 className="font-bold mb-4">{editingExpenseId ? 'Edit Expense' : 'New Expense'}</h4>
              <form onSubmit={handleExpenseSubmit} className="grid grid-cols-2 gap-4">
                <div className="form-group mb-0">
                  <label className="form-label">Category</label>
                  <select className="form-control" value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value})}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group mb-0">
                  <label className="form-label">Amount (₹)</label>
                  <input type="number" step="0.01" className="form-control" required value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} />
                </div>
                <div className="form-group mb-0" style={{gridColumn: 'span 2'}}>
                  <label className="form-label">Description (Optional)</label>
                  <input type="text" className="form-control" value={expenseForm.description} onChange={e => setExpenseForm({...expenseForm, description: e.target.value})} />
                </div>
                <div className="form-group mb-0">
                  <label className="form-label">Date</label>
                  <input type="date" className="form-control" required value={expenseForm.expenseDate} onChange={e => setExpenseForm({...expenseForm, expenseDate: e.target.value})} />
                </div>
                <div className="flex items-end mb-0 gap-2">
                  <button type="submit" className="btn btn-primary w-full" style={{flex: 1}}>Save</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowExpenseForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th className="text-right">Amount (₹)</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr><td colSpan="5" className="text-center text-muted py-6">No records found</td></tr>
                ) : (
                  expenses.map(exp => (
                    <tr key={exp.id}>
                      <td className="text-sm">{new Date(exp.expenseDate).toLocaleDateString()}</td>
                      <td className="font-medium text-sm">
                        <span className="flex items-center gap-2">
                           <span className="text-cyan">{getCatIcon(exp.category)}</span> {exp.category}
                        </span>
                      </td>
                      <td className="text-sm text-muted">{exp.description || '-'}</td>
                      <td className="text-right font-bold">₹{exp.amount.toLocaleString('en-IN')}</td>
                      <td>
                        <div className="flex justify-center gap-2">
                          <button className="btn-icon" onClick={() => editExpense(exp)}><Edit size={14}/></button>
                          <button className="btn-icon text-danger" onClick={() => deleteExpense(exp.id)}><Trash2 size={14}/></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

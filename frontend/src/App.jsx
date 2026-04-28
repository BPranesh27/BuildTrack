import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Home, DollarSign, LayoutDashboard, Plus, Settings, 
  LogOut, AlertCircle, CheckCircle, Edit, Trash2, ArrowLeft,
  Building, MapPin, Calendar, HardHat, PaintBucket, PenTool,
  Wrench, Zap, Briefcase, Paperclip, Upload, X, FileText, Image as ImageIcon
} from 'lucide-react';

// File Upload Utility
const toBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = error => reject(error);
});
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'https://buildtrack-227q.onrender.com/api';
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => Promise.reject(error));

axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      if (localStorage.getItem('token')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload();
      }
    }
    return Promise.reject(error);
  }
);

const DEFAULT_CATEGORIES = [
  'Labour Charges',
  'Materials',
  'Electric Work',
  'Plumbing',
  'Interiors',
  'Other (specify...)'
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
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // File Attachment State
  const [sitePhotos, setSitePhotos] = useState([]);
  const [previewFile, setPreviewFile] = useState(null); // {data, name, type}
  
  // Expense Form State
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [expenseForm, setExpenseForm] = useState({ 
    category: DEFAULT_CATEGORIES[0], description: '', amount: '', expenseDate: new Date().toISOString().split('T')[0],
    attachment: null, attachmentName: '', attachmentType: ''
  });
  const [customCategoryInput, setCustomCategoryInput] = useState('');

  const loadSitePhotos = (houseData) => {
    try {
      if (houseData && houseData.sitePhotos) {
        setSitePhotos(JSON.parse(houseData.sitePhotos));
      } else {
        setSitePhotos([]);
      }
    } catch(e) { setSitePhotos([]); }
  };

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
      loadSitePhotos(houseRes.data);
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
      let finalCategory = expenseForm.category;
      if (finalCategory === 'Other (specify...)') {
        const trimmed = customCategoryInput.trim();
        if (!trimmed) return alert('Please specify a custom category name');
        finalCategory = trimmed;
      }

      // Ensure date is in ISO format YYYY-MM-DD
      let formattedDate = expenseForm.expenseDate;
      if (formattedDate) {
        const d = new Date(formattedDate);
        if (!isNaN(d.getTime())) {
          formattedDate = d.toISOString().split('T')[0];
        }
      }

      const payload = {
        ...expenseForm,
        expenseDate: formattedDate,
        category: finalCategory,
        house: { id: houseId }, 
        amount: parseFloat(expenseForm.amount) || 0
      };
      let savedExpenseId = editingExpenseId;
      if (editingExpenseId) {
        await axios.put(`/expenses/${editingExpenseId}`, payload);
      } else {
        const res = await axios.post('/expenses', payload);
        savedExpenseId = res.data.id;
      }
      
      // Attachment is now handled by the backend payload

      setShowExpenseForm(false);
      setEditingExpenseId(null);
      resetExpenseForm();
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Failed to save expense';
      alert(`Error: ${typeof msg === 'string' ? msg : 'Server error occurred'}`);
    }
  };

  const resetExpenseForm = () => {
    setExpenseForm({ 
      category: selectedCategory || DEFAULT_CATEGORIES[0], description: '', amount: '', expenseDate: new Date().toISOString().split('T')[0],
      attachment: null, attachmentName: '', attachmentType: ''
    });
    setCustomCategoryInput('');
  };

  const editExpense = (exp) => {
    let fmtDate = exp.expenseDate;
    if (Array.isArray(fmtDate)) {
      fmtDate = `${fmtDate[0]}-${String(fmtDate[1]).padStart(2, '0')}-${String(fmtDate[2]).padStart(2, '0')}`;
    } else if (typeof fmtDate === 'string' && fmtDate.includes('T')) {
      fmtDate = fmtDate.split('T')[0];
    }
    
    const attachment = exp.attachment || null;
    const attachmentName = exp.attachmentName || '';
    const attachmentType = exp.attachmentType || '';

    let formCategory = exp.category;
    let customInput = '';
    if (!DEFAULT_CATEGORIES.includes(exp.category)) {
      formCategory = 'Other (specify...)';
      customInput = exp.category;
    }

    setExpenseForm({
      category: formCategory,
      description: exp.description || '',
      amount: exp.amount,
      expenseDate: fmtDate || new Date().toISOString().split('T')[0],
      attachment, attachmentName, attachmentType
    });
    setCustomCategoryInput(customInput);
    setEditingExpenseId(exp.id);
    setShowExpenseForm(true);
  };

  const deleteExpense = async (id) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      await axios.delete(`/expenses/${id}`);
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Delete failed';
      alert(`Error: ${typeof msg === 'string' ? msg : 'Operation failed'}`);
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

  const baseCategories = ['Labour Charges', 'Materials', 'Electric Work', 'Plumbing', 'Interiors'];
  const categoryStatsMap = {};
  baseCategories.forEach(name => { categoryStatsMap[name] = { name, total: 0, count: 0 }; });

  let maxCatAmount = 1;
  expenses.forEach(exp => {
    const catName = exp.category;
    if (!categoryStatsMap[catName]) {
      categoryStatsMap[catName] = { name: catName, total: 0, count: 0 };
    }
    categoryStatsMap[catName].total += exp.amount;
    categoryStatsMap[catName].count += 1;
    if (categoryStatsMap[catName].total > maxCatAmount) maxCatAmount = categoryStatsMap[catName].total;
  });

  const customCategories = Object.values(categoryStatsMap).filter(c => !baseCategories.includes(c.name));
  const categoryStats = [
    ...baseCategories.map(name => categoryStatsMap[name]),
    ...customCategories,
    { name: 'Other (specify...)', total: 0, count: 0, isButton: true }
  ];

  const profitLoss = house.salePrice - totalSpent;
  const pnlClass = profitLoss >= 0 ? 'text-success' : 'text-danger';

  // Helper for category icons
  const getCatIcon = (cat) => {
    if (cat.includes('Labour')) return <HardHat size={16} />;
    if (cat.includes('Material')) return <Building size={16} />;
    if (cat.includes('Interiors')) return <PaintBucket size={16} />;
    if (cat.includes('Plumb')) return <Wrench size={16} />;
    if (cat.includes('Elect')) return <Zap size={16} />;
    return <PenTool size={16} />;
  };

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

      {!selectedCategory ? (
        <>
          <h2 className="text-xl font-bold mb-4 mt-8">Expense Categories</h2>
          <div className="grid grid-cols-3 gap-6">
            {categoryStats.map((cat, i) => {
              const percent = (cat.total / maxCatAmount) * 100;
              return (
                <div key={i} className="card card-hover cursor-pointer" onClick={() => setSelectedCategory(cat.name)}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2 font-bold text-lg">
                       <span className="text-cyan">{getCatIcon(cat.name)}</span>
                       {cat.name}
                    </div>
                  </div>
                  <div className="flex justify-between items-end mt-4">
                    <div>
                      <div className="text-sm text-muted mb-1">Total Spent</div>
                      <div className="text-xl font-bold text-white">₹{cat.total.toLocaleString('en-IN')}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted mb-1">Expenses</div>
                      <div className="font-bold">{cat.count}</div>
                    </div>
                  </div>
                  <div className="progress-container mt-4">
                    <div className="progress-bar custom-gradient" style={{width: `${percent}%`, background: 'var(--accent-cyan)'}}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="card mt-8">
          <div className="flex justify-between items-center card-header mb-6">
            <div className="flex items-center gap-4">
              <button className="btn btn-secondary btn-icon" onClick={() => { setSelectedCategory(null); setShowExpenseForm(false); }}>
                <ArrowLeft size={16} />
              </button>
              <h3 className="card-title m-0 border-0 flex items-center gap-2">
                <span className="text-cyan">{getCatIcon(selectedCategory)}</span> {selectedCategory} Expenses
              </h3>
            </div>
            <button className="btn btn-primary" onClick={() => { 
                resetExpenseForm(); 
                if (selectedCategory !== 'Other (specify...)') {
                  setExpenseForm(prev => ({ ...prev, category: selectedCategory }));
                } else {
                   setExpenseForm(prev => ({ ...prev, category: 'Other (specify...)' }));
                }
                setShowExpenseForm(!showExpenseForm); 
              }}>
              {showExpenseForm && !editingExpenseId ? 'Cancel' : <><Plus size={16}/> Add Expense</>}
            </button>
          </div>

          {showExpenseForm && (
            <div className="mb-6 p-4 bg-gray-900 rounded-lg animate-fade-in border border-blue-900" style={{backgroundColor: 'rgba(59, 130, 246, 0.05)', borderColor: 'rgba(59, 130, 246, 0.2)'}}>
              <h4 className="font-bold mb-4">{editingExpenseId ? 'Edit Expense' : 'New Expense'}</h4>
              <form onSubmit={handleExpenseSubmit} className="grid grid-cols-2 gap-4">
                {selectedCategory === 'Other (specify...)' && (
                  <div className="form-group mb-0" style={{gridColumn: 'span 2'}}>
                    <label className="form-label">Custom Category Name</label>
                    <input type="text" className="form-control" placeholder="Specify custom category..." value={customCategoryInput} onChange={e => setCustomCategoryInput(e.target.value)} required />
                  </div>
                )}
                <div className="form-group mb-0">
                  <label className="form-label">Amount (₹)</label>
                  <input type="number" step="0.01" className="form-control" required value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} />
                </div>
                <div className="form-group mb-0">
                  <label className="form-label">Date</label>
                  <input type="date" className="form-control" required value={expenseForm.expenseDate} onChange={e => setExpenseForm({...expenseForm, expenseDate: e.target.value})} />
                </div>
                <div className="form-group mb-0" style={{gridColumn: 'span 2'}}>
                  <label className="form-label">Description (Optional)</label>
                  <input type="text" className="form-control" value={expenseForm.description} onChange={e => setExpenseForm({...expenseForm, description: e.target.value})} />
                </div>
                
                {/* File Upload Field */}
                <div className="form-group mb-4" style={{gridColumn: 'span 2'}}>
                  <label className="form-label">Attachment (Bill / Invoice)</label>
                  <div className="upload-zone relative">
                    <input type="file" accept="image/*,.pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        if (file.size > MAX_FILE_SIZE) return alert('File size exceeds 2MB limit.');
                        try {
                           const base64 = await toBase64(file);
                           setExpenseForm({...expenseForm, attachment: base64, attachmentName: file.name, attachmentType: file.type});
                        } catch(err) { alert('Error reading file'); }
                      }} 
                    />
                    <div className="p-6 text-center border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center bg-gray-900 bg-opacity-50 hover:bg-opacity-80 transition-colors">
                      {expenseForm.attachment ? (
                        <div className="flex items-center gap-2 text-cyan">
                          {expenseForm.attachmentType?.includes('pdf') ? <FileText size={24}/> : <ImageIcon size={24}/>}
                          <span className="truncate max-w-[200px]">{expenseForm.attachmentName}</span>
                          <button type="button" className="btn-icon text-danger ml-2 z-10" onClick={(e) => { e.preventDefault(); setExpenseForm({...expenseForm, attachment: null, attachmentName: '', attachmentType: ''}); }}>
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <Upload size={24} className="text-muted mb-2" />
                          <p className="text-sm text-muted">Click or drag file to attach (Max 2MB)</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-end mb-0 gap-2" style={{gridColumn: 'span 2'}}>
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
                  <th className="text-center">Attach</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.filter(exp => exp.category === selectedCategory).length === 0 ? (
                  <tr><td colSpan="6" className="text-center text-muted py-6">No records found for {selectedCategory}</td></tr>
                ) : (
                  expenses.filter(exp => exp.category === selectedCategory).map(exp => {
                    const hasAttachment = !!exp.attachment;
                    return (
                    <tr key={exp.id}>
                      <td className="text-sm">{new Date(exp.expenseDate).toLocaleDateString()}</td>
                      <td className="font-medium text-sm">
                        <span className="flex items-center gap-2">
                           <span className="text-cyan">{getCatIcon(exp.category)}</span> {exp.category}
                        </span>
                      </td>
                      <td className="text-sm text-muted">{exp.description || '-'}</td>
                      <td className="text-right font-bold">₹{exp.amount.toLocaleString('en-IN')}</td>
                      <td className="text-center">
                        {hasAttachment && (
                          <button className="btn-icon text-cyan hover:text-white mx-auto" title="View Attachment" onClick={() => setPreviewFile({ data: exp.attachment, name: exp.attachmentName, type: exp.attachmentType })}>
                            <Paperclip size={16}/>
                          </button>
                        )}
                      </td>
                      <td>
                        <div className="flex justify-center gap-2">
                          <button className="btn-icon" onClick={() => editExpense(exp)}><Edit size={14}/></button>
                          <button className="btn-icon text-danger" onClick={() => deleteExpense(exp.id)}><Trash2 size={14}/></button>
                        </div>
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Site Photos Section */}
      <div className="mt-8 card">
        <div className="flex justify-between items-center mb-6">
          <h3 className="card-title m-0 border-0">Site Photos & Documents</h3>
          <div className="upload-zone relative inline-block">
            <input type="file" multiple accept="image/*,.pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
              onChange={async (e) => {
                const files = Array.from(e.target.files);
                if (!files.length) return;
                
                const newPhotos = [...sitePhotos];
                for (const file of files) {
                  if (file.size > MAX_FILE_SIZE) {
                    alert(`${file.name} exceeds 2MB limit.`);
                    continue;
                  }
                  try {
                    const base64 = await toBase64(file);
                    newPhotos.push({
                      id: Date.now() + Math.random(),
                      data: base64,
                      name: file.name,
                      type: file.type,
                      date: new Date().toISOString()
                    });
                  } catch(err) {}
                }
                
                try {
                  const updatedHouse = { ...house, sitePhotos: JSON.stringify(newPhotos) };
                  await axios.put(`/houses/${houseId}`, updatedHouse);
                  setSitePhotos(newPhotos);
                } catch(err) {
                  alert('Error saving site photos to database.');
                }
              }} 
            />
            <button className="btn btn-secondary text-sm px-3 py-1 flex items-center gap-2"><Upload size={14} /> Upload Files</button>
          </div>
        </div>
        
        {sitePhotos.length === 0 ? (
          <div className="text-center text-muted py-8 bg-gray-900 bg-opacity-50 rounded-lg border border-dashed border-gray-700">
            <ImageIcon size={48} className="mx-auto mb-2 opacity-50 text-gray-500" />
            <p>No site photos or documents added yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {sitePhotos.map((photo) => (
              <div key={photo.id} className="relative rounded-lg overflow-hidden border border-gray-700 aspect-square group bg-gray-800 shadow-sm border-gray-700">
                {photo.type?.includes('pdf') ? (
                  <div className="flex flex-col items-center justify-center h-full p-4 cursor-pointer hover:bg-gray-700 transition" onClick={() => setPreviewFile(photo)}>
                    <FileText size={48} className="text-danger mb-2" />
                    <span className="text-xs text-center truncate w-full text-muted">{photo.name}</span>
                  </div>
                ) : (
                  <img src={photo.data} alt={photo.name} className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300" onClick={() => setPreviewFile(photo)} />
                )}
                
                <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-start justify-end p-2 pointer-events-none">
                  <button className="btn-icon bg-danger text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-all transform scale-75 group-hover:scale-100 pointer-events-auto hover:bg-red-600" 
                    onClick={async (e) => {
                      e.stopPropagation();
                      if(!confirm('Delete this file?')) return;
                      const filtered = sitePhotos.filter(p => p.id !== photo.id);
                      try {
                        const updatedHouse = { ...house, sitePhotos: JSON.stringify(filtered) };
                        await axios.put(`/houses/${houseId}`, updatedHouse);
                        setSitePhotos(filtered);
                      } catch(err) {
                        alert('Error updating site photos in database.');
                      }
                    }}>
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-6 animate-fade-in backdrop-blur-sm" onClick={() => setPreviewFile(null)}>
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col pt-12" onClick={e => e.stopPropagation()}>
            <button className="absolute top-0 right-0 btn-icon text-white hover:text-danger bg-gray-800 bg-opacity-50 hover:bg-opacity-100 rounded-full p-2 m-2 transition" onClick={() => setPreviewFile(null)}>
              <X size={24} />
            </button>
            <div className="w-full bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-gray-700 flex items-center justify-center p-2" style={{minHeight: '60vh'}}>
              {previewFile.type?.includes('pdf') ? (
                <iframe src={previewFile.data} className="w-full h-[80vh] rounded-lg" title="PDF Preview" />
              ) : (
                <img src={previewFile.data} alt={previewFile.name} className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-inner" />
              )}
            </div>
            <div className="text-center mt-4 text-white font-medium drop-shadow-md">
              {previewFile.name}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

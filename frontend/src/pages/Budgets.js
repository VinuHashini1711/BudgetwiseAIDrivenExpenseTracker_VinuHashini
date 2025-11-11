import React, { useEffect, useState } from 'react';
import { fakeApi } from '../api/fakeApi';
import axios from '../api/axios';
import '../styles/Budgets.css';

export default function Budgets(){
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState({ category:'', amount:'' });
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(()=>{ load(); },[]);
  
  const load = async ()=>{ 
    try {
      // Load budgets from fakeApi (localStorage)
      const budgetsList = await fakeApi.listBudgets();
      
      // Load transactions from backend API (real database)
      let transactionsList = [];
      try {
        const response = await axios.get('/api/transactions');
        transactionsList = response.data || [];
      } catch (err) {
        console.log('Using fakeApi for transactions fallback');
        transactionsList = await fakeApi.listTransactions();
      }
      
      // Calculate spent amount for each budget from transactions
      const budgetsWithSpent = budgetsList.map(budget => {
        const budgetSpent = transactionsList
          .filter(t => 
            // Match transactions to budget by category (case-insensitive)
            t.category && t.category.toLowerCase() === budget.name.toLowerCase() &&
            (t.type === 'expense' || t.type === 'Expense')  // Only count expenses
          )
          .reduce((sum, t) => sum + (t.amount || 0), 0);
        
        return {
          ...budget,
          spent: budgetSpent
        };
      });
      
      setBudgets(budgetsWithSpent);
      setTransactions(transactionsList);
    } catch (error) {
      console.error('Error loading budgets and transactions:', error);
    }
  };

  const handleOpenModal = (budget = null) => {
    if (budget) {
      setEditing(budget.id);
      setForm({ category: budget.name, amount: budget.limit.toString() });
    } else {
      setEditing(null);
      setForm({ category: '', amount: '' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setForm({ category: '', amount: '' });
    setEditing(null);
  };

  const add = async (e)=>{ 
    e.preventDefault();
    if (!form.category.trim() || !form.amount) {
      alert('Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      if (editing) {
        // Update budget
        await fakeApi.updateBudget(editing, {
          name: form.category,
          limit: Number(form.amount),
          period: 'monthly',
          startDate: new Date('2025-11-01'),
          endDate: new Date('2025-11-30')
        });
      } else {
        // Add new budget
        await fakeApi.addBudget({ 
          name: form.category, 
          limit: Number(form.amount),
          period: 'monthly',
          startDate: new Date('2025-11-01'),
          endDate: new Date('2025-11-30'),
          spent: 0
        });
      }
      setForm({category:'', amount:''}); 
      handleCloseModal();
      load();  // Reload to recalculate spent amounts from transactions
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      await fakeApi.deleteBudget(id);
      load();
    }
  };

  const getProgressColor = (spent, limit) => {
    const percentage = (spent/limit) * 100;
    if(percentage > 90) return '#ef4444';  // red
    if(percentage > 75) return '#f97316'; // orange
    return '#2563eb'; // blue
  };

  return (
    <div className="budgets-page">
      {/* Header */}
      <div className="budgets-header-section">
        <div>
          <h1 className="page-title">Budgets</h1>
          <p className="page-subtitle">Set spending limits and track your budget</p>
        </div>
        <div style={{display: 'flex', gap: '12px'}}>
          <button 
            className="create-btn" 
            onClick={() => load()}
            style={{backgroundColor: '#6366f1', padding: '10px 20px'}}
            title="Refresh all budget data from transactions"
          >
            ↻ Refresh
          </button>
          <button className="create-btn" onClick={() => handleOpenModal()}>
            + Create Budget
          </button>
        </div>
      </div>

      {/* Monthly Budget Overview */}
      {budgets.length > 0 && (
        <div className="budget-overview-card">
          <div className="budget-overview-header">
            <div>
              <h3 className="budget-title">Month budget</h3>
              <p className="budget-date">Nov 1 - Nov 30, 2025</p>
            </div>
            <div className="budget-amount">
              <div className="total-spent">
                <div className="label">Spent</div>
                <div className="amount">
                  ₹{budgets.reduce((sum, b) => sum + (b.spent || 0), 0).toFixed(2)}
                </div>
              </div>
              <div className="total-limit">
                <div className="label">Total Budget</div>
                <div className="amount">
                  ₹{budgets.reduce((sum, b) => sum + b.limit, 0).toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          <div className="progress-bar-container">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{
                  width: `${Math.min(100, (budgets.reduce((sum, b) => sum + (b.spent || 0), 0) / budgets.reduce((sum, b) => sum + b.limit, 0)) * 100)}%`,
                  backgroundColor: getProgressColor(
                    budgets.reduce((sum, b) => sum + (b.spent || 0), 0),
                    budgets.reduce((sum, b) => sum + b.limit, 0)
                  )
                }}
              />
            </div>
            <div className="progress-text">
              {((budgets.reduce((sum, b) => sum + (b.spent || 0), 0) / budgets.reduce((sum, b) => sum + b.limit, 0)) * 100).toFixed(1)}% used
            </div>
          </div>
        </div>
      )}

      {/* Budget List */}
      <div className="budgets-list-container">
        {budgets.length > 0 ? (
          budgets.map(b => {
            const percentage = ((b.spent || 0) / (b.limit || 1)) * 100;
            const remaining = b.limit - (b.spent || 0);
            const progressColor = getProgressColor(b.spent || 0, b.limit);
            
            return (
              <div key={b.id} className="budget-card">
                <div className="budget-card-header">
                  <div className="budget-info">
                    <h4 className="budget-card-title">{b.name}</h4>
                    <p className="budget-card-period">November 2025</p>
                  </div>
                  <div className="budget-card-actions">
                    <button 
                      className="action-btn edit-btn"
                      onClick={() => handleOpenModal(b)}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button 
                      className="action-btn delete-btn"
                      onClick={() => remove(b.id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="budget-stats">
                  <div className="stat">
                    <span className="stat-label">Spent</span>
                    <span className="stat-value spent">₹{(b.spent || 0).toFixed(2)}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Remaining</span>
                    <span className="stat-value remaining" style={{color: remaining > 0 ? '#10b981' : '#ef4444'}}>
                      ₹{remaining.toFixed(2)}
                    </span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Total Limit</span>
                    <span className="stat-value limit">₹{b.limit.toFixed(2)}</span>
                  </div>
                </div>

                <div className="budget-progress">
                  <div className="progress-bar-small">
                    <div 
                      className="progress-fill-small"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: progressColor
                      }}
                    />
                  </div>
                  <div className="progress-label">
                    <span>{percentage.toFixed(1)}% used</span>
                    <span style={{color: percentage > 90 ? '#ef4444' : '#6b7280'}}>
                      {percentage > 90 ? '⚠️ Over limit!' : 'On track'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <p className="empty-text">No budgets yet</p>
            <p className="empty-subtext">Create your first budget to start tracking expenses</p>
            <button className="empty-btn" onClick={() => handleOpenModal()}>
              Create Budget
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Edit Budget' : 'Create Budget'}</h2>
              <button className="close-btn" onClick={handleCloseModal}>✕</button>
            </div>

            <form onSubmit={add} className="budget-form">
              <div className="form-group">
                <label>Category</label>
                <input 
                  type="text"
                  placeholder="e.g., Groceries, Utilities, Entertainment"
                  value={form.category} 
                  onChange={e => setForm({...form, category: e.target.value})} 
                  required 
                />
              </div>

              <div className="form-group">
                <label>Monthly Budget Limit</label>
                <input 
                  type="number" 
                  placeholder="₹0.00"
                  value={form.amount} 
                  onChange={e => setForm({...form, amount: e.target.value})} 
                  step="0.01"
                  required 
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : (editing ? 'Update Budget' : 'Create Budget')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

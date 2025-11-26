import React, { useState, useEffect, useContext } from 'react';
import axios from '../api/axios';
import { TransactionContext } from '../context/TransactionContext';
import { useTheme } from '../context/ThemeContext';
import '../styles/Goals.css';

export default function Goals() {
  const { isDarkMode } = useTheme();
  const { transactions: globalTransactions } = useContext(TransactionContext);
  
  const [goals, setGoals] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    goalName: '',
    category: 'Home Purchase',
    targetAmount: '',
    currentAmount: '0',
    deadline: '',
    priority: 'Medium'
  });

  // Load goals from backend on mount
  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/goals');
      setGoals(response.data);
    } catch (error) {
      console.error('Error loading goals:', error);
      alert('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddGoal = () => {
    setForm({
      goalName: '',
      category: 'Home Purchase',
      targetAmount: '',
      currentAmount: '0',
      deadline: '',
      priority: 'Medium'
    });
    setEditingGoal(null);
    setShowModal(true);
  };

  const handleEditGoal = (goal) => {
    setForm({
      goalName: goal.goalName,
      category: goal.category,
      targetAmount: goal.targetAmount.toString(),
      currentAmount: goal.currentAmount.toString(),
      deadline: goal.deadline,
      priority: goal.priority
    });
    setEditingGoal(goal.id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!form.goalName.trim()) {
        alert('Please enter a goal name');
        setLoading(false);
        return;
      }

      if (!form.targetAmount || parseFloat(form.targetAmount) <= 0) {
        alert('Please enter a valid target amount');
        setLoading(false);
        return;
      }

      if (!form.deadline) {
        alert('Please select a deadline');
        setLoading(false);
        return;
      }

      const goalData = {
        goalName: form.goalName,
        category: form.category,
        targetAmount: parseFloat(form.targetAmount),
        currentAmount: parseFloat(form.currentAmount) || 0,
        deadline: form.deadline,
        priority: form.priority
      };

      if (editingGoal) {
        // Update existing goal
        const response = await axios.put(`/api/goals/${editingGoal}`, goalData);
        setGoals(prev => prev.map(g => g.id === editingGoal ? response.data : g));
        alert('Goal updated successfully!');
      } else {
        // Create new goal
        const response = await axios.post('/api/goals', goalData);
        setGoals(prev => [...prev, response.data]);
        alert('Goal created successfully!');
      }

      closeModal();
    } catch (err) {
      console.error('Error saving goal:', err);
      alert('Error saving goal');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGoal = async (id) => {
    if (window.confirm('Delete this goal?')) {
      try {
        await axios.delete(`/api/goals/${id}`);
        setGoals(prev => prev.filter(g => g.id !== id));
        alert('Goal deleted successfully!');
      } catch (err) {
        console.error('Error deleting goal:', err);
        alert('Error deleting goal');
      }
    }
  };

  const handleUpdateProgress = async (id, newAmount) => {
    try {
      const goal = goals.find(g => g.id === id);
      const response = await axios.put(`/api/goals/${id}`, {
        ...goal,
        currentAmount: newAmount
      });
      setGoals(prev => prev.map(g => g.id === id ? response.data : g));
    } catch (err) {
      console.error('Error updating progress:', err);
      alert('Error updating progress');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingGoal(null);
  };

  const calculateProgress = (goal) => {
    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    return Math.min(progress, 100);
  };

  const calculateDaysRemaining = (deadline) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calculateAmountNeeded = (goal) => {
    return Math.max(goal.targetAmount - goal.currentAmount, 0);
  };

  const calculateMonthlyAmount = (goal) => {
    const daysRemaining = calculateDaysRemaining(goal.deadline);
    const monthsRemaining = Math.max(daysRemaining / 30, 1);
    return (calculateAmountNeeded(goal) / monthsRemaining).toFixed(2);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return { bg: '#fee2e2', text: '#dc2626' };
      case 'Medium':
        return { bg: '#fef3c7', text: '#d97706' };
      case 'Low':
        return { bg: '#dbeafe', text: '#0284c7' };
      default:
        return { bg: '#f3f4f6', text: '#6b7280' };
    }
  };

  const cardStyle = {
    background: isDarkMode ? '#1e293b' : '#ffffff',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: isDarkMode ? '0 2px 6px rgba(0, 0, 0, 0.3)' : '0 2px 6px rgba(15, 23, 42, 0.06)',
    transition: 'background 0.3s'
  };

  const textColor = isDarkMode ? '#f1f5f9' : '#111827';
  const mutedColor = isDarkMode ? '#d3d7dcff' : '#0e0e0fff';
  const inputBg = isDarkMode ? '#0f172a' : '#ffffff';
  const inputBorder = isDarkMode ? '#334155' : '#e5e7eb';

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 4, color: textColor }}>Savings Goals🎯</h1>
          <div style={{ color: mutedColor }}>Track your progress towards financial goals</div>
        </div>
        <button 
          className="btn" 
          onClick={handleAddGoal}
          style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <span style={{ fontSize: 20 }}>+</span> New Goal
        </button>
      </div>

      {/* Goals List or Empty State */}
      {goals.length === 0 ? (
        <div className="card" style={{ ...cardStyle, textAlign: 'center', padding: '48px 24px', maxWidth: 900, margin: '0 auto' }}>
          <div style={{
            width: 80,
            height: 80,
            margin: '0 auto 24px auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg viewBox="0 0 24 24" width="48" height="48" stroke={mutedColor} strokeWidth="1.5" fill="none">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="4" />
              <line x1="12" y1="2" x2="12" y2="4" />
              <line x1="12" y1="20" x2="12" y2="22" />
              <line x1="22" y1="12" x2="20" y2="12" />
              <line x1="4" y1="12" x2="2" y2="12" />
            </svg>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 500, marginBottom: 8, color: textColor }}>
            No savings goals yet
          </h2>
          <p style={{ color: mutedColor, marginBottom: 24 }}>
            Create your first goal to start saving!
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20, maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20, borderLeft: '4px solid', borderImage: 'linear-gradient(180deg, #8b5cf6, #ec4899) 1', paddingLeft: 24, background: isDarkMode ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(236, 72, 153, 0.08) 100%)' : 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(236, 72, 153, 0.05) 100%)', borderRadius: 12, padding: '20px', paddingLeft: 24 }}>
          {goals.map(goal => {
            const progress = calculateProgress(goal);
            const daysRemaining = calculateDaysRemaining(goal.deadline);
            const amountNeeded = calculateAmountNeeded(goal);
            const monthlyAmount = calculateMonthlyAmount(goal);
            const priorityColor = getPriorityColor(goal.priority);

            return (
              <div key={goal.id} style={{...cardStyle, cursor: 'pointer', transition: 'all 0.3s ease', transform: 'translateY(0)', boxShadow: isDarkMode ? '0 2px 6px rgba(0, 0, 0, 0.3)' : '0 2px 6px rgba(15, 23, 42, 0.06)'}} 
                   onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = isDarkMode ? '0 12px 24px rgba(139, 92, 246, 0.2)' : '0 12px 24px rgba(139, 92, 246, 0.15)'; }} 
                   onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = isDarkMode ? '0 2px 6px rgba(0, 0, 0, 0.3)' : '0 2px 6px rgba(15, 23, 42, 0.06)'; }}>
                {/* Goal Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: textColor }}>{goal.goalName}</h3>
                    <div style={{ display: 'flex', gap: 12, marginTop: 8, alignItems: 'center' }}>
                      <span style={{ color: mutedColor, fontSize: 14 }}>{goal.category}</span>
                      <span 
                        style={{ 
                          background: priorityColor.bg, 
                          color: priorityColor.text, 
                          padding: '4px 12px', 
                          borderRadius: '4px',
                          fontSize: 12,
                          fontWeight: 500
                        }}
                      >
                        {goal.priority}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button 
                      onClick={() => handleEditGoal(goal)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 18,
                        color: textColor
                      }}
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => handleDeleteGoal(goal.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 18,
                        color: '#dc2626'
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: mutedColor, fontSize: 14 }}>Progress</span>
                    <span style={{ color: textColor, fontWeight: 600 }}>{progress.toFixed(1)}%</span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: 8,
                    background: isDarkMode ? '#334155' : '#e5e7eb',
                    borderRadius: 4,
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${progress}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #3b82f6, #2563eb)',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>

                {/* Goal Details Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <div>
                    <div style={{ color: mutedColor, fontSize: 12, marginBottom: 4 }}>Current Amount</div>
                    <div style={{ color: '#10b981', fontSize: 20, fontWeight: 600 }}>
                      ${parseFloat(goal.currentAmount).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: mutedColor, fontSize: 12, marginBottom: 4 }}>Target Amount</div>
                    <div style={{ color: textColor, fontSize: 20, fontWeight: 600 }}>
                      ${parseFloat(goal.targetAmount).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: mutedColor, fontSize: 12, marginBottom: 4 }}>Deadline</div>
                    <div style={{ color: textColor, fontSize: 14, fontWeight: 500 }}>
                      {new Date(goal.deadline).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: mutedColor, fontSize: 12, marginBottom: 4 }}>Days Remaining</div>
                    <div style={{ color: daysRemaining > 0 ? '#3b82f6' : '#dc2626', fontSize: 14, fontWeight: 500 }}>
                      {daysRemaining > 0 ? daysRemaining : 'Overdue'} days
                    </div>
                  </div>
                </div>

                {/* Recommendation */}
                {amountNeeded > 0 && daysRemaining > 0 && (
                  <div style={{
                    background: isDarkMode ? '#1e3a8a' : '#dbeafe',
                    color: isDarkMode ? '#93c5fd' : '#0284c7',
                    padding: 12,
                    borderRadius: 6,
                    fontSize: 14,
                    marginBottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    <span>💡</span>
                    <span>Save <strong>${monthlyAmount}/month</strong> to reach your goal</span>
                  </div>
                )}

                {/* Update Progress */}
                <div style={{ display: 'flex', gap: 12 }}>
                  <input 
                    type="number"
                    placeholder="Add amount"
                    min="0"
                    step="0.01"
                    id={`progress-${goal.id}`}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      border: `1px solid ${inputBorder}`,
                      borderRadius: '6px',
                      background: inputBg,
                      color: textColor
                    }}
                  />
                  <button 
                    onClick={() => {
                      const input = document.getElementById(`progress-${goal.id}`);
                      const amount = parseFloat(input.value);
                      if (amount > 0) {
                        handleUpdateProgress(goal.id, goal.currentAmount + amount);
                        input.value = '';
                      }
                    }}
                    style={{
                      padding: '10px 20px',
                      background: '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 500
                    }}
                  >
                    Update Progress
                  </button>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={closeModal}>
          <div style={{
            background: isDarkMode ? '#1e293b' : '#ffffff',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, color: textColor }}>
                {editingGoal ? 'Edit Goal' : 'Create New Goal'}
              </h2>
              <button 
                onClick={closeModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 20,
                  cursor: 'pointer',
                  color: textColor
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: textColor }}>
                  Goal Name
                </label>
                <input 
                  type="text"
                  name="goalName"
                  value={form.goalName}
                  onChange={handleChange}
                  placeholder="e.g., Emergency Fund"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${inputBorder}`,
                    borderRadius: '6px',
                    background: inputBg,
                    color: textColor
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: textColor }}>
                    Category
                  </label>
                  <select 
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: `1px solid ${inputBorder}`,
                      borderRadius: '6px',
                      background: inputBg,
                      color: textColor
                    }}
                  >
                    <option>Home Purchase</option>
                    <option>Emergency Fund</option>
                    <option>Vacation</option>
                    <option>Education</option>
                    <option>Vehicle</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: textColor }}>
                    Priority
                  </label>
                  <select 
                    name="priority"
                    value={form.priority}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: `1px solid ${inputBorder}`,
                      borderRadius: '6px',
                      background: inputBg,
                      color: textColor
                    }}
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: textColor }}>
                    Target Amount ($)
                  </label>
                  <input 
                    type="number"
                    name="targetAmount"
                    value={form.targetAmount}
                    onChange={handleChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: `1px solid ${inputBorder}`,
                      borderRadius: '6px',
                      background: inputBg,
                      color: textColor
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: textColor }}>
                    Current Amount ($)
                  </label>
                  <input 
                    type="number"
                    name="currentAmount"
                    value={form.currentAmount}
                    onChange={handleChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: `1px solid ${inputBorder}`,
                      borderRadius: '6px',
                      background: inputBg,
                      color: textColor
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: textColor }}>
                  Deadline
                </label>
                <input 
                  type="date"
                  name="deadline"
                  value={form.deadline}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${inputBorder}`,
                    borderRadius: '6px',
                    background: inputBg,
                    color: textColor
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button 
                  type="button"
                  onClick={closeModal}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    background: isDarkMode ? '#334155' : '#e5e7eb',
                    color: textColor,
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 500,
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  {loading ? 'Saving...' : editingGoal ? 'Update Goal' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
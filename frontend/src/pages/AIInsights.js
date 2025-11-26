import React from 'react';
import '../styles/AIInsights.css';

export default function AIInsights() {
  const stats = {
    income: 100000,
    expenses: 25000,
    transactions: 3,
    budgets: 1,
    goals: 0
  };

  return (
    <div className="ai-insights-container">
      <div className="ai-insights-header">
        <div>
          <h1>AI Financial Insights</h1>
          <div style={{ color: '#94a3b8', marginTop: '8px' }}>Get personalized recommendations powered by AI</div>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
        <div className="insight-card" style={{ padding: '16px' }}>
          <div style={{ color: '#10b981', fontSize: '12px', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>Income</div>
          <div style={{ color: '#10b981', fontSize: '20px', fontWeight: '700' }}>₹{stats.income}</div>
        </div>
        <div className="insight-card" style={{ padding: '16px' }}>
          <div style={{ color: '#ef4444', fontSize: '12px', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>Expenses</div>
          <div style={{ color: '#ef4444', fontSize: '20px', fontWeight: '700' }}>₹{stats.expenses}</div>
        </div>
        <div className="insight-card" style={{ padding: '16px' }}>
          <div style={{ color: '#6366f1', fontSize: '12px', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>Transactions</div>
          <div style={{ color: '#6366f1', fontSize: '20px', fontWeight: '700' }}>{stats.transactions}</div>
        </div>
        <div className="insight-card" style={{ padding: '16px' }}>
          <div style={{ color: '#8b5cf6', fontSize: '12px', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>Budgets</div>
          <div style={{ color: '#8b5cf6', fontSize: '20px', fontWeight: '700' }}>{stats.budgets}</div>
        </div>
        <div className="insight-card" style={{ padding: '16px' }}>
          <div style={{ color: '#ec4899', fontSize: '12px', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>Goals</div>
          <div style={{ color: '#ec4899', fontSize: '20px', fontWeight: '700' }}>{stats.goals}</div>
        </div>
      </div>

      {/* AI Insights Section */}
      <div className="insight-card" style={{ textAlign: 'center', padding: '60px 24px', maxWidth: 900, margin: '0 auto', width: '100%', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)' }}>
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)',
          color: '#a855f7',
          fontSize: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px auto',
          animation: 'float 3s ease-in-out infinite'
        }}>
          🤖
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 12, color: '#f1f5f9' }}>Generate AI-Powered Insights</h2>
        <p style={{ color: '#94a3b8', marginBottom: 24 }}>
          Get a comprehensive analysis of your finances with personalized recommendations
        </p>
        <button className="btn" style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', transition: 'all 0.3s ease', boxShadow: '0 2px 8px rgba(139, 92, 246, 0.25)' }} onMouseEnter={(e) => { e.target.style.background = 'linear-gradient(135deg, #a855f7 0%, #c084fc 100%)'; e.target.style.boxShadow = '0 6px 16px rgba(139, 92, 246, 0.4)'; e.target.style.transform = 'translateY(-2px)'; }} onMouseLeave={(e) => { e.target.style.background = 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)'; e.target.style.boxShadow = '0 2px 8px rgba(139, 92, 246, 0.25)'; e.target.style.transform = 'translateY(0)'; }}>
          Generate Insights
        </button>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
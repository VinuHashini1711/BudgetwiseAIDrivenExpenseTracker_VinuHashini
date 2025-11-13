import React, { useEffect, useState, useContext } from 'react';
import { useAuth } from '../context/AuthContext';
import { TransactionContext } from '../context/TransactionContext';
import '../styles/Dashboard.css';

export default function Dashboard(){
  const { user } = useAuth();
  const { transactions, loading, loadTransactions } = useContext(TransactionContext);
  const [summary, setSummary] = useState({ income: 0, expenses: 0, net: 0 });

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  useEffect(() => {
    // Calculate summary from global transactions
    let totalIncome = 0;
    let totalExpenses = 0;

    transactions.forEach(txn => {
      const amount = parseFloat(txn.amount) || 0;
      if (txn.type && txn.type.toLowerCase() === 'income') {
        totalIncome += amount;
      } else if (txn.type && txn.type.toLowerCase() === 'expense') {
        totalExpenses += amount;
      }
    });

    setSummary({
      income: totalIncome,
      expenses: totalExpenses,
      net: totalIncome - totalExpenses
    });
  }, [transactions]);

  const recentTxns = transactions
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title" style={{ marginBottom: 4 }}>Welcome, {user?.username || 'User'}! 👋</h1>
        <p style={{ color: '#6b7280', fontSize: 14 }}>Here's your financial overview</p>
      </div>
      
      <div className="page-title">Dashboard</div>
      
      <div className="stats">
        <div className="card stat-card">
          <div style={{fontSize:20, color:'#0f0a0ac1'}}>Total Income💰</div>
          <div style={{fontSize:22, fontWeight:700, color: '#10b981'}}>₹{summary.income.toFixed(2)}</div>
        </div>
        <div className="card stat-card">
          <div style={{fontSize:20, color:'#07090cff'}}>Total Expenses💸</div>
          <div style={{fontSize:22, fontWeight:700, color: '#ef4444'}}>₹{summary.expenses.toFixed(2)}</div>
        </div>
        <div className="card stat-card">
          <div style={{fontSize:20, color:'#06080bff'}}>Net💼</div>
          <div style={{fontSize:22, fontWeight:700, color: summary.net >= 0 ? '#10b981' : '#ef4444'}}>
            ₹{summary.net.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Recent Transactions</h3>
        <div className="transactions-list">
          {loading && <div style={{color:'#6b7280'}}>Loading transactions...</div>}
          {!loading && recentTxns.length === 0 && <div style={{color:'#6b7280'}}>No transactions yet</div>}
          {!loading && recentTxns.map(txn=> (
            <div key={txn.id} className="txn">
              <div>
                <div style={{fontWeight:700}}>{txn.description}</div>
                <div style={{fontSize:12, color:'#6b7280'}}>
                  {txn.category} • {new Date(txn.date).toLocaleDateString()} • {txn.paymentMethod}
                </div>
              </div>
              <div style={{
                fontWeight:700, 
                color: txn.type && txn.type.toLowerCase() === 'income' ? '#10b981' : '#ef4444'
              }}>
                {txn.type && txn.type.toLowerCase() === 'income' ? '+' : '-'}₹{parseFloat(txn.amount).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

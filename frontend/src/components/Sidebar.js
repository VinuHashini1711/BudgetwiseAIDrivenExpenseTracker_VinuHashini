import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Sidebar(){
  const { user, logout } = useAuth();
  const { isDarkMode } = useTheme();
  const nav = useNavigate();
  const doLogout = ()=>{
    logout();
    nav('/login');
  };

  const subtitleColor = isDarkMode ? '#94a3b8' : '#6b7280';
  const textColor = isDarkMode ? '#cbd5e1' : '#374151';
  const borderColor = isDarkMode ? '#334155' : '#e5e7eb';

  return (
    <aside className="sidebar">
      <div>
        <div className="logo">
          <div className="app-icon">B</div>
          <div>
            <div style={{fontWeight:700, color: isDarkMode ? '#f1f5f9' : '#111827'}}>BudgetWise</div>
            <div style={{fontSize:12, color: subtitleColor}}>AI Financial Advisor</div>
          </div>
        </div>
        <nav className="nav">
          <NavLink to="/dashboard" className={({isActive})=>isActive? 'active':''}>
            <span style={{display:'flex', gap:8, alignItems:'center'}}>
              <span style={{width:20, display:'inline-flex'}}>📊</span>
              Dashboard
            </span>
          </NavLink>
          <NavLink to="/transactions" className={({isActive})=>isActive? 'active':''}>
            <span style={{display:'flex', gap:8, alignItems:'center'}}>
              <span style={{width:20, display:'inline-flex'}}>💳</span>
              Transactions
            </span>
          </NavLink>
          <NavLink to="/budgets" className={({isActive})=>isActive? 'active':''}>
            <span style={{display:'flex', gap:8, alignItems:'center'}}>
              <span style={{width:20, display:'inline-flex'}}>💰</span>
              Budgets
            </span>
          </NavLink>
          <NavLink to="/goals" className={({isActive})=>isActive? 'active':''}>
            <span style={{display:'flex', gap:8, alignItems:'center'}}>
              <span style={{width:20, display:'inline-flex'}}>🎯</span>
              Goals
            </span>
          </NavLink>
          <NavLink to="/ai-insights" className={({isActive})=>isActive? 'active':''}>
            <span style={{display:'flex', gap:8, alignItems:'center'}}>
              <span style={{width:20, display:'inline-flex'}}>🤖</span>
              AI Insights
            </span>
          </NavLink>
          <NavLink to="/profile" className={({isActive})=>isActive? 'active':''}>
            <span style={{display:'flex', gap:8, alignItems:'center'}}>
              <span style={{width:20, display:'inline-flex'}}>👤</span>
              Profile
            </span>
          </NavLink>
          <NavLink to="/settings" className={({isActive})=>isActive? 'active':''}>
            <span style={{display:'flex', gap:8, alignItems:'center'}}>
              <span style={{width:20, display:'inline-flex'}}>⚙️</span>
              Settings
            </span>
          </NavLink>
        </nav>
      </div>

      <div>
        <button onClick={doLogout} className="btn secondary" style={{width:'100%', marginBottom:12}}>Logout</button>
        <div className="sidebar-bottom" style={{borderTopColor: borderColor}}>
          <div className="avatar">{user && user.username ? user.username[0].toUpperCase() : 'U'}</div>
          <div style={{fontSize:14, color: textColor}}>{user?.username}<div style={{fontSize:12, color: subtitleColor}}>{user?.email}</div></div>
        </div>
      </div>
    </aside>
  );
}

import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useTheme } from '../context/ThemeContext';
import '../styles/Settings.css';

export default function Settings(){
  const { isDarkMode, toggleTheme } = useTheme();
  
  const [settings, setSettings] = useState({
    language: 'us English',
    currency: 'INR (₹) - Indian Rupee',
    monthlyIncome: '100000',
    riskTolerance: 'Moderate - Balanced approach to risk and return'
  });
  const [loading, setLoading] = useState(false);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/settings');
      const data = response.data;
      setSettings({
        language: data.language || 'us English',
        currency: data.currency || 'INR (₹) - Indian Rupee',
        monthlyIncome: data.monthlyIncome || '100000',
        riskTolerance: data.riskTolerance || 'Moderate - Balanced approach to risk and return'
      });
    } catch (error) {
      console.error('Error loading settings:', error);
      // Use default values on error
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveChanges = async () => {
    try {
      setLoading(true);
      // Save to backend API
      await axios.put('/api/settings', {
        language: settings.language,
        currency: settings.currency,
        monthlyIncome: settings.monthlyIncome,
        riskTolerance: settings.riskTolerance
      });
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = isDarkMode ? {
    width: '100%', 
    padding:'10px 12px', 
    border:'1px solid #334155', 
    borderRadius:'6px',
    background: '#1e293b',
    color: '#f1f5f9'
  } : {
    width: '100%', 
    padding:'10px 12px', 
    border:'1px solid #e5e7eb', 
    borderRadius:'6px'
  };

  return (
    <div>
      <div style={{marginBottom:24}}>
        <h1 className="page-title" style={{marginBottom:4}}>Settings</h1>
        <div style={{color: isDarkMode ? '#94a3b8' : '#6b7280'}}>Manage your app preferences</div>
      </div>

      {/* Appearance */}
      <div className="card" style={{marginBottom:24, background: isDarkMode ? '#1e293b' : '#ffffff'}}>
        <div style={{display:'flex', gap:12, alignItems:'center', marginBottom:16}}>
          <div style={{
            width:40, 
            height:40, 
            background: isDarkMode ? '#334155' : '#f3f4f6', 
            borderRadius:8,
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            fontSize:20
          }}>
            ☼
          </div>
          <div>
            <div style={{fontWeight:600, fontSize:16, color: isDarkMode ? '#f1f5f9' : '#111827'}}>Appearance</div>
            <div style={{color: isDarkMode ? '#94a3b8' : '#6b7280', fontSize:14}}>Customize how BudgetWise looks</div>
          </div>
        </div>

        <div className="form-row">
          <label style={{color: isDarkMode ? '#cbd5e1' : '#374151'}}>Dark Mode</label>
          <div style={{display:'flex', alignItems:'center', gap:12}}>
            <div 
              onClick={toggleTheme}
              style={{display:'flex', alignItems:'center', gap:8, cursor:'pointer'}}
            >
              <div style={{
                width:44,
                height:24,
                background: isDarkMode ? '#2563eb' : '#e5e7eb',
                borderRadius:12,
                position:'relative',
                transition:'background-color 0.2s',
                cursor: 'pointer'
              }}>
                <div style={{
                  width:20,
                  height:20,
                  background:'white',
                  borderRadius:'50%',
                  position:'absolute',
                  top:2,
                  left: isDarkMode ? 22 : 2,
                  transition:'left 0.2s'
                }} />
              </div>
              <span style={{color: isDarkMode ? '#cbd5e1' : '#374151', userSelect: 'none'}}>Switch between light and dark theme</span>
            </div>
          </div>
        </div>
      </div>

      {/* Language */}
      <div className="card" style={{marginBottom:24, background: isDarkMode ? '#1e293b' : '#ffffff'}}>
        <div style={{display:'flex', gap:12, alignItems:'center', marginBottom:16}}>
          <div style={{
            width:40, 
            height:40, 
            background: isDarkMode ? '#334155' : '#f3f4f6', 
            borderRadius:8,
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            fontSize:20
          }}>
            🌐
          </div>
          <div>
            <div style={{fontWeight:600, fontSize:16, color: isDarkMode ? '#f1f5f9' : '#111827'}}>Language</div>
            <div style={{color: isDarkMode ? '#94a3b8' : '#6b7280', fontSize:14}}>Choose your preferred language</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            background: isDarkMode ? '#0e7490' : '#dbeafe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            color: isDarkMode ? '#06b6d4' : '#0284c7',
            flexShrink: 0
          }}>
            🗣️
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: isDarkMode ? '#cbd5e1' : '#111827' }}>Select Language</label>
            <select 
              value={settings.language}
              onChange={e => handleChange('language', e.target.value)}
              style={inputStyle}
            >
              <option value="us English">US English</option>
              <option value="uk English">UK English</option>
              <option value="spanish">Spanish</option>
              <option value="french">French</option>
            </select>
          </div>
        </div>
      </div>

      {/* Financial Preferences */}
      <div className="card" style={{marginBottom:24, background: isDarkMode ? '#1e293b' : '#ffffff'}}>
        <div style={{display:'flex', gap:12, alignItems:'center', marginBottom:16}}>
          <div style={{
            width:40, 
            height:40, 
            background: isDarkMode ? '#334155' : '#f3f4f6', 
            borderRadius:8,
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            fontSize:20
          }}>
            💰
          </div>
          <div>
            <div style={{fontWeight:600, fontSize:16, color: isDarkMode ? '#f1f5f9' : '#111827'}}>Financial Preferences</div>
            <div style={{color: isDarkMode ? '#94a3b8' : '#6b7280', fontSize:14}}>Set your currency and financial settings</div>
          </div>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:20}}>
          {/* Currency */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: isDarkMode ? '#713f12' : '#fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              color: isDarkMode ? '#fbbf24' : '#d97706',
              flexShrink: 0
            }}>
              💵
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: isDarkMode ? '#cbd5e1' : '#111827' }}>Preferred Currency</label>
              <select 
                value={settings.currency}
                onChange={e => handleChange('currency', e.target.value)}
                style={inputStyle}
              >
                <option>INR (₹) - Indian Rupee</option>
                <option>USD ($) - US Dollar</option>
                <option>EUR (€) - Euro</option>
                <option>GBP (£) - British Pound</option>
              </select>
            </div>
          </div>

          {/* Monthly Income */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: isDarkMode ? '#14532d' : '#dcfce7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              color: isDarkMode ? '#86efac' : '#16a34a',
              flexShrink: 0
            }}>
              💳
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: isDarkMode ? '#cbd5e1' : '#111827' }}>Average Monthly Income</label>
              <input 
                type="text"
                value={settings.monthlyIncome}
                onChange={e => handleChange('monthlyIncome', e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Risk Tolerance - Full Width */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', gridColumn: '1 / -1' }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: isDarkMode ? '#7f1d1d' : '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              color: isDarkMode ? '#fca5a5' : '#dc2626',
              flexShrink: 0
            }}>
              ⚖️
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: isDarkMode ? '#cbd5e1' : '#111827' }}>Risk Tolerance</label>
              <select 
                value={settings.riskTolerance}
                onChange={e => handleChange('riskTolerance', e.target.value)}
                style={inputStyle}
              >
                <option>Conservative - Low risk, stable returns</option>
                <option>Moderate - Balanced approach to risk and return</option>
                <option>Aggressive - Higher risk, potential higher returns</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button 
        onClick={saveChanges}
        className="btn"
        style={{padding:'12px 24px', fontSize:15}}
        disabled={loading}
      >
        {loading ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}

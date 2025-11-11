import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Welcome.css';

export default function Welcome() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          handleNext();
          return 100;
        }
        return prev + 10;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleNext = () => {
    sessionStorage.setItem('welcomed', 'true');
    navigate('/login');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: 20,
      textAlign: 'center'
    }}>
      <div style={{
        width: 100,
        height: 100,
        background: 'white',
        borderRadius: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 48,
        color: '#667eea',
        marginBottom: 24,
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
        fontWeight: 700
      }}>
        B
      </div>

      <div style={{
        fontSize: 36,
        fontWeight: 700,
        marginBottom: 8,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        justifyContent: 'center'
      }}>
        <span>👋</span>
        <span>Welcome to BudgetWise</span>
      </div>
      
      <div style={{
        fontSize: 22,
        color: '#e0e7ff',
        marginBottom: 32,
        fontWeight: 500
      }}>
        Your AI-Powered Expense Tracker
      </div>

      <div style={{
        fontSize: 16,
        color: '#f3f4f6',
        maxWidth: 500,
        lineHeight: 1.8,
        marginBottom: 40
      }}>
        Manage your income, budgets, and spending with ease. Get AI-powered insights to help you make smarter financial decisions.
      </div>

      {/* Loading bar */}
      <div style={{
        width: 280,
        height: 6,
        background: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 3,
        marginBottom: 24,
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.3)'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          background: 'white',
          width: `${progress}%`,
          transition: 'width 0.3s ease'
        }} />
      </div>

      <div style={{
        fontSize: 14,
        color: '#e0e7ff',
        marginBottom: 32
      }}>
        Loading in {Math.ceil((100 - progress) / 10)} seconds...
      </div>

      {/* Get Started Button */}
      <button
        onClick={handleNext}
        style={{
          background: 'white',
          color: '#667eea',
          border: 'none',
          padding: '12px 32px',
          fontSize: 16,
          fontWeight: 600,
          borderRadius: 8,
          cursor: 'pointer',
          transition: 'transform 0.2s, box-shadow 0.2s',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
        }}
        onMouseOver={(e) => {
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
        }}
        onMouseOut={(e) => {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
        }}
      >
        Get Started →
      </button>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
import React, { useState, useEffect, useRef } from 'react';
import axios from '../api/axios';
import { useTheme } from '../context/ThemeContext';
import '../styles/AIInsights.css';

export default function AIInsights() {
  const { isDarkMode } = useTheme();
  const [stats, setStats] = useState({
    income: 0,
    expenses: 0,
    transactions: 0,
    budgets: 0,
    goals: 0,
    balance: 0
  });
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [selectedQuickPrompt, setSelectedQuickPrompt] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const fetchStats = async () => {
    try {
      const [transactionsRes, budgetsRes, goalsRes] = await Promise.all([
        axios.get('/api/transactions'),
        axios.get('/api/budgets'),
        axios.get('/api/goals')
      ]);

      const transactions = transactionsRes.data;
      const budgets = budgetsRes.data;
      const goals = goalsRes.data;

      const income = transactions
        .filter(t => t.type?.toLowerCase() === 'income')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

      const expenses = transactions
        .filter(t => t.type?.toLowerCase() === 'expense')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

      setStats({
        income: Math.round(income),
        expenses: Math.round(expenses),
        transactions: transactions.length,
        budgets: budgets.length,
        goals: goals.length,
        balance: Math.round(income - expenses)
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const quickPrompts = [
    { emoji: '📊', text: 'Analyze Spending', query: 'Analyze my spending patterns and provide detailed insights' },
    { emoji: '💡', text: 'Budget Tips', query: 'Provide budget recommendations based on my financial situation' },
    { emoji: '💰', text: 'Save Money', query: 'Give me practical tips to save more money monthly' },
    { emoji: '📈', text: 'Investment Tips', query: 'What investment strategies would you recommend for me?' }
  ];

  const handleQuickPrompt = async (prompt) => {
    setSelectedQuickPrompt(prompt.text);
    setChatInput(prompt.query);
    await sendMessage(prompt.query);
  };

  const sendMessage = async (message = chatInput) => {
    if (!message.trim() && chatInput.trim()) return;

    const finalMessage = message || chatInput;
    if (!finalMessage.trim()) return;

    setChatMessages(prev => [...prev, { type: 'user', content: finalMessage }]);
    setChatInput('');
    setLoading(true);

    try {
      const response = await axios.post('/api/ai/insights', {
        query: finalMessage,
        context: ''
      });

      const aiResponse =
        response.data.insight || "I received your question but couldn't generate a response.";
      setChatMessages(prev => [
        ...prev,
        {
          type: 'ai',
          content: aiResponse,
          category: response.data.category
        }
      ]);
    } catch (error) {
      console.error('Error generating AI response:', error);
      setChatMessages(prev => [
        ...prev,
        {
          type: 'ai',
          content:
            "Sorry, I'm having trouble connecting to the AI service. Please make sure Ollama is running and try again."
        }
      ]);
    } finally {
      setLoading(false);
      setSelectedQuickPrompt(null);
    }
  };

  const textColor = isDarkMode ? '#e0e7ff' : '#1f2937';
  const secondaryTextColor = isDarkMode ? '#a0aec0' : '#6b7280';
  const cardBg = isDarkMode ? '#2d2a45' : '#ffffff';
  const bgGradient = isDarkMode
    ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
    : 'linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)';

  return (
    <div style={{ background: bgGradient, minHeight: '100vh', padding: '24px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            marginBottom: '32px',
            padding: '32px',
            background: cardBg,
            borderRadius: '16px',
            border: `1px solid ${isDarkMode ? '#4d4a6f' : '#e5e7eb'}`,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '300px',
              height: '300px',
              background:
                'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
              borderRadius: '50%',
              transform: 'translate(50%, -50%)',
              zIndex: 0
            }}
          ></div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '12px'
              }}
            >
              <div style={{ fontSize: '40px' }}>🤖</div>
              <div>
                <h1
                  style={{
                    color: textColor,
                    margin: '0 0 8px 0',
                    fontSize: '32px',
                    fontWeight: '700'
                  }}
                >
                  AI Financial Assistant
                </h1>
                <p
                  style={{
                    color: secondaryTextColor,
                    margin: 0,
                    fontSize: '16px'
                  }}
                >
                  Get personalized financial insights powered by advanced AI
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px',
            marginBottom: '32px'
          }}
        >
          {/* Stats Cards */}
          <div>
            <div style={{ display: 'grid', gap: '16px' }}>
              {[
                { label: 'Income', value: stats.income, color: '#10b981', icon: '💰' },
                { label: 'Expenses', value: stats.expenses, color: '#ef4444', icon: '💸' },
                { label: 'Balance', value: stats.balance, color: '#6366f1', icon: '📊' }
              ].map((stat, idx) => (
                <div
                  key={idx}
                  style={{
                    background: cardBg,
                    padding: '20px',
                    borderRadius: '12px',
                    border: `1px solid ${isDarkMode ? '#4d4a6f' : '#e5e7eb'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                  }}
                >
                  <div style={{ fontSize: '32px' }}>{stat.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        color: secondaryTextColor,
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}
                    >
                      {stat.label}
                    </div>
                    <div
                      style={{
                        color: textColor,
                        fontSize: '24px',
                        fontWeight: '700',
                        marginTop: '4px'
                      }}
                    >
                      ₹{stat.value.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Prompts */}
          <div
            style={{
              background: cardBg,
              padding: '24px',
              borderRadius: '12px',
              border: `1px solid ${isDarkMode ? '#4d4a6f' : '#e5e7eb'}`
            }}
          >
            <h3
              style={{
                color: textColor,
                marginTop: 0,
                marginBottom: '16px',
                fontSize: '18px',
                fontWeight: '600'
              }}
            >
              Quick Actions
            </h3>
            <div style={{ display: 'grid', gap: '10px' }}>
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickPrompt(prompt)}
                  disabled={loading}
                  style={{
                    background: isDarkMode
                      ? 'linear-gradient(135deg, #3f3f70 0%, #2d2a45 100%)'
                      : 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                    border: `1px solid ${isDarkMode ? '#4d4a6f' : '#d1d5db'}`,
                    padding: '12px 16px',
                    borderRadius: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    color: textColor,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.3s ease',
                    opacity: loading ? 0.6 : 1
                  }}
                  onMouseEnter={e =>
                    !loading && (e.target.style.transform = 'translateX(4px)')
                  }
                  onMouseLeave={e =>
                    !loading && (e.target.style.transform = 'translateX(0)')
                  }
                >
                  <span style={{ fontSize: '18px' }}>{prompt.emoji}</span>
                  <span style={{ flex: 1, textAlign: 'left' }}>{prompt.text}</span>
                  <span>→</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Section */}
        <div
          style={{
            background: cardBg,
            borderRadius: '12px',
            border: `1px solid ${isDarkMode ? '#4d4a6f' : '#e5e7eb'}`,
            display: 'flex',
            flexDirection: 'column',
            height: '600px',
            overflow: 'hidden'
          }}
        >
          {/* Chat Header */}
          <div
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: 'white',
              padding: '20px 24px',
              borderBottom: '1px solid rgba(0,0,0,0.1)'
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: '600'
              }}
            >
              💬 Financial Chat
            </h3>
            <p
              style={{
                margin: '4px 0 0 0',
                fontSize: '13px',
                opacity: 0.9
              }}
            >
              Ask anything about your finances
            </p>
          </div>

          {/* Messages Container */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              background: isDarkMode
                ? 'rgba(15, 23, 42, 0.5)'
                : 'rgba(249, 250, 251, 0.5)'
            }}
          >
            {chatMessages.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  gap: '12px',
                  color: secondaryTextColor,
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '48px' }}>👋</div>
                <p>Start a conversation with your AI financial advisor!</p>
                <p style={{ fontSize: '13px', opacity: 0.8 }}>
                  Use quick actions above or type your own question
                </p>
              </div>
            ) : (
              chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent:
                      msg.type === 'user' ? 'flex-end' : 'flex-start',
                    animation: 'fadeIn 0.3s ease'
                  }}
                >
                  <div
                    style={{
                      maxWidth: '70%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background:
                        msg.type === 'user'
                          ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                          : isDarkMode
                          ? '#334155'
                          : '#f3f4f6',
                      color: msg.type === 'user' ? 'white' : textColor,
                      fontSize: '14px',
                      lineHeight: '1.5',
                      wordBreak: 'break-word',
                      boxShadow:
                        msg.type === 'user'
                          ? '0 4px 12px rgba(99, 102, 241, 0.3)'
                          : 'none'
                    }}
                  >
                    {msg.content}
                    {msg.category && msg.type === 'ai' && (
                      <div
                        style={{
                          marginTop: '8px',
                          fontSize: '11px',
                          opacity: 0.7,
                          fontStyle: 'italic'
                        }}
                      >
                        📌 {msg.category}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                  color: secondaryTextColor
                }}
              >
                <div style={{ fontSize: '20px' }}>🤔</div>
                <div>Thinking...</div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div
            style={{
              padding: '16px',
              borderTop: `1px solid ${isDarkMode ? '#4d4a6f' : '#e5e7eb'}`,
              background: cardBg,
              display: 'flex',
              gap: '12px'
            }}
          >
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && sendMessage()}
              placeholder="Ask me about your finances..."
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '24px',
                border: `1px solid ${isDarkMode ? '#4d4a6f' : '#d1d5db'}`,
                background: isDarkMode ? '#1a1f2e' : 'white',
                color: textColor,
                fontSize: '14px',
                outline: 'none'
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !chatInput.trim()}
              style={{
                padding: '12px 20px',
                background: loading
                  ? '#6b7280'
                  : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '24px',
                cursor:
                  loading || !chatInput.trim() ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={e =>
                !loading && (e.target.style.transform = 'scale(1.05)')
              }
              onMouseLeave={e =>
                !loading && (e.target.style.transform = 'scale(1)')
              }
            >
              {loading ? '⏳' : '🚀'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

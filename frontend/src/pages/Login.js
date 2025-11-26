import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Login.css';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await login(identifier, password);
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    navigate('/dashboard');
  };

  return (
    <div className="login-modern-wrapper">
      {/* Animated Background */}
      <div className="login-animated-bg">
        <div className="login-blob blob-1"></div>
        <div className="login-blob blob-2"></div>
        <div className="login-blob blob-3"></div>
      </div>

      {/* Main Container */}
      <div className="login-modern-container">
        {/* Login Form - Centered */}
        <div className="login-center-panel">
          <div className="login-form-wrapper">
            <div className="login-form-header">
              <h2>Welcome Back</h2>
              <p>Sign in to your account to continue</p>
            </div>

            {error && (
              <div className="login-error-banner">
                <span className="login-error-icon">⚠️</span>
                <div>
                  <strong>Login Error</strong>
                  <p>{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form-modern">
              {/* Username or Email */}
              <div className="login-input-group">
                <label htmlFor="identifier" className="login-label">
                  <span className="login-label-icon">👤</span>
                  Username or Email
                </label>
                <input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter your username or email"
                  required
                  className="login-input-field"
                  disabled={loading}
                />
              </div>

              {/* Password */}
              <div className="login-input-group">
                <label htmlFor="password" className="login-label">
                  <span className="login-label-icon">🔐</span>
                  Password
                </label>
                <div className="login-password-wrapper">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="login-input-field"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="login-toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              {/* Remember & Forgot */}
              <div className="login-form-options">
                <label className="login-remember-me">
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>
                <a href="#" className="login-forgot-password">Forgot password?</a>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                className={`login-submit-btn ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="login-spinner"></span>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <span className="login-btn-arrow">→</span>
                  </>
                )}
              </button>

              {/* Register Link */}
              <div className="login-register-prompt">
                <p>Don't have an account? <Link to="/register" className="login-register-link">Create one</Link></p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}


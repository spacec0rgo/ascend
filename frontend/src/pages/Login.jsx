import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login as apiLogin } from '../api';
import { useAuth } from '../context/AuthContext';

const s = {
  page: { minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', padding: '40px', width: '100%', maxWidth: '420px' },
  title: { fontSize: '24px', fontWeight: 700, marginBottom: '8px' },
  subtitle: { color: 'var(--text-muted)', fontSize: '14px', marginBottom: '32px' },
  field: { marginBottom: '18px', position: 'relative' }, // Added relative positioning
  label: { display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-muted)' },
  input: {
    width: '100%',
    padding: '10px 40px 10px 14px', // Added right padding so text doesn't go under the eye
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    color: 'var(--text)',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.15s',
    boxSizing: 'border-box'
  },
  btn: {
    width: '100%',
    padding: '12px',
    background: 'var(--accent)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '10px',
  },
  error: { color: '#ef4444', fontSize: '13px', marginBottom: '16px', textAlign: 'center' },
  footer: { marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' },
  link: { color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 },
  eyeBtn: { 
    position: 'absolute', 
    right: '12px', 
    top: '32px', // Adjust based on your label height
    background: 'none', 
    border: 'none', 
    cursor: 'pointer', 
    color: 'var(--text-muted)',
    padding: 0,
    display: 'flex',
    alignItems: 'center'
  }
};

// EyeIcon component
const EyeIcon = ({ visible }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {visible ? (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      </>
    ) : (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    )}
  </svg>
);

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // New state
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { updateAuth } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiLogin(email, password);
      updateAuth(data.user, data.token);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.title}>Welcome back</h1>
        <p style={s.subtitle}>Log in to track your certification progress.</p>
        
        <form onSubmit={handleSubmit}>
          <div style={s.field}>
            <label style={s.label}>Username or Email</label>
            <input
              style={s.input}
              type="text"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter username or email"
              required
            />
          </div>

          <div style={s.field}>
            <label style={s.label}>Password</label>
            <input
              style={s.input}
              type={showPassword ? "text" : "password"} // Dynamic type
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            {/* The Toggle Button */}
            <button 
              type="button" 
              style={s.eyeBtn} 
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <EyeIcon visible={showPassword} />
            </button>
          </div>

          {error && <div style={s.error}>{error}</div>}
          
          <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>

        <div style={s.footer}>
          Don't have an account? <Link to="/register" style={s.link}>Register</Link>
        </div>
      </div>
    </div>
  );
}
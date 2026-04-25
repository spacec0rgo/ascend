import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register as apiRegister } from '../api';
import { useAuth } from '../context/AuthContext';

// --- Validation Helpers ---
const checkPwdStrength = (pwd) => {
  const length = pwd.length >= 12;
  const upper = /[A-Z]/.test(pwd);
  const lower = /[a-z]/.test(pwd);
  const digit = /[0-9]/.test(pwd);
  const special = /[-!"#$%&()*,./:;?@[\\\]^_\`{|}~+<=>]/.test(pwd);
  return { length, upper, lower, digit, special, isValid: length && upper && lower && digit && special };
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const CheckMark = ({ met }) => (
  <span style={{ 
    color: met ? 'var(--success)' : 'var(--text-muted)', 
    fontSize: '14px', 
    fontWeight: 'bold',
    marginRight: '8px',
    transition: 'color 0.2s'
  }}>
    {met ? '✓' : '○'}
  </span>
);

const s = {
  page: { minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', padding: '40px', width: '100%', maxWidth: '420px' },
  title: { fontSize: '24px', fontWeight: 700, marginBottom: '8px' },
  subtitle: { color: 'var(--text-muted)', fontSize: '14px', marginBottom: '32px' },
  field: { marginBottom: '18px', position: 'relative' },
  label: { display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-muted)' },
  input: {
    width: '100%', padding: '10px 40px 10px 14px', background: 'var(--surface2)',
    border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)',
    fontSize: '14px', outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box'
  },
  btn: {
    width: '100%', padding: '12px', background: 'var(--accent)', border: 'none',
    borderRadius: '10px', color: '#fff', fontSize: '15px', fontWeight: 600,
    cursor: 'pointer', marginTop: '8px', transition: 'opacity 0.15s',
  },
  error: { color: 'var(--danger)', fontSize: '13px', marginTop: '12px', textAlign: 'center' },
  footer: { textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'var(--text-muted)' },
  link: { color: 'var(--accent)', fontWeight: 600 },
  eyeBtn: { 
    position: 'absolute', right: '12px', top: '32px', background: 'none', 
    border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, 
    display: 'flex', alignItems: 'center'
  },
  errorText: { color: '#ef4444', fontSize: '12px', marginTop: '4px' },
  feedbackContainer: { marginTop: '8px' },
  feedbackText: { fontSize: '12px', marginTop: '4px', transition: 'color 0.2s' }
};

const EyeIcon = ({ visible }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {visible ? (
      <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></>
    ) : (
      <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
    )}
  </svg>
);

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Real-time derivation logic
  const isUsernameValid = username.length >= 4;
  const isEmailValid = email.length === 0 || isValidEmail(email);
  const pwdStats = checkPwdStrength(password);
  const passwordsMatch = password === confirmPassword;
  const showPasswordError = confirmPassword.length > 0 && !passwordsMatch;

  const isFormValid = isUsernameValid && isEmailValid && pwdStats.isValid && passwordsMatch && email.length > 0;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isFormValid) return; 

    setError('');
    setLoading(true);
    try {
      const { token, user } = await apiRegister(username, email, password);
      login(token, user);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.title}>Create account</h1>
        <p style={s.subtitle}>Start tracking your learning path today.</p>
        <form onSubmit={handleSubmit}>
          
          <div style={s.field}>
            <label style={s.label}>Username</label>
            <input 
              style={s.input} type="text" value={username} 
              onChange={e => setUsername(e.target.value)} 
              placeholder="yourname" required 
            />
            {username.length > 0 && (
              <div style={{ ...s.feedbackText, color: isUsernameValid ? 'var(--success)' : 'var(--text-muted)' }}>
                {isUsernameValid ? '✓' : '○'} At least 4 characters
              </div>
            )}
          </div>
          
          <div style={s.field}>
            <label style={s.label}>Email</label>
            <input 
              style={{ ...s.input, borderColor: !isEmailValid && email.length > 0 ? '#ef4444' : 'var(--border)' }} 
              type="email" value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="you@example.com" required 
            />
          </div>

          <div style={s.field}>
            <label style={s.label}>Password</label>
            <input 
              style={s.input} 
              type={showPassword ? "text" : "password"} 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              placeholder="Min. 12 characters" 
              required 
            />
            <button type="button" style={s.eyeBtn} onClick={() => setShowPassword(!showPassword)}>
              <EyeIcon visible={showPassword} />
            </button>
            
            {password.length > 0 && (
              <div style={s.feedbackContainer}>
                {[
                  { met: pwdStats.length, text: 'At least 12 characters' },
                  { met: pwdStats.upper, text: 'Uppercase letters' },
                  { met: pwdStats.lower, text: 'Lowercase letters' },
                  { met: pwdStats.digit, text: 'Numbers' },
                  { met: pwdStats.special, text: 'Special characters' }
                ].map((req, idx) => (
                  <div key={idx} style={{ ...s.feedbackText, color: req.met ? 'var(--success)' : 'var(--text-muted)' }}>
                    <CheckMark met={req.met} /> {req.text}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={s.field}>
            <label style={s.label}>Confirm Password</label>
            <input 
              style={{ ...s.input, borderColor: showPasswordError ? '#ef4444' : 'var(--border)' }} 
              type={showConfirm ? "text" : "password"} 
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repeat password" 
              required 
            />
            <button type="button" style={s.eyeBtn} onClick={() => setShowConfirm(!showConfirm)}>
              <EyeIcon visible={showConfirm} />
            </button>
            {showPasswordError && <div style={s.errorText}>Passwords do not match</div>}
          </div>

          {error && <div style={s.error}>{error}</div>}
          
          <button 
            style={{ ...s.btn, opacity: (loading || !isFormValid) ? 0.7 : 1 }} 
            type="submit" 
            disabled={loading || !isFormValid}
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>
        <div style={s.footer}>
          Already have an account? <Link to="/login" style={s.link}>Login</Link>
        </div>
      </div>
    </div>
  );
}
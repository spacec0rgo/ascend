import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  fetchUserProfile, updateUserProfile, uploadProfilePicture, 
  removeProfilePicture, checkAvailability,
} from '../api';
import Avatar from 'boring-avatars';
import ConfirmationModal from '../components/ConfirmationModal';

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

export default function AccountSettings() {
  const { user, token, updateAuth } = useAuth();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // General Info State
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [usernameError, setUsernameError] = useState('');
  // const [emailError, setEmailError] = useState('');

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Profile Picture State
  const [profilePicture, setProfilePicture] = useState(null); 
  const [previewUrl, setPreviewUrl] = useState(user?.profile_picture_url || '');
  const [imgError, setImgError] = useState(false);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);

  // Real-time derivation logic
  const isUsernameValid = username.length >= 4;
  const isEmailValid = email.length === 0 || isValidEmail(email);
  const pwdStats = checkPwdStrength(newPassword);
  const passwordsMatch = newPassword === confirmNewPassword;
  const showPasswordError = confirmNewPassword.length > 0 && !passwordsMatch;

  const s = {
    container: { padding: '40px 20px', maxWidth: '640px', margin: '0 auto' },
    section: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', marginBottom: '24px' },
    header: { fontSize: '18px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text)' },
    avatarRow: { display: 'flex', alignItems: 'center', gap: '24px' },
    picWrapper: { position: 'relative', width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--border)', flexShrink: 0, background: 'var(--surface2)' },
    pic: { width: '100%', height: '100%', objectFit: 'cover' },
    btnGroup: { display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '12px' },
    inputGroup: { marginBottom: '16px', position: 'relative' },
    input: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', boxSizing: 'border-box', fontSize: '14px', transition: 'border-color 0.2s' },
    label: { display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: 'var(--text-muted)' },
    button: { padding: '10px 20px', cursor: 'pointer', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: '#fff', fontWeight: '600', fontSize: '14px', transition: 'opacity 0.2s' },
    btnSecondary: { background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)' },
    btnDanger: { background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444' },
    eyeBtn: { position: 'absolute', right: '12px', top: '34px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' },
    statusMsg: { padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', border: '1px solid' },
    feedbackContainer: { marginTop: '8px' },
    feedbackText: { fontSize: '12px', marginTop: '4px', transition: 'color 0.2s' }
  };

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setEmail(user.email || '');
      if (!profilePicture) {
        setPreviewUrl(user.profile_picture_url || '');
        setImgError(false);
      }
    }
  }, [user, profilePicture]);

  useEffect(() => {
    if (!username || username === user?.username || !token || !isUsernameValid) return setUsernameError('');
    const timer = setTimeout(async () => {
      const { available } = await checkAvailability('username', username, token);
      setUsernameError(available ? '' : 'Username taken');
    }, 500);
    return () => clearTimeout(timer);
  }, [username, user?.username, token, isUsernameValid]);

/*   useEffect(() => {
    if (!email || email === user?.email || !token || !isEmailValid) return setEmailError('');
    const timer = setTimeout(async () => {
      const { available } = await checkAvailability('email', email, token);
      setEmailError(available ? '' : 'Email already in use');
    }, 500);
    return () => clearTimeout(timer);
  }, [email, user?.email, token, isEmailValid]); */

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      setPreviewUrl(URL.createObjectURL(file));
      setImgError(false);
    }
  };

  const handleUpload = async () => {
    setLoading(true); setError(''); setMessage('');
    try {
      const fd = new FormData(); 
      fd.append('profile_picture', profilePicture);
      await uploadProfilePicture(fd, token);
      const freshUser = await fetchUserProfile(token);
      updateAuth(freshUser, token);
      setMessage('Profile picture updated successfully!');
      setProfilePicture(null); 
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) { setError(err.message || 'Failed to upload picture'); } finally { setLoading(false); }
  };

  const executeRemove = async () => {
    setIsRemoveModalOpen(false);
    setLoading(true); setError(''); setMessage('');
    try {
      await removeProfilePicture(token);
      const freshUser = await fetchUserProfile(token);
      updateAuth(freshUser, token);
      setPreviewUrl(''); setProfilePicture(null);
      setMessage('Profile picture removed.');
    } catch (err) { setError(err.message || 'Failed to remove picture'); } finally { setLoading(false); }
  };

  const cancelSelection = () => {
    setProfilePicture(null);
    setPreviewUrl(user?.profile_picture_url || '');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGeneralUpdate = async (e) => {
    e.preventDefault();
    if (!isUsernameValid || !isEmailValid) return;
    setLoading(true); setError(''); setMessage('');
    try {
      const updateData = {};
      if (username !== user.username) updateData.username = username;
      if (email !== user.email) updateData.email = email;

      if (Object.keys(updateData).length > 0) {
        await updateUserProfile(updateData, token);
        const freshUser = await fetchUserProfile(token);
        updateAuth(freshUser, token);
        setMessage('Profile updated successfully!');
      }
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (!pwdStats.isValid || !passwordsMatch) return;
    setLoading(true); setError(''); setMessage('');
    try {
      await updateUserProfile({ password: newPassword, currentPassword }, token);
      setMessage('Password changed successfully!');
      setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword('');
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const EyeIcon = ({ visible }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {visible ? (
        <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /></>
      ) : (
        <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
      )}
    </svg>
  );

  return (
    <div style={s.container}>
      <h1 style={{ marginBottom: '32px' }}>Account Settings</h1>

      {message && <div style={{ ...s.statusMsg, color: '#22c55e', background: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.2)' }}>{message}</div>}
      {error && <div style={{ ...s.statusMsg, color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>{error}</div>}

      <section style={s.section}>
        <h2 style={s.header}>Profile Picture</h2>
        <div style={s.avatarRow}>
          <div style={s.picWrapper}>
            {previewUrl && !imgError ? (
              <img src={previewUrl.startsWith('blob:') ? previewUrl : previewUrl} style={s.pic} alt="Profile preview" onError={() => setImgError(true)} />
            ) : (
              <Avatar name={user?.username} variant="beam" size={100} />
            )}
          </div>
          <div>
            <p style={{ ...s.label, marginBottom: '12px' }}>JPG, GIF or PNG. Max size of 2MB.</p>
            <div style={s.btnGroup}>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
              {!profilePicture ? (
                <>
                  <button style={{ ...s.button, ...s.btnSecondary }} onClick={() => fileInputRef.current.click()}>Change Photo</button>
                  {user?.profile_picture_url && <button style={{ ...s.button, ...s.btnDanger }} onClick={() => setIsRemoveModalOpen(true)}>Remove</button>}
                </>
              ) : (
                <>
                  <button style={s.button} onClick={handleUpload} disabled={loading}>{loading ? 'Saving...' : 'Save New Photo'}</button>
                  <button style={{ ...s.button, ...s.btnSecondary }} onClick={cancelSelection}>Cancel</button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <section style={s.section}>
        <h2 style={s.header}>General Information</h2>
        <form onSubmit={handleGeneralUpdate}>
          <div style={s.inputGroup}>
            <label style={s.label}>Username</label>
            <input 
              type="text" value={username} onChange={e => setUsername(e.target.value)} 
              style={{ ...s.input, borderColor: usernameError ? '#ef4444' : (username !== user?.username && !usernameError && isUsernameValid ? '#22c55e' : 'var(--border)') }} 
            />
            {username.length > 0 && username !== user?.username && (
              <div style={{ ...s.feedbackText, color: isUsernameValid ? 'var(--success)' : 'var(--text-muted)' }}>
                {isUsernameValid ? '✓' : '○'} At least 4 characters
              </div>
            )}
            {usernameError && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{usernameError}</div>}
          </div>

          <div style={s.inputGroup}>
            <label style={s.label}>Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              style={{ 
                ...s.input, 
                borderColor: (!isEmailValid && email.length > 0) 
                  ? '#ef4444' 
                  : (email !== user?.email && isEmailValid ? '#22c55e' : 'var(--border)') 
              }} 
            />
            {/* Format validation feedback */}
            {email.length > 0 && email !== user?.email && (
              <div style={{ ...s.feedbackText, color: isEmailValid ? 'var(--success)' : 'var(--text-muted)' }}>
                {isEmailValid ? '✓' : '○'} Valid email format
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={loading || !!usernameError || !isUsernameValid || !isEmailValid || (username === user?.username && email === user?.email)} 
            style={{ 
              ...s.button, 
              opacity: (loading || !!usernameError || !isUsernameValid || !isEmailValid || (username === user?.username && email === user?.email)) ? 0.6 : 1 
            }}
          >
            Save Changes
          </button>
        </form>
      </section>

      <section style={s.section}>
        <h2 style={s.header}>Update Password</h2>
        <form onSubmit={handlePasswordUpdate}>
          <div style={s.inputGroup}>
            <label style={s.label}>Current Password</label>
            <input type={showCurrent ? "text" : "password"} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} style={s.input} />
            <button type="button" style={s.eyeBtn} onClick={() => setShowCurrent(!showCurrent)}><EyeIcon visible={showCurrent} /></button>
          </div>

          <div style={s.inputGroup}>
            <label style={s.label}>New Password</label>
            <input type={showNew ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} style={s.input} />
            <button type="button" style={s.eyeBtn} onClick={() => setShowNew(!showNew)}><EyeIcon visible={showNew} /></button>
            
            {newPassword.length > 0 && (
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

          <div style={s.inputGroup}>
            <label style={s.label}>Confirm New Password</label>
            <input type={showConfirm ? "text" : "password"} value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} style={{ ...s.input, borderColor: showPasswordError ? '#ef4444' : 'var(--border)' }} />
            <button type="button" style={s.eyeBtn} onClick={() => setShowConfirm(!showConfirm)}><EyeIcon visible={showConfirm} /></button>
            {showPasswordError && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>Passwords do not match</div>}
          </div>

          <button 
            type="submit" 
            disabled={loading || !currentPassword || !newPassword || !pwdStats.isValid || showPasswordError} 
            style={{ ...s.button, opacity: (loading || !currentPassword || !newPassword || !pwdStats.isValid || showPasswordError) ? 0.6 : 1 }}
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </section>

      <ConfirmationModal
        isOpen={isRemoveModalOpen} message="Remove your profile picture and restore the default avatar?"
        onConfirm={executeRemove} onCancel={() => setIsRemoveModalOpen(false)}
      />
    </div>
  );
}
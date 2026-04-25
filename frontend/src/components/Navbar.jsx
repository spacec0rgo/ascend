import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Avatar from 'boring-avatars';

const styles = {
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 32px',
    height: '60px',
    background: 'var(--surface)',
    borderBottom: '1px solid var(--border)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  logo: {
    fontSize: '20px',
    fontWeight: 700,
    color: 'var(--accent)',
    letterSpacing: '-0.5px',
    textDecoration: 'none',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    position: 'relative',
    height: '100%',
  },
  userContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
  },
  profilePic: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '1px solid var(--border)',
  },
  username: {
    color: 'var(--text-muted)',
    fontSize: '14px',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    right: '-32px',
    marginTop: '0px',
    background: 'var(--surface)',
    borderLeft: '1px solid var(--border)',
    borderRight: '1px solid var(--border)',
    borderBottom: '1px solid var(--border)',
    borderTop: 'none',
    borderRadius: '0 0 8px 8px',
    padding: '8px 0',
    minWidth: '160px',
    // We change blur and spread so it doesn't cast upwards, very ugly
    // Format: [x-offset] [y-offset] [blur] [spread] [color]
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    zIndex: 101,
    display: 'flex',
    flexDirection: 'column',
  },
  dropdownItem: {
    padding: '8px 16px',
    fontSize: '14px',
    color: 'var(--text)',
    cursor: 'pointer',
    textAlign: 'left',
    display: 'block',
    width: '100%',
    border: 'none',
    background: 'transparent',
    transition: 'background 0.2s ease',
  },
  dropdownItemHover: {
    background: 'var(--border)',
  },
  btn: {
    padding: '7px 16px',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--text)',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.15s',
  },
  btnPrimary: {
    background: 'var(--accent)',
    border: 'none',
    color: '#fff',
  },
  themeBtn: {
    padding: '7px 8px',
    borderRadius: '8px',
    border: 'none',
    background: 'transparent',
    color: 'var(--text)',
    cursor: 'pointer',
    fontSize: '18px',
    transition: 'all 0.15s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  useEffect(() => {
    setImgError(false);
  }, [user?.profile_picture_url]);

  function handleLogout() {
    logout();
    navigate('/');
  }

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const themeIcon = resolvedTheme === 'dark' ? '🌙' : '☀️';

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Close dropdown when clicking anywhere else
  useEffect(() => {
    const handleClickOutside = () => setIsDropdownOpen(false);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.logo}>✧ Ascend</Link>
      <div style={styles.right} onClick={(e) => e.stopPropagation()}>
        <button
          style={styles.themeBtn}
          onClick={toggleTheme}
          title={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
            {themeIcon}
        </button>

        {user ? (
          <>
          <div style={styles.userContainer} onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
            <span style={styles.username}>{user.username}</span>
            
            {user.profile_picture_url && !imgError ? (
              <img
                src={user.profile_picture_url}
                alt={user.username}
                style={styles.profilePic}
                // Trigger the fallback
                onError={() => setImgError(true)} 
              />
            ) : (
              <Avatar name={user.username} variant="beam" size={32} />
            )}
          </div>

          {isDropdownOpen && (
            <div style={styles.dropdown}>
              <button
                style={{
                  ...styles.dropdownItem,
                  ...(hoveredIndex === 0 ? styles.dropdownItemHover : {})
                }}
                onMouseEnter={() => setHoveredIndex(0)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => {
                  navigate('/settings');
                  setIsDropdownOpen(false);
                }}
              >
                Account Settings
              </button>
              <button
                style={{
                  ...styles.dropdownItem,
                  ...(hoveredIndex === 1 ? styles.dropdownItemHover : {})
                }}
                onMouseEnter={() => setHoveredIndex(1)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
            )}
          </>
        ) : (
          <>
            <button style={styles.btn} onClick={() => navigate('/login')}>Login</button>
            <button style={{ ...styles.btn, ...styles.btnPrimary }} onClick={() => navigate('/register')}>Register</button>
          </>
        )}
      </div>
    </nav>
  );
}

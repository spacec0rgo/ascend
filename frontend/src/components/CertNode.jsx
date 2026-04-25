import React from 'react';
import { Handle, Position } from 'reactflow';
import confetti from 'canvas-confetti';

export default function CertNode({ data }) {
  const { label, description, vendor, url, obtained, onToggle, isLoggedIn } = data;
  const handleToggle = (e) => {
    if (!isLoggedIn) return;

    // Fire confetti if obtaining cert, not removing it
    if (!obtained) {
      // Get button coordinates
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;

      confetti({
        particleCount: 120,
        spread: 70,
        origin: { x, y },
        // Using theme colors: Success Green, Accent Purple, plus some gold/blue
        colors: ['#22c55e', '#6c63ff', '#facc15', '#38bdf8'],
        zIndex: 2000, // Ensure it renders over ReactFlow
        disableForReducedMotion: true
      });
    }
    onToggle();
  };

  const containerStyle = {
    width: '220px',
    background: obtained ? 'var(--obtained-bg)' : 'var(--surface3)',
    border: `2px solid ${obtained ? 'var(--success)' : 'var(--border)'}`,
    borderRadius: '12px',
    padding: '14px 16px',
    transition: 'border-color 0.2s, background 0.2s',
    position: 'relative',
    cursor: 'default',
  };

  const labelStyle = {
    fontSize: '13px',
    fontWeight: 600,
    color: obtained ? 'var(--success)' : 'var(--text)',
    marginBottom: description ? '5px' : 0,
    lineHeight: 1.3,
  };

  const descStyle = {
    fontSize: '11px',
    color: 'var(--text-muted)',
    lineHeight: 1.4,
    marginBottom: vendor ? '8px' : 0,
  };

  const footerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '10px',
  };

  const vendorStyle = {
    fontSize: '10px',
    color: 'var(--text-muted)',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    padding: '2px 6px',
    borderRadius: '4px',
  };

  const checkStyle = {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: `2px solid ${obtained ? 'var(--success)' : 'var(--border)'}`,
    background: obtained ? 'var(--success)' : 'transparent',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: isLoggedIn ? 'pointer' : 'not-allowed',
    transition: 'all 0.2s',
    opacity: isLoggedIn ? 1 : 0.5,
  };

  const badgeStyle = {
    position: 'absolute',
    top: '-10px',
    right: '12px',
    background: 'var(--success)',
    color: '#fff',
    fontSize: '10px',
    fontWeight: 700,
    padding: '2px 7px',
    borderRadius: '20px',
    display: obtained ? 'block' : 'none',
  };

  return (
    <div style={containerStyle}>
      <Handle type="target" position={Position.Top} style={{ background: 'var(--border)', border: 'none', width: 8, height: 8 }} />
      <span style={badgeStyle}>✓ Obtained</span>
      <div style={labelStyle}>
        {url ? (
          <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}
            title="Open certification page"
            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
          >
            {label}
          </a>
        ) : label}
      </div>
      {description && <div style={descStyle}>{description}</div>}
      <div style={footerStyle}>
        {vendor ? <span style={vendorStyle}>{vendor}</span> : <span />}
        <div
          style={checkStyle}
          onClick={handleToggle}
          title={isLoggedIn ? (obtained ? 'Mark as not obtained' : 'Mark as obtained') : 'Login to track progress'}
        >
          {obtained ? '✓' : ''}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: 'var(--border)', border: 'none', width: 8, height: 8 }} />
    </div>
  );
}
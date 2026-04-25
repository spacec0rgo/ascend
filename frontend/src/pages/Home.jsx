import React, { useEffect, useState } from 'react';                                                                                                                                                              
import { useNavigate } from 'react-router-dom';
import { fetchTrees } from '../api';                                                                                                                                                                             
import { useAuth } from '../context/AuthContext';

const s = {
  page: { padding: '48px 32px', maxWidth: '1100px', margin: '0 auto' },
  hero: { marginBottom: '48px' },
  title: { fontSize: '36px', fontWeight: 80, marginBottom: '12px', letterSpacing: '-1px' },
  subtitle: { color: 'var(--text-muted)', fontSize: '16px', maxWidth: '500px', lineHeight: 1.6 },
  accentText: { color: 'var(--accent)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    padding: '28px',
    cursor: 'pointer',
    transition: 'border-color 0.2s, transform 0.15s',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  cardIcon: { fontSize: '32px', marginBottom: '4px' },
  cardTitle: { fontSize: '20px', fontWeight: 700 },
  cardDesc: { color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.5, flexGrow: 1 },
  cardFooter: {
    marginTop: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pill: {
    fontSize: '12px',
    background: 'rgba(108,99,255,0.15)',
    color: 'var(--accent)',
    padding: '3px 10px',
    borderRadius: '20px',
    fontWeight: 600,
  },
  arrow: { color: 'var(--text-muted)', fontSize: '20px' },
  error: { color: 'var(--danger)', padding: '20px', textAlign: 'center' },
  loading: { color: 'var(--text-muted)', padding: '40px', textAlign: 'center' },
  emptyState: {
    gridColumn: '1 / -1',
    textAlign: 'center',
    padding: '60px',
    color: 'var(--text-muted)',
    border: '2px dashed var(--border)',
    borderRadius: '16px',
  },
  banner: {
    background: 'rgba(108,99,255,0.1)',
    border: '1px solid rgba(108,99,255,0.3)',
    borderRadius: '12px',
    padding: '14px 20px',
    marginBottom: '36px',
    color: 'var(--text-muted)',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
};

export default function Home() {
  const [trees, setTrees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchTrees()
      .then(setTrees)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={s.loading}>Loading skill trees…</div>;
  if (error) return <div style={s.error}>Error: {error}</div>;

  return (
    <div style={s.page}>
      <div style={s.hero}>
        <h1 style={s.title}>
          Your <span style={s.accentText}>Learning Path</span> Starts Here
        </h1>
        <p style={s.subtitle}>
          Choose a skill tree to explore, track certifications you've obtained, and build vertical expertise step by step.
        </p>
      </div>

      {!user && (
        <div style={s.banner}>
          <span>💡</span>
          <span>
            <strong style={{ color: 'var(--accent)' }}>Tip:</strong> <a href="/register" style={{ color: 'var(--accent)' }}>Create an account</a> or{' '}
            <a href="/login" style={{ color: 'var(--accent)' }}>log in</a> to track your progress across sessions.
          </span>
        </div>
      )}

      <div style={s.grid}>
        {trees.length === 0 ? (
          <div style={s.emptyState}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📂</div>
            <p>No skill trees found. Add <code className="code">.yml</code> files to the <code className="code">skill-trees/</code> folder to get started.</p>
          </div>
        ) : (
          trees.map((tree) => (
            <div
              key={tree.id}
              style={s.card}
              onClick={() => navigate(`/tree/${tree.id}`)}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={s.cardIcon}>{tree.icon || '🌳'}</div>
              <div style={s.cardTitle}>{tree.name}</div>
              {tree.description && <div style={s.cardDesc}>{tree.description}</div>}
              <div style={s.cardFooter}>
                <span style={s.pill}>Skill Tree</span>
                <span style={s.arrow}>→</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

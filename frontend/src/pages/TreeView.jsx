import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import confetti from 'canvas-confetti';

import { fetchTree, markObtained, markNotObtained } from '../api';
import { useAuth } from '../context/AuthContext';
import CertNode from '../components/CertNode';
import ConfirmationModal from '../components/ConfirmationModal';
import { buildGraphElements } from '../components/treeLayout';

const nodeTypes = { certNode: CertNode };

const s = {
  page: { height: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column' },
  header: {
    padding: '16px 32px',
    background: 'var(--surface)',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexShrink: 0,
  },
  back: {
    background: 'transparent',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    borderRadius: '8px',
    padding: '6px 14px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  titleBlock: { flexGrow: 1 },
  title: { fontSize: '18px', fontWeight: 700 },
  desc: { color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' },
  stats: {
    display: 'flex',
    gap: '20px',
    alignItems: 'center',
    flexShrink: 0,
  },
  stat: { textAlign: 'center' },
  statVal: { fontSize: '20px', fontWeight: 700, color: 'var(--accent)' },
  statLabel: { fontSize: '11px', color: 'var(--text-muted)' },
  progressBar: {
    width: '120px',
    height: '6px',
    background: 'var(--border)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'var(--success)',
    borderRadius: '3px',
    transition: 'width 0.3s',
  },
  loginNote: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '6px 12px',
  },
  flowWrap: { flexGrow: 1, position: 'relative' },
  loading: { padding: '60px', textAlign: 'center', color: 'var(--text-muted)' },
  error: { padding: '40px', textAlign: 'center', color: 'var(--danger)' },
  bannerOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 17, 23, 0.85)', // Deep backdrop for focus
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3000,
    backdropFilter: 'blur(8px)', // Glass effect
    animation: 'fadeIn 0.5s ease-out',
  },
  bannerDialog: {
    background: 'var(--surface)',
    border: '2px solid var(--success)', // Use the success color only as a "glow" border
    boxShadow: '0 0 30px rgba(34, 197, 94, 0.3)', // Subtle success glow
    borderRadius: '24px',
    padding: '48px 32px',
    maxWidth: '520px',
    width: '90%',
    textAlign: 'center',
    color: 'var(--text)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    position: 'relative',
    overflow: 'hidden',
  },
  bannerEmoji: {
    fontSize: '80px',
    marginBottom: '10px',
    filter: 'drop-shadow(0 0 15px rgba(250, 204, 21, 0.4))', // Gold glow for trophy
  },
  bannerTitle: {
    fontSize: '28px',
    fontWeight: 900,
    color: 'var(--text)',
    letterSpacing: '-0.5px',
    margin: 0,
  },
  bannerMessage: {
    fontSize: '16px',
    lineHeight: '1.6',
    color: 'var(--text-muted)',
    marginTop: '8px',
  },
  bannerButton: {
    marginTop: '24px',
    padding: '12px 32px',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
    border: 'none',
    backgroundColor: 'var(--success)', // Button matches the achievement (Success)
    color: '#fff',
    transition: 'transform 0.2s, filter 0.2s',
  },
  highlight: {
    color: 'var(--success)',
    fontWeight: 700,
  }
};

function countNodes(nodes) {
  if (!nodes) return 0;
  return nodes.reduce((acc, n) => acc + 1 + countNodes(n.children), 0);
}

function countObtained(nodes) {
  if (!nodes) return 0;
  return nodes.reduce((acc, n) => acc + (n.obtained ? 1 : 0) + countObtained(n.children), 0);
}

export default function TreeView() {
  const { treeId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { resolvedTheme } = useTheme();

  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toggling, setToggling] = useState(new Set());

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [modalConfig, setModalConfig] = useState({ 
    isOpen: false, 
    certId: null, 
    currentObtained: null 
  });

  const [showCompletionBanner, setShowCompletionBanner] = useState(false);
  const [hasTriggeredCompletion, setHasTriggeredCompletion] = useState(false);

  const initialCheckDone = React.useRef(false);

  const loadTree = useCallback(async () => {
    try {
      const data = await fetchTree(treeId, token);
      setTreeData(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [treeId, token]);

  useEffect(() => { loadTree(); }, [loadTree]);

  const executeToggle = useCallback(async (certId, currentObtained) => {
    setToggling(prev => new Set([...prev, certId]));
    
    // Optimistic update on the tree nodes
    function toggleInTree(nodes) {
      if (!nodes) return nodes;
      return nodes.map(n => {
        if (n.id === certId) return { ...n, obtained: !currentObtained };
        return { ...n, children: toggleInTree(n.children) };
      });
    }

    setTreeData(prev => ({ ...prev, nodes: toggleInTree(prev.nodes) }));

    try {
      if (currentObtained) {
        await markNotObtained(treeId, certId, token);
      } else {
        await markObtained(treeId, certId, token);
      }
    } catch (e) {
      setTreeData(prev => ({ ...prev, nodes: toggleInTree(prev.nodes) }));
      console.error(e);
    } finally {
      setToggling(prev => { 
        const s = new Set(prev); 
        s.delete(certId); 
        return s; 
      });
      // Close the modal after execution
      setModalConfig({ isOpen: false, certId: null, currentObtained: null });
    }
  }, [token, treeId]);

  const handleToggle = useCallback((certId, currentObtained) => {
    if (!user) return;
    if (toggling.has(certId)) return;

    if (currentObtained) {
      // Open modal instead of window.confirm
      setModalConfig({ 
        isOpen: true, 
        certId, 
        currentObtained 
      });
    } else {
      // If they are GAINING a cert, we just do it immediately
      executeToggle(certId, currentObtained);
    }
  }, [user, toggling, executeToggle]);

  // Rebuild graph whenever tree data or auth changes
  useEffect(() => {
    if (!treeData) return;
    const { nodes: rfNodes, edges: rfEdges } = buildGraphElements(
      treeData.nodes,
      handleToggle,
      !!user
    );
    setNodes(rfNodes);
    setEdges(rfEdges);
  }, [treeData, handleToggle, user, setNodes, setEdges]);

  const total = useMemo(() => treeData ? countNodes(treeData.nodes) : 0, [treeData]);
  const obtained = useMemo(() => treeData ? countObtained(treeData.nodes) : 0, [treeData]);
  const pct = total > 0 ? Math.round((obtained / total) * 100) : 0;

  useEffect(() => {
    // Wait until treeData is loaded 
    if (!treeData) return;

    if (user && pct === 100) {
      if (!hasTriggeredCompletion) {
        // Only show the banner if this ISN'T the first time we land on the page with 100% 
        if (initialCheckDone.current) {
          setShowCompletionBanner(true);
        }
        setHasTriggeredCompletion(true);
      }
    } 
    else if (pct < 100 && hasTriggeredCompletion) {
      // Re-arm trigger if uncheck a certification
      setHasTriggeredCompletion(false);
    }
    // Mark initial check as done
    if (!initialCheckDone.current) {
      initialCheckDone.current = true;
    }
  }, [user, pct, hasTriggeredCompletion, treeData]);

  // Confetti Orchestration
  useEffect(() => {
    let interval;

    if (showCompletionBanner) {
      const duration = 5000;
      const animationEnd = Date.now() + duration;

      // The "Realistic" configuration
      const fireRealisticConfetti = (particleRatio, opts) => {
        confetti({
          origin: { y: 0.7 },
          zIndex: 4000,
          colors: ['#22c55e', '#facc15', '#ffffff'],
          disableForReducedMotion: true,
          ...opts,
          particleCount: Math.floor(200 * particleRatio)
        });
      };

      // 1. The Grand Opening Pop
      fireRealisticConfetti(0.25, { spread: 26, startVelocity: 55 });
      fireRealisticConfetti(0.2, { spread: 60 });
      fireRealisticConfetti(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fireRealisticConfetti(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fireRealisticConfetti(0.1, { spread: 120, startVelocity: 45 });

      // 2. The Sustained "School Pride" Cannons
      const randomInRange = (min, max) => Math.random() * (max - min) + min;

      interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        
        // Left Cannon
        confetti({
          particleCount,
          angle: randomInRange(55, 125),
          spread: randomInRange(50, 70),
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#22c55e', '#facc15', '#ffffff'],
          zIndex: 4000,
        });
        
        // Right Cannon
        confetti({
          particleCount,
          angle: randomInRange(55, 125),
          spread: randomInRange(50, 70),
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#22c55e', '#facc15', '#ffffff'],
          zIndex: 4000,
        });
      }, 250);
    }

    // 4. THE CLEANUP (The mark of a pro)
    return () => {
      if (interval) clearInterval(interval);
      // Instantly wipe remaining confetti if they close the banner or leave the page
      confetti.reset(); 
    };
  }, [showCompletionBanner]);

  if (loading) return <div style={s.loading}>Loading skill tree…</div>;
  if (error) return <div style={s.error}>Error: {error}</div>;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button style={s.back} onClick={() => navigate('/')}>← Back</button>
        <div style={s.titleBlock}>
          <div style={s.title}>{treeData?.name}</div>
          {treeData?.description && <div style={s.desc}>{treeData.description}</div>}
        </div>
        <div style={s.stats}>
          {user ? (
            <>
              <div style={s.stat}>
                <div style={s.statVal}>{obtained}/{total}</div>
                <div style={s.statLabel}>Obtained</div>
              </div>
              <div>
                <div style={s.progressBar}>
                  <div style={{ ...s.progressFill, width: `${pct}%` }} />
                </div>
                <div style={{ ...s.statLabel, textAlign: 'center', marginTop: '4px' }}>{pct}%</div>
              </div>
            </>
          ) : (
            <div style={s.loginNote}>🔒 Login to track your progress</div>
          )}
        </div>
      </div>

      <div style={s.flowWrap}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#2e3350" gap={24} size={1} />
          <Controls />
          <MiniMap
            nodeColor={n => n.data?.obtained ? '#22c55e' : (resolvedTheme === 'light' ? '#cbd5e1' : '#22263a')}
            maskColor="rgba(15,17,23,0.7)"
          />
        </ReactFlow>
      </div>
      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        message="Remove this certification? Your progress will be lost."
        onConfirm={() => executeToggle(modalConfig.certId, modalConfig.currentObtained)}
        onCancel={() => setModalConfig({ isOpen: false, certId: null, currentObtained: null })}
      />
      {showCompletionBanner && (
        <div style={s.bannerOverlay}>
          <div style={s.bannerDialog}>
            <div style={s.bannerEmoji}>🏆</div>
            <div style={s.bannerTitle}>CONGRATULATIONS!</div>
            <div style={s.bannerMessage}>
              You have mastered the 
              <span style={s.highlight}> {treeData?.name} </span> 
              skill tree! All certifications have been obtained. Your dedication has truly paid off!
            </div>
            <button
                style={s.bannerButton}
                onClick={() => setShowCompletionBanner(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
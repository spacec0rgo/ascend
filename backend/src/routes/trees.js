const express = require('express');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { pool } = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const TREES_DIR = path.resolve('/app/skill-trees');

function loadTrees() {
  if (!fs.existsSync(TREES_DIR)) return [];
  const files = fs.readdirSync(TREES_DIR).filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));
  return files.map(file => {
    const treeId = path.basename(file, path.extname(file));
    const raw = fs.readFileSync(path.join(TREES_DIR, file), 'utf8');
    const data = yaml.load(raw);
    return { id: treeId, ...data };
  });
}

// GET /api/trees — list all skill trees (summary, no nodes)
router.get('/', (req, res) => {
  try {
    const trees = loadTrees().map(({ id, name, icon, description }) => ({ id, name, icon, description }));
    res.json(trees);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load skill trees' });
  }
});

// GET /api/trees/:treeId — full tree with user progress if authenticated
router.get('/:treeId', async (req, res) => {
  try {
    const trees = loadTrees();
    const tree = trees.find(t => t.id === req.params.treeId);
    if (!tree) return res.status(404).json({ error: 'Tree not found' });

    // Try to get user progress from token (optional auth)
    let obtained = new Set();
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const jwt = require('jsonwebtoken');
      try {
        const payload = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
        const result = await pool.query(
          'SELECT cert_id FROM user_certifications WHERE user_id = $1 AND tree_id = $2',
          [payload.id, req.params.treeId]
        );
        obtained = new Set(result.rows.map(r => r.cert_id));
      } catch { /* ignore invalid token */ }
    }

    // Annotate tree nodes with obtained status
    function annotate(nodes) {
      if (!nodes) return [];
      return nodes.map(node => ({
        ...node,
        obtained: obtained.has(node.id),
        children: annotate(node.children)
      }));
    }

    res.json({ ...tree, nodes: annotate(tree.nodes) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load skill tree' });
  }
});

// POST /api/trees/:treeId/certifications/:certId — mark as obtained
router.post('/:treeId/certifications/:certId', authMiddleware, async (req, res) => {
  const { treeId, certId } = req.params;
  try {
    await pool.query(
      'INSERT INTO user_certifications (user_id, tree_id, cert_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [req.user.id, treeId, certId]
    );
    res.json({ obtained: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/trees/:treeId/certifications/:certId — mark as not obtained
router.delete('/:treeId/certifications/:certId', authMiddleware, async (req, res) => {
  const { treeId, certId } = req.params;
  try {
    await pool.query(
      'DELETE FROM user_certifications WHERE user_id = $1 AND tree_id = $2 AND cert_id = $3',
      [req.user.id, treeId, certId]
    );
    res.json({ obtained: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

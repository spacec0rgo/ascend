/**
 * Converts the nested YAML node tree into flat ReactFlow nodes + edges,
 * using a layered top-down layout with dynamic horizontal spacing.
 */

const NODE_WIDTH = 220;
const NODE_HEIGHT = 130; // approximate
const H_GAP = 40;
const V_GAP = 100;

function collectLevels(nodes, level = 0, levels = []) {
  if (!nodes || nodes.length === 0) return levels;
  if (!levels[level]) levels[level] = [];
  nodes.forEach(node => {
    levels[level].push(node);
    collectLevels(node.children, level + 1, levels);
  });
  return levels;
}

/**
 * Assign positions using a simple recursive approach:
 * Each node's x is centered over its subtree.
 */
function computeSubtreeWidth(node) {
  if (!node.children || node.children.length === 0) return NODE_WIDTH;
  const childrenWidth = node.children.reduce(
    (acc, child) => acc + computeSubtreeWidth(child) + H_GAP, -H_GAP
  );
  return Math.max(NODE_WIDTH, childrenWidth);
}

function assignPositions(node, x, y, rfNodes, rfEdges, onToggle, isLoggedIn, idCounter = { n: 0 }) {
  const subtreeWidth = computeSubtreeWidth(node);
  const nodeX = x + subtreeWidth / 2 - NODE_WIDTH / 2;

  const rfId = `node-${node.id}-${idCounter.n++}`;
  rfNodes.push({
    id: rfId,
    type: 'certNode',
    position: { x: nodeX, y },
    data: {
      label: node.label,
      description: node.description || '',
      vendor: node.vendor || '',
      url: node.url || '',
      obtained: node.obtained || false,
      certId: node.id,
      isLoggedIn,
      onToggle: () => onToggle(node.id, node.obtained),
    },
  });

  if (node.children && node.children.length > 0) {
    let childX = x;
    node.children.forEach(child => {
      const childWidth = computeSubtreeWidth(child);
      const childRfId = `node-${child.id}-${idCounter.n}`;
      assignPositions(child, childX, y + NODE_HEIGHT + V_GAP, rfNodes, rfEdges, onToggle, isLoggedIn, idCounter);
      rfEdges.push({
        id: `edge-${rfId}-${childRfId}`,
        source: rfId,
        target: childRfId,
        type: 'smoothstep',
        style: { stroke: '#2e3350', strokeWidth: 2 },
      });
      childX += childWidth + H_GAP;
    });
  }
}

export function buildGraphElements(treeNodes, onToggle, isLoggedIn) {
  const rfNodes = [];
  const rfEdges = [];
  const idCounter = { n: 0 };

  if (!treeNodes) return { nodes: rfNodes, edges: rfEdges };

  let x = 0;
  treeNodes.forEach(rootNode => {
    const w = computeSubtreeWidth(rootNode);
    assignPositions(rootNode, x, 0, rfNodes, rfEdges, onToggle, isLoggedIn, idCounter);
    x += w + H_GAP * 3;
  });

  return { nodes: rfNodes, edges: rfEdges };
}

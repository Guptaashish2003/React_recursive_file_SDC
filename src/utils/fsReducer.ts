// src/lib/fsReducer.ts
import { FSState, FSAction, FSNode, FolderNode, NodeType, ROOT_ID } from '../types/fs';

// ── Types ────────────────────────────────────────────
// Re-export types for convenience
export type { FSState, FSAction, FSNode, FolderNode, NodeType };
export { ROOT_ID };

interface FolderParentNode extends FolderNode {
  children: string[];
}

// ── ID Generator (collision-resistant, no module state) ─────────
export function genId(): string {
  return `node_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ── Helpers ──────────────────────────────────────────

/**
 * Deep-clones nodes record while preserving folder children arrays.
 * Ensures immutability for Redux-style updates.
 */
export function cloneNodes(nodes: Record<string, FSNode>): Record<string, FSNode> {
  const out: Record<string, FSNode> = {};
  for (const key in nodes) {
    const node = nodes[key];
    if (node.type === 'folder') {
      out[key] = { ...node, children: [...node.children] };
    } else {
      out[key] = { ...node };
    }
  }
  return out;
}

/**
 * Collects all descendant node IDs (including the node itself) for deletion.
 * Prevents mutation during traversal.
 */
export function collectDescendantIds(
  nodes: Record<string, FSNode>,
  id: string
): string[] {
  const node = nodes[id];
  if (!node) return [];
  if (node.type !== 'folder') return [id];

  const ids: string[] = [id];
  for (const childId of node.children) {
    ids.push(...collectDescendantIds(nodes, childId));
  }
  return ids;
}

/**
 * Checks if potentialDescendant is anywhere in the subtree of potentialAncestor.
 * Used to prevent moving a folder into its own descendant.
 */
export function isDescendantOf(
  nodes: Record<string, FSNode>,
  potentialDescendant: string,
  potentialAncestor: string
): boolean {
  let current: string | null = nodes[potentialDescendant]?.parentId ?? null;
  while (current) {
    if (current === potentialAncestor) return true;
    current = nodes[current]?.parentId ?? null;
  }
  return false;
}

/**
 * Gets all children of a folder node (type-safe).
 */
export function getFolderChildren(
  nodes: Record<string, FSNode>,
  folderId: string
): FSNode[] {
  const folder = nodes[folderId];
  if (!folder || folder.type !== 'folder') return [];
  const childNodes: Array<FSNode | undefined> = folder.children.map((id) => nodes[id]);
  return childNodes.filter((n): n is FSNode => n !== undefined);
}

/**
 * Counts total descendants (recursive) for a folder.
 */
export function countDescendants(nodes: Record<string, FSNode>, id: string): number {
  const node = nodes[id];
  if (!node || node.type !== 'folder') return 0;
  
  let count = 0;
  for (const childId of node.children) {
    count += 1 + countDescendants(nodes, childId);
  }
  return count;
}

// ── Initial State ────────────────────────────────────
export const initialState: FSState = {
  nodes: {
    [ROOT_ID]: {
      id: ROOT_ID,
      name: 'workspace',
      type: 'folder',
      parentId: null,
      children: [],
    },
  },
  rootId: ROOT_ID,
  expandedIds: new Set([ROOT_ID]),
  selectedId: null,
  editingId: null,
  openFileId: null,
};

// ── Reducer ──────────────────────────────────────────
export function reducer(state: FSState, action: FSAction): FSState {
  switch (action.type) {
    // ── CREATE_NODE ─────────────────────────────────
    case 'CREATE_NODE': {
  const { parentId, nodeType, name } = action;
  
  // Validate parent exists and is a folder
  const parent = state.nodes[parentId];
  if (!parent || parent.type !== 'folder') {
    console.warn(`Cannot create node: parent "${parentId}" not found or not a folder`);
    return state;
  }

  const id = genId();
  const nodes = cloneNodes(state.nodes);

  const newNode: FSNode =
    nodeType === 'folder'
      ? {
          id,
          name: name || 'New Folder',
          type: 'folder',
          parentId,
          children: [],
        }
      : {
          id,
          name: name || 'New File',
          type: 'file',
          parentId,
          content: '',
        };

  nodes[id] = newNode;
  nodes[parentId] = {
    ...parent,
    children: [...parent.children, id],
  };

  return {
    ...state,
    nodes,
    selectedId: id,
    editingId: id, // ← Auto-enter edit mode for new nodes
    expandedIds: new Set([...state.expandedIds, parentId]),
  };
}

    // ── RENAME_NODE ────────────────────────────────
    case 'RENAME_NODE': {
      const { id, name } = action;
      const trimmed = name.trim();

      // Empty name = cancel edit
      if (!trimmed) {
        return { ...state, editingId: null };
      }

      // Prevent duplicate names in same parent
      const node = state.nodes[id];
      if (!node) return state;

      if (node.parentId) {
        const parent = state.nodes[node.parentId];
        if (parent?.type === 'folder') {
          const duplicate = parent.children.some((childId) => {
            const sibling = state.nodes[childId];
            return (
              sibling?.id !== id &&
              sibling?.name.toLowerCase() === trimmed.toLowerCase()
            );
          });
          if (duplicate) {
            console.warn(`Duplicate name "${trimmed}" in folder`);
            return { ...state, editingId: null };
          }
        }
      }

      const nodes = cloneNodes(state.nodes);
      nodes[id] = { ...nodes[id], name: trimmed };

      return { ...state, nodes, editingId: null };
    }

    // ── DELETE_NODE ─────────────────────────────────
    case 'DELETE_NODE': {
      const { id } = action;

      // Prevent deleting root
      if (id === state.rootId) {
        console.warn('Cannot delete root node');
        return state;
      }

      const node = state.nodes[id];
      if (!node) return state;

      // Collect all IDs to delete (node + descendants)
      const idsToDelete = collectDescendantIds(state.nodes, id);

      // Clone nodes for immutable update
      const nodes = cloneNodes(state.nodes);

      // Remove from parent's children array
      if (node.parentId && nodes[node.parentId]?.type === 'folder') {
        const parent = nodes[node.parentId] as FolderNode;
        nodes[node.parentId] = {
          ...parent,
          children: parent.children.filter((c) => c !== id),
        };
      }

      // Delete all collected nodes
      for (const deleteId of idsToDelete) {
        delete nodes[deleteId];
      }

      // Clean up state references
      const newExpanded = new Set(state.expandedIds);
      idsToDelete.forEach((expId) => newExpanded.delete(expId));

      return {
        ...state,
        nodes,
        expandedIds: newExpanded,
        selectedId: idsToDelete.includes(state.selectedId!) ? null : state.selectedId,
        openFileId: idsToDelete.includes(state.openFileId!) ? null : state.openFileId,
        editingId: idsToDelete.includes(state.editingId!) ? null : state.editingId,
      };
    }

    // ── TOGGLE_EXPAND ──────────────────────────────
    case 'TOGGLE_EXPAND': {
      const { id } = action;
      const node = state.nodes[id];
      
      // Only folders can be expanded
      if (!node || node.type !== 'folder') return state;

      const newExpanded = new Set(state.expandedIds);
      if (newExpanded.has(id)) {
        newExpanded.delete(id);
      } else {
        newExpanded.add(id);
      }

      return { ...state, expandedIds: newExpanded };
    }

    // ── SELECT ─────────────────────────────────────
    case 'SELECT': {
      return { ...state, selectedId: action.id };
    }

    // ── OPEN_FILE ──────────────────────────────────
    case 'OPEN_FILE': {
      const node = state.nodes[action.id];
      // Only files can be opened
      if (!node || node.type !== 'file') return state;
      return { ...state, openFileId: action.id, selectedId: action.id };
    }

    // ── CLOSE_FILE ─────────────────────────────────
    case 'CLOSE_FILE': {
      return { ...state, openFileId: null };
    }

    // ── SET_EDITING ────────────────────────────────
    case 'SET_EDITING': {
      return { ...state, editingId: action.id };
    }

    // ── CANCEL_EDITING ─────────────────────────────
    case 'CANCEL_EDITING': {
      const node = state.nodes[action.id];
      
      // Delete newly created nodes with default names if they're empty folders
      if (
        node &&
        (node.name === 'New Folder' || node.name === 'New File') &&
        node.type === 'folder' &&
        node.children.length === 0
      ) {
        return reducer(state, { type: 'DELETE_NODE', id: action.id });
      }
      
      return { ...state, editingId: null };
    }

    // ── UPDATE_FILE_CONTENT ────────────────────────
    case 'UPDATE_FILE_CONTENT': {
      const { id, content } = action;
      const node = state.nodes[id];
      
      // Only files have content
      if (!node || node.type !== 'file') return state;

      const nodes = cloneNodes(state.nodes);
      nodes[id] = { ...node, content };

      return { ...state, nodes };
    }

    // ── MOVE_NODE ──────────────────────────────────
    case 'MOVE_NODE': {
      const { id, newParentId } = action;

      // Prevent invalid moves
      if (id === newParentId || id === state.rootId) {
        console.warn('Invalid move: cannot move node into itself or move root');
        return state;
      }

      const node = state.nodes[id];
      const newParent = state.nodes[newParentId];

      if (!node || !newParent || newParent.type !== 'folder') {
        console.warn('Invalid move: node or target parent not found');
        return state;
      }

      // Prevent moving a folder into its own subtree
      if (isDescendantOf(state.nodes, newParentId, id)) {
        console.warn('Invalid move: cannot move folder into its own descendant');
        return state;
      }

      const nodes = cloneNodes(state.nodes);

      // Remove from old parent
      if (node.parentId && nodes[node.parentId]?.type === 'folder') {
        const oldParent = nodes[node.parentId] as FolderParentNode;
        nodes[node.parentId] = {
          ...oldParent,
          children: oldParent.children.filter((c: string) => c !== id),
        };
      }

      // Add to new parent
      nodes[newParentId] = {
        ...newParent,
        children: [...newParent.children, id],
      };

      // Update node's parentId
      nodes[id] = { ...node, parentId: newParentId };

      // Auto-expand new parent
      const newExpanded = new Set(Array.from(state.expandedIds).concat(newParentId));

      return {
        ...state,
        nodes,
        expandedIds: newExpanded,
        selectedId: id, // Keep selection on moved node
      };
    }

    // ── DEFAULT ────────────────────────────────────
    default: {
      // TypeScript exhaustiveness check will catch unhandled actions
      const _exhaustive: never = action;
      return state;
    }
  }
}

// ── Selectors (memoizable helper functions) ────────

/**
 * Gets the path array for a node (from root to node, exclusive of root name).
 */
export function getNodePath(nodes: Record<string, FSNode>, id: string): string[] {
  const path: string[] = [];
  let current: string | null = id;

  while (current && nodes[current]) {
    const node: FSNode = nodes[current];
    if (node.parentId !== null) {
      path.unshift(node.name);
    }
    current = node.parentId;
  }

  return path;
}

/**
 * Builds absolute path string for a node.
 */
export function buildPath(nodes: Record<string, FSNode>, id: string): string {
  const parts = getNodePath(nodes, id);
  return `/${parts.join('/')}`;
}

/**
 * Flattens tree into array of nodes (excluding root) for searching.
 */
export function flattenTree(nodes: Record<string, FSNode>, rootId: string): FSNode[] {
  const result: FSNode[] = [];

  function walk(nodeId: string): void {
    const node = nodes[nodeId];
    if (!node) return;

    // Skip root from results
    if (node.parentId !== null) {
      result.push(node);
    }

    // Recurse into folder children
    if (node.type === 'folder') {
      for (const childId of node.children) {
        walk(childId);
      }
    }
  }

  walk(rootId);
  return result;
}

/**
 * Simple substring search (case-insensitive).
 */
export function searchNodes(
  nodes: Record<string, FSNode>,
  rootId: string,
  query: string
): FSNode[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];

  return flattenTree(nodes, rootId).filter((node) =>
    node.name.toLowerCase().includes(trimmed)
  );
}

/**
 * Fuzzy search with relevance scoring.
 */
export function fuzzySearchNodes(
  nodes: Record<string, FSNode>,
  rootId: string,
  query: string
): Array<{ node: FSNode; score: number }> {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];

  return flattenTree(nodes, rootId)
    .map((node) => {
      const lowerName = node.name.toLowerCase();
      let score = 0;

      // Exact match = highest
      if (lowerName === trimmed) {
        score = 100;
      }
      // Starts with = high
      else if (lowerName.startsWith(trimmed)) {
        score = 80;
      }
      // Contains = medium
      else if (lowerName.includes(trimmed)) {
        score = 50;
      }
      // Subsequence match = low
      else if (isSubsequence(trimmed, lowerName)) {
        score = 30;
      }

      return { node, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}

/**
 * Checks if `sub` is a subsequence of `str`.
 */
export function isSubsequence(sub: string, str: string): boolean {
  let subIdx = 0;
  for (let i = 0; i < str.length && subIdx < sub.length; i++) {
    if (str[i] === sub[subIdx]) subIdx++;
  }
  return subIdx === sub.length;
}


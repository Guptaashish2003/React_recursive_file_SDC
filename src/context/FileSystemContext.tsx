import React, { createContext, useContext, useReducer, useCallback, ReactNode, useEffect } from 'react';
import type { FSNode, FSState, FSAction, FSContextType, NodeType, FolderNode } from '../types/fs';
import { ROOT_ID } from '../types/fs';

// ── ID Generator (safe, no module-level state) ───────
const genId = (): string => `node_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

// ── localStorage Configuration ───────────────────────
const STORAGE_KEY = 'storebox-fs-v1';

// ── Load State from localStorage ─────────────────────
function loadStateFromStorage(): Partial<FSState> | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored);
    
    // Validate basic structure
    if (!parsed.nodes || !parsed.rootId) return null;
    
    // Convert expandedIds array back to Set
    if (parsed.expandedIds && Array.isArray(parsed.expandedIds)) {
      parsed.expandedIds = new Set(parsed.expandedIds);
    }
    
    return parsed;
  } catch (error) {
    console.error('Failed to load state from localStorage:', error);
    return null;
  }
}

// ── Save State to localStorage ───────────────────────
function saveStateToStorage(state: FSState): void {
  try {
    // Convert Set to Array for JSON serialization
    const stateToSave = {
      ...state,
      expandedIds: Array.from(state.expandedIds),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  } catch (error) {
    console.error('Failed to save state to localStorage:', error);
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded. Some data may not be saved.');
    }
  }
}

// ── Initial State ────────────────────────────────────
export const initialState: FSState = {
  nodes: {
    [ROOT_ID]: { id: ROOT_ID, name: 'workspace', type: 'folder', parentId: null, children: [] },
  },
  rootId: ROOT_ID,
  expandedIds: new Set([ROOT_ID]),
  selectedId: null,
  editingId: null,
  openFileId: null,
};

// ── Helpers ──────────────────────────────────────────

function cloneNodes(nodes: Record<string, FSNode>): Record<string, FSNode> {
  const out: Record<string, FSNode> = {};
  for (const k in nodes) {
    const n = nodes[k];
    if (n.type === 'folder') {
      out[k] = { ...n, children: [...n.children] };
    } else {
      out[k] = { ...n };
    }
  }
  return out;
}

function collectDescendantIds(nodes: Record<string, FSNode>, id: string): string[] {
  const node = nodes[id];
  if (!node || node.type !== 'folder') return [id];
  
  const ids: string[] = [id];
  for (const childId of node.children) {
    ids.push(...collectDescendantIds(nodes, childId));
  }
  return ids;
}

function isDescendantOf(nodes: Record<string, FSNode>, potentialDescendant: string, potentialAncestor: string): boolean {
  let current: string | null = nodes[potentialDescendant]?.parentId ?? null;
  while (current) {
    if (current === potentialAncestor) return true;
    current = nodes[current]?.parentId ?? null;
  }
  return false;
}

// ── Reducer ──────────────────────────────────────────
function reducer(state: FSState, action: FSAction): FSState {
  switch (action.type) {
    case 'CREATE_NODE': {
      const { parentId, nodeType, name } = action;
      const id = genId();
      const nodes = cloneNodes(state.nodes);
      
      const newNode: FSNode = nodeType === 'folder'
        ? { id, name: name || 'New Folder', type: 'folder', parentId, children: [] }
        : { id, name: name || 'New File', type: 'file', parentId, content: '' };
      
      nodes[id] = newNode;
      
      const parent = nodes[parentId];
      if (parent?.type === 'folder') {
        nodes[parentId] = { ...parent, children: [...parent.children, id] };
      }
      
      return {
        ...state, 
        nodes,
        selectedId: id,
        editingId: id,
        expandedIds: new Set(Array.from(state.expandedIds).concat(parentId)),
      };
    }

    case 'RENAME_NODE': {
      const { id, name } = action;
      const trimmed = name.trim();
      if (!trimmed) return { ...state, editingId: null };
      
      const nodes = cloneNodes(state.nodes);
      if (nodes[id]) {
        nodes[id] = { ...nodes[id], name: trimmed };
      }
      return { ...state, nodes, editingId: null };
    }

    case 'DELETE_NODE': {
      const { id } = action;
      if (id === state.rootId) return state;
      
      const node = state.nodes[id];
      if (!node) return state;
      
      const idsToDelete = collectDescendantIds(state.nodes, id);
      const nodes = cloneNodes(state.nodes);
      
      if (node.parentId && nodes[node.parentId]?.type === 'folder') {
        const parent = nodes[node.parentId] as FolderNode;
        nodes[node.parentId] = {
          ...parent,
          children: parent.children.filter(c => c !== id)
        };
      }
      
      for (const deleteId of idsToDelete) {
        delete nodes[deleteId];
      }
      
      const newExpanded = new Set(Array.from(state.expandedIds));
      idsToDelete.forEach(expId => newExpanded.delete(expId));
      
      return {
        ...state,
        nodes,
        expandedIds: newExpanded,
        selectedId: idsToDelete.includes(state.selectedId!) ? null : state.selectedId,
        openFileId: idsToDelete.includes(state.openFileId!) ? null : state.openFileId,
        editingId: idsToDelete.includes(state.editingId!) ? null : state.editingId,
      };
    }

    case 'TOGGLE_EXPAND': {
      const newExpanded = new Set(state.expandedIds);
      if (newExpanded.has(action.id)) {
        newExpanded.delete(action.id);
      } else {
        newExpanded.add(action.id);
      }
      return { ...state, expandedIds: newExpanded };
    }

    case 'SELECT':
      return { ...state, selectedId: action.id };

    case 'OPEN_FILE':
      return { ...state, openFileId: action.id, selectedId: action.id };

    case 'CLOSE_FILE':
      return { ...state, openFileId: null };

    case 'SET_EDITING':
      return { ...state, editingId: action.id };

    case 'CANCEL_EDITING': {
      const node = state.nodes[action.id];
      if (node && (node.name === 'New Folder' || node.name === 'New File')) {
        if (node.type === 'folder' && node.children.length === 0) {
          return reducer(state, { type: 'DELETE_NODE', id: action.id });
        }
      }
      return { ...state, editingId: null };
    }

    case 'UPDATE_FILE_CONTENT': {
      const nodes = cloneNodes(state.nodes);
      const node = nodes[action.id];
      if (node?.type === 'file') {
        nodes[action.id] = { ...node, content: action.content };
      }
      return { ...state, nodes };
    }

    case 'MOVE_NODE': {
      const { id, newParentId } = action;
      if (id === newParentId || id === state.rootId) return state;
      
      const node = state.nodes[id];
      if (!node) return state;
      
      if (isDescendantOf(state.nodes, newParentId, id)) return state;
      
      const newParent = state.nodes[newParentId];
      if (!newParent || newParent.type !== 'folder') return state;
      
      const nodes = cloneNodes(state.nodes);
      
      if (node.parentId && nodes[node.parentId]?.type === 'folder') {
        const oldParent = nodes[node.parentId] as FolderNode;
        nodes[node.parentId] = {
          ...oldParent,
          children: oldParent.children.filter(c => c !== id)
        };
      }
      
      nodes[newParentId] = {
        ...newParent,
        children: [...newParent.children, id]
      };
      
      nodes[id] = { ...node, parentId: newParentId };
      
      return {
        ...state,
        nodes,
        expandedIds: new Set(Array.from(state.expandedIds).concat(newParentId)),
      };
    }

    default:
      return state;
  }
}

// ── Context ──────────────────────────────────────────
const FSContext = createContext<FSContextType | undefined>(undefined);

export function FileSystemProvider({ children }: { children: ReactNode }) {
  // ✅ FIX: Remove type parameter from useReducer - let TypeScript infer from reducer + initialState
  const [state, dispatch] = useReducer(
    reducer,
    initialState,
    (initial) => {
      const stored = loadStateFromStorage();
      return stored ? { ...initial, ...stored } : initial;
    }
  );

  // Save to localStorage whenever state changes
  useEffect(() => {
    saveStateToStorage(state);
  }, [state]);

  // ── Actions ────────────────────────────────────────
  const createNode = useCallback((parentId: string, nodeType: NodeType) => {
    dispatch({ type: 'CREATE_NODE', parentId, nodeType, name: '' });
  }, []);

  const renameNode = useCallback((id: string, name: string) => {
    dispatch({ type: 'RENAME_NODE', id, name });
  }, []);

  const deleteNode = useCallback((id: string) => {
    dispatch({ type: 'DELETE_NODE', id });
  }, []);

  const toggleExpand = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_EXPAND', id });
  }, []);

  const selectNode = useCallback((id: string) => {
    dispatch({ type: 'SELECT', id });
  }, []);

  const openFile = useCallback((id: string) => {
    dispatch({ type: 'OPEN_FILE', id });
  }, []);

  const closeFile = useCallback(() => {
    dispatch({ type: 'CLOSE_FILE' });
  }, []);

  const setEditing = useCallback((id: string) => {
    dispatch({ type: 'SET_EDITING', id });
  }, []);

  const cancelEditing = useCallback((id: string) => {
    dispatch({ type: 'CANCEL_EDITING', id });
  }, []);

  const updateFileContent = useCallback((id: string, content: string) => {
    dispatch({ type: 'UPDATE_FILE_CONTENT', id, content });
  }, []);

  const moveNode = useCallback((id: string, newParentId: string) => {
    dispatch({ type: 'MOVE_NODE', id, newParentId });
  }, []);

  const contextValue: FSContextType = {
    nodes: state.nodes,
    rootId: state.rootId,
    expandedIds: state.expandedIds,
    selectedId: state.selectedId,
    editingId: state.editingId,
    openFileId: state.openFileId,
    createNode,
    renameNode,
    deleteNode,
    toggleExpand,
    selectNode,
    openFile,
    closeFile,
    setEditing,
    cancelEditing,
    updateFileContent,
    moveNode,
  };

  return (
    <FSContext.Provider value={contextValue}>
      {children}
    </FSContext.Provider>
  );
}

export function useFS(): FSContextType {
  const ctx = useContext(FSContext);
  if (ctx === undefined) {
    throw new Error('useFS must be used within a FileSystemProvider');
  }
  return ctx;
}
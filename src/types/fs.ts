// src/types/fs.ts

// ── Node Types ─────────────────────────────────────
export type NodeType = 'file' | 'folder';

export interface BaseNode {
  id: string;
  name: string;
  type: NodeType;
  parentId: string | null;
}

export interface FileNode extends BaseNode {
  type: 'file';
  content: string;
}

export interface FolderNode extends BaseNode {
  type: 'folder';
  children: string[];
}

export type FSNode = FileNode | FolderNode;

// ── State ──────────────────────────────────────────
export interface FSState {
  nodes: Record<string, FSNode>;
  rootId: string;
  expandedIds: Set<string>;
  selectedId: string | null;
  editingId: string | null;
  openFileId: string | null;
}

// ── Actions ────────────────────────────────────────
export type FSAction =
  | { type: 'CREATE_NODE'; parentId: string; nodeType: NodeType; name: string }
  | { type: 'RENAME_NODE'; id: string; name: string }
  | { type: 'DELETE_NODE'; id: string }
  | { type: 'TOGGLE_EXPAND'; id: string }
  | { type: 'SELECT'; id: string }
  | { type: 'OPEN_FILE'; id: string }
  | { type: 'CLOSE_FILE' }
  | { type: 'SET_EDITING'; id: string }
  | { type: 'CANCEL_EDITING'; id: string }
  | { type: 'UPDATE_FILE_CONTENT'; id: string; content: string }
  | { type: 'MOVE_NODE'; id: string; newParentId: string };

// ── Context ────────────────────────────────────────
export interface FSContextType {
  // State
  nodes: Record<string, FSNode>;
  rootId: string;
  expandedIds: Set<string>;
  selectedId: string | null;
  editingId: string | null;
  openFileId: string | null;

  // Actions
  createNode: (parentId: string, nodeType: NodeType, name?: string) => void;
  renameNode: (id: string, name: string) => void;
  deleteNode: (id: string) => void;
  toggleExpand: (id: string) => void;
  selectNode: (id: string) => void;
  openFile: (id: string) => void;
  closeFile: () => void;
  setEditing: (id: string) => void;
  cancelEditing: (id: string) => void;
  updateFileContent: (id: string, content: string) => void;
  moveNode: (id: string, newParentId: string) => void;
}

// ── Constants ──────────────────────────────────────
export const ROOT_ID = 'root';

// ── Type Guards ────────────────────────────────────
export function isFileNode(node: FSNode | undefined): node is FileNode {
  return node?.type === 'file';
}

export function isFolderNode(node: FSNode | undefined): node is FolderNode {
  return node?.type === 'folder';
}

export type FileExtension = 
  | 'js' | 'jsx' | 'ts' | 'tsx' 
  | 'html' | 'css' | 'scss' | 'less'
  | 'json' | 'md' | 'mdx' 
  | 'py' | 'rb' | 'go' | 'rs' 
  | 'java' | 'kt' | 'swift'
  | 'sh' | 'bash' | 'zsh'
  | 'sql' | 'graphql'
  | 'png' | 'jpg' | 'jpeg' | 'gif' | 'svg' | 'webp'
  | 'pdf' | 'doc' | 'docx'
  | 'zip' | 'tar' | 'gz'
  | 'env' | 'gitignore' | 'lock'
  | 'yml' | 'yaml' | 'toml' | 'ini'
  | 'txt' | 'log' | 'csv'
  | 'mp3' | 'mp4' | 'wav'
  | 'xml';

/** Special filenames that get custom icons */
export type SpecialFilename = 
  | 'package.json' 
  | 'readme.md' | 'readme'
  | '.gitignore' 
  | '.env' 
  | 'dockerfile'
  | 'makefile' 
  | '.eslintrc';
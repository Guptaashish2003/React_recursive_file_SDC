import type { FSNode, FolderNode, SpecialFilename,FileNode,FileExtension } from '../types/fs';


// ── File icon mapping by extension ──────────────────
const FILE_ICON_MAP = {
  js: '🟨', jsx: '⚛️', ts: '🔷', tsx: '⚛️',
  html: '🌐', css: '🎨', scss: '🎨', less: '🎨',
  json: '📋', md: '📝', mdx: '📝',
  py: '🐍', rb: '💎', go: '🐹', rs: '🦀',
  java: '☕', kt: '🎯', swift: '🍎',
  sh: '⚙️', bash: '⚙️', zsh: '⚙️',
  sql: '🗄️', graphql: '🔮',
  png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️', svg: '🎭', webp: '🖼️',
  pdf: '📄', doc: '📄', docx: '📄',
  zip: '📦', tar: '📦', gz: '📦',
  env: '🔐', gitignore: '🙈', lock: '🔒',
  yml: '⚙️', yaml: '⚙️', toml: '⚙️', ini: '⚙️',
  txt: '📃', log: '📃', csv: '📊',
  mp3: '🎵', mp4: '🎬', wav: '🎵',
  xml: '📋',
} as const;

const SPECIAL_NAME_MAP = {
  'package.json': '📦', 'readme.md': '📖', 'readme': '📖',
  '.gitignore': '🙈', '.env': '🔐', 'dockerfile': '🐳',
  'makefile': '⚙️', '.eslintrc': '🔍',
} as const;

const DEFAULT_ICON = '📄';

/**
 * Returns an emoji icon based on filename or extension.
 * @param name - The filename (e.g., "app.tsx", ".gitignore")
 * @returns Emoji string representing the file type
 */
export function getFileIcon(name: string): string {
  if (!name) return DEFAULT_ICON;
  
  const lowerName = name.toLowerCase();
  
  // Check special filenames first (case-insensitive)
  if (lowerName in SPECIAL_NAME_MAP) {
    return SPECIAL_NAME_MAP[lowerName as SpecialFilename];
  }
  
  // Extract extension safely
  const lastDotIndex = name.lastIndexOf('.');
  if (lastDotIndex === -1 || lastDotIndex === 0) {
    return DEFAULT_ICON; // No extension or starts with dot only
  }
  
  const ext = name.slice(lastDotIndex + 1).toLowerCase() as FileExtension;
  return FILE_ICON_MAP[ext] ?? DEFAULT_ICON;
}

// ── Build full path of a node ────────────────────────
/**
 * Builds the absolute path for a given node by traversing up to root.
 * @param nodes - Record of all FSNode objects
 * @param id - The node ID to build path for
 * @returns Absolute path string (e.g., "/src/components/Button.tsx")
 */
export function buildPath(nodes: Record<string, FSNode>, id: string): string {
  if (!nodes[id]) return '/';
  
  const parts: string[] = [];
  let current: string | null = id;
  
  while (current && nodes[current]) {
    const node: FSNode | undefined = nodes[current];
    // Skip root node (parentId === null) from path parts
    if (node.parentId !== null) {
      parts.unshift(node.name);
    }
    current = node.parentId;
  }
  
  return `/${parts.join('/')}`;
}

// ── Flatten tree for search ──────────────────────────
/**
 * Flattens the tree structure into a linear array of nodes (excluding root).
 * @param nodes - Record of all FSNode objects
 * @param rootId - The root node ID to start traversal from
 * @returns Array of all descendant nodes (excluding root)
 */
export function flattenTree(nodes: Record<string, FSNode>, rootId: string): FSNode[] {
  const result: FSNode[] = [];
  
  function walk(id: string): void {
    const node: FSNode | undefined = nodes[id];
    if (!node) return;
    
    // Skip root from results
    if (node.parentId !== null) {
      result.push(node);
    }
    
    // Recursively walk children if folder
    if (node.type === 'folder') {
      for (const childId of node.children) {
        walk(childId);
      }
    }
  }
  
  walk(rootId);
  return result;
}

// ── Fuzzy search ─────────────────────────────────────
/**
 * Searches nodes by name (case-insensitive substring match).
 * @param nodes - Record of all FSNode objects
 * @param rootId - The root node ID to search within
 * @param query - Search query string
 * @returns Array of matching FSNode objects
 */
export function searchNodes(
  nodes: Record<string, FSNode>,
  rootId: string,
  query: string
): FSNode[] {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return [];
  
  const searchQuery = trimmedQuery.toLowerCase();
  
  return flattenTree(nodes, rootId).filter((node) =>
    node.name.toLowerCase().includes(searchQuery)
  );
}

/**
 * Advanced fuzzy search with relevance scoring.
 * @param nodes - Record of all FSNode objects
 * @param rootId - The root node ID to search within
 * @param query - Search query string
 * @returns Array of matching nodes sorted by relevance
 */
export function fuzzySearchNodes(
  nodes: Record<string, FSNode>,
  rootId: string,
  query: string
): Array<{ node: FSNode; score: number }> {
  const trimmedQuery = query.trim().toLowerCase();
  if (!trimmedQuery) return [];
  
  return flattenTree(nodes, rootId)
    .map((node) => {
      const lowerName = node.name.toLowerCase();
      let score = 0;
      
      // Exact match = highest score
      if (lowerName === trimmedQuery) {
        score = 100;
      }
      // Starts with = high score
      else if (lowerName.startsWith(trimmedQuery)) {
        score = 80;
      }
      // Contains = medium score
      else if (lowerName.includes(trimmedQuery)) {
        score = 50;
      }
      // Fuzzy: all query chars appear in order
      else if (isSubsequence(trimmedQuery, lowerName)) {
        score = 30;
      }
      
      return { node, score };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score);
}

/**
 * Checks if `sub` is a subsequence of `str` (chars appear in order, not necessarily contiguous).
 */
function isSubsequence(sub: string, str: string): boolean {
  let subIdx = 0;
  for (let i = 0; i < str.length && subIdx < sub.length; i++) {
    if (str[i] === sub[subIdx]) subIdx++;
  }
  return subIdx === sub.length;
}

// ── Validate filename ────────────────────────────────
const INVALID_CHARS_REGEX = /[\/\\:*?"<>|]/;
const MAX_FILENAME_LENGTH = 255;

/**
 * Validates a filename for illegal characters and length.
 * @param name - The filename to validate
 * @returns true if valid, false otherwise
 */
export function isValidName(name: string): boolean {
  const trimmed = name.trim();
  
  // Check empty
  if (!trimmed) return false;
  
  // Check length
  if (trimmed.length > MAX_FILENAME_LENGTH) return false;
  
  // Check reserved names (Windows/Linux)
  const reserved = ['.', '..', 'CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'LPT1', 'LPT2'];
  if (reserved.includes(trimmed.toUpperCase())) return false;
  
  // Check invalid characters
  if (INVALID_CHARS_REGEX.test(trimmed)) return false;
  
  return true;
}

/**
 * Sanitizes a filename by removing/replacing invalid characters.
 * @param name - The raw filename input
 * @returns Sanitized filename string
 */
export function sanitizeFilename(name: string): string {
  return name
    .trim()
    .replace(INVALID_CHARS_REGEX, '_')
    .slice(0, MAX_FILENAME_LENGTH)
    || 'unnamed';
}

// ── Count children ───────────────────────────────────
/**
 * Counts all descendant nodes (files + folders) under a folder.
 * @param nodes - Record of all FSNode objects
 * @param id - The folder node ID to count descendants for
 * @returns Total count of descendant nodes
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

/**
 * Gets direct children count for a folder (non-recursive).
 * @param nodes - Record of all FSNode objects
 * @param id - The folder node ID
 * @returns Count of immediate children only
 */
export function countDirectChildren(nodes: Record<string, FSNode>, id: string): number {
  const node = nodes[id];
  if (!node || node.type !== 'folder') return 0;
  return node.children.length;
}

// ── Get node type helpers ────────────────────────────
/**
 * Type guard to check if a node is a FileNode.
 */
export function isFileNode(node: FSNode | undefined): node is FileNode {
  return node?.type === 'file';
}

/**
 * Type guard to check if a node is a FolderNode.
 */
export function isFolderNode(node: FSNode | undefined): node is FolderNode {
  return node?.type === 'folder';
}

// ── Get file extension ───────────────────────────────
/**
 * Extracts the file extension from a filename.
 * @param name - The filename
 * @returns Extension string without dot, or empty string if none
 */
export function getFileExtension(name: string): string {
  if (!name) return '';
  const lastDotIndex = name.lastIndexOf('.');
  if (lastDotIndex === -1 || lastDotIndex === name.length - 1) {
    return '';
  }
  return name.slice(lastDotIndex + 1).toLowerCase();
}

// ── Sort nodes ───────────────────────────────────────
export type SortOrder = 'name-asc' | 'name-desc' | 'type-asc' | 'type-desc';

/**
 * Sorts an array of node IDs based on their corresponding nodes.
 * @param nodes - Record of all FSNode objects
 * @param ids - Array of node IDs to sort
 * @param order - Sort order specification
 * @returns Sorted array of node IDs
 */
export function sortNodeIds(
  nodes: Record<string, FSNode>,
  ids: string[],
  order: SortOrder = 'name-asc'
): string[] {
  return [...ids].sort((a, b) => {
    const nodeA = nodes[a];
    const nodeB = nodes[b];
    if (!nodeA || !nodeB) return 0;
    
    // Folders first, then files
    if (nodeA.type !== nodeB.type) {
      return nodeA.type === 'folder' ? -1 : 1;
    }
    
    const nameA = nodeA.name.toLowerCase();
    const nameB = nodeB.name.toLowerCase();
    
    switch (order) {
      case 'name-asc':
        return nameA.localeCompare(nameB);
      case 'name-desc':
        return nameB.localeCompare(nameA);
      case 'type-asc':
        return nameA.localeCompare(nameB) || getFileExtension(nameA).localeCompare(getFileExtension(nameB));
      case 'type-desc':
        return nameB.localeCompare(nameA) || getFileExtension(nameB).localeCompare(getFileExtension(nameA));
      default:
        return 0;
    }
  });
}

// ── Export all utilities ─────────────────────────────
export {
  FILE_ICON_MAP,
  SPECIAL_NAME_MAP,
  DEFAULT_ICON,
  INVALID_CHARS_REGEX,
  MAX_FILENAME_LENGTH,
};
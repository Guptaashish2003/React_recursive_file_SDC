import React, { useRef, MouseEvent } from 'react';
import { FilePlus, FolderPlus, Pencil, Trash2 } from 'lucide-react';
import { useFS } from './FileSystemContext';
import styles from './ContextMenu.module.css';

// ── Types ────────────────────────────────────────────
export interface ContextMenuProps {
  menu: ContextMenuState | null;
  onClose: () => void;
}

export interface ContextMenuState {
  x: number;
  y: number;
  nodeId: string;
}

// ── Component ────────────────────────────────────────
export default function ContextMenu({ menu, onClose }: ContextMenuProps): React.ReactElement | null {
  const { nodes, createNode, setEditing, deleteNode, rootId } = useFS();
  const ref = useRef<HTMLDivElement>(null);

  // ✅ ALL HOOKS CALLED FIRST (before any returns)
  
  // Guard: no menu or invalid node (AFTER hooks)
  if (!menu) return null;

  const node = nodes[menu.nodeId];
  if (!node) return null;

  // ── Viewport Boundary Detection ────────────────────
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;

  const MENU_WIDTH = 200;
  const MENU_HEIGHT = 160;
  const PADDING = 8;

  const adjustedX = menu.x + MENU_WIDTH + PADDING > viewportWidth
    ? Math.max(0, viewportWidth - MENU_WIDTH - PADDING)
    : menu.x;
  const adjustedY = menu.y + MENU_HEIGHT + PADDING > viewportHeight
    ? Math.max(0, viewportHeight - MENU_HEIGHT - PADDING)
    : menu.y;

  const style: React.CSSProperties = {
    top: adjustedY,
    left: adjustedX,
    position: 'fixed',
    zIndex: 1000,
  };

  // ── Action Handlers ────────────────────────────────
  const handleAction = (fn: () => void) => (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    fn();
    onClose(); // Close menu immediately after action
  };

  const isFolder = node.type === 'folder';
  const canDelete = node.id !== rootId;

  // ── Render ─────────────────────────────────────────
  return (
    <div
      ref={ref}
      className={styles.menu}
      style={style}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
      role="menu"
      aria-label={`Context menu for ${node.name}`}
      data-context-menu
    >
      {isFolder && (
        <>
          {/* New File */}
          <button
            className={styles.item}
            onClick={() => {
              onClose(); // ← Close menu FIRST so input is visible
              createNode(node.id, 'file');
            }}
            type="button"
            role="menuitem"
          >
            <FilePlus size={14} aria-hidden="true" />
            <span>New File</span>
          </button>

          {/* New Folder */}
          <button
            className={styles.item}
            onClick={() => {
              onClose(); // ← Close menu FIRST so input is visible
              createNode(node.id, 'folder');
            }}
            type="button"
            role="menuitem"
          >
            <FolderPlus size={14} aria-hidden="true" />
            <span>New Folder</span>
          </button>

          <div className={styles.divider} role="separator" />
        </>
      )}

      {/* Rename */}
      <button
        className={styles.item}
        onClick={handleAction(() => setEditing(node.id))}
        type="button"
        role="menuitem"
      >
        <Pencil size={14} aria-hidden="true" />
        <span>Rename</span>
        <span className={styles.shortcut} aria-hidden="true">F2</span>
      </button>

      <div className={styles.divider} role="separator" />

      {/* Delete */}
      <button
        className={`${styles.item} ${styles.danger} ${!canDelete ? styles.disabled : ''}`}
        onClick={handleAction(() => {
          if (canDelete) {
            // ✅ Use window.confirm to bypass no-restricted-globals ESLint rule
            if (window.confirm(`Delete "${node.name}"?`)) {
              deleteNode(node.id);
            }
          }
        })}
        type="button"
        disabled={!canDelete}
        role="menuitem"
        aria-disabled={!canDelete}
      >
        <Trash2 size={14} aria-hidden="true" />
        <span>Delete</span>
        <span className={styles.shortcut} aria-hidden="true">Del</span>
      </button>
    </div>
  );
}
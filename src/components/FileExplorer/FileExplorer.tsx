import React, { useCallback } from 'react';
import { useFS } from '../../context/FileSystemContext';
import { useContextMenu } from '../../_hooks/useContextMenu'; // ✅ Removed unused ContextMenuState
import { useKeyboard, Keys } from '../../_hooks/useKeyBoard';
import TreeNode from '../TreeNode'; // ✅ Fixed import path
import { CreateButtons } from '../CreateButton'; // ✅ Fixed import path + filename
import ContextMenu from '../../context/ContextMenu'; 
import styles from './FileExplorer.module.css';

// ── Types ────────────────────────────────────────────
export interface FileExplorerProps {
  /** Optional callback for context menu events */
  onContextMenu?: (e: React.MouseEvent<HTMLElement>, nodeId?: string) => void;
}

// ── Component ────────────────────────────────────────
export function FileExplorer({ onContextMenu }: FileExplorerProps): React.ReactElement {
  const { nodes, rootId, selectedId, createNode, deleteNode, setEditing } = useFS();
  const { menu, open: openContextMenu, close: closeContextMenu } = useContextMenu();

  // Get root node's children to display (instead of showing root itself)
  const rootNode = nodes[rootId];
  const rootChildren = rootNode?.type === 'folder' ? rootNode.children : [];

  // ── Keyboard Shortcuts ─────────────────────────────
  useKeyboard({
    [Keys.F2]: (e) => {
      if (selectedId) {
        e.preventDefault();
        setEditing(selectedId);
      }
    },
    [Keys.DELETE_KEY]: (e) => {
      if (selectedId && selectedId !== rootId) {
        e.preventDefault();
        // eslint-disable-next-line no-restricted-globals
        // TODO: Replace with custom confirmation modal for production
        if (window?.confirm(`Delete "${nodes[selectedId]?.name}"?`)) {
          deleteNode(selectedId);
        }
      }
    },
    [Keys.CMD_N]: (e) => {
      if (selectedId) {
        e.preventDefault();
        const targetId = nodes[selectedId]?.type === 'folder' ? selectedId : rootId;
        createNode(targetId, 'file');
      }
    },
    [Keys.CMD_SHIFT_N]: (e) => {
      if (selectedId) {
        e.preventDefault();
        const targetId = nodes[selectedId]?.type === 'folder' ? selectedId : rootId;
        createNode(targetId, 'folder');
      }
    },
  }, { target: document.querySelector<HTMLElement>(`[data-file-explorer]`) ?? undefined });

  // ── Context Menu Handler ───────────────────────────
  const handleContextMenu = useCallback(
    (e: React.MouseEvent<HTMLElement>, nodeId: string) => {
      e.preventDefault();
      e.stopPropagation();
      openContextMenu(e, nodeId);
      onContextMenu?.(e, nodeId);
    },
    [openContextMenu, onContextMenu]
  );

   return (
    <div 
      className={styles.explorer} 
      data-file-explorer
      role="tree" 
      aria-label="File system navigation"
      onContextMenu={(e) => {
        // Right-click on empty space = show menu for root
        if (!(e.target as Element).closest('[data-node-id]')) {
          e.preventDefault();
          openContextMenu(e, rootId);
        }
      }}
    >
      {/* Header with Create Buttons */}
      <header className={styles.header}>
        <h2 className={styles.title}>Explorer</h2>
        <CreateButtons parentId={rootId} />
      </header>

      {/* Tree Root - Show root's children directly, NOT the root folder itself */}
      <div className={styles.treeContainer} role="group" aria-label="File tree">
        {rootChildren.map((childId) => (
          <TreeNode
            key={childId}
            id={childId}
            depth={0}  // Start at depth 0 (not nested under root)
            onContextMenu={handleContextMenu}
          />
        ))}
        
        {/* Show message if root is empty */}
        {rootChildren.length === 0 && (
          <div className={styles.emptyState}>
            <p>No files or folders</p>
            <p className={styles.hint}>Right-click to create</p>
          </div>
        )}
      </div>

      {/* Context Menu Portal */}
      {menu && (
        <ContextMenu 
          menu={menu} 
          onClose={closeContextMenu} 
        />
      )}
    </div>
  );
}

export default FileExplorer;
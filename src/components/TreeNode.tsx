import React, { useState, KeyboardEvent, MouseEvent, DragEvent } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  // File ,
} from 'lucide-react';
import { useFS } from '../context/FileSystemContext';
import InlineRename from './InlineRename';
import { getFileIcon } from '../utils/fsUtils';
import styles from './TreeNode.module.css';

// ── Types ────────────────────────────────────────────
export interface TreeNodeProps {
  id: string;
  depth?: number;
  onContextMenu: (e: React.MouseEvent<HTMLElement>, nodeId: string) => void;
}

// ── Component ────────────────────────────────────────
export default function TreeNode({
  id,
  depth = 0,
  onContextMenu,
}: TreeNodeProps): React.ReactElement | null {
  const {
    nodes,
    expandedIds,
    selectedId,
    editingId,
    toggleExpand,
    selectNode,
    openFile,
    setEditing,
    deleteNode,
    moveNode,
    rootId,
  } = useFS();

  const [dragOver, setDragOver] = useState(false);
  const node = nodes[id];

  // Guard: node not found
  if (!node) return null;

  const isFolder = node.type === 'folder';
  const isExpanded = isFolder && expandedIds.has(id);
  const isSelected = selectedId === id;
  const isEditing = editingId === id;
  const canDrop = isFolder && node.id !== rootId; // Can't drop on root

  const indent = depth * 16;

  // ── Event Handlers ─────────────────────────────────
  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    selectNode(id);
    if (isFolder) {
      toggleExpand(id);
    } else {
      openFile(id);
    }
  };

  const handleDoubleClick = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setEditing(id);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // Prevent keyboard events when editing
    if (isEditing) return;

    switch (e.key) {
      case 'F2':
        e.preventDefault();
        setEditing(id);
        break;
      case 'Delete':
      case 'Backspace':
        // Only delete if not root and not editing
        if (id !== rootId) {
          e.preventDefault();
          // ✅ Use window.confirm to bypass no-restricted-globals rule
          if (window.confirm(`Delete "${node.name}"?`)) {
            deleteNode(id);
          }
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (isFolder) {
          toggleExpand(id);
        } else {
          openFile(id);
        }
        break;
      case 'ArrowRight':
        if (isFolder && !isExpanded) {
          e.preventDefault();
          toggleExpand(id);
        }
        break;
      case 'ArrowLeft':
        if (isFolder && isExpanded) {
          e.preventDefault();
          toggleExpand(id);
        }
        break;
    }
  };

  // ── Drag and Drop ──────────────────────────────────
  const handleDragStart = (e: DragEvent<HTMLDivElement>) => {
    // Prevent dragging root or while editing
    if (id === rootId || isEditing) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('application/x-fs-node-id', id);
    e.dataTransfer.effectAllowed = 'move';
    // Visual feedback
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragEnd = (e: DragEvent<HTMLDivElement>) => {
    e.currentTarget.style.opacity = '1';
    setDragOver(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (!canDrop) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(true);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    if (!canDrop) return;

    const draggedId = e.dataTransfer.getData('application/x-fs-node-id');
    if (draggedId && draggedId !== id) {
      // Prevent moving folder into its own subtree
      if (!isDescendantOf(nodes, id, draggedId)) {
        moveNode(draggedId, id);
      }
    }
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  // ── Helpers ────────────────────────────────────────
  function isDescendantOf(
    allNodes: typeof nodes,
    potentialDescendant: string,
    potentialAncestor: string
  ): boolean {
    let current: string | null = allNodes[potentialDescendant]?.parentId ?? null;
    while (current) {
      if (current === potentialAncestor) return true;
      current = allNodes[current]?.parentId ?? null;
    }
    return false;
  }

  // ── Render Icon ────────────────────────────────────
  const renderIcon = () => {
    if (isFolder) {
      const FolderComponent = isExpanded ? FolderOpen : Folder;
      return <FolderComponent size={15} className={styles.iconFolder} aria-hidden="true" />;
    }
    return (
      <span className={styles.fileEmoji} aria-hidden="true">
        {getFileIcon(node.name)}
      </span>
    );
  };

  // ── Render Children ────────────────────────────────
  const renderChildren = () => {
    if (!isFolder || !isExpanded) return null;

    if (node.children.length === 0) {
      return (
        <div
          className={styles.emptyHint}
          style={{ paddingLeft: 8 + indent + 28 }}
          role="none"
        >
          <em>empty folder</em>
        </div>
      );
    }

    return (
      <div role="group" aria-label={`${node.name} contents`}>
        {node.children.map((childId) => (
          <TreeNode
            key={childId}
            id={childId}
            depth={depth + 1}
            onContextMenu={onContextMenu}
          />
        ))}
      </div>
    );
  };

  // ── Main Render ────────────────────────────────────
  return (
    <div className={styles.wrapper} role="none">
      <div
        className={`${styles.row} ${isSelected ? styles.selected : ''} ${dragOver ? styles.dragOver : ''
          } ${isEditing ? styles.editing : ''}`}
        style={{ paddingLeft: 8 + indent }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
        onContextMenu={(e) => onContextMenu(e, id)}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragLeave={handleDragLeave}
        draggable={!isEditing && id !== rootId}
        tabIndex={isSelected ? 0 : -1}
        role="treeitem"
        aria-expanded={isFolder ? isExpanded : undefined}
        aria-selected={isSelected}
        aria-label={node.name}
        data-node-id={id}
        data-context-trigger
      >
        {/* Expand/Collapse Chevron */}
        {isFolder ? (
          <span className={styles.chevron} aria-hidden="true">
            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </span>
        ) : (
          <span className={styles.chevronSpacer} aria-hidden="true" />
        )}

        {/* File/Folder Icon */}
        <span className={styles.nodeIcon}>{renderIcon()}</span>

        {/* Node Name or Inline Rename */}
        {isEditing ? (
          <InlineRename
            id={id}
            initialValue={node.name}
          />
        ) : (
          <span
            className={styles.label}
            title={node.name}
            aria-label={`Name: ${node.name}`}
          >
            {node.name || <em className={styles.untitled}>untitled</em>}
          </span>
        )}
      </div>

      {/* Recursive Children */}
      {renderChildren()}
    </div>
  );
}
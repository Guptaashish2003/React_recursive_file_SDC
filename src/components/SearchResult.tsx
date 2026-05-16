import React, { Fragment, ReactNode, MouseEvent, KeyboardEvent } from 'react';
import { useFS } from '../context/FileSystemContext';
import type { FSNode } from '../types/fs';
import { buildPath, getFileIcon, isFolderNode } from '../utils/fsUtils';
import { Folder, File as FileIcon } from 'lucide-react';
import styles from './SearchResults.module.css';

// ── Types ────────────────────────────────────────────
export interface SearchResultsProps {
  /** Array of matching nodes to display */
  results: FSNode[];
  /** The current search query string */
  query: string;
  /** Optional callback when a result is selected */
  onClose?: () => void;
  /** Optional maximum results to display (for performance) */
  maxResults?: number;
}

export interface SearchResultItemProps {
  node: FSNode;
  query: string;
  onSelect: (node: FSNode) => void;
}

// ── Main Component ───────────────────────────────────
export default function SearchResults({
  results,
  query,
  onClose,
  maxResults = 50,
}: SearchResultsProps): React.ReactElement {
  const { nodes, selectNode, openFile } = useFS();

  // Guard: empty results
  if (results.length === 0) {
    return (
      <div className={styles.empty} role="status" aria-live="polite">
        No results for <strong>"{escapeHtml(query)}"</strong>
      </div>
    );
  }

  // Limit results for performance
  const displayedResults = results.slice(0, maxResults);
  const hasMore = results.length > maxResults;

  // ── Helpers ────────────────────────────────────────
  
  /**
   * Escapes HTML entities to prevent XSS in highlighted text
   */
  function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Highlights the query match in text with proper escaping
   */
  function highlightMatch(text: string, query: string): ReactNode {
    if (!query.trim()) return escapeHtml(text);
    
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const idx = lowerText.indexOf(lowerQuery);
    
    if (idx === -1) return escapeHtml(text);
    
    return (
      <Fragment>
        {escapeHtml(text.slice(0, idx))}
        <mark className={styles.mark} aria-label={`Match: ${query}`}>
          {escapeHtml(text.slice(idx, idx + query.length))}
        </mark>
        {escapeHtml(text.slice(idx + query.length))}
      </Fragment>
    );
  }

  /**
   * Handles result selection
   */
  const handleSelect = (node: FSNode) => {
    selectNode(node.id);
    if (node.type === 'file') {
      openFile(node.id);
    }
    onClose?.();
  };

  // ── Render ─────────────────────────────────────────
  
  return (
    <div 
      className={styles.results} 
      role="listbox" 
      aria-label={`Search results for "${query}"`}
    >
      <div className={styles.header} role="heading" aria-level={3}>
        {results.length} result{results.length !== 1 ? 's' : ''}
        {hasMore && (
          <span className={styles.truncated}>
            {' '} (showing first {maxResults})
          </span>
        )}
      </div>
      
      <ul className={styles.list} role="presentation">
        {displayedResults.map((node) => (
          <SearchResultItem
            key={node.id}
            node={node}
            query={query}
            onSelect={() => handleSelect(node)}
          />
        ))}
      </ul>
      
      {hasMore && (
        <div className={styles.moreHint} role="note">
          Refine your search to see more results
        </div>
      )}
    </div>
  );
}

// ── Sub-Component: Individual Result Item ────────────

function SearchResultItem({
  node,
  query,
  onSelect,
}: SearchResultItemProps): React.ReactElement {
  const isFolder = isFolderNode(node);

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(node);
    }
  };

  /**
   * Highlights the query match in text with proper escaping
   */
  function highlightMatch(text: string, queryStr: string): ReactNode {
    if (!queryStr.trim()) return escapeHtml(text);
    
    const lowerText = text.toLowerCase();
    const lowerQuery = queryStr.toLowerCase();
    const idx = lowerText.indexOf(lowerQuery);
    
    if (idx === -1) return escapeHtml(text);
    
    return (
      <Fragment>
        {escapeHtml(text.slice(0, idx))}
        <mark className={styles.mark} aria-label={`Match: ${queryStr}`}>
          {escapeHtml(text.slice(idx, idx + queryStr.length))}
        </mark>
        {escapeHtml(text.slice(idx + queryStr.length))}
      </Fragment>
    );
  }

  /**
   * Escapes HTML entities to prevent XSS in highlighted text
   */
  function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  return (
    <li role="option" aria-selected={false}>
      <button
        className={styles.item}
        onClick={() => onSelect(node)}
        onKeyDown={handleKeyDown}
        type="button"
        aria-label={`Open ${isFolder ? 'folder' : 'file'}: ${node.name}`}
        data-node-id={node.id}
        data-node-type={node.type}
      >
        {/* Icon */}
        <span className={styles.icon} aria-hidden="true">
          {isFolder ? (
            <Folder size={14} className={styles.folderIcon} />
          ) : (
            <span className={styles.emoji}>{getFileIcon(node.name)}</span>
          )}
        </span>

        {/* Name with highlighted match */}
        <span className={styles.name}>
          {highlightMatch(node.name, query)}
        </span>

        {/* Path */}
        <span className={styles.path} title={buildPath({}, node.id)}>
          {node.parentId ? buildPath({}, node.id).replace(/\/[^/]+$/, '') : '/'}
        </span>

        {/* Type badge */}
        <span className={`${styles.badge} ${isFolder ? styles.folder : styles.file}`}>
          {isFolder ? 'folder' : getFileExtension(node.name) || 'file'}
        </span>
      </button>
    </li>
  );
}

// ── Utility: Get file extension ──────────────────────
function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1 || lastDot === filename.length - 1) return '';
  return filename.slice(lastDot + 1).toLowerCase();
}
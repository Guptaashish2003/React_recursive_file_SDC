import React, { useState, useCallback, useMemo, KeyboardEvent, MouseEvent } from 'react';
import { FileSystemProvider, useFS } from './context/FileSystemContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { FileExplorer } from './components/FileExplorer/FileExplorer';
import { FileEditor } from './components/FileEditor/FileEditor';
import { SearchBar } from './components/Search/SearchBar';
import { useKeyboard } from './_hooks/useKeyBoard';
import { useContextMenu } from './_hooks/useContextMenu';
import type { ContextMenuState } from './_hooks/useContextMenu';
import ContextMenu from './context/ContextMenu';
import { searchNodes } from './utils/fsUtils';
import type { FSNode } from './types/fs';
import { Moon, Sun, Plus, Info } from 'lucide-react';
import './App.css';

// ── Types ────────────────────────────────────────────
interface StatusBarProps {
  selectedNodeName: string | null;
  fileType: string | null;
  totalNodes: number;
}

// ── Main App Component ───────────────────────────────
function AppContent(): React.ReactElement {
  return (
    <ThemeProvider>
      <FileSystemProvider>
        <AppLayout />
      </FileSystemProvider>
    </ThemeProvider>
  );
}

// ── App Layout (Internal) ────────────────────────────
function AppLayout(): React.ReactElement {
  const { theme, toggle } = useTheme();
  const { nodes, rootId, selectedId, openFileId, createNode } = useFS();
  const { menu, open: openContextMenu, close: closeContextMenu } = useContextMenu();
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);

  // ── Search Logic ───────────────────────────────────
  const searchResults = useMemo((): FSNode[] => {
    if (!searchQuery.trim()) return [];
    return searchNodes(nodes, rootId, searchQuery);
  }, [nodes, rootId, searchQuery]);

  const handleSearchSelect = useCallback((nodeId: string) => {
    setSearchQuery('');
    setShowSearch(false);
  }, []);

  // ── Keyboard Shortcuts (using string literals for reliability) ─────────────────────────────
useKeyboard({
  'Cmd+K': (e: globalThis.KeyboardEvent) => {  // ✅ Explicit global type
    e.preventDefault();
    setShowSearch((prev) => !prev);
    if (!showSearch) {
      setTimeout(() => {
        document.querySelector<HTMLInputElement>('[data-search-input]')?.focus();
      }, 0);
    }
  },
  'Cmd+Shift+N': (e: globalThis.KeyboardEvent) => {  // ✅ Same here
    e.preventDefault();
    const targetId = selectedId && nodes[selectedId]?.type === 'folder' 
      ? selectedId 
      : rootId;
    createNode(targetId, 'folder');
  },
  'Cmd+N': (e: globalThis.KeyboardEvent) => {
    e.preventDefault();
    const targetId = selectedId && nodes[selectedId]?.type === 'folder' 
      ? selectedId 
      : rootId;
    createNode(targetId, 'file');
  },
  'Cmd+B': (e: globalThis.KeyboardEvent) => {
    e.preventDefault();
    // Toggle sidebar
  },
  'Escape': () => {  // ✅ No param needed if not using event
    setShowSearch(false);
    setShowHelp(false);
    closeContextMenu();
  },
  'F1': (e: globalThis.KeyboardEvent) => {
    e.preventDefault();
    setShowHelp((prev) => !prev);
  },
  'F2': (e: globalThis.KeyboardEvent) => {
    if (selectedId) {
      e.preventDefault();
      // Handled by FileExplorer component
    }
  },
  'Delete': (e: globalThis.KeyboardEvent) => {
    if (selectedId && selectedId !== rootId) {
      e.preventDefault();
      // Handled by FileExplorer component
    }
  },
}, { target: document.body });

  // ── Context Menu Handler ───────────────────────────
  const handleGlobalContextMenu = useCallback((
    e: MouseEvent<HTMLElement>,
    nodeId?: string
  ) => {
    if (nodeId) {
      openContextMenu(e, nodeId);
    }
  }, [openContextMenu]);

  // ── Status Bar Data ────────────────────────────────
  const selectedNode = selectedId ? nodes[selectedId] : null;
  const statusBar: StatusBarProps = {
    selectedNodeName: selectedNode?.name ?? null,
    fileType: selectedNode?.type ?? null,
    totalNodes: Math.max(0, Object.keys(nodes).length - 1),
  };

  // ── Render ─────────────────────────────────────────
  return (
    <div 
      className={`app ${theme}`} 
      data-theme={theme}
      onContextMenu={(e) => {
        if (!(e.target as Element).closest('[data-context-trigger]')) {
          e.preventDefault();
        }
      }}
    >
      {/* Header / Toolbar */}
      <header className="app-header" role="banner">
        <div className="toolbar-left">
          <h1 className="app-title">
            <span className="logo" aria-hidden="true">📦</span>
            Storebox Explorer
          </h1>
        </div>
        
        <div className="toolbar-center">
          <SearchBar
            query={searchQuery}
            onQueryChange={setSearchQuery}
            isOpen={showSearch}
            onOpenChange={setShowSearch}
            results={searchResults}
            onSelectResult={handleSearchSelect}
            placeholder="Search files... (⌘K)"
          />
        </div>
        
        <div className="toolbar-right">
          <button
            className="toolbar-btn"
            onClick={() => setShowHelp((prev) => !prev)}
            title="Keyboard shortcuts (F1)"
            aria-label="Show keyboard shortcuts"
            type="button"
          >
            <Info size={16} aria-hidden="true" />
          </button>
          <button
            className="toolbar-btn theme-toggle"
            onClick={toggle}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            aria-label={`Toggle theme (current: ${theme})`}
            type="button"
          >
            {theme === 'dark' ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="app-main" role="main">
        <div className="split-view">
          {/* File Explorer Sidebar */}
          <aside className="sidebar" role="navigation" aria-label="File navigation">
            <FileExplorer onContextMenu={handleGlobalContextMenu} />
          </aside>
          
          {/* File Editor / Empty State */}
          <section className="editor-area" aria-label="File editor">
            {openFileId ? (
              <FileEditor fileId={openFileId} />
            ) : (
              <EmptyState 
                onCreateFile={() => {
                  const targetId = selectedId && nodes[selectedId]?.type === 'folder' 
                    ? selectedId 
                    : rootId;
                  createNode(targetId, 'file');
                }} 
                onCreateFolder={() => {
                  const targetId = selectedId && nodes[selectedId]?.type === 'folder' 
                    ? selectedId 
                    : rootId;
                  createNode(targetId, 'folder');
                }} 
              />
            )}
          </section>
        </div>
      </main>

      {/* Status Bar */}
      <StatusBar {...statusBar} />

      {/* Context Menu Portal */}
      {menu && (
        <ContextMenu 
          menu={menu as ContextMenuState} 
          onClose={closeContextMenu} 
        />
      )}

      {/* Help Modal / Keyboard Shortcuts */}
      {showHelp && (
        <HelpModal onClose={() => setShowHelp(false)} />
      )}

      {/* Search Results Dropdown */}
      {showSearch && searchQuery.trim() && searchResults.length > 0 && (
        <SearchResultsDropdown
          results={searchResults}
          query={searchQuery}
          onSelect={handleSearchSelect}
          onClose={() => setShowSearch(false)}
        />
      )}
    </div>
  );
}

// ── Empty State Component ────────────────────────────
function EmptyState({
  onCreateFile,
  onCreateFolder,
}: {
  onCreateFile: () => void;
  onCreateFolder: () => void;
}): React.ReactElement {
  return (
    <div className="empty-state" role="status" aria-live="polite">
      <div className="empty-icon" aria-hidden="true">📁</div>
      <h2>Welcome to Storebox Explorer</h2>
      <p className="empty-hint">
        Select a file from the sidebar to edit, or create a new one:
      </p>
      <div className="empty-actions">
        <button className="btn btn-primary" onClick={onCreateFile} type="button">
          <Plus size={16} aria-hidden="true" />
          New File
        </button>
        <button className="btn btn-secondary" onClick={onCreateFolder} type="button">
          <Plus size={16} aria-hidden="true" />
          New Folder
        </button>
      </div>
      <p className="empty-tip">
        💡 Tip: Press <kbd>⌘K</kbd> to search, <kbd>F1</kbd> for shortcuts
      </p>
    </div>
  );
}

// ── Status Bar Component ─────────────────────────────
function StatusBar({
  selectedNodeName,
  fileType,
  totalNodes,
}: StatusBarProps): React.ReactElement {
  return (
    <footer className="status-bar" role="contentinfo">
      <div className="status-left">
        {selectedNodeName ? (
          <span>
            Selected: <strong>{selectedNodeName}</strong>
            {fileType && <span className="status-type">({fileType})</span>}
          </span>
        ) : (
          <span>Ready</span>
        )}
      </div>
      <div className="status-right">
        <span>{totalNodes} item{totalNodes !== 1 ? 's' : ''}</span>
        <span className="status-separator" aria-hidden="true">•</span>
        <span>Storebox v1.0</span>
      </div>
    </footer>
  );
}

// ── Help Modal (Keyboard Shortcuts) ──────────────────
function HelpModal({ onClose }: { onClose: () => void }): React.ReactElement {
  const shortcuts = [
    { keys: ['⌘', 'K'], desc: 'Open search' },
    { keys: ['F2'], desc: 'Rename selected' },
    { keys: ['Delete'], desc: 'Delete selected' },
    { keys: ['⌘', 'N'], desc: 'New file' },
    { keys: ['⌘', '⇧', 'N'], desc: 'New folder' },
    { keys: ['⌘', 'B'], desc: 'Toggle sidebar' },
    { keys: ['Esc'], desc: 'Close dialogs / Cancel' },
    { keys: ['F1'], desc: 'Show this help' },
    { keys: ['↑', '↓'], desc: 'Navigate tree' },
    { keys: ['←', '→'], desc: 'Expand/collapse folders' },
  ];

  const handleOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') onClose();
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-title"
      tabIndex={-1}
    >
      <div className="modal-content" role="document">
        <div className="modal-header">
          <h2 id="help-title">Keyboard Shortcuts</h2>
          <button 
            className="modal-close" 
            onClick={onClose}
            aria-label="Close help"
            type="button"
          >
            ✕
          </button>
        </div>
        <div className="modal-body">
          <ul className="shortcut-list">
            {shortcuts.map((s, i) => (
              <li key={i} className="shortcut-item">
                <div className="shortcut-keys">
                  {s.keys.map((key, j) => (
                    <kbd key={j} className="shortcut-key">
                      {key}
                    </kbd>
                  ))}
                </div>
                <span className="shortcut-desc">{s.desc}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose} type="button">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Search Results Dropdown ──────────────────────────
function SearchResultsDropdown({
  results,
  query,
  onSelect,
  onClose,
}: {
  results: FSNode[];
  query: string;
  onSelect: (nodeId: string) => void;
  onClose: () => void;
}): React.ReactElement | null {
  if (results.length === 0 && !query.trim()) return null;

  const highlightMatch = (text: string): React.ReactNode => {
    if (!query.trim()) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="search-mark">{text.slice(idx, idx + query.length)}</mark>
        {text.slice(idx + query.length)}
      </>
    );
  };

  return (
    <div className="search-dropdown" role="listbox" aria-label="Search results">
      {results.length === 0 ? (
        <div className="search-empty" role="status">
          No results for &quot;{query}&quot;
        </div>
      ) : (
        results.slice(0, 10).map((node) => (
          <button
            key={node.id}
            className="search-result-item"
            role="option"
            aria-selected={false}
            onClick={() => {
              onSelect(node.id);
              onClose();
            }}
            type="button"
          >
            <span className="search-result-name">{highlightMatch(node.name)}</span>
            <span className="search-result-path">
              {node.type === 'folder' ? '📁' : '📄'} {node.type}
            </span>
          </button>
        ))
      )}
    </div>
  );
}

// ── Export Default ───────────────────────────────────
export default function App(): React.ReactElement {
  return <AppContent />;
}
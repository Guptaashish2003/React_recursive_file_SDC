import React, { useRef } from 'react'
import { FilePlus, FolderPlus, Search, X, ChevronDown } from 'lucide-react'
import { useFS } from '../context/FileSystemContext'
import { useSearch } from '../_hooks/useSearch'
import { useContextMenu } from '../_hooks/useContextMenu'
import TreeNode from './TreeNode'
import ContextMenu from '../context/ContextMenu'
import SearchResults from './SearchResult'
import styles from './Sidebar.module.css'

export default function Sidebar() {
  const { nodes, rootId, createNode } = useFS()
  const { query, setQuery, results, isSearching } = useSearch()
  const { menu, open: openMenu, close: closeMenu } = useContextMenu()
  const root = nodes[rootId]

  const handleCreateFile = () => createNode(rootId, 'file')
  const handleCreateFolder = () => createNode(rootId, 'folder')

  return (
    <aside className={styles.sidebar}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.title}>
          <span className={styles.titleText}>Explorer</span>
          <div className={styles.actions}>
            <button className={styles.iconBtn} title="New File (Ctrl+N)" onClick={handleCreateFile}>
              <FilePlus size={15} />
            </button>
            <button className={styles.iconBtn} title="New Folder (Ctrl+Shift+N)" onClick={handleCreateFolder}>
              <FolderPlus size={15} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className={styles.searchWrap}>
          <Search size={13} className={styles.searchIcon} />
          <input
            className={styles.search}
            placeholder="Search files..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            spellCheck={false}
          />
          {query && (
            <button className={styles.clearBtn} onClick={() => setQuery('')}>
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Tree or Search Results */}
      <div className={styles.tree} role="tree">
        {isSearching ? (
          <SearchResults results={results} query={query} onClose={() => setQuery('')} />
        ) : (
          <>
            <div
              className={styles.rootLabel}
              onContextMenu={(e) => openMenu(e, rootId)}
            >
              <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />
              <span className={styles.rootName}>{root?.name ?? 'workspace'}</span>
              <div className={styles.rootActions}>
                <button className={styles.microBtn} title="New File" onClick={handleCreateFile}>
                  <FilePlus size={12} />
                </button>
                <button className={styles.microBtn} title="New Folder" onClick={handleCreateFolder}>
                  <FolderPlus size={12} />
                </button>
              </div>
            </div>
            { root?.type === 'folder' && root?.children.map(id => (
              <TreeNode key={id} id={id} depth={0} onContextMenu={openMenu} />
            ))}
            {root?.type === 'folder' && root.children.length === 0 && (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📁</div>
                <p>No files yet</p>
                <div className={styles.emptyActions}>
                  <button className={styles.createBtn} onClick={handleCreateFile}>
                    <FilePlus size={13} /> New File
                  </button>
                  <button className={styles.createBtn} onClick={handleCreateFolder}>
                    <FolderPlus size={13} /> New Folder
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {menu && (
        <ContextMenu menu={menu} onClose={closeMenu} />
      )}
    </aside>
  )
}
import React from 'react';
import { FilePlus, FolderPlus } from 'lucide-react';
import { useFS } from '../context/FileSystemContext';
import styles from './CreateButtons.module.css';

// ── Types ────────────────────────────────────────────
export interface CreateButtonsProps {
  /** The ID of the parent folder where new items will be created */
  parentId: string;
}

// ── Component ────────────────────────────────────────
export function CreateButtons({ parentId }: CreateButtonsProps): React.ReactElement {
  const { createNode } = useFS();

  const handleCreateFile = () => {
    createNode(parentId, 'file');
  };

  const handleCreateFolder = () => {
    createNode(parentId, 'folder');
  };

  return (
    <div 
      className={styles.container} 
      role="group" 
      aria-label="Create new item"
    >
      <button
        type="button"
        className={styles.button}
        onClick={handleCreateFile}
        aria-label="Create new file"
        title="New File (⌘N)"
      >
        <FilePlus size={14} aria-hidden="true" />
        <span className={styles.label}>File</span>
      </button>
      
      <button
        type="button"
        className={styles.button}
        onClick={handleCreateFolder}
        aria-label="Create new folder"
        title="New Folder (⌘⇧N)"
      >
        <FolderPlus size={14} aria-hidden="true" />
        <span className={styles.label}>Folder</span>
      </button>
    </div>
  );
}

export default CreateButtons;
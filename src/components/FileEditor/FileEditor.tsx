import React, { useState, useCallback, useEffect, KeyboardEvent, ChangeEvent } from 'react';
import { useFS } from '../../context/FileSystemContext';
import { isFileNode, getFileExtension } from '../../utils/fsUtils';
import { X, Save, FileText, Code } from 'lucide-react';
import styles from './FileEditor.module.css';

// ── Types ────────────────────────────────────────────
export interface FileEditorProps {
  fileId: string;
  onClose?: () => void;
}

interface EditorState {
  content: string;
  isDirty: boolean;
  isSaving: boolean;
  error: string | null;
}

// ── Component ────────────────────────────────────────
export function FileEditor({ fileId, onClose }: FileEditorProps): React.ReactElement {
  const { nodes, updateFileContent, closeFile } = useFS();
  
  // ✅ ALL HOOKS CALLED FIRST - BEFORE ANY RETURNS
  const [state, setState] = useState<EditorState>({
    content: '',
    isDirty: false,
    isSaving: false,
    error: null,
  });

  // Effect: Load file content when fileId changes
  useEffect(() => {
    // We'll handle the file lookup inside the effect to avoid conditional hook calls
    const file = nodes[fileId];
    if (file && isFileNode(file)) {
      setState((prev) => ({
        ...prev,
        content: file.content,
        isDirty: false,
        error: null,
      }));
    }
  }, [fileId, nodes]);

  // Effect: Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state.isDirty]);

  // Handler: Handle text changes
  const handleChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setState((prev) => ({
      ...prev,
      content: e.target.value,
      isDirty: true,
      error: null,
    }));
  }, []);

  // Handler: Save file content
  const handleSave = useCallback(async () => {
    if (state.isSaving) return;
    
    setState((prev) => ({ ...prev, isSaving: true, error: null }));
    
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      updateFileContent(fileId, state.content);
      setState((prev) => ({ ...prev, isDirty: false, isSaving: false }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isSaving: false,
        error: err instanceof Error ? err.message : 'Failed to save',
      }));
    }
  }, [fileId, state.content, state.isSaving, updateFileContent]);

  // Handler: Close editor
  const handleClose = useCallback(() => {
    if (state.isDirty) {
      // eslint-disable-next-line no-restricted-globals
      const confirmClose = window.confirm('You have unsaved changes. Close anyway?');
      if (!confirmClose) return;
    }
    closeFile();
    onClose?.();
  }, [state.isDirty, closeFile, onClose]);

  // Handler: Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape' && !state.isDirty) {
      e.preventDefault();
      handleClose();
    }
  }, [handleSave, handleClose, state.isDirty]);

  // ✅ NOW do the guard check AFTER all hooks
  const file = nodes[fileId];
  
  // Guard: invalid file - return error UI
  if (!file || !isFileNode(file)) {
    return (
      <div className={styles.error}>
        <FileText size={32} className={styles.errorIcon} aria-hidden="true" />
        <p>File not found or cannot be edited</p>
        {onClose && (
          <button className={styles.btnClose} onClick={onClose} type="button">
            Close
          </button>
        )}
      </div>
    );
  }

  // ✅ Now safe to use file properties
  const ext = getFileExtension(file.name);
  const isCodeFile = ['js', 'jsx', 'ts', 'tsx', 'css', 'scss', 'html', 'json'].includes(ext);

  // ── Render ─────────────────────────────────────────
  return (
    <div className={styles.editor} role="region" aria-label={`Editor: ${file.name}`}>
      {/* Editor Header */}
      <header className={styles.header}>
        <div className={styles.fileInfo}>
          <span className={styles.icon} aria-hidden="true">
            {isCodeFile ? <Code size={14} /> : <FileText size={14} />}
          </span>
          <span className={styles.filename} title={file.name}>
            {file.name}
          </span>
          {state.isDirty && <span className={styles.dirty} aria-hidden="true">●</span>}
        </div>
        
        <div className={styles.actions}>
          {state.error && (
            <span className={styles.errorMsg} role="alert" aria-live="polite">
              {state.error}
            </span>
          )}
          
          <button
            className={`${styles.btnSave} ${state.isDirty ? styles.active : ''}`}
            onClick={handleSave}
            disabled={state.isSaving || !state.isDirty}
            title="Save (⌘S)"
            aria-label="Save file"
            type="button"
          >
            <Save size={14} aria-hidden="true" />
            <span className={styles.btnLabel}>Save</span>
          </button>
          
          <button
            className={styles.btnClose}
            onClick={handleClose}
            title="Close (Esc)"
            aria-label="Close file"
            type="button"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Editor Content */}
      <textarea
        className={`${styles.content} ${isCodeFile ? styles.monospace : ''}`}
        value={state.content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => state.isDirty && handleSave()}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        aria-label={`Content of ${file.name}`}
        placeholder={isCodeFile ? '// Start typing...' : 'Start typing...'}
        data-file-editor
      />

      {/* Status Bar */}
      <footer className={styles.statusBar}>
        <span className={styles.statusItem}>
          {state.content.split('\n').length} lines
        </span>
        <span className={styles.statusItem}>
          {state.content.length} characters
        </span>
        {ext && (
          <span className={styles.statusItem}>
            {ext.toUpperCase()}
          </span>
        )}
        {state.isSaving && (
          <span className={styles.saving} aria-live="polite">
            Saving...
          </span>
        )}
      </footer>
    </div>
  );
}

export default FileEditor;
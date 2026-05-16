import React, { useRef, useEffect, useState, KeyboardEvent, ChangeEvent, MouseEvent } from 'react';
import { useFS } from '../context/FileSystemContext';
import { isValidName, sanitizeFilename } from '../utils/fsUtils';
import styles from './InlineRename.module.css';

// ── Types ────────────────────────────────────────────
export interface InlineRenameProps {
  /** The node ID being renamed */
  id: string;
  /** Initial value for the input field */
  initialValue?: string;
  /** Optional callback when rename is cancelled */
  onCancel?: () => void;
  /** Optional callback when rename is successful */
  onSave?: (newName: string) => void;
}

// ── Component ────────────────────────────────────────
export default function InlineRename({
  id,
  initialValue = '',
  onCancel,
  onSave,
}: InlineRenameProps): React.ReactElement {
  const { nodes, renameNode, cancelEditing } = useFS();
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [value, setValue] = useState<string>(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const node = nodes[id];

  // ── Effects ────────────────────────────────────────
  
  // Focus and select text on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Sync with external initialValue changes
  useEffect(() => {
    setValue(initialValue);
    setError(null);
  }, [initialValue]);

  // ── Validation ─────────────────────────────────────
  
  const validate = (name: string): string | null => {
    const trimmed = name.trim();
    
    if (!trimmed) {
      return 'Name cannot be empty';
    }
    if (trimmed.length > 255) {
      return 'Name too long (max 255 characters)';
    }
    if (!isValidName(trimmed)) {
      return 'Invalid characters: / \\ : * ? " < > |';
    }
    // Check for duplicate name in same parent
    if (node?.parentId) {
      const siblings = nodes[node.parentId];
      if (siblings?.type === 'folder') {
        const duplicate = siblings.children.some((childId: string) => {
          const sibling = nodes[childId];
          return sibling?.id !== id && sibling?.name.toLowerCase() === trimmed.toLowerCase();
        });
        if (duplicate) {
          return 'A file or folder with this name already exists';
        }
      }
    }
    return null;
  };

  // ── Handlers ───────────────────────────────────────
  
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    
    // Live validation feedback
    if (newValue) {
      const validationError = validate(newValue);
      setError(validationError);
    } else {
      setError(null);
    }
  };

  const commit = () => {
    if (isSubmitting) return;
    
    const trimmed = value.trim();
    const validationError = validate(trimmed);
    
    if (validationError) {
      setError(validationError);
      // Keep editing mode open for correction
      inputRef.current?.focus();
      return;
    }
    
    setIsSubmitting(true);
    const sanitizedName = sanitizeFilename(trimmed);
    
    try {
      renameNode(id, sanitizedName);
      onSave?.(sanitizedName);
    } catch (err) {
      console.error('Failed to rename node:', err);
      setError('Failed to save. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    cancelEditing(id);
    onCancel?.();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Stop propagation to prevent tree-level keyboard shortcuts
    e.stopPropagation();
    
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        commit();
        break;
      case 'Escape':
        e.preventDefault();
        handleCancel();
        break;
      case 'Tab':
        // Allow tab navigation but prevent default tree behavior
        e.stopPropagation();
        break;
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Don't commit if clicking on error message or within component
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    if (relatedTarget?.closest(`[data-inline-rename="${id}"]`)) {
      return;
    }
    // Commit on blur only if no error
    if (!error) {
      commit();
    }
  };

  const handleClick = (e: MouseEvent<HTMLInputElement>) => {
    // Prevent click from bubbling to tree row
    e.stopPropagation();
  };

  // ── Render ─────────────────────────────────────────
  
  return (
    <div 
      className={styles.wrapper}
      data-inline-rename={id}
      role="dialog"
      aria-label={`Rename "${node?.name || 'item'}"`}
      aria-modal="false"
    >
      <input
        ref={inputRef}
        type="text"
        className={`${styles.input} ${error ? styles.error : ''} ${isSubmitting ? styles.submitting : ''}`}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onClick={handleClick}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        aria-label="New name"
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        disabled={isSubmitting}
      />
      
      {error && (
        <span 
          id={`${id}-error`} 
          className={styles.errorMsg} 
          role="alert"
          aria-live="polite"
        >
          {error}
        </span>
      )}
      
      {isSubmitting && (
        <span className={styles.saving} aria-live="polite">
          Saving...
        </span>
      )}
    </div>
  );
}
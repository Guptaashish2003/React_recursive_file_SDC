import React, { useRef, useEffect, useState, KeyboardEvent, ChangeEvent, FormEvent } from 'react';
import { useFS } from './FileSystemContext';
import { isValidName, sanitizeFilename } from '../utils/fsUtils';
import styles from './InlineRename.module.css';

export interface InlineRenameProps {
  id: string;
  initialValue: string;
}

export default function InlineRename({ id, initialValue }: InlineRenameProps): React.ReactElement {
  const { nodes, renameNode, cancelEditing } = useFS();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState<string>(initialValue);
  const [error, setError] = useState<string | null>(null);

  const node = nodes[id];

  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM is ready
    const timer = requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    });
    return () => cancelAnimationFrame(timer);
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
    
    if (newValue) {
      const validationError = validate(newValue);
      setError(validationError);
    } else {
      setError(null);
    }
  };

  const commit = () => {
    const trimmed = value.trim();
    const validationError = validate(trimmed);
    
    if (validationError) {
      setError(validationError);
      inputRef.current?.focus();
      return;
    }
    
    const sanitizedName = sanitizeFilename(trimmed);
    renameNode(id, sanitizedName);
  };

  const handleCancel = () => {
    cancelEditing(id);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
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
        e.stopPropagation();
        break;
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    if (relatedTarget?.closest(`[data-inline-rename="${id}"]`)) {
      return;
    }
    if (!error) {
      commit();
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
    e.stopPropagation();
  };

  // ── Render ────────────────────────────────────────
  
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
        className={`${styles.input} ${error ? styles.error : ''}`}
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
        data-inline-rename-input
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
    </div>
  );
}
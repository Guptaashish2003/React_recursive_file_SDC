import React, { useState, useCallback, useRef, useEffect, KeyboardEvent, ChangeEvent, MouseEvent } from 'react';
import { FSNode } from '../../types/fs';
import { Search, X, Command } from 'lucide-react';
import styles from './SearchBar.module.css';

// ── Types ────────────────────────────────────────────
export interface SearchBarProps {
  /** Current search query */
  query: string;
  /** Callback when query changes */
  onQueryChange: (query: string) => void;
  /** Whether search dropdown is open */
  isOpen: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Search results to display */
  results: FSNode[];
  /** Callback when a result is selected */
  onSelectResult: (nodeId: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Maximum results to show in dropdown */
  maxResults?: number;
}

// ── Component ────────────────────────────────────────
export function SearchBar({
  query,
  onQueryChange,
  isOpen,
  onOpenChange,
  results,
  onSelectResult,
  placeholder = 'Search...',
  maxResults = 10,
}: SearchBarProps): React.ReactElement {
  const [isFocused, setIsFocused] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const displayedResults = results.slice(0, maxResults);
  const hasMore = results.length > maxResults;

  // ── Effects ────────────────────────────────────────
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: Event | MouseEvent | TouchEvent) => {
      const target = (e.target as Element | null);
      if (
        dropdownRef.current && 
        target &&
        !dropdownRef.current.contains(target) && 
        !inputRef.current?.contains(target)
      ) {
        onOpenChange(false);
        setHighlightedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onOpenChange]);

  // Reset highlight when results change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [results]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // ── Handlers ───────────────────────────────────────
  
  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    onQueryChange(e.target.value);
    if (e.target.value.trim() && !isOpen) {
      onOpenChange(true);
    }
    setHighlightedIndex(-1);
  }, [onQueryChange, isOpen, onOpenChange]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    if (query.trim() && !isOpen) {
      onOpenChange(true);
    }
  }, [query, isOpen, onOpenChange]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  const handleClear = useCallback(() => {
    onQueryChange('');
    onOpenChange(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  }, [onQueryChange, onOpenChange]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => 
          prev < displayedResults.length - 1 ? prev + 1 : prev
        );
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
        
      case 'Enter':
        if (highlightedIndex >= 0 && displayedResults[highlightedIndex]) {
          e.preventDefault();
          onSelectResult(displayedResults[highlightedIndex].id);
          handleClear();
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        onOpenChange(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  }, [highlightedIndex, displayedResults, onSelectResult, handleClear, onOpenChange]);

  const handleResultClick = useCallback((nodeId: string) => {
    onSelectResult(nodeId);
    handleClear();
  }, [onSelectResult, handleClear]);

  const handleResultMouseEnter = useCallback((index: number) => {
    setHighlightedIndex(index);
  }, []);

  // ── Helpers ────────────────────────────────────────
  
  const highlightMatch = (text: string, query: string): React.ReactNode => {
    if (!query.trim()) return text;
    
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const idx = lowerText.indexOf(lowerQuery);
    
    if (idx === -1) return text;
    
    return (
      <>
        {text.slice(0, idx)}
        <mark className={styles.mark}>{text.slice(idx, idx + query.length)}</mark>
        {text.slice(idx + query.length)}
      </>
    );
  };

  // ── Render ─────────────────────────────────────────
  
  return (
    <div className={styles.searchContainer} role="search">
      {/* Search Input */}
      <div 
        className={`${styles.inputWrapper} ${isFocused ? styles.focused : ''} ${isOpen ? styles.open : ''}`}
        data-search-wrapper
      >
        <Search size={14} className={styles.searchIcon} aria-hidden="true" />
        
        <input
          ref={inputRef}
          type="search"
          className={styles.input}
          value={query}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Search files"
          aria-expanded={isOpen}
          aria-controls={isOpen ? 'search-results' : undefined}
          aria-autocomplete="list"
          aria-activedescendant={highlightedIndex >= 0 ? `search-result-${highlightedIndex}` : undefined}
          data-search-input
        />
        
        {query && (
          <button
            className={styles.clearBtn}
            onClick={handleClear}
            aria-label="Clear search"
            type="button"
          >
            <X size={12} />
          </button>
        )}
        
        <kbd className={styles.shortcut} aria-hidden="true">
          <Command size={10} />K
        </kbd>
      </div>

      {/* Results Dropdown */}
      {isOpen && query.trim() && (
        <div 
          ref={dropdownRef}
          className={styles.dropdown}
          id="search-results"
          role="listbox"
          aria-label="Search results"
        >
          {displayedResults.length === 0 ? (
            <div className={styles.empty} role="status">
              No results for "{query}"
            </div>
          ) : (
            <>
              <div className={styles.resultsHeader}>
                <span>{results.length} result{results.length !== 1 ? 's' : ''}</span>
                {hasMore && (
                  <span className={styles.truncated}>
                    (showing {displayedResults.length})
                  </span>
                )}
              </div>
              
              <ul className={styles.resultsList} role="presentation">
                {displayedResults.map((node, index) => (
                  <li 
                    key={node.id} 
                    role="option"
                    id={`search-result-${index}`}
                    aria-selected={highlightedIndex === index}
                  >
                    <button
                      className={`${styles.resultItem} ${highlightedIndex === index ? styles.highlighted : ''}`}
                      onClick={() => handleResultClick(node.id)}
                      onMouseEnter={() => handleResultMouseEnter(index)}
                      type="button"
                      data-node-id={node.id}
                      data-node-type={node.type}
                    >
                      <span className={styles.resultIcon} aria-hidden="true">
                        {node.type === 'folder' ? '📁' : '📄'}
                      </span>
                      
                      <span className={styles.resultName}>
                        {highlightMatch(node.name, query)}
                      </span>
                      
                      <span className={styles.resultPath}>
                        {node.parentId ? '…' : '/'}{node.type}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              
              {hasMore && (
                <div className={styles.moreHint}>
                  Refine search to see more results
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
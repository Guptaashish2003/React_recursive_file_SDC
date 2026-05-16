import { useEffect, useCallback } from 'react';

// ── Types ────────────────────────────────────────────
/** Handler for keyboard events - uses NATIVE DOM KeyboardEvent */
export type KeyboardHandler = (e: globalThis.KeyboardEvent) => void;

export interface KeyboardHandlers {
  [key: string]: KeyboardHandler;
}

export interface UseKeyboardOptions {
  target?: HTMLElement | null;
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

// ── Hook ─────────────────────────────────────────────
export function useKeyboard(
  handlers: KeyboardHandlers,
  options: UseKeyboardOptions = {}
): void {
  const { 
    target = null, 
    preventDefault = true, 
    stopPropagation = false 
  } = options;

  // Memoize the keydown handler - uses NATIVE KeyboardEvent
  const handleKeyDown = useCallback((e: globalThis.KeyboardEvent) => {
    // Build the key combination string
    const parts: string[] = [];
    if (e.ctrlKey || e.metaKey) parts.push('Cmd');
    if (e.shiftKey) parts.push('Shift');
    if (e.altKey) parts.push('Alt');
    
    const key = e.key;
    const normalizedKey = key.length === 1 ? key.toUpperCase() : key;
    parts.push(normalizedKey);
    
    const keyCombo = parts.join('+');
    
    // Check for match
    const handler = handlers[keyCombo] ?? handlers[key] ?? handlers[normalizedKey];
    
    if (handler) {
      if (preventDefault) e.preventDefault();
      if (stopPropagation) e.stopPropagation();
      handler(e);
    }
  }, [handlers, preventDefault, stopPropagation]);

  useEffect(() => {
    // Use type assertion to satisfy EventListener signature
    const listener = handleKeyDown as EventListener;
    const element = target ?? window;
    
    element.addEventListener('keydown', listener);
    
    return () => {
      element.removeEventListener('keydown', listener);
    };
  }, [handleKeyDown, target]);
}

// ── Utility: Format key for display ──────────────────
export function formatKeyCombo(e: globalThis.KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
  if (e.shiftKey) parts.push('Shift');
  if (e.altKey) parts.push('Alt');
  
  const displayKey: Record<string, string> = {
    ' ': 'Space', 'Enter': '↵', 'Escape': 'Esc',
    'ArrowUp': '↑', 'ArrowDown': '↓', 'ArrowLeft': '←', 'ArrowRight': '→',
    'Delete': 'Del', 'Backspace': '⌫',
  };
  
  parts.push(displayKey[e.key] ?? e.key.toUpperCase());
  return parts.join('+');
}

// ── Common key combinations ──────────────────────────
export const Keys = {
  ENTER: 'Enter', ESCAPE: 'Escape', DELETE: 'Delete',
  BACKSPACE: 'Backspace', ARROW_UP: 'ArrowUp', ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft', ARROW_RIGHT: 'ArrowRight',
  TAB: 'Tab', SPACE: ' ', F1: 'F1', F2: 'F2',
  CMD: 'Cmd', CTRL: 'Cmd', SHIFT: 'Shift', ALT: 'Alt',
  CMD_S: 'Cmd+S', CMD_N: 'Cmd+N', CMD_SHIFT_N: 'Cmd+Shift+N',
  CMD_B: 'Cmd+B', DELETE_KEY: 'Delete', F2_KEY: 'F2',
} as const;
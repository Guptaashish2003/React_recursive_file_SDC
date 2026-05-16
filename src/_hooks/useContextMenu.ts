import { useState, useEffect, useCallback } from 'react';

// ── Types ────────────────────────────────────────────
export interface ContextMenuState {
  x: number;
  y: number;
  nodeId: string;
}

export interface UseContextMenuReturn {
  menu: ContextMenuState | null;
  open: (e: React.MouseEvent<HTMLElement>, nodeId: string) => void;
  close: () => void;
}

// ── Hook ─────────────────────────────────────────────
export function useContextMenu(): UseContextMenuReturn {
  const [menu, setMenu] = useState<ContextMenuState | null>(null);

  

  const open = useCallback((e: React.MouseEvent<HTMLElement>, nodeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ 
      x: e.clientX, 
      y: e.clientY, 
      nodeId 
    });
  }, []);

  const close = useCallback(() => {
    setMenu(null);
  }, []);

  useEffect(() => {
    if (!menu) return;

    const handleClick = (e: MouseEvent) => {
      // Close if clicking outside the menu
      const target = e.target as Element;
      if (!target.closest('[data-context-menu]') && !target.closest('[data-context-trigger]')) {
        close();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
      }
    };

    const handleScroll = () => close();
    const handleResize = () => close();

    // Use capture phase to ensure we catch events early
    window.addEventListener('click', handleClick, true);
    window.addEventListener('contextmenu', handleClick, true);
    window.addEventListener('keydown', handleEscape);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('click', handleClick, true);
      window.removeEventListener('contextmenu', handleClick, true);
      window.removeEventListener('keydown', handleEscape);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [menu, close]);

  return { menu, open, close };
}
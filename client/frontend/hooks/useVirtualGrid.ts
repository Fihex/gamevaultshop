import { useState, useEffect, useMemo, useLayoutEffect } from 'react';

interface UseVirtualGridProps {
  totalItems: number;
  itemHeight: number; // Height of one row in pixels
  gridGap: number;    // Gap between items in pixels
  viewMode: 'grid' | 'list';
  savedScrollPos?: number; // Position to restore
}

export const useVirtualGrid = ({
  totalItems,
  itemHeight,
  gridGap,
  viewMode,
  savedScrollPos = 0
}: UseVirtualGridProps) => {
  const [scrollTop, setScrollTop] = useState(savedScrollPos);
  const [containerWidth, setContainerWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1000);

  // 1. Determine Columns based on Width & ViewMode
  // Matches CSS: grid-cols-2 lg:grid-cols-3
  const columns = useMemo(() => {
    if (viewMode === 'list') return 1;
    if (containerWidth >= 1024) return 3; // lg
    return 2; // Default/md
  }, [containerWidth, viewMode]);

  // 2. Calculate Total Height
  // We explicitly depend on itemHeight here to recalculate when screen resizes
  const totalRows = Math.ceil(totalItems / columns);
  const totalHeight = totalRows * itemHeight + (totalRows - 1) * gridGap;

  // 3. Handle Scroll & Resize
  useEffect(() => {
    const handleScroll = () => {
      requestAnimationFrame(() => {
        setScrollTop(window.scrollY);
      });
    };

    const handleResize = () => {
      setContainerWidth(window.innerWidth);
    };

    // Initial check
    handleResize();

    // Force scroll restoration if needed
    if (savedScrollPos > 0) {
        window.scrollTo(0, savedScrollPos);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [savedScrollPos]); // Added savedScrollPos dependency for strictness

  // 4. Restore Scroll on Mount (Layout Effect runs before paint)
  useLayoutEffect(() => {
    if (savedScrollPos > 0) {
      window.scrollTo(0, savedScrollPos);
      setScrollTop(savedScrollPos);
    }
  }, []); // Only run once on mount

  // 5. Calculate Visible Range (Windowing)
  const buffer = 2;
  const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 1000;

  const startRow = Math.max(0, Math.floor(scrollTop / (itemHeight + gridGap)) - buffer);
  const endRow = Math.min(
    totalRows,
    Math.ceil((scrollTop + windowHeight) / (itemHeight + gridGap)) + buffer
  );

  const startIndex = startRow * columns;
  const endIndex = Math.min(totalItems, endRow * columns);

  // 6. Generate Virtual Items
  const virtualItems = useMemo(() => {
    const items = [];
    for (let i = startIndex; i < endIndex; i++) {
      const rowIndex = Math.floor(i / columns);
      const colIndex = i % columns;

      const top = rowIndex * (itemHeight + gridGap);
      const widthPercent = 100 / columns;

      items.push({
        index: i,
        style: {
          position: 'absolute' as const,
          top: 0,
          left: 0,
          width: `${widthPercent}%`,
          height: `${itemHeight}px`,
          transform: `translate3d(${colIndex * 100}%, ${top}px, 0)`,
        }
      });
    }
    return items;
  }, [startIndex, endIndex, columns, itemHeight, gridGap]);

  return {
    virtualItems,
    totalHeight,
    columns
  };
};

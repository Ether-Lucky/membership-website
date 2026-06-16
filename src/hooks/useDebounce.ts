// src/hooks/useDebounce.ts
import { useState, useEffect } from 'react';

/**
 * Returns a debounced copy of `value` that only updates
 * after `delay` milliseconds of no changes.
 * Used in the member search input to avoid a DB query on every keystroke.
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

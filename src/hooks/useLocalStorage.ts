import { useState, useEffect, useCallback } from 'react';

/**
 * SSR-safe localStorage hook with cross-tab synchronization
 * @param key - localStorage key
 * @param initialValue - Default value if key doesn't exist
 * @returns [storedValue, setValue]
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // Lazy initialization to avoid SSR issues
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Update localStorage when value changes
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // Listen for changes in other tabs
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.warn(`Error parsing localStorage change for "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue];
}

/**
 * Hook for localStorage with custom serializer/deserializer
 */
export function useLocalStorageCustom<T>(
  key: string,
  initialValue: T,
  options: {
    serialize?: (value: T) => string;
    deserialize?: (value: string) => T;
  } = {}
): [T, (value: T | ((prev: T) => T)) => void] {
  const { serialize = JSON.stringify, deserialize = JSON.parse } = options;

  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? deserialize(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, serialize(valueToStore));
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue, serialize]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(deserialize(e.newValue));
        } catch (error) {
          console.warn(`Error parsing localStorage change for "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, deserialize]);

  return [storedValue, setValue];
}

/**
 * Hook for sessionStorage (tab-scoped)
 */
export function useSessionStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.warn(`Error setting sessionStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
}

/**
 * Hook for managing multiple localStorage keys as an object
 */
export function useLocalStorageObject<T extends Record<string, unknown>>(
  prefix: string,
  initialValues: T
): [T, (key: keyof T, value: T[keyof T] | ((prev: T[keyof T]) => T[keyof T])) => void, () => void] {
  const [values, setValues] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValues;
    try {
      const result: Partial<T> = {};
      let hasAny = false;
      for (const key of Object.keys(initialValues) as (keyof T)[]) {
        const keyStr = String(key);
        const item = window.localStorage.getItem(`${prefix}.${keyStr}`);
        if (item !== null) {
          result[key] = JSON.parse(item);
          hasAny = true;
        }
      }
      return hasAny ? { ...initialValues, ...result } : initialValues;
    } catch {
      return initialValues;
    }
  });

  const setValue = useCallback(
    (key: keyof T, value: T[keyof T] | ((prev: T[keyof T]) => T[keyof T])) => {
      setValues((prev) => {
        const valueToStore = value instanceof Function ? value(prev[key]) : value;
        const newValues = { ...prev, [key]: valueToStore };
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(`${prefix}.${String(key)}`, JSON.stringify(valueToStore));
        }
        return newValues;
      });
    },
    [prefix]
  );

  const clear = useCallback(() => {
    if (typeof window === 'undefined') return;
    for (const key of Object.keys(initialValues) as (keyof T)[]) {
      window.localStorage.removeItem(`${prefix}.${String(key)}`);
    }
    setValues(initialValues);
  }, [prefix, initialValues]);

  return [values, setValue, clear];
}

export default useLocalStorage;
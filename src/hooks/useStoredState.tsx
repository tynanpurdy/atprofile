import { useEffect, useState } from "preact/hooks";
import type { Dispatch, StateUpdater } from "preact/hooks";

/**
 * Sets a value in localStorage with JSON stringification
 */
export function setToLocalStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving to localStorage (${key}):`, error);
  }
}

/**
 * Gets a value from localStorage with JSON parsing
 */
export function getFromLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);

    if (item === null) {
      setToLocalStorage(key, defaultValue);
      return defaultValue;
    }

    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    return defaultValue;
  }
}

/**
 * Custom hook that syncs state with localStorage
 */
export function useStoredState<T>(
  key: string,
  defaultValue: T,
): [T, Dispatch<StateUpdater<T>>] {
  const [value, setValue] = useState<T>(() =>
    getFromLocalStorage(key, defaultValue),
  );

  useEffect(() => {
    console.log("useStoredState", key, value);
    setToLocalStorage(key, value);
  }, [key, value]);

  return [value, setValue];
}

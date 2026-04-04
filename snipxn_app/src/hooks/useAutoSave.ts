import { useEffect, useRef, useState } from 'react';

export interface AutoSaveState {
  trigger: () => void;
  flush: () => Promise<void>;
  isPending: boolean;
}

export function useAutoSave(
  callback: () => void | Promise<void>,
  delay = 2000,
): AutoSaveState {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef(false);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  const trigger = () => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
    }

    pendingRef.current = true;
    setIsPending(true);
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      pendingRef.current = false;
      setIsPending(false);
      void callbackRef.current();
    }, delay);
  };

  const flush = async () => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (!pendingRef.current) {
      return;
    }

    pendingRef.current = false;
    setIsPending(false);
    await callbackRef.current();
  };

  return {
    trigger,
    flush,
    isPending,
  };
}

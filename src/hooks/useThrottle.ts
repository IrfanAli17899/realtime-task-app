import { useCallback, useRef } from "react";

export default function useThrottle<T extends (...args: any[]) => void>(
    fn: T,
    delay: number
  ): T {
    const lastCall = useRef(0);
    const timeout = useRef<NodeJS.Timeout>();
  
    return useCallback(
      (...args: Parameters<T>) => {
        const now = Date.now();
        if (now - lastCall.current >= delay) {
          fn(...args);
          lastCall.current = now;
        } else {
          clearTimeout(timeout.current);
          timeout.current = setTimeout(() => fn(...args), delay);
        }
      },
      [fn, delay]
    ) as T;
  }
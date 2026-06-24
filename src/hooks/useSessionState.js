import { useEffect, useState } from "react";

export default function useSessionState(key, initialValue) {
  const [value, setValue] = useState(() => {
    const stored = window.sessionStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });

  useEffect(() => {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

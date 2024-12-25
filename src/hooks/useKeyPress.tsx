import { useState, useEffect } from "react";

const KEY_MAPPINGS: { [key: string]: string } = {
  cmd: "Meta",
  shift: "Shift",
  alt: "Alt",
  ctrl: "Control",
  esc: "Escape",
};

export function useKeyPress(targetKey: string) {
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    const mappedKey =
      KEY_MAPPINGS[targetKey.toLowerCase()] || targetKey.toLowerCase();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === mappedKey.toLowerCase()) {
        setIsPressed(event.key.toLowerCase() === mappedKey.toLowerCase());
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === mappedKey.toLowerCase()) {
        setIsPressed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [targetKey]);

  return isPressed;
}

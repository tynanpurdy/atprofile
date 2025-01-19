import * as React from "react";
import { useKeyPress } from "@/hooks/useKeyPress";
import { cn } from "@/lib/utils";

const processSpecial = (char: string) => {
  if (char === "cmd" || char === "meta") return "⌘";
  if (char === "shift") return "⇧";
  if (char === "alt") return "⌥";
  if (char === "ctrl") return "⌃";
  return char.toUpperCase();
};

const KbdSegment = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & { char: string }
>(({ char, className, ...props }, ref) => {
  const isPressed = useKeyPress(char);
  char = processSpecial(char);

  return (
    <span
      ref={ref}
      className={cn(
        isPressed ? "text-primary" : "text-muted-foreground",
        className,
      )}
      {...props}
    >
      {char!}
    </span>
  );
});
KbdSegment.displayName = "KbdSegment";

const KbdKey = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    keys: string[];
    plus?: boolean;
  }
>(({ keys, className, plus = true, ...props }, ref) => {
  // Track all key presses
  const keyStates = keys.map((key) => useKeyPress(key));
  // Check if all keys are pressed
  const allKeysPressed = keyStates.every((state) => state === true);

  console.log(keyStates);

  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-md border bg-muted px-2 py-1 text-xs font-mono shadow",
        keys ? "gap-x-[0.062rem]" : "gap-x-1",
        allKeysPressed && "bg-green-300/50",
        className,
      )}
      {...props}
    >
      {keys.map((key, i) => (
        <>
          <span
            className={cn(
              "transition-colors",
              keyStates[i] ? "text-primary" : "text-muted-foreground",
              allKeysPressed && "text-green-400",
            )}
          >
            {processSpecial(key)}
          </span>
          {plus && i !== keys.length - 1 && <span className="mx-1">+</span>}
        </>
      ))}
    </div>
  );
});
KbdKey.displayName = "KbdKey";

export { KbdKey };

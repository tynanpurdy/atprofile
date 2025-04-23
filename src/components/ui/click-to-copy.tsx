import { useState } from "preact/compat";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button"; // Assuming you have a Button component from shadcn/ui
import { cn } from "@/lib/utils"; // Assuming you have a utility for class names

interface ClickToCopyProps {
  value?: string;
  children?: any; // Allow wrapping other elements if needed, defaults to showing the value
  className?: string;
  buttonClassName?: string;
  iconSize?: number;
}

export function ClickToCopy({
  value,
  children,
  className,
  buttonClassName,
  iconSize = 16, // Default icon size
}: ClickToCopyProps) {
  //const [isHovering, setIsHovering] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  if (!value) return children;

  const handleCopy = async (event: MouseEvent) => {
    event.stopPropagation(); // Prevent potential parent click handlers
    try {
      await navigator.clipboard.writeText(value);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const buttonLabel = isCopied ? "Copied!" : "Copy to clipboard";

  return (
    <div
      className={cn("relative flex items-center group", className)}
      //onMouseEnter={() => setIsHovering(true)}
      //onMouseLeave={() => setIsHovering(false)}
    >
      <Button
        variant="link"
        size="icon"
        className={cn(
          "absolute -left-8 top-1/2 transform -translate-y-1/2 p-1 h-full w-auto",
          "opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-150",
          isCopied
            ? "text-green-600 hover:text-green-700"
            : "text-muted-foreground hover:text-foreground",
          buttonClassName,
        )}
        onClick={handleCopy}
        aria-label={buttonLabel}
        title={buttonLabel}
      >
        <div className="relative flex items-center justify-center">
          <Copy
            size={iconSize}
            className={cn(
              "transition-all duration-200 ease-in-out",
              isCopied ? "opacity-0 scale-75" : "opacity-100 scale-100",
            )}
          />
          {/* Check Icon */}
          <Check
            size={iconSize}
            className={cn(
              "absolute transition-all duration-200 ease-in-out",
              isCopied ? "opacity-100 scale-100" : "opacity-0 scale-75",
            )}
          />
        </div>
      </Button>

      <span className="truncate">{children ?? value}</span>
    </div>
  );
}

export default ClickToCopy;

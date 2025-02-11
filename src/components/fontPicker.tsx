// 2. Create Font Picker Component
import { useTheme, GOOGLE_FONTS } from "@/providers/themeProvider";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Check, ChevronDown, Text } from "lucide-react";
import { useState } from "preact/hooks";

export function FontPicker() {
  const { font, setFont, loadFonts, loadedFonts } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    console.log("Setting open", open);
    if (open) {
      // Load all fonts when picker opens
      loadFonts(GOOGLE_FONTS);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Text className="h-4 w-4" />
          {font.name}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px]">
        <div className="grid gap-1 p-2">
          {GOOGLE_FONTS.map((fontOption) => (
            <button
              key={fontOption.name}
              onClick={() => {
                setFont(fontOption);
                setIsOpen(false);
              }}
              className="flex items-center justify-between rounded-sm p-2 text-sm hover:bg-accent"
              style={{
                fontFamily: `'${fontOption.name}', ${fontOption.category}`,
                // Show loading state if font isn't loaded yet
                opacity: loadedFonts.has(fontOption.url) ? 1 : 0.6,
              }}
            >
              {fontOption.name}
              {font.name === fontOption.name && (
                <Check className="h-4 w-4 text-primary" />
              )}
              {!loadedFonts.has(fontOption.url) && (
                <span className="h-4 w-4 animate-spin">⟳</span>
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

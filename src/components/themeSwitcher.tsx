"use client";
import { useTheme } from "@/providers/themeProvider";
import { useEffect, useState } from "react";
import { IconButton } from "./ui/iconButton";
import { Circle, Moon, Sun } from "lucide-react";
import { Button } from "./ui/button";

export const ColorToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const DarkLightIcon = () => {
    if (!mounted) return <Circle />;
    return theme === "dark" ? <Moon /> : <Sun />;
  };
  return (
    // tailwindcss button
    <Button
      className="flex items-center justify-center w-10 h-10 p-3 rounded-full bg-gray-200 dark:bg-gray-800 text-neutral-800 dark:text-neutral-300 cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-700"
      aria-label="button"
      onClick={() => {
        toggleTheme();
      }}
    >
      <DarkLightIcon />
    </Button>
  );
};

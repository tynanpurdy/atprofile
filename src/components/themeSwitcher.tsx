"use client";
import { useTheme } from "@/providers/themeProvider";
import { useEffect, useState } from "react";
import { IconButton } from "./ui/iconButton";
import { Circle, Moon, Sun } from "lucide-react";

export const ColorToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const DarkLightIcon = () => {
    if (!mounted) return <Circle />;
    return theme === "dark" ? <Sun /> : <Moon />;
  };
  return (
    // tailwindcss button
    <IconButton
      className="flex items-center justify-center w-10 h-10 p-3 rounded-full bg-gray-200 dark:bg-gray-800 cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-700"
      aria-label="button"
      Icon={DarkLightIcon}
      onClick={() => {
        toggleTheme();
      }}
    />
  );
};

// 1. Create a Theme Context
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type FontConfig = {
  name: string;
  category: "sans" | "serif" | "mono";
  url: string;
};

export const GOOGLE_FONTS: FontConfig[] = [
  {
    name: "Inter",
    category: "sans",
    url: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap",
  },
  {
    name: "Roboto",
    category: "sans",
    url: "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap",
  },
  {
    name: "IBM Plex Mono",
    category: "mono",
    url: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&display=swap",
  },
  {
    name: "Space Mono",
    category: "mono",
    url: "https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap",
  },
  {
    name: "DM Mono",
    category: "mono",
    url: "https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;700&display=swap",
  },
  {
    name: "Fira Mono",
    category: "mono",
    url: "https://fonts.googleapis.com/css2?family=Fira+Mono:wght@400;700&display=swap",
  },
  {
    name: "Overpass Mono",
    category: "mono",
    url: "https://fonts.googleapis.com/css2?family=Overpass+Mono:wght@400;700&display=swap",
  },
  {
    name: "Atkinson Hyperlegible Mono",
    category: "mono",
    url: "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Mono:wght@400;700&display=swap",
  },
  {
    name: "Geist Mono",
    category: "mono",
    url: "https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;700&display=swap",
  },
];

export type ThemeState = {
  theme: "light" | "dark";
  font: FontConfig;
  loadedFonts: Set<string>;
  loadFonts: (fonts: FontConfig[]) => void;
  setTheme: (theme: "light" | "dark") => void;
  setFont: (font: FontConfig) => void;
};

const ThemeContext = createContext<ThemeState>({} as ThemeState);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [font, setFont] = useState<FontConfig>(GOOGLE_FONTS[0]);
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set());

  const loadFonts = useCallback(
    (fonts: FontConfig[]) => {
      console.log("Loading multiple fonts");
      fonts.forEach((fontConfig) => {
        if (!loadedFonts.has(fontConfig.url)) {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = fontConfig.url;
          link.crossOrigin = "anonymous";
          link.dataset.font = fontConfig.name;
          document.head.appendChild(link);

          setLoadedFonts((prev) => new Set(prev).add(fontConfig.url));
        }
      });
    },
    [loadedFonts],
  );

  // Load saved theme/font from localStorage
  useEffect(() => {
    const savedTheme =
      (localStorage.getItem("theme") as "light" | "dark") || "light";
    const savedFont =
      JSON.parse(localStorage.getItem("font") || "null") || GOOGLE_FONTS[0];
    setTheme(savedTheme);
    setFont(savedFont);
  }, []);

  // Manage font loading
  useEffect(() => {
    // Remove existing font links
    const existingLinks = document.querySelectorAll("link[data-font]");
    existingLinks.forEach((link) => link.remove());

    // Create new font link
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = font.url;
    link.dataset.font = font.name;
    document.head.appendChild(link);

    setLoadedFonts(new Set(font.url));

    // Update CSS variables
    document.documentElement.style.setProperty(
      `--font-${font.category}`,
      `'${font.name}', ${font.category === "sans" ? "sans-serif" : font.category}`,
    );
    // assume we want everything to be this font
    document.documentElement.style.setProperty(
      `--font-sans`,
      `'${font.name}', sans-serif`,
    );

    if (font.category !== "mono") {
      document.documentElement.style.setProperty(`--font-mono`, `mono`);
    }

    // Save to localStorage
    localStorage.setItem("font", JSON.stringify(font));
    localStorage.setItem("theme", theme);
  }, [font, theme]);

  // Update theme class
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{ theme, font, setTheme, setFont, loadFonts, loadedFonts }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

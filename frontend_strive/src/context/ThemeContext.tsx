import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (next: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const getStoredTheme = (): Theme | null => {
  const stored = localStorage.getItem("theme");
  return stored === "dark" || stored === "light" ? stored : null;
};

const getSystemTheme = (): Theme => {
  const prefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const storedTheme = getStoredTheme();
  const [theme, setThemeState] = useState<Theme>(storedTheme ?? getSystemTheme());
  const [isManual, setIsManual] = useState<boolean>(!!storedTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    if (isManual) {
      localStorage.setItem("theme", theme);
    } else {
      localStorage.removeItem("theme");
    }
  }, [theme, isManual]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent) => {
      if (!isManual) {
        setThemeState(event.matches ? "dark" : "light");
      }
    };

    if (media.addEventListener) {
      media.addEventListener("change", handleChange);
    } else {
      media.addListener(handleChange);
    }

    return () => {
      if (media.removeEventListener) {
        media.removeEventListener("change", handleChange);
      } else {
        media.removeListener(handleChange);
      }
    };
  }, [isManual]);

  const setTheme = (next: Theme) => {
    setIsManual(true);
    setThemeState(next);
  };

  const toggleTheme = () => {
    setIsManual(true);
    setThemeState((prev) => (prev === "light" ? "dark" : "light"));
  };

  const value = useMemo(
    () => ({ theme, toggleTheme, setTheme }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};

"use client";

import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useRef,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { persistThemePreferenceAction } from "@/app/actions/profile";

type ThemeMode = "light" | "dark";

type ThemeContextValue = {
  resolvedTheme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const THEME_STORAGE_KEY = "eidesk-theme";

function applyTheme(theme: ThemeMode) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function ThemeProvider({
  children,
  initialTheme,
}: {
  children: ReactNode;
  initialTheme: string;
}) {
  const initialResolvedTheme: ThemeMode = initialTheme === "dark" ? "dark" : "light";
  const [resolvedTheme, setResolvedTheme] = useState<ThemeMode>(
    initialResolvedTheme,
  );
  const hasLoadedStoredPreference = useRef(false);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    const nextTheme: ThemeMode =
      storedTheme === "dark" || storedTheme === "light"
        ? storedTheme
        : initialResolvedTheme;

    setResolvedTheme(nextTheme);
    applyTheme(nextTheme);
    hasLoadedStoredPreference.current = true;
  }, [initialResolvedTheme]);

  useEffect(() => {
    if (!hasLoadedStoredPreference.current) {
      return;
    }

    if (window.localStorage.getItem(THEME_STORAGE_KEY)) {
      return;
    }

    setResolvedTheme(initialResolvedTheme);
    applyTheme(initialResolvedTheme);
  }, [initialResolvedTheme]);

  const setTheme = (theme: ThemeMode) => {
    setResolvedTheme(theme);
    applyTheme(theme);
    startTransition(() => {
      void persistThemePreferenceAction(theme);
    });
  };

  const value = useMemo<ThemeContextValue>(
    () => ({
      resolvedTheme,
      setTheme,
      toggleTheme: () => setTheme(resolvedTheme === "dark" ? "light" : "dark"),
    }),
    [resolvedTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme precisa ser usado dentro de ThemeProvider.");
  }

  return context;
}

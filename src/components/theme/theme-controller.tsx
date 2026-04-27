"use client";

import { useEffect } from "react";

export function ThemeController({ themePreference }: { themePreference: string }) {
  useEffect(() => {
    const isDark = themePreference === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.dataset.theme = themePreference;
    window.localStorage.setItem("eidesk-theme", themePreference);
  }, [themePreference]);

  return null;
}

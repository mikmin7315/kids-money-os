"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

type Theme = "light" | "dark" | "system";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", theme);
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "system";
    return (localStorage.getItem("monari-theme") as Theme) || "system";
  });

  useEffect(() => {
    applyTheme(theme);
  // runs once on mount to sync DOM with stored preference
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setTheme(t: Theme) {
    setThemeState(t);
    localStorage.setItem("monari-theme", t);
    applyTheme(t);
  }

  return { theme, setTheme };
}

export function ThemeToggleRow() {
  const { theme, setTheme } = useTheme();

  const options: { value: Theme; label: string; Icon: typeof Sun }[] = [
    { value: "light", label: "라이트", Icon: Sun },
    { value: "dark", label: "다크", Icon: Moon },
    { value: "system", label: "시스템", Icon: Monitor },
  ];

  return (
    <div style={{ display: "flex", gap: 8 }}>
      {options.map(({ value, label, Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              padding: "10px 8px",
              borderRadius: 14,
              border: `2px solid ${active ? "var(--monari-hero)" : "var(--monari-line)"}`,
              background: active ? "var(--monari-hero-lo)" : "var(--monari-surface)",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <Icon
              size={20}
              color={active ? "var(--monari-hero)" : "var(--monari-ink-muted)"}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: active ? "var(--monari-hero)" : "var(--monari-ink-muted)",
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

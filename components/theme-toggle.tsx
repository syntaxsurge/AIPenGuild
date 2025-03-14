"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { IconMoonFilled, IconSun } from "@tabler/icons-react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const otherTheme = resolvedTheme === "dark" ? "light" : "dark";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <button
      type="button"
      className="flex h-6 w-6 items-center justify-center rounded-md transition"
      aria-label={mounted ? `Switch to ${otherTheme} theme` : "Toggle theme"}
      onClick={() => setTheme(otherTheme)}
    >
      <IconSun className="hidden size-8 dark:block lg:size-4" />
      <IconMoonFilled className="size-8 dark:hidden lg:size-4" />
    </button>
  );
}

// src/components/ThemeToggle.tsx
"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ThemeToggleProps {
  variant?: "button" | "dropdown";
  showLabel?: boolean;
  className?: string;
}

/**
 * Theme Toggle Component
 *
 * Features:
 * - Toggle between light/dark/system themes
 * - Smooth icon transitions
 * - Dropdown or button variants
 * - Accessible
 * - Shows current theme with icon
 *
 * Usage:
 * <ThemeToggle /> // Simple button toggle
 * <ThemeToggle variant="dropdown" showLabel /> // Dropdown with labels
 */
export default function ThemeToggle({
  variant = "button",
  showLabel = false,
  className = ""
}: ThemeToggleProps) {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse ${className}`} />
    );
  }

  const currentTheme = theme === "system" ? systemTheme : theme;

  const themes = [
    { name: "light", label: "Light", icon: Sun },
    { name: "dark", label: "Dark", icon: Moon },
  ];

  const currentThemeConfig = themes.find((t) => t.name === theme);
  const Icon = currentThemeConfig?.icon || Sun;

  // Simple button toggle (cycles through themes)
  if (variant === "button") {
    const cycleTheme = () => {
      const themeOrder = ["light", "dark"];
      const currentIndex = themeOrder.indexOf(theme || "light");
      const nextIndex = (currentIndex + 1) % themeOrder.length;
      setTheme(themeOrder[nextIndex]);
    };

    return (
      <motion.button
        onClick={cycleTheme}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`
          relative p-2.5
          bg-gray-100 dark:bg-gray-800
          hover:bg-gray-200 dark:hover:bg-gray-700
          rounded-lg
          transition-colors duration-200
          ${className}
        `}
        aria-label={`Switch to ${themes[(themes.findIndex(t => t.name === theme) + 1) % 2].label} mode`}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={theme}
            initial={{ y: -20, opacity: 0, rotate: -90 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: 20, opacity: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
          >
            <Icon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </motion.div>
        </AnimatePresence>

        {showLabel && (
          <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            {currentThemeConfig?.label}
          </span>
        )}
      </motion.button>
    );
  }

  // Dropdown variant
  return (
    <div className={`relative ${className}`}>
      <motion.button
        onClick={() => setShowDropdown(!showDropdown)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="
          flex items-center gap-2 p-2.5
          bg-gray-100 dark:bg-gray-800
          hover:bg-gray-200 dark:hover:bg-gray-700
          rounded-lg
          transition-colors duration-200
        "
        aria-label="Select theme"
      >
        <Icon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        {showLabel && (
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {currentThemeConfig?.label}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {showDropdown && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowDropdown(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="
                absolute right-0 top-full mt-2 z-50
                w-40
                bg-white dark:bg-gray-800
                border border-gray-200 dark:border-gray-700
                rounded-lg shadow-xl
                overflow-hidden
              "
            >
              {themes.map((themeOption) => {
                const ThemeIcon = themeOption.icon;
                const isActive = theme === themeOption.name;

                return (
                  <button
                    key={themeOption.name}
                    onClick={() => {
                      setTheme(themeOption.name);
                      setShowDropdown(false);
                    }}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3
                      text-sm font-medium text-left
                      transition-colors duration-150
                      ${
                        isActive
                          ? "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }
                    `}
                  >
                    <ThemeIcon className="w-4 h-4" />
                    <span>{themeOption.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeTheme"
                        className="ml-auto w-2 h-2 rounded-full bg-purple-600 dark:bg-purple-400"
                      />
                    )}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

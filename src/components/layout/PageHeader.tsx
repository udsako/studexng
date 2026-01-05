// src/components/layout/PageHeader.tsx
"use client";

import { ReactNode } from "react";
import BackButton from "./BackButton";
import { motion } from "framer-motion";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backFallbackUrl?: string;
  backLabel?: string;
  rightContent?: ReactNode;
  className?: string;
}

/**
 * Reusable Page Header Component
 *
 * Features:
 * - Consistent header layout across pages
 * - Optional back button
 * - Custom right content (actions, buttons, etc.)
 * - Dark mode support
 * - Responsive design
 *
 * Usage:
 * <PageHeader
 *   title="My Account"
 *   showBack
 *   rightContent={<button>Edit</button>}
 * />
 */
export default function PageHeader({
  title,
  subtitle,
  showBack = false,
  backFallbackUrl,
  backLabel,
  rightContent,
  className = ""
}: PageHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        sticky top-0 z-30
        bg-white/95 dark:bg-gray-900/95
        backdrop-blur-lg
        border-b border-gray-200 dark:border-gray-800
        shadow-sm
        ${className}
      `}
    >
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Top Row: Back button + Actions */}
        {(showBack || rightContent) && (
          <div className="flex items-center justify-between mb-3">
            {showBack ? (
              <BackButton
                fallbackUrl={backFallbackUrl}
                label={backLabel}
              />
            ) : (
              <div />
            )}

            {rightContent && (
              <div className="flex items-center gap-2">
                {rightContent}
              </div>
            )}
          </div>
        )}

        {/* Title Row */}
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </motion.header>
  );
}

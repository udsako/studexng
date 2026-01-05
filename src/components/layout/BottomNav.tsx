// src/components/layout/BottomNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Grid3x3, ShoppingCart, Heart, User } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";

const navItems = [
  { href: "/home", icon: Home, label: "Home" },
  { href: "/categories", icon: Grid3x3, label: "Shop" },
  { href: "/cart", icon: ShoppingCart, label: "Cart" },
  { href: "/wishlist", icon: Heart, label: "Wishlist" },
  { href: "/account", icon: User, label: "Account" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // HIDE NAV on these pages
  if (
    pathname === "/" ||                    // Landing page
    pathname === "/auth" ||                // Your combined login/signup page
    pathname.startsWith("/admin")          // Admin routes
  ) {
    return null;
  }

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 50) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <motion.div
      initial={{ y: 0 }}
      animate={{ y: isVisible ? 0 : 100 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed bottom-0 left-0 right-0 w-full bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-2xl z-50"
    >
      <div className="flex justify-around items-center px-2 py-3 max-w-full">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center min-w-0 flex-1"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="flex flex-col items-center gap-1 w-full"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-purple-100/50 dark:bg-purple-900/30 rounded-xl -z-10"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}

                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    y: isActive ? -2 : 0,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 25,
                  }}
                  className="relative"
                >
                  <Icon
                    className="w-7 h-7"
                    strokeWidth={isActive ? 2.5 : 2}
                    stroke={isActive ? "#7C3AED" : "currentColor"}
                    fill={isActive ? "#7C3AED" : "none"}
                  />
                </motion.div>

                <span
                  className={`text-xs font-semibold mt-1 ${
                    isActive ? "text-purple-600 dark:text-purple-400" : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {item.label}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </div>

      {/* Center Floating Logo - Clickable to Cart */}
      <Link
        href="/cart"
        className="absolute -top-4 left-1/2 -translate-x-1/2 w-14 h-14 bg-white dark:bg-gray-800 rounded-full shadow-2xl border-4 border-white dark:border-gray-800 flex items-center justify-center"
      >
        <Image
          src="/images/logo-1.jpg"
          alt="StudEx"
          width={48}
          height={48}
          className="w-12 h-12 rounded-full object-cover"
        />
      </Link>
    </motion.div>
  );
}
// src/app/home/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Search, LogIn, UserPlus, Package, Zap, ArrowRight, Plus, Heart, Scissors, Shirt, Sparkles, CupSoda } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { useAuth } from "@/lib/authStore";
import { useCartStore } from "@/lib/cartStore";
import { useWishlistStore } from "@/lib/wishlistStore";
import { api } from "@/lib/api"; // ← Added for backend connection
import ThemeToggle from "@/components/ThemeToggle";

export default function HomePage() {
  const { isLoggedIn } = useAuth(); // Removed login/logout test button logic for cleanliness
  const addToCart = useCartStore((state) => state.addToCart);
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore();

  const [mounted, setMounted] = useState(false);
  const [toast, setToast] = useState("");
  const [categories, setCategories] = useState<any[]>([]); // CRITICAL FIX: Categories from /api/services/categories/
  const [listings, setListings] = useState<any[]>([]);     // CRITICAL FIX: Listings from /api/services/listings/
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  // CRITICAL FIX: Fetch real data from correct backend endpoints
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch categories from /api/services/categories/
        const categoriesData = await api.getCategories();
        console.log("Categories loaded:", categoriesData);
        setCategories(categoriesData || []);

        // Fetch featured/popular listings from /api/services/listings/
        const listingsData = await api.getListings();
        console.log("Listings loaded:", listingsData);
        setListings(listingsData || []);

      } catch (err: any) {
        console.error("Failed to load home data:", err);
        setError(err.message || "Failed to load data");

        // Fall back to mock data if backend not ready
        setCategories([]);
        setListings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  const fadeInUp = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5 } };
  const cardHover = { whileHover: { y: -4, scale: 1.02 }, whileTap: { scale: 0.98 } };
  const buttonHover = { whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 } };

  // Mock data fallback (in case backend not ready)
  const campusServices = [
    {
      id: 1,
      title: "Food ",
      icon: Package,
      img: "food-1.jpg",
      href: "/food",
      color: "from-orange-100 to-red-100",
      hover: "hover:border-orange-300",
    },
    {
      id: 2,
      title: "Nails ",
      icon: Sparkles,
      img: "nails-1.jpg",
      href: "/nails",
      color: "from-purple-100 to-teal-100",
      hover: "hover:border-purple-300",
    },
    {
      id: 3,
      title: "Laundry",
      icon: Shirt,
      img: "laundry-1.jpg",
      href: "/laundry",
      color: "from-blue-100 to-cyan-100",
      hover: "hover:border-blue-300",
    },
    {
      id: 4,
      title: "Lashes",
      icon: Scissors,
      img: "lashes-1.jpg",
      href: "/lashes",
      color: "from-pink-100 to-purple-100",
      hover: "hover:border-pink-300",
    },
  ];

  const foodDeals = [
    { id: 1, title: "Jollof Rice + Chicken", oldPrice: 1800, newPrice: 1200, img: "deal-food-1.jpg", time: "15 mins" },
    { id: 2, title: "Shawarma Wrap", oldPrice: 1500, newPrice: 1000, img: "deal-food-2.jpg", time: "12 mins" },
    { id: 3, title: "Indomie + Egg", oldPrice: 800, newPrice: 500, img: "deal-food-3.jpg", time: "10 mins" },
  ];

  // DESIGN 3.0: Premium loading state with cream background
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] dark:bg-gray-950 flex flex-col items-center justify-center gap-6 relative overflow-hidden">
        {/* Subtle pattern */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0l5 15h16l-13 9 5 15-13-9-13 9 5-15-13-9h16z' fill='%237C3AED' fill-opacity='0.4'/%3E%3C/svg%3E")`,
        }} />

        <motion.div
          className="relative"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <div className="w-24 h-24 border-6 border-transparent bg-gradient-to-r from-teal-500 to-purple-600 rounded-full" style={{
            WebkitMaskImage: 'linear-gradient(transparent 40%, black 60%)',
            maskImage: 'linear-gradient(transparent 40%, black 60%)'
          }}></div>
        </motion.div>
        <motion.p
          className="bg-gradient-to-r from-teal-600 to-purple-600 bg-clip-text text-transparent font-black text-xl"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Loading StudEx... ✨
        </motion.p>
      </div>
    );
  }

  return (
    <>
      {/* TOAST */}
      {toast && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 60, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className={`fixed top-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-lg z-50 font-medium text-sm text-white ${
            toast.includes("Wishlist") ? "bg-red-500" : "bg-green-500"
          }`}
        >
          {toast}
        </motion.div>
      )}

      {/* TOP BAR - DESIGN 3.0 */}
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg z-40 border-b border-purple-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <Link href="/home" className="flex items-center gap-3">
            <Image
              src="/images/logo-1.jpg"
              alt="StudEx"
              width={48}
              height={48}
              className="w-12 h-12 rounded-full object-cover shadow-lg"
            />
            <span className="font-black text-2xl bg-gradient-to-r from-teal-600 to-purple-600 bg-clip-text text-transparent">StudEx</span>
          </Link>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative">
                <input
                  type="text"
                  placeholder="Search anything..."
                  className="pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-full text-sm w-48 focus:outline-none focus:ring-2 focus:ring-purple-400 border-2 border-purple-100 dark:border-gray-700 transition-all duration-300 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                />
                <Search className="w-5 h-5 absolute left-3 top-3 text-purple-600 dark:text-purple-400" />
              </motion.div>
            ) : (
              <div className="flex gap-3">
                <Link href="/auth">
                  <motion.button {...buttonHover} className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-purple-600 text-white rounded-full text-sm font-bold hover:shadow-lg transition-all shadow-md">
                    <LogIn className="w-4 h-4 text-white" /> Login
                  </motion.button>
                </Link>
                <Link href="/auth">
                  <motion.button {...buttonHover} className="flex items-center gap-1.5 px-5 py-2.5 bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 rounded-full text-sm font-bold border-2 border-purple-200 dark:border-gray-700 hover:border-teal-300 dark:hover:border-teal-500 transition-all shadow hover:shadow-lg">
                    <UserPlus className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Sign Up
                  </motion.button>
                </Link>
              </div>
            )}
            <ThemeToggle />
          </div>
        </div>
      </motion.div>

      {/* MAIN CONTENT - DESIGN 3.0 */}
      <div className="min-h-screen bg-[#FFF8F0] dark:bg-gray-950 relative">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10 pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M15 0l3 9h9l-7 5 3 9-8-6-8 6 3-9-7-5h9z' fill='%237C3AED' fill-opacity='0.3'/%3E%3C/svg%3E")`,
          backgroundSize: '50px 50px'
        }} />

        <div className="relative p-4 space-y-6 pb-24">
          {/* HERO - Enhanced */}
          <motion.div {...fadeInUp}>
            <Link href="/categories">
              <motion.div
                {...cardHover}
                className="relative rounded-3xl p-8 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 cursor-pointer overflow-hidden h-56 bg-gradient-to-br from-teal-500 via-purple-600 to-pink-500"
              >
                {/* Animated gradient overlay */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-pink-400/20 to-purple-400/20"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                />

                {/* Campus icons floating */}
                <div className="absolute top-4 right-4 text-4xl opacity-30">🎓</div>
                <div className="absolute bottom-4 left-4 text-3xl opacity-20">📚</div>
                <div className="absolute top-1/2 right-1/4 text-2xl opacity-25">✨</div>

                <div className="relative z-10 h-full flex flex-col justify-end">
                  <motion.h2 initial={{ x: -20 }} whileInView={{ x: 0 }} className="text-3xl font-black drop-shadow-2xl">
                    🎯 The Student Marketplace
                  </motion.h2>
                  <motion.p initial={{ x: -20 }} whileInView={{ x: 0 }} transition={{ delay: 0.1 }} className="text-base mt-2 text-white/95 drop-shadow-xl font-medium">
                    Everything you need, one tap away ⚡
                  </motion.p>
                  <motion.button
                    {...buttonHover}
                    className="mt-5 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-8 py-3 rounded-full font-black shadow-2xl hover:shadow-3xl transition-all inline-flex items-center gap-2 w-fit text-base border-2 border-white/60"
                  >
                    <Package className="w-5 h-5 text-white" /> Explore Services
                  </motion.button>
                </div>
              </motion.div>
            </Link>
          </motion.div>

        {/* CRITICAL FIX: Error display */}
        {error && (
          <motion.div {...fadeInUp} className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
            <p className="text-red-600 dark:text-red-400 font-medium mb-2">Failed to load data</p>
            <p className="text-red-500 dark:text-red-300 text-sm">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-red-600 dark:bg-red-700 text-white rounded-full font-medium hover:bg-red-700 dark:hover:bg-red-600 transition"
            >
              Retry
            </button>
          </motion.div>
        )}

        {/* CRITICAL FIX: CATEGORIES - Now from /api/services/categories/ */}
        <motion.div {...fadeInUp}>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500 dark:text-yellow-400 animate-pulse" />
            Browse Categories
          </h3>
          <div className="flex space-x-3 overflow-x-auto hide-scrollbar pb-2">
            {categories.length === 0 && !error ? (
              <p className="text-gray-500 dark:text-gray-400">No categories available yet</p>
            ) : (
              categories.map((category, i) => (
                <motion.div key={category.id} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} className="min-w-[140px]">
                  <Link href={`/categories/${category.slug}`}>
                    <motion.div {...cardHover} className="bg-gradient-to-br from-purple-100 to-teal-100 dark:from-purple-900/30 dark:to-teal-900/30 p-4 rounded-xl text-center shadow-md border border-transparent hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-300 cursor-pointer">
                      <div className="relative w-full h-28 rounded-xl overflow-hidden mb-2">
                        <Image
                          src={category.image || `/images/placeholder.jpg`}
                          alt={category.title}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white line-clamp-2">{category.title}</p>
                    </motion.div>
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* SEE MORE CATEGORIES */}
        <motion.div {...fadeInUp} className="flex justify-center">
          <Link href="/categories">
            <motion.button whileHover={{ x: 4 }} className="flex items-center gap-2 text-gray-900 dark:text-gray-300 font-medium text-sm hover:underline">
              See More Categories <ArrowRight className="w-4 h-4 text-gray-900 dark:text-gray-300" />
            </motion.button>
          </Link>
        </motion.div>

        {/* CRITICAL FIX: FEATURED LISTINGS - Now from /api/services/listings/ */}
        <motion.div {...fadeInUp}>
          <div className="flex justify-between items-center mb-3">
            <motion.h3 initial={{ x: -20 }} whileInView={{ x: 0 }} className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                <Zap className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
              </motion.div>
              Popular Services
            </motion.h3>
            <Link href="/browse" className="text-gray-900 dark:text-gray-300 text-sm font-medium hover:underline">
              See All
            </Link>
          </div>

          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="flex space-x-3 overflow-x-auto hide-scrollbar pb-2">
            {listings.length === 0 && !error ? (
              <p className="text-gray-500 dark:text-gray-400">No listings available yet</p>
            ) : (
              listings.slice(0, 6).map((listing, i) => (
                <motion.div key={listing.id} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}>
                  <Link href={`/listings/${listing.id}`}>
                    <motion.div {...cardHover} className="bg-white dark:bg-gray-800 p-4 rounded-xl min-w-[160px] hover:shadow-md transition-all duration-300 cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 relative">
                      <div className="relative w-full h-32 rounded-xl overflow-hidden mb-2">
                        <Image
                          src={listing.image || `/images/placeholder.jpg`}
                          alt={listing.title}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      {listing.vendor_is_verified && (
                        <div className="absolute top-2 left-2 bg-green-500 dark:bg-green-600 text-white text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1">
                          ✓ Verified
                        </div>
                      )}

                      <motion.button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const item = { id: listing.id, title: listing.title, price: listing.price, img: listing.image };
                          if (mounted && isInWishlist(listing.id)) {
                            removeFromWishlist(listing.id);
                            showToast("Removed from Wishlist!");
                          } else {
                            addToWishlist(item);
                            showToast("Added to Wishlist!");
                          }
                        }}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        className="absolute top-2 right-2 p-1.5 bg-white dark:bg-gray-700 rounded-full shadow"
                      >
                        <Heart className={`w-4 h-4 transition-all ${mounted && isInWishlist(listing.id) ? "fill-red-500 text-red-500" : "text-gray-400 dark:text-gray-500"}`} />
                      </motion.button>

                      <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 mb-1">{listing.title}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 mb-2">by @{listing.vendor}</p>
                      <p className="text-lg font-black text-purple-600 dark:text-purple-400">₦{Number(listing.price).toLocaleString()}</p>
                    </motion.div>
                  </Link>
                </motion.div>
              ))
            )}
          </motion.div>
        </motion.div>
        </div>
      </div>
    </>
  );
}
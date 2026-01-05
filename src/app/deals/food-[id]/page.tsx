// src/app/deals/food-[id]/page.tsx
"use client";

import { Heart, Package, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";

const foodDeals = {
  1: {
    id: 1,
    title: "Jollof Rice + Chicken",
    oldPrice: 1800,
    newPrice: 1200,
    image: "/images/deal-food-1.jpg",
    description: "Spicy jollof rice with grilled chicken, plantain, and coleslaw.",
    vendor: "Mama T's Kitchen",
    rating: 4.8,
    reviews: 124,
    deliveryTime: "15 mins",
  },
  2: {
    id: 2,
    title: "Shawarma Wrap",
    oldPrice: 1500,
    newPrice: 1000,
    image: "/images/deal-food-2.jpg",
    description: "Beef shawarma in soft wrap with garlic sauce, fries inside.",
    vendor: "Shawarma King",
    rating: 4.6,
    reviews: 89,
    deliveryTime: "12 mins",
  },
  3: {
    id: 3,
    title: "Indomie + Egg",
    oldPrice: 800,
    newPrice: 500,
    image: "/images/deal-food-3.jpg",
    description: "Double pack Indomie, 2 eggs, pepper, onions. Campus classic.",
    vendor: "Hostel Bites",
    rating: 4.9,
    reviews: 201,
    deliveryTime: "10 mins",
  },
};

export default function DealPage() {
  const { id } = useParams();
  const dealId = parseInt(id as string);
  const deal = foodDeals[dealId as keyof typeof foodDeals];

  // Wishlist state
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("studex-wishlist");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const wishlistArray = Array.isArray(parsed) ? parsed : [];
        setWishlist(wishlistArray);
        setIsLiked(wishlistArray.some((w: any) => w.id === dealId));
      } catch (e) {
        setWishlist([]);
      }
    }
  }, [dealId]);

  const toggleWishlist = () => {
    const newWishlist = isLiked
      ? wishlist.filter((w: any) => w.id !== dealId)
      : [...wishlist, { id: dealId, ...deal }];

    setWishlist(newWishlist);
    setIsLiked(!isLiked);
    localStorage.setItem("studex-wishlist", JSON.stringify(newWishlist));
  };

  if (!deal) {
    return (
      <div className="p-8 text-center">
        <p className="text-black text-lg">Deal not found</p>
        <Link href="/" className="text-primary text-sm mt-2 inline-block">
          ← Back to Home
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Top Bar */}
      <div className="sticky top-0 bg-white z-40 border-b shadow-sm">
        <div className="flex items-center justify-between p-4">
          <Link href="/" className="text-black">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-bold text-black">Deal</h1>
          <div />
        </div>
      </div>

      <div className="p-4 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface rounded-2xl overflow-hidden"
        >
          <div className="relative h-64">
            <Image
              src={deal.image}
              alt={deal.title}
              fill
              className="object-cover"
            />
            <motion.button
              onClick={toggleWishlist}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg"
            >
              <Heart
                className={`w-5 h-5 transition-all ${
                  isLiked ? "fill-red-500 text-red-500" : "text-primary"
                }`}
              />
            </motion.button>
          </div>

          <div className="p-5 space-y-4">
            <div>
              <h2 className="text-xl font-bold text-black">{deal.title}</h2>
              <p className="text-sm text-black/70 mt-1">{deal.vendor}</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <span className="text-yellow-500">★★★★★</span>
                <span className="text-sm text-black ml-1">{deal.rating}</span>
              </div>
              <span className="text-xs text-black/60">({deal.reviews} reviews)</span>
            </div>

            <p className="text-black/80">{deal.description}</p>

            <div className="flex items-center gap-2 text-sm">
              <Package className="w-4 h-4 text-primary" />
              <span className="text-black">Delivery in {deal.deliveryTime}</span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-black/60 line-through">
                  ₦{deal.oldPrice.toLocaleString()}
                </p>
                <p className="text-2xl font-bold text-red-500">
                  ₦{deal.newPrice.toLocaleString()}
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-primary text-white px-8 py-3 rounded-full font-bold shadow-lg"
              >
                Add to Cart
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t z-50 shadow-lg">
        <div className="flex justify-around py-2">
          <Link href="/" className="text-black/60">
            <span className="text-xs">Home</span>
          </Link>
          <Link href="/categories" className="text-black/60">
            <span className="text-xs">Categories</span>
          </Link>
          <Link href="/cart" className="text-black/60">
            <span className="text-xs">Cart</span>
          </Link>
          <Link href="/wishlist" className="text-black/60">
            <span className="text-xs">Wishlist</span>
          </Link>
          <Link href="/account" className="text-black/60">
            <span className="text-xs">Account</span>
          </Link>
        </div>
      </div>
    </>
  );
}
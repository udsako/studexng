// src/app/category/[slug]/page.tsx - Dynamic category page with API integration
"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Search, ChevronLeft, Sparkles, Loader, AlertCircle,
  Star, MapPin, ShoppingCart
} from "lucide-react";
import { useState, useEffect } from "react";
import { useCartStore } from "@/lib/cartStore";

interface Listing {
  id: number;
  title: string;
  description: string;
  price: number;
  image: string;
  vendor: {
    id: number;
    username: string;
    business_name?: string;
  };
  category: {
    id: number;
    title: string;
  };
  is_available: boolean;
}

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { addItem } = useCartStore();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Format category name for display
  const categoryName = slug.split('-').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
        const token = localStorage.getItem('access_token');

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        // Add auth header if available (some endpoints may not require auth)
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(
          `${API_URL}/api/services/listings/?category=${slug}`,
          { headers }
        );

        if (!res.ok) {
          throw new Error('Failed to fetch listings');
        }

        const data = await res.json();
        setListings(data.results || data);
      } catch (err) {
        console.error('Failed to fetch listings:', err);
        setError('Failed to load listings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [slug]);

  // Filter listings based on search
  const filteredListings = listings.filter(listing =>
    listing.title.toLowerCase().includes(search.toLowerCase()) ||
    listing.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddToCart = (listing: Listing) => {
    addItem({
      id: listing.id,
      title: listing.title,
      price: listing.price,
      quantity: 1,
      image: listing.image,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-teal-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader className="w-16 h-16 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-xl font-bold text-gray-700">Loading {categoryName}...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-teal-50 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 shadow-2xl text-center max-w-md"
        >
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-gray-900 mb-2">Oops!</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-teal-600 text-white font-bold rounded-full"
          >
            Go Back
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      {/* TOP BAR */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-2xl z-50 border-b">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => router.back()}
            className="p-3 hover:bg-purple-100 rounded-full transition active:scale-95"
          >
            <ChevronLeft className="w-8 h-8 text-purple-700" />
          </button>
          <Link href="/" className="relative w-32 h-12">
            <Image src="/images/logo-1.jpg" alt="StudEx" fill className="object-contain" priority />
          </Link>
          <div className="w-12" />
        </div>

        <h1 className="text-center text-4xl font-black bg-gradient-to-r from-purple-600 to-teal-600 bg-clip-text text-transparent pb-4">
          {categoryName}
        </h1>

        {/* SEARCH */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-5 top-4 w-6 h-6 text-gray-500" />
            <input
              type="text"
              placeholder={`Search ${categoryName.toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-gradient-to-r from-purple-50 to-teal-50 rounded-full focus:outline-none focus:ring-4 focus:ring-purple-300 text-lg font-medium placeholder-gray-500 transition-all"
            />
            <Sparkles className="absolute right-5 top-4 w-7 h-7 text-purple-600 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="pb-32 px-6 pt-8 bg-gradient-to-br from-purple-50 via-pink-50 to-teal-50 min-h-screen">
        {filteredListings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <Sparkles className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-gray-700 mb-2">
              {search ? "No results found" : `No ${categoryName.toLowerCase()} available yet`}
            </h2>
            <p className="text-gray-600">
              {search ? "Try a different search term" : "Check back soon for new listings!"}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing, i) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -8 }}
                className="bg-white rounded-3xl shadow-xl overflow-hidden border-2 border-purple-100"
              >
                {/* Image */}
                <div className="relative h-56">
                  {listing.image ? (
                    <Image
                      src={listing.image.startsWith('http') ? listing.image : `/images/${listing.image}`}
                      alt={listing.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-200 to-teal-200 flex items-center justify-center">
                      <Sparkles className="w-16 h-16 text-purple-600/50" />
                    </div>
                  )}
                  {!listing.is_available && (
                    <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg">
                      UNAVAILABLE
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 text-white">
                    <p className="text-xl font-black drop-shadow-lg line-clamp-1">{listing.title}</p>
                    <p className="text-sm opacity-90 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {listing.vendor.business_name || listing.vendor.username}
                    </p>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4">
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{listing.description}</p>

                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-3xl font-black bg-gradient-to-r from-purple-600 to-teal-600 bg-clip-text text-transparent">
                        ₦{listing.price.toLocaleString()}
                      </p>
                    </div>

                    {listing.is_available && (
                      <button
                        onClick={() => handleAddToCart(listing)}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-teal-600 text-white font-bold rounded-full shadow-lg hover:shadow-xl transition flex items-center gap-2"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Add
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* BOTTOM NAV */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t z-50 shadow-2xl">
        <div className="flex justify-around py-3">
          <Link href="/home" className="text-gray-500 text-xs">Home</Link>
          <Link href="/categories" className="text-gray-500 text-xs">Services</Link>
          <div className="text-purple-600 font-black text-sm flex items-center gap-2">
            {categoryName}
          </div>
          <Link href="/cart" className="text-gray-500 text-xs">Cart</Link>
          <Link href="/account" className="text-gray-500 text-xs">Account</Link>
        </div>
      </div>
    </>
  );
}

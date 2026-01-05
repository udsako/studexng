// src/app/seller/listings/page.tsx
"use client";

import { Package, ChevronLeft, Trash2, Pencil, AlertCircle, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { useAuth } from "@/lib/authStore";

interface Listing {
  id: number;
  title: string;
  description: string;
  price: number;
  image: string | null;
  is_available: boolean;
  created_at: string;
}

export default function SellerListings() {
  const [products, setProducts] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  const { user: authUser } = useAuth();

  // Fetch real listings from backend
  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      router.push("/auth");
      return;
    }

    const fetchListings = async () => {

      if (!accessToken) {
        setError("Please log in to view your listings");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("http://127.0.0.1:8000/api/listings/", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!res.ok) {
          if (res.status === 401) {
            setError("Session expired. Please log in again.");
            setTimeout(() => router.push("/auth"), 2000);
            return;
          }
          console.error("Listings API error:", res.status);
          throw new Error("Failed to load listings");
        }

        const data = await res.json();
        
        // Handle both array and paginated responses
        const listingsList = Array.isArray(data) ? data : data.results || [];
        console.log("Listings loaded:", listingsList);
        setProducts(listingsList);
      } catch (err) {
        console.error("Listings fetch error:", err);
        setError("Failed to load your listings. Try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [router]);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this product? This cannot be undone.")) return;

    const accessToken = localStorage.getItem("accessToken");

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/listings/${id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (res.ok) {
        setProducts(products.filter((p) => p.id !== id));
      } else {
        alert("Failed to delete. You can only delete your own listings.");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Network error. Try again.");
    }
  };

  const fadeInUp = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5 } };
  const cardHover = { whileHover: { y: -4, scale: 1.02 }, whileTap: { scale: 0.98 } };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-teal-50">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
          <Package className="w-16 h-16 text-purple-600" />
        </motion.div>
      </div>
    );
  }

  return (
    <>
      {/* TOP BAR */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 bg-white/80 backdrop-blur-xl z-40 border-b border-white/20 shadow-sm"
      >
        <div className="flex items-center justify-between p-4">
          <Link href="/seller">
            <ChevronLeft className="w-7 h-7 text-purple-600" />
          </Link>
          <Link href="/" className="flex items-center">
            <Image
              src="/images/logo-1.jpg"
              alt="StudEx Logo"
              width={160}
              height={50}
              className="h-11 w-auto object-contain"
              priority
            />
          </Link>
          <h1 className="text-xl font-black bg-gradient-to-r from-purple-600 to-teal-500 bg-clip-text text-transparent">
            My Listings
          </h1>
        </div>
      </motion.div>

      <div className="p-4 pb-32">
        {error ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-16 text-center"
          >
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-medium">{error}</p>
          </motion.div>
        ) : products.length === 0 ? (
          /* EMPTY STATE */
          <motion.div
            {...fadeInUp}
            className="mt-16 text-center"
          >
            <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-teal-100 rounded-full flex items-center justify-center">
              <Package className="w-16 h-16 text-purple-600" />
            </div>
            <h2 className="text-xl font-black text-gray-800 mb-2">No Products Yet</h2>
            <p className="text-sm text-gray-600 mb-6">Start selling and earn on campus!</p>
            <Link href="/seller/add">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-purple-600 to-teal-500 text-white px-8 py-4 rounded-full font-bold shadow-xl flex items-center gap-2 mx-auto"
              >
                <Plus className="w-5 h-5" />
                Add First Product
              </motion.button>
            </Link>
          </motion.div>
        ) : (
          /* LISTINGS */
          <motion.div {...fadeInUp} className="space-y-4">
            {products.map((p: Listing, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Link href={`/seller/listings/${p.id}`}>
                  <motion.div
                    {...cardHover}
                    className="bg-white/70 backdrop-blur-md rounded-2xl p-5 flex justify-between items-center shadow-sm border border-white/30 hover:shadow-xl transition-all"
                  >
                    <div className="flex items-center gap-4">
                      {p.image ? (
                        <Image
                          src={p.image}
                          alt={p.title}
                          width={80}
                          height={80}
                          className="w-20 h-20 object-cover rounded-xl shadow-md"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-teal-100 rounded-xl flex items-center justify-center">
                          <Package className="w-10 h-10 text-purple-600" />
                        </div>
                      )}
                      <div>
                        <p className="text-lg font-bold text-gray-800 line-clamp-1">{p.title}</p>
                        <p className="text-base font-black bg-gradient-to-r from-purple-600 to-teal-500 bg-clip-text text-transparent">
                          ₦{parseFloat(String(p.price)).toLocaleString()}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            p.is_available 
                              ? "bg-emerald-100 text-emerald-800" 
                              : "bg-gray-100 text-gray-600"
                          }`}>
                            {p.is_available ? "Active" : "Unavailable"}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(p.created_at).toLocaleDateString("en-GB")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Link href={`/seller/edit/${p.id}`}>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-2.5 bg-purple-100 rounded-xl hover:bg-purple-200 transition-colors"
                        >
                          <Pencil className="w-5 h-5 text-purple-600" />
                        </motion.button>
                      </Link>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDelete(p.id)}
                        className="p-2.5 bg-red-100 rounded-xl hover:bg-red-200 transition-colors"
                      >
                        <Trash2 className="w-5 h-5 text-red-600" />
                      </motion.button>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* FLOATING ADD BUTTON */}
      {products.length > 0 && (
        <Link href="/seller/add">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="fixed bottom-20 right-4 bg-gradient-to-r from-purple-600 to-teal-500 text-white p-4 rounded-full shadow-2xl z-40"
          >
            <Plus className="w-7 h-7" />
          </motion.button>
        </Link>
      )}

      {/* BOTTOM NAV */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-white/20 z-50 shadow-2xl"
      >
        <div className="flex justify-around py-3">
          <Link href="/" className="text-gray-500"><span className="text-xs">Home</span></Link>
          <Link href="/categories" className="text-gray-500"><span className="text-xs">Shop</span></Link>
          <Link href="/cart" className="text-gray-500"><span className="text-xs">Cart</span></Link>
          <Link href="/seller" className="text-teal-600 font-black"><span className="text-xs">Seller</span></Link>
        </div>
      </motion.div>
    </>
  );
}
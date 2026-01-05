// src/app/seller/orders/page.tsx
"use client";

import { Package, Clock, CheckCircle, ChevronLeft, Calendar, MapPin, User, DollarSign } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/authStore";

interface Order {
  id: number;
  reference: string;
  buyer: {
    username: string;
  };
  amount: number;
  created_at: string;
  status: "pending_confirmation" | "completed" | "disputed" | "refunded" | "paid" | "seller_completed";
  type: "service" | "food";
  service_details?: {
    service_name: string;
    date: string;
    time: string;
    location: string;
  };
  food_items?: Array<{
    title: string;
    quantity: number;
  }>;
}

export default function SellerOrdersPage() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      router.push("/auth");
      return;
    }

    const fetchOrders = async () => {

      if (!accessToken) {
        setError("Please log in to view orders");
        setLoading(false);
        return;
      }

      try {
        console.log("Fetching orders with token:", accessToken?.substring(0, 20) + "...");
        
        const res = await fetch("http://127.0.0.1:8000/api/orders/pending/", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        console.log("Response received:", {
          ok: res.ok,
          status: res.status,
          statusText: res.statusText,
          contentType: res.headers.get('content-type')
        });

        if (!res.ok) {
          if (res.status === 401) {
            setError("Session expired. Redirecting...");
            setTimeout(() => router.push("/auth"), 2000);
            return;
          }
          if (res.status === 404) {
            setError("Endpoint not found (404). Make sure you updated orders/views.py with the pending action.");
          } else if (res.status === 500) {
            setError("Backend error (500). Check your Django console for errors.");
          } else {
            setError(`API Error ${res.status}: ${res.statusText}`);
          }
          setLoading(false);
          return;
        }

        const data = await res.json();
        console.log("Orders data received:", data);
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Orders fetch error:", err);
        setError(err instanceof Error ? err.message : "Failed to load orders. Try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [router]);

  const pendingCount = orders.length;
  const completedToday = 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-teal-50">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
          <Clock className="w-16 h-16 text-purple-600" />
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
        className="sticky top-0 bg-white/90 backdrop-blur-xl z-40 border-b border-purple-100 shadow-sm"
      >
        <div className="flex items-center justify-between p-4 max-w-4xl mx-auto">
          <Link href="/seller">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 hover:bg-purple-100 rounded-full transition"
            >
              <ChevronLeft className="w-6 h-6 text-purple-600" />
            </motion.button>
          </Link>
          <h1 className="text-xl font-black bg-gradient-to-r from-purple-600 to-teal-500 bg-clip-text text-transparent">
            Pending Orders
          </h1>
          <Link href="/seller/orders/history">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full text-xs font-bold shadow-lg hover:shadow-xl transition-all"
            >
              History
            </motion.button>
          </Link>
        </div>
      </motion.div>

      <div className="p-4 pb-32 space-y-6 max-w-4xl mx-auto">
        {/* STATS CARDS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-4"
        >
          <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl p-6 border-2 border-amber-300">
            <p className="text-sm text-amber-800 font-semibold">Pending Confirmation</p>
            <p className="text-4xl font-black text-amber-700 mt-2">{pendingCount}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl p-6 border-2 border-emerald-300">
            <p className="text-sm text-emerald-800 font-semibold">Completed Today</p>
            <p className="text-4xl font-black text-emerald-700 mt-2">{completedToday}</p>
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-red-600 font-medium bg-red-50 p-4 rounded-lg"
          >
            {error}
          </motion.div>
        )}

        {orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Package className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-semibold text-lg">No Pending Orders</p>
            <p className="text-gray-500 text-sm mt-2">You're all caught up! New orders will appear here.</p>
            <Link href="/seller">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="mt-6 px-8 py-3 bg-gradient-to-r from-purple-600 to-teal-500 text-white font-bold rounded-xl"
              >
                Back to Dashboard
              </motion.button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-all"
              >
                <Link href={`/seller/orders/${order.id}`}>
                  <div className="cursor-pointer">
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 border-b border-amber-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-black text-gray-900">#{order.reference}</p>
                          <p className="text-xs text-gray-600">
                            {new Date(order.created_at).toLocaleDateString("en-GB")}
                          </p>
                        </div>
                        <div className="px-3 py-1.5 rounded-full bg-amber-200 text-amber-800 font-bold text-xs flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Pending
                        </div>
                      </div>
                    </div>

                    <div className="p-5 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{order.buyer.username}</p>
                          <p className="text-sm text-gray-600">Buyer</p>
                        </div>
                      </div>

                      {order.type === "service" && order.service_details && (
                        <div className="bg-purple-50 rounded-xl p-4 space-y-2">
                          <p className="font-bold text-gray-900">{order.service_details.service_name}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Calendar className="w-4 h-4" />
                            {order.service_details.date} at {order.service_details.time}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <MapPin className="w-4 h-4" />
                            {order.service_details.location}
                          </div>
                        </div>
                      )}

                      {order.type === "food" && order.food_items && (
                        <div className="bg-purple-50 rounded-xl p-4">
                          <p className="font-bold text-gray-900 mb-2">Food Order:</p>
                          <div className="space-y-1">
                            {order.food_items.slice(0, 2).map((item, i) => (
                              <p key={i} className="text-sm text-gray-700">
                                {item.title} ×{item.quantity}
                              </p>
                            ))}
                            {order.food_items.length > 2 && (
                              <p className="text-sm text-gray-700">
                                +{order.food_items.length - 2} more items
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                        <span className="font-semibold text-gray-700 flex items-center gap-2">
                          <DollarSign className="w-5 h-5" />
                          Order Amount
                        </span>
                        <span className="text-2xl font-black text-purple-600">
                          ₦{order.amount.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-100 to-teal-100 px-5 py-3 border-t border-purple-200">
                      <p className="text-sm font-semibold text-purple-800 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Tap to mark as complete
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* BOTTOM NAV */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200 z-50 shadow-2xl"
      >
        <div className="flex justify-around py-3 max-w-4xl mx-auto w-full">
          <Link href="/" className="text-gray-500 hover:text-purple-600 transition">
            <span className="text-xs font-semibold">Home</span>
          </Link>
          <Link href="/categories" className="text-gray-500 hover:text-purple-600 transition">
            <span className="text-xs font-semibold">Services</span>
          </Link>
          <Link href="/cart" className="text-gray-500 hover:text-purple-600 transition">
            <span className="text-xs font-semibold">Cart</span>
          </Link>
          <Link href="/seller" className="text-purple-600 font-bold transition">
            <span className="text-xs">Seller</span>
          </Link>
        </div>
      </motion.div>
    </>
  );
}
// src/app/account/orders/page.tsx
"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, CheckCircle, Clock, ChevronLeft, MapPin, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/authStore";

interface OrderItem {
  title: string;
  qty: number;
  price: number;
  img?: string;
}

interface Order {
  id: number;
  reference: string;
  buyer: {
    username: string;
  };
  listing: {
    title: string;
    vendor: {
      username: string;
    };
  };
  amount: number;
  created_at: string;
  status: "pending" | "paid" | "seller_completed" | "completed" | "disputed" | "cancelled";
  type?: "service" | "food";
  service_details?: {
    service_name: string;
    date: string;
    time: string;
    location: string;
  };
  food_items?: OrderItem[];
}

export default function OrdersPage() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authUser) {
      router.push("/auth");
      return;
    }

    const fetchOrders = async () => {
      const accessToken = localStorage.getItem("accessToken");

      if (!accessToken) {
        setError("Please log in to view orders");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("http://127.0.0.1:8000/api/orders/", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!res.ok) {
          if (res.status === 401) {
            setError("Session expired. Redirecting...");
            setTimeout(() => router.push("/auth"), 2000);
            return;
          }
          throw new Error(`Failed to load orders: ${res.status}`);
        }

        const data = await res.json();
        console.log("Orders loaded:", data);
        
        // Handle both array and paginated responses
        const ordersList = Array.isArray(data) ? data : data.results || [];
        setOrders(ordersList);
      } catch (err) {
        console.error("Orders fetch error:", err);
        setError("Failed to load orders. Try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [authUser, router]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-gray-100 text-gray-600";
      case "paid": return "bg-amber-100 text-amber-600";
      case "seller_completed": return "bg-blue-100 text-blue-600";
      case "completed": return "bg-emerald-100 text-emerald-600";
      case "disputed": return "bg-red-100 text-red-600";
      case "cancelled": return "bg-gray-100 text-gray-600";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
      case "paid": return <Clock className="w-5 h-5" />;
      case "seller_completed": return <Clock className="w-5 h-5" />;
      case "completed": return <CheckCircle className="w-5 h-5" />;
      case "disputed": return <AlertCircle className="w-5 h-5" />;
      case "cancelled": return <AlertCircle className="w-5 h-5" />;
      default: return <Package className="w-5 h-5" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "Pending Payment";
      case "paid": return "In Escrow";
      case "seller_completed": return "Seller Completed";
      case "completed": return "Completed";
      case "disputed": return "Disputed";
      case "cancelled": return "Cancelled";
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-teal-50">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
          <Clock className="w-12 h-12 text-purple-600" />
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
          <Link href="/account">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 hover:bg-purple-100 rounded-full transition"
            >
              <ChevronLeft className="w-6 h-6 text-purple-600" />
            </motion.button>
          </Link>
          <h1 className="text-xl font-black bg-gradient-to-r from-purple-600 to-teal-500 bg-clip-text text-transparent">
            My Orders
          </h1>
          <div className="w-10" />
        </div>
      </motion.div>

      <div className="p-4 pb-32 space-y-4 max-w-4xl mx-auto">
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <Package className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No orders yet</p>
            <p className="text-gray-400 text-sm mt-2">Book a service or order food to get started</p>
            <Link href="/home">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="mt-6 px-8 py-3 bg-gradient-to-r from-purple-600 to-teal-500 text-white rounded-full font-black"
              >
                Start Exploring
              </motion.button>
            </Link>
          </motion.div>
        ) : (
          orders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-all"
            >
              <Link href={`/account/orders/${order.id}`}>
                <div className="cursor-pointer">
                  {/* HEADER */}
                  <div className="bg-gradient-to-r from-purple-50 to-teal-50 p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-black text-gray-800">#{order.reference}</p>
                        <p className="text-xs text-gray-600">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div
                        className={`px-3 py-1.5 rounded-full font-bold text-xs flex items-center gap-2 ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {getStatusIcon(order.status)}
                        <span>{getStatusLabel(order.status)}</span>
                      </div>
                    </div>
                  </div>

                  {/* ORDER INFO */}
                  <div className="p-4 space-y-3">
                    <div>
                      <p className="font-bold text-gray-800">{order.listing.title}</p>
                      <p className="text-sm text-gray-600">{order.listing.vendor.username}</p>
                    </div>

                    {order.service_details && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>
                          {order.service_details.date} at {order.service_details.time}
                        </span>
                      </div>
                    )}

                    {order.food_items && (
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {order.food_items.slice(0, 3).map((item, i) => (
                          <div
                            key={i}
                            className="text-xs bg-gray-100 px-3 py-1 rounded-full whitespace-nowrap"
                          >
                            {item.title} ×{item.qty}
                          </div>
                        ))}
                        {order.food_items.length > 3 && (
                          <div className="text-xs bg-gray-100 px-3 py-1 rounded-full">
                            +{order.food_items.length - 3} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* AMOUNT */}
                  <div className="bg-gray-50 px-4 py-3 border-t">
                    <p className="font-black text-xl text-purple-600">
                      ₦{parseFloat(String(order.amount)).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Link>

              {/* ESCROW INFO - Show for paid/seller_completed status */}
              {(order.status === "paid" || order.status === "seller_completed") && (
                <div className="px-4 py-2 bg-amber-50 border-t border-amber-200">
                  <p className="text-xs text-amber-800">
                    <span className="font-bold">⏳ In Escrow:</span> Payment is held safely.{" "}
                    {order.status === "seller_completed"
                      ? "Confirm receipt to complete the transaction."
                      : "Waiting for seller to complete."}
                  </p>
                </div>
              )}
            </motion.div>
          ))
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
          <Link href="/wishlist" className="text-gray-500 hover:text-purple-600 transition">
            <span className="text-xs font-semibold">Wishlist</span>
          </Link>
          <Link href="/account" className="text-purple-600 font-bold transition">
            <span className="text-xs">Account</span>
          </Link>
        </div>
      </motion.div>
    </>
  );
}
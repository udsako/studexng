// src/app/seller/orders/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Package, Tag, DollarSign, FileText, Calendar, MapPin, User, Clock, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface Order {
  id: number;
  reference: string;
  buyer: {
    username: string;
    phone?: string;
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
    price: number;
  }>;
}

export default function SellerOrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completing, setCompleting] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      setError("Please log in to view orders");
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/orders/${id}/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!res.ok) {
          if (res.status === 404) {
            setError("Order not found");
          } else if (res.status === 401) {
            setError("Session expired. Redirecting...");
            setTimeout(() => router.push("/auth"), 2000);
          } else {
            throw new Error("Failed to load order");
          }
          setLoading(false);
          return;
        }

        const data = await res.json();
        setOrder(data);
      } catch (err) {
        console.error("Order fetch error:", err);
        setError("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, router]);

  const handleMarkAsComplete = async () => {
    if (!order) return;

    setCompleting(true);

    const accessToken = localStorage.getItem("accessToken");

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/orders/${order.id}/mark_complete/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to mark as complete");
      }

      const data = await res.json();
      setOrder(data.order);
      setShowCompleteModal(false);
      
      // Show success message and redirect
      setTimeout(() => router.push("/seller/orders"), 1500);
    } catch (err) {
      console.error("Mark complete error:", err);
      alert(`Failed to complete order: ${err instanceof Error ? err.message : "Try again"}`);
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-teal-50">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
          <Clock className="w-16 h-16 text-purple-600" />
        </motion.div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-teal-50 flex items-center justify-center p-6">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center bg-white rounded-3xl p-8 shadow-xl">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-gray-800 mb-2">Order Not Found</h2>
          <p className="text-sm text-gray-600 mb-6">{error || "This order may have been removed."}</p>
          <Link href="/seller/orders">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-teal-600 text-white font-bold rounded-xl mt-4">
              Back to Orders
            </motion.button>
          </Link>
        </motion.div>
      </div>
    );
  }

  const isService = order.type === "service";
  const isPending = order.status === "paid" || order.status === "seller_completed";
  const isCompleted = order.status === "completed";

  return (
    <>
      {/* TOP BAR */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 bg-white/90 backdrop-blur-xl z-40 border-b border-purple-100 shadow-sm"
      >
        <div className="flex items-center justify-between p-4 max-w-4xl mx-auto">
          <Link href="/seller/orders">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 hover:bg-purple-100 rounded-full transition"
            >
              <ChevronLeft className="w-6 h-6 text-purple-600" />
            </motion.button>
          </Link>
          <h1 className="text-xl font-black bg-gradient-to-r from-purple-600 to-teal-500 bg-clip-text text-transparent">
            Order Details
          </h1>
          <div className="w-10" />
        </div>
      </motion.div>

      <div className="p-4 pb-32 space-y-6 max-w-4xl mx-auto">
        {/* ORDER ID + STATUS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-100 to-teal-100 rounded-3xl p-6 border-2 border-purple-200"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-600 font-semibold">Order ID</p>
              <p className="text-3xl font-black text-gray-800">#{order.reference}</p>
              <p className="text-sm text-gray-600 mt-2">{new Date(order.created_at).toLocaleString()}</p>
            </div>
            <div className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 ${
              isPending ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"
            }`}>
              {isPending ? (
                <>
                  <Clock className="w-5 h-5" />
                  Pending
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Completed
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* WHAT TO DO */}
        {isPending && order.status === "paid" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-blue-50 border-2 border-blue-300 rounded-3xl p-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-blue-700" />
              </div>
              <div>
                <p className="font-black text-blue-900 text-lg">Mark Order as Complete</p>
                <p className="text-sm text-blue-800 mt-2">
                  {isService 
                    ? "Once you've completed the service, tap the button below to confirm."
                    : "Once the food is ready for pickup/delivery, confirm it here."}
                </p>
                <p className="text-xs text-blue-700 mt-2">
                  Payment (₦{order.amount.toLocaleString()}) is held in escrow until the buyer confirms receipt.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {order.status === "seller_completed" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-200 rounded-full flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-amber-700" />
              </div>
              <div>
                <p className="font-black text-amber-900 text-lg">Waiting for Buyer Confirmation</p>
                <p className="text-sm text-amber-800 mt-2">
                  You've marked this order as complete. The buyer will now confirm receipt and release the payment.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {isCompleted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-green-50 border-2 border-green-300 rounded-3xl p-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-green-700" />
              </div>
              <div>
                <p className="font-black text-green-900 text-lg">Order Completed!</p>
                <p className="text-sm text-green-800 mt-2">
                  ₦{order.amount.toLocaleString()} has been added to your wallet.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* BUYER INFO */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl p-6 shadow-xl"
        >
          <h3 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
            <User className="w-7 h-7 text-purple-600" />
            Customer Details
          </h3>

          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-2xl">
              <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900">{order.buyer.username}</p>
                <p className="text-sm text-gray-600">Customer Name</p>
              </div>
            </div>

            {isService && order.service_details && (
              <>
                <div className="border-t-2 border-gray-200 pt-4 mt-4">
                  <p className="font-bold text-gray-900 mb-3">Service Details:</p>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p><span className="font-semibold">Service:</span> {order.service_details.service_name}</p>
                    <p className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span><span className="font-semibold">Date:</span> {order.service_details.date}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span><span className="font-semibold">Time:</span> {order.service_details.time}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span><span className="font-semibold">Location:</span> {order.service_details.location}</span>
                    </p>
                  </div>
                </div>
              </>
            )}

            {!isService && order.food_items && (
              <>
                <div className="border-t-2 border-gray-200 pt-4 mt-4">
                  <p className="font-bold text-gray-900 mb-3">Order Items:</p>
                  <div className="space-y-2">
                    {order.food_items.map((item, i) => (
                      <div key={i} className="text-sm text-gray-700 p-2 bg-gray-50 rounded">
                        {item.title} ×{item.quantity} - ₦{(item.price * item.quantity).toLocaleString()}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* AMOUNT */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-purple-100 to-teal-100 rounded-3xl p-6 border-2 border-purple-200"
        >
          <p className="text-sm text-gray-700 font-semibold mb-2">Order Amount</p>
          <p className="text-4xl font-black text-purple-600">₦{order.amount.toLocaleString()}</p>
          <p className="text-xs text-gray-600 mt-3">
            {isCompleted 
              ? "This amount has been released to your wallet."
              : "This amount is in escrow. It will be released to your wallet once the buyer confirms receipt."}
          </p>
        </motion.div>

        {/* MARK AS COMPLETE BUTTON */}
        {order.status === "paid" && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCompleteModal(true)}
            className="w-full py-5 bg-gradient-to-r from-purple-600 to-teal-500 text-white rounded-2xl font-black text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-6 h-6" />
            Mark as Complete
          </motion.button>
        )}

        {isCompleted && (
          <div className="text-center py-6 bg-green-50 rounded-2xl">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <p className="text-gray-700 font-semibold">
              Order completed and payment received!
            </p>
          </div>
        )}
      </div>

      {/* COMPLETE ORDER MODAL */}
      {showCompleteModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => !completing && setShowCompleteModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-black text-gray-900 mb-4">Mark as Complete?</h3>
            <p className="text-gray-700 mb-6">
              {isService 
                ? "Are you ready to mark this service as complete?"
                : "Is the food ready for pickup/delivery?"}
            </p>

            <div className="bg-purple-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-700">
                <span className="font-bold">Order Amount:</span>
              </p>
              <p className="text-3xl font-black text-purple-600 mt-2">₦{order.amount.toLocaleString()}</p>
              <p className="text-xs text-gray-600 mt-2">
                In escrow until buyer confirms
              </p>
            </div>

            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => !completing && setShowCompleteModal(false)}
                disabled={completing}
                className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-xl font-bold disabled:opacity-50"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleMarkAsComplete}
                disabled={completing}
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-teal-500 text-white rounded-xl font-black disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {completing ? (
                  <>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                      <Clock className="w-5 h-5" />
                    </motion.div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Yes, Complete
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* BOTTOM NAV */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200 z-40 shadow-2xl"
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
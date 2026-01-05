// src/app/account/orders/[id]/page.tsx
"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Package, CheckCircle, Clock, MapPin, AlertCircle, ChevronLeft, Calendar, User } from "lucide-react";
import { useState, useEffect } from "react";

interface OrderItem {
  title: string;
  qty: number;
  price: number;
  img?: string;
}

interface Order {
  id: string;
  reference: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  amount: number;
  date: string;
  status: "pending_confirmation" | "completed" | "disputed" | "refunded";
  type: "service" | "food";
  serviceDetails?: {
    serviceName: string;
    date: string;
    time: string;
    location: string;
  };
  foodDetails?: OrderItem[];
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    // Load order from localStorage
    const allOrders = JSON.parse(localStorage.getItem("allOrders") || "[]");
    const foundOrder = allOrders.find((o: Order) => o.id === orderId);
    
    if (foundOrder) {
      setOrder(foundOrder);
    }
    setLoading(false);
  }, [orderId]);

  const handleConfirmReceipt = async () => {
    if (!order) return;

    setConfirming(true);

    // Simulate verification delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Update order status to completed
    const allOrders = JSON.parse(localStorage.getItem("allOrders") || "[]");
    const updatedOrders = allOrders.map((o: Order) => 
      o.id === orderId ? { ...o, status: "completed" } : o
    );
    localStorage.setItem("allOrders", JSON.stringify(updatedOrders));

    // Release funds from escrow to seller's wallet
    const currentEscrow = parseFloat(localStorage.getItem("walletInEscrow") || "0");
    const newEscrow = currentEscrow - order.amount;
    localStorage.setItem("walletInEscrow", newEscrow.toString());

    // Add to seller's wallet
    const sellerWallet = parseFloat(localStorage.getItem("walletBalance") || "0");
    const newSellerWallet = sellerWallet + order.amount;
    localStorage.setItem("walletBalance", newSellerWallet.toString());

    // Update seller's transaction (from in_escrow to released)
    const transactions = JSON.parse(localStorage.getItem("sellerTransactions") || "[]");
    const updatedTransactions = transactions.map((t: any) =>
      t.orderId === orderId ? { ...t, status: "released" } : t
    );
    localStorage.setItem("sellerTransactions", JSON.stringify(updatedTransactions));

    // Update local order state
    setOrder(prev => prev ? { ...prev, status: "completed" } : null);
    setConfirming(false);
    setShowConfirmModal(false);

    // Show success and redirect
    setTimeout(() => {
      router.push("/account/orders");
    }, 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
          <Clock className="w-12 h-12 text-purple-600" />
        </motion.div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-teal-50 flex items-center justify-center p-6">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center bg-white rounded-3xl p-8 shadow-xl">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-gray-800 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-6">We couldn't find this order</p>
          <Link href="/account/orders">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-teal-600 text-white font-bold rounded-xl">
              Back to Orders
            </motion.button>
          </Link>
        </motion.div>
      </div>
    );
  }

  const isService = order.type === "service";
  const isPending = order.status === "pending_confirmation";
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
          <Link href="/account/orders">
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
              <p className="text-3xl font-black text-gray-800">{order.id}</p>
              <p className="text-sm text-gray-600 mt-2">{new Date(order.date).toLocaleString()}</p>
            </div>
            <div className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 ${
              isPending ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"
            }`}>
              {isPending ? (
                <>
                  <Clock className="w-5 h-5" />
                  Pending Confirmation
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

        {/* ESCROW STATUS CARD */}
        {isPending && (
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
                <p className="font-black text-amber-900 text-lg">Payment Held in Escrow</p>
                <p className="text-sm text-amber-800 mt-2">
                  ₦{order.amount.toLocaleString()} is safely held by StudEx. Once you confirm receipt, it will be released to the seller.
                </p>
                <p className="text-xs text-amber-700 mt-2">
                  You have 7 days to confirm or dispute this order.
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
                <p className="font-black text-green-900 text-lg">Confirmed & Completed</p>
                <p className="text-sm text-green-800 mt-2">
                  You confirmed receipt of this order. ₦{order.amount.toLocaleString()} has been released to {order.sellerName}.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ORDER DETAILS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl p-6 shadow-xl"
        >
          <h3 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
            <Package className="w-7 h-7 text-purple-600" />
            {isService ? "Service Details" : "Order Details"}
          </h3>

          {/* SERVICE DETAILS */}
          {isService && order.serviceDetails && (
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-purple-50 rounded-2xl">
                <span className="font-semibold text-gray-700">Service</span>
                <span className="font-bold text-gray-900">{order.serviceDetails.serviceName}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-purple-50 rounded-2xl">
                <span className="font-semibold text-gray-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Date
                </span>
                <span className="font-bold text-gray-900">{order.serviceDetails.date}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-purple-50 rounded-2xl">
                <span className="font-semibold text-gray-700 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Time
                </span>
                <span className="font-bold text-gray-900">{order.serviceDetails.time}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-purple-50 rounded-2xl">
                <span className="font-semibold text-gray-700 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Location
                </span>
                <span className="font-bold text-gray-900">{order.serviceDetails.location}</span>
              </div>
            </div>
          )}

          {/* FOOD DETAILS */}
          {!isService && order.foodDetails && (
            <div className="space-y-3">
              {order.foodDetails.map((item, i) => (
                <div key={i} className="flex justify-between items-center p-4 bg-purple-50 rounded-2xl">
                  <div>
                    <p className="font-bold text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-600">×{item.qty}</p>
                  </div>
                  <p className="font-bold text-purple-600">₦{(item.price * item.qty).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}

          {/* AMOUNT */}
          <div className="border-t-2 border-purple-200 mt-6 pt-6">
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold text-gray-900">Total Amount</span>
              <span className="text-3xl font-black text-purple-600">₦{order.amount.toLocaleString()}</span>
            </div>
          </div>
        </motion.div>

        {/* SELLER INFO */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl p-6 shadow-xl"
        >
          <h4 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-6 h-6 text-teal-600" />
            {isService ? "Service Provider" : "Restaurant/Vendor"}
          </h4>
          <p className="text-2xl font-black text-gray-900">{order.sellerName}</p>
        </motion.div>

        {/* CONFIRM RECEIPT BUTTON */}
        {isPending && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowConfirmModal(true)}
              className="w-full py-5 bg-gradient-to-r from-purple-600 to-teal-500 text-white rounded-2xl font-black text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-6 h-6" />
              Confirm Receipt
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 bg-red-100 text-red-700 rounded-2xl font-bold"
            >
              Report an Issue
            </motion.button>
          </motion.div>
        )}

        {isCompleted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center py-6"
          >
            <p className="text-gray-600">
              This order is complete. You can view your other orders or continue shopping.
            </p>
          </motion.div>
        )}
      </div>

      {/* CONFIRM RECEIPT MODAL */}
      {showConfirmModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => !confirming && setShowConfirmModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-black text-gray-900 mb-4">Confirm Receipt?</h3>
            <p className="text-gray-700 mb-6">
              {isService 
                ? "Did you receive the service as expected?"
                : "Did you receive your order in good condition?"}
            </p>

            <div className="bg-purple-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-700">
                <span className="font-bold">Amount to Release:</span>
              </p>
              <p className="text-3xl font-black text-purple-600 mt-2">₦{order.amount.toLocaleString()}</p>
              <p className="text-xs text-gray-600 mt-2">
                This will be released to {order.sellerName}
              </p>
            </div>

            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => !confirming && setShowConfirmModal(false)}
                disabled={confirming}
                className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-xl font-bold disabled:opacity-50"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleConfirmReceipt}
                disabled={confirming}
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-teal-500 text-white rounded-xl font-black disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {confirming ? (
                  <>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
                      <Clock className="w-5 h-5" />
                    </motion.div>
                    Confirming...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Yes, Confirm
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
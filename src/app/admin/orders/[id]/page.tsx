// src/app/admin/orders/[id]/page.tsx
"use client";

import { motion } from "framer-motion";
import {
  ChevronLeft,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  DollarSign,
  AlertCircle,
  Shield,
  MapPin,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface Order {
  id: string;
  buyerName: string;
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
  foodDetails?: any[];
}

function AdminOrderDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [refundLoading, setRefundLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const allOrders = JSON.parse(localStorage.getItem("allOrders") || "[]");
    const found = allOrders.find((o: Order) => o.id === id);
    setOrder(found || null);
  }, [id]);

  const handleRefund = () => {
    if (!order || order.status === "refunded") return;

    setRefundLoading(true);

    setTimeout(() => {
      // Update order status to refunded
      const allOrders = JSON.parse(localStorage.getItem("allOrders") || "[]");
      const updated = allOrders.map((o: Order) =>
        o.id === order.id ? { ...o, status: "refunded" as const } : o
      );
      localStorage.setItem("allOrders", JSON.stringify(updated));

      // Refund to buyer's wallet
      const buyerKey = `buyer_${order.id.split("-")[0]}`;
      const buyerWallet = parseFloat(localStorage.getItem(buyerKey) || "0");
      localStorage.setItem(buyerKey, (buyerWallet + order.amount).toString());

      // Deduct from escrow
      const escrow = parseFloat(localStorage.getItem("walletInEscrow") || "0");
      localStorage.setItem("walletInEscrow", Math.max(0, escrow - order.amount).toString());

      setOrder({ ...order, status: "refunded" });
      setRefundLoading(false);
      alert(`✓ ₦${order.amount.toLocaleString()} refunded to buyer`);

      setTimeout(() => router.push("/admin/orders"), 1000);
    }, 1500);
  };

  if (!mounted) return null;

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-6">
          <AlertCircle className="w-20 h-20 mx-auto text-white/20" />
          <h2 className="text-3xl font-black text-white">Order Not Found</h2>
          <button
            onClick={() => router.push("/admin/orders")}
            className="px-10 py-5 bg-gradient-to-r from-purple-600 to-teal-600 text-white font-black rounded-2xl shadow-2xl"
          >
            Back to Orders
          </button>
        </motion.div>
      </div>
    );
  }

  const isPending = order.status === "pending_confirmation";
  const isCompleted = order.status === "completed";
  const isDisputed = order.status === "disputed";
  const isRefunded = order.status === "refunded";

  return (
    <>
      {/* TOP BAR */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-50 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 border-b border-white/10 backdrop-blur-xl"
      >
        <div className="flex items-center justify-between px-5 py-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-xl transition">
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-xl font-black text-white">Order • {order.id}</h1>
          <div className="w-10" />
        </div>
      </motion.div>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 px-5 pt-4 pb-32 space-y-6">

        {/* HERO CARD */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`rounded-3xl p-7 text-white shadow-2xl ${
            isRefunded
              ? "bg-gradient-to-r from-blue-600 to-cyan-600"
              : isDisputed
              ? "bg-gradient-to-r from-red-600 to-orange-600"
              : isPending
              ? "bg-gradient-to-r from-amber-600 to-orange-600"
              : "bg-gradient-to-r from-emerald-500 to-teal-600"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-5xl font-black">₦{order.amount.toLocaleString()}</p>
              <p className="text-white/80 mt-2 flex items-center gap-2">
                <Calendar className="w-5 h-5" /> {new Date(order.date).toLocaleString()}
              </p>
            </div>
            <div className={`px-6 py-3 rounded-full font-black text-lg flex items-center gap-3 ${
              isRefunded ? "bg-white/20" :
              isDisputed ? "bg-white/20" :
              isPending ? "bg-white/20" :
              "bg-white/20"
            }`}>
              {isPending && <Clock className="w-6 h-6" />}
              {isCompleted && <CheckCircle className="w-6 h-6" />}
              {isDisputed && <AlertCircle className="w-6 h-6" />}
              {isRefunded && <XCircle className="w-6 h-6" />}
              {order.status === "pending_confirmation" ? "PENDING" : order.status.toUpperCase()}
            </div>
          </div>
        </motion.div>

        {/* STATUS INFO */}
        {isPending && (
          <motion.div className="bg-amber-500/20 border border-amber-500/50 rounded-2xl p-5 backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <Clock className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" />
              <div>
                <p className="text-white font-bold">Awaiting Seller Confirmation</p>
                <p className="text-amber-300 text-sm mt-1">Seller needs to mark this order as complete</p>
              </div>
            </div>
          </motion.div>
        )}

        {isCompleted && (
          <motion.div className="bg-emerald-500/20 border border-emerald-500/50 rounded-2xl p-5 backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-1" />
              <div>
                <p className="text-white font-bold">Awaiting Buyer Confirmation</p>
                <p className="text-emerald-300 text-sm mt-1">Buyer needs to confirm receipt to release escrow funds</p>
              </div>
            </div>
          </motion.div>
        )}

        {isDisputed && (
          <motion.div className="bg-red-500/20 border border-red-500/50 rounded-2xl p-5 backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
              <div>
                <p className="text-white font-bold">Under Dispute</p>
                <p className="text-red-300 text-sm mt-1">This order has been flagged for dispute resolution by admin</p>
              </div>
            </div>
          </motion.div>
        )}

        {isRefunded && (
          <motion.div className="bg-blue-500/20 border border-blue-500/50 rounded-2xl p-5 backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
              <div>
                <p className="text-white font-bold">Refunded</p>
                <p className="text-blue-300 text-sm mt-1">Money has been returned to buyer's wallet</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* BUYER & SELLER */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <User className="w-6 h-6 text-blue-400" /> Buyer
            </h3>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center text-xl font-black text-white">
                {order.buyerName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div>
                <p className="text-white font-bold text-lg">{order.buyerName}</p>
              </div>
            </div>
          </motion.div>

          <motion.div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <User className="w-6 h-6 text-purple-400" /> Seller
            </h3>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center text-xl font-black text-white">
                {order.sellerName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div>
                <p className="text-white font-bold text-lg">{order.sellerName}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ORDER DETAILS */}
        {order.type === "service" && order.serviceDetails && (
          <motion.div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-bold text-white mb-4">Service Details</h3>
            <div className="space-y-3">
              <div>
                <p className="text-white/60 text-sm">Service</p>
                <p className="text-white font-bold text-lg">{order.serviceDetails.serviceName}</p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-white/60">Date</p>
                  <p className="text-white font-medium">{order.serviceDetails.date}</p>
                </div>
                <div>
                  <p className="text-white/60">Time</p>
                  <p className="text-white font-medium">{order.serviceDetails.time}</p>
                </div>
                <div>
                  <p className="text-white/60 flex items-center gap-1">
                    <MapPin className="w-4 h-4" /> Location
                  </p>
                  <p className="text-white font-medium">{order.serviceDetails.location}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {order.type === "food" && order.foodDetails && order.foodDetails.length > 0 && (
          <motion.div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Package className="w-6 h-6" /> Food Items
            </h3>
            <div className="space-y-3">
              {order.foodDetails.map((item: any, i: number) => (
                <div key={i} className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                  <div>
                    <p className="text-white font-bold">{item.title}</p>
                    <p className="text-white/60 text-sm">Qty: {item.qty}</p>
                  </div>
                  <p className="text-emerald-400 font-bold">₦{(item.price * item.qty).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ACTION BUTTONS */}
        {isPending && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <button
              onClick={handleRefund}
              disabled={refundLoading}
              className="w-full py-5 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-black text-lg rounded-2xl shadow-lg hover:shadow-amber-500/50 transition disabled:opacity-70"
            >
              {refundLoading ? "Processing..." : "⚠️ Issue Refund"}
            </button>
            <p className="text-white/50 text-xs text-center">Only issue refund if order is invalid</p>
          </motion.div>
        )}

        {isCompleted && (
          <motion.div className="bg-emerald-500/20 border border-emerald-500/50 rounded-2xl p-4 backdrop-blur-xl">
            <p className="text-emerald-300 text-center font-bold">
              ✓ Awaiting buyer confirmation to release escrow funds
            </p>
          </motion.div>
        )}

        {isDisputed && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={() => router.push("/admin/disputes")}
            className="w-full py-4 bg-gradient-to-r from-red-600 to-pink-600 text-white font-bold rounded-2xl"
          >
            View in Disputes → Resolve
          </motion.button>
        )}
      </div>
    </>
  );
}

export default AdminOrderDetail;
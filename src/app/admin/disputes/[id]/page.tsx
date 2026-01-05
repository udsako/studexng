// src/app/admin/disputes/[id]/page.tsx
"use client";

import { motion } from "framer-motion";
import {
  ChevronLeft,
  AlertCircle,
  CheckCircle,
  User,
  DollarSign,
  MessageSquare,
  Calendar,
  Shield,
  ArrowRight,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface Dispute {
  id: string;
  orderId: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  amount: number;
  reason: string;
  description: string;
  date: string;
  status: "open" | "resolved" | "appealed";
  resolution?: "refund" | "release";
}

export default function DisputeDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [resolving, setResolving] = useState(false);
  const [selectedResolution, setSelectedResolution] = useState<"refund" | "release" | null>(null);

  useEffect(() => {
    const allDisputes = JSON.parse(localStorage.getItem("disputes") || "[]");
    const found = allDisputes.find((d: Dispute) => d.id === id);
    setDispute(found);
  }, [id]);

  const handleResolveDispute = async (resolution: "refund" | "release") => {
    if (!dispute) return;

    setResolving(true);
    setSelectedResolution(resolution);

    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Update dispute status
    const allDisputes = JSON.parse(localStorage.getItem("disputes") || "[]");
    const updatedDisputes = allDisputes.map((d: Dispute) =>
      d.id === dispute.id
        ? { ...d, status: "resolved" as const, resolution }
        : d
    );
    localStorage.setItem("disputes", JSON.stringify(updatedDisputes));

    // Update order status
    const allOrders = JSON.parse(localStorage.getItem("allOrders") || "[]");
    const updatedOrders = allOrders.map((o: any) => {
      if (o.id === dispute.orderId) {
        return { ...o, status: resolution === "refund" ? "refunded" : "completed" };
      }
      return o;
    });
    localStorage.setItem("allOrders", JSON.stringify(updatedOrders));

    // Update escrow
    const currentEscrow = parseFloat(localStorage.getItem("walletInEscrow") || "0");
    localStorage.setItem("walletInEscrow", (currentEscrow - dispute.amount).toString());

    // If refund, add to buyer's wallet
    if (resolution === "refund") {
      const buyerKey = `buyer_${dispute.buyerId}`;
      const buyerWallet = localStorage.getItem(buyerKey) || "0";
      const newBuyerWallet = parseFloat(buyerWallet) + dispute.amount;
      localStorage.setItem(buyerKey, newBuyerWallet.toString());
    } else {
      // If release, add to seller's wallet
      const sellerKey = `seller_${dispute.sellerId}`;
      const sellerBalance = localStorage.getItem("walletBalance") || "0";
      const newSellerBalance = parseFloat(sellerBalance) + dispute.amount;
      localStorage.setItem("walletBalance", newSellerBalance.toString());
    }

    setDispute({ ...dispute, status: "resolved", resolution });
    setResolving(false);

    setTimeout(() => {
      router.push("/admin/disputes");
    }, 1500);
  };

  if (!dispute) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-6">
          <AlertCircle className="w-20 h-20 mx-auto text-white/20" />
          <h2 className="text-3xl font-black text-white">Dispute Not Found</h2>
          <button
            onClick={() => router.push("/admin/disputes")}
            className="px-10 py-5 bg-gradient-to-r from-purple-600 to-teal-600 text-white font-black rounded-2xl shadow-2xl"
          >
            Back to Disputes
          </button>
        </motion.div>
      </div>
    );
  }

  const isResolved = dispute.status === "resolved";

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
          <h1 className="text-xl font-black text-white">Dispute • {dispute.id}</h1>
          <div className="w-10" />
        </div>
      </motion.div>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 px-5 pt-4 pb-32 space-y-6">

        {/* HERO CARD */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-red-600 to-pink-600 rounded-3xl p-7 text-white shadow-2xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-lg font-bold">Dispute Amount</p>
              <p className="text-5xl font-black mt-2">₦{dispute.amount.toLocaleString()}</p>
            </div>
            <div className={`px-6 py-3 rounded-full font-black text-lg flex items-center gap-3 ${
              isResolved ? "bg-emerald-500/30" : "bg-white/20"
            }`}>
              {isResolved ? (
                <>
                  <CheckCircle className="w-6 h-6" />
                  RESOLVED
                </>
              ) : (
                <>
                  <AlertCircle className="w-6 h-6" />
                  OPEN
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* DISPUTE REASON */}
        <motion.div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10">
          <h3 className="text-xl font-black text-white mb-4 flex items-center gap-3">
            <MessageSquare className="w-7 h-7 text-red-400" />
            Issue Details
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-white/60 text-sm font-semibold mb-2">REASON</p>
              <p className="text-2xl font-black text-white">{dispute.reason}</p>
            </div>
            <div className="border-t border-white/10 pt-4">
              <p className="text-white/60 text-sm font-semibold mb-2">DESCRIPTION</p>
              <p className="text-white/80 leading-relaxed">{dispute.description}</p>
            </div>
          </div>
        </motion.div>

        {/* BUYER INFO */}
        <motion.div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10">
          <h3 className="text-xl font-black text-white mb-4 flex items-center gap-3">
            <User className="w-7 h-7 text-blue-400" />
            Buyer
          </h3>
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center text-2xl font-black text-white">
              {dispute.buyerName.split(" ").map((n) => n[0]).join("").substring(0, 2)}
            </div>
            <div>
              <p className="text-white font-bold text-xl">{dispute.buyerName}</p>
              <p className="text-blue-300 text-sm font-mono mt-1">ID: {dispute.buyerId}</p>
            </div>
          </div>
        </motion.div>

        {/* SELLER INFO */}
        <motion.div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10">
          <h3 className="text-xl font-black text-white mb-4 flex items-center gap-3">
            <User className="w-7 h-7 text-purple-400" />
            Seller
          </h3>
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center text-2xl font-black text-white">
              {dispute.sellerName.split(" ").map((n) => n[0]).join("").substring(0, 2)}
            </div>
            <div>
              <p className="text-white font-bold text-xl">{dispute.sellerName}</p>
              <p className="text-purple-300 text-sm font-mono mt-1">ID: {dispute.sellerId}</p>
            </div>
          </div>
        </motion.div>

        {/* ORDER & DATE */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10">
            <p className="text-white/60 text-sm mb-2">ORDER ID</p>
            <p className="text-white font-mono font-bold text-lg">{dispute.orderId}</p>
          </motion.div>
          <motion.div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10">
            <p className="text-white/60 text-sm mb-2 flex items-center gap-1">
              <Calendar className="w-4 h-4" /> DISPUTE DATE
            </p>
            <p className="text-white font-bold">{new Date(dispute.date).toLocaleDateString()}</p>
          </motion.div>
        </div>

        {/* RESOLUTION SECTION */}
        {!isResolved ? (
          <motion.div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-amber-500/30">
            <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
              <Shield className="w-7 h-7 text-amber-400" />
              Resolution
            </h3>

            <div className="space-y-4">
              {/* REFUND OPTION */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                onClick={() => handleResolveDispute("refund")}
                disabled={resolving}
                className={`w-full p-6 rounded-2xl border-2 transition ${
                  selectedResolution === "refund"
                    ? "bg-red-500/20 border-red-500 text-white"
                    : "bg-white/5 border-white/10 text-white hover:border-red-500/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <p className="font-bold text-lg">Refund Buyer</p>
                    <p className="text-white/70 text-sm">Return ₦{dispute.amount.toLocaleString()} to buyer's wallet</p>
                  </div>
                  <ArrowRight className="w-6 h-6" />
                </div>
              </motion.button>

              {/* RELEASE OPTION */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                onClick={() => handleResolveDispute("release")}
                disabled={resolving}
                className={`w-full p-6 rounded-2xl border-2 transition ${
                  selectedResolution === "release"
                    ? "bg-emerald-500/20 border-emerald-500 text-white"
                    : "bg-white/5 border-white/10 text-white hover:border-emerald-500/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <p className="font-bold text-lg">Release to Seller</p>
                    <p className="text-white/70 text-sm">Release ₦{dispute.amount.toLocaleString()} to seller's wallet</p>
                  </div>
                  <ArrowRight className="w-6 h-6" />
                </div>
              </motion.button>
            </div>

            {selectedResolution && (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => handleResolveDispute(selectedResolution)}
                disabled={resolving}
                className="w-full mt-6 py-5 bg-gradient-to-r from-purple-600 to-teal-600 text-white font-black text-lg rounded-2xl shadow-xl disabled:opacity-70"
              >
                {resolving ? "Processing Resolution..." : `Confirm ${selectedResolution === "refund" ? "Refund" : "Release"}`}
              </motion.button>
            )}
          </motion.div>
        ) : (
          <motion.div className="bg-emerald-500/20 backdrop-blur-xl rounded-3xl p-6 border border-emerald-500/30">
            <div className="flex items-center gap-4">
              <CheckCircle className="w-10 h-10 text-emerald-400" />
              <div>
                <p className="text-white font-black text-lg">Dispute Resolved</p>
                <p className="text-emerald-300 text-sm">
                  {dispute.resolution === "refund" ? "Refunded to buyer" : "Released to seller"}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
}
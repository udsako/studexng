// src/app/admin/sellers/[id]/page.tsx
"use client";

import { motion } from "framer-motion";
import { ChevronLeft, Landmark, DollarSign, CheckCircle, Clock, AlertCircle, User, Store, Calendar, Package, Ban, ShieldCheck, TrendingUp } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function AdminSellerProfile() {
  const { id } = useParams();
  const router = useRouter();
  const [seller, setSeller] = useState<any>(null);
  const [bank, setBank] = useState<any>(null);
  const [releasing, setReleasing] = useState(false);

  useEffect(() => {
    const mockSellers = [
      {
        id: "SELL001",
        name: "Amaka Bello",
        email: "amaka@pau.edu.ng",
        matric: "PAU20230012",
        joinDate: "Mar 10, 2025",
        totalProducts: 18,
        totalSales: "₦842,000",
        pendingPayout: 42000,
        rating: 4.9,
        status: "verified",
        avatar: "AB",
      },
      {
        id: "SELL002",
        name: "Victor Osahon",
        email: "victor@pau.edu.ng",
        matric: "PAU20231234",
        joinDate: "May 2, 2025",
        totalProducts: 7,
        totalSales: "₦124,500",
        pendingPayout: 15000,
        rating: 4.7,
        status: "verified",
        avatar: "VO",
      },
    ];

    const found = mockSellers.find(s => s.id === id);
    setSeller(found || null);

    const savedBank = localStorage.getItem("sellerBank");
    if (savedBank) setBank(JSON.parse(savedBank));
  }, [id]);

  const handleReleasePayment = () => {
    if (!bank || !seller) return;
    setReleasing(true);
    setTimeout(() => {
      alert(`₦${seller.pendingPayout.toLocaleString()} released to ${bank.accountName}`);
      setReleasing(false);
    }, 1800);
  };

  const handleSuspend = () => {
    if (confirm(`Suspend ${seller?.name}? Their store will be blocked.`)) {
      alert(`${seller?.name} has been suspended.`);
    }
  };

  if (!seller) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-purple-900">
        <p className="text-white text-lg">Seller not found</p>
      </div>
    );
  }

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
          <h1 className="text-xl font-black text-white">Seller Profile</h1>
          <div className="w-10" />
        </div>
      </motion.div>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 px-5 pt-4 pb-32 space-y-5">

        {/* HERO CARD */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-teal-600 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-lg">
              {seller.avatar}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-black text-white">{seller.name}</h2>
              <p className="text-purple-300 font-medium">{seller.email}</p>
              <p className="text-white/50 text-sm font-mono">{seller.matric}</p>
            </div>
            <div className={`px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5 ${
              seller.status === "verified"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50"
                : "bg-amber-500/20 text-amber-300 border border-amber-500/50"
            }`}>
              {seller.status === "verified" ? <ShieldCheck className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              {seller.status.toUpperCase()}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <Package className="w-7 h-7 mx-auto text-purple-400 mb-1" />
              <p className="text-xl font-black text-white">{seller.totalProducts}</p>
              <p className="text-xs text-white/60">Products</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <TrendingUp className="w-7 h-7 mx-auto text-emerald-400 mb-1" />
              <p className="text-xl font-black text-emerald-400">{seller.totalSales}</p>
              <p className="text-xs text-white/60">Sales</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <Calendar className="w-7 h-7 mx-auto text-teal-400 mb-1" />
              <p className="text-sm font-bold text-white">Joined</p>
              <p className="text-xs text-white/60">{seller.joinDate}</p>
            </div>
          </div>
        </motion.div>

        {/* ESCROW CARD */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-5 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold opacity-90 flex items-center gap-1.5">
                <DollarSign className="w-5 h-5" /> Escrow Balance
              </p>
              <p className="text-3xl font-black mt-1">₦{seller.pendingPayout.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-4xl">Star</p>
              <p className="text-xl font-black -mt-2">{seller.rating}</p>
            </div>
          </div>
        </motion.div>

        {/* BANK DETAILS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Landmark className="w-6 h-6 text-purple-400" />
              <h3 className="font-bold text-white">Payout Account</h3>
            </div>
            {bank && <CheckCircle className="w-5 h-5 text-emerald-400" />}
          </div>

          {bank ? (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">Bank</span>
                <span className="text-white font-medium">{bank.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Name</span>
                <span className="text-white font-medium">{bank.accountName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Account No.</span>
                <span className="text-white font-mono">{bank.accountNumber}</span>
              </div>
            </div>
          ) : (
            <p className="text-center text-white/50 py-6 text-sm">No bank linked yet</p>
          )}
        </motion.div>

        {/* ACTION BUTTONS */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleReleasePayment}
            disabled={!bank || releasing}
            className={`flex-1 py-4 rounded-xl font-bold text-white text-base transition-all ${
              bank && !releasing
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30"
                : "bg-white/10 opacity-50"
            }`}
          >
            {releasing ? "Releasing..." : "Release Funds"}
          </button>

          <button
            onClick={handleSuspend}
            className="px-6 py-4 bg-gradient-to-r from-red-600 to-pink-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/30"
          >
            <Ban className="w-5 h-5" />
          </button>
        </div>
      </div>
    </>
  );
}
// src/app/admin/payouts/[id]/page.tsx
"use client";

import { motion } from "framer-motion";
import {
  ChevronLeft,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Calendar,
  Landmark,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface WithdrawalRequest {
  id: string;
  sellerId: string;
  sellerName: string;
  amount: number;
  date: string;
  status: "pending" | "approved" | "completed" | "rejected";
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
}

function PayoutDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [payout, setPayout] = useState<WithdrawalRequest | null>(null);
  const [releasing, setReleasing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const withdrawalRequests = JSON.parse(localStorage.getItem("withdrawalRequests") || "[]");
    const found = withdrawalRequests.find((p: WithdrawalRequest) => p.id === id);
    setPayout(found || null);
  }, [id]);

  const handleApprove = () => {
    if (!payout) return;

    const withdrawalRequests = JSON.parse(localStorage.getItem("withdrawalRequests") || "[]");
    const updated = withdrawalRequests.map((p: WithdrawalRequest) =>
      p.id === payout.id ? { ...p, status: "approved" as const } : p
    );
    localStorage.setItem("withdrawalRequests", JSON.stringify(updated));
    setPayout({ ...payout, status: "approved" });
    alert("✓ Payment approved!");
  };

  const handleRelease = () => {
    if (!payout || payout.status !== "approved") return;

    setReleasing(true);

    setTimeout(() => {
      // Update escrow balance
      const currentEscrow = parseFloat(localStorage.getItem("walletInEscrow") || "0");
      const newEscrow = Math.max(0, currentEscrow - payout.amount);
      localStorage.setItem("walletInEscrow", newEscrow.toString());

      // Update payout status
      const withdrawalRequests = JSON.parse(localStorage.getItem("withdrawalRequests") || "[]");
      const updated = withdrawalRequests.map((p: WithdrawalRequest) =>
        p.id === payout.id ? { ...p, status: "completed" as const } : p
      );
      localStorage.setItem("withdrawalRequests", JSON.stringify(updated));

      setPayout({ ...payout, status: "completed" });
      setReleasing(false);
      alert(`✓ ₦${payout.amount.toLocaleString()} released to ${payout.accountName}`);

      setTimeout(() => router.push("/admin/payouts"), 1000);
    }, 1500);
  };

  if (!mounted) return null;

  if (!payout) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-6">
          <AlertCircle className="w-20 h-20 mx-auto text-white/20" />
          <h2 className="text-3xl font-black text-white">Payout Not Found</h2>
          <button
            onClick={() => router.push("/admin/payouts")}
            className="px-10 py-5 bg-gradient-to-r from-purple-600 to-teal-600 text-white font-black rounded-2xl shadow-2xl"
          >
            Back to Payouts
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-50 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 border-b border-white/10 backdrop-blur-xl"
      >
        <div className="flex items-center justify-between px-5 py-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-xl transition">
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-xl font-black text-white">Payout • {payout.id}</h1>
          <div className="w-10" />
        </div>
      </motion.div>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 px-5 pt-4 pb-32 space-y-6">

        {/* HERO CARD */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`rounded-3xl p-7 text-white shadow-2xl bg-gradient-to-r ${
            payout.status === "completed"
              ? "from-emerald-500 to-teal-600"
              : payout.status === "approved"
              ? "from-blue-500 to-cyan-600"
              : payout.status === "pending"
              ? "from-amber-600 to-orange-600"
              : "from-red-600 to-pink-600"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold flex items-center gap-2">
                <DollarSign className="w-7 h-7" /> Payout Amount
              </p>
              <p className="text-5xl font-black mt-2">₦{payout.amount.toLocaleString()}</p>
            </div>
            <div className={`px-6 py-3 rounded-full font-black text-lg flex items-center gap-3 ${
              payout.status === "completed" ? "bg-white/20" :
              payout.status === "approved" ? "bg-white/20" :
              payout.status === "pending" ? "bg-white/20" :
              "bg-white/20"
            }`}>
              {payout.status === "pending" && <Clock className="w-6 h-6" />}
              {payout.status === "approved" && <CheckCircle className="w-6 h-6" />}
              {payout.status === "completed" && <CheckCircle className="w-6 h-6" />}
              {payout.status === "rejected" && <AlertTriangle className="w-6 h-6" />}
              {payout.status.toUpperCase()}
            </div>
          </div>
        </motion.div>

        {/* STATUS INFO */}
        {payout.status === "pending" && (
          <motion.div className="bg-amber-500/20 border border-amber-500/50 rounded-2xl p-5 backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <Clock className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" />
              <div>
                <p className="text-white font-bold">Awaiting Your Approval</p>
                <p className="text-amber-300 text-sm mt-1">Review the withdrawal and approve to proceed</p>
              </div>
            </div>
          </motion.div>
        )}

        {payout.status === "approved" && (
          <motion.div className="bg-blue-500/20 border border-blue-500/50 rounded-2xl p-5 backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
              <div>
                <p className="text-white font-bold">Ready to Release</p>
                <p className="text-blue-300 text-sm mt-1">Click "Release Payment" to transfer funds to seller's bank account</p>
              </div>
            </div>
          </motion.div>
        )}

        {payout.status === "completed" && (
          <motion.div className="bg-emerald-500/20 border border-emerald-500/50 rounded-2xl p-5 backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-1" />
              <div>
                <p className="text-white font-bold">Payment Released</p>
                <p className="text-emerald-300 text-sm mt-1">Funds have been transferred to seller's account</p>
              </div>
            </div>
          </motion.div>
        )}

        {payout.status === "rejected" && (
          <motion.div className="bg-red-500/20 border border-red-500/50 rounded-2xl p-5 backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
              <div>
                <p className="text-white font-bold">Withdrawal Rejected</p>
                <p className="text-red-300 text-sm mt-1">This withdrawal request was rejected</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* SELLER INFO */}
        <motion.div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <User className="w-6 h-6 text-purple-400" /> Seller
          </h3>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-teal-600 rounded-2xl flex items-center justify-center text-2xl font-black text-white">
              {payout.sellerName
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div>
              <p className="text-white font-bold text-xl">{payout.sellerName}</p>
              <p className="text-purple-300 text-sm font-mono mt-1">ID: {payout.sellerId}</p>
            </div>
          </div>
        </motion.div>

        {/* BANK DETAILS */}
        <motion.div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-5">
            <Landmark className="w-7 h-7 text-purple-400" />
            <h3 className="text-lg font-bold text-white">Bank Details</h3>
            {payout.bankName && <CheckCircle className="w-7 h-7 text-emerald-400 ml-auto" />}
          </div>
          {payout.bankName ? (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-white/60 text-sm">Bank</p>
                  <p className="text-white font-bold text-lg">{payout.bankName}</p>
                </div>
                <div>
                  <p className="text-white/60 text-sm">Account Name</p>
                  <p className="text-white font-bold text-lg">{payout.accountName}</p>
                </div>
              </div>
              <div>
                <p className="text-white/60 text-sm">Account Number</p>
                <p className="text-white font-mono text-2xl tracking-wider">{payout.accountNumber}</p>
              </div>
              <div>
                <p className="text-white/60 text-sm flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> Requested
                </p>
                <p className="text-white font-medium">{new Date(payout.date).toLocaleString()}</p>
              </div>
            </div>
          ) : (
            <p className="text-white/60 text-center py-8">No bank details provided</p>
          )}
        </motion.div>

        {/* ACTION BUTTONS */}
        {payout.status === "pending" && (
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleApprove}
              className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-blue-500/50 transition"
            >
              Approve Payment
            </button>
          </div>
        )}

        {payout.status === "approved" && (
          <motion.div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/80 to-transparent backdrop-blur-xl z-50">
            <button
              onClick={handleRelease}
              disabled={releasing}
              className={`w-full py-5 rounded-2xl font-black text-xl shadow-2xl flex items-center justify-center gap-3 transition ${
                releasing
                  ? "bg-white/20 text-white/50"
                  : "bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-emerald-500/50"
              }`}
            >
              {releasing ? "Releasing..." : <>Release ₦{payout.amount.toLocaleString()}</>}
            </button>
          </motion.div>
        )}
      </div>
    </>
  );
}

export default PayoutDetailPage;
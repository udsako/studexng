"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Search, Calendar, Download, Loader } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/authStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

interface Transaction {
  id: number;
  type: "credit" | "debit";
  amount: number;
  status: "success" | "pending" | "failed";
  description: string;
  reference: string;
  created_at: string;
}

export default function WalletHistoryPage() {
  const router = useRouter();
  const { isLoggedIn, isHydrated, user } = useAuth();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "credit" | "debit">("all");
  const [searchTerm, setSearchTerm] = useState("");

  // REMOVED: Auth check moved to ProtectedRoute component
  // This prevents premature redirects and double-checking

  // Fetch transactions
  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }

    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('access_token');
        
        const res = await fetch(`${API_URL}/api/wallet/transactions/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok) throw new Error('Failed to fetch transactions');
        
        const data = await res.json();
        setTransactions(data.results || []);
      } catch (err) {
        console.error("Failed to load transactions:", err);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [isLoggedIn]);

  const filteredTransactions = transactions
    .filter(t => filter === "all" || t.type === filter)
    .filter(t => t.description.toLowerCase().includes(searchTerm.toLowerCase()));

  const totalCredit = transactions
    .filter(t => t.type === "credit" && t.status === "success")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDebit = transactions
    .filter(t => t.type === "debit" && t.status === "success")
    .reduce((sum, t) => sum + t.amount, 0);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  // Show loading while hydrating
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-purple-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not logged in (redirect will trigger)
  if (!isLoggedIn) {
    return null;
  }

  // Loading transactions
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-teal-50">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <Loader className="w-12 h-12 text-purple-600 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Loading transactions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-teal-50">
      {/* HEADER */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 bg-white/90 backdrop-blur-xl z-50 border-b border-purple-100 shadow-sm"
      >
        <div className="flex items-center justify-between p-4 max-w-3xl mx-auto">
          <Link href="/account">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 hover:bg-purple-100 rounded-full transition"
            >
              <ArrowLeft className="w-6 h-6 text-purple-600" />
            </motion.button>
          </Link>
          <div className="text-center">
            <h1 className="text-xl font-black bg-gradient-to-r from-purple-600 to-teal-600 bg-clip-text text-transparent">
              Transaction History
            </h1>
            <p className="text-xs text-gray-600">{transactions.length} transactions</p>
          </div>
          <div className="w-10" />
        </div>
      </motion.div>

      <div className="p-4 pb-24 max-w-3xl mx-auto space-y-5">

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-4 text-white shadow-lg"
          >
            <div className="flex items-center gap-2 mb-2">
              <ArrowDownLeft className="w-5 h-5" />
              <p className="text-xs font-bold opacity-90">Money In</p>
            </div>
            <p className="text-2xl font-black">₦{totalCredit.toLocaleString('en-NG', {minimumFractionDigits: 2})}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gradient-to-br from-red-500 to-rose-500 rounded-2xl p-4 text-white shadow-lg"
          >
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpRight className="w-5 h-5" />
              <p className="text-xs font-bold opacity-90">Money Out</p>
            </div>
            <p className="text-2xl font-black">₦{totalDebit.toLocaleString('en-NG', {minimumFractionDigits: 2})}</p>
          </motion.div>
        </div>

        {/* SEARCH */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search transactions..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition bg-white"
          />
        </motion.div>

        {/* FILTERS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2 overflow-x-auto pb-2"
        >
          {[
            { value: "all", label: "All" },
            { value: "credit", label: "Money In" },
            { value: "debit", label: "Money Out" }
          ].map((btn) => (
            <button
              key={btn.value}
              onClick={() => setFilter(btn.value as any)}
              className={`px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition ${
                filter === btn.value
                  ? "bg-gradient-to-r from-purple-600 to-teal-600 text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </motion.div>

        {/* TRANSACTIONS LIST */}
        <div className="space-y-3">
          <AnimatePresence>
            {filteredTransactions.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-bold">No transactions found</p>
                <p className="text-sm text-gray-500 mt-2">Your wallet activity will appear here</p>
              </motion.div>
            ) : (
              filteredTransactions.map((transaction, i) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition"
                >
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      transaction.type === "credit"
                        ? "bg-green-100"
                        : "bg-red-100"
                    }`}>
                      {transaction.type === "credit" ? (
                        <ArrowDownLeft className="w-6 h-6 text-green-600" />
                      ) : (
                        <ArrowUpRight className="w-6 h-6 text-red-600" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">{transaction.description}</p>
                      <p className="text-xs text-gray-600 mt-1">{formatDate(transaction.created_at)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          transaction.status === "success"
                            ? "bg-green-100 text-green-700"
                            : transaction.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}>
                          {transaction.status.toUpperCase()}
                        </span>
                        {transaction.reference && (
                          <span className="text-xs text-gray-500">Ref: {transaction.reference.slice(-8)}</span>
                        )}
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right">
                      <p className={`text-xl font-black ${
                        transaction.type === "credit" ? "text-green-600" : "text-red-600"
                      }`}>
                        {transaction.type === "credit" ? "+" : "-"}₦{transaction.amount.toLocaleString('en-NG', {minimumFractionDigits: 2})}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* EXPORT BUTTON */}
        {filteredTransactions.length > 0 && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 bg-white text-purple-600 rounded-xl font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 mt-6"
          >
            <Download className="w-5 h-5" />
            Download Statement
          </motion.button>
        )}
      </div>
    </div>
  );
}
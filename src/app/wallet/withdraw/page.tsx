"use client";

import { ArrowLeft, Send, AlertCircle, CheckCircle, Loader, X } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/authStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

interface BankAccount {
  id: number;
  account_number: string;
  bank_name: string;
  account_holder_name: string;
  bank_code: string;
  is_verified: boolean;
}

export default function WithdrawPage() {
  const { user, isLoggedIn, isHydrated } = useAuth();
  const router = useRouter();
  
  const [walletBalance, setWalletBalance] = useState(0);
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  
  const [formData, setFormData] = useState({
    amount: "",
  });

  const [banks, setBanks] = useState<any[]>([]);
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [bankSearchInput, setBankSearchInput] = useState("");

  // REMOVED: Auth check moved to ProtectedRoute component
  // This prevents premature redirects and double-checking

  // Fetch wallet balance and bank account on mount
  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        
        // Fetch wallet balance
        const balanceRes = await fetch(`${API_URL}/api/wallet/balance/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (balanceRes.ok) {
          const balanceData = await balanceRes.json();
          setWalletBalance(balanceData.balance || 0);
        }

        // Fetch bank account
        const bankRes = await fetch(`${API_URL}/api/wallet/bank-account/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (bankRes.ok) {
          const bankData = await bankRes.json();
          setBankAccount(bankData);
        }

        // Fetch available banks
        const banksRes = await fetch(`${API_URL}/api/banks/`);
        if (banksRes.ok) {
          const banksData = await banksRes.json();
          setBanks(banksData);
        }

        setLoading(false);
      } catch (err) {
        console.error("Failed to load data:", err);
        setLoading(false);
      }
    };

    fetchData();
  }, [isLoggedIn]);

  const filteredBanks = banks.filter(bank =>
    bank.name.toLowerCase().includes(bankSearchInput.toLowerCase())
  );

  const validateForm = () => {
    if (!formData.amount.trim()) {
      setErrorMessage("Amount is required");
      return false;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setErrorMessage("Please enter a valid amount");
      return false;
    }

    if (amount > walletBalance) {
      setErrorMessage(`Insufficient balance. Your balance is ₦${walletBalance.toLocaleString('en-NG', {minimumFractionDigits: 2})}`);
      return false;
    }

    if (amount < 100) {
      setErrorMessage("Minimum withdrawal amount is ₦100");
      return false;
    }

    if (!bankAccount || !bankAccount.is_verified) {
      setErrorMessage("Please verify your bank account first");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const token = localStorage.getItem('access_token');
      const amount = parseFloat(formData.amount);

      const res = await fetch(`${API_URL}/api/wallet/withdraw/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || error.detail || 'Withdrawal failed');
      }

      const data = await res.json();
      
      setWalletBalance(data.new_balance || 0);
      setSuccessMessage(`✓ Withdrawal of ₦${amount.toLocaleString('en-NG', {minimumFractionDigits: 2})} initiated successfully! Processing time: 24-48 hours`);
      setFormData({ amount: "" });
      setErrorMessage("");

      setTimeout(() => {
        router.push('/wallet/history');
      }, 2000);
    } catch (err) {
      console.error("Error:", err);
      setErrorMessage(err instanceof Error ? err.message : 'Withdrawal failed');
    } finally {
      setSubmitting(false);
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

  // Loading data
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
          <p className="text-black/60">Loading...</p>
        </div>
      </div>
    );
  }

  // Bank account not verified
  if (!bankAccount || !bankAccount.is_verified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-teal-50">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-0 bg-white/90 backdrop-blur-xl z-40 border-b border-purple-100 shadow-sm"
        >
          <div className="flex items-center justify-between p-4 max-w-2xl mx-auto">
            <Link href="/account" className="flex items-center gap-2 text-purple-600 hover:text-purple-700">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-semibold">Back</span>
            </Link>
            <h1 className="text-xl font-black bg-gradient-to-r from-purple-600 to-teal-500 bg-clip-text text-transparent">
              Withdraw Funds
            </h1>
            <div className="w-10" />
          </div>
        </motion.div>

        <div className="p-6 pb-24 max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border-2 border-red-300 rounded-2xl p-6 text-center"
          >
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-red-900 mb-2">Bank Account Not Verified</h2>
            <p className="text-red-800 mb-6">
              You need to verify your bank account before you can withdraw funds.
            </p>
            <Link href="/wallet/bank-account">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-teal-600 text-white rounded-xl font-bold"
              >
                Verify Bank Account
              </motion.button>
            </Link>
          </motion.div>
        </div>
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
        <div className="flex items-center justify-between p-4 max-w-2xl mx-auto">
          <Link href="/account" className="flex items-center gap-2 text-purple-600 hover:text-purple-700">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">Back</span>
          </Link>
          <h1 className="text-xl font-black bg-gradient-to-r from-purple-600 to-teal-500 bg-clip-text text-transparent">
            Withdraw Funds
          </h1>
          <div className="w-10" />
        </div>
      </motion.div>

      <div className="p-4 pb-24 max-w-2xl mx-auto">
        {/* BALANCE CARD */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-600 via-purple-500 to-teal-500 rounded-2xl p-6 text-white shadow-2xl mb-6"
        >
          <p className="text-sm opacity-90 font-semibold mb-2">Available Balance</p>
          <p className="text-3xl font-black">₦{walletBalance.toLocaleString('en-NG', {minimumFractionDigits: 2})}</p>
        </motion.div>

        {/* SUCCESS MESSAGE */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 rounded-2xl p-4 flex gap-3 mb-6"
          >
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-green-800 text-sm">{successMessage}</p>
            </div>
          </motion.div>
        )}

        {/* ERROR MESSAGE */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3 mb-6"
          >
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="font-semibold text-red-800 text-sm">{errorMessage}</p>
          </motion.div>
        )}

        {/* BANK ACCOUNT INFO */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-md mb-6"
        >
          <p className="text-sm font-bold text-gray-700 mb-4">Withdrawal to</p>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-gray-600">Bank</p>
              <p className="font-bold text-gray-900">{bankAccount.bank_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Account Number</p>
              <p className="font-bold text-gray-900">****{bankAccount.account_number.slice(-4)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Account Holder</p>
              <p className="font-bold text-gray-900">{bankAccount.account_holder_name}</p>
            </div>
          </div>
          <Link href="/wallet/bank-account">
            <p className="text-sm text-primary font-bold mt-4 hover:underline cursor-pointer">Change Bank Account</p>
          </Link>
        </motion.div>

        {/* WITHDRAWAL FORM */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {/* WITHDRAWAL AMOUNT */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Withdrawal Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-2xl font-bold text-gray-600">₦</span>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, amount: e.target.value }));
                  setErrorMessage("");
                }}
                placeholder="0"
                min="100"
                max={walletBalance}
                step="0.01"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition"
                disabled={submitting}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Minimum: ₦100 | Maximum: ₦{walletBalance.toLocaleString('en-NG', {minimumFractionDigits: 2})}</p>
          </div>

          {/* INFO BOX */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-xs text-blue-800">
              <span className="font-bold">Processing Time:</span> Withdrawals typically take 24-48 hours to reflect in your bank account. You will receive a confirmation email once the transfer is complete.
            </p>
          </div>

          {/* SUBMIT BUTTON */}
          <motion.button
            whileHover={{ scale: submitting ? 1 : 1.02 }}
            whileTap={{ scale: submitting ? 1 : 0.98 }}
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-teal-500 text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Send className="w-5 h-5" />
                </motion.div>
                Processing...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Withdraw Now
              </>
            )}
          </motion.button>
        </motion.form>

        {/* SECURITY NOTE */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-200"
        >
          <p className="text-xs text-gray-600">
            <span className="font-bold">🔒 Security:</span> Your bank details are verified and encrypted. All withdrawals are processed securely.
          </p>
        </motion.div>
      </div>
    </>
  );
}
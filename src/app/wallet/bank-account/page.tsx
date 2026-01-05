"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Banknote, CheckCircle, AlertCircle, Loader } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/authStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

interface BankAccount {
  id: number;
  account_number: string;
  bank_name: string;
  account_holder_name: string;
  bank_code: string;
  is_verified: boolean;
}

export default function BankAccountSetupPage() {
  const router = useRouter();
  const { isLoggedIn, isHydrated, user } = useAuth();
  
  const [formData, setFormData] = useState({
    account_number: '',
    bank_code: '',
    bank_name: '',
    account_holder_name: ''
  });
  
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");
  const [banks, setBanks] = useState<any[]>([]);

  // Redirect if not logged in AFTER hydration
  useEffect(() => {
    if (isHydrated && !isLoggedIn) {
      router.push("/auth");
    }
  }, [isHydrated, isLoggedIn, router]);

  // Fetch existing bank account and available banks
  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        
        // Fetch existing account
        const accountRes = await fetch(`${API_URL}/api/wallet/bank-account/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (accountRes.ok) {
          const data = await accountRes.json();
          setBankAccount(data);
          setFormData(data);
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

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-fill bank name when bank code changes
    if (name === 'bank_code') {
      const selectedBank = banks.find(b => b.code === value);
      if (selectedBank) {
        setFormData(prev => ({
          ...prev,
          bank_name: selectedBank.name
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.account_number || !formData.bank_code || !formData.account_holder_name) {
      showToast("Please fill all fields");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('access_token');
      
      const method = bankAccount ? 'PUT' : 'POST';
      const endpoint = bankAccount ? `${API_URL}/api/wallet/bank-account/${bankAccount.id}/` : `${API_URL}/api/wallet/bank-account/`;
      
      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || 'Failed to save bank account');
      }

      const data = await res.json();
      setBankAccount(data);
      showToast("✓ Bank account saved successfully!");
      
      setTimeout(() => router.push('/account'), 1500);
    } catch (err) {
      console.error("Error:", err);
      showToast(err instanceof Error ? err.message : "Failed to save bank account");
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
          <Loader className="w-12 h-12 text-purple-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-teal-50">
      {/* TOAST */}
      {toast && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 60, opacity: 1 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-lg z-50 font-medium text-sm text-white bg-green-500"
        >
          {toast}
        </motion.div>
      )}

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
              Bank Account
            </h1>
            <p className="text-xs text-gray-600">For withdrawals</p>
          </div>
          <div className="w-10" />
        </div>
      </motion.div>

      <div className="p-6 pb-24 max-w-3xl mx-auto space-y-6">

        {/* STATUS CARD */}
        {bankAccount && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl p-6 text-white ${
              bankAccount.is_verified
                ? 'bg-gradient-to-br from-green-500 to-emerald-500'
                : 'bg-gradient-to-br from-yellow-500 to-orange-500'
            } shadow-xl`}
          >
            <div className="flex items-center gap-3 mb-2">
              {bankAccount.is_verified ? (
                <CheckCircle className="w-6 h-6" />
              ) : (
                <AlertCircle className="w-6 h-6" />
              )}
              <p className="font-bold text-lg">
                {bankAccount.is_verified ? 'Verified' : 'Pending Verification'}
              </p>
            </div>
            <p className="text-sm opacity-90">
              {bankAccount.is_verified
                ? 'Your account is verified. You can now withdraw funds.'
                : 'Your account is under verification. This usually takes 24-48 hours.'}
            </p>
          </motion.div>
        )}

        {/* FORM */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-lg"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Account Holder Name */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Account Holder Name
              </label>
              <input
                type="text"
                name="account_holder_name"
                value={formData.account_holder_name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Must match your bank account name</p>
            </div>

            {/* Bank Selection */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Select Bank
              </label>
              <select
                name="bank_code"
                value={formData.bank_code}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition"
                required
              >
                <option value="">-- Select a bank --</option>
                {banks.map((bank) => (
                  <option key={bank.code} value={bank.code}>
                    {bank.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Account Number */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Account Number
              </label>
              <input
                type="text"
                name="account_number"
                value={formData.account_number}
                onChange={handleInputChange}
                placeholder="Enter your 10-digit account number"
                maxLength={10}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition font-mono"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Should be exactly 10 digits</p>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={submitting}
              className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 ${
                submitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-teal-600 hover:shadow-lg transition'
              }`}
            >
              {submitting ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Banknote className="w-5 h-5" />
                  Save Bank Account
                </>
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* INFO CARD */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4"
        >
          <p className="text-sm text-blue-900 font-bold mb-2">ℹ️ Important Information</p>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Account name must match your bank records exactly</li>
            <li>• Verification takes 24-48 hours</li>
            <li>• You can only withdraw to a verified account</li>
            <li>• Minimum withdrawal: ₦100</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
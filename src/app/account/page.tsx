"use client";

import { User, Package, Heart, Settings, HelpCircle, LogOut, ChevronRight, Store, Clock, ArrowRight, Wallet, Plus, Eye, EyeOff, History, Send, Banknote, AlertCircle, Loader } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import ThemeToggle from "@/components/ThemeToggle";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

interface BankAccount {
  id: number;
  account_number: string;
  bank_name: string;
  account_holder_name: string;
  is_verified: boolean;
}

export default function AccountPage() {
  const router = useRouter();
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [sellerStatus, setSellerStatus] = useState<"none" | "pending" | "approved">("none");
  const [walletBalance, setWalletBalance] = useState(0);
  const [showBalance, setShowBalance] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthLoading(false);

      // CRITICAL FIX: Don't redirect immediately - let ProtectedRoute handle it
      // This prevents premature redirects while auth is still loading
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (authLoading || !firebaseUser) return;

    const fetchData = async () => {
      try {
        const idToken = await firebaseUser.getIdToken();

        // 1. Wallet balance
        const walletRes = await fetch(`${API_URL}/api/wallet/balance/`, {
          headers: { 'Authorization': `Bearer ${idToken}` }
        });
        if (walletRes.ok) {
          const walletData = await walletRes.json();
          setWalletBalance(walletData.balance || 0);
        }

        // 2. Bank account
        const bankRes = await fetch(`${API_URL}/api/wallet/bank-account/`, {
          headers: { 'Authorization': `Bearer ${idToken}` }
        });
        if (bankRes.ok) {
          const bankData = await bankRes.json();
          setBankAccount(bankData);
        }

        // 3. Fetch user profile to determine seller status
        const profileRes = await fetch(`${API_URL}/api/auth/profile/`, {
          headers: { 'Authorization': `Bearer ${idToken}` }
        });

        if (profileRes.ok) {
          const profileData = await profileRes.json();

          // Logic to determine seller status
          if (profileData.user_type === "vendor" && profileData.is_verified_vendor === true) {
            setSellerStatus("approved");
          } else if (
            profileData.seller_application?.status === "pending" ||
            profileData.user_type === "vendor" // in case verified but flag not fully updated
          ) {
            setSellerStatus("pending");
          } else {
            setSellerStatus("none");
          }
        } else {
          console.error("Failed to fetch profile:", profileRes.status);
          setSellerStatus("none");
        }

        setLoading(false);
      } catch (err) {
        console.error("Failed to load data:", err);
        setLoading(false);
      }
    };

    fetchData();
  }, [firebaseUser, authLoading]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const fadeInUp = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5 } };
  const cardHover = { whileHover: { y: -4, scale: 1.02 }, whileTap: { scale: 0.98 } };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-purple-600 dark:text-purple-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
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
        className="sticky top-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl z-40 border-b border-purple-100 dark:border-gray-800 shadow-sm"
      >
        <div className="flex items-center justify-between p-4 max-w-4xl mx-auto">
          <Link href="/home" className="flex items-center">
            <Image
              src="/images/logo-1.jpg"
              alt="StudEx Logo"
              width={140}
              height={40}
              className="h-10 w-auto object-contain"
              priority
            />
          </Link>
          <h1 className="text-xl font-black bg-gradient-to-r from-purple-600 to-teal-500 bg-clip-text text-transparent">
            My Account
          </h1>
          <ThemeToggle />
        </div>
      </motion.div>

      <div className="p-4 pb-24 space-y-5 max-w-3xl mx-auto bg-[#FFF8F0] dark:bg-gray-950 min-h-screen">
        {/* PROFILE CARD */}
        <motion.div {...fadeInUp} className="bg-gradient-to-br from-purple-500/10 via-teal-500/10 to-white dark:from-purple-500/20 dark:via-teal-500/20 dark:to-gray-800 backdrop-blur-lg rounded-2xl p-5 shadow-lg border border-white/30 dark:border-gray-700/30">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-teal-500 rounded-full flex items-center justify-center text-white text-xl font-black shadow-lg">
                {firebaseUser?.displayName?.[0]?.toUpperCase() || firebaseUser?.email?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
            </div>
            <div className="flex-1">
              <p className="text-lg font-black bg-gradient-to-r from-purple-600 to-teal-500 bg-clip-text text-transparent">
                {firebaseUser?.displayName || "Campus Hustler"}
              </p>
              <p className="text-sm font-medium text-teal-600 dark:text-teal-400">{firebaseUser?.email || "user@pau.edu.ng"}</p>
            </div>
          </div>
        </motion.div>

        {/* WALLET CARD */}
        <motion.div {...fadeInUp} className="bg-gradient-to-br from-purple-600 via-purple-500 to-teal-500 rounded-2xl p-6 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wallet className="w-6 h-6" />
                <span className="font-bold text-sm opacity-90">Wallet Balance</span>
              </div>
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowBalance(!showBalance)} className="p-2 hover:bg-white/20 rounded-full transition">
                {showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </motion.button>
            </div>
            <div className="mb-6">
              <p className="text-4xl font-black">
                {showBalance ? `₦${walletBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}` : "₦••••••"}
              </p>
              <p className="text-sm opacity-80 mt-1">Available balance</p>
            </div>
            <div className="flex gap-3">
              <Link href="/wallet/fund" className="flex-1">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full bg-white text-purple-600 py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2">
                  <Plus className="w-5 h-5" /> Fund Wallet
                </motion.button>
              </Link>
              <Link href="/wallet/withdraw">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-white/20 backdrop-blur-md text-white px-4 py-3 rounded-xl font-bold shadow-lg hover:bg-white/30 transition">
                  <Send className="w-5 h-5" />
                </motion.button>
              </Link>
              <Link href="/wallet/history">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-white/20 backdrop-blur-md text-white px-4 py-3 rounded-xl font-bold shadow-lg hover:bg-white/30 transition">
                  <History className="w-5 h-5" />
                </motion.button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* BANK ACCOUNT CARD */}
        <motion.div {...fadeInUp} className={`rounded-2xl p-4 ${bankAccount?.is_verified ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800' : 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${bankAccount?.is_verified ? 'bg-green-100 dark:bg-green-900/40' : 'bg-yellow-100 dark:bg-yellow-900/40'}`}>
                {bankAccount?.is_verified ? <Banknote className="w-5 h-5 text-green-600 dark:text-green-400" /> : <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />}
              </div>
              <div>
                <p className={`font-bold text-sm ${bankAccount?.is_verified ? 'text-green-800 dark:text-green-300' : 'text-yellow-800 dark:text-yellow-300'}`}>
                  {bankAccount?.is_verified ? 'Bank Account Verified' : 'Bank Account Required'}
                </p>
                {bankAccount ? (
                  <p className={`text-xs ${bankAccount.is_verified ? 'text-green-700 dark:text-green-400' : 'text-yellow-700 dark:text-yellow-400'}`}>
                    {bankAccount.bank_name} - ****{bankAccount.account_number.slice(-4)}
                  </p>
                ) : (
                  <p className="text-xs text-yellow-700 dark:text-yellow-400">Add your bank account to withdraw funds</p>
                )}
              </div>
            </div>
            <Link href="/wallet/bank-account">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className={`px-4 py-2 rounded-full text-sm font-bold text-white ${bankAccount?.is_verified ? 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600' : 'bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-600'}`}>
                {bankAccount ? 'Update' : 'Add'}
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* APPROVED SELLER CARD */}
        {sellerStatus === "approved" && (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 border border-teal-200 dark:border-teal-800 rounded-2xl p-4 flex items-center gap-3">
            <Store className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <div className="flex-1">
              <p className="font-bold text-teal-800 dark:text-teal-300 text-sm">Verified Seller</p>
              <p className="text-xs text-teal-700 dark:text-teal-400">Start listing products now!</p>
            </div>
            <Link href="/seller">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-teal-600 dark:bg-teal-700 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg hover:bg-teal-700 dark:hover:bg-teal-600">
                Dashboard
              </motion.button>
            </Link>
          </motion.div>
        )}

        {/* PENDING SELLER CARD (optional — remove if you don't want it) */}
        {sellerStatus === "pending" && (
          <motion.div {...fadeInUp} className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-300 dark:border-yellow-800 rounded-2xl p-5 flex items-center gap-4">
            <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-yellow-800 dark:text-yellow-300">Seller Application Pending</p>
              <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                We're reviewing your application. You'll be notified soon!
              </p>
            </div>
          </motion.div>
        )}

        {/* MENU ITEMS */}
        <motion.div {...fadeInUp} className="space-y-3">
          {[
            { href: "/account/orders", icon: Package, label: "My Orders", color: "from-purple-500 to-purple-600" },
            { href: "/wishlist", icon: Heart, label: "Wishlist", color: "from-pink-500 to-rose-500" },
            { href: "/account/address", icon: Settings, label: "Address Book", color: "from-indigo-500 to-blue-600" },
            { href: "/help", icon: HelpCircle, label: "Help & Support", color: "from-teal-500 to-cyan-600" },
          ].map((item, i) => (
            <motion.div key={item.href} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
              <Link href={item.href}>
                <motion.div {...cardHover} className="bg-white dark:bg-gray-800 rounded-2xl p-4 flex items-center justify-between shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center shadow-md`}>
                      <item.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{item.label}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* BECOME A SELLER — only if status is none */}
        {sellerStatus === "none" && (
          <motion.div {...fadeInUp} className="bg-gradient-to-br from-purple-600 via-purple-500 to-teal-500 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <Store className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-lg font-black">Become a Seller</p>
                    <p className="text-xs opacity-90">Earn on campus. List now.</p>
                  </div>
                </div>
                <Link href="/seller/onboarding">
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-white text-purple-600 px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2">
                    Start <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* LOGOUT BUTTON */}
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleLogout} className="w-full mt-6 py-4 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-2xl font-bold text-base shadow-lg flex items-center justify-center gap-3">
          <LogOut className="w-5 h-5" />
          Logout
        </motion.button>
      </div>
    </>
  );
}
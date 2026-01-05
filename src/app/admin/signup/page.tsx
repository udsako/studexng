// src/app/admin/signup/page.tsx
"use client";

import { Shield, Mail, Lock, User, Eye, EyeOff, ArrowLeft, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminSignup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const adminExists = localStorage.getItem("isAdmin") === "true";
    const currentPath = typeof window !== "undefined" ? window.location.pathname : "";

    if (adminExists && currentPath !== "/admin/signup") {
      router.replace("/admin");
    }
  }, [router]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!name || !email || !password) return setMessage("All fields are required");
    if (!email.endsWith("@studex.com")) return setMessage("Admin email must end with @studex.com");
    if (password.length < 6) return setMessage("Password must be at least 6 characters");

    localStorage.setItem("isAdmin", "true");
    localStorage.setItem("adminName", name.trim());
    localStorage.setItem("adminEmail", email.toLowerCase());

    setIsSuccess(true);
    setTimeout(() => router.push("/admin/login"), 2500);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      <div className="absolute top-0 left-0 w-96 h-96 bg-purple-800/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-800/20 rounded-full blur-3xl" />

      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >

        {/* Back button */}
        <motion.div whileTap={{ scale: 0.9 }} className="mb-10 w-fit">
          <button
            onClick={() => router.back()}
            className="text-white/70 hover:text-white flex items-center gap-2 text-sm font-medium transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="bg-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl p-10 border border-white/10"
        >

          {/* Header */}
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-600 to-teal-600 rounded-2xl flex items-center justify-center shadow-2xl mb-6"
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Shield className="w-14 h-14 text-white" />
              </motion.div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-black text-white tracking-tight"
            >
              Create First Admin
            </motion.h1>

            <p className="text-white/70 text-lg mt-2">Platform setup • One-time only</p>
          </div>

          {/* SUCCESS STATE */}
          {isSuccess ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center py-12"
            >
              <motion.div
                initial={{ scale: 0.6 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 160, damping: 12 }}
                className="w-24 h-24 mx-auto mb-6 bg-emerald-500/20 rounded-full flex items-center justify-center"
              >
                <CheckCircle className="w-14 h-14 text-emerald-400" />
              </motion.div>

              <h2 className="text-2xl font-bold text-white mb-3">Admin Account Created</h2>
              <p className="text-white/70">
                Welcome, <span className="font-bold text-purple-300">{name}</span>
              </p>
              <p className="text-white/60 text-sm mt-6">Redirecting to login...</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSignup} className="space-y-6">

              {/* Full Name */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <label className="text-white/90 text-sm font-semibold flex items-center gap-2 mb-3">
                  <User className="w-5 h-5" /> Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Victor Osahon"
                  required
                  className="w-full px-5 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-4 focus:ring-purple-500/50 transition"
                />
              </motion.div>

              {/* Email */}
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <label className="text-white/90 text-sm font-semibold flex items-center gap-2 mb-3">
                  <Mail className="w-5 h-5" /> Admin Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@studex.com"
                  required
                  className="w-full px-5 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-4 focus:ring-purple-500/50 transition"
                />
              </motion.div>

              {/* Password */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                <label className="text-white/90 text-sm font-semibold flex items-center gap-2 mb-3">
                  <Lock className="w-5 h-5" /> Password
                </label>
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  required
                  className="w-full px-5 py-4 pr-14 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-4 focus:ring-purple-500/50 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-11 text-white/60 hover:text-white"
                >
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </motion.div>

              {/* Error Message */}
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/20 border border-red-500/40 text-red-300 px-4 py-3 rounded-xl text-center text-sm"
                >
                  {message}
                </motion.div>
              )}

              {/* Submit Button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="w-full py-5 rounded-xl font-black text-white text-lg shadow-xl transition-all hover:shadow-purple-600/40"
                style={{ background: "linear-gradient(to right, #7C3AED, #14B8A6)" }}
              >
                Create Admin Account
              </motion.button>
            </form>
          )}

          {!isSuccess && (
            <div className="mt-10 text-center">
              <p className="text-white/60 text-sm">
                Already have admin access?{" "}
                <Link
                  href="/admin/login"
                  className="font-bold text-purple-300 hover:text-purple-100 underline transition"
                >
                  Login here
                </Link>
              </p>
            </div>
          )}

          <p className="text-center text-white/40 text-xs mt-10">
            © 2025 StudEx • First Admin Setup • Restricted
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

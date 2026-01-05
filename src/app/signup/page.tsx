// src/app/signup/page.tsx
"use client";

import { User, Phone, MapPin, Lock, Eye, EyeOff, Mail, IdCard, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authStore";
import { motion } from "framer-motion";
import Image from "next/image";

export default function UserSignup() {
  const [showPass, setShowPass] = useState(false);
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState("");
  const [sentOtp, setSentOtp] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    username: "",
    identifier: "", // Matric OR Student Email
    phone: "",
    hostel: "",
    password: "",
  });

  const { login } = useAuth();
  const router = useRouter();

  const hostels = ["Cedar", "Trezadel", "Trinity", "Pearl", "Redwood", "Cooperative Quenns", "Aster Hall", "Cooperative kings", "Pod", "Faith", "Amethyst", "Emerald", "EDC"];

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const generateOTP = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setSentOtp(code);
    alert(`Your OTP: ${code}`);
    setMessage("OTP sent to your phone!");
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (step === 1) {
      if (!form.username || !form.identifier || !form.phone || !form.hostel || !form.password) {
        setMessage("Please fill all fields");
        return;
      }
      generateOTP();
      setStep(2);
    } else {
      if (otp === sentOtp) {
        login({ username: form.username, identifier: form.identifier });
        localStorage.setItem("userProfile", JSON.stringify(form));
        setMessage("Welcome to StudEx!");
        setTimeout(() => router.push("/home"), 1500);
      } else {
        setMessage("Wrong OTP. Try again.");
      }
    }
  };

  const isEmail = form.identifier.includes("@");
  const isMatric = form.identifier.match(/^(PAU\/\d{4}\/\d{5}|\d{4}\/\d{4})$/i);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-teal-50 flex items-center justify-center p-4">
      
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="absolute top-6 left-6 z-50 text-purple-600 hover:bg-purple-50 p-3 rounded-full transition-all shadow-lg bg-white/80 backdrop-blur"
      >
        <ArrowLeft className="w-7 h-7" />
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 w-full max-w-md border border-purple-100"
      >
        {/* OFFICIAL STUDEX LOGO */}
        <div className="text-center mb-8">
          <div className="mx-auto w-48 h-20 relative">
            <Image
              src="/images/logo-2.jpg"
              alt="StudEx Official Logo"
              fill
              className="object-contain drop-shadow-2xl"
              priority
            />
          </div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-purple-600 to-teal-500 bg-clip-text text-transparent mt-4">
            {step === 1 ? "Create Account" : "Verify Phone"}
          </h1>
          <p className="text-sm text-gray-600 mt-2 font-medium">
            {step === 1 ? "Join the PAU movement in 30 seconds" : "Enter 6-digit code"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {step === 1 ? (
            <>
              {/* USERNAME FIRST */}
              <div>
                <label className="text-sm font-bold text-purple-700 flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-purple-600" />
                  Username
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-4 text-purple-500 font-bold text-lg">@</span>
                  <input
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    placeholder="chinedu_tech"
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-purple-200 focus:border-purple-500 focus:outline-none transition-all text-lg font-medium"
                    required
                  />
                </div>
              </div>

              {/* MATRIC OR EMAIL — SECOND */}
              <div>
                <label className="text-sm font-bold text-purple-700 flex items-center gap-2 mb-2">
                  {isEmail || form.identifier.includes("@") ? (
                    <Mail className="w-4 h-4 text-purple-600" />
                  ) : (
                    <IdCard className="w-4 h-4 text-purple-600" />
                  )}
                  Matric Number or Student Email
                </label>
                <input
                  type="text"
                  name="identifier"
                  value={form.identifier}
                  onChange={handleChange}
                  placeholder="PAU/2021/12345  or  john.doe@pau.edu.ng"
                  className="w-full px-4 py-4 rounded-2xl border-2 border-purple-200 focus:border-purple-500 focus:outline-none transition-all text-lg font-medium"
                  required
                />
                <p className="text-xs text-purple-600 mt-2 font-medium">
                  {form.identifier === "" && "Enter your matric or student email"}
                  {isMatric && "Valid Matric Number"}
                  {isEmail && "Valid Student Email"}
                  {form.identifier && !isEmail && !isMatric && "Please use correct format"}
                </p>
              </div>

              {/* PHONE */}
              <div>
                <label className="text-sm font-bold text-purple-700 flex items-center gap-2 mb-2">
                  <Phone className="w-4 h-4 text-purple-600" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="08012345678"
                  className="w-full px-4 py-4 rounded-2xl border-2 border-purple-200 focus:border-purple-500 focus:outline-none transition-all text-lg font-medium"
                  required
                />
              </div>

              {/* HOSTEL */}
              <div>
                <label className="text-sm font-bold text-purple-700 flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-purple-600" />
                  Hostel / Location
                </label>
                <select
                  name="hostel"
                  value={form.hostel}
                  onChange={handleChange}
                  className="w-full px-4 py-4 rounded-2xl border-2 border-purple-200 focus:border-purple-500 focus:outline-none transition-all text-lg font-medium bg-white"
                  required
                >
                  <option value="">Select your hostel</option>
                  {hostels.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              {/* PASSWORD */}
              <div>
                <label className="text-sm font-bold text-purple-700 flex items-center gap-2 mb-2">
                  <Lock className="w-4 h-4 text-purple-600" />
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Create strong password"
                    className="w-full pr-12 pl-4 py-4 rounded-2xl border-2 border-purple-200 focus:border-purple-500 focus:outline-none transition-all text-lg font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-4 text-purple-500 hover:text-purple-700"
                  >
                    {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* OTP STEP */
            <div className="space-y-8">
              <div className="text-center p-6 bg-purple-50 rounded-2xl border-2 border-purple-200">
                <p className="text-sm font-bold text-purple-800">We sent a code to</p>
                <p className="text-xl font-black text-purple-900 mt-1">{form.phone}</p>
              </div>

              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="w-full text-center text-5xl font-black tracking-widest py-8 rounded-2xl border-4 border-purple-300 focus:border-purple-600 focus:outline-none bg-purple-50"
                maxLength={6}
                required
              />

              <button
                type="button"
                onClick={generateOTP}
                className="text-purple-600 font-bold underline text-sm w-full text-center hover:text-purple-800"
              >
                Resend Code
              </button>
            </div>
          )}

          {/* MESSAGE */}
          {message && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-center font-bold text-lg ${
                message.includes("Welcome") || message.includes("sent")
                  ? "text-teal-600"
                  : "text-red-600"
              }`}
            >
              {message}
            </motion.p>
          )}

          {/* SUBMIT BUTTON */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full py-5 rounded-2xl font-black text-white text-xl shadow-2xl bg-gradient-to-r from-purple-600 via-purple-500 to-teal-500 hover:from-purple-700 hover:to-teal-600 transition-all"
          >
            {step === 1 ? "Send Code" : "Complete Signup"}
          </motion.button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-8 font-medium">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="font-black text-purple-600 underline hover:text-purple-800 bg-transparent border-none cursor-pointer"
          >
            Login here
          </button>
        </p>
      </motion.div>
    </div>
  );
}
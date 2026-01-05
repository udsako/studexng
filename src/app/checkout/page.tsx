// src/app/checkout/page.tsx  ← WITH ESCROW SYSTEM
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  Package, CreditCard, ArrowLeft, Shield, Lock, Sparkles, Check, Calendar, MapPin, Clock, Wallet, Plus
} from "lucide-react";
import { useCartStore } from "@/lib/cartStore";
import { useBookingStore } from "@/lib/bookingStore";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authStore";
import dynamic from "next/dynamic";

const PaystackHook = dynamic(
  () => import("react-paystack").then((mod) => mod.usePaystackPayment),
  { ssr: false }
);

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { cart, clearCart } = useCartStore();
  const { booking, clearBooking } = useBookingStore();

  const isServiceBooking = !!booking && cart.length === 0;
  const isFoodOrder = cart.length > 0;

  const foodTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const serviceTotal = booking?.total || 0;
  const finalTotal = isServiceBooking ? serviceTotal : foodTotal;
  const finalTotalInKobo = finalTotal * 100;

  const [isPaystackReady, setIsPaystackReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "card">("card");
  const [walletBalance, setWalletBalance] = useState(0);

  const config = {
    reference: new Date().getTime().toString(),
    email: user?.email || "user@studex.com",
    amount: finalTotalInKobo,
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
    metadata: isServiceBooking
      ? {
          type: "service_booking",
          provider: booking.providerName,
          date: booking.date,
          time: booking.time,
        }
      : { type: "food_order" },
  };

  const initializePaymentRef = useRef<any>(null);

  useEffect(() => {
    // Load wallet balance
    const balance = localStorage.getItem("walletBalance");
    setWalletBalance(balance ? parseFloat(balance) : 0);

    const loadPaystack = async () => {
      if (typeof window === "undefined") return;
      const PaystackFunction = await import("react-paystack").then(
        (mod) => mod.usePaystackPayment
      );
      initializePaymentRef.current = PaystackFunction(config);
      setIsPaystackReady(true);
    };
    loadPaystack();
  }, [finalTotalInKobo]);

  // CREATE ORDER IN BACKEND API
  const createOrder = async (paymentRef: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

      // For each cart item, create an order
      const orderPromises = cart.map(item =>
        fetch(`${API_URL}/api/orders/orders/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            listing_id: item.id,
            // Backend will automatically get amount from listing
          })
        })
      );

      const responses = await Promise.all(orderPromises);

      // Check if all requests succeeded
      for (const response of responses) {
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create order');
        }
      }

      const orders = await Promise.all(
        responses.map(r => r.json())
      );

      // Return first order ID for redirect (or you can show all orders)
      return orders[0].id;

    } catch (error) {
      console.error('Failed to create order:', error);
      throw error;
    }
  };

  const handleCardPayment = useCallback(() => {
    if (!isPaystackReady || !initializePaymentRef.current) {
      alert("Paystack loading...");
      return;
    }

    setIsProcessing(true);

    initializePaymentRef.current({
      onSuccess: async (ref: any) => {
        try {
          // Create order in escrow via backend API
          const orderId = await createOrder(ref.reference);

          // Clear cart/booking
          if (isFoodOrder) clearCart();
          if (isServiceBooking) clearBooking();
          localStorage.removeItem("studex_cart");

          // Redirect to order confirmation
          router.push(`/order-confirmation/${orderId}`);
        } catch (error) {
          console.error('Order creation failed:', error);
          alert('Failed to create order. Please contact support with your payment reference: ' + ref.reference);
          setIsProcessing(false);
        }
      },
      onClose: () => {
        setIsProcessing(false);
      },
    });
  }, [isPaystackReady, isFoodOrder, isServiceBooking, clearCart, clearBooking, finalTotal, booking, cart]);

  const handleWalletPayment = async () => {
    if (walletBalance < finalTotal) {
      alert(`Insufficient balance. You need ₦${(finalTotal - walletBalance).toLocaleString()} more.`);
      return;
    }

    setIsProcessing(true);

    try {
      // Create order in escrow via backend API
      const orderId = await createOrder(`WALLET-${Date.now()}`);

      // Deduct from wallet (temporary - will be replaced with wallet API)
      const newBalance = walletBalance - finalTotal;
      localStorage.setItem("walletBalance", newBalance.toString());

      // Clear cart/booking
      if (isFoodOrder) clearCart();
      if (isServiceBooking) clearBooking();
      localStorage.removeItem("studex_cart");

      // Redirect to order confirmation
      router.push(`/order-confirmation/${orderId}`);
    } catch (error) {
      console.error('Order creation failed:', error);
      alert('Failed to create order. Please try again.');
      setIsProcessing(false);
    }
  };

  const handlePayment = () => {
    if (paymentMethod === "wallet") {
      handleWalletPayment();
    } else {
      handleCardPayment();
    }
  };

  // EMPTY STATE
  if (!isFoodOrder && !isServiceBooking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-teal-50 flex items-center justify-center p-6">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
            <Package className="w-32 h-32 text-purple-300 mx-auto mb-8" />
          </motion.div>
          <h2 className="text-4xl font-black bg-gradient-to-r from-purple-600 to-teal-600 bg-clip-text text-transparent mb-4">
            Nothing to checkout
          </h2>
          <p className="text-gray-600 mb-8">Go book a service or add food to cart!</p>
          <Link href="/home">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="px-12 py-5 bg-gradient-to-r from-purple-600 to-teal-600 text-white font-black text-xl rounded-full shadow-2xl">
              Explore StudEx
            </motion.button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      {/* TOP BAR */}
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 bg-white/95 backdrop-blur-xl z-50 border-b border-purple-100 shadow-lg">
        <div className="flex items-center justify-between px-6 py-5 max-w-4xl mx-auto">
          <Link href={isServiceBooking ? `/lashes/${booking?.providerId}` : "/cart"}>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              className="p-2 hover:bg-purple-100 rounded-full transition">
              <ArrowLeft className="w-7 h-7 text-purple-600" />
            </motion.div>
          </Link>
          <div className="text-center">
            <h1 className="text-2xl font-black bg-gradient-to-r from-purple-600 to-teal-600 bg-clip-text text-transparent">
              Secure Checkout
            </h1>
            <p className="text-xs text-gray-500 flex items-center gap-1 justify-center">
              <Shield className="w-3 h-3" /> Money held safely in escrow
            </p>
          </div>
          <div className="w-10" />
        </div>
      </motion.div>

      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-teal-50 px-6 pt-8 pb-32 max-w-4xl mx-auto">

        {/* ORDER SUMMARY */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white mb-6">

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
              {isServiceBooking ? <Calendar className="w-7 h-7 text-purple-600" /> : <Package className="w-7 h-7 text-purple-600" />}
              {isServiceBooking ? "Your Appointment" : "Your Order"}
            </h2>
            <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}>
              <Sparkles className="w-6 h-6 text-teal-500" />
            </motion.div>
          </div>

          <div className="space-y-5">

            {/* SERVICE BOOKING DISPLAY */}
            {isServiceBooking && booking && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-r from-purple-100 to-teal-100 rounded-3xl p-8">
                <div className="flex items-center gap-5 mb-6">
                  <div className="relative w-24 h-24 rounded-3xl overflow-hidden ring-4 ring-purple-200">
                    <Image src={`/images/${booking.providerImg}`} alt={booking.providerName} fill className="object-cover" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black">{booking.providerName}</h3>
                    <p className="text-purple-700 font-bold">Service Booking</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-lg">
                  <div className="flex items-center gap-3"><Calendar className="w-5 h-5" /> <span className="font-medium">{booking.date}</span></div>
                  <div className="flex items-center gap-3"><Clock className="w-5 h-5" /> <span className="font-medium">{booking.time}</span></div>
                  <div className="flex items-center gap-3 col-span-2"><MapPin className="w-5 h-5" /> <span className="font-medium">{booking.location}</span></div>
                </div>
              </motion.div>
            )}

            {/* FOOD CART DISPLAY */}
            {isFoodOrder && cart.map((item, i) => (
              <motion.div key={item.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-teal-50 rounded-2xl">
                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-lg">{item.title}</p>
                  <p className="text-sm text-purple-600 font-medium">×{item.quantity}</p>
                </div>
                <p className="font-black text-xl text-purple-600">₦{(item.price * item.quantity).toLocaleString()}</p>
              </motion.div>
            ))}

            {/* TOTAL */}
            <div className="border-t-2 border-purple-200 pt-6 mt-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600 font-medium">Service Fee</span>
                <span className="text-green-600 font-bold">FREE</span>
              </div>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                className="bg-gradient-to-r from-purple-600 to-teal-600 rounded-2xl p-6 text-white">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold">Total Amount</span>
                  <span className="text-4xl font-black">₦{finalTotal.toLocaleString()}</span>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* PAYMENT METHODS - WITH WALLET */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="space-y-4 mb-6">
          
          <h2 className="text-xl font-black text-gray-900">Choose Payment Method</h2>

          {/* WALLET OPTION */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setPaymentMethod("wallet")}
            className={`w-full rounded-2xl p-6 transition-all ${
              paymentMethod === "wallet"
                ? "bg-gradient-to-r from-purple-600 to-teal-600 text-white shadow-xl"
                : "bg-white text-gray-800 shadow-md"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Wallet className="w-8 h-8" />
                <div className="text-left">
                  <p className="text-xl font-black">Pay with Wallet</p>
                  <p className={`text-sm font-medium ${paymentMethod === "wallet" ? "opacity-90" : "text-gray-600"}`}>
                    Balance: ₦{walletBalance.toLocaleString()}
                  </p>
                </div>
              </div>
              {walletBalance < finalTotal && (
                <div className="text-right">
                  <Link href="/wallet/fund">
                    <span className={`text-xs font-bold flex items-center gap-1 ${
                      paymentMethod === "wallet" ? "text-white" : "text-purple-600"
                    }`}>
                      <Plus className="w-4 h-4" /> Fund
                    </span>
                  </Link>
                  <p className="text-xs mt-1">Need ₦{(finalTotal - walletBalance).toLocaleString()} more</p>
                </div>
              )}
              {paymentMethod === "wallet" && walletBalance >= finalTotal && (
                <Check className="w-8 h-8" />
              )}
            </div>
          </motion.button>

          {/* CARD OPTION */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setPaymentMethod("card")}
            className={`w-full rounded-2xl p-6 transition-all ${
              paymentMethod === "card"
                ? "bg-gradient-to-r from-purple-600 to-teal-600 text-white shadow-xl"
                : "bg-white text-gray-800 shadow-md"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <CreditCard className="w-8 h-8" />
                <div className="text-left">
                  <p className="text-xl font-black">Pay with Card</p>
                  <p className={`text-sm font-medium ${paymentMethod === "card" ? "opacity-90" : "text-gray-600"}`}>
                    Visa, Mastercard, Verve
                  </p>
                </div>
              </div>
              {paymentMethod === "card" && <Check className="w-8 h-8" />}
            </div>
          </motion.button>
        </motion.div>

        {/* SECURITY BADGES */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white mb-6">
          <div className="flex items-center justify-center gap-8 text-center">
            <div className="flex flex-col items-center">
              <Shield className="w-10 h-10 text-green-600 mb-2" />
              <p className="text-xs font-bold text-gray-700">Secure</p>
            </div>
            <div className="flex flex-col items-center">
              <Lock className="w-10 h-10 text-blue-600 mb-2" />
              <p className="text-xs font-bold text-gray-700">Encrypted</p>
            </div>
            <div className="flex flex-col items-center">
              <Check className="w-10 h-10 text-purple-600 mb-2" />
              <p className="text-xs font-bold text-gray-700">Escrow</p>
            </div>
          </div>
        </motion.div>

        {/* ESCROW TRUST */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-purple-100 rounded-2xl p-6 mb-8 text-center border-2 border-purple-300">
          <Shield className="w-12 h-12 text-purple-600 mx-auto mb-3" />
          <p className="font-black text-lg text-gray-900">100% Money-Back Guarantee</p>
          <p className="text-sm text-gray-700 mt-2">
            Your payment is held safely by StudEx. Funds are only released to the seller after you confirm receipt. You can dispute anytime within 7 days.
          </p>
        </motion.div>

        {/* PAY BUTTON */}
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={handlePayment}
          disabled={(paymentMethod === "card" && (!isPaystackReady || isProcessing)) || (paymentMethod === "wallet" && walletBalance < finalTotal) || isProcessing}
          className={`w-full py-8 rounded-3xl font-black text-3xl shadow-2xl 
            bg-gradient-to-r from-purple-600 to-teal-600 text-white
            flex items-center justify-center gap-4
            ${((paymentMethod === "card" && (!isPaystackReady || isProcessing)) || (paymentMethod === "wallet" && walletBalance < finalTotal) || isProcessing) ? "opacity-70 cursor-not-allowed" : "hover:shadow-purple-500/50"}
          `}
        >
          {isProcessing ? (
            <> <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                <Lock className="w-8 h-8" />
              </motion.div> Processing Payment...
            </>
          ) : paymentMethod === "card" && !isPaystackReady ? (
            <> <Shield className="w-8 h-8" /> Loading Secure Payment... </>
          ) : paymentMethod === "wallet" && walletBalance < finalTotal ? (
            <> <Wallet className="w-8 h-8" /> Insufficient Balance </>
          ) : (
            <>
              {paymentMethod === "wallet" ? <Wallet className="w-10 h-10" /> : <CreditCard className="w-10 h-10" />}
              Pay ₦{finalTotal.toLocaleString()} Now
            </>
          )}
        </motion.button>

        <p className="text-center text-xs text-gray-600 mt-6">
          By completing this purchase, you agree to StudEx{" "}
          <Link href="/terms" className="text-purple-600 underline font-bold">Terms & Conditions</Link>
        </p>
      </div>
    </>
  );
}
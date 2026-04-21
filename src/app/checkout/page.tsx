"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  Package, CreditCard, ArrowLeft, Shield, Lock, Sparkles, Check,
  Calendar, MapPin, Clock, Loader,
} from "lucide-react";
import { useCartStore }    from "@/lib/cartStore";
import { useBookingStore } from "@/lib/bookingStore";
import { useRouter }       from "next/navigation";
import { useAuth, fetchWithAuth } from "@/lib/authStore";

const API_URL             = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!;

declare global {
  interface Window {
    PaystackPop: {
      setup: (config: any) => { openIframe: () => void };
    };
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthReady, isLoggedIn, isHydrated } = useAuth();
  const { cart, clearCart }       = useCartStore();
  const { booking, clearBooking } = useBookingStore();

  const isServiceBooking = !!booking && cart.length === 0;
  const isFoodOrder      = cart.length > 0;

  const SERVICE_FEE  = 200;
  const foodTotal    = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const serviceTotal = booking?.total || 0;
  const vendorPrice  = isServiceBooking ? serviceTotal : foodTotal;  // Naira
  const finalTotal   = vendorPrice + SERVICE_FEE;                    // Naira
  const finalKobo    = finalTotal * 100;                             // Paystack uses kobo

  const [isProcessing, setIsProcessing]     = useState(false);
  const [paystackLoaded, setPaystackLoaded] = useState(false);

  const txRef = useRef(
    `STUDEX-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
  );

  // ── Load Paystack inline.js ──────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as any).PaystackPop) { setPaystackLoaded(true); return; }
    if (document.getElementById("paystack-script")) return;
    const script  = document.createElement("script");
    script.id     = "paystack-script";
    script.src    = "https://js.paystack.co/v1/inline.js";
    script.onload = () => setPaystackLoaded(true);
    document.head.appendChild(script);
  }, []);

  // ── Get vendor's Paystack subaccount code ────────────────────────────────
  const getSubaccountCode = async (): Promise<string | null> => {
    if (!isServiceBooking || !booking?.providerId) return null;
    try {
      const res  = await fetchWithAuth(`${API_URL}/api/payments/seller/bank-account/`);
      const data = await res.json();
      return data.paystack_subaccount_code || null;
    } catch {
      return null;
    }
  };

  const createOrder = async (reference: string) => {
    if (isServiceBooking && booking) {
      const res  = await fetchWithAuth(`${API_URL}/api/payments/verify/`, {
        method: "POST",
        body: JSON.stringify({
          reference,
          listing_id: booking.providerId,
          order_type: "service",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Order creation failed");
      return data.order_id;
    }

    const res  = await fetchWithAuth(`${API_URL}/api/payments/verify/`, {
      method: "POST",
      body: JSON.stringify({
        reference,
        items:      cart.map(item => ({ listing_id: item.id, quantity: item.quantity })),
        order_type: "product",
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Order creation failed");
    return data.order_id;
  };

  const handlePayment = useCallback(async () => {
    if (!PAYSTACK_PUBLIC_KEY)  { alert("Paystack key missing. Check your .env file."); return; }
    if (finalTotal <= 0)       { alert("Cannot process zero payment."); return; }
    if (!paystackLoaded || !(window as any).PaystackPop) {
      alert("Payment system loading. Please try again.");
      return;
    }

    setIsProcessing(true);
    const subaccountCode = await getSubaccountCode();

    const handler = window.PaystackPop.setup({
      key:      PAYSTACK_PUBLIC_KEY,
      email:    user?.email || "user@studex.com",
      amount:   finalKobo,    // total in kobo (vendor price + ₦200 service fee)
      currency: "NGN",
      ref:      txRef.current,
      // ── Split config ────────────────────────────────────────────────────
      // bearer="account"          → StudEx (main account) absorbs Paystack fees
      // transaction_charge=20000  → ₦200 in kobo stays in StudEx account
      // remainder                 → vendor receives their full listing price clean
      // ────────────────────────────────────────────────────────────────────
      ...(subaccountCode ? {
        subaccount:         subaccountCode,
        transaction_charge: SERVICE_FEE * 100,  // 20000 kobo = ₦200 → StudEx keeps this
        bearer:             "account",           // StudEx absorbs Paystack processing fees
      } : {}),
      metadata: {
        custom_fields: [
          {
            display_name:  "Customer",
            variable_name: "customer",
            value:         user?.username || "",
          },
        ],
        listing_id: isServiceBooking ? booking?.providerId : null,
        type:       isServiceBooking ? "service_booking" : "product_order",
        cancel_action: `${window.location.origin}/checkout`,
      },
      // ── FIX: Paystack rejects async callbacks — use plain function + .then() ──
      callback: (response: { reference: string }) => {
        createOrder(response.reference)
          .then((orderId) => {
            if (isFoodOrder)      clearCart();
            if (isServiceBooking) clearBooking();
            router.push(`/order-confirmation/${orderId}`);
          })
          .catch((error: any) => {
            console.error("Order creation failed:", error.message);
            alert(
              `Payment received but order failed. Contact support with ref: ${response.reference}`,
            );
            setIsProcessing(false);
          });
      },
      onClose: () => {
        setIsProcessing(false);
      },
    });

    handler.openIframe();
  }, [finalTotal, finalKobo, isLoggedIn, paystackLoaded, isFoodOrder, isServiceBooking, user]);

  if (!isFoodOrder && !isServiceBooking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-teal-50 flex items-center justify-center p-6">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <Package className="w-32 h-32 text-purple-300 mx-auto mb-8" />
          <h2 className="text-4xl font-black bg-gradient-to-r from-purple-600 to-teal-600 bg-clip-text text-transparent mb-4">
            Nothing to checkout
          </h2>
          <p className="text-gray-600 mb-8">Go book a service or add items to cart!</p>
          <Link href="/home">
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
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
      <motion.div
        initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 bg-white/95 backdrop-blur-xl z-50 border-b border-purple-100 shadow-lg">
        <div className="flex items-center justify-between px-6 py-5 max-w-4xl mx-auto">
          <Link href={isServiceBooking ? `/listing/${booking?.providerId}` : "/cart"}>
            <motion.div
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              className="p-2 hover:bg-purple-100 rounded-full transition">
              <ArrowLeft className="w-7 h-7 text-purple-600" />
            </motion.div>
          </Link>
          <div className="text-center">
            <h1 className="text-2xl font-black bg-gradient-to-r from-purple-600 to-teal-600 bg-clip-text text-transparent">
              Secure Checkout
            </h1>
            <p className="text-xs text-gray-500 flex items-center gap-1 justify-center">
              <Shield className="w-3 h-3" /> Powered by Paystack
            </p>
          </div>
          <div className="w-10" />
        </div>
      </motion.div>

      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-teal-50 px-6 pt-8 pb-32 max-w-4xl mx-auto">

        {/* ORDER SUMMARY */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
              {isServiceBooking
                ? <Calendar className="w-7 h-7 text-purple-600" />
                : <Package  className="w-7 h-7 text-purple-600" />}
              {isServiceBooking ? "Your Appointment" : "Your Order"}
            </h2>
            <Sparkles className="w-6 h-6 text-teal-500" />
          </div>

          <div className="space-y-5">
            {isServiceBooking && booking && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-r from-purple-100 to-teal-100 rounded-3xl p-8">
                <div className="flex items-center gap-5 mb-6">
                  <div className="relative w-24 h-24 rounded-3xl overflow-hidden ring-4 ring-purple-200">
                    <Image
                      src={`/images/${booking.providerImg}`}
                      alt={booking.providerName} fill className="object-cover" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black">{booking.providerName}</h3>
                    <p className="text-purple-700 font-bold">Service Booking</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5" />
                    <span className="font-medium">{booking.date}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5" />
                    <span className="font-medium">{booking.time}</span>
                  </div>
                  <div className="flex items-center gap-3 col-span-2">
                    <MapPin className="w-5 h-5" />
                    <span className="font-medium">{booking.location}</span>
                  </div>
                </div>
              </motion.div>
            )}

            {isFoodOrder && cart.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-teal-50 rounded-2xl">
                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-lg">{item.title}</p>
                  <p className="text-sm text-purple-600 font-medium">×{item.quantity}</p>
                </div>
                <p className="font-black text-xl text-purple-600">
                  ₦{(item.price * item.quantity).toLocaleString()}
                </p>
              </motion.div>
            ))}

            {/* Price breakdown */}
            <div className="border-t-2 border-purple-200 pt-6 mt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600 font-medium">Vendor Price</span>
                <span className="text-gray-700 font-bold">₦{vendorPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600 font-medium">Service Fee</span>
                <span className="text-purple-600 font-bold">₦{SERVICE_FEE.toLocaleString()}</span>
              </div>
              <motion.div
                initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                className="bg-gradient-to-r from-purple-600 to-teal-600 rounded-2xl p-6 text-white">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold">Total Amount</span>
                  <span className="text-4xl font-black">₦{finalTotal.toLocaleString()}</span>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* SECURITY BADGES */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
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
              <p className="text-xs font-bold text-gray-700">Protected</p>
            </div>
          </div>
        </motion.div>

        {/* SERVICE FEE INFO */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-6 mb-8 text-center">
          <Shield className="w-12 h-12 text-purple-600 mx-auto mb-3" />
          <p className="font-black text-lg text-gray-900">Transparent Pricing</p>
          <p className="text-sm text-gray-700 mt-2">
            A flat <strong>₦{SERVICE_FEE.toLocaleString()} service fee</strong> is added to your
            total. The vendor receives their full listed price{" "}
            <strong>immediately</strong> via Paystack. Refunds are processed back to your original
            payment method within 3–5 business days.
          </p>
        </motion.div>

        {/* PAY BUTTON */}
        <motion.button
          whileHover={{ scale: isProcessing ? 1 : 1.02 }}
          whileTap={{ scale: isProcessing ? 1 : 0.98 }}
          onClick={handlePayment}
          disabled={isProcessing || !isLoggedIn || !paystackLoaded}
          className={`w-full py-8 rounded-3xl font-black text-3xl shadow-2xl bg-gradient-to-r from-purple-600 to-teal-600 text-white flex items-center justify-center gap-4 ${
            (isProcessing || !isAuthReady || !isHydrated) ? "opacity-70 cursor-not-allowed" : ""
          }`}>
          {isProcessing ? (
            <><Loader className="w-8 h-8 animate-spin" /> Processing...</>
          ) : (
            <><CreditCard className="w-10 h-10" /> Pay ₦{finalTotal.toLocaleString()} Now</>
          )}
        </motion.button>

        <p className="text-center text-xs text-gray-600 mt-6">
          By completing this purchase you agree to StudEx{" "}
          <Link href="/terms" className="text-purple-600 underline font-bold">
            Terms &amp; Conditions
          </Link>
        </p>
      </div>
    </>
  );
}

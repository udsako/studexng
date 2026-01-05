// src/app/cart/page.tsx
"use client";

import { Plus, Minus, Trash2, Package, ArrowRight, ShoppingBag, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useCartStore } from "@/lib/cartStore";

export default function CartPage() {
const router = useRouter();
const { cart, removeFromCart, updateQuantity, clearCart } = useCartStore();
const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

// EMPTY CART — GOD TIER ANIMATION
if (cart.length === 0) {
return (
<div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex flex-col items-center justify-center px-8 pt-20 pb-32">
<motion.div
initial={{ scale: 0, rotate: -180 }}
animate={{ scale: 1, rotate: 0 }}
transition={{ type: "spring", stiffness: 200, damping: 20 }}
className="relative"
>
{/* Floating Gradient Orb */}
<div className="absolute inset-0 blur-3xl">
<div className="w-64 h-64 bg-gradient-to-r from-purple-400 to-teal-400 rounded-full opacity-40 animate-pulse" />
</div>

  {/* Main Bag Icon */}
<motion.div
initial={{ y: 20 }}
animate={{ y: [0, -20, 0] }}
transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
className="relative z-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl p-12 shadow-2xl border border-purple-100 dark:border-gray-700"
>
<ShoppingBag className="w-28 h-28 mx-auto text-purple-600 dark:text-purple-400" strokeWidth={1.5} />
</motion.div>

{/* Floating Sparkles */}
{[...Array(6)].map((_, i) => (
<motion.div
key={i}
initial={{ opacity: 0, scale: 0 }}
animate={{
opacity: [0.3, 1, 0.3],
scale: [0, 1.5, 0],
x: Math.cos(i * 60 * Math.PI / 180) * 80,
y: Math.sin(i * 60 * Math.PI / 180) * 80,
}}
transition={{
duration: 3,
repeat: Infinity,
delay: i * 0.3,
ease: "easeOut",
}}
className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
>
<Sparkles className="w-8 h-8 text-purple-500" />
</motion.div>
))}
</motion.div>

{/* Text */}
<motion.div
initial={{ opacity: 0, y: 30 }}
animate={{ opacity: 1, y: 0 }}
transition={{ delay: 0.5 }}
className="text-center mt-12"
>
<h2 className="text-4xl font-black bg-gradient-to-r from-purple-600 to-teal-600 bg-clip-text text-transparent mb-3">
Your cart is empty
</h2>
<p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
Time to add some glow to your life
</p>

{/* Gradient CTA Button */}
<Link href="/categories">
<motion.button
whileHover={{ scale: 1.05 }}
whileTap={{ scale: 0.95 }}
className="px-10 py-5 bg-gradient-to-r from-purple-600 to-teal-600 text-white font-black text-xl rounded-full shadow-2xl flex items-center gap-3 mx-auto"
>
Browse Categories
<ArrowRight className="w-6 h-6" />
</motion.button>
</Link>
</motion.div>
</div>
);
}

// NON-EMPTY CART (your existing beautiful cart)
return (
<>
{/* TOP BAR */}
<div className="sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl z-50 border-b border-gray-200 dark:border-gray-800">
<div className="flex items-center justify-between p-5">
<button onClick={() => router.back()} className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-all active:scale-95">
<svg className="w-6 h-6 text-gray-900 dark:text-gray-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
</svg>
</button>
<h1 className="text-xl font-black text-gray-900 dark:text-white">Cart ({cart.length})</h1>
<button onClick={clearCart} className="text-red-500 dark:text-red-400 font-bold text-sm">
Clear All
</button>
</div>
</div>

<div className="p-5 pb-32 space-y-5 bg-[#FFF8F0] dark:bg-gray-950 min-h-screen">
{cart.map((item, i) => (
<motion.div
key={item.id}
initial={{ opacity: 0, x: -30 }}
animate={{ opacity: 1, x: 0 }}
transition={{ delay: i * 0.1 }}
className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-lg border border-purple-100 dark:border-gray-700 flex gap-4"
>
<div className="relative w-24 h-24 rounded-2xl overflow-hidden ring-2 ring-purple-100 dark:ring-purple-900/50">
<Image src={`/images/${item.img}`} alt={item.title} fill className="object-cover" />
</div>

<div className="flex-1">
<h3 className="font-black text-lg text-gray-900 dark:text-white">{item.title}</h3>
<p className="text-sm text-gray-600 dark:text-gray-400">₦{item.price.toLocaleString()} each</p>
<p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
₦{(item.price * item.quantity).toLocaleString()}
</p>
</div>

<div className="flex flex-col justify-between items-end gap-4">
<div className="flex items-center gap-3 bg-purple-50 dark:bg-purple-900/30 rounded-full px-4 py-2">
<button onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}>
<Minus className="w-5 h-5 text-purple-600 dark:text-purple-400" />
</button>
<span className="font-black text-purple-700 dark:text-purple-300 w-8 text-center">{item.quantity}</span>
<button onClick={() => updateQuantity(item.id, item.quantity + 1)}>
<Plus className="w-5 h-5 text-purple-600 dark:text-purple-400" />
</button>
</div>

<button onClick={() => removeFromCart(item.id)} className="text-red-500 dark:text-red-400">
<Trash2 className="w-6 h-6" />
</button>
</div>
</motion.div>
))}

{/* TOTAL & CHECKOUT */}
<motion.div
initial={{ y: 40, opacity: 0 }}
animate={{ y: 0, opacity: 1 }}
transition={{ delay: 0.3 }}
className="bg-gradient-to-r from-purple-600 to-teal-600 rounded-3xl p-6 text-white shadow-2xl"
>
<div className="flex justify-between items-center mb-6">
<p className="text-2xl font-black">Total</p>
<p className="text-4xl font-black">₦{total.toLocaleString()}</p>
</div>

<Link href="/checkout">
<motion.button
whileHover={{ scale: 1.02 }}
whileTap={{ scale: 0.98 }}
className="w-full py-5 bg-white text-purple-600 font-black text-xl rounded-3xl shadow-xl flex items-center justify-center gap-3"
>
Checkout Now <ArrowRight className="w-6 h-6" />
</motion.button>
</Link>
</motion.div>
</div>

{/* BOTTOM NAV */}
<nav className="bottom-nav-safe">
<div className="flex justify-around items-center h-full px-6">
<Link href="/home" className="text-gray-600"><span className="text-xs font-medium">Home</span></Link>
<Link href="/categories" className="text-gray-600"><span className="text-xs font-medium">Categories</span></Link>
<div className="relative">
<span className="text-xs font-black bg-gradient-to-r from-purple-600 to-teal-600 bg-clip-text text-transparent">Cart</span>
<motion.div layoutId="activeTab" className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-gradient-to-r from-purple-600 to-teal-600 rounded-full shadow-lg" />
</div>
<Link href="/book" className="text-gray-600"><span className="text-xs font-medium">Bookings</span></Link>
<Link href="/profile" className="text-gray-600"><span className="text-xs font-medium">Profile</span></Link>
</div>
</nav>
</>
);
}
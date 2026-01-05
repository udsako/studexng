// src/app/book/page.tsx
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { CalendarCheck, Clock, MapPin, ChevronRight, Shield } from "lucide-react";
import { useBookingStore } from "@/lib/bookingStore";
import Image from "next/image";

export default function MyBookingsPage() {
  const bookings = useBookingStore((state) => state.bookings) || [];

  // Simple upcoming vs past separation
  const upcoming = bookings.filter(b => new Date(b.date + " " + b.time) > new Date());
  const past = bookings.filter(b => new Date(b.date + " " + b.time) <= new Date());

  return (
    <>
      {/* HEADER */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-xl z-50 border-b shadow-sm">
        <div className="flex items-center justify-center py-5">
          <h1 className="text-xl font-black text-gray-900">My Bookings</h1>
        </div>
      </div>

      <div className="px-6 py-8 space-y-10 pb-32">

        {/* UPCOMING SECTION */}
        <section>
          <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
            <CalendarCheck className="w-8 h-8 text-purple-600" /> Upcoming
          </h2>

          {upcoming.length === 0 ? (
            <div className="bg-gradient-to-br from-purple-50 to-teal-50 rounded-3xl p-8 text-center border border-purple-200">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-purple-200 to-teal-200 flex items-center justify-center">
                <CalendarCheck className="w-14 h-14 text-purple-600" />
              </div>
              <p className="text-xl font-black text-purple-900 mb-2">No upcoming bookings yet</p>
              <p className="text-gray-600 mb-6">Time to book your next slay session!</p>

              {/* GRADIENT BUTTON + CORRECT LINK */}
              <Link href="/categories">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full max-w-xs mx-auto py-5 bg-gradient-to-r from-purple-600 to-teal-600 text-white font-black text-xl rounded-3xl shadow-2xl flex items-center justify-center gap-3"
                >
                  Browse Categories
                  <ChevronRight className="w-6 h-6" />
                </motion.button>
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              {upcoming.map((booking, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-3xl p-6 shadow-lg border border-purple-100"
                >
                  <div className="flex gap-4">
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-purple-100">
                      <Image
                        src={`/images/${booking.providerImg}`}
                        alt={booking.providerName}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-black text-lg">{booking.providerName}</h3>
                      <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                        <CalendarCheck className="w-4 h-4" /> {booking.date} · {booking.time}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> {booking.location}
                      </p>
                    </div>
                    <ChevronRight className="w-6 h-6 text-gray-400 self-center" />
                  </div>

                  <div className="mt-5 flex justify-between items-center">
                    <p className="font-black text-2xl">₦{booking.total.toLocaleString()}</p>
                    <span className="px-4 py-2 bg-gradient-to-r from-purple-100 to-teal-100 text-purple-700 rounded-full font-bold text-sm">
                      Confirmed
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* PAST SECTION */}
        <section>
          <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
            <Clock className="w-8 h-8 text-gray-500" /> Past Bookings
          </h2>
          {past.length === 0 ? (
            <p className="text-center text-gray-500">Your past glow-ups will appear here</p>
          ) : (
            <div className="space-y-4">
              {past.map((b, i) => (
                <div key={i} className="bg-gray-50 rounded-3xl p-5">
                  <div className="flex gap-4">
                    <Image
                      src={`/images/${b.providerImg}`}
                      alt={b.providerName}
                      width={48}
                      height={48}
                      className="rounded-xl object-cover"
                    />
                    <div>
                      <h3 className="font-bold">{b.providerName}</h3>
                      <p className="text-sm text-gray-600">{b.date} at {b.time}</p>
                      <p className="font-black text-lg mt-2">₦{b.total.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ESCROW BADGE */}
        <div className="bg-purple-50 rounded-3xl p-6 text-center border-2 border-purple-200">
          <Shield className="w-14 h-14 text-purple-600 mx-auto mb-3" />
          <p className="text-2xl font-black text-purple-900">100% Escrow Protected</p>
          <p className="text-gray-700 mt-2">You only release payment when you say “Perfect”</p>
        </div>
      </div>

      {/* BOTTOM NAV — using your perfect class */}
      <nav className="bottom-nav-safe">
        <div className="flex justify-around items-center h-full px-4">
          {/* Your nav icons */}
        </div>
      </nav>
    </>
  );
}
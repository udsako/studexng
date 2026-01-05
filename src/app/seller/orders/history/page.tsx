// src/app/seller/orders/history/page.tsx
"use client";

import { ChevronLeft, TrendingUp, DollarSign, Calendar, User, Package, Download, Filter } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface Order {
  id: number;
  reference: string;
  buyer: {
    username: string;
  };
  listing: {
    title: string;
    vendor: {
      username: string;
    };
  };
  amount: number;
  created_at: string;
  completed_at?: string;
  status: "completed";
}

export default function SellerOrderHistoryPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      router.push("/auth");
      return;
    }

    const fetchOrders = async () => {

      if (!accessToken) {
        setError("Please log in to view order history");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("http://127.0.0.1:8000/api/orders/", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!res.ok) {
          if (res.status === 401) {
            setError("Session expired. Redirecting...");
            setTimeout(() => router.push("/auth"), 2000);
            return;
          }
          throw new Error(`Failed to load orders: ${res.status}`);
        }

        const data = await res.json();
        
        // Handle both array and paginated responses
        const allOrders = Array.isArray(data) ? data : data.results || [];
        
        // Filter only completed orders
        const completedOrders = allOrders.filter((o: Order) => o.status === "completed");
        setOrders(completedOrders);

        // Calculate total revenue
        const revenue = completedOrders.reduce((sum: number, o: Order) => sum + parseFloat(String(o.amount)), 0);
        setTotalRevenue(revenue);

        // Apply initial filters
        applyFilters(completedOrders, dateFilter, searchQuery);
      } catch (err) {
        console.error("Orders fetch error:", err);
        setError("Failed to load order history. Try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [router]);

  const applyFilters = (orderList: Order[], date: string, search: string) => {
    let filtered = [...orderList];

    // Date filter
    const now = new Date();
    if (date === "today") {
      filtered = filtered.filter((o) => {
        const orderDate = new Date(o.created_at);
        return orderDate.toDateString() === now.toDateString();
      });
    } else if (date === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((o) => new Date(o.created_at) >= weekAgo);
    } else if (date === "month") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((o) => new Date(o.created_at) >= monthAgo);
    }

    // Search filter
    if (search) {
      filtered = filtered.filter((o) =>
        o.buyer.username.toLowerCase().includes(search.toLowerCase()) ||
        o.reference.toLowerCase().includes(search.toLowerCase()) ||
        o.listing.title.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredOrders(filtered);
  };

  const handleDateFilterChange = (date: "all" | "today" | "week" | "month") => {
    setDateFilter(date);
    applyFilters(orders, date, searchQuery);
  };

  const handleSearchChange = (search: string) => {
    setSearchQuery(search);
    applyFilters(orders, dateFilter, search);
  };

  const handleDownloadCSV = () => {
    const csv = [
      ["Order ID", "Buyer", "Service/Product", "Amount", "Date"],
      ...filteredOrders.map((o) => [
        o.reference,
        o.buyer.username,
        o.listing.title,
        `₦${parseFloat(String(o.amount)).toLocaleString()}`,
        new Date(o.created_at).toLocaleDateString("en-GB"),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `order-history-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-teal-50">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
          <Package className="w-16 h-16 text-purple-600" />
        </motion.div>
      </div>
    );
  }

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
  };

  return (
    <>
      {/* TOP BAR */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 bg-white/90 backdrop-blur-xl z-40 border-b border-purple-100 shadow-sm"
      >
        <div className="flex items-center justify-between p-4 max-w-5xl mx-auto">
          <Link href="/seller/orders">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 hover:bg-purple-100 rounded-full transition"
            >
              <ChevronLeft className="w-6 h-6 text-purple-600" />
            </motion.button>
          </Link>
          <h1 className="text-xl font-black bg-gradient-to-r from-purple-600 to-teal-500 bg-clip-text text-transparent">
            Order History
          </h1>
          <div className="w-10" />
        </div>
      </motion.div>

      <div className="p-4 pb-32 space-y-6 max-w-4xl mx-auto">
        {/* REVENUE SUMMARY */}
        <motion.div
          {...fadeInUp}
          className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl p-6 text-white shadow-2xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              <span className="font-bold text-sm opacity-90">Total Revenue (All Time)</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDownloadCSV}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition"
              title="Download as CSV"
            >
              <Download className="w-5 h-5" />
            </motion.button>
          </div>

          <div>
            <p className="text-4xl font-black">₦{totalRevenue.toLocaleString()}</p>
            <p className="text-sm opacity-80 mt-2">From {orders.length} completed order{orders.length !== 1 ? "s" : ""}</p>
          </div>
        </motion.div>

        {/* FILTERS */}
        <motion.div {...fadeInUp} className="space-y-4">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by buyer name, order ID, or service..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
            />
          </div>

          {/* Date Filter Buttons */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {(["all", "today", "week", "month"] as const).map((period) => (
              <motion.button
                key={period}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleDateFilterChange(period)}
                className={`px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all ${
                  dateFilter === period
                    ? "bg-gradient-to-r from-purple-600 to-teal-500 text-white shadow-lg"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                {period === "all" && "All Time"}
                {period === "today" && "Today"}
                {period === "week" && "This Week"}
                {period === "month" && "This Month"}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-red-600 font-medium bg-red-50 p-4 rounded-lg"
          >
            {error}
          </motion.div>
        )}

        {/* ORDERS LIST */}
        {filteredOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Package className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-semibold text-lg">No completed orders yet</p>
            <p className="text-gray-500 text-sm mt-2">Your completed orders will appear here</p>
            <Link href="/seller/orders">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="mt-6 px-8 py-3 bg-gradient-to-r from-purple-600 to-teal-500 text-white font-bold rounded-xl"
              >
                View Pending Orders
              </motion.button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Order ID & Date */}
                    <div className="mb-3">
                      <p className="font-black text-gray-900">#{order.reference}</p>
                      <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(order.created_at).toLocaleDateString("en-GB")}
                      </p>
                    </div>

                    {/* Service & Buyer */}
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-gray-900">{order.listing.title}</p>
                      <p className="text-xs text-gray-600 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {order.buyer.username}
                      </p>
                    </div>
                  </div>

                  {/* Amount & Status */}
                  <div className="text-right">
                    <p className="text-2xl font-black text-emerald-600">
                      ₦{parseFloat(String(order.amount)).toLocaleString()}
                    </p>
                    <div className="mt-2 px-3 py-1 bg-emerald-100 rounded-full text-xs font-bold text-emerald-800 inline-block">
                      ✓ Completed
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* SUMMARY STATS */}
        {filteredOrders.length > 0 && (
          <motion.div
            {...fadeInUp}
            className="bg-gradient-to-r from-purple-50 to-teal-50 rounded-xl p-4 border border-purple-200"
          >
            <p className="text-sm text-gray-700">
              <span className="font-bold">Total for this period:</span> ₦
              {filteredOrders
                .reduce((sum, o) => sum + parseFloat(String(o.amount)), 0)
                .toLocaleString()}
              {" "}({filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""})
            </p>
          </motion.div>
        )}
      </div>

      {/* BOTTOM NAV */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200 z-50 shadow-2xl"
      >
        <div className="flex justify-around py-3 max-w-5xl mx-auto w-full">
          <Link href="/" className="text-gray-500 hover:text-purple-600 transition">
            <span className="text-xs font-semibold">Home</span>
          </Link>
          <Link href="/categories" className="text-gray-500 hover:text-purple-600 transition">
            <span className="text-xs font-semibold">Services</span>
          </Link>
          <Link href="/cart" className="text-gray-500 hover:text-purple-600 transition">
            <span className="text-xs font-semibold">Cart</span>
          </Link>
          <Link href="/seller" className="text-purple-600 font-bold transition">
            <span className="text-xs">Seller</span>
          </Link>
        </div>
      </motion.div>
    </>
  );
}
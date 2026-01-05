// src/app/admin/seller-approvals/page.tsx
"use client";

import { motion } from "framer-motion";
import { Check, X, Eye, FileText, Calendar, Clock, Zap, ArrowLeft, UserCheck, School } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Application {
  id: string;
  name: string;
  email: string;
  matric: string;
  submitted: string;
  status: "pending" | "approved" | "rejected";
  docs: {
    admission: string;
    idCard: string;
  };
  docUrls: {
    admission: string;
    idCard: string;
  };
}

function AdminSellerApprovals() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isAutoApproving, setIsAutoApproving] = useState(false);
  const [autoResult, setAutoResult] = useState<{ status: "idle" | "success" | "error"; message: string }>({
    status: "idle",
    message: "",
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("sellerApplication");
    const user = JSON.parse(localStorage.getItem("userProfile") || "{}");

    if (saved) {
      const app = JSON.parse(saved);
      setApplications([
        {
          id: app.id || "APP-001",
          name: user.fullName || "Applicant",
          email: user.email || "applicant@pau.edu.ng",
          matric: user.matricNumber || "PAU20230000",
          submitted: new Date(app.submittedAt || Date.now()).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          status: "pending",
          docs: {
            admission: app.files?.admission || "admission-letter.pdf",
            idCard: app.files?.idCard || "student-id-card.pdf",
          },
          docUrls: {
            admission: app.files?.admissionUrl || "/sample/pau-admission-letter.jpg",
            idCard: app.files?.idCardUrl || "/sample/pau-student-id.jpg",
          },
        },
      ]);
    } else {
      setApplications([]);
    }
  }, []);

  // MOCK AI VERIFICATION (Simulates Gemini Vision)
  const autoApproveWithAI = async () => {
    setIsAutoApproving(true);
    setAutoResult({ status: "idle", message: "" });

    await new Promise(resolve => setTimeout(resolve, 2800));

    const approved = Math.random() > 0.25;

    if (approved) {
      localStorage.setItem("isSeller", "true");
      localStorage.removeItem("isSellerPending");

      setApplications(prev => prev.map(a => ({ ...a, status: "approved" })));

      setAutoResult({
        status: "success",
        message: "✓ AI VERIFIED: PAU student confirmed. Documents match.",
      });

      setTimeout(() => {
        router.push("/admin");
      }, 2000);
    } else {
      const reasons = [
        "Student ID photo does not match face",
        "Name on admission letter doesn't match ID",
        "ID card expired or invalid watermark",
        "Not a current PAU student",
      ];
      setAutoResult({
        status: "error",
        message: `✗ AI REJECTED: ${reasons[Math.floor(Math.random() * reasons.length)]}`,
      });
    }

    setIsAutoApproving(false);
  };

  const approve = () => {
    localStorage.setItem("isSeller", "true");
    localStorage.removeItem("isSellerPending");
    setApplications(prev => prev.map(a => ({ ...a, status: "approved" })));
    alert("✓ Seller approved! They can now start selling.");
    setTimeout(() => {
      router.push("/admin");
    }, 1000);
  };

  const reject = () => {
    localStorage.removeItem("isSellerPending");
    localStorage.removeItem("sellerApplication");
    setApplications(prev => prev.map(a => ({ ...a, status: "rejected" })));
    alert("✗ Application rejected.");
    setTimeout(() => {
      router.push("/admin");
    }, 1000);
  };

  if (!mounted) return null;

  return (
    <>
      {/* TOP BAR */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-50 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 border-b border-white/10 backdrop-blur-xl"
      >
        <div className="flex items-center justify-between p-5">
          <button
            onClick={() => router.back()}
            className="text-white hover:bg-white/10 p-3 rounded-xl transition"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-purple-400" />
            Seller Approvals
          </h1>
          <div className="w-12" />
        </div>
      </motion.div>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6 pb-32 space-y-6">

        {applications.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <School className="w-20 h-20 mx-auto text-white/20 mb-4" />
            <p className="text-white/60 text-lg">No pending applications</p>
            <p className="text-white/40 text-sm mt-2">All sellers have been verified</p>
          </motion.div>
        ) : (
          applications.map((app, i) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2 }}
              className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 space-y-6"
            >
              {/* APPLICANT INFO */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-black text-white">{app.name}</h3>
                  <p className="text-purple-300 font-medium mt-1">{app.email}</p>
                  <p className="text-white/60 text-sm flex items-center gap-2 mt-2">
                    <span className="font-mono bg-white/10 px-2 py-1 rounded">{app.matric}</span>
                  </p>
                  <p className="text-white/50 text-sm flex items-center gap-2 mt-3">
                    <Calendar className="w-4 h-4" />
                    Submitted on {app.submitted}
                  </p>
                </div>

                <div className={`px-4 py-2 rounded-full font-bold flex items-center gap-2 whitespace-nowrap ${
                  app.status === "pending" ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/50" :
                  app.status === "approved" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50" :
                  "bg-red-500/20 text-red-300 border border-red-500/50"
                }`}>
                  {app.status === "pending" ? <Clock className="w-5 h-5" /> :
                   app.status === "approved" ? <Check className="w-5 h-5" /> :
                   <X className="w-5 h-5" />}
                  {app.status.toUpperCase()}
                </div>
              </div>

              {/* AI AUTO-APPROVAL */}
              {app.status === "pending" && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="p-5 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl border border-purple-500/50"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <Zap className="w-7 h-7 text-purple-400 animate-pulse flex-shrink-0" />
                      <div>
                        <p className="text-white font-bold">AI Verification</p>
                        <p className="text-white/70 text-sm">Powered by Gemini Vision API</p>
                      </div>
                    </div>
                    <button
                      onClick={autoApproveWithAI}
                      disabled={isAutoApproving}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition disabled:opacity-50 flex-shrink-0 whitespace-nowrap"
                    >
                      {isAutoApproving ? "Analyzing..." : "Run AI Check"}
                    </button>
                  </div>
                  {autoResult.status !== "idle" && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`text-sm mt-4 font-medium ${autoResult.status === "success" ? "text-emerald-400" : "text-red-400"}`}
                    >
                      {autoResult.message}
                    </motion.p>
                  )}
                </motion.div>
              )}

              {/* DOCUMENTS */}
              <div className="space-y-4">
                <h4 className="text-lg font-bold text-white">Submitted Documents</h4>
                <div className="space-y-3">
                  {[
                    { key: "admission", label: "Admission Letter", icon: FileText },
                    { key: "idCard", label: "Student ID Card", icon: School },
                  ].map(({ key, label, icon: Icon }) => {
                    const filename = app.docs[key as keyof typeof app.docs];
                    const url = app.docUrls[key as keyof typeof app.docUrls];

                    return (
                      <motion.div
                        key={key}
                        whileHover={{ scale: 1.02 }}
                        className="bg-white/10 rounded-2xl p-4 flex items-center justify-between border border-white/20 hover:border-purple-500/50 transition-all"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-white font-bold">{label}</p>
                            <p className="text-white/60 text-sm">{filename}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => window.open(url, "_blank")}
                          className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition flex-shrink-0"
                          title="View document"
                        >
                          <Eye className="w-5 h-5 text-white" />
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* ACTION BUTTONS */}
              {app.status === "pending" && (
                <div className="flex gap-4 pt-4 border-t border-white/10">
                  <button
                    onClick={approve}
                    className="flex-1 py-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-lg rounded-2xl hover:shadow-xl hover:shadow-emerald-500/50 transition-all flex items-center justify-center gap-3"
                  >
                    <Check className="w-7 h-7" />
                    Approve Seller
                  </button>
                  <button
                    onClick={reject}
                    className="flex-1 py-5 bg-gradient-to-r from-red-600 to-pink-600 text-white font-black text-lg rounded-2xl hover:shadow-xl hover:shadow-red-500/50 transition-all flex items-center justify-center gap-3"
                  >
                    <X className="w-7 h-7" />
                    Reject
                  </button>
                </div>
              )}

              {app.status === "approved" && (
                <motion.div className="bg-emerald-500/20 border border-emerald-500/50 rounded-2xl p-4 text-center">
                  <p className="text-emerald-300 font-bold flex items-center justify-center gap-2">
                    <Check className="w-5 h-5" /> Approved - Seller can now start selling
                  </p>
                </motion.div>
              )}

              {app.status === "rejected" && (
                <motion.div className="bg-red-500/20 border border-red-500/50 rounded-2xl p-4 text-center">
                  <p className="text-red-300 font-bold flex items-center justify-center gap-2">
                    <X className="w-5 h-5" /> Rejected - Seller cannot proceed
                  </p>
                </motion.div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </>
  );
}

export default AdminSellerApprovals;
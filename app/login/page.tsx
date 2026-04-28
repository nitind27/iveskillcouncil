"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, 
  Lock, 
  Loader2, 
  ChevronRight,
  Eye,
  EyeOff,
  Smartphone
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { showSuccess, showError } from "@/lib/toast";
import { validateName, validateEmail } from "@/lib/validation";
import { useLogoConfig } from "@/hooks/useLogoConfig";
import PageLoader from "@/components/common/PageLoader";

type LoginMethod = "password" | "otp";
type OverlayFlow = "forgot" | "firstTime" | null;

function LoginForm() {
  const searchParams = useSearchParams();
  const { logoUrl, siteName, tagline } = useLogoConfig();
  const { login, loginWithOtp, user, loading: authLoading } = useAuth();
  
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("password");
  const [overlayFlow, setOverlayFlow] = useState<OverlayFlow>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  
  // OTP flow
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  
  // First-time setup
  const [firstTimeStep, setFirstTimeStep] = useState<"email" | "send" | "verify">("email");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpError, setOtpError] = useState("");
  
  // Forgot password
  const [forgotStep, setForgotStep] = useState<"email" | "otp" | "done">("email");
  const [forgotOtpSent, setForgotOtpSent] = useState(false);
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirm, setResetConfirm] = useState("");
  
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportName, setSupportName] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [supportSubmitting, setSupportSubmitting] = useState(false);

  const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "codeatinfotech@gmail.com";

  const getRedirectUrl = () => {
    const redirectParam = searchParams?.get("redirect");
    if (!redirectParam) return "/dashboard";
    try {
      let decoded = decodeURIComponent(redirectParam);
      while (decoded.includes("%")) {
        const newDecoded = decodeURIComponent(decoded);
        if (newDecoded === decoded) break;
        decoded = newDecoded;
      }
      // Never redirect back to error pages or login
      const blocked = ["/403", "/401", "/400", "/500", "/503", "/login"];
      if (!decoded.startsWith("/") || blocked.some(b => decoded === b || decoded.startsWith(b + "?"))) {
        return "/dashboard";
      }
      return decoded;
    } catch {
      return "/dashboard";
    }
  };

  const redirect = getRedirectUrl();

  useEffect(() => {
    if (user && !authLoading && !formLoading) {
      window.location.replace(redirect);
    }
  }, [user, authLoading, formLoading, redirect]);

  // --- Password Login ---
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        showSuccess("Login Successful", "Redirecting...");
        setTimeout(() => { window.location.href = redirect; }, 1200);
      } else {
        showError("Invalid Credentials", "Please check your email and password.");
        setFormLoading(false);
      }
    } catch (error: unknown) {
      showError("Error", error instanceof Error ? error.message : "An unexpected error occurred.");
      setFormLoading(false);
    }
  };

  // --- OTP Login ---
  const handleSendOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setOtpError("");
    setFormLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (res.ok && data?.success) {
        showSuccess("OTP Sent", "Check your email. Valid for 10 minutes.");
        setOtpSent(true);
        setOtpError("");
      } else {
        const errMsg = data?.error || "Failed to send OTP";
        if (/first-time|set up/i.test(errMsg)) {
          setOtpError("First-time setup required. Use 'First time? Set up account' below.");
          showError("Setup Required", errMsg);
        } else {
          setOtpError(errMsg);
          showError("Error", errMsg);
        }
      }
    } catch {
      setOtpError("Network error. Please try again.");
      showError("Error", "Network error");
    } finally {
      setFormLoading(false);
    }
  };

  const handleVerifyOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) return;
    setFormLoading(true);
    try {
      const success = await loginWithOtp(email.trim().toLowerCase(), otp.trim());
      if (success) {
        showSuccess("Login Successful", "Redirecting...");
        setTimeout(() => { window.location.href = redirect; }, 1200);
      } else {
        showError("Invalid OTP", "The OTP is invalid or expired. Request a new one.");
        setFormLoading(false);
      }
    } catch {
      showError("Error", "Network error");
      setFormLoading(false);
    }
  };

  // --- Forgot Password ---
  const handleForgotSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setOtpError("");
    setFormLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (res.ok && data?.success) {
        showSuccess("OTP Sent", "Check your email. Valid for 10 minutes.");
        setForgotOtpSent(true);
        setForgotStep("otp");
        setOtpError("");
      } else {
        setOtpError(data?.error || "Failed to send OTP");
        showError("Error", data?.error || "Failed to send OTP");
      }
    } catch {
      setOtpError("Network error. Please try again.");
      showError("Error", "Network error");
    } finally {
      setFormLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || resetPassword.length < 8) {
      showError("Validation", "OTP and password (min 8 chars) required");
      return;
    }
    if (resetPassword !== resetConfirm) {
      showError("Validation", "Passwords do not match");
      return;
    }
    setFormLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
          newPassword: resetPassword,
        }),
      });
      const data = await res.json();
      if (res.ok && data?.success) {
        showSuccess("Password Reset", "Redirecting...");
        setForgotStep("done");
        setTimeout(() => { window.location.href = redirect; }, 1200);
      } else {
        showError("Error", data?.error || "Invalid OTP or failed to reset");
        setFormLoading(false);
      }
    } catch {
      showError("Error", "Network error");
      setFormLoading(false);
    }
  };

  // --- First-time setup ---
  const handleCheckFirstTime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setOtpError("");
    setFormLoading(true);
    try {
      const res = await fetch(`/api/auth/check-first-time?email=${encodeURIComponent(email.trim().toLowerCase())}`);
      const data = await res.json();
      if (res.ok && data?.data) {
        const { found, mustChangePassword } = data.data;
        if (!found) {
          setOtpError("No account found with this email.");
          showError("Not Found", "No account found with this email.");
        } else if (!mustChangePassword) {
          setOtpError("Your account is already set up. Use email and password to sign in.");
          showError("Already Set Up", "Use email and password to sign in.");
        } else {
          setFirstTimeStep("send");
          setOtpError("");
        }
      } else {
        setOtpError(data?.error || "Could not verify.");
      }
    } catch {
      setOtpError("Network error.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleFirstTimeSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setOtpError("");
    setFormLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (res.ok && data?.success) {
        showSuccess("OTP Sent", "Check your email. Valid for 10 minutes.");
        setFirstTimeStep("verify");
        setOtpError("");
      } else {
        const errMsg = data?.error || "Failed to send OTP";
        if (/already set up/i.test(errMsg)) {
          setOtpError("Account already set up. Use password login.");
          setFirstTimeStep("email");
        } else setOtpError(errMsg);
      }
    } catch {
      setOtpError("Network error.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleVerifyOtpSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || newPassword.length < 8) {
      showError("Validation", "OTP and password (min 8 chars) required");
      return;
    }
    if (newPassword !== confirmPassword) {
      showError("Validation", "Passwords do not match");
      return;
    }
    setFormLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp-set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
          newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok && data?.success) {
        showSuccess("Password Set", "Redirecting...");
        setTimeout(() => { window.location.href = redirect; }, 1200);
      } else {
        showError("Error", data?.error || "Invalid OTP");
        setFormLoading(false);
      }
    } catch {
      showError("Error", "Network error");
      setFormLoading(false);
    }
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameR = validateName(supportName);
    const emailR = validateEmail(supportEmail);
    if (!nameR.valid) { showError("Validation", nameR.error!); return; }
    if (!emailR.valid) { showError("Validation", emailR.error!); return; }
    if (!supportName.trim() || !supportEmail.trim() || !supportMessage.trim()) {
      showError("Validation", "Name, email and message are required.");
      return;
    }
    setSupportSubmitting(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: supportName.trim(), email: supportEmail.trim().toLowerCase(), message: supportMessage.trim(), source: "login" }),
      });
      const data = await res.json();
      if (res.ok) {
        showSuccess("Submitted", "Support request sent.");
        setSupportOpen(false);
        setSupportName("");
        setSupportEmail("");
        setSupportMessage("");
      } else {
        showError("Error", data?.error || "Failed to submit.");
      }
    } catch {
      showError("Error", "Network error");
    } finally {
      setSupportSubmitting(false);
    }
  };

  const closeOverlay = () => {
    setOverlayFlow(null);
    setForgotStep("email");
    setForgotOtpSent(false);
    setFirstTimeStep("email");
    setOtp("");
    setOtpSent(false);
    setResetPassword("");
    setResetConfirm("");
    setNewPassword("");
    setConfirmPassword("");
    setOtpError("");
  };

  const isOverlayOpen = overlayFlow !== null;

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white font-sans selection:bg-blue-100 overflow-hidden">
      
      {/* LEFT: Branding */}
      <div className="relative hidden md:flex md:w-[45%] lg:w-[40%] overflow-hidden flex-col items-center justify-center p-12" style={{ background: "linear-gradient(135deg, #1a3d70 0%, #2D5DA8 50%, #1E4A85 100%)" }}>
        {/* decorative blobs */}
        <div className="absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full opacity-20" style={{ background: "radial-gradient(circle, #A8C63A, transparent 70%)" }} />
        <div className="absolute -bottom-32 -left-16 w-[480px] h-[480px] rounded-full opacity-15" style={{ background: "radial-gradient(circle, #F39C12, transparent 70%)" }} />
        {/* animated ring */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="w-[420px] h-[420px] rounded-full border border-white/10 border-dashed"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute w-[300px] h-[300px] rounded-full border border-[#A8C63A]/20 border-dashed"
          />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mb-10"
          >
            {logoUrl ? (
              <img src={logoUrl} alt={siteName} className="max-w-[260px] w-full drop-shadow-2xl" />
            ) : (
              <div className="w-28 h-28 rounded-3xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-2xl">
                <span className="text-white font-black text-5xl">{siteName.charAt(0)}</span>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <h1 className="text-3xl font-extrabold text-white tracking-tight mb-3">{siteName}</h1>
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="h-px w-10 bg-[#A8C63A]/60 rounded-full" />
              <div className="w-2 h-2 rounded-full bg-[#A8C63A]" />
              <div className="h-px w-10 bg-[#A8C63A]/60 rounded-full" />
            </div>
            <p className="text-white/60 text-sm font-medium uppercase tracking-widest max-w-xs">{tagline || "Innovation in Learning"}</p>
          </motion.div>

          {/* feature pills */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 flex flex-col gap-3 w-full max-w-xs"
          >
            {["Franchise Management", "Student Tracking", "Course & Fees", "Certificates"].map((f, i) => (
              <motion.div
                key={f}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.08 }}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/10 border border-white/10 backdrop-blur-sm"
              >
                <span className="w-2 h-2 rounded-full bg-[#A8C63A] flex-shrink-0" />
                <span className="text-white/80 text-sm font-medium">{f}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* RIGHT: Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-16 lg:p-24 bg-[#F8FAFC]">
        <div className="w-full max-w-[420px]">
          <div className="mb-8">
            <h2 className="text-4xl font-extrabold tracking-tight text-[#1A1A1A] mb-3">Sign In</h2>
            <p className="text-[#6B7280] text-lg">Welcome back. Choose how to sign in.</p>
          </div>

          {/* Method tabs: Password | OTP */}
          <div className="flex gap-1 p-1 rounded-2xl bg-[#EEF2F7] mb-6">
            <button
              type="button"
              onClick={() => { setLoginMethod("password"); closeOverlay(); setOtpSent(false); setOtp(""); setOtpError(""); }}
              className={cn(
                "flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2",
                loginMethod === "password" ? "bg-white text-[#2D5DA8] shadow-sm" : "text-[#6B7280] hover:text-[#1A1A1A]"
              )}
            >
              <Lock className="w-4 h-4" /> Password
            </button>
            <button
              type="button"
              onClick={() => { setLoginMethod("otp"); closeOverlay(); setOtpSent(false); setOtp(""); setOtpError(""); }}
              className={cn(
                "flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2",
                loginMethod === "otp" ? "bg-white text-[#2D5DA8] shadow-sm" : "text-[#6B7280] hover:text-[#1A1A1A]"
              )}
            >
              <Smartphone className="w-4 h-4" /> OTP
            </button>
          </div>

          <AnimatePresence mode="wait">
            {loginMethod === "password" && !isOverlayOpen && (
              <motion.form
                key="password"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handlePasswordLogin}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#7A7A7A] uppercase tracking-[0.2em]">Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#D1D5DB] group-focus-within:text-[#2D5DA8]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="admin@eklavya.com"
                      className="w-full pl-12 pr-4 py-4 bg-white border border-[#E5E7EB] rounded-2xl outline-none focus:ring-4 focus:ring-[#2D5DA8]/10 focus:border-[#2D5DA8] text-[#1A1A1A]"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-xs font-bold text-[#7A7A7A] uppercase tracking-[0.2em]">Password</label>
                    <button
                      type="button"
                      onClick={() => { setOverlayFlow("forgot"); setForgotStep("email"); setForgotOtpSent(false); setOtp(""); setResetPassword(""); setResetConfirm(""); setOtpError(""); }}
                      className="text-xs font-bold text-[#2D5DA8] hover:text-[#1E4A85]"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#D1D5DB] group-focus-within:text-[#2D5DA8]" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full pl-12 pr-12 py-4 bg-white border border-[#E5E7EB] rounded-2xl outline-none focus:ring-4 focus:ring-[#2D5DA8]/10 focus:border-[#2D5DA8] text-[#1A1A1A]"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#D1D5DB] hover:text-[#2D5DA8]">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={formLoading}
                  className={cn("w-full py-4 px-6 rounded-2xl font-bold text-white bg-[#2D5DA8] hover:bg-[#1E4A85] flex items-center justify-center gap-2 shadow-lg transition-all", formLoading && "opacity-70 cursor-not-allowed")}
                >
                  {formLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Verifying...</> : <><span>Login</span><ChevronRight className="w-5 h-5" /></>}
                </button>
              </motion.form>
            )}

            {loginMethod === "otp" && !isOverlayOpen && (
              <motion.div key="otp" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                {!otpSent ? (
                  <form onSubmit={handleSendOtpLogin} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#7A7A7A] uppercase tracking-[0.2em]">Email</label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#D1D5DB]" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); setOtpError(""); }}
                          required
                          placeholder="your@email.com"
                          className="w-full pl-12 pr-4 py-4 bg-white border border-[#E5E7EB] rounded-2xl outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 text-[#1A1A1A]"
                        />
                      </div>
                    </div>
                    {otpError && <p className="text-sm text-[#F39C12]">{otpError}</p>}
                    <button type="submit" disabled={formLoading} className={cn("w-full py-4 px-6 rounded-2xl font-bold text-white bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2", formLoading && "opacity-70")}>
                      {formLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : null} Send OTP to Email
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtpLogin} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#7A7A7A] uppercase tracking-[0.2em]">Enter OTP</label>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="000000"
                        maxLength={6}
                        className="w-full px-4 py-4 bg-white border border-[#E5E7EB] rounded-2xl outline-none focus:ring-4 focus:ring-blue-600/5 text-center text-2xl tracking-[0.5em] font-mono text-[#1A1A1A]"
                      />
                      <p className="text-xs text-[#6B7280]">OTP sent to {email}</p>
                    </div>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => { setOtpSent(false); setOtp(""); }} className="flex-1 py-3 rounded-xl border border-[#E5E7EB] text-[#374151] font-medium hover:bg-[#F8FAFC]">Change Email</button>
                      <button type="submit" disabled={formLoading} className={cn("flex-1 py-4 rounded-2xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center gap-2", formLoading && "opacity-70")}>
                        {formLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : null} Verify & Login
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Forgot Password Overlay */}
          <AnimatePresence>
            {overlayFlow === "forgot" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                onClick={closeOverlay}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-[#1A1A1A]">Reset Password</h3>
                    <button onClick={closeOverlay} className="p-1 text-[#7A7A7A] hover:text-[#6B7280] rounded-lg">×</button>
                  </div>
                  {forgotStep === "email" && (
                    <form onSubmit={handleForgotSendOtp} className="space-y-4">
                      <p className="text-sm text-[#6B7280]">Enter your email to receive an OTP for resetting your password.</p>
                      <div>
                        <label className="block text-xs font-medium text-[#6B7280] mb-1">Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="your@email.com" className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] focus:ring-2 focus:ring-[#2D5DA8]/20 focus:border-[#2D5DA8] focus:border-[#2D5DA8]" />
                      </div>
                      {otpError && <p className="text-sm text-[#F39C12]">{otpError}</p>}
                      <div className="flex gap-3 pt-2">
                        <button type="button" onClick={closeOverlay} className="flex-1 py-3 rounded-xl border border-[#E5E7EB] text-[#374151] font-medium hover:bg-[#F8FAFC]">Cancel</button>
                        <button type="submit" disabled={formLoading} className="flex-1 py-3 rounded-xl bg-[#2D5DA8] text-white font-semibold hover:bg-[#1E4A85] disabled:opacity-70 flex items-center justify-center gap-2">{formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Send OTP</button>
                      </div>
                    </form>
                  )}
                  {forgotStep === "otp" && (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                      <p className="text-sm text-[#6B7280]">Enter the OTP sent to {email} and set a new password.</p>
                      <div>
                        <label className="block text-xs font-medium text-[#6B7280] mb-1">OTP</label>
                        <input type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" maxLength={6} className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] text-center text-xl tracking-widest font-mono focus:ring-2 focus:ring-[#2D5DA8]/20 focus:border-[#2D5DA8]" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#6B7280] mb-1">New Password</label>
                        <input type={showPassword ? "text" : "password"} value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} required minLength={8} placeholder="Min 8 characters" className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] focus:ring-2 focus:ring-[#2D5DA8]/20 focus:border-[#2D5DA8]" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#6B7280] mb-1">Confirm Password</label>
                        <input type="password" value={resetConfirm} onChange={(e) => setResetConfirm(e.target.value)} required placeholder="Repeat password" className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] focus:ring-2 focus:ring-[#2D5DA8]/20 focus:border-[#2D5DA8]" />
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => { setForgotStep("email"); setForgotOtpSent(false); setOtp(""); }} className="flex-1 py-3 rounded-xl border border-[#E5E7EB] text-[#374151] font-medium hover:bg-[#F8FAFC]">Back</button>
                        <button type="submit" disabled={formLoading} className="flex-1 py-3 rounded-xl bg-[#A8C63A] text-[#1A1A1A] font-semibold hover:bg-[#8FA92F] disabled:opacity-70 flex items-center justify-center gap-2">{formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Reset & Login</button>
                      </div>
                    </form>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* First-time setup Overlay */}
          <AnimatePresence>
            {overlayFlow === "firstTime" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={closeOverlay}>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-[#1A1A1A]">First Time Setup</h3>
                    <button onClick={closeOverlay} className="p-1 text-[#7A7A7A] hover:text-[#6B7280] rounded-lg">×</button>
                  </div>
                  {firstTimeStep === "email" && (
                    <form onSubmit={handleCheckFirstTime} className="space-y-4">
                      <p className="text-sm text-[#6B7280]">Enter your email to begin setup.</p>
                      <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setOtpError(""); }} required placeholder="your@email.com" className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] focus:ring-2 focus:ring-[#2D5DA8]/20 focus:border-[#2D5DA8]" />
                      {otpError && <p className="text-sm text-[#F39C12]">{otpError}</p>}
                      <div className="flex gap-3 pt-2">
                        <button type="button" onClick={closeOverlay} className="flex-1 py-3 rounded-xl border border-[#E5E7EB] text-[#374151] font-medium hover:bg-[#F8FAFC]">Cancel</button>
                        <button type="submit" disabled={formLoading} className="flex-1 py-3 rounded-xl bg-[#2D5DA8] text-white font-semibold hover:bg-[#1E4A85] disabled:opacity-70 flex items-center justify-center gap-2">{formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Continue</button>
                      </div>
                    </form>
                  )}
                  {firstTimeStep === "send" && (
                    <form onSubmit={handleFirstTimeSendOtp} className="space-y-4">
                      <p className="text-sm text-[#6B7280]">We&apos;ll send an OTP to {email}.</p>
                      {otpError && <p className="text-sm text-[#F39C12]">{otpError}</p>}
                      <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setFirstTimeStep("email")} className="flex-1 py-3 rounded-xl border border-[#E5E7EB] text-[#374151] font-medium hover:bg-[#F8FAFC]">Change Email</button>
                        <button type="submit" disabled={formLoading} className="flex-1 py-3 rounded-xl bg-[#2D5DA8] text-white font-semibold hover:bg-[#1E4A85] disabled:opacity-70 flex items-center justify-center gap-2">{formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Send OTP</button>
                      </div>
                    </form>
                  )}
                  {firstTimeStep === "verify" && (
                    <form onSubmit={handleVerifyOtpSetPassword} className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-[#6B7280] mb-1">OTP</label>
                        <input type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" maxLength={6} className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] text-center text-xl tracking-widest font-mono" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#6B7280] mb-1">New Password</label>
                        <input type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} placeholder="Min 8 characters" className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB]" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#6B7280] mb-1">Confirm Password</label>
                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="Repeat password" className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB]" />
                      </div>
                      <button type="submit" disabled={formLoading} className="w-full py-3 rounded-xl bg-[#A8C63A] text-[#1A1A1A] font-semibold hover:bg-[#8FA92F] disabled:opacity-70 flex items-center justify-center gap-2">{formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Set Password & Login</button>
                    </form>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="mt-8 text-center">
            <button type="button" onClick={() => setOverlayFlow("firstTime")} className="text-sm text-[#2D5DA8] hover:text-[#1E4A85] font-medium">
              First time? Set up your account →
            </button>
          </p>

          <p className="mt-6 text-center text-[#6B7280] text-sm">
            Need help?{" "}
            <button type="button" onClick={() => setSupportOpen(true)} className="text-[#2D5DA8] font-bold hover:underline underline-offset-4">Contact Support</button>
            {" "}or{" "}
            <a href={`mailto:${SUPPORT_EMAIL}?subject=Support%20Request`} className="text-[#2D5DA8] font-bold hover:underline underline-offset-4">email {SUPPORT_EMAIL}</a>
          </p>
        </div>
      </div>

      {/* Support Modal */}
      <AnimatePresence>
        {supportOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSupportOpen(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">Contact Support</h3>
              <form onSubmit={handleSupportSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#6B7280] mb-1">Name</label>
                  <input type="text" value={supportName} onChange={(e) => setSupportName(e.target.value)} required placeholder="Your name" className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] focus:ring-2 focus:ring-[#2D5DA8]/20 focus:border-[#2D5DA8]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B7280] mb-1">Email</label>
                  <input type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} required placeholder="your@email.com" className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] focus:ring-2 focus:ring-[#2D5DA8]/20 focus:border-[#2D5DA8]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B7280] mb-1">Message</label>
                  <textarea value={supportMessage} onChange={(e) => setSupportMessage(e.target.value)} required rows={4} placeholder="How can we help?" className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] focus:ring-2 focus:ring-[#2D5DA8]/20 focus:border-[#2D5DA8] resize-none" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setSupportOpen(false)} className="flex-1 py-3 rounded-xl border border-[#E5E7EB] text-[#374151] font-medium hover:bg-[#F8FAFC]">Cancel</button>
                  <button type="submit" disabled={supportSubmitting} className="flex-1 py-3 rounded-xl bg-[#2D5DA8] text-white font-semibold hover:bg-[#1E4A85] disabled:opacity-70 flex items-center justify-center gap-2">{supportSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Send</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<PageLoader text="Loading..." />}>
      <LoginForm />
    </Suspense>
  );
}

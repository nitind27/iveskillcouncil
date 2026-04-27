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
      return decoded.startsWith("/") && !decoded.startsWith("/login") ? decoded : "/dashboard";
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
      <div className="relative hidden md:flex md:w-[45%] lg:w-[40%] bg-[#0f172a] overflow-hidden flex-col items-center justify-center p-12">
        <div className="absolute -top-20 -right-20 w-[450px] h-[450px] rounded-full bg-gradient-to-br from-blue-600 via-blue-400 to-cyan-300 blur-[80px] opacity-60 animate-pulse" style={{ animationDuration: "8s" }} />
        <div className="absolute -bottom-40 -left-20 w-[500px] h-[500px] rounded-full bg-indigo-600/30 blur-[120px] animate-bounce" style={{ animationDuration: "12s" }} />
        <div className="relative z-10 flex flex-col items-center group">
          <div className="relative transition-transform duration-700 ease-out group-hover:scale-110 group-hover:-rotate-2">
            {logoUrl ? (
              <img src={logoUrl} alt={siteName} className="w-full max-w-[280px] drop-shadow-[0_20px_50px_rgba(59,130,246,0.5)]" />
            ) : (
              <div className="w-40 h-40 rounded-2xl bg-blue-600 flex items-center justify-center shadow-[0_20px_50px_rgba(59,130,246,0.5)]">
                <span className="text-white font-black text-5xl">{siteName.charAt(0)}</span>
              </div>
            )}
            <div className="absolute inset-0 border-2 border-white/10 rounded-full scale-150 animate-ping opacity-20" style={{ animationDuration: "4s" }} />
          </div>
          <div className="mt-12 text-center">
            <h1 className="text-3xl font-black text-white tracking-tighter mb-2">{siteName}</h1>
            <div className="h-1 w-12 bg-blue-500 mx-auto rounded-full mb-4 group-hover:w-24 transition-all duration-500" />
            <p className="text-blue-200/60 font-medium text-sm uppercase tracking-widest">{tagline || "Innovation in Learning"}</p>
          </div>
        </div>
      </div>

      {/* RIGHT: Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-16 lg:p-24 bg-slate-50/30">
        <div className="w-full max-w-[420px]">
          <div className="mb-8">
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-3">Sign In</h2>
            <p className="text-slate-500 text-lg">Welcome back. Choose how to sign in.</p>
          </div>

          {/* Method tabs: Password | OTP */}
          <div className="flex gap-1 p-1 rounded-2xl bg-slate-200/60 mb-6">
            <button
              type="button"
              onClick={() => { setLoginMethod("password"); closeOverlay(); setOtpSent(false); setOtp(""); setOtpError(""); }}
              className={cn(
                "flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2",
                loginMethod === "password" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Lock className="w-4 h-4" /> Password
            </button>
            <button
              type="button"
              onClick={() => { setLoginMethod("otp"); closeOverlay(); setOtpSent(false); setOtp(""); setOtpError(""); }}
              className={cn(
                "flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2",
                loginMethod === "otp" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
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
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-600" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="admin@eklavya.com"
                      className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 text-slate-900"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Password</label>
                    <button
                      type="button"
                      onClick={() => { setOverlayFlow("forgot"); setForgotStep("email"); setForgotOtpSent(false); setOtp(""); setResetPassword(""); setResetConfirm(""); setOtpError(""); }}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-600" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full pl-12 pr-12 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 text-slate-900"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-600">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={formLoading}
                  className={cn("w-full py-4 px-6 rounded-2xl font-bold text-white bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2", formLoading && "opacity-70 cursor-not-allowed")}
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
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Email</label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); setOtpError(""); }}
                          required
                          placeholder="your@email.com"
                          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 text-slate-900"
                        />
                      </div>
                    </div>
                    {otpError && <p className="text-sm text-amber-600">{otpError}</p>}
                    <button type="submit" disabled={formLoading} className={cn("w-full py-4 px-6 rounded-2xl font-bold text-white bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2", formLoading && "opacity-70")}>
                      {formLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : null} Send OTP to Email
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtpLogin} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Enter OTP</label>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="000000"
                        maxLength={6}
                        className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-600/5 text-center text-2xl tracking-[0.5em] font-mono text-slate-900"
                      />
                      <p className="text-xs text-slate-500">OTP sent to {email}</p>
                    </div>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => { setOtpSent(false); setOtp(""); }} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50">Change Email</button>
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
                    <h3 className="text-lg font-bold text-slate-900">Reset Password</h3>
                    <button onClick={closeOverlay} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">×</button>
                  </div>
                  {forgotStep === "email" && (
                    <form onSubmit={handleForgotSendOtp} className="space-y-4">
                      <p className="text-sm text-slate-500">Enter your email to receive an OTP for resetting your password.</p>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="your@email.com" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                      </div>
                      {otpError && <p className="text-sm text-amber-600">{otpError}</p>}
                      <div className="flex gap-3 pt-2">
                        <button type="button" onClick={closeOverlay} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50">Cancel</button>
                        <button type="submit" disabled={formLoading} className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-70 flex items-center justify-center gap-2">{formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Send OTP</button>
                      </div>
                    </form>
                  )}
                  {forgotStep === "otp" && (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                      <p className="text-sm text-slate-500">Enter the OTP sent to {email} and set a new password.</p>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">OTP</label>
                        <input type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" maxLength={6} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-center text-xl tracking-widest font-mono focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">New Password</label>
                        <input type={showPassword ? "text" : "password"} value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} required minLength={8} placeholder="Min 8 characters" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Confirm Password</label>
                        <input type="password" value={resetConfirm} onChange={(e) => setResetConfirm(e.target.value)} required placeholder="Repeat password" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => { setForgotStep("email"); setForgotOtpSent(false); setOtp(""); }} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50">Back</button>
                        <button type="submit" disabled={formLoading} className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-70 flex items-center justify-center gap-2">{formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Reset & Login</button>
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
                    <h3 className="text-lg font-bold text-slate-900">First Time Setup</h3>
                    <button onClick={closeOverlay} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">×</button>
                  </div>
                  {firstTimeStep === "email" && (
                    <form onSubmit={handleCheckFirstTime} className="space-y-4">
                      <p className="text-sm text-slate-500">Enter your email to begin setup.</p>
                      <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setOtpError(""); }} required placeholder="your@email.com" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500" />
                      {otpError && <p className="text-sm text-amber-600">{otpError}</p>}
                      <div className="flex gap-3 pt-2">
                        <button type="button" onClick={closeOverlay} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50">Cancel</button>
                        <button type="submit" disabled={formLoading} className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-70 flex items-center justify-center gap-2">{formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Continue</button>
                      </div>
                    </form>
                  )}
                  {firstTimeStep === "send" && (
                    <form onSubmit={handleFirstTimeSendOtp} className="space-y-4">
                      <p className="text-sm text-slate-500">We&apos;ll send an OTP to {email}.</p>
                      {otpError && <p className="text-sm text-amber-600">{otpError}</p>}
                      <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setFirstTimeStep("email")} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50">Change Email</button>
                        <button type="submit" disabled={formLoading} className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-70 flex items-center justify-center gap-2">{formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Send OTP</button>
                      </div>
                    </form>
                  )}
                  {firstTimeStep === "verify" && (
                    <form onSubmit={handleVerifyOtpSetPassword} className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">OTP</label>
                        <input type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" maxLength={6} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-center text-xl tracking-widest font-mono" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">New Password</label>
                        <input type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} placeholder="Min 8 characters" className="w-full px-4 py-3 rounded-xl border border-slate-200" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Confirm Password</label>
                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="Repeat password" className="w-full px-4 py-3 rounded-xl border border-slate-200" />
                      </div>
                      <button type="submit" disabled={formLoading} className="w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-70 flex items-center justify-center gap-2">{formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Set Password & Login</button>
                    </form>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="mt-8 text-center">
            <button type="button" onClick={() => setOverlayFlow("firstTime")} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              First time? Set up your account →
            </button>
          </p>

          <p className="mt-6 text-center text-slate-500 text-sm">
            Need help?{" "}
            <button type="button" onClick={() => setSupportOpen(true)} className="text-blue-600 font-bold hover:underline underline-offset-4">Contact Support</button>
            {" "}or{" "}
            <a href={`mailto:${SUPPORT_EMAIL}?subject=Support%20Request`} className="text-blue-600 font-bold hover:underline underline-offset-4">email {SUPPORT_EMAIL}</a>
          </p>
        </div>
      </div>

      {/* Support Modal */}
      <AnimatePresence>
        {supportOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSupportOpen(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Contact Support</h3>
              <form onSubmit={handleSupportSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Name</label>
                  <input type="text" value={supportName} onChange={(e) => setSupportName(e.target.value)} required placeholder="Your name" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                  <input type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} required placeholder="your@email.com" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Message</label>
                  <textarea value={supportMessage} onChange={(e) => setSupportMessage(e.target.value)} required rows={4} placeholder="How can we help?" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 resize-none" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setSupportOpen(false)} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50">Cancel</button>
                  <button type="submit" disabled={supportSubmitting} className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-70 flex items-center justify-center gap-2">{supportSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Send</button>
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

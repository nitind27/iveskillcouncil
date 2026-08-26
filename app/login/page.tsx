"use client";

import Link from "next/link";
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
  Smartphone,
  GraduationCap,
  Check,
  X,
  KeyRound,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { showSuccess, showError } from "@/lib/toast";
import { validateName, validateEmail } from "@/lib/validation";
import { useLogoConfig } from "@/hooks/useLogoConfig";
import PageLoader from "@/components/common/PageLoader";
import LoginBrandPanel from "@/components/login/LoginBrandPanel";
import {
  parseLoginRedirectParam,
  resolvePostLoginRedirect,
} from "@/lib/post-login-redirect";

type LoginMethod = "password" | "otp";
type OverlayFlow = "forgot" | "firstTime" | null;

function LoginForm() {
  const searchParams = useSearchParams();
  const { logoUrl, siteName, tagline } = useLogoConfig();
  const { login, loginWithOtp, verifyAdminOtp, user, loading: authLoading, dbUnavailable } = useAuth();
  
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("password");
  const [overlayFlow, setOverlayFlow] = useState<OverlayFlow>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  /** Admin (Institute) only: after password, show email OTP step */
  const [adminOtpStep, setAdminOtpStep] = useState(false);
  const [adminOtp, setAdminOtp] = useState("");
  const [adminOtpError, setAdminOtpError] = useState("");
  
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

  const getRedirectUrl = () => parseLoginRedirectParam(searchParams?.get("redirect"));

  const redirectParam = searchParams?.get("redirect") ?? "";
  const redirect = getRedirectUrl();

  const goAfterLogin = (loggedInUser?: { roleId: number } | null) => {
    const roleId = loggedInUser?.roleId ?? user?.roleId ?? 0;
    const target = resolvePostLoginRedirect(redirectParam || "/dashboard", Number(roleId));
    window.location.replace(target);
  };

  useEffect(() => {
    if (user && !authLoading && !formLoading) {
      goAfterLogin(user);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, formLoading, redirectParam]);

  // --- Password Login (Admin Institute → OTP step) ---
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setAdminOtpError("");
    try {
      const result = await login(email, password);
      if (result.ok && result.requiresOtp) {
        if (result.email) setEmail(result.email);
        setAdminOtp("");
        setAdminOtpStep(true);
        showSuccess("OTP Sent", "Check your email for the 6-digit code. Valid for 10 minutes.");
        setFormLoading(false);
        return;
      }
      if (result.ok) {
        showSuccess("Login Successful", "Redirecting...");
        setTimeout(() => goAfterLogin(), 1200);
      } else {
        const isDb = result.error?.toLowerCase().includes("database");
        showError(
          isDb ? "Server Unavailable" : "Invalid Credentials",
          result.error || "Please check your email and password."
        );
        setFormLoading(false);
      }
    } catch (error: unknown) {
      showError("Error", error instanceof Error ? error.message : "An unexpected error occurred.");
      setFormLoading(false);
    }
  };

  const handleAdminOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = adminOtp.trim();
    if (!/^\d{6}$/.test(code)) {
      setAdminOtpError("Enter the 6-digit OTP from your email.");
      return;
    }
    setFormLoading(true);
    setAdminOtpError("");
    try {
      const result = await verifyAdminOtp(email.trim().toLowerCase(), code);
      if (result.ok) {
        showSuccess("Login Successful", "Redirecting...");
        setTimeout(() => goAfterLogin(), 1200);
      } else {
        setAdminOtpError(result.error || "Invalid or expired OTP");
        showError("Invalid OTP", result.error || "Request a new code by signing in again.");
        setFormLoading(false);
      }
    } catch {
      setAdminOtpError("Network error. Please try again.");
      showError("Error", "Network error");
      setFormLoading(false);
    }
  };

  const handleAdminOtpResend = async () => {
    if (!email.trim() || !password) {
      showError("Resend", "Go back and enter your password again to resend OTP.");
      return;
    }
    setFormLoading(true);
    setAdminOtpError("");
    try {
      const result = await login(email, password);
      if (result.ok && result.requiresOtp) {
        setAdminOtp("");
        showSuccess("OTP Sent", "A new code was sent to your email.");
      } else if (!result.ok) {
        showError("Error", result.error || "Could not resend OTP");
      }
    } catch {
      showError("Error", "Network error");
    } finally {
      setFormLoading(false);
    }
  };

  const backFromAdminOtp = () => {
    setAdminOtpStep(false);
    setAdminOtp("");
    setAdminOtpError("");
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
        setTimeout(() => goAfterLogin(), 1200);
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
        setTimeout(() => goAfterLogin(), 1200);
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
        setTimeout(() => goAfterLogin(), 1200);
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
    <div className="login-page login-mesh-bg relative grid min-h-screen w-full grid-cols-1 overflow-x-hidden font-sans text-white lg:grid-cols-[minmax(0,44%)_minmax(0,56%)] lg:items-stretch">

      <LoginBrandPanel logoUrl={logoUrl} siteName={siteName} tagline={tagline} />

      {/* RIGHT — login form */}
      <div className="relative z-10 flex flex-col justify-center px-5 py-8 sm:px-8 lg:min-h-screen lg:px-10 lg:py-12 xl:px-14">
        <div className="mx-auto w-full max-w-[420px]">
          <Link
            href="/userpanel"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/50 transition-colors hover:text-white/90"
          >
            ← Back to website
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <div className="login-glass-card rounded-2xl p-6 sm:p-8">
              {dbUnavailable && (
                <div className="mb-4 rounded-xl border border-amber-400/30 bg-amber-500/15 px-3 py-2.5 text-xs leading-relaxed text-amber-100">
                  <p className="font-semibold text-amber-50">Database reconnecting…</p>
                  <p className="mt-1 text-amber-100/80">
                    After a laptop restart, run <span className="font-mono text-amber-50">npm run dev</span>{" "}
                    (starts DB proxy). Wait a few seconds, then try login again. Your session cookies are kept.
                  </p>
                </div>
              )}
              {/* Header */}
              {!isOverlayOpen ? (
                <>
                  {adminOtpStep ? (
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#C4A35A]/15 text-[#C4A35A]">
                        <Smartphone className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#C4A35A]">
                          Admin (Institute)
                        </p>
                        <h2 className="mt-0.5 text-2xl font-extrabold text-white sm:text-[1.65rem]">
                          Enter OTP
                        </h2>
                        <p className="mt-1 text-sm text-white/50">
                          We sent a 6-digit code to{" "}
                          <span className="font-medium text-white/80">{email}</span>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-2xl font-extrabold text-white sm:text-[1.65rem]">Sign in</h2>
                      <p className="mt-1 text-sm text-white/50">Welcome back — enter your credentials</p>

                      <div className="mt-6 flex rounded-xl bg-white/[0.06] p-1">
                        <button
                          type="button"
                          onClick={() => { setLoginMethod("password"); setOtpSent(false); setOtp(""); setOtpError(""); }}
                          className={cn(
                            "flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all",
                            loginMethod === "password"
                              ? "bg-white text-[#0B132B] shadow-sm"
                              : "text-white/55 hover:text-white/85"
                          )}
                        >
                          <Lock className="h-4 w-4" /> Password
                        </button>
                        <button
                          type="button"
                          onClick={() => { setLoginMethod("otp"); setOtpSent(false); setOtp(""); setOtpError(""); }}
                          className={cn(
                            "flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all",
                            loginMethod === "otp"
                              ? "bg-white text-[#0B132B] shadow-sm"
                              : "text-white/55 hover:text-white/85"
                          )}
                        >
                          <Smartphone className="h-4 w-4" /> OTP
                        </button>
                      </div>
                    </>
                  )}
                </>
              ) : overlayFlow === "forgot" ? (
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#C4A35A]/15 text-[#C4A35A]">
                      <KeyRound className="h-5 w-5" />
                    </span>
                    <div>
                      <h2 className="text-xl font-extrabold text-white">Reset password</h2>
                      <p className="mt-1 text-sm text-white/50">
                        {forgotStep === "email"
                          ? "Enter your email to receive an OTP"
                          : "Enter OTP and set a new password"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={closeOverlay}
                    className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#C4A35A]/15 text-[#C4A35A]">
                      <UserPlus className="h-5 w-5" />
                    </span>
                    <div>
                      <h2 className="text-xl font-extrabold text-white">Set up your account</h2>
                      <p className="mt-1 text-sm text-white/50">
                        {firstTimeStep === "email"
                          ? "Enter your email to begin setup"
                          : firstTimeStep === "send"
                            ? "Confirm and send OTP"
                            : "Verify OTP and set your password"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={closeOverlay}
                    className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}

          <AnimatePresence mode="wait">
            {!isOverlayOpen && adminOtpStep && (
              <motion.form
                key="admin-otp"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                onSubmit={handleAdminOtpVerify}
                className="mt-6 space-y-5"
              >
                <div className="rounded-xl border border-[#C4A35A]/25 bg-[#C4A35A]/10 px-3.5 py-3 text-xs leading-relaxed text-[#E8D5A3]">
                  Password verified. Enter the OTP emailed to your Admin (Institute) account to finish login.
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/55">6-digit OTP</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={adminOtp}
                    onChange={(e) => {
                      setAdminOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                      setAdminOtpError("");
                    }}
                    required
                    placeholder="••••••"
                    className="w-full rounded-xl border border-white/10 bg-white py-3.5 text-center font-mono text-2xl font-bold tracking-[0.4em] text-[#0F172A] outline-none transition-all focus:border-[#C4A35A]/50 focus:ring-2 focus:ring-[#C4A35A]/20"
                  />
                  {adminOtpError && <p className="text-sm text-red-400">{adminOtpError}</p>}
                </div>

                <button
                  type="submit"
                  disabled={formLoading || adminOtp.length !== 6}
                  className={cn(
                    "login-btn-gold mt-1 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-[#0B132B] transition-all",
                    (formLoading || adminOtp.length !== 6) && "cursor-not-allowed opacity-70"
                  )}
                >
                  {formLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Verifying...
                    </>
                  ) : (
                    <>
                      Verify &amp; sign in
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={backFromAdminOtp}
                    className="text-sm font-semibold text-white/50 hover:text-white/85"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    disabled={formLoading}
                    onClick={handleAdminOtpResend}
                    className="text-sm font-semibold text-[#C4A35A] hover:text-[#D4B86A] disabled:opacity-60"
                  >
                    Resend OTP
                  </button>
                </div>
              </motion.form>
            )}

            {!isOverlayOpen && !adminOtpStep && loginMethod === "password" && (
              <motion.form
                key="password"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handlePasswordLogin}
                className="mt-6 space-y-5"
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/55">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="admin@example.com"
                      className="w-full rounded-xl border border-white/10 bg-white py-3 pl-10 pr-4 text-[#0F172A] outline-none transition-all focus:border-[#C4A35A]/50 focus:ring-2 focus:ring-[#C4A35A]/20"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-white/55">Password</label>
                    <button
                      type="button"
                      onClick={() => { setOverlayFlow("forgot"); setForgotStep("email"); setForgotOtpSent(false); setOtp(""); setResetPassword(""); setResetConfirm(""); setOtpError(""); }}
                      className="text-xs font-semibold text-[#C4A35A] hover:text-[#D4B86A]"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-white/10 bg-white py-3 pl-10 pr-10 text-[#0F172A] outline-none transition-all focus:border-[#C4A35A]/50 focus:ring-2 focus:ring-[#C4A35A]/20"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#1E4A85]">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <label className="flex cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-white/10 accent-[#C4A35A]"
                  />
                  <span className="text-sm text-white/55">Remember me</span>
                </label>

                <button
                  type="submit"
                  disabled={formLoading}
                  className={cn(
                    "login-btn-gold mt-1 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-[#0B132B] transition-all",
                    formLoading && "cursor-not-allowed opacity-70"
                  )}
                >
                  {formLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</> : <>Sign in<ChevronRight className="h-4 w-4" /></>}
                </button>
              </motion.form>
            )}

            {loginMethod === "otp" && !isOverlayOpen && !adminOtpStep && (
              <motion.div key="otp" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="mt-6 space-y-5">
                {!otpSent ? (
                  <form onSubmit={handleSendOtpLogin} className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-white/55">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); setOtpError(""); }}
                          required
                          placeholder="your@email.com"
                          className="w-full rounded-xl border border-white/10 bg-white py-3 pl-10 pr-4 text-[#0F172A] outline-none transition-all focus:border-[#C4A35A]/50 focus:ring-2 focus:ring-[#C4A35A]/20"
                        />
                      </div>
                    </div>
                    {otpError && <p className="text-sm text-red-400">{otpError}</p>}
                    <button type="submit" disabled={formLoading} className={cn("login-btn-gold flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-[#0B132B] transition-all", formLoading && "cursor-not-allowed opacity-70")}>
                      {formLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Send OTP to email
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtpLogin} className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-white/55">Enter OTP</label>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="000000"
                        maxLength={6}
                        className="w-full rounded-xl border border-white/10 bg-white px-4 py-3 text-center font-mono text-2xl tracking-[0.4em] text-[#0F172A] outline-none focus:border-[#C4A35A]/50 focus:ring-2 focus:ring-[#C4A35A]/20"
                      />
                      <p className="text-xs text-white/45">OTP sent to {email}</p>
                    </div>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => { setOtpSent(false); setOtp(""); }} className="flex-1 rounded-xl border border-white/15 py-3 text-sm font-medium text-white/70 transition-colors hover:bg-white/5">Change email</button>
                      <button type="submit" disabled={formLoading} className={cn("login-btn-gold flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-[#0B132B]", formLoading && "cursor-not-allowed opacity-70")}>
                        {formLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Verify & sign in
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Forgot password — in-card */}
          {overlayFlow === "forgot" && (
            <motion.div
              key="forgot"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6"
            >
              {forgotStep === "email" && (
                <form onSubmit={handleForgotSendOtp} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/55">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="your@email.com"
                        className="w-full rounded-xl border border-white/10 bg-white py-3 pl-10 pr-4 text-[#0F172A] outline-none transition-all focus:border-[#C4A35A]/50 focus:ring-2 focus:ring-[#C4A35A]/20"
                      />
                    </div>
                  </div>
                  {otpError && <p className="text-sm text-red-400">{otpError}</p>}
                  <div className="flex gap-3">
                    <button type="button" onClick={closeOverlay} className="flex-1 rounded-xl border border-white/15 py-3 text-sm font-medium text-white/70 transition-colors hover:bg-white/5">
                      Cancel
                    </button>
                    <button type="submit" disabled={formLoading} className={cn("login-btn-gold flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-[#0B132B]", formLoading && "cursor-not-allowed opacity-70")}>
                      {formLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Send OTP
                    </button>
                  </div>
                </form>
              )}
              {forgotStep === "otp" && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/55">OTP</label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      className="w-full rounded-xl border border-white/10 bg-white px-4 py-3 text-center font-mono text-xl tracking-widest text-[#0F172A] outline-none focus:border-[#C4A35A]/50 focus:ring-2 focus:ring-[#C4A35A]/20"
                    />
                    <p className="text-xs text-white/45">OTP sent to {email}</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/55">New password</label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      required
                      minLength={8}
                      placeholder="Min 8 characters"
                      className="w-full rounded-xl border border-white/10 bg-white px-4 py-3 text-[#0F172A] outline-none focus:border-[#C4A35A]/50 focus:ring-2 focus:ring-[#C4A35A]/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/55">Confirm password</label>
                    <input
                      type="password"
                      value={resetConfirm}
                      onChange={(e) => setResetConfirm(e.target.value)}
                      required
                      placeholder="Repeat password"
                      className="w-full rounded-xl border border-white/10 bg-white px-4 py-3 text-[#0F172A] outline-none focus:border-[#C4A35A]/50 focus:ring-2 focus:ring-[#C4A35A]/20"
                    />
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => { setForgotStep("email"); setForgotOtpSent(false); setOtp(""); }} className="flex-1 rounded-xl border border-white/15 py-3 text-sm font-medium text-white/70 transition-colors hover:bg-white/5">
                      Back
                    </button>
                    <button type="submit" disabled={formLoading} className={cn("login-btn-gold flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-[#0B132B]", formLoading && "cursor-not-allowed opacity-70")}>
                      {formLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Reset & login
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          )}

          {/* First-time setup — in-card */}
          {overlayFlow === "firstTime" && (
            <motion.div
              key="firstTime"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6"
            >
              {firstTimeStep === "email" && (
                <form onSubmit={handleCheckFirstTime} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/55">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setOtpError(""); }}
                        required
                        placeholder="your@email.com"
                        className="w-full rounded-xl border border-white/10 bg-white py-3 pl-10 pr-4 text-[#0F172A] outline-none transition-all focus:border-[#C4A35A]/50 focus:ring-2 focus:ring-[#C4A35A]/20"
                      />
                    </div>
                  </div>
                  {otpError && <p className="text-sm text-red-400">{otpError}</p>}
                  <div className="flex gap-3">
                    <button type="button" onClick={closeOverlay} className="flex-1 rounded-xl border border-white/15 py-3 text-sm font-medium text-white/70 transition-colors hover:bg-white/5">
                      Cancel
                    </button>
                    <button type="submit" disabled={formLoading} className={cn("login-btn-gold flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-[#0B132B]", formLoading && "cursor-not-allowed opacity-70")}>
                      {formLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Continue
                    </button>
                  </div>
                </form>
              )}
              {firstTimeStep === "send" && (
                <form onSubmit={handleFirstTimeSendOtp} className="space-y-5">
                  <p className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/70">
                    We&apos;ll send a one-time code to <span className="font-semibold text-white">{email}</span>
                  </p>
                  {otpError && <p className="text-sm text-red-400">{otpError}</p>}
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setFirstTimeStep("email")} className="flex-1 rounded-xl border border-white/15 py-3 text-sm font-medium text-white/70 transition-colors hover:bg-white/5">
                      Change email
                    </button>
                    <button type="submit" disabled={formLoading} className={cn("login-btn-gold flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-[#0B132B]", formLoading && "cursor-not-allowed opacity-70")}>
                      {formLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Send OTP
                    </button>
                  </div>
                </form>
              )}
              {firstTimeStep === "verify" && (
                <form onSubmit={handleVerifyOtpSetPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/55">OTP</label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      className="w-full rounded-xl border border-white/10 bg-white px-4 py-3 text-center font-mono text-xl tracking-widest text-[#0F172A] outline-none focus:border-[#C4A35A]/50 focus:ring-2 focus:ring-[#C4A35A]/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/55">New password</label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                      placeholder="Min 8 characters"
                      className="w-full rounded-xl border border-white/10 bg-white px-4 py-3 text-[#0F172A] outline-none focus:border-[#C4A35A]/50 focus:ring-2 focus:ring-[#C4A35A]/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/55">Confirm password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Repeat password"
                      className="w-full rounded-xl border border-white/10 bg-white px-4 py-3 text-[#0F172A] outline-none focus:border-[#C4A35A]/50 focus:ring-2 focus:ring-[#C4A35A]/20"
                    />
                  </div>
                  <button type="submit" disabled={formLoading} className={cn("login-btn-gold flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-[#0B132B]", formLoading && "cursor-not-allowed opacity-70")}>
                    {formLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Set password & login
                  </button>
                </form>
              )}
            </motion.div>
          )}

          {!isOverlayOpen && !adminOtpStep && (
            <>
              <p className="mt-5 text-center text-sm text-white/45">
                New here?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setOverlayFlow("firstTime");
                    setFirstTimeStep("email");
                    setOtpError("");
                    setOtp("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  className="font-semibold text-[#C4A35A] hover:text-[#D4B86A]"
                >
                  Set up your account →
                </button>
              </p>
              <p className="mt-3 text-center text-xs text-white/35">
                Need help?{" "}
                <button type="button" onClick={() => setSupportOpen(true)} className="font-medium text-white/55 hover:text-white/80">
                  Contact support
                </button>
              </p>
            </>
          )}
            </div>
          </motion.div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-white/40">
          <span>© {new Date().getFullYear()} {siteName}</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            All systems operational
          </span>
          </div>
        </div>
      </div>

      {/* Support Modal */}
      <AnimatePresence>
        {supportOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#070F1C]/75 p-4 backdrop-blur-sm"
            onClick={() => setSupportOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
              className="login-glass-card relative w-full max-w-md rounded-2xl p-6 sm:p-7"
            >
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-white">Contact support</h3>
                  <p className="mt-1 text-sm text-white/50">We&apos;ll get back to you soon</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSupportOpen(false)}
                  className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleSupportSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/55">Name</label>
                  <input type="text" value={supportName} onChange={(e) => setSupportName(e.target.value)} required placeholder="Your name" className="w-full rounded-xl border border-white/10 bg-white px-4 py-3 text-[#0F172A] outline-none focus:border-[#C4A35A]/50 focus:ring-2 focus:ring-[#C4A35A]/20" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/55">Email</label>
                  <input type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} required placeholder="your@email.com" className="w-full rounded-xl border border-white/10 bg-white px-4 py-3 text-[#0F172A] outline-none focus:border-[#C4A35A]/50 focus:ring-2 focus:ring-[#C4A35A]/20" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/55">Message</label>
                  <textarea value={supportMessage} onChange={(e) => setSupportMessage(e.target.value)} required rows={4} placeholder="How can we help?" className="w-full resize-none rounded-xl border border-white/10 bg-white px-4 py-3 text-[#0F172A] outline-none focus:border-[#C4A35A]/50 focus:ring-2 focus:ring-[#C4A35A]/20" />
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setSupportOpen(false)} className="flex-1 rounded-xl border border-white/15 py-3 text-sm font-medium text-white/70 transition-colors hover:bg-white/5">Cancel</button>
                  <button type="submit" disabled={supportSubmitting} className={cn("login-btn-gold flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-[#0B132B]", supportSubmitting && "cursor-not-allowed opacity-70")}>
                    {supportSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Send
                  </button>
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

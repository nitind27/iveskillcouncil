"use client";

import Link from "next/link";
import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Smartphone,
  X,
  KeyRound,
  UserPlus,
  User,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Headset,
  GraduationCap,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { showSuccess, showError } from "@/lib/toast";
import { validateName, validateEmail } from "@/lib/validation";
import { useLogoConfig } from "@/hooks/useLogoConfig";
import PageLoader from "@/components/common/PageLoader";
import { LoginBrandHero, LoginFeatureGrid } from "@/components/login/LoginBrandPanel";
import LoginBackdrop from "@/components/login/LoginBackdrop";
import LoginTrustBand from "@/components/login/LoginTrustBand";
import {
  LoginError,
  LoginField,
  LoginLabel,
  OtpField,
  PrimaryButton,
  SecondaryButton,
  SegmentedSwitch,
} from "@/components/login/LoginUI";
import { COUNCIL } from "@/components/userpanel/ui/council";
import {
  parseLoginRedirectParam,
  resolvePostLoginRedirect,
} from "@/lib/post-login-redirect";

type LoginMethod = "password" | "otp";
type OverlayFlow = "forgot" | "firstTime" | null;

const EASE = [0.22, 1, 0.36, 1] as const;

function LoginForm() {
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();
  const { logoUrl, siteName, tagline } = useLogoConfig();
  const { login, loginWithOtp, verifyAdminOtp, user, loading: authLoading, dbUnavailable } = useAuth();
  const userRef = useRef(user);
  userRef.current = user;
  
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

  const goAfterLogin = (loggedInUser?: {
    roleId: number;
    franchise?: { slug?: string | null } | null;
  } | null) => {
    const session = loggedInUser ?? userRef.current;
    const roleId = session?.roleId ?? 0;
    const slug = session?.franchise?.slug ?? null;
    const target = resolvePostLoginRedirect(redirectParam || "/dashboard", Number(roleId), slug);
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
        setTimeout(() => goAfterLogin(result.user), 1200);
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

  const switchMethod = (method: LoginMethod) => {
    setLoginMethod(method);
    setOtpSent(false);
    setOtp("");
    setOtpError("");
  };

  const openForgot = () => {
    setOverlayFlow("forgot");
    setForgotStep("email");
    setForgotOtpSent(false);
    setOtp("");
    setResetPassword("");
    setResetConfirm("");
    setOtpError("");
  };

  const openFirstTime = () => {
    setOverlayFlow("firstTime");
    setFirstTimeStep("email");
    setOtpError("");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const screen = overlayFlow ?? (adminOtpStep ? "admin" : "main");
  const slide = {
    initial: { opacity: 0, x: reduceMotion ? 0 : 16 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: EASE } },
    exit: { opacity: 0, x: reduceMotion ? 0 : -16, transition: { duration: 0.2 } },
  };
  const rise = {
    initial: { opacity: 0, y: reduceMotion ? 0 : 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
    exit: { opacity: 0, y: reduceMotion ? 0 : -8, transition: { duration: 0.2 } },
  };

  const passwordToggle = (
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      aria-label={showPassword ? "Hide password" : "Show password"}
      className="flex h-10 w-10 items-center justify-center rounded-xl text-[#8C9DB4] transition-colors hover:bg-ive-mist hover:text-ive-royal"
    >
      {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
    </button>
  );

  const headers: Record<typeof screen, { eyebrow?: string; title: string; description: React.ReactNode }> = {
    main: { title: "Welcome Back", description: <>Sign in to continue to {COUNCIL.shortName}</> },
    admin: {
      eyebrow: "Admin (Institute)",
      title: "Enter OTP",
      description: (
        <>
          We sent a 6-digit code to <span className="font-semibold text-white">{email}</span>
        </>
      ),
    },
    forgot: {
      title: "Reset password",
      description: forgotStep === "email" ? "Enter your email to receive an OTP" : "Enter OTP and set a new password",
    },
    firstTime: {
      title: "Set up your account",
      description:
        firstTimeStep === "email"
          ? "Enter your email to begin setup"
          : firstTimeStep === "send"
            ? "Confirm and send OTP"
            : "Verify OTP and set your password",
    },
  };
  const header = headers[screen];

  return (
    <div className="login-stage relative flex min-h-screen w-full flex-col overflow-x-hidden bg-white font-sans text-ive-navy">
      <LoginBackdrop />

      <Link
        href="/userpanel"
        className="group absolute right-[var(--login-pad-x)] top-4 z-30 inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/70 px-3.5 py-1.5 text-xs font-semibold text-ive-navy shadow-sm backdrop-blur-md transition-colors hover:bg-white lg:top-[var(--login-pad-top)]"
      >
        <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
        Back to website
      </Link>

      <main className="relative z-10 mx-auto grid w-full max-w-[min(100rem,96vw)] flex-1 content-start gap-x-[clamp(1.75rem,3.2vw,4.5rem)] gap-y-7 px-[var(--login-pad-x)] pb-8 pt-16 [grid-template-areas:'hero''card''features'] sm:pt-[4.5rem] lg:grid-cols-[minmax(0,1.15fr)_minmax(25.5rem,30rem)] lg:grid-rows-[auto_1fr] lg:content-stretch lg:gap-y-[var(--login-gap)] lg:px-[var(--login-pad-x)] lg:pb-[clamp(1.75rem,5vh,3.25rem)] lg:pt-[var(--login-pad-top)] lg:[grid-template-areas:'hero_card''features_card']">
        <div className="[grid-area:hero] lg:self-start">
          <LoginBrandHero logoUrl={logoUrl} siteName={siteName} tagline={tagline} />
        </div>

        <div className="[grid-area:features] lg:self-end lg:pb-[clamp(0.25rem,1.5vh,1.25rem)]">
          <LoginFeatureGrid />
        </div>

        {/* Login card */}
        <motion.div
          initial={{ opacity: 0, x: reduceMotion ? 0 : 40, y: reduceMotion ? 0 : 8 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
          className="relative mx-auto w-full max-w-[460px] [grid-area:card] lg:mx-0 lg:mt-[clamp(0.75rem,2vh,2rem)] lg:max-w-none lg:self-center"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-ive-royal/30 via-sky-300/25 to-ive-saffron/20 blur-3xl"
          />
          <div className="relative rounded-[30px] border border-white/80 bg-white/45 p-2 shadow-[0_40px_90px_-35px_rgba(6,27,54,0.6)] backdrop-blur-xl">
            <div className="overflow-hidden rounded-[24px] bg-white">
              {/* Navy header */}
              <div className="relative overflow-hidden bg-gradient-to-br from-[#0E3A7A] via-ive-navy-2 to-ive-navy px-6 pb-[clamp(2.4rem,4.6vh,3.25rem)] pt-[clamp(1.15rem,2.2vh,1.6rem)] text-white sm:px-8">
                <div
                  aria-hidden
                  className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(rgba(255,255,255,0.9)_1px,transparent_1px)] [background-size:16px_16px] [mask-image:linear-gradient(to_left,#000,transparent_70%)]"
                />
                <div aria-hidden className="absolute -right-10 -top-16 h-44 w-44 rounded-full bg-sky-400/25 blur-3xl" />
                <GraduationCap
                  aria-hidden
                  strokeWidth={1.35}
                  className="pointer-events-none absolute right-4 top-1/2 h-[4.25rem] w-[4.25rem] -translate-y-1/2 -rotate-12 text-white/45 sm:right-6 sm:h-[4.75rem] sm:w-[4.75rem]"
                />
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={screen}
                    initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
                    animate={{ opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE } }}
                    exit={{ opacity: 0, y: reduceMotion ? 0 : -6, transition: { duration: 0.15 } }}
                    className="relative flex items-start justify-between gap-3 pr-20 sm:pr-24"
                  >
                    <div>
                      {header.eyebrow && (
                        <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-ive-saffron">{header.eyebrow}</p>
                      )}
                      <h2 className="text-[clamp(1.6rem,3.4vh,2rem)] font-extrabold leading-tight tracking-tight [font-family:var(--font-jakarta)]">
                        {header.title}
                      </h2>
                      <p className="mt-1 text-sm text-white/70">{header.description}</p>
                    </div>
                  </motion.div>
                </AnimatePresence>
                {(screen === "forgot" || screen === "firstTime") && (
                  <button
                    type="button"
                    onClick={closeOverlay}
                    className="absolute right-4 top-4 rounded-xl p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Body */}
              <div className="relative -mt-[clamp(1.15rem,2.2vh,1.6rem)] rounded-t-[22px] bg-white px-6 pb-[clamp(1.15rem,2.3vh,1.85rem)] pt-[clamp(1.15rem,2.2vh,1.6rem)] sm:px-8">
                {dbUnavailable && (
                  <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs leading-relaxed text-amber-800">
                    <p className="font-semibold text-amber-900">Database reconnecting…</p>
                    <p className="mt-1">
                      After a laptop restart, run <span className="font-mono font-semibold">npm run dev</span> (starts DB
                      proxy). Wait a few seconds, then try login again. Your session cookies are kept.
                    </p>
                  </div>
                )}

                <AnimatePresence mode="wait" initial={false}>
                  {screen === "main" && (
                    <motion.div key="main" {...rise}>
                      <SegmentedSwitch
                        value={loginMethod}
                        onChange={switchMethod}
                        options={[
                          { value: "password", label: "Password", icon: Lock },
                          { value: "otp", label: "OTP", icon: Smartphone },
                        ]}
                      />

                      <AnimatePresence mode="wait" initial={false}>
                        {loginMethod === "password" ? (
                          <motion.form key="password" {...slide} onSubmit={handlePasswordLogin} className="mt-[clamp(0.85rem,1.8vh,1.35rem)] space-y-[clamp(0.7rem,1.5vh,1.05rem)]">
                            <LoginField
                              label="Email"
                              icon={Mail}
                              type="email"
                              autoComplete="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                              placeholder="admin@example.com"
                            />
                            <LoginField
                              label="Password"
                              icon={Lock}
                              type={showPassword ? "text" : "password"}
                              autoComplete="current-password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                              placeholder="Enter your password"
                              trailing={passwordToggle}
                              labelAction={
                                <button
                                  type="button"
                                  onClick={openForgot}
                                  className="text-[13px] font-semibold text-ive-royal transition-colors hover:text-ive-saffron-dark"
                                >
                                  Forgot password?
                                </button>
                              }
                            />

                            <label className="flex w-fit cursor-pointer select-none items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="h-4 w-4 rounded border-[#C8D6E8] accent-ive-royal"
                              />
                              <span className="text-sm text-ive-slate">Remember me</span>
                            </label>

                            <PrimaryButton type="submit" loading={formLoading} loadingText="Signing in...">
                              Sign in
                            </PrimaryButton>
                          </motion.form>
                        ) : (
                          <motion.div key="otp" {...slide} className="mt-[clamp(0.85rem,1.8vh,1.35rem)]">
                            <AnimatePresence mode="wait" initial={false}>
                              {!otpSent ? (
                                <motion.form key="otp-send" {...rise} onSubmit={handleSendOtpLogin} className="space-y-[clamp(0.7rem,1.5vh,1.05rem)]">
                                  <LoginField
                                    label="Email"
                                    icon={Mail}
                                    type="email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => {
                                      setEmail(e.target.value);
                                      setOtpError("");
                                    }}
                                    required
                                    placeholder="your@email.com"
                                  />
                                  <p className="text-xs leading-relaxed text-ive-slate">
                                    We&apos;ll email you a 6-digit one-time code, valid for 10 minutes.
                                  </p>
                                  {otpError && <LoginError>{otpError}</LoginError>}
                                  <PrimaryButton type="submit" loading={formLoading} loadingText="Sending OTP...">
                                    Send OTP to email
                                  </PrimaryButton>
                                </motion.form>
                              ) : (
                                <motion.form key="otp-verify" {...rise} onSubmit={handleVerifyOtpLogin} className="space-y-[clamp(0.7rem,1.5vh,1.05rem)]">
                                  <OtpField
                                    label="Enter OTP"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                    placeholder="000000"
                                    maxLength={6}
                                    hint={
                                      <>
                                        OTP sent to <span className="font-semibold text-ive-navy">{email}</span>
                                      </>
                                    }
                                  />
                                  <div className="flex gap-3">
                                    <SecondaryButton
                                      onClick={() => {
                                        setOtpSent(false);
                                        setOtp("");
                                      }}
                                    >
                                      Change email
                                    </SecondaryButton>
                                    <PrimaryButton type="submit" loading={formLoading} className="flex-1">
                                      Verify & sign in
                                    </PrimaryButton>
                                  </div>
                                </motion.form>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="mt-[clamp(0.85rem,1.8vh,1.35rem)] space-y-1.5 text-center">
                        <p className="text-sm text-ive-slate">
                          New here?{" "}
                          <button
                            type="button"
                            onClick={openFirstTime}
                            className="group inline-flex items-center gap-1 font-semibold text-ive-royal transition-colors hover:text-ive-saffron-dark"
                          >
                            Set up your account
                            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                          </button>
                        </p>
                        <p className="text-[13px] text-ive-slate">
                          Need help?{" "}
                          <button
                            type="button"
                            onClick={() => setSupportOpen(true)}
                            className="font-semibold text-ive-royal transition-colors hover:text-ive-saffron-dark"
                          >
                            Contact support
                          </button>
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {screen === "admin" && (
                    <motion.form key="admin-otp" {...rise} onSubmit={handleAdminOtpVerify} className="space-y-4">
                      <div className="flex gap-2.5 rounded-xl border border-ive-emerald/20 bg-ive-emerald/[0.06] px-3.5 py-2.5 text-xs leading-relaxed text-ive-navy/80">
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-ive-emerald" />
                        Password verified. Enter the OTP emailed to your Admin (Institute) account to finish login.
                      </div>
                      <OtpField
                        label="6-digit OTP"
                        maxLength={6}
                        value={adminOtp}
                        onChange={(e) => {
                          setAdminOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                          setAdminOtpError("");
                        }}
                        required
                        placeholder="••••••"
                      />
                      {adminOtpError && <LoginError>{adminOtpError}</LoginError>}
                      <PrimaryButton
                        type="submit"
                        disabled={adminOtp.length !== 6}
                        loading={formLoading}
                        loadingText="Verifying..."
                      >
                        Verify &amp; sign in
                      </PrimaryButton>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={backFromAdminOtp}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ive-slate transition-colors hover:text-ive-navy"
                        >
                          <ArrowLeft className="h-4 w-4" /> Back
                        </button>
                        <button
                          type="button"
                          disabled={formLoading}
                          onClick={handleAdminOtpResend}
                          className="text-sm font-semibold text-ive-royal transition-colors hover:text-ive-saffron-dark disabled:opacity-60"
                        >
                          Resend OTP
                        </button>
                      </div>
                    </motion.form>
                  )}

                  {screen === "forgot" && (
                    <motion.div key="forgot" {...rise}>
                      {forgotStep === "email" && (
                        <form onSubmit={handleForgotSendOtp} className="space-y-4">
                          <LoginField
                            label="Email"
                            icon={Mail}
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="your@email.com"
                          />
                          {otpError && <LoginError>{otpError}</LoginError>}
                          <div className="flex gap-3">
                            <SecondaryButton onClick={closeOverlay}>Cancel</SecondaryButton>
                            <PrimaryButton type="submit" loading={formLoading} className="flex-1">
                              Send OTP
                            </PrimaryButton>
                          </div>
                        </form>
                      )}
                      {forgotStep === "otp" && (
                        <form onSubmit={handleResetPassword} className="space-y-3.5">
                          <OtpField
                            label="OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            placeholder="000000"
                            maxLength={6}
                            hint={
                              <>
                                OTP sent to <span className="font-semibold text-ive-navy">{email}</span>
                              </>
                            }
                          />
                          <LoginField
                            label="New password"
                            icon={Lock}
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            value={resetPassword}
                            onChange={(e) => setResetPassword(e.target.value)}
                            required
                            minLength={8}
                            placeholder="Min 8 characters"
                            trailing={passwordToggle}
                          />
                          <LoginField
                            label="Confirm password"
                            icon={Lock}
                            type="password"
                            autoComplete="new-password"
                            value={resetConfirm}
                            onChange={(e) => setResetConfirm(e.target.value)}
                            required
                            placeholder="Repeat password"
                          />
                          <div className="flex gap-3 pt-1">
                            <SecondaryButton
                              onClick={() => {
                                setForgotStep("email");
                                setForgotOtpSent(false);
                                setOtp("");
                              }}
                            >
                              Back
                            </SecondaryButton>
                            <PrimaryButton type="submit" loading={formLoading} className="flex-1">
                              Reset & login
                            </PrimaryButton>
                          </div>
                        </form>
                      )}
                    </motion.div>
                  )}

                  {screen === "firstTime" && (
                    <motion.div key="firstTime" {...rise}>
                      {firstTimeStep === "email" && (
                        <form onSubmit={handleCheckFirstTime} className="space-y-4">
                          <LoginField
                            label="Email"
                            icon={Mail}
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => {
                              setEmail(e.target.value);
                              setOtpError("");
                            }}
                            required
                            placeholder="your@email.com"
                          />
                          {otpError && <LoginError>{otpError}</LoginError>}
                          <div className="flex gap-3">
                            <SecondaryButton onClick={closeOverlay}>Cancel</SecondaryButton>
                            <PrimaryButton type="submit" loading={formLoading} className="flex-1">
                              Continue
                            </PrimaryButton>
                          </div>
                        </form>
                      )}
                      {firstTimeStep === "send" && (
                        <form onSubmit={handleFirstTimeSendOtp} className="space-y-4">
                          <p className="flex items-start gap-2.5 rounded-xl border border-ive-royal/15 bg-ive-royal/[0.05] px-3.5 py-3 text-sm text-ive-navy/80">
                            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-ive-royal" />
                            <span>
                              We&apos;ll send a one-time code to <span className="font-semibold text-ive-navy">{email}</span>
                            </span>
                          </p>
                          {otpError && <LoginError>{otpError}</LoginError>}
                          <div className="flex gap-3">
                            <SecondaryButton onClick={() => setFirstTimeStep("email")}>Change email</SecondaryButton>
                            <PrimaryButton type="submit" loading={formLoading} className="flex-1">
                              Send OTP
                            </PrimaryButton>
                          </div>
                        </form>
                      )}
                      {firstTimeStep === "verify" && (
                        <form onSubmit={handleVerifyOtpSetPassword} className="space-y-3.5">
                          <OtpField
                            label="OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            placeholder="000000"
                            maxLength={6}
                          />
                          <LoginField
                            label="New password"
                            icon={Lock}
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            minLength={8}
                            placeholder="Min 8 characters"
                            trailing={passwordToggle}
                          />
                          <LoginField
                            label="Confirm password"
                            icon={Lock}
                            type="password"
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="Repeat password"
                          />
                          <PrimaryButton type="submit" loading={formLoading}>
                            Set password & login
                          </PrimaryButton>
                        </form>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      <LoginTrustBand siteName={siteName} />

      {/* Support Modal */}
      <AnimatePresence>
        {supportOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ive-navy/50 p-4 backdrop-blur-sm"
            onClick={() => setSupportOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="support-title"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.3, ease: EASE }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md overflow-hidden rounded-[24px] border border-[#CFE0F5] bg-white p-6 shadow-[0_40px_90px_-30px_rgba(6,27,54,0.5)] sm:p-7"
            >
              <div className="mb-6 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-ive-royal/10 text-ive-royal">
                    <Headset className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 id="support-title" className="text-lg font-bold text-ive-navy">
                      Contact support
                    </h3>
                    <p className="mt-0.5 text-sm text-ive-slate">We&apos;ll get back to you soon</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSupportOpen(false)}
                  className="rounded-xl p-2 text-ive-slate transition-colors hover:bg-ive-mist hover:text-ive-navy"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleSupportSubmit} className="space-y-4">
                <LoginField
                  label="Name"
                  icon={User}
                  type="text"
                  autoComplete="name"
                  value={supportName}
                  onChange={(e) => setSupportName(e.target.value)}
                  required
                  placeholder="Your name"
                />
                <LoginField
                  label="Email"
                  icon={Mail}
                  type="email"
                  autoComplete="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                />
                <div>
                  <LoginLabel htmlFor="support-message">Message</LoginLabel>
                  <textarea
                    id="support-message"
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    required
                    rows={4}
                    placeholder="How can we help?"
                    className="w-full resize-none rounded-2xl border border-[#D7E2F0] bg-white px-4 py-3 text-[15px] text-ive-navy outline-none transition-[border-color,box-shadow] placeholder:text-[#9AA9BD] focus:border-ive-royal focus:ring-4 focus:ring-ive-royal/10"
                  />
                </div>
                <div className="flex gap-3 pt-1">
                  <SecondaryButton onClick={() => setSupportOpen(false)}>Cancel</SecondaryButton>
                  <PrimaryButton type="submit" loading={supportSubmitting} className="flex-1">
                    Send
                  </PrimaryButton>
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

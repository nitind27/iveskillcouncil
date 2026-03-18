"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Mail, 
  Lock, 
  Loader2, 
  ChevronRight,
  Eye,
  EyeOff
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { showSuccess, showError } from "@/lib/toast";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user, loading: authLoading } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // --- Redirect Logic ---
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
    } catch (e) {
      return "/dashboard";
    }
  };

  const redirect = getRedirectUrl();

  useEffect(() => {
    if (user && !authLoading && !formLoading) {
      window.location.replace(redirect);
    }
  }, [user, authLoading, formLoading, redirect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        showSuccess("Login Successful", "Redirecting...");
        setTimeout(() => {
          window.location.href = redirect;
        }, 1200);
      } else {
        showError("Invalid Credentials", "Please check your email and password.");
        setFormLoading(false);
      }
    } catch (error: any) {
      showError("Error", error.message || "An unexpected error occurred.");
      setFormLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white font-sans selection:bg-blue-100 overflow-hidden">
      
      {/* LEFT SIDE: 3D Animated Canvas Effect */}
      <div className="relative hidden md:flex md:w-[45%] lg:w-[40%] bg-[#0f172a] overflow-hidden flex-col items-center justify-center p-12">
        
        {/* TOP RIGHT: 3D Rotating/Scaling Circle */}
        <div className="absolute -top-20 -right-20 w-[450px] h-[450px] rounded-full 
          bg-gradient-to-br from-blue-600 via-blue-400 to-cyan-300 
          blur-[80px] opacity-60 animate-pulse transition-all duration-1000
          hover:scale-110" 
          style={{ animationDuration: '8s' }}
        />

        {/* BOTTOM LEFT: Supporting Glow */}
        <div className="absolute -bottom-40 -left-20 w-[500px] h-[500px] rounded-full 
          bg-indigo-600/30 blur-[120px] animate-bounce" 
          style={{ animationDuration: '12s' }}
        />

        {/* LOGO AREA: No Card, 3D Floating Effect */}
        <div className="relative z-10 flex flex-col items-center group">
          <div className="relative transition-transform duration-700 ease-out group-hover:scale-110 group-hover:-rotate-2">
            {/* The Logo with a subtle 3D drop shadow */}
            <img 
              src="https://mum-objectstore.e2enetworks.net/hdi-multi-tenant/eklavyaeducationhub.in/website/logo/image_695ca3a904827.png" 
              alt="Logo" 
              className="w-full max-w-[280px] drop-shadow-[0_20px_50px_rgba(59,130,246,0.5)]"
            />
            
            {/* 3D Ring animation around the logo */}
            <div className="absolute inset-0 border-2 border-white/10 rounded-full scale-150 animate-ping opacity-20" style={{ animationDuration: '4s' }} />
          </div>

          <div className="mt-12 text-center">
            <h1 className="text-3xl font-black text-white tracking-tighter mb-2">
              Eklavya Education Hub
            </h1>
            <div className="h-1 w-12 bg-blue-500 mx-auto rounded-full mb-4 group-hover:w-24 transition-all duration-500" />
            <p className="text-blue-200/60 font-medium text-sm uppercase tracking-widest">
              Innovation in Learning
            </p>
          </div>
        </div>

      </div>

      {/* RIGHT SIDE: Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-16 lg:p-24 bg-slate-50/30">
        <div className="w-full max-w-[420px]">
          <div className="mb-10">
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-3">
              Sign In
            </h2>
            <p className="text-slate-500 text-lg">
              Welcome back to your dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@eklavya.com"
                  className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all text-slate-900 shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
                  Password
                </label>
                <button type="button" className="text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider">
                  Forgot?
                </button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all text-slate-900 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-300 hover:text-blue-600 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={formLoading}
              className={cn(
                "w-full py-4 px-6 rounded-2xl font-bold text-white shadow-xl transition-all transform active:scale-95",
                "bg-blue-600 hover:bg-blue-700",
                "flex items-center justify-center gap-2 mt-4",
                formLoading && "opacity-70 cursor-not-allowed"
              )}
            >
              {formLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>Login to Account</span>
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-12 text-center text-slate-500 text-sm">
            Need help?{" "}
            <a href="#" className="text-blue-600 font-bold hover:underline underline-offset-4">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
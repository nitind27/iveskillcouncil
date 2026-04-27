"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { FiBookOpen, FiUsers, FiArrowRight, FiMapPin, FiPhone, FiMail, FiLogIn } from "react-icons/fi";
import PageLoader from "@/components/common/PageLoader";

interface PanelConfig {
  logoUrl?: string;
  siteName?: string;
  tagline?: string;
  primaryColor?: string;
  bannerUrl?: string;
  welcomeText?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
}

interface FranchisePanel {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  state: string | null;
  email: string | null;
  phone: string | null;
  planName: string;
  panelConfig: PanelConfig;
}

export default function FranchisePanelPage() {
  const params  = useParams();
  const slug    = typeof params?.slug === "string" ? params.slug : "";
  const [data,    setData]    = useState<FranchisePanel | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/franchise-panel/${slug}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) setData(res.data);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <PageLoader text="Loading franchise portal..." />;

  if (notFound || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-3xl bg-[#EEF2F7] flex items-center justify-center mx-auto mb-5">
            <FiBookOpen className="w-10 h-10 text-[#9CA3AF]" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#1A1A1A] mb-2">Franchise Not Found</h1>
          <p className="text-[#6B7280] mb-6">The franchise portal <strong>/{slug}</strong> does not exist or is not active.</p>
          <Link href="/userpanel" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2D5DA8] text-white font-semibold hover:bg-[#1E4A85] transition-all">
            Go to Main Portal <FiArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const cfg = data.panelConfig || {};
  const primary = cfg.primaryColor || "#2D5DA8";
  const siteName = cfg.siteName || data.name;
  const tagline  = cfg.tagline  || `${data.planName} Franchise · ${data.city || ""}, ${data.state || ""}`;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-[#E5E7EB] shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {cfg.logoUrl ? (
              <img src={cfg.logoUrl} alt={siteName} className="h-10 w-auto max-w-[140px] object-contain" />
            ) : (
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg" style={{ background: primary }}>
                {siteName.charAt(0)}
              </div>
            )}
            <span className="font-extrabold text-[#1A1A1A] text-base hidden sm:block">{siteName}</span>
          </div>
          <Link
            href={`/login?redirect=${encodeURIComponent(`/f/${slug}/dashboard`)}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white font-bold text-sm shadow-md transition-all hover:opacity-90"
            style={{ background: primary }}
          >
            <FiLogIn className="w-4 h-4" /> Login to Portal
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className="relative overflow-hidden py-20 px-4" style={{ background: `linear-gradient(135deg, ${primary}ee 0%, ${primary}99 100%)` }}>
        {cfg.bannerUrl && (
          <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url(${cfg.bannerUrl})` }} />
        )}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(255,255,255,0.08),transparent)]" />
        <div className="absolute -bottom-1 left-0 right-0 h-12 bg-[#F8FAFC]" style={{ clipPath: "ellipse(55% 100% at 50% 100%)" }} />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto text-center relative">
          {cfg.logoUrl && (
            <img src={cfg.logoUrl} alt={siteName} className="h-20 w-auto max-w-[200px] object-contain mx-auto mb-6 drop-shadow-xl" />
          )}
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">{siteName}</h1>
          <p className="text-white/80 text-lg max-w-xl mx-auto">{cfg.welcomeText || tagline}</p>
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <Link href={`/login?redirect=${encodeURIComponent(`/f/${slug}/dashboard`)}`}>
              <motion.span whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-white font-bold text-sm shadow-xl cursor-pointer hover:bg-white/90 transition-all" style={{ color: primary }}>
                <FiLogIn className="w-4 h-4" /> Student / Staff Login
              </motion.span>
            </Link>
            <Link href="/userpanel/apply-franchise">
              <motion.span whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-white/15 border border-white/25 text-white font-bold text-sm cursor-pointer hover:bg-white/25 transition-all">
                Apply for Franchise <FiArrowRight className="w-4 h-4" />
              </motion.span>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* ── Info cards ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid sm:grid-cols-3 gap-6 mb-16">
          {[
            { icon: <FiBookOpen className="w-6 h-6" />, title: "Courses", desc: "Explore our range of certified programs" },
            { icon: <FiUsers className="w-6 h-6" />, title: "Students", desc: "Join thousands of learners at our centre" },
            { icon: <FiArrowRight className="w-6 h-6" />, title: "Enrol Now", desc: "Start your learning journey today" },
          ].map((c, i) => (
            <motion.div key={c.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm hover:shadow-md transition-all text-center">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white" style={{ background: primary }}>
                {c.icon}
              </div>
              <h3 className="font-bold text-[#1A1A1A] mb-1">{c.title}</h3>
              <p className="text-sm text-[#6B7280]">{c.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Contact */}
        <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-sm p-8">
          <h2 className="text-xl font-extrabold text-[#1A1A1A] mb-6">Contact Us</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: <FiMapPin />, label: "Location", value: [data.city, data.state].filter(Boolean).join(", ") || cfg.address || "—" },
              { icon: <FiPhone />,  label: "Phone",    value: cfg.contactPhone || data.phone || "—" },
              { icon: <FiMail />,   label: "Email",    value: cfg.contactEmail || data.email || "—" },
            ].map(({ icon, label, value }) => (
              <div key={label} className="flex items-start gap-3 p-4 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB]">
                <span className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0" style={{ background: primary }}>{icon}</span>
                <div>
                  <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">{label}</p>
                  <p className="text-sm font-semibold text-[#1A1A1A] mt-0.5">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#E5E7EB] py-6 text-center text-sm text-[#9CA3AF]">
        © {new Date().getFullYear()} {siteName} · Powered by IVESDC
      </footer>
    </div>
  );
}

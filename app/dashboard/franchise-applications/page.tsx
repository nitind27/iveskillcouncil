"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Eye, CheckCircle2, XCircle, Clock,
  Search, Filter, Download, X, ChevronDown,
} from "lucide-react";
import { showSuccess, showError } from "@/lib/toast";
import Breadcrumb from "@/components/common/Breadcrumb";

interface Doc { key: string; url: string; name: string; type: string; label: string; }
interface Application {
  id: string; fullName: string; email: string; phone: string; alternatePhone?: string;
  instituteName: string; businessType: string;
  address: string; city: string; state: string; pincode: string;
  planId?: number; planName?: string; message?: string;
  documents: Doc[]; status: string; adminNotes?: string;
  reviewedAt?: string; createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING:  { label: "Pending",  color: "bg-amber-100 text-amber-700 border-amber-200",  icon: <Clock className="w-3.5 h-3.5" /> },
  APPROVED: { label: "Approved", color: "bg-green-100 text-green-700 border-green-200",  icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  REJECTED: { label: "Rejected", color: "bg-red-100 text-red-700 border-red-200",        icon: <XCircle className="w-3.5 h-3.5" /> },
  VERIFIED: { label: "Verified", color: "bg-blue-100 text-blue-700 border-blue-200",     icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
};

export default function FranchiseApplicationsPage() {
  const [apps,       setApps]       = useState<Application[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected,   setSelected]   = useState<Application | null>(null);
  const [notes,      setNotes]      = useState("");
  const [saving,     setSaving]     = useState(false);
  const [docPreview, setDocPreview] = useState<Doc | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search)       params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const res  = await fetch(`/api/admin/franchise-applications?${params}`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setApps(data.data.items || []);
    } catch { showError("Error", "Failed to load applications"); }
    finally { setLoading(false); }
  }, [search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/franchise-applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status, adminNotes: notes }),
      });
      const data = await res.json();
      if (!res.ok) { showError("Error", data.error || "Failed"); return; }
      showSuccess("Updated", `Application ${status.toLowerCase()}.`);
      setSelected(null);
      load();
    } catch { showError("Error", "Network error"); }
    finally { setSaving(false); }
  };

  const openDetail = (app: Application) => {
    setSelected(app);
    setNotes(app.adminNotes || "");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 max-w-7xl mx-auto">
        <Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Franchise Applications" }]} />

        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" /> Franchise Applications
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Review KYC documents and approve/reject franchise applications.</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, institute..." className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="pl-9 pr-8 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none">
              <option value="">All Status</option>
              {Object.entries(STATUS_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>
        ) : apps.length === 0 ? (
          <div className="rounded-xl border border-dashed border-input bg-muted/30 p-16 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="font-medium text-foreground">No applications found</p>
          </div>
        ) : (
          <div className="rounded-xl border border-input overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-input">
                <tr>
                  {["Applicant", "Institute", "Location", "Business Type", "Status", "Applied", "Actions"].map((h) => (
                    <th key={h} className="text-left py-3 px-4 font-semibold text-foreground text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {apps.map((app, i) => {
                  const sc = STATUS_CONFIG[app.status] || STATUS_CONFIG.PENDING;
                  return (
                    <motion.tr key={app.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-b border-input/50 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-foreground">{app.fullName}</p>
                        <p className="text-muted-foreground text-xs">{app.email}</p>
                      </td>
                      <td className="py-3 px-4 text-foreground font-medium">{app.instituteName}</td>
                      <td className="py-3 px-4 text-muted-foreground">{app.city}, {app.state}</td>
                      <td className="py-3 px-4">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{app.businessType}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-semibold ${sc.color}`}>
                          {sc.icon}{sc.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">{new Date(app.createdAt).toLocaleDateString("en-IN")}</td>
                      <td className="py-3 px-4">
                        <button onClick={() => openDetail(app)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors">
                          <Eye className="w-3.5 h-3.5" /> Review
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Detail Drawer ── */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div key="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelected(null)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
            <motion.aside key="drawer" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 280, damping: 30 }} className="fixed top-0 right-0 bottom-0 w-full max-w-2xl bg-background z-[51] shadow-2xl flex flex-col border-l border-border overflow-hidden">
              {/* header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                <div>
                  <h2 className="font-bold text-foreground text-lg">{selected.instituteName}</h2>
                  <p className="text-muted-foreground text-sm">{selected.fullName} · {selected.email}</p>
                </div>
                <button onClick={() => setSelected(null)} className="p-2 rounded-xl hover:bg-muted transition-colors"><X className="w-5 h-5" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Personal + Business */}
                <section>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Applicant Details</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ["Full Name", selected.fullName], ["Email", selected.email],
                      ["Phone", selected.phone], ["Alt Phone", selected.alternatePhone || "—"],
                      ["Business Type", selected.businessType], ["Plan", selected.planName || "—"],
                      ["Address", selected.address], ["City", selected.city],
                      ["State", selected.state], ["Pincode", selected.pincode],
                    ].map(([k, v]) => (
                      <div key={k} className="p-3 rounded-xl bg-muted/40 border border-border">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">{k}</p>
                        <p className="text-sm font-semibold text-foreground break-all">{v}</p>
                      </div>
                    ))}
                  </div>
                  {selected.message && (
                    <div className="mt-3 p-3 rounded-xl bg-muted/40 border border-border">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Message</p>
                      <p className="text-sm text-foreground">{selected.message}</p>
                    </div>
                  )}
                </section>

                {/* Documents */}
                <section>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">KYC Documents ({(selected.documents as Doc[]).length})</h3>
                  {(selected.documents as Doc[]).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No documents uploaded.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {(selected.documents as Doc[]).map((doc) => (
                        <div key={doc.key} className="rounded-xl border border-border bg-card overflow-hidden">
                          {doc.type?.startsWith("image/") ? (
                            <button onClick={() => setDocPreview(doc)} className="w-full">
                              <img src={doc.url} alt={doc.label} className="w-full h-28 object-cover hover:opacity-90 transition-opacity" />
                            </button>
                          ) : (
                            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 hover:bg-muted transition-colors">
                              <FileText className="w-8 h-8 text-primary flex-shrink-0" />
                              <span className="text-xs text-foreground truncate">{doc.name}</span>
                              <Download className="w-4 h-4 text-muted-foreground ml-auto flex-shrink-0" />
                            </a>
                          )}
                          <div className="px-3 py-2 border-t border-border bg-muted/30">
                            <p className="text-xs font-semibold text-foreground">{doc.label}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Admin Notes */}
                <section>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Admin Notes</h3>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Add notes about this application..." className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" />
                </section>
              </div>

              {/* Action buttons */}
              <div className="px-6 py-4 border-t border-border bg-muted/20 flex gap-3">
                <button onClick={() => updateStatus(selected.id, "REJECTED")} disabled={saving || selected.status === "REJECTED"} className="flex-1 py-3 rounded-xl border-2 border-red-200 text-red-600 font-bold text-sm hover:bg-red-50 disabled:opacity-40 transition-all flex items-center justify-center gap-2">
                  <XCircle className="w-4 h-4" /> Reject
                </button>
                <button onClick={() => updateStatus(selected.id, "VERIFIED")} disabled={saving || selected.status === "VERIFIED"} className="flex-1 py-3 rounded-xl border-2 border-blue-200 text-blue-600 font-bold text-sm hover:bg-blue-50 disabled:opacity-40 transition-all flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Verify
                </button>
                <button onClick={() => updateStatus(selected.id, "APPROVED")} disabled={saving || selected.status === "APPROVED"} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 disabled:opacity-40 transition-all flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Approve
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Doc preview lightbox */}
      <AnimatePresence>
        {docPreview && (
          <motion.div key="lightbox" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDocPreview(null)} className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4">
            <button onClick={() => setDocPreview(null)} className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"><X className="w-6 h-6" /></button>
            <img src={docPreview.url} alt={docPreview.label} className="max-w-full max-h-[90vh] object-contain rounded-xl" onClick={(e) => e.stopPropagation()} />
            <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 text-sm font-medium">{docPreview.label}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

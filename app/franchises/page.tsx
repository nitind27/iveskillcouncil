"use client";

import { useState } from "react";
import Link from "next/link";
import { useSWRConfig } from "swr";
import { Modal } from "@/components/common/Modal";
import FranchiseTable from "@/components/franchises/FranchiseTable";
import AddFranchiseForm from "@/components/franchises/AddFranchiseForm";
import { Building2, Plus } from "lucide-react";

export default function FranchisesPage() {
  const { mutate } = useSWRConfig();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [stats, setStats] = useState({ total: 0, active: 0, pending: 0 });

  const handleAddSuccess = () => {
    setAddModalOpen(false);
    mutate(
      (key: unknown) => typeof key === "string" && key.startsWith("/api/franchises")
    );
  };

  return (
    <div className="space-y-5 pb-8">
      <header className="overflow-hidden rounded-2xl border border-[#1E4A85]/15 bg-gradient-to-r from-[#0F2A4A] via-[#1E4A85] to-[#163A6B] text-white shadow-md shadow-[#1E4A85]/15">
        <div className="flex flex-col gap-4 px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <nav className="mb-1.5 flex flex-wrap items-center gap-1 text-[11px] text-white/55">
              <Link href="/dashboard" className="hover:text-white/90">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-white/80">Franchises</span>
            </nav>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                Manage Franchises
              </h1>
              <span className="hidden items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#E8D5A3] sm:inline-flex">
                <Building2 className="h-3 w-3" />
                Network
              </span>
            </div>
            <p className="mt-1 max-w-xl text-xs text-white/60 sm:text-sm">
              Locations, plans, owners & course assignments
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm backdrop-blur-sm">
              <div className="text-center">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-white/50">
                  Total
                </p>
                <p className="font-bold tabular-nums leading-tight">{stats.total}</p>
              </div>
              <div className="h-7 w-px bg-white/20" />
              <div className="text-center">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-emerald-200/80">
                  Active
                </p>
                <p className="font-bold tabular-nums leading-tight text-emerald-100">
                  {stats.active}
                </p>
              </div>
              <div className="h-7 w-px bg-white/20" />
              <div className="text-center">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-[#E8D5A3]/70">
                  Pending
                </p>
                <p className="font-bold tabular-nums leading-tight text-[#F5E6C8]">
                  {stats.pending}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAddModalOpen(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#C4A35A] px-3 text-xs font-bold text-[#0B132B] transition hover:brightness-110"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Franchise
            </button>
          </div>
        </div>
      </header>

      <FranchiseTable onStatsChange={setStats} />

      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        size="xl"
        title="Add Franchise"
        description="Multi-step onboarding — owner, business KYC, documents, then create account."
      >
        <AddFranchiseForm
          key={addModalOpen ? "open" : "closed"}
          onSuccess={handleAddSuccess}
          onCancel={() => setAddModalOpen(false)}
        />
      </Modal>
    </div>
  );
}

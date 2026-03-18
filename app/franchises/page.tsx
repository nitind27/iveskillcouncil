"use client";

import { useState } from "react";
import { useSWRConfig } from "swr";
import { Breadcrumb } from "@/components/common";
import { Modal } from "@/components/common/Modal";
import FranchiseTable from "@/components/franchises/FranchiseTable";
import AddFranchiseForm from "@/components/franchises/AddFranchiseForm";
import { Plus } from "lucide-react";

export default function FranchisesPage() {
  const { mutate } = useSWRConfig();
  const [addModalOpen, setAddModalOpen] = useState(false);

  const handleAddSuccess = () => {
    setAddModalOpen(false);
    mutate((key: unknown) => typeof key === "string" && key.startsWith("/api/franchises"));
  };

  return (
    <div className="space-y-6">
      <Breadcrumb />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Franchises</h1>
          <p className="text-muted-foreground mt-1">
            Manage all franchise locations and their subscriptions
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Franchise</span>
        </button>
      </div>

      <FranchiseTable />

      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        size="xl"
        title="Add Franchise"
        description="Create a new franchise and owner account. Credentials will be sent to the owner email."
      >
        <AddFranchiseForm
          onSuccess={handleAddSuccess}
          onCancel={() => setAddModalOpen(false)}
        />
      </Modal>
    </div>
  );
}

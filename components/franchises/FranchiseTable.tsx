"use client";

import { useState } from "react";
import useSWR from "swr";
import { Table, type TableColumn } from "@/components/common/Table";
import { Card } from "@/components/common/Card";
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from "@/components/common/Modal";
import { Edit, Trash2, Eye, Building2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { showDeleteConfirm, showSuccess, showError } from "@/lib/toast";
import { fetcherWithPagination } from "@/lib/fetcher";

interface Franchise {
  id: string;
  name: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  plan: {
    name: string;
    price: string;
  };
  subscriptionStart: string;
  subscriptionEnd: string;
  status: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  stats: {
    students: number;
    staff: number;
  };
  createdAt: string;
  updatedAt: string;
}

export default function FranchiseTable() {
  const [page, setPage] = useState(1);
  const [selectedFranchise, setSelectedFranchise] = useState<Franchise | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const { data, error, isLoading, mutate } = useSWR(
    `/api/franchises?page=${page}&limit=10`,
    fetcherWithPagination<Franchise[]>,
    { revalidateOnFocus: true, dedupingInterval: 2000, keepPreviousData: true }
  );

  const franchises = data?.data ?? [];
  const totalPages = data?.pagination?.totalPages ?? 1;

  const refreshList = () => mutate();

  const handleView = (franchise: Franchise) => {
    setSelectedFranchise(franchise);
    setViewModalOpen(true);
  };

  const handleDelete = async (franchise: Franchise) => {
    // Confirm before delete
    const result = await showDeleteConfirm(
      'Delete Franchise?',
      `Are you sure you want to delete "${franchise.name}"? This action cannot be undone.`
    );

    // Check if user confirmed the deletion
    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/franchises/${franchise.id}`, {
          method: 'DELETE',
        });
        
        if (res.ok) {
          // Show success message
          await showSuccess('Deleted!', 'The franchise has been deleted successfully.');
          // Refresh the list
          refreshList();
        } else {
          // Show error message
          const errorData = await res.json();
          await showError('Error!', errorData.message || 'Failed to delete franchise. Please try again.');
        }
      } catch (error) {
        console.error('Error deleting franchise:', error);
        await showError('Error!', 'An unexpected error occurred. Please try again.');
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case "PENDING":
        return <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case "EXPIRED":
      case "REJECTED":
        return <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "PENDING":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
      case "EXPIRED":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "REJECTED":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const columns: TableColumn<Franchise>[] = [
    {
      key: "name",
      header: "Franchise Name",
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: "owner",
      header: "Owner",
      render: (value, row) => (
        <div>
          <p className="font-medium">{row.owner.name}</p>
          <p className="text-xs text-muted-foreground">{row.owner.email}</p>
        </div>
      ),
    },
    {
      key: "plan",
      header: "Plan",
      render: (value, row) => (
        <div>
          <span className="font-medium">{row.plan.name}</span>
          <p className="text-xs text-muted-foreground">
            ₹{parseFloat(row.plan.price).toLocaleString('en-IN')}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (value) => (
        <div className="flex items-center gap-1.5">
          {getStatusIcon(value as string)}
          <span
            className={cn(
              "text-xs font-medium px-2 py-1 rounded-full",
              getStatusColor(value as string)
            )}
          >
            {value}
          </span>
        </div>
      ),
    },
    {
      key: "stats",
      header: "Stats",
      render: (value, row) => (
        <div className="text-sm">
          <p>Students: <span className="font-medium">{row.stats.students}</span></p>
          <p>Staff: <span className="font-medium">{row.stats.staff}</span></p>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (value, row) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => handleView(row)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            title="View"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleView(row)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-red-600 dark:text-red-400"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Card>
        <Table
          data={franchises}
          columns={columns}
          loading={isLoading}
          searchable
          searchPlaceholder="Search franchises..."
          pagination
          pageSize={10}
          zebraStriping
          stickyHeader
        />
      </Card>

      {/* View Modal */}
      <Modal
        open={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedFranchise(null);
        }}
        size="lg"
        title="Franchise Details"
      >
        {selectedFranchise && (
          <ModalBody>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p className="text-base font-semibold">{selectedFranchise.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Owner</label>
                <p className="text-base">{selectedFranchise.owner.name}</p>
                <p className="text-sm text-muted-foreground">{selectedFranchise.owner.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Plan</label>
                <p className="text-base">{selectedFranchise.plan.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <span
                  className={cn(
                    "inline-block text-xs font-medium px-2 py-1 rounded-full",
                    getStatusColor(selectedFranchise.status)
                  )}
                >
                  {selectedFranchise.status}
                </span>
              </div>
              {selectedFranchise.address && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Address</label>
                  <p className="text-base">{selectedFranchise.address}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedFranchise.city}, {selectedFranchise.state} - {selectedFranchise.pincode}
                  </p>
                </div>
              )}
            </div>
          </ModalBody>
        )}
      </Modal>

    </>
  );
}


"use client";

import { Breadcrumb } from "@/components/common";
import { DataTable } from "@/components/common";
import type { TableColumn } from "@/components/common/Table";

interface User {
  id: string;
  name: string;
  email: string;
  status: "active" | "inactive";
  createdAt: string;
  value: number;
}

const columns: TableColumn<User>[] = [
  {
    key: "id",
    header: "ID",
    sortable: true,
  },
  {
    key: "name",
    header: "Name",
    sortable: true,
  },
  {
    key: "email",
    header: "Email",
    sortable: true,
  },
  {
    key: "status",
    header: "Status",
    render: (value) => (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === "active"
            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
        }`}
      >
        {value}
      </span>
    ),
  },
  {
    key: "value",
    header: "Value",
    sortable: true,
    render: (value) => `$${value.toLocaleString()}`,
  },
  {
    key: "createdAt",
    header: "Created At",
    sortable: true,
    render: (value) => new Date(value).toLocaleDateString(),
  },
];

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <Breadcrumb />
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold mb-4">Users Management</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Manage all users in the system. This table handles 100,000+ records efficiently with server-side pagination.
        </p>

        <DataTable<User>
          endpoint="/data"
          columns={columns}
          initialPage={1}
          initialPageSize={20}
          searchable
          searchPlaceholder="Search users..."
          zebraStriping
          stickyHeader
          onRowClick={(row) => {
            console.log("Row clicked:", row);
          }}
        />
      </div>
    </div>
  );
}


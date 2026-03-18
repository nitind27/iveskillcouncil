"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Table, type TableColumn, type TableProps } from "./Table";
import Pagination from "./Pagination";
import { apiClient } from "@/lib/api/client";
import { PaginationParams, PaginatedResponse } from "@/lib/api/types";
import { Loader2 } from "lucide-react";

export interface DataTableProps<T> extends Omit<TableProps<T>, "data" | "pagination"> {
  endpoint: string;
  initialPage?: number;
  initialPageSize?: number;
  initialSortBy?: string;
  initialSortOrder?: "asc" | "desc";
  onDataChange?: (data: PaginatedResponse<T>) => void;
}

export default function DataTable<T extends Record<string, any>>({
  endpoint,
  columns,
  initialPage = 1,
  initialPageSize = 10,
  initialSortBy,
  initialSortOrder = "asc",
  onDataChange,
  loading: externalLoading,
  ...tableProps
}: DataTableProps<T>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: initialPage,
    pageSize: initialPageSize,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string | undefined>(initialSortBy);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(initialSortOrder);

  const fetchData = useCallback(
    async (params: PaginationParams) => {
      setLoading(true);
      try {
        const response = await apiClient.getData<T>(endpoint, params);
        setData(response.data);
        setPagination(response.pagination);
        onDataChange?.(response);
      } catch (error) {
        console.error("Error fetching data:", error);
        setData([]);
      } finally {
        setLoading(false);
      }
    },
    [endpoint, onDataChange]
  );

  useEffect(() => {
    const params: PaginationParams = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      sortBy,
      sortOrder,
      search: searchQuery || undefined,
    };

    const timeoutId = setTimeout(() => {
      fetchData(params);
    }, searchQuery ? 300 : 0); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [pagination.page, pagination.pageSize, sortBy, sortOrder, searchQuery, fetchData]);

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handleSort = (columnKey: string) => {
    if (sortBy === columnKey) {
      if (sortOrder === "asc") {
        setSortOrder("desc");
      } else {
        setSortBy(undefined);
        setSortOrder("asc");
      }
    } else {
      setSortBy(columnKey);
      setSortOrder("asc");
    }
  };

  const isLoading = loading || externalLoading;

  return (
    <div className="space-y-4">
      {/* Search */}
      {tableProps.searchable && (
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder={tableProps.searchPlaceholder || "Search..."}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page on search
            }}
            className="flex-1 max-w-md px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <Table
            {...tableProps}
            data={data}
            columns={columns}
            pagination={false}
            loading={false}
          />
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm px-6 py-4">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            pageSize={pagination.pageSize}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}


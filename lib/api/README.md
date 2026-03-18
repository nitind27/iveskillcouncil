# API Structure Documentation

This directory contains the API utilities and client for handling large datasets (100,000+ records) with optimized pagination and data fetching.

## Structure

```
lib/api/
├── types.ts       # TypeScript types for API responses and pagination
├── utils.ts       # Server-side utilities for pagination and data processing
└── client.ts      # Client-side API client with caching

app/api/
└── data/
    └── route.ts   # API route handler for data fetching
```

## Features

### 1. Server-Side Pagination
- Optimized for large datasets (100,000+ records)
- Efficient filtering and sorting
- Configurable page size (max 100 items per page)

### 2. Client-Side Caching
- Automatic request caching (1 minute TTL)
- Request deduplication
- Reduces unnecessary API calls

### 3. DataTable Component
- Automatic pagination
- Server-side sorting
- Real-time search with debouncing
- Loading states
- Responsive design

## Usage

### Basic DataTable Usage

```tsx
import { DataTable } from "@/components/common";
import type { TableColumn } from "@/components/common/Table";

interface User {
  id: string;
  name: string;
  email: string;
}

const columns: TableColumn<User>[] = [
  { key: "id", header: "ID", sortable: true },
  { key: "name", header: "Name", sortable: true },
  { key: "email", header: "Email", sortable: true },
];

export default function UsersPage() {
  return (
    <DataTable<User>
      endpoint="/data"
      columns={columns}
      initialPage={1}
      initialPageSize={20}
      searchable
      zebraStriping
      stickyHeader
    />
  );
}
```

### API Client Usage

```tsx
import { apiClient } from "@/lib/api/client";

// Fetch paginated data
const response = await apiClient.getData("/data", {
  page: 1,
  pageSize: 20,
  sortBy: "name",
  sortOrder: "asc",
  search: "john",
});
```

### Server-Side API Route

The API route automatically handles:
- Pagination parameters
- Sorting
- Searching
- Response caching

Example request:
```
GET /api/data?page=1&pageSize=20&sortBy=name&sortOrder=asc&search=john
```

## Performance Optimizations

1. **Server-Side Processing**: All filtering, sorting, and pagination happens on the server
2. **Caching**: API responses are cached for 1 minute
3. **Debounced Search**: Search queries are debounced by 300ms
4. **Lazy Loading**: Data is only fetched when needed
5. **Efficient Queries**: Uses LIMIT/OFFSET pattern (in production, use cursor-based pagination for better performance)

## Future Improvements

1. Implement cursor-based pagination for better performance with very large datasets
2. Add Redis caching for API responses
3. Implement server-side filtering with database indexes
4. Add data export functionality
5. Implement real-time updates with WebSockets


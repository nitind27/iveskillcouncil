"use client";

import { Breadcrumb } from "@/components/common";
import { Card, CardContent } from "@/components/common/Card";
import { FileText, Plus } from "lucide-react";

export default function BlogsPage() {
  return (
    <div className="space-y-6">
      <Breadcrumb />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Blogs</h1>
          <p className="text-muted-foreground mt-1">Manage blog posts and articles</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          Add Blog
        </button>
      </div>

      <Card className="rounded-xl shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">No blogs yet</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              Create blog posts to share updates, tips, and news with your audience.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

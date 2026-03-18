import { Breadcrumb } from "@/components/common";
import { Card, CardContent } from "@/components/common/Card";
import { BarChart3 } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <Breadcrumb />
      <Card className="rounded-xl shadow-lg shadow-black/5">
        <CardContent className="py-12 text-center text-muted-foreground">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="font-medium">Reports</p>
          <p className="text-sm">Global reports. (Admin)</p>
        </CardContent>
      </Card>
    </div>
  );
}

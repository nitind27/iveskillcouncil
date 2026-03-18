import { Breadcrumb } from "@/components/common";
import { Card, CardContent } from "@/components/common/Card";
import { UserCheck } from "lucide-react";

export default function AssignedStudentsPage() {
  return (
    <div className="space-y-6">
      <Breadcrumb />
      <Card className="rounded-xl shadow-lg shadow-black/5">
        <CardContent className="py-12 text-center text-muted-foreground">
          <UserCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="font-medium">Assigned Students</p>
          <p className="text-sm">View assigned students. (Staff)</p>
        </CardContent>
      </Card>
    </div>
  );
}

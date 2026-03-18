import { Breadcrumb } from "@/components/common";
import { Card, CardContent } from "@/components/common/Card";
import { Award } from "lucide-react";

export default function CertificatePage() {
  return (
    <div className="space-y-6">
      <Breadcrumb />
      <Card className="rounded-xl shadow-lg shadow-black/5">
        <CardContent className="py-12 text-center text-muted-foreground">
          <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="font-medium">Certificate</p>
          <p className="text-sm">View certificate (read-only). (Student)</p>
        </CardContent>
      </Card>
    </div>
  );
}

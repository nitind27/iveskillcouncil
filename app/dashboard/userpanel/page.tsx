import { Breadcrumb } from "@/components/common";
import ManageUserPanelForm from "@/components/adminpanel/userpanel/ManageUserPanelForm";
import { Monitor } from "lucide-react";

export const dynamic = "force-dynamic";

export default function ManageUserPanelPage() {
  return (
    <div className="space-y-6">
      <Breadcrumb />
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Monitor className="w-8 h-8" />
          User Panel Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure the public user panel: hero, stats, about, courses, franchise section, offers, gallery, and footer.
        </p>
      </div>
      <ManageUserPanelForm />
    </div>
  );
}

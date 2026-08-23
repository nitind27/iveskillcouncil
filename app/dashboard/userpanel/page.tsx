import ManageUserPanelForm from "@/components/adminpanel/userpanel/ManageUserPanelForm";

export const dynamic = "force-dynamic";

export default function ManageUserPanelPage() {
  return (
    <div className="space-y-5 pb-6">
      <ManageUserPanelForm />
    </div>
  );
}

"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useUserPanelConfig } from "@/contexts/UserPanelConfigContext";
import UserPanelNavbar from "./UserPanelNavbar";
import UserPanelFooter from "./UserPanelFooter";
import ScrollProgress from "./ScrollProgress";
import GlobalWelcomeModal from "./GlobalWelcomeModal";

export default function UserPanelShell({ children }: { children: React.ReactNode }) {
  const config = useUserPanelConfig();
  const { user } = useAuth();
  const userName = user?.fullName ?? null;

  return (
    <div className="userpanel min-h-screen bg-[var(--up-bg)] text-[var(--up-text)] overflow-x-hidden">
      <GlobalWelcomeModal config={config.welcomePopup} />
      <ScrollProgress />
      <UserPanelNavbar config={config} userName={userName} notificationCount={0} />
      <main className="pt-[var(--up-nav-height)]">{children}</main>
      <UserPanelFooter config={config} />
    </div>
  );
}

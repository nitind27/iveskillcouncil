"use client";

import { UserPanelConfigProvider } from "@/contexts/UserPanelConfigContext";
import { CourseCartProvider } from "@/contexts/CourseCartContext";
import UserPanelShell from "@/components/userpanel/UserPanelShell";

export default function UserPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserPanelConfigProvider>
      <CourseCartProvider>
        <UserPanelShell>{children}</UserPanelShell>
      </CourseCartProvider>
    </UserPanelConfigProvider>
  );
}

import { LucideIcon } from "lucide-react";

export interface SidebarMenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  badge?: string | number;
  children?: SidebarMenuItem[];
}

export interface SidebarSection {
  id: string;
  label?: string;
  items: SidebarMenuItem[];
}


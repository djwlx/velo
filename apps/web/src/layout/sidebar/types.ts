import type { LucideIcon } from 'lucide-react';

export interface SidebarSectionItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface SidebarSection {
  title?: string;
  items: SidebarSectionItem[];
}

export interface SidebarProps {
  sections?: SidebarSection[];
  onNavigate?: () => void;
}

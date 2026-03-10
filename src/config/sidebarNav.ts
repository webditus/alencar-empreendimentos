import { FileText, Kanban, Package, Users, FileCheck, LayoutDashboard, Box, CalendarDays, Video as LucideIcon } from 'lucide-react';

export type TabId = 'dashboard' | 'quotes' | 'kanban' | 'categories' | 'users' | 'contracts' | 'containers' | 'deliveries';

export interface SidebarNavItem {
  id: TabId;
  label: string;
  icon: LucideIcon;
  section: 'main' | 'management';
  allowedRoles: Array<'admin' | 'user'>;
}

export const SIDEBAR_STORAGE_KEY = 'admin_sidebar_state';

export const sidebarNavItems: SidebarNavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    section: 'main',
    allowedRoles: ['admin', 'user'],
  },
  {
    id: 'kanban',
    label: 'Kanban',
    icon: Kanban,
    section: 'main',
    allowedRoles: ['admin', 'user'],
  },
  {
    id: 'quotes',
    label: 'Orçamentos',
    icon: FileText,
    section: 'main',
    allowedRoles: ['admin', 'user'],
  },
  {
    id: 'contracts',
    label: 'Contratos',
    icon: FileCheck,
    section: 'main',
    allowedRoles: ['admin', 'user'],
  },
  {
    id: 'containers',
    label: 'Containers',
    icon: Box,
    section: 'main',
    allowedRoles: ['admin', 'user'],
  },
  {
    id: 'deliveries',
    label: 'Agenda de Entregas',
    icon: CalendarDays,
    section: 'main',
    allowedRoles: ['admin', 'user'],
  },
  {
    id: 'categories',
    label: 'Categorias',
    icon: Package,
    section: 'management',
    allowedRoles: ['admin', 'user'],
  },
  {
    id: 'users',
    label: 'Usuários',
    icon: Users,
    section: 'management',
    allowedRoles: ['admin', 'user'],
  },
];

export const sidebarSections = [
  { key: 'main' as const, label: 'Principal' },
  { key: 'management' as const, label: 'Gerenciamento' },
];

import { FileText, Kanban, Package, Users, FileCheck, LayoutDashboard, Box, CalendarDays, ClipboardList, type LucideIcon } from 'lucide-react';

export type TabId = 'dashboard' | 'quotes' | 'kanban' | 'categories' | 'users' | 'contracts' | 'containers' | 'deliveries' | 'activity-log';

export interface SidebarNavItem {
  id: TabId;
  label: string;
  icon: LucideIcon;
  section: 'main' | 'management';
  allowedRoles: Array<'admin' | 'manager' | 'viewer'>;
}

export const SIDEBAR_STORAGE_KEY = 'admin_sidebar_state';

export const sidebarNavItems: SidebarNavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    section: 'main',
    allowedRoles: ['admin', 'manager', 'viewer'],
  },
  {
    id: 'kanban',
    label: 'Kanban',
    icon: Kanban,
    section: 'main',
    allowedRoles: ['admin', 'manager', 'viewer'],
  },
  {
    id: 'quotes',
    label: 'Orçamentos',
    icon: FileText,
    section: 'main',
    allowedRoles: ['admin', 'manager', 'viewer'],
  },
  {
    id: 'contracts',
    label: 'Contratos',
    icon: FileCheck,
    section: 'main',
    allowedRoles: ['admin', 'manager', 'viewer'],
  },
  {
    id: 'containers',
    label: 'Containers',
    icon: Box,
    section: 'main',
    allowedRoles: ['admin', 'manager', 'viewer'],
  },
  {
    id: 'deliveries',
    label: 'Agenda de Entregas',
    icon: CalendarDays,
    section: 'main',
    allowedRoles: ['admin', 'manager', 'viewer'],
  },
  {
    id: 'categories',
    label: 'Categorias',
    icon: Package,
    section: 'management',
    allowedRoles: ['admin', 'manager', 'viewer'],
  },
  {
    id: 'users',
    label: 'Usuarios',
    icon: Users,
    section: 'management',
    allowedRoles: ['admin'],
  },
  {
    id: 'activity-log',
    label: 'Log de Atividades',
    icon: ClipboardList,
    section: 'management',
    allowedRoles: ['admin'],
  },
];

export const sidebarSections = [
  { key: 'main' as const, label: 'Principal' },
  { key: 'management' as const, label: 'Gerenciamento' },
];

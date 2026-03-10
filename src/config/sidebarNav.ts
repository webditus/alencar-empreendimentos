import { FileText, Kanban, Package, Users, FileCheck, Video as LucideIcon } from 'lucide-react';

export type TabId = 'quotes' | 'kanban' | 'categories' | 'users' | 'contracts';

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
    id: 'quotes',
    label: 'Orçamentos',
    icon: FileText,
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
    id: 'contracts',
    label: 'Contratos',
    icon: FileCheck,
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

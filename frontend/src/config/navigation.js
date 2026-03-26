import {
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Bell,
  Sparkles,
  Settings2,
} from 'lucide-react';

export const roleNavigation = {
  chef: [
    { path: '/chef', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/chef/formateurs', label: 'Formateurs', icon: GraduationCap },
    { path: '/chef/modules', label: 'Modules & Filieres', icon: BookOpen },
    { path: '/chef/affectations', label: 'Appariement intelligent', icon: Sparkles },
    { path: '/chef/planning', label: 'Planning', icon: CalendarDays },
    { path: '/chef/rapports', label: 'Rapports', icon: FileText },
    { path: '/chef/notifications', label: 'Notifications', icon: Bell },
  ],
  formateur: [
    { path: '/formateur', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/formateur/planning', label: 'Mon Planning', icon: CalendarDays },
    { path: '/formateur/modules', label: 'Mes Modules', icon: BookOpen },
    { path: '/formateur/questionnaire', label: 'Questionnaire', icon: ClipboardList },
    { path: '/formateur/demande', label: 'Demande', icon: FileText },
    { path: '/formateur/notifications', label: 'Notifications', icon: Bell },
  ],
  directeur: [
    { path: '/directeur', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/directeur/validation-planning', label: 'Validation Planning', icon: ClipboardCheck },
    { path: '/directeur/progression-modules', label: 'Progression Modules', icon: BookOpen },
    { path: '/directeur/academic-config', label: 'Calendrier Academique', icon: Settings2 },
    { path: '/directeur/rapports', label: 'Rapports', icon: FileText },
  ],
};

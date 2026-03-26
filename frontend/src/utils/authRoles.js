import { BriefcaseBusiness, GraduationCap, ShieldCheck } from 'lucide-react';

export const AUTH_ROLE_OPTIONS = [
  {
    key: 'administration',
    label: 'Administration',
    helper: 'Gestion complete',
    roleId: 2,
    icon: BriefcaseBusiness,
    testAccount: {
      email: 'chef@test.com',
      password: '123456',
    },
  },
  {
    key: 'directeur',
    label: 'Directeur Pedagogique',
    helper: 'Consultation',
    roleId: 1,
    icon: ShieldCheck,
    testAccount: {
      email: 'directeur@test.com',
      password: '123456',
    },
  },
  {
    key: 'formateur',
    label: 'Formateur',
    helper: 'Espace personnel',
    roleId: 3,
    icon: GraduationCap,
    testAccount: {
      email: 'formateur@test.com',
      password: '123456',
    },
  },
];

export function roleFromId(roleId) {
  return AUTH_ROLE_OPTIONS.find((role) => role.roleId === roleId) || AUTH_ROLE_OPTIONS[0];
}

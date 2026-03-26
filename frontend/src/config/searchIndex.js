const SEARCH_ENTRIES = [
  {
    id: 'chef-dashboard',
    roleKey: 'chef',
    path: '/chef',
    label: 'Dashboard',
    title: 'Tableau de bord backend',
    keywords: ['dashboard', 'alertes', 'repartition', 'stats'],
  },
  {
    id: 'chef-modules',
    roleKey: 'chef',
    path: '/chef/modules',
    label: 'Modules & Filieres',
    title: 'Catalogue des modules et filieres',
    keywords: ['modules', 'catalogue', 'semestre', 'efm', 'filiere'],
  },
  {
    id: 'chef-formateurs',
    roleKey: 'chef',
    path: '/chef/formateurs',
    label: 'Formateurs',
    title: 'Gestion des formateurs',
    keywords: ['formateurs', 'charges', 'specialite', 'email', 's1', 's2'],
  },
  {
    id: 'chef-affectations',
    roleKey: 'chef',
    path: '/chef/affectations',
    label: 'Appariement intelligent',
    title: 'Affectation intelligente des modules',
    keywords: ['affectation', 'assignation', 'ia', 'module', 'efm', 'charge'],
  },
  {
    id: 'chef-planning',
    roleKey: 'chef',
    path: '/chef/planning',
    label: 'Planning',
    title: 'Suivi hebdomadaire des charges',
    keywords: ['planning', 'semaine', 'charge hebdomadaire', 'overload'],
  },
  {
    id: 'chef-rapports',
    roleKey: 'chef',
    path: '/chef/rapports',
    label: 'Rapports',
    title: 'Exports et rapports recents',
    keywords: ['rapports', 'pdf', 'xlsx', 'exports'],
  },
  {
    id: 'chef-notifications',
    roleKey: 'chef',
    path: '/chef/notifications',
    label: 'Notifications',
    title: 'Demandes planning des formateurs',
    keywords: ['notifications', 'planning', 'acceptation', 'refus', 'demandes'],
  },
  {
    id: 'formateur-dashboard',
    roleKey: 'formateur',
    path: '/formateur',
    label: 'Dashboard',
    title: 'Synthese personnelle',
    keywords: ['dashboard', 'heures', 'alertes', 'modules'],
  },
  {
    id: 'formateur-modules',
    roleKey: 'formateur',
    path: '/formateur/modules',
    label: 'Mes Modules',
    title: 'Modules affectes',
    keywords: ['modules', 'affectations', 'volume horaire'],
  },
  {
    id: 'formateur-planning',
    roleKey: 'formateur',
    path: '/formateur/planning',
    label: 'Mon Planning',
    title: 'Emploi du temps hebdomadaire',
    keywords: ['planning', 'semaine', 'emploi du temps', 'heures'],
  },
  {
    id: 'formateur-demande',
    roleKey: 'formateur',
    path: '/formateur/demande',
    label: 'Demande',
    title: 'Demandes de modification',
    keywords: ['demande', 'modification', 'planning', 'historique'],
  },
  {
    id: 'formateur-notifications',
    roleKey: 'formateur',
    path: '/formateur/notifications',
    label: 'Notifications',
    title: 'Flux des alertes et validations',
    keywords: ['notifications', 'alertes', 'validations', 'rappels'],
  },
  {
    id: 'directeur-dashboard',
    roleKey: 'directeur',
    path: '/directeur',
    label: 'Dashboard',
    title: 'Supervision globale',
    keywords: ['dashboard', 'global', 'supervision', 'alertes'],
  },
  {
    id: 'directeur-validation',
    roleKey: 'directeur',
    path: '/directeur/validation-planning',
    label: 'Validation Planning',
    title: 'Validation des plannings hebdomadaires',
    keywords: ['validation', 'planning', 'soumissions', 'approbation', 'revision'],
  },
  {
    id: 'directeur-progression',
    roleKey: 'directeur',
    path: '/directeur/progression-modules',
    label: 'Progression Modules',
    title: 'Suivi de la progression des modules',
    keywords: ['progression', 'modules', 'avancement', 'groupes'],
  },
  {
    id: 'directeur-academic-config',
    roleKey: 'directeur',
    path: '/directeur/academic-config',
    label: 'Calendrier Academique',
    title: 'Configuration de l annee scolaire',
    keywords: ['calendrier', 'config', 'annee scolaire', 'semestre', 'stage', 'examen'],
  },
  {
    id: 'directeur-rapports',
    roleKey: 'directeur',
    path: '/directeur/rapports',
    label: 'Rapports',
    title: 'Exports PDF et Excel',
    keywords: ['rapports', 'exports', 'pdf', 'xlsx'],
  },
];

export function searchProjectEntries(query, roleKey) {
  const normalizedQuery = String(query || '')
    .trim()
    .toLowerCase();

  const availableEntries = SEARCH_ENTRIES.filter((entry) => entry.roleKey === roleKey);

  if (!normalizedQuery) {
    return availableEntries;
  }

  return availableEntries.filter((entry) =>
    [entry.label, entry.title, ...(entry.keywords || [])]
      .join(' ')
      .toLowerCase()
      .includes(normalizedQuery),
  );
}

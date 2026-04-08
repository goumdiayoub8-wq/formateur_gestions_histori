import { SYSTEM_WEEK_MAX, SYSTEM_WEEK_MIN } from './dateUtils';

export const MAX_ANNUAL_HOURS = 910;

export function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function parseBooleanLike(value) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value === 1;
  }

  const normalized = String(value || '')
    .trim()
    .toLowerCase();

  return ['1', 'true', 'yes', 'oui'].includes(normalized);
}

export function trimNumber(value) {
  const normalized = Math.round(safeNumber(value) * 10) / 10;
  return Number.isInteger(normalized) ? String(normalized) : normalized.toFixed(1);
}

export function formatHours(value) {
  return `${trimNumber(value)}h`;
}

export function buildModuleCode(module) {
  if (module?.code) {
    return module.code;
  }

  const id = safeNumber(module?.id);
  return `M${String(id).padStart(3, '0')}`;
}

export function dedupeAssignedModules(modules = []) {
  const seen = new Set();

  return modules.filter((module) => {
    const numericId = safeNumber(module?.id, NaN);
    const normalizedCode = String(module?.code || '').trim();
    const normalizedTitle = String(module?.intitule || '').trim();
    const identity = Number.isFinite(numericId) && numericId > 0
      ? `id:${numericId}`
      : normalizedCode !== ''
        ? `code:${normalizedCode}`
        : normalizedTitle !== ''
          ? `title:${normalizedTitle}`
          : '';

    if (identity === '' || seen.has(identity)) {
      return false;
    }

    seen.add(identity);
    return true;
  });
}

function getAffectationsForYear(affectations = [], academicYear = null) {
  if (!academicYear) {
    return affectations;
  }

  return affectations.filter((row) => safeNumber(row.annee) === safeNumber(academicYear));
}

export function getAcademicYearValue(config) {
  if (config?.start_date) {
    const year = new Date(config.start_date).getFullYear();
    if (Number.isFinite(year)) {
      return year;
    }
  }

  return new Date().getFullYear();
}

export function getAcademicWeekNumber(config) {
  if (!config?.start_date) {
    return null;
  }

  const startDate = new Date(config.start_date);
  if (Number.isNaN(startDate.getTime())) {
    return null;
  }

  const today = new Date();
  const difference = today.getTime() - startDate.getTime();
  const weekNumber = Math.floor(difference / (1000 * 60 * 60 * 24 * 7)) + 1;

  return Math.max(SYSTEM_WEEK_MIN, Math.min(SYSTEM_WEEK_MAX, weekNumber));
}

export function getLoadTone(ratio) {
  if (ratio >= 1) {
    return 'danger';
  }

  if (ratio >= 0.93) {
    return 'warning';
  }

  if (ratio >= 0.75) {
    return 'info';
  }

  return 'success';
}

export function getAlertTone(alertType) {
  if (alertType === 'annual_limit_exceeded' || alertType === 'weekly_overload' || alertType === 'conflict') {
    return 'danger';
  }

  if (alertType === 'semester_imbalance') {
    return 'warning';
  }

  return 'info';
}

export function buildTrainerStatsMap({
  formateurs = [],
  affectations = [],
  dashboardStats = [],
  academicYear = null,
}) {
  const affectationsForYear = getAffectationsForYear(affectations, academicYear);
  const dashboardMap = new Map(
    (dashboardStats || []).map((row) => [safeNumber(row.id), row]),
  );
  const statsMap = {};

  formateurs.forEach((formateur) => {
    const trainerId = safeNumber(formateur.id);
    const trainerAffectations = affectationsForYear.filter(
      (row) => safeNumber(row.formateur_id) === trainerId,
    );
    const dashboardRow = dashboardMap.get(trainerId);

    statsMap[trainerId] = {
      id: trainerId,
      annual_hours: safeNumber(dashboardRow?.annual_hours),
      planned_hours: safeNumber(dashboardRow?.planned_hours),
      completed_hours: safeNumber(dashboardRow?.completed_hours),
      s1_hours: safeNumber(dashboardRow?.s1_hours),
      s2_hours: safeNumber(dashboardRow?.s2_hours),
      planned_s1_hours: safeNumber(dashboardRow?.planned_s1_hours),
      planned_s2_hours: safeNumber(dashboardRow?.planned_s2_hours),
      semester_gap: safeNumber(dashboardRow?.semester_gap),
      current_week_hours: safeNumber(dashboardRow?.current_week_hours),
      max_week_hours: safeNumber(dashboardRow?.max_week_hours),
      max_heures: safeNumber(dashboardRow?.max_heures, formateur.max_heures ?? MAX_ANNUAL_HOURS),
      questionnaire_percentage:
        dashboardRow?.questionnaire_percentage === null || dashboardRow?.questionnaire_percentage === undefined
          ? null
          : safeNumber(dashboardRow.questionnaire_percentage),
      module_count: trainerAffectations.length,
      efm_count: trainerAffectations.filter((row) => parseBooleanLike(row.has_efm)).length,
      assigned_modules: dedupeAssignedModules(
        trainerAffectations.map((row) => ({
          id: safeNumber(row.module_id),
          code: buildModuleCode(row),
          intitule: row.module_intitule || row.intitule || '',
        })),
      ),
      alerts: Array.isArray(dashboardRow?.alerts) ? dashboardRow.alerts : [],
    };
  });

  return statsMap;
}

export function buildFiliereSummaries(modules = []) {
  const colorSets = [
    { badge: 'bg-violet-500', text: 'text-violet-600 dark:text-violet-300' },
    { badge: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-300' },
    { badge: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-300' },
    { badge: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-300' },
  ];
  const grouped = new Map();

  modules.forEach((module) => {
    const key = module.filiere || 'Sans filiere';
    if (!grouped.has(key)) {
      grouped.set(key, {
        id: key,
        filiere: key,
        modules: [],
        moduleCount: 0,
        totalHours: 0,
        efmCount: 0,
      });
    }

    const entry = grouped.get(key);
    entry.modules.push(module);
    entry.moduleCount += 1;
    entry.totalHours += safeNumber(module.volume_horaire);
    entry.efmCount += parseBooleanLike(module.has_efm) ? 1 : 0;
  });

  return Array.from(grouped.values())
    .sort((left, right) => left.filiere.localeCompare(right.filiere))
    .map((row, index) => ({
      ...row,
      ...colorSets[index % colorSets.length],
      shortLabel: row.filiere
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 3)
        .map((chunk) => chunk[0]?.toUpperCase() || '')
        .join(''),
    }));
}

export function mapAlertsByTrainer(alerts = []) {
  return alerts.reduce((accumulator, alert) => {
    const trainerId = safeNumber(alert.formateur_id);
    if (!accumulator[trainerId]) {
      accumulator[trainerId] = [];
    }
    accumulator[trainerId].push(alert);
    return accumulator;
  }, {});
}

export const MAX_WEEKLY_HOURS = 26;
export const MAX_ANNUAL_HOURS = 910;
export const SEMESTER_IMBALANCE_RATIO = 0.2;
export const SEMESTER_IMBALANCE_MIN = 30;

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

function normalizeToken(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

function buildPlanningMaps(planningEntries = [], currentWeek = null) {
  const weeklyByTrainer = {};
  const currentWeekByTrainer = {};
  const maxWeekByTrainer = {};

  planningEntries.forEach((entry) => {
    const trainerId = safeNumber(entry.formateur_id);
    const week = safeNumber(entry.semaine);
    const hours = safeNumber(entry.heures);

    if (!weeklyByTrainer[trainerId]) {
      weeklyByTrainer[trainerId] = {};
    }

    weeklyByTrainer[trainerId][week] = safeNumber(weeklyByTrainer[trainerId][week]) + hours;

    if (currentWeek !== null && week === currentWeek) {
      currentWeekByTrainer[trainerId] = safeNumber(currentWeekByTrainer[trainerId]) + hours;
    }
  });

  Object.entries(weeklyByTrainer).forEach(([trainerId, weeks]) => {
    maxWeekByTrainer[trainerId] = Object.values(weeks).reduce(
      (maximum, value) => Math.max(maximum, safeNumber(value)),
      0,
    );
  });

  return { weeklyByTrainer, currentWeekByTrainer, maxWeekByTrainer };
}

function getAffectationsForYear(affectations = [], academicYear = null) {
  if (!academicYear) {
    return affectations;
  }

  return affectations.filter((row) => safeNumber(row.annee) === safeNumber(academicYear));
}

export function estimateSemesterWeeks(config, semestre) {
  const fallback = semestre === 'S1' ? 18 : 17;

  if (!config?.start_date || !config?.end_date || !config?.s2_start_date) {
    return fallback;
  }

  const semesterStart =
    semestre === 'S2' ? new Date(config.s2_start_date) : new Date(config.start_date);
  const semesterEnd =
    semestre === 'S2' ? new Date(config.end_date) : new Date(config.s2_start_date);

  if (Number.isNaN(semesterStart.getTime()) || Number.isNaN(semesterEnd.getTime())) {
    return fallback;
  }

  const milliseconds = Math.abs(semesterEnd.getTime() - semesterStart.getTime());
  const weekCount = Math.max(1, Math.round(milliseconds / (1000 * 60 * 60 * 24 * 7)));

  return weekCount;
}

export function estimateModuleWeeklyHours(module, config) {
  const semesterWeeks = estimateSemesterWeeks(config, module?.semestre || 'S1');
  return Math.round((safeNumber(module?.volume_horaire) / semesterWeeks) * 10) / 10;
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

  return Math.max(1, Math.min(35, weekNumber));
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
  planningEntries = [],
  dashboardStats = [],
  academicYear = null,
  currentWeek = null,
}) {
  const affectationsForYear = getAffectationsForYear(affectations, academicYear);
  const planningMaps = buildPlanningMaps(planningEntries, currentWeek);
  const dashboardMap = new Map(
    (dashboardStats || []).map((row) => [safeNumber(row.id), row]),
  );
  const statsMap = {};

  formateurs.forEach((formateur) => {
    const trainerId = safeNumber(formateur.id);
    const trainerAffectations = affectationsForYear.filter(
      (row) => safeNumber(row.formateur_id) === trainerId,
    );
    const s1Hours = trainerAffectations
      .filter((row) => row.semestre === 'S1')
      .reduce((sum, row) => sum + safeNumber(row.volume_horaire), 0);
    const s2Hours = trainerAffectations
      .filter((row) => row.semestre === 'S2')
      .reduce((sum, row) => sum + safeNumber(row.volume_horaire), 0);
    const annualHours = trainerAffectations.reduce(
      (sum, row) => sum + safeNumber(row.volume_horaire),
      0,
    );
    const dashboardRow = dashboardMap.get(trainerId);
    const annualLimit = safeNumber(formateur.max_heures, MAX_ANNUAL_HOURS);
    const currentWeekHours = safeNumber(
      planningMaps.currentWeekByTrainer[trainerId],
      safeNumber(dashboardRow?.current_week_hours),
    );
    const maxWeekHours = safeNumber(
      planningMaps.maxWeekByTrainer[trainerId],
      safeNumber(dashboardRow?.max_week_hours),
    );

    statsMap[trainerId] = {
      id: trainerId,
      annual_hours: safeNumber(dashboardRow?.annual_hours, annualHours),
      s1_hours: safeNumber(dashboardRow?.s1_hours, s1Hours),
      s2_hours: safeNumber(dashboardRow?.s2_hours, s2Hours),
      semester_gap: safeNumber(
        dashboardRow?.semester_gap,
        Math.abs(s1Hours - s2Hours),
      ),
      current_week_hours: currentWeekHours,
      max_week_hours: maxWeekHours,
      max_heures: annualLimit,
      module_count: trainerAffectations.length,
      efm_count: trainerAffectations.filter((row) => parseBooleanLike(row.has_efm)).length,
      assigned_modules: trainerAffectations.map((row) => ({
        id: safeNumber(row.module_id),
        code: buildModuleCode(row),
        intitule: row.module_intitule || row.intitule || '',
      })),
      alerts: Array.isArray(dashboardRow?.alerts) ? dashboardRow.alerts : [],
    };
  });

  return statsMap;
}

export function buildDashboardKpis({
  formateurs = [],
  modules = [],
  planningEntries = [],
  dashboardPayload = {},
}) {
  const overview = dashboardPayload?.overview || {};
  const trainerStats = dashboardPayload?.formateurs || [];
  const alertCount = Array.isArray(dashboardPayload?.alerts)
    ? dashboardPayload.alerts.length
    : 0;
  const averageLoad =
    trainerStats.length > 0
      ? Math.round(
          trainerStats.reduce((sum, row) => sum + safeNumber(row.annual_hours), 0) /
            trainerStats.length,
        )
      : 0;

  return {
    totalFormateurs: safeNumber(overview.total_formateurs, formateurs.length),
    totalModules: safeNumber(overview.total_modules, modules.length),
    averageLoad,
    alertCount,
    totalWeeklyHours: planningEntries.reduce(
      (sum, entry) => sum + safeNumber(entry.heures),
      0,
    ),
  };
}

export function buildFiliereSummaries(modules = []) {
  const colorSets = [
    { badge: 'bg-[#8b5cf6]', text: 'text-[#8b5cf6]' },
    { badge: 'bg-[#3b82f6]', text: 'text-[#3b82f6]' },
    { badge: 'bg-[#10b981]', text: 'text-[#10b981]' },
    { badge: 'bg-[#f97316]', text: 'text-[#f97316]' },
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

export function buildWeeklyPlanningRows(formateurs = [], planningEntries = [], trainerStatsMap = {}) {
  const byTrainer = {};

  planningEntries.forEach((entry) => {
    const trainerId = safeNumber(entry.formateur_id);
    if (!byTrainer[trainerId]) {
      byTrainer[trainerId] = {};
    }

    const week = safeNumber(entry.semaine);
    byTrainer[trainerId][week] = safeNumber(byTrainer[trainerId][week]) + safeNumber(entry.heures);
  });

  return formateurs.map((formateur) => {
    const trainerId = safeNumber(formateur.id);
    const weeks = byTrainer[trainerId] || {};
    const busiestWeek = Object.entries(weeks).reduce(
      (current, [week, hours]) =>
        safeNumber(hours) > safeNumber(current.hours)
          ? { week: safeNumber(week), hours: safeNumber(hours) }
          : current,
      { week: null, hours: 0 },
    );
    const stats = trainerStatsMap[trainerId] || {};

    return {
      id: trainerId,
      nom: formateur.nom,
      specialite: formateur.specialite,
      currentWeekHours: safeNumber(stats.current_week_hours),
      maxWeekHours: safeNumber(stats.max_week_hours, busiestWeek.hours),
      busiestWeek: busiestWeek.week,
      totalPlannedHours: Object.values(weeks).reduce(
        (sum, value) => sum + safeNumber(value),
        0,
      ),
      warning:
        safeNumber(stats.max_week_hours, busiestWeek.hours) > MAX_WEEKLY_HOURS
          ? 'Depassement hebdomadaire'
          : '',
    };
  });
}

export function validateAssignment({
  formateur,
  module,
  affectations = [],
  planningEntries = [],
  academicConfig = null,
  academicYear = null,
  trainerStats = null,
}) {
  const annualLimit = safeNumber(formateur?.max_heures, MAX_ANNUAL_HOURS);
  const affectationsForYear = getAffectationsForYear(affectations, academicYear);
  const trainerId = safeNumber(formateur?.id);
  const moduleId = safeNumber(module?.id);
  const trainerAffectations = affectationsForYear.filter(
    (row) => safeNumber(row.formateur_id) === trainerId,
  );
  const currentAnnualHours = safeNumber(
    trainerStats?.annual_hours,
    trainerAffectations.reduce((sum, row) => sum + safeNumber(row.volume_horaire), 0),
  );
  const currentMaxWeek = safeNumber(
    trainerStats?.max_week_hours,
    buildPlanningMaps(planningEntries).maxWeekByTrainer[trainerId],
  );
  const currentWeekProjection = estimateModuleWeeklyHours(module, academicConfig);
  const projectedAnnual = currentAnnualHours + safeNumber(module?.volume_horaire);
  const projectedWeekly = currentMaxWeek + currentWeekProjection;
  const duplicate = trainerAffectations.some((row) => safeNumber(row.module_id) === moduleId);
  const moduleAlreadyAssigned = affectationsForYear.find(
    (row) => safeNumber(row.module_id) === moduleId,
  );
  const currentS1Hours = safeNumber(
    trainerStats?.s1_hours,
    trainerAffectations
      .filter((row) => row.semestre === 'S1')
      .reduce((sum, row) => sum + safeNumber(row.volume_horaire), 0),
  );
  const currentS2Hours = safeNumber(
    trainerStats?.s2_hours,
    trainerAffectations
      .filter((row) => row.semestre === 'S2')
      .reduce((sum, row) => sum + safeNumber(row.volume_horaire), 0),
  );
  const projectedS1Hours =
    module?.semestre === 'S1'
      ? currentS1Hours + safeNumber(module?.volume_horaire)
      : currentS1Hours;
  const projectedS2Hours =
    module?.semestre === 'S2'
      ? currentS2Hours + safeNumber(module?.volume_horaire)
      : currentS2Hours;
  const semesterGap = Math.abs(projectedS1Hours - projectedS2Hours);
  const semesterTotal = projectedS1Hours + projectedS2Hours;
  const allowedSemesterGap = Math.max(
    SEMESTER_IMBALANCE_MIN,
    semesterTotal * SEMESTER_IMBALANCE_RATIO,
  );
  const currentEfmCount = safeNumber(
    trainerStats?.efm_count,
    trainerAffectations.filter((row) => parseBooleanLike(row.has_efm)).length,
  );
  const nextEfmCount =
    currentEfmCount + (parseBooleanLike(module?.has_efm) ? 1 : 0);
  const remainingHours = annualLimit - projectedAnnual;
  const errors = [];
  const warnings = [];

  if (duplicate) {
    errors.push('Ce module est deja affecte a ce formateur.');
  }

  if (
    moduleAlreadyAssigned &&
    safeNumber(moduleAlreadyAssigned.formateur_id) !== trainerId
  ) {
    errors.push('Ce module est deja affecte a un autre formateur.');
  }

  if (projectedAnnual > annualLimit) {
    errors.push(
      `Le formateur depasserait la limite annuelle de ${annualLimit}h.`,
    );
  }

  if (projectedWeekly > MAX_WEEKLY_HOURS) {
    errors.push('La charge hebdomadaire projetee depasserait 26h/semaine.');
  }

  if (parseBooleanLike(module?.has_efm) && currentEfmCount >= 1) {
    errors.push("Un formateur ne peut pas avoir plus d'un module avec EFM.");
  }

  if (semesterTotal > 0 && semesterGap > allowedSemesterGap) {
    errors.push('La repartition S1 / S2 deviendrait desequilibree.');
  }

  if (projectedAnnual >= annualLimit * 0.93 && projectedAnnual <= annualLimit) {
    warnings.push('Le formateur approcherait fortement sa limite annuelle.');
  }

  if (projectedWeekly >= MAX_WEEKLY_HOURS * 0.85 && projectedWeekly <= MAX_WEEKLY_HOURS) {
    warnings.push('La charge hebdomadaire projetee est tres elevee.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    projectedAnnual,
    projectedWeekly,
    estimatedWeeklyHours: currentWeekProjection,
    projectedS1Hours,
    projectedS2Hours,
    semesterGap,
    allowedSemesterGap,
    nextEfmCount,
    remainingHours,
  };
}

function computeOverlapScore(formateur, module) {
  const trainerTokens = new Set(normalizeToken(formateur?.specialite));
  const moduleTokens = new Set(
    normalizeToken(`${module?.intitule || ''} ${module?.filiere || ''}`),
  );

  if (trainerTokens.size === 0 || moduleTokens.size === 0) {
    return 0;
  }

  let overlap = 0;
  moduleTokens.forEach((token) => {
    if (trainerTokens.has(token)) {
      overlap += 1;
    }
  });

  return overlap / moduleTokens.size;
}

export function buildAssignmentSuggestions({
  module,
  formateurs = [],
  affectations = [],
  planningEntries = [],
  trainerStatsMap = {},
  academicConfig = null,
  academicYear = null,
}) {
  const candidates = formateurs.map((formateur) => {
    const validation = validateAssignment({
      formateur,
      module,
      affectations,
      planningEntries,
      academicConfig,
      academicYear,
      trainerStats: trainerStatsMap[safeNumber(formateur.id)],
    });
    const trainerStats = trainerStatsMap[safeNumber(formateur.id)] || {};
    const overlapScore = computeOverlapScore(formateur, module);
    const annualLimit = safeNumber(formateur.max_heures, MAX_ANNUAL_HOURS);
    const remainingRatio =
      annualLimit > 0
        ? Math.max(0, validation.remainingHours) / annualLimit
        : 0;
    const weeklyHeadroomRatio = Math.max(
      0,
      (MAX_WEEKLY_HOURS - validation.projectedWeekly) / MAX_WEEKLY_HOURS,
    );
    const balanceScore =
      validation.allowedSemesterGap > 0
        ? Math.max(0, 1 - validation.semesterGap / validation.allowedSemesterGap)
        : 0;
    const score = Math.round(
      overlapScore * 40 +
        remainingRatio * 32 +
        weeklyHeadroomRatio * 18 +
        balanceScore * 10 -
        validation.errors.length * 100,
    );

    return {
      id: safeNumber(formateur.id),
      formateur,
      trainerStats,
      validation,
      score,
      overlapScore,
      assignedModules: trainerStats.assigned_modules || [],
      remainingHours: Math.max(0, validation.remainingHours),
    };
  });

  const ordered = candidates.sort((left, right) => {
    if (left.validation.errors.length !== right.validation.errors.length) {
      return left.validation.errors.length - right.validation.errors.length;
    }

    if (left.score !== right.score) {
      return right.score - left.score;
    }

    return String(left.formateur.nom || '').localeCompare(String(right.formateur.nom || ''));
  });

  return ordered.map((candidate, index) => ({
    ...candidate,
    label:
      candidate.validation.valid && index === 0
        ? 'Meilleur match'
        : candidate.validation.valid
          ? 'Recommande'
          : 'Bloque',
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

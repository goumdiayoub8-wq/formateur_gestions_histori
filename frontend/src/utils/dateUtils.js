export const ACADEMIC_MAX_WEEKS = 35;

function toDate(value) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? new Date(value) : new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(value) {
  const date = toDate(value);
  if (!date) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date;
}

export function formatAcademicYear(config) {
  const start = startOfDay(config?.start_date);
  const end = startOfDay(config?.end_date);

  if (!start || !end) {
    return '';
  }

  return `${start.getFullYear()}-${end.getFullYear()}`;
}

export function getCurrentWeek(startDate, currentDate = new Date()) {
  const start = startOfDay(startDate);
  const current = startOfDay(currentDate);

  if (!start || !current) {
    return null;
  }

  const diffDays = Math.floor((current.getTime() - start.getTime()) / 86400000);

  if (diffDays < 0) {
    return 0;
  }

  return Math.floor(diffDays / 7) + 1;
}

export function getAcademicWeekCount(startDate, endDate) {
  const start = startOfDay(startDate);
  const end = startOfDay(endDate);

  if (!start || !end || end < start) {
    return null;
  }

  const diffDays = Math.floor((end.getTime() - start.getTime()) / 86400000);
  return Math.min(ACADEMIC_MAX_WEEKS, Math.floor(diffDays / 7) + 1);
}

export function getAcademicWeekRange(startDate, weekNumber, locale = 'fr-FR') {
  const start = startOfDay(startDate);
  const week = Number(weekNumber || 0);

  if (!start || week < 1) {
    return '';
  }

  const rangeStart = new Date(start);
  rangeStart.setDate(start.getDate() + (week - 1) * 7);

  const rangeEnd = new Date(rangeStart);
  rangeEnd.setDate(rangeStart.getDate() + 6);

  const formatDate = (value) =>
    value.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  return `${formatDate(rangeStart)} - ${formatDate(rangeEnd)}`;
}

export function getSemester(date, s2StartDate) {
  const current = startOfDay(date);
  const s2Start = startOfDay(s2StartDate);

  if (!current || !s2Start) {
    return null;
  }

  return current < s2Start ? 'S1' : 'S2';
}

export function isInStagePeriod(date, stageStartDate, stageEndDate) {
  const current = startOfDay(date);
  const start = startOfDay(stageStartDate);
  const end = startOfDay(stageEndDate);

  if (!current || !start || !end) {
    return false;
  }

  return current >= start && current <= end;
}

export function isInExamPeriod(date, examRegionalDate) {
  const current = startOfDay(date);
  const exam = startOfDay(examRegionalDate);

  if (!current || !exam) {
    return false;
  }

  return current.getTime() === exam.getTime();
}

export function validateAcademicConfig(config) {
  const errors = {};
  const start = startOfDay(config?.start_date);
  const end = startOfDay(config?.end_date);
  const s2Start = startOfDay(config?.s2_start_date);
  const stageStart = startOfDay(config?.stage_start_date);
  const stageEnd = startOfDay(config?.stage_end_date);
  const examDate = startOfDay(config?.exam_regional_date);

  if (!start) {
    errors.start_date = 'Date de debut invalide.';
  }

  if (!end) {
    errors.end_date = 'Date de fin invalide.';
  }

  if (!s2Start) {
    errors.s2_start_date = 'Date de debut S2 invalide.';
  }

  if (!stageStart) {
    errors.stage_start_date = 'Date de debut de stage invalide.';
  }

  if (!stageEnd) {
    errors.stage_end_date = 'Date de fin de stage invalide.';
  }

  if (!examDate) {
    errors.exam_regional_date = "Date d'examen invalide.";
  }

  if (start && s2Start && end && !(start < s2Start && s2Start < end)) {
    errors.date_order = 'Les dates doivent respecter: debut < S2 < fin.';
  }

  if (s2Start && stageStart && stageEnd && end && !(s2Start <= stageStart && stageStart <= stageEnd && stageEnd <= end)) {
    errors.stage_period = 'La periode de stage doit etre comprise dans le semestre S2.';
  }

  if (s2Start && examDate && end && !(s2Start <= examDate && examDate <= end)) {
    errors.exam_regional_date = "La date d'examen doit etre comprise dans le semestre S2.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

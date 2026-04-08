import {
  SYSTEM_WEEK_MAX,
  formatAcademicYear,
  getAcademicWeekCount,
  getAcademicWeekRange,
  getCurrentWeek,
  getSemester,
  isInExamPeriod,
  isInStagePeriod,
  validateAcademicConfig,
} from '../../../frontend/src/utils/dateUtils.js';

describe('dateUtils', () => {
  it('formats the academic year when start and end dates are valid', () => {
    expect(formatAcademicYear({
      start_date: '2025-09-01',
      end_date: '2026-06-30',
    })).toBe('2025-2026');
  });

  it('returns an empty academic year when dates are invalid', () => {
    expect(formatAcademicYear({ start_date: 'invalid', end_date: '2026-06-30' })).toBe('');
  });

  it('returns week 0 before the academic year starts', () => {
    expect(getCurrentWeek('2025-09-01', new Date('2025-08-25T12:00:00Z'))).toBe(0);
  });

  it('clamps the current week to the configured system maximum', () => {
    expect(getCurrentWeek('2025-09-01', new Date('2027-09-01T12:00:00Z'))).toBe(SYSTEM_WEEK_MAX);
  });

  it('computes the academic week count and rejects reversed date ranges', () => {
    expect(getAcademicWeekCount('2025-09-01', '2026-06-30')).toBeGreaterThan(30);
    expect(getAcademicWeekCount('2026-06-30', '2025-09-01')).toBeNull();
  });

  it('builds a readable academic week range and rejects invalid weeks', () => {
    expect(getAcademicWeekRange('2025-09-01', 1)).toContain('2025');
    expect(getAcademicWeekRange('2025-09-01', 99)).toBe('');
  });

  it('detects the correct semester based on the S2 start date', () => {
    expect(getSemester('2026-01-15', '2026-02-01')).toBe('S1');
    expect(getSemester('2026-03-15', '2026-02-01')).toBe('S2');
    expect(getSemester(null, '2026-02-01')).toBeNull();
  });

  it('detects stage and exam periods accurately', () => {
    expect(isInStagePeriod('2026-04-15', '2026-04-01', '2026-05-01')).toBe(true);
    expect(isInStagePeriod('2026-03-20', '2026-04-01', '2026-05-01')).toBe(false);
    expect(isInExamPeriod('2026-06-18', '2026-06-18')).toBe(true);
    expect(isInExamPeriod('2026-06-17', '2026-06-18')).toBe(false);
  });

  it('validates a complete academic configuration and reports ordering errors', () => {
    expect(validateAcademicConfig({
      start_date: '2025-09-01',
      end_date: '2026-06-30',
      s2_start_date: '2026-02-01',
      stage_start_date: '2026-03-01',
      stage_end_date: '2026-05-01',
      exam_regional_date: '2026-06-18',
    })).toEqual({
      isValid: true,
      errors: {},
    });

    const invalid = validateAcademicConfig({
      start_date: '2025-09-01',
      end_date: '2026-06-30',
      s2_start_date: '2025-08-01',
      stage_start_date: '2026-07-01',
      stage_end_date: '2026-07-15',
      exam_regional_date: '2027-01-01',
    });

    expect(invalid.isValid).toBe(false);
    expect(invalid.errors).toHaveProperty('date_order');
    expect(invalid.errors).toHaveProperty('stage_period');
    expect(invalid.errors).toHaveProperty('exam_regional_date');
  });
});

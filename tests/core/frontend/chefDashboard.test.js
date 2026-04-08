import {
  MAX_ANNUAL_HOURS,
  buildFiliereSummaries,
  buildModuleCode,
  buildTrainerStatsMap,
  dedupeAssignedModules,
  formatHours,
  getAlertTone,
  getLoadTone,
  mapAlertsByTrainer,
  parseBooleanLike,
  safeNumber,
  trimNumber,
} from '../../../frontend/src/utils/chefDashboard.js';

describe('chefDashboard utils', () => {
  it('normalizes and formats numeric values safely', () => {
    expect(safeNumber('12.5')).toBe(12.5);
    expect(safeNumber('oops', 7)).toBe(7);
    expect(trimNumber(12)).toBe('12');
    expect(trimNumber(12.34)).toBe('12.3');
    expect(formatHours(18.0)).toBe('18h');
  });

  it('parses boolean-like values consistently', () => {
    expect(parseBooleanLike(true)).toBe(true);
    expect(parseBooleanLike(1)).toBe(true);
    expect(parseBooleanLike('oui')).toBe(true);
    expect(parseBooleanLike('false')).toBe(false);
  });

  it('builds fallback module codes and deduplicates assigned modules', () => {
    expect(buildModuleCode({ id: 4 })).toBe('M004');

    expect(
      dedupeAssignedModules([
        { id: 12, code: 'DEV101', intitule: 'React' },
        { id: 12, code: 'DEV101', intitule: 'React duplicate' },
        { code: 'NET202', intitule: 'Networks' },
        { code: 'NET202', intitule: 'Networks duplicate' },
        { intitule: 'Standalone title' },
        { intitule: 'Standalone title' },
      ]),
    ).toEqual([
      { id: 12, code: 'DEV101', intitule: 'React' },
      { code: 'NET202', intitule: 'Networks' },
      { intitule: 'Standalone title' },
    ]);
  });

  it('builds a trainer stats map filtered by academic year and dedupes modules', () => {
    const statsMap = buildTrainerStatsMap({
      formateurs: [
        { id: 3, max_heures: 800 },
        { id: 9, max_heures: 700 },
      ],
      affectations: [
        { formateur_id: 3, module_id: 155, annee: 2026, has_efm: 1, code: 'M104', module_intitule: 'Algo' },
        { formateur_id: 3, module_id: 155, annee: 2026, has_efm: 1, code: 'M104', module_intitule: 'Algo duplicate' },
        { formateur_id: 3, module_id: 200, annee: 2025, has_efm: 0, code: 'OLD1', module_intitule: 'Old module' },
      ],
      dashboardStats: [
        { id: 3, annual_hours: 120, planned_hours: 40, completed_hours: 12, s1_hours: 60, s2_hours: 60, current_week_hours: 8 },
      ],
      academicYear: 2026,
    });

    expect(statsMap[3]).toMatchObject({
      id: 3,
      annual_hours: 120,
      planned_hours: 40,
      completed_hours: 12,
      efm_count: 2,
      module_count: 2,
      max_heures: 800,
    });
    expect(statsMap[3].assigned_modules).toEqual([
      { id: 155, code: 'M104', intitule: 'Algo' },
    ]);
    expect(statsMap[9].max_heures).toBe(700);
    expect(statsMap[9].assigned_modules).toEqual([]);
  });

  it('builds grouped filiere summaries and alert maps', () => {
    const summaries = buildFiliereSummaries([
      { filiere: 'Developpement Digital', volume_horaire: 30, has_efm: 1 },
      { filiere: 'Developpement Digital', volume_horaire: 40, has_efm: 0 },
      { filiere: 'Reseaux', volume_horaire: 20, has_efm: 0 },
    ]);

    expect(summaries).toHaveLength(2);
    expect(summaries[0]).toMatchObject({
      filiere: 'Developpement Digital',
      moduleCount: 2,
      totalHours: 70,
      efmCount: 1,
      shortLabel: 'DD',
    });

    expect(mapAlertsByTrainer([
      { formateur_id: 3, type: 'conflict' },
      { formateur_id: 3, type: 'warning' },
      { formateur_id: 9, type: 'info' },
    ])).toEqual({
      3: [{ formateur_id: 3, type: 'conflict' }, { formateur_id: 3, type: 'warning' }],
      9: [{ formateur_id: 9, type: 'info' }],
    });
  });

  it('maps load and alert tones for visual indicators', () => {
    expect(getLoadTone(1.05)).toBe('danger');
    expect(getLoadTone(0.95)).toBe('warning');
    expect(getLoadTone(0.8)).toBe('info');
    expect(getLoadTone(0.5)).toBe('success');

    expect(getAlertTone('conflict')).toBe('danger');
    expect(getAlertTone('semester_imbalance')).toBe('warning');
    expect(getAlertTone('unknown')).toBe('info');
  });

  it('exposes the annual hours fallback constant', () => {
    expect(MAX_ANNUAL_HOURS).toBe(910);
  });
});

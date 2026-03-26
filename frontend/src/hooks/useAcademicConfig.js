import { useEffect, useMemo, useState } from 'react';
import AcademicConfigService from '../services/academicConfigService';
import {
  formatAcademicYear,
  getCurrentWeek,
  getSemester,
  isInExamPeriod,
  isInStagePeriod,
  validateAcademicConfig,
} from '../utils/dateUtils';

export default function useAcademicConfig() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await AcademicConfigService.getConfig();
      setConfig(response || null);
    } catch (loadError) {
      setError(loadError?.message || 'Impossible de charger la configuration academique.');
      setConfig(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const validation = useMemo(() => validateAcademicConfig(config || {}), [config]);

  const derived = useMemo(() => {
    if (!config || !validation.isValid) {
      return {
        academicYearLabel: config ? formatAcademicYear(config) : '',
        currentWeek: null,
        currentSemester: null,
        inStagePeriod: false,
        inExamPeriod: false,
      };
    }

    const today = new Date();

    return {
      academicYearLabel: config.academic_year_label || formatAcademicYear(config),
      currentWeek: getCurrentWeek(config.start_date, today),
      currentSemester: getSemester(today, config.s2_start_date),
      inStagePeriod: isInStagePeriod(today, config.stage_start_date, config.stage_end_date),
      inExamPeriod: isInExamPeriod(today, config.exam_regional_date),
    };
  }, [config, validation.isValid]);

  const saveConfig = async (payload) => {
    setSaving(true);
    setError('');

    try {
      const response = await AcademicConfigService.saveConfig(payload);
      setConfig(response || null);
      return response;
    } catch (saveError) {
      const nextError = saveError?.message || "Impossible d'enregistrer la configuration academique.";
      setError(nextError);
      throw saveError;
    } finally {
      setSaving(false);
    }
  };

  return {
    config,
    loading,
    saving,
    error,
    setError,
    reload: loadConfig,
    saveConfig,
    validation,
    ...derived,
  };
}

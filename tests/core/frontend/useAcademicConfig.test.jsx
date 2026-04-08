import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import authReducer from '../../../frontend/src/store/slices/authSlice.js';
import { act, configureStore, Provider, renderHook, waitFor } from '../../../frontend/src/test/testingModules.js';

const { academicConfigServiceMock } = vi.hoisted(() => ({
  academicConfigServiceMock: {
    getConfig: vi.fn(),
    saveConfig: vi.fn(),
  },
}));

vi.mock('../../../frontend/src/services/academicConfigService.js', () => ({
  default: academicConfigServiceMock,
}));

import useAcademicConfig from '../../../frontend/src/hooks/useAcademicConfig.js';

const e = React.createElement;

function wrapper({ children }) {
  const store = configureStore({
    reducer: {
      auth: authReducer,
    },
  });

  return e(Provider, { store }, children);
}

describe('useAcademicConfig', () => {
  beforeEach(() => {
    academicConfigServiceMock.getConfig.mockReset();
    academicConfigServiceMock.saveConfig.mockReset();
    vi.useRealTimers();
  });

  it('stays idle when disabled', async () => {
    const { result } = renderHook(() => useAcademicConfig({ enabled: false }), { wrapper });

    expect(result.current.enabled).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.config).toBeNull();
    expect(academicConfigServiceMock.getConfig).not.toHaveBeenCalled();
  });

  it('loads and derives academic information from the backend config', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-15T09:00:00Z'));

    academicConfigServiceMock.getConfig.mockResolvedValueOnce({
      start_date: '2025-09-01',
      end_date: '2026-06-30',
      s2_start_date: '2026-02-01',
      stage_start_date: '2026-04-01',
      stage_end_date: '2026-05-01',
      exam_regional_date: '2026-06-18',
    });

    const { result } = renderHook(() => useAcademicConfig(), { wrapper });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.validation.isValid).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(result.current.academicYearLabel).toBe('2025-2026');
    expect(result.current.currentSemester).toBe('S2');
    expect(result.current.currentWeek).toBeGreaterThan(1);
    expect(result.current.inStagePeriod).toBe(true);
    expect(result.current.inExamPeriod).toBe(false);

    vi.useRealTimers();
  });

  it('surfaces backend loading failures without crashing the hook', async () => {
    academicConfigServiceMock.getConfig.mockRejectedValueOnce(new Error('API down'));

    const { result } = renderHook(() => useAcademicConfig(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.config).toBeNull();
    expect(result.current.error).toBe('API down');
  });

  it('saves config successfully and updates the derived state', async () => {
    academicConfigServiceMock.getConfig.mockResolvedValueOnce({
      start_date: '2025-09-01',
      end_date: '2026-06-30',
      s2_start_date: '2026-02-01',
      stage_start_date: '2026-04-01',
      stage_end_date: '2026-05-01',
      exam_regional_date: '2026-06-18',
    });
    academicConfigServiceMock.saveConfig.mockResolvedValueOnce({
      start_date: '2025-09-08',
      end_date: '2026-07-07',
      s2_start_date: '2026-02-08',
      stage_start_date: '2026-04-08',
      stage_end_date: '2026-05-08',
      exam_regional_date: '2026-06-25',
      academic_year_label: 'Custom label',
    });

    const { result } = renderHook(() => useAcademicConfig(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.saveConfig({ start_date: '2025-09-08' });
    });

    expect(result.current.saving).toBe(false);
    expect(result.current.config).toMatchObject({
      start_date: '2025-09-08',
      academic_year_label: 'Custom label',
    });
    expect(result.current.academicYearLabel).toBe('Custom label');
  });

  it('keeps the previous config and exposes an error when save fails', async () => {
    academicConfigServiceMock.getConfig.mockResolvedValueOnce({
      start_date: '2025-09-01',
      end_date: '2026-06-30',
      s2_start_date: '2026-02-01',
      stage_start_date: '2026-04-01',
      stage_end_date: '2026-05-01',
      exam_regional_date: '2026-06-18',
    });
    academicConfigServiceMock.saveConfig.mockRejectedValueOnce(new Error('Save failed'));

    const { result } = renderHook(() => useAcademicConfig(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    let thrownError = null;
    await act(async () => {
      try {
        await result.current.saveConfig({ start_date: '2025-09-15' });
      } catch (error) {
        thrownError = error;
      }
    });

    expect(thrownError).toBeInstanceOf(Error);
    expect(thrownError?.message).toBe('Save failed');
    expect(result.current.error).toBe('Save failed');
    expect(result.current.config).toMatchObject({
      start_date: '2025-09-01',
    });
  });
});

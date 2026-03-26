import React, { useEffect, useState } from 'react';
import { AlertTriangle, CalendarDays, Clock3, Save } from 'lucide-react';
import { validateAcademicConfig } from '../../utils/dateUtils';

function Field({ label, value, onChange, error, icon: Icon }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-[14px] font-semibold text-[#334761]">
        <Icon className="h-4 w-4 text-[#8e56ff]" />
        {label}
      </span>
      <input
        type="date"
        value={value}
        onChange={onChange}
        className={`h-12 w-full rounded-[16px] border bg-[#f7f9fd] px-4 text-[14px] text-[#223046] outline-none transition ${
          error ? 'border-[#ffcccc]' : 'border-[#e7ecf5]'
        }`}
      />
      {error ? <p className="mt-2 text-[13px] text-[#d14343]">{error}</p> : null}
    </label>
  );
}

export default function AcademicConfigForm({ initialValues, saving, onSubmit }) {
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    s2_start_date: '',
    stage_start_date: '',
    stage_end_date: '',
    exam_regional_date: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setFormData({
      start_date: initialValues?.start_date || '',
      end_date: initialValues?.end_date || '',
      s2_start_date: initialValues?.s2_start_date || '',
      stage_start_date: initialValues?.stage_start_date || '',
      stage_end_date: initialValues?.stage_end_date || '',
      exam_regional_date: initialValues?.exam_regional_date || '',
    });
    setErrors({});
  }, [initialValues]);

  const handleChange = (field) => (event) => {
    setFormData((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validation = validateAcademicConfig(formData);

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    await onSubmit(formData);
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid gap-5 lg:grid-cols-2">
        <Field
          label="Debut annee scolaire"
          icon={CalendarDays}
          value={formData.start_date}
          onChange={handleChange('start_date')}
          error={errors.start_date}
        />
        <Field
          label="Fin annee scolaire"
          icon={CalendarDays}
          value={formData.end_date}
          onChange={handleChange('end_date')}
          error={errors.end_date}
        />
        <Field
          label="Debut semestre S2"
          icon={Clock3}
          value={formData.s2_start_date}
          onChange={handleChange('s2_start_date')}
          error={errors.s2_start_date}
        />
        <Field
          label="Date examen regional"
          icon={AlertTriangle}
          value={formData.exam_regional_date}
          onChange={handleChange('exam_regional_date')}
          error={errors.exam_regional_date}
        />
        <Field
          label="Debut stage"
          icon={CalendarDays}
          value={formData.stage_start_date}
          onChange={handleChange('stage_start_date')}
          error={errors.stage_start_date}
        />
        <Field
          label="Fin stage"
          icon={CalendarDays}
          value={formData.stage_end_date}
          onChange={handleChange('stage_end_date')}
          error={errors.stage_end_date}
        />
      </div>

      {errors.date_order ? <p className="text-[14px] font-medium text-[#d14343]">{errors.date_order}</p> : null}
      {errors.stage_period ? <p className="text-[14px] font-medium text-[#d14343]">{errors.stage_period}</p> : null}

      <button
        type="submit"
        disabled={saving}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-[16px] bg-gradient-to-r from-[#8b35ff] to-[#e21486] px-5 text-[14px] font-semibold text-white shadow-[0_18px_38px_rgba(139,53,255,0.24)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <Save className="h-4 w-4" />
        {saving ? 'Enregistrement...' : 'Enregistrer la configuration'}
      </button>
    </form>
  );
}

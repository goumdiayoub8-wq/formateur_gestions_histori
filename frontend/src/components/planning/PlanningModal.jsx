import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, CalendarDays, Clock3, GraduationCap, MapPinned, NotebookPen, Timer, Users } from 'lucide-react';
import { ChefButton, ChefModal } from '../chef/ChefUI';
import SelectField from './SelectField';
import TimePicker from './TimePicker';

const DAY_OPTIONS = [
  { value: '1', label: 'Lundi' },
  { value: '2', label: 'Mardi' },
  { value: '3', label: 'Mercredi' },
  { value: '4', label: 'Jeudi' },
  { value: '5', label: 'Vendredi' },
  { value: '6', label: 'Samedi' },
  { value: '7', label: 'Dimanche' },
];

const TASK_OPTIONS = [
  { value: 'Cours', label: 'Cours' },
  { value: 'TD', label: 'TD' },
  { value: 'TP', label: 'TP' },
  { value: 'Reunion', label: 'Reunion' },
  { value: 'Soutenance', label: 'Soutenance' },
];

const DURATION_OPTIONS = [
  { value: '60', label: '1h00' },
  { value: '90', label: '1h30' },
  { value: '120', label: '2h00' },
  { value: '150', label: '2h30' },
  { value: '180', label: '3h00' },
  { value: '300', label: '5h00' },
];

function normalizeDuration(entry) {
  if (entry?.duration_minutes) {
    return String(entry.duration_minutes);
  }

  if (entry?.start_time && entry?.end_time) {
    const start = new Date(`1970-01-01T${entry.start_time}`);
    const end = new Date(`1970-01-01T${entry.end_time}`);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      return String(Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000)));
    }
  }

  return '120';
}

function computeEndTime(startTime, durationMinutes) {
  if (!startTime || !durationMinutes) {
    return '';
  }

  const [hours, minutes] = startTime.split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return '';
  }

  const totalMinutes = hours * 60 + minutes + Number(durationMinutes);
  const normalizedHours = Math.floor(totalMinutes / 60) % 24;
  const normalizedMinutes = totalMinutes % 60;

  return `${String(normalizedHours).padStart(2, '0')}:${String(normalizedMinutes).padStart(2, '0')}`;
}

export default function PlanningModal({
  open,
  weekNumber,
  formateurs = [],
  options = { modules: [], groups: [], rooms: [] },
  initialEntry = null,
  saving = false,
  error = '',
  onClose,
  onTrainerChange,
  onSave,
}) {
  const [formState, setFormState] = useState({
    id: null,
    formateur_id: '',
    module_id: '',
    groupe_id: '',
    salle_id: '',
    day_of_week: '1',
    start_time: '08:00',
    duration_minutes: '120',
    task_title: 'Cours',
  });
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!open) {
      return;
    }

    setFormState({
      id: initialEntry?.id || null,
      formateur_id: initialEntry?.formateur_id ? String(initialEntry.formateur_id) : '',
      module_id: initialEntry?.module_id ? String(initialEntry.module_id) : '',
      groupe_id: initialEntry?.groupe_id ? String(initialEntry.groupe_id) : '',
      salle_id: initialEntry?.salle_id ? String(initialEntry.salle_id) : '',
      day_of_week: initialEntry?.day_of_week ? String(initialEntry.day_of_week) : '1',
      start_time: initialEntry?.start_time?.slice(0, 5) || '08:00',
      duration_minutes: normalizeDuration(initialEntry),
      task_title: initialEntry?.task_title || 'Cours',
    });
    setFieldErrors({});
  }, [initialEntry, open]);

  const filteredGroups = useMemo(() => {
    if (!formState.module_id) {
      return options.groups || [];
    }

    return (options.groups || []).filter(
      (group) => String(group.module_id) === String(formState.module_id),
    );
  }, [formState.module_id, options.groups]);

  const computedEndTime = computeEndTime(formState.start_time, formState.duration_minutes);

  const handleSubmit = () => {
    const nextErrors = {};
    if (!formState.formateur_id) nextErrors.formateur_id = 'Le formateur est requis.';
    if (!formState.module_id) nextErrors.module_id = 'Le module est requis.';
    if (!formState.day_of_week) nextErrors.day_of_week = 'Le jour est requis.';
    if (!formState.start_time) nextErrors.start_time = "L'heure de debut est requise.";
    if (!formState.duration_minutes) nextErrors.duration_minutes = 'La duree est requise.';
    if (!formState.task_title) nextErrors.task_title = 'La tache est requise.';

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onSave({
      id: formState.id,
      formateur_id: Number(formState.formateur_id),
      module_id: Number(formState.module_id),
      groupe_id: formState.groupe_id ? Number(formState.groupe_id) : null,
      salle_id: formState.salle_id ? Number(formState.salle_id) : null,
      day_of_week: Number(formState.day_of_week),
      start_time: formState.start_time,
      duration_minutes: Number(formState.duration_minutes),
      week_number: weekNumber,
      task_title: formState.task_title,
    });
  };

  return (
    <ChefModal
      open={open}
      onClose={onClose}
      title={formState.id ? 'Modifier planning' : 'Creer planning'}
      subtitle="Configurez un creneau detaille: formateur, module, groupe, jour, horaire, salle et type de tache."
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-[13px] text-[#6f8199]">
            Fin calculee automatiquement: <span className="font-semibold text-[#1f2a3d]">{computedEndTime || '--:--'}</span>
          </div>
          <div className="flex gap-3">
            <ChefButton variant="ghost" onClick={onClose}>Annuler</ChefButton>
            <ChefButton onClick={handleSubmit} disabled={saving}>
              {saving ? 'Enregistrement...' : formState.id ? 'Mettre a jour' : 'Creer'}
            </ChefButton>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {error ? (
          <div className="rounded-[18px] border border-[#ffd8d8] bg-[#fff5f5] px-4 py-3 text-sm font-medium text-[#d54c4c]">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <SelectField
            icon={GraduationCap}
            label="Formateur"
            tooltip="Choisir le formateur"
            value={formState.formateur_id}
            onChange={(value) => {
              setFormState((current) => ({
                ...current,
                formateur_id: value,
                module_id: '',
                groupe_id: '',
              }));
              if (value) {
                onTrainerChange(Number(value));
              }
            }}
            options={formateurs.map((item) => ({ value: String(item.id), label: item.nom }))}
            error={fieldErrors.formateur_id}
          />

          <SelectField
            icon={BookOpen}
            label="Module"
            tooltip="Choisir le module"
            value={formState.module_id}
            onChange={(value) => setFormState((current) => ({ ...current, module_id: value, groupe_id: '' }))}
            options={(options.modules || []).map((item) => ({ value: String(item.id), label: item.label }))}
            error={fieldErrors.module_id}
            disabled={!formState.formateur_id}
          />

          <SelectField
            icon={Users}
            label="Groupe"
            tooltip="Choisir le groupe"
            value={formState.groupe_id}
            onChange={(value) => setFormState((current) => ({ ...current, groupe_id: value }))}
            options={filteredGroups.map((item) => ({ value: String(item.id), label: item.label }))}
            placeholder="Sans groupe"
          />

          <SelectField
            icon={CalendarDays}
            label="Jour"
            tooltip="Choisir le jour"
            value={formState.day_of_week}
            onChange={(value) => setFormState((current) => ({ ...current, day_of_week: value }))}
            options={DAY_OPTIONS}
            error={fieldErrors.day_of_week}
          />

          <TimePicker
            icon={Clock3}
            label="Heure debut"
            tooltip="Heure de debut"
            value={formState.start_time}
            onChange={(value) => setFormState((current) => ({ ...current, start_time: value }))}
            error={fieldErrors.start_time}
          />

          <SelectField
            icon={Timer}
            label="Duree"
            tooltip="Duree du creneau"
            value={formState.duration_minutes}
            onChange={(value) => setFormState((current) => ({ ...current, duration_minutes: value }))}
            options={DURATION_OPTIONS}
            error={fieldErrors.duration_minutes}
          />

          <SelectField
            icon={MapPinned}
            label="Salle"
            tooltip="Choisir la salle"
            value={formState.salle_id}
            onChange={(value) => setFormState((current) => ({ ...current, salle_id: value }))}
            options={(options.rooms || []).map((item) => ({ value: String(item.id), label: item.label }))}
            placeholder="Sans salle"
          />

          <SelectField
            icon={NotebookPen}
            label="Tache"
            tooltip="Type de tache"
            value={formState.task_title}
            onChange={(value) => setFormState((current) => ({ ...current, task_title: value }))}
            options={TASK_OPTIONS}
            error={fieldErrors.task_title}
          />
        </div>
      </div>
    </ChefModal>
  );
}

import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

const DAY_LABELS = {
  1: 'Lundi',
  2: 'Mardi',
  3: 'Mercredi',
  4: 'Jeudi',
  5: 'Vendredi',
  6: 'Samedi',
  7: 'Dimanche',
};

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

let pdfDependenciesPromise = null;

function getPdfDependencies() {
  if (!pdfDependenciesPromise) {
    pdfDependenciesPromise = Promise.all([
      import('html2canvas'),
      import('jspdf'),
      import('../components/planning/PlanningPdfDocument'),
    ]).then(([html2canvasModule, jsPdfModule, documentModule]) => ({
      html2canvas: html2canvasModule.default,
      jsPDF: jsPdfModule.jsPDF,
      PlanningPdfDocument: documentModule.default,
    }));
  }

  return pdfDependenciesPromise;
}

function slugify(value) {
  return String(value || 'planning')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatHour(value) {
  return String(value || '').slice(0, 5) || '--:--';
}

function normalizeEntry(entry) {
  return {
    dayLabel: entry?.dayLabel || entry?.day_label || DAY_LABELS[Number(entry?.day_of_week)] || 'Jour',
    timeLabel:
      entry?.timeLabel ||
      entry?.time_range ||
      `${formatHour(entry?.start_time)} -> ${formatHour(entry?.end_time)}`,
    moduleLabel:
      entry?.moduleLabel ||
      entry?.module_nom ||
      entry?.module_name ||
      [entry?.module_code, entry?.module_nom || entry?.module_name].filter(Boolean).join(' - ') ||
      'Module non defini',
    moduleCode: entry?.moduleCode || entry?.module_code || '',
    groupLabel: entry?.groupLabel || entry?.groupe_code || entry?.group_code || 'Non defini',
    roomLabel: entry?.roomLabel || entry?.salle_code || entry?.room_code || 'Non definie',
    taskLabel: entry?.taskLabel || entry?.task_title || entry?.task_label || entry?.status_label || 'Cours',
  };
}

function computeWeeklyHours(trainer) {
  if (Number.isFinite(Number(trainer?.weeklyHours))) {
    return Number(trainer.weeklyHours);
  }

  return (Array.isArray(trainer?.entries) ? trainer.entries : []).reduce((sum, entry) => {
    if (Number.isFinite(Number(entry?.duration_hours))) {
      return sum + Number(entry.duration_hours);
    }

    if (Number.isFinite(Number(entry?.duration_minutes))) {
      return sum + Number(entry.duration_minutes) / 60;
    }

    return sum;
  }, 0);
}

async function waitForAssets(container) {
  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch (error) {
      void error;
    }
  }

  const images = Array.from(container.querySelectorAll('img'));
  await Promise.all(
    images.map(
      (image) =>
        new Promise((resolve) => {
          if (image.complete) {
            resolve();
            return;
          }

          image.onload = () => resolve();
          image.onerror = () => resolve();
        }),
    ),
  );

  await wait(80);
}

async function renderTrainerCanvas({ trainer, weekNumber, weekRange, academicYearLabel, generatedAtLabel, logoSrc }) {
  const { html2canvas, PlanningPdfDocument } = await getPdfDependencies();
  const host = document.createElement('div');
  host.style.position = 'fixed';
  host.style.left = '-20000px';
  host.style.top = '0';
  host.style.width = '1122px';
  host.style.pointerEvents = 'none';
  host.style.zIndex = '-1';
  document.body.appendChild(host);

  const root = createRoot(host);
  root.render(
    React.createElement(PlanningPdfDocument, {
      trainer,
      weekNumber,
      weekRange,
      academicYearLabel,
      generatedAtLabel,
      logoSrc,
    }),
  );

  await wait(60);
  await waitForAssets(host);

  const canvas = await html2canvas(host.firstElementChild || host, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
  });

  root.unmount();
  document.body.removeChild(host);

  return canvas;
}

function addCanvasPages(doc, canvas, forceNewPage = false) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 22;
  const marginTop = 18;
  const footerSpace = 24;
  const availableWidth = pageWidth - marginX * 2;
  const availableHeight = pageHeight - marginTop - footerSpace;
  const imageHeight = (canvas.height * availableWidth) / canvas.width;
  const imageData = canvas.toDataURL('image/png');

  if (forceNewPage) {
    doc.addPage();
  }

  let heightLeft = imageHeight;
  let yPosition = marginTop;
  doc.addImage(imageData, 'PNG', marginX, yPosition, availableWidth, imageHeight, undefined, 'FAST');
  heightLeft -= availableHeight;

  while (heightLeft > 0) {
    doc.addPage();
    yPosition = marginTop - (imageHeight - heightLeft);
    doc.addImage(imageData, 'PNG', marginX, yPosition, availableWidth, imageHeight, undefined, 'FAST');
    heightLeft -= availableHeight;
  }
}

function decoratePages(doc, exportDateLabel) {
  const totalPages = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let pageIndex = 1; pageIndex <= totalPages; pageIndex += 1) {
    doc.setPage(pageIndex);
    doc.setDrawColor(209, 218, 232);
    doc.line(22, pageHeight - 18, pageWidth - 22, pageHeight - 18);
    doc.setFontSize(9);
    doc.setTextColor(92, 108, 132);
    doc.text(`Export du ${exportDateLabel}`, 22, pageHeight - 7);
    doc.text(`Page ${pageIndex} / ${totalPages}`, pageWidth - 22, pageHeight - 7, { align: 'right' });
  }
}

function normalizeTrainer(trainer) {
  const rawEntries = Array.isArray(trainer?.entries) ? trainer.entries : [];
  const entries = rawEntries.map(normalizeEntry);

  return {
    id: trainer?.id || null,
    name: trainer?.name || trainer?.nom || 'Formateur',
    specialite: trainer?.specialite || '',
    weeklyHours: computeWeeklyHours({ ...trainer, entries: rawEntries }),
    entries,
  };
}

export default function useExportPDF() {
  const [exporting, setExporting] = useState(false);

  const exportSinglePlanning = async ({
    trainer,
    weekNumber,
    weekRange,
    academicYearLabel,
    filename,
  }) => {
    setExporting(true);

    try {
      const normalizedTrainer = normalizeTrainer(trainer);
      const exportDateLabel = new Date().toLocaleDateString('fr-FR');
      const generatedAtLabel = new Date().toLocaleString('fr-FR', {
        dateStyle: 'short',
        timeStyle: 'short',
      });
      const { jsPDF } = await getPdfDependencies();
      const logoSrc = `${window.location.origin}/logo192.png`;
      const canvas = await renderTrainerCanvas({
        trainer: normalizedTrainer,
        weekNumber,
        weekRange,
        academicYearLabel,
        generatedAtLabel,
        logoSrc,
      });

      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      addCanvasPages(doc, canvas, false);
      decoratePages(doc, exportDateLabel);
      doc.save(filename || `planning-${slugify(normalizedTrainer.name)}-semaine-${weekNumber || 'courante'}.pdf`);
    } finally {
      setExporting(false);
    }
  };

  const exportAllPlannings = async ({
    trainers,
    weekNumber,
    weekRange,
    academicYearLabel,
    filename,
  }) => {
    setExporting(true);

    try {
      const exportDateLabel = new Date().toLocaleDateString('fr-FR');
      const generatedAtLabel = new Date().toLocaleString('fr-FR', {
        dateStyle: 'short',
        timeStyle: 'short',
      });
      const { jsPDF } = await getPdfDependencies();
      const logoSrc = `${window.location.origin}/logo192.png`;
      const normalizedTrainers = (Array.isArray(trainers) ? trainers : []).map(normalizeTrainer);
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

      for (let index = 0; index < normalizedTrainers.length; index += 1) {
        const trainer = normalizedTrainers[index];
        const canvas = await renderTrainerCanvas({
          trainer,
          weekNumber,
          weekRange,
          academicYearLabel,
          generatedAtLabel,
          logoSrc,
        });
        addCanvasPages(doc, canvas, index > 0);
      }

      decoratePages(doc, exportDateLabel);
      doc.save(filename || `planning-tous-formateurs-semaine-${weekNumber || 'courante'}.pdf`);
    } finally {
      setExporting(false);
    }
  };

  return {
    exporting,
    exportSinglePlanning,
    exportAllPlannings,
  };
}

<?php

require_once __DIR__ . '/../repositories/AffectationRepository.php';
require_once __DIR__ . '/../repositories/PlanningRepository.php';
require_once __DIR__ . '/../repositories/FormateurRepository.php';
require_once __DIR__ . '/../repositories/ModuleRepository.php';
require_once __DIR__ . '/../core/HttpException.php';
require_once __DIR__ . '/../core/helpers.php';

class ValidationService
{
    private const MAX_WEEKLY_HOURS = 44;
    private const GRID_START_TIME = '08:00:00';
    private const GRID_END_TIME = '18:00:00';
    private const SEMESTER_BALANCE_TOLERANCE_RATIO = 0.20;
    private const SEMESTER_BALANCE_MIN_TOLERANCE = 30.0;

    private AffectationRepository $affectations;
    private PlanningRepository $planning;
    private FormateurRepository $formateurs;
    private ModuleRepository $modules;

    public function __construct(PDO $db)
    {
        $this->affectations = new AffectationRepository($db);
        $this->planning = new PlanningRepository($db);
        $this->formateurs = new FormateurRepository($db);
        $this->modules = new ModuleRepository($db);
    }

    public function validateAssignment(int $formateurId, int $moduleId, int $annee, ?int $ignoreAssignmentId = null): void
    {
        $formateur = $this->formateurs->find($formateurId);
        if (!$formateur) {
            throw new NotFoundException('Formateur introuvable.');
        }

        $module = $this->modules->find($moduleId);
        if (!$module) {
            throw new NotFoundException('Module introuvable.');
        }

        if ($this->affectations->findByFormateurAndModule($formateurId, $moduleId, $annee)) {
            throw new ConflictException('Ce module est deja affecte a ce formateur.');
        }

        $annualHours = $this->affectations->getTrainerAnnualHours($formateurId, $annee, $ignoreAssignmentId);
        $nextAnnualHours = $annualHours + floatval($module['volume_horaire']);

        if ($nextAnnualHours > floatval($formateur['max_heures'])) {
            throw new ValidationException('Le formateur depasserait sa limite annuelle de ' . intval($formateur['max_heures']) . ' heures.');
        }

        $efmCount = $this->affectations->getTrainerEfmCount($formateurId, $annee, $ignoreAssignmentId);
        if (parseBoolean($module['has_efm'] ?? false) && $efmCount >= 1) {
            throw new ValidationException('Un formateur ne peut pas avoir plus d un module avec EFM.');
        }

        $semesterHours = $this->affectations->getTrainerSemesterHours($formateurId, $annee, $ignoreAssignmentId);
        $semesterHours[$module['semestre']] += floatval($module['volume_horaire']);

        $difference = abs($semesterHours['S1'] - $semesterHours['S2']);
        $total = $semesterHours['S1'] + $semesterHours['S2'];
        $allowedDifference = max(self::SEMESTER_BALANCE_MIN_TOLERANCE, $total * self::SEMESTER_BALANCE_TOLERANCE_RATIO);

        if ($total > 0 && $difference > $allowedDifference) {
            throw new ValidationException('La repartition des heures entre S1 et S2 deviendrait desequilibree.');
        }
    }

    public function validatePlanning(int $formateurId, int $moduleId, int $semaine, float $heures, ?int $ignorePlanningId = null): void
    {
        if ($semaine < SYSTEM_WEEK_MIN || $semaine > SYSTEM_WEEK_MAX) {
            throw new ValidationException(sprintf('La semaine doit etre comprise entre %d et %d.', SYSTEM_WEEK_MIN, SYSTEM_WEEK_MAX));
        }

        if ($heures <= 0) {
            throw new ValidationException('Les heures planifiees doivent etre strictement positives.');
        }

        if (!$this->affectations->isModuleAssignedToTrainer($formateurId, $moduleId)) {
            throw new ValidationException('Le module doit d abord etre affecte a ce formateur.');
        }

        if ($this->planning->findByTrainerModuleWeek($formateurId, $moduleId, $semaine, $ignorePlanningId)) {
            throw new ConflictException('Un planning existe deja pour ce formateur, ce module et cette semaine.');
        }

        $weekHours = $this->planning->getTrainerWeekHours($formateurId, $semaine, $ignorePlanningId);
        $nextWeekHours = $weekHours + $heures;

        if ($nextWeekHours > self::MAX_WEEKLY_HOURS) {
            throw new ValidationException('Le formateur depasserait la limite hebdomadaire de 44 heures.');
        }
    }

    public function validatePlanningSession(
        int $formateurId,
        int $moduleId,
        int $weekNumber,
        int $dayOfWeek,
        string $startTime,
        string $endTime,
        float $durationHours,
        ?int $ignoreSessionId = null
    ): void {
        if ($weekNumber < SYSTEM_WEEK_MIN || $weekNumber > SYSTEM_WEEK_MAX) {
            throw new ValidationException(sprintf('La semaine doit etre comprise entre %d et %d.', SYSTEM_WEEK_MIN, SYSTEM_WEEK_MAX));
        }

        if ($dayOfWeek < 1 || $dayOfWeek > 7) {
            throw new ValidationException('Le jour de la semaine est invalide.');
        }

        if ($durationHours <= 0) {
            throw new ValidationException('La duree doit etre strictement positive.');
        }

        if (strtotime('1970-01-01 ' . $endTime) <= strtotime('1970-01-01 ' . $startTime)) {
            throw new ValidationException('L heure de fin doit etre posterieure a l heure de debut.');
        }

        if (
            strtotime('1970-01-01 ' . $startTime) < strtotime('1970-01-01 ' . self::GRID_START_TIME)
            || strtotime('1970-01-01 ' . $endTime) > strtotime('1970-01-01 ' . self::GRID_END_TIME)
        ) {
            throw new ValidationException('Les creneaux doivent rester entre 08:00 et 18:00.');
        }

        if (!$this->affectations->isModuleAssignedToTrainer($formateurId, $moduleId)) {
            throw new ValidationException('Le module doit d abord etre affecte a ce formateur.');
        }

        if ($this->planning->hasSessionOverlap($formateurId, $weekNumber, $dayOfWeek, $startTime, $endTime, $ignoreSessionId)) {
            throw new ConflictException('Conflit detecte: ce formateur a deja un creneau sur cette plage horaire.');
        }

        $weekHours = $this->planning->getTrainerScheduledHours($formateurId, $weekNumber, $ignoreSessionId);
        $nextWeekHours = $weekHours + $durationHours;

        if ($nextWeekHours > self::MAX_WEEKLY_HOURS) {
            throw new ValidationException('Le formateur depasserait la limite hebdomadaire de 44 heures.');
        }
    }
}

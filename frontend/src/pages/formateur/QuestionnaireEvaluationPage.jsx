import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  ClipboardCheck,
  MessageSquareText,
  Send,
  ShieldAlert,
  Star,
} from 'lucide-react';
import QuestionnaireService from '../../services/questionnaireService';
import Spinner from '../../components/ui/Spinner';
import {
  FormateurEmptyBlock,
  FormateurPanel,
  FormateurSectionHeader,
  FormateurStatCard,
} from '../../components/formateur/FormateurUI';
import { cn } from '../../lib/cn';

function getScoreMeta(percentage) {
  const value = Number(percentage);

  if (!Number.isFinite(value)) {
    return {
      tone: 'slate',
      message: 'Non evalue',
      progressClassName: 'bg-[#9aa9bd]',
      badgeClassName: 'bg-[#eef3f9] text-[#5b708d]',
    };
  }

  if (value >= 75) {
    return {
      tone: 'green',
      message: 'Excellent',
      progressClassName: 'bg-[#16c55b]',
      badgeClassName: 'bg-[#eafaf0] text-[#129347]',
    };
  }

  if (value >= 50) {
    return {
      tone: 'orange',
      message: 'Good',
      progressClassName: 'bg-[#ff9b1f]',
      badgeClassName: 'bg-[#fff3e2] text-[#d97a00]',
    };
  }

  return {
    tone: 'red',
    message: 'Needs improvement',
    progressClassName: 'bg-[#ef4444]',
    badgeClassName: 'bg-[#fff0f0] text-[#cd3e3e]',
  };
}

function QuestionInput({ question, value, disabled, error, onChange }) {
  if (question.type === 'rating') {
    return (
      <div className="flex flex-wrap gap-3">
        {[1, 2, 3, 4, 5].map((rating) => {
          const active = Number(value) === rating;

          return (
            <button
              key={rating}
              type="button"
              disabled={disabled}
              onClick={() => onChange(rating)}
              className={cn(
                'inline-flex min-w-[64px] items-center justify-center gap-2 rounded-[16px] border px-4 py-3 text-sm font-semibold transition',
                active
                  ? 'border-[#ffb703] bg-[#fff5d8] text-[#a75b00]'
                  : 'border-[#dce6f2] bg-white text-[#45607c] hover:border-[#c5d4e6] hover:bg-[#f8fbff]',
                disabled ? 'cursor-not-allowed opacity-70' : '',
              )}
            >
              <Star className={cn('h-4 w-4', active ? 'fill-current' : '')} />
              {rating}
            </button>
          );
        })}
      </div>
    );
  }

  if (question.type === 'yes/no') {
    return (
      <div className="flex flex-wrap gap-3">
        {[
          { label: 'Oui', value: 'yes' },
          { label: 'Non', value: 'no' },
        ].map((option) => {
          const active = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={cn(
                'rounded-[16px] border px-5 py-3 text-sm font-semibold transition',
                active
                  ? option.value === 'yes'
                    ? 'border-[#c9f0d8] bg-[#eefcf3] text-[#15954a]'
                    : 'border-[#ffd6d6] bg-[#fff3f3] text-[#d34b4b]'
                  : 'border-[#dce6f2] bg-white text-[#45607c] hover:border-[#c5d4e6] hover:bg-[#f8fbff]',
                disabled ? 'cursor-not-allowed opacity-70' : '',
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <textarea
      rows={4}
      disabled={disabled}
      value={value || ''}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Ajouter un commentaire si necessaire..."
      className="w-full rounded-[18px] border border-[#dce6f2] bg-[#fbfdff] px-4 py-3 text-[15px] text-[#1f2a3d] outline-none transition placeholder:text-[#93a4ba] focus:border-[#8aa6ff]"
    />
  );
}

export default function QuestionnaireEvaluationPage() {
  const [questionnaireData, setQuestionnaireData] = useState(null);
  const [score, setScore] = useState(null);
  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);

  const loadQuestionnaire = async () => {
    try {
      setLoading(true);
      setNotice(null);

      const [questionnaireResponse, scoreResponse] = await Promise.all([
        QuestionnaireService.getEvaluationForm(),
        QuestionnaireService.getEvaluationScore(),
      ]);

      setQuestionnaireData(questionnaireResponse || null);
      setScore(scoreResponse || null);
      setAnswers(questionnaireResponse?.existing_answers || {});
      setErrors({});
    } catch (error) {
      setQuestionnaireData(null);
      setScore(null);
      setNotice({
        tone: 'danger',
        message: error?.response?.data?.message || error?.message || 'Impossible de charger l evaluation.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestionnaire();
  }, []);

  const models = questionnaireData?.models || questionnaireData?.questions || [];
  const scoreMeta = getScoreMeta(score?.percentage);
  const canSubmit = Boolean(questionnaireData?.can_submit);

  const metrics = useMemo(() => {
    return {
      modelCount: models.length,
      weightedModels: models.filter((model) => Number(model.weight) > 0).length,
      percentage: Number.isFinite(Number(score?.percentage)) ? `${Math.round(Number(score.percentage))}%` : 'Non evalue',
    };
  }, [models, score]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers((current) => ({
      ...current,
      [questionId]: value,
    }));

    setErrors((current) => {
      const next = { ...current };
      delete next[questionId];
      return next;
    });
  };

  const validateForm = () => {
    const nextErrors = {};

    models.forEach((model) => {
      const value = answers[model.id];
      const empty = value === undefined || value === null || value === '';

      if (empty) {
        nextErrors[model.id] = 'Cette note est obligatoire.';
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setNotice({
        tone: 'warning',
        message: 'Merci de completer toutes les notes obligatoires avant l envoi.',
      });
      return;
    }

    try {
      setSubmitting(true);
      setNotice(null);

      const payload = {
        answers: models
          .map((model) => ({
            question_id: model.id,
            value: answers[model.id] ?? '',
          }))
          .filter((answer) => answer.value !== ''),
      };

      await QuestionnaireService.submitEvaluationForm(payload);
      await loadQuestionnaire();
      setNotice({
        tone: 'success',
        message: 'Votre evaluation a ete soumise avec succes.',
      });
    } catch (error) {
      setNotice({
        tone: 'danger',
        message: error?.response?.data?.message || error?.message || 'Soumission impossible.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <Spinner className="h-11 w-11 border-[#dbe3ef] border-t-[#1f57ff]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="rounded-[28px] bg-gradient-to-r from-[#2155f5] via-[#2d74ff] to-[#33b7ff] px-6 py-8 text-white shadow-[0_20px_50px_rgba(37,97,255,0.26)]">
        <h1 className="text-[24px] font-bold tracking-tight">Evaluation des modeles</h1>
        <p className="mt-3 max-w-3xl text-[15px] text-white/88">
          Evaluez chaque modele avec une note de 1 a 5, puis laissez le systeme calculer automatiquement votre score global.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <span className="rounded-full bg-white/14 px-3 py-1.5 font-semibold">
            {questionnaireData?.questionnaire?.title || 'Evaluation active'}
          </span>
          <span className="rounded-full bg-white/14 px-3 py-1.5 font-semibold">
            {metrics.modelCount} modele(s)
          </span>
          <span className="rounded-full bg-white/14 px-3 py-1.5 font-semibold">
            Score {metrics.percentage}
          </span>
        </div>
      </div>

      {notice ? (
        <FormateurPanel
          className={cn(
            'px-6 py-5 text-[15px] font-medium',
            notice.tone === 'success'
              ? 'border-[#cfead8] bg-[#f0fbf4] text-[#187a42]'
              : notice.tone === 'warning'
                ? 'border-[#ffe2b5] bg-[#fff8ec] text-[#b56a0a]'
                : 'border-[#ffd9d9] bg-[#fff5f5] text-[#d14343]',
          )}
        >
          {notice.message}
        </FormateurPanel>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <FormateurStatCard
          icon={ClipboardCheck}
          iconClassName="bg-[#eef3ff] text-[#315cf0]"
          label="Modeles"
          value={metrics.modelCount}
          helper="Modeles charges pour cette evaluation"
        />
        <FormateurStatCard
          icon={ShieldAlert}
          iconClassName="bg-[#fff5e8] text-[#e67f1a]"
          label="Modeles notes"
          value={metrics.weightedModels}
          helper="Modeles pris en compte dans le calcul"
        />
        <FormateurStatCard
          icon={CheckCircle2}
          iconClassName="bg-[#edf9f1] text-[#12a44a]"
          label="Mon score"
          value={metrics.percentage}
          helper={scoreMeta.message}
          progress={Number.isFinite(Number(score?.percentage)) ? Number(score.percentage) : 0}
          progressClassName={scoreMeta.progressClassName}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <FormateurPanel className="p-6">
          <FormateurSectionHeader
            title="Modeles"
            description="Tous les modeles doivent recevoir une note avant la soumission."
          />

          {models.length === 0 ? (
            <div className="mt-6">
              <FormateurEmptyBlock
                title="Aucun modele disponible"
                description="L evaluation n est pas encore configuree pour votre espace."
              />
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {models.map((model, index) => (
                <div key={model.id} className="rounded-[24px] border border-[#e1e9f3] bg-[#fbfdff] px-5 py-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[#8c9bb0]">
                        Modele {index + 1}
                      </p>
                      <h3 className="mt-2 text-[17px] font-bold leading-7 text-[#1f2a3d]">
                        {model.name || model.question_text}
                      </h3>
                      {model.description ? (
                        <p className="mt-2 max-w-3xl text-[14px] leading-6 text-[#6f8199]">{model.description}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#eef4ff] px-3 py-1 text-[12px] font-bold text-[#3163ef]">
                        Rating
                      </span>
                      <span className="rounded-full bg-[#f4f7fb] px-3 py-1 text-[12px] font-bold text-[#62748f]">
                        Poids {Number(model.weight)}
                      </span>
                      <span className="rounded-full bg-[#edf9f1] px-3 py-1 text-[12px] font-bold text-[#129347]">
                        Global {Number.isFinite(Number(model.global_score?.percentage)) ? `${Math.round(Number(model.global_score.percentage))}%` : '--'}
                      </span>
                    </div>
                  </div>

                  {Array.isArray(model.skills) && model.skills.length ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {model.skills.map((skill) => (
                        <span key={`${model.id}-${skill}`} className="rounded-full bg-[#f5f8fd] px-3 py-1 text-[12px] font-semibold text-[#5a6f8e]">
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-5">
                    <QuestionInput
                      question={model}
                      value={answers[model.id] ?? ''}
                      disabled={!canSubmit || submitting}
                      error={errors[model.id]}
                      onChange={(value) => handleAnswerChange(model.id, value)}
                    />
                    {errors[model.id] ? (
                      <p className="mt-3 text-sm font-semibold text-[#d14343]">{errors[model.id]}</p>
                    ) : null}
                  </div>
                </div>
              ))}

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] bg-[#f5f8fd] px-5 py-5">
                <div>
                  <p className="text-[17px] font-bold text-[#1f2a3d]">
                    {canSubmit ? 'Pret a envoyer ?' : 'Evaluation deja soumise'}
                  </p>
                  <p className="mt-2 text-[15px] text-[#6f8199]">
                    {canSubmit
                      ? 'Une seule soumission est autorisee pour cette evaluation.'
                      : 'Votre notation a deja ete enregistree. Le score reste visible dans votre dashboard.'}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!canSubmit || submitting || models.length === 0}
                  onClick={handleSubmit}
                  className="inline-flex items-center gap-2 rounded-[18px] bg-[linear-gradient(90deg,_#2155f5_0%,_#33b7ff_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(33,85,245,0.24)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  {submitting ? 'Envoi en cours...' : 'Soumettre l evaluation'}
                </button>
              </div>
            </div>
          )}
        </FormateurPanel>

        <FormateurPanel className="p-6">
          <FormateurSectionHeader
            title="Resultat global"
            description="Votre score est calcule automatiquement a partir des notes attribuees aux modeles."
          />

          <div className="mt-6 rounded-[24px] bg-[#f8fbff] px-5 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[14px] font-semibold uppercase tracking-[0.14em] text-[#8b9bb1]">
                  Score global
                </p>
                <p className="mt-3 text-[40px] font-bold tracking-tight text-[#1f2a3d]">
                  {Number.isFinite(Number(score?.percentage)) ? `${Math.round(Number(score.percentage))}%` : '--'}
                </p>
              </div>
              <span className={cn('rounded-full px-3 py-1.5 text-[12px] font-bold', scoreMeta.badgeClassName)}>
                {scoreMeta.message}
              </span>
            </div>

            <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#e7edf6]">
              <div
                className={cn('h-full rounded-full transition-all duration-500', scoreMeta.progressClassName)}
                style={{
                  width: `${Math.max(0, Math.min(100, Number(score?.percentage || 0)))}%`,
                }}
              />
            </div>

            <div className="mt-4 flex items-center justify-between text-[13px] text-[#7f90a8]">
              <span>0%</span>
              <span>100%</span>
            </div>

            <div className="mt-5 space-y-3 text-[15px] text-[#51627c]">
              <p>
                Total obtenu:{' '}
                <span className="font-semibold text-[#1f2a3d]">
                  {Number.isFinite(Number(score?.total_score)) ? Number(score.total_score).toFixed(2) : '--'}
                </span>
              </p>
              <p>
                Score maximal:{' '}
                <span className="font-semibold text-[#1f2a3d]">
                  {Number.isFinite(Number(score?.max_score)) ? Number(score.max_score).toFixed(2) : '--'}
                </span>
              </p>
              <p>
                Statut:{' '}
                <span className="font-semibold text-[#1f2a3d]">{scoreMeta.message}</span>
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-[24px] border border-dashed border-[#d6e3f1] bg-[#fbfdff] px-5 py-5">
            <div className="flex items-start gap-3">
              <MessageSquareText className="mt-0.5 h-5 w-5 text-[#315cf0]" />
              <div>
                <p className="text-[16px] font-bold text-[#1f2a3d]">Visibilite chef de pole</p>
                <p className="mt-2 text-[15px] leading-7 text-[#70819a]">
                  Le score global et les scores moyens par modele sont automatiquement repris dans le suivi cote chef.
                </p>
              </div>
            </div>
          </div>

          <Link
            to="/formateur"
            className="mt-5 inline-flex items-center rounded-[16px] border border-[#dbe4ef] px-4 py-3 text-sm font-semibold text-[#36506d] transition hover:bg-[#f8fbff]"
          >
            Retour au dashboard
          </Link>
        </FormateurPanel>
      </div>
    </div>
  );
}

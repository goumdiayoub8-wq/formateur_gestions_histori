import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, CircleCheckBig, LockKeyhole, Sparkles } from 'lucide-react';
import Spinner from '../../components/ui/Spinner';
import { cn } from '../../lib/cn';
import QuestionCard from './questionnaire/QuestionCard';
import QuestionnaireNavigation from './questionnaire/QuestionnaireNavigation';
import QuestionnaireProgressBar from './questionnaire/QuestionnaireProgressBar';
import { getScoreMeta, useQuestionnaire } from './questionnaire/useQuestionnaire';

function QuestionnaireBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#60a5fa]/25 blur-3xl" />
      <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-[#22d3ee]/20 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-[#f8fafc] blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.82),rgba(248,250,252,0.32)_42%,rgba(226,232,240,0.18)_100%)]" />
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="rounded-[32px] border border-white/70 bg-white/75 px-10 py-8 text-center shadow-[0_24px_80px_rgba(15,23,42,0.16)] backdrop-blur-2xl">
        <Spinner className="mx-auto h-10 w-10 border-slate-300 border-t-[#2563eb]" />
        <p className="mt-4 text-sm font-medium text-slate-600">Chargement du questionnaire...</p>
      </div>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="w-full max-w-xl rounded-[34px] border border-white/60 bg-white/78 p-8 shadow-[0_34px_120px_rgba(15,23,42,0.22)] backdrop-blur-2xl"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-950 text-white shadow-[0_16px_36px_rgba(15,23,42,0.22)]">
        <LockKeyhole className="h-8 w-8" />
      </div>
      <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-950">Questionnaire introuvable</h1>
      <p className="mt-3 text-[15px] leading-7 text-slate-600">
        {message || 'Le lien du questionnaire est invalide, expire ou ne vous est pas accessible.'}
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link
          to="/formateur/modules"
          className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Retour a mes modules
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          to="/formateur"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au tableau de bord
        </Link>
      </div>
    </motion.section>
  );
}

function IntroCard({ questionnaire, totalQuestions, summary, onStart }) {
  return (
    <motion.section
      layoutId="questionnaire-shell"
      initial={{ opacity: 0, scale: 0.9, y: 28 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-xl rounded-[36px] border border-white/60 bg-white/78 p-6 shadow-[0_34px_120px_rgba(15,23,42,0.22)] backdrop-blur-2xl sm:p-8"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-4 py-2 text-sm font-semibold text-[#1d4ed8]">
          <Sparkles className="h-4 w-4" />
          Evaluation module
        </div>
        {questionnaire?.module_code ? (
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
            {questionnaire.module_code}
          </span>
        ) : null}
      </div>

      <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
        {questionnaire?.module_name || questionnaire?.title || 'Questionnaire de formation'}
      </h1>
      <p className="mt-4 text-[15px] leading-7 text-slate-600">
        Repondez a chaque question une par une. Vos choix sont enregistres pour ce module uniquement.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-[24px] border border-white/70 bg-white/76 px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Questions</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{totalQuestions}</p>
        </div>
        <div className="rounded-[24px] border border-white/70 bg-white/76 px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Obligatoires</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{summary.requiredQuestions}</p>
        </div>
        <div className="rounded-[24px] border border-white/70 bg-white/76 px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Deja remplies</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{summary.answeredQuestions}</p>
        </div>
      </div>

      <motion.button
        type="button"
        whileHover={{ y: -2, scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={onStart}
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#2563eb,#06b6d4)] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(37,99,235,0.28)]"
      >
        Commencer le questionnaire
        <ArrowRight className="h-4 w-4" />
      </motion.button>
    </motion.section>
  );
}

function CompletionPanel({ score, title, description }) {
  const scoreMeta = getScoreMeta(score?.percentage);

  return (
    <motion.section
      key="completion"
      layoutId="questionnaire-shell"
      initial={{ opacity: 0, scale: 0.94, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 1.02, y: -12 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-3xl rounded-[36px] border border-white/60 bg-white/78 p-6 shadow-[0_34px_120px_rgba(15,23,42,0.24)] backdrop-blur-2xl sm:p-8"
    >
      <div className="mx-auto flex max-w-xl flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.38, delay: 0.12 }}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-[linear-gradient(135deg,#10b981,#06b6d4)] text-white shadow-[0_18px_42px_rgba(16,185,129,0.28)]"
        >
          <CircleCheckBig className="h-10 w-10" />
        </motion.div>

        <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-lg text-[15px] leading-7 text-slate-600">{description}</p>

        <div className="mt-8 grid w-full gap-4 sm:grid-cols-3">
          <div className="rounded-[24px] border border-white/70 bg-white/74 px-5 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Statut</p>
            <p className={cn('mt-3 inline-flex rounded-full px-3 py-1 text-sm font-semibold', scoreMeta.badgeClassName)}>
              {scoreMeta.label}
            </p>
          </div>
          <div className="rounded-[24px] border border-white/70 bg-white/74 px-5 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Score</p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
              {Number.isFinite(Number(score?.percentage)) ? `${Math.round(Number(score.percentage))}%` : '--'}
            </p>
          </div>
          <div className="rounded-[24px] border border-white/70 bg-white/74 px-5 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Total</p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
              {Number.isFinite(Number(score?.total_score)) ? Number(score.total_score).toFixed(1) : '--'}
            </p>
          </div>
        </div>

        <div className="mt-8 h-3 w-full overflow-hidden rounded-full bg-slate-200/80">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(0, Math.min(100, Number(score?.percentage || 0)))}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={cn('h-full rounded-full bg-gradient-to-r', scoreMeta.progressClassName)}
          />
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/formateur/modules"
            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Retour a mes modules
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/formateur"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    </motion.section>
  );
}

export default function QuestionnaireEvaluationPage() {
  const { token = '' } = useParams();
  const {
    canSubmit,
    currentAnswerValue,
    currentQuestion,
    currentQuestionIndex,
    handleAnswerChange,
    handleBack,
    handleNext,
    handleStart,
    handleSubmit,
    loading,
    notice,
    questionnaireData,
    score,
    started,
    submitSuccess,
    submitting,
    summary,
    totalQuestions,
    isCurrentStepValid,
  } = useQuestionnaire(token);

  const questionnaire = questionnaireData?.questionnaire || null;

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,#eff6ff,#f8fafc_42%,#ecfeff)]">
        <QuestionnaireBackdrop />
        <LoadingState />
      </div>
    );
  }

  if (!questionnaireData || totalQuestions === 0) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#eff6ff,#f8fafc_42%,#ecfeff)] px-6 py-10">
        <QuestionnaireBackdrop />
        <ErrorState message={notice} />
      </div>
    );
  }

  if (!canSubmit || submitSuccess) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#eff6ff,#f8fafc_42%,#ecfeff)] px-6 py-10">
        <QuestionnaireBackdrop />
        <CompletionPanel
          score={score}
          title={submitSuccess ? 'Merci, votre questionnaire est envoye' : 'Questionnaire deja soumis'}
          description={
            submitSuccess
              ? 'Votre evaluation a bien ete enregistree pour ce module. Vous pouvez revenir a vos modules a tout moment.'
              : 'Une reponse existe deja pour ce module. Vous pouvez consulter le score recalcule ci-dessous.'
          }
        />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,#eff6ff,#f8fafc_42%,#ecfeff)] px-6 py-8 sm:py-10">
      <QuestionnaireBackdrop />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center">
        <LayoutGroup>
          <AnimatePresence mode="wait">
            {!started ? (
              <IntroCard
                key="intro"
                questionnaire={questionnaire}
                totalQuestions={totalQuestions}
                summary={summary}
                onStart={handleStart}
              />
            ) : (
              <motion.section
                key="questionnaire"
                layoutId="questionnaire-shell"
                initial={{ opacity: 0, scale: 0.92, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -20 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="w-full rounded-[36px] border border-white/60 bg-white/74 p-5 shadow-[0_34px_120px_rgba(15,23,42,0.22)] backdrop-blur-2xl sm:p-7 lg:p-9"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-2xl">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-4 py-2 text-sm font-semibold text-[#1d4ed8]">
                      <Sparkles className="h-4 w-4" />
                      Parcours guide
                    </div>
                    <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                      {questionnaire?.module_name || questionnaire?.title || 'Questionnaire de formation'}
                    </h1>
                    <p className="mt-3 text-[15px] leading-7 text-slate-600">
                      Repondez a chaque question avant de passer a la suivante. Le questionnaire reste propre a ce module.
                    </p>
                  </div>

                  <div className="rounded-[24px] border border-white/70 bg-white/80 px-5 py-4 text-sm text-slate-600">
                    {questionnaire?.module_code ? (
                      <p className="font-semibold text-slate-900">{questionnaire.module_code}</p>
                    ) : null}
                    <p className="mt-1">
                      Etape {currentQuestionIndex + 1} sur {totalQuestions}
                    </p>
                    <p className="mt-1">
                      {summary.answeredQuestions} reponse{summary.answeredQuestions > 1 ? 's' : ''} renseignee
                      {summary.answeredQuestions > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <QuestionnaireProgressBar
                  currentQuestionIndex={currentQuestionIndex}
                  totalQuestions={totalQuestions}
                />

                <QuestionCard
                  currentQuestion={currentQuestion}
                  currentQuestionIndex={currentQuestionIndex}
                  totalQuestions={totalQuestions}
                  selectedValue={currentAnswerValue}
                  disabled={submitting}
                  notice={notice}
                  onChange={handleAnswerChange}
                />

                <QuestionnaireNavigation
                  currentQuestionIndex={currentQuestionIndex}
                  totalQuestions={totalQuestions}
                  isCurrentStepValid={isCurrentStepValid}
                  submitting={submitting}
                  onBack={handleBack}
                  onNext={handleNext}
                  onSubmit={handleSubmit}
                />
              </motion.section>
            )}
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  );
}

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Send } from 'lucide-react';
import Spinner from '../../../components/ui/Spinner';

export default function QuestionnaireNavigation({
  currentQuestionIndex,
  totalQuestions,
  isCurrentStepValid,
  submitting,
  onBack,
  onNext,
  onSubmit,
}) {
  const isLastQuestion = currentQuestionIndex + 1 === totalQuestions;

  return (
    <div className="mt-6 flex flex-col gap-4 border-t border-slate-200/80 pt-6 sm:flex-row sm:items-center sm:justify-between">
      <button
        type="button"
        onClick={onBack}
        disabled={currentQuestionIndex === 0 || submitting}
        className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-55"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </button>

      <motion.button
        type="button"
        onClick={isLastQuestion ? onSubmit : onNext}
        whileHover={submitting ? undefined : { y: -2, scale: 1.01 }}
        whileTap={submitting ? undefined : { scale: 0.99 }}
        disabled={!isCurrentStepValid || submitting}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#2563eb,#06b6d4)] px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(37,99,235,0.28)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : null}
        {isLastQuestion ? (
          <>
            <Send className="h-4 w-4" />
            {submitting ? 'Envoi...' : 'Envoyer'}
          </>
        ) : (
          <>
            Suivant
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </motion.button>
    </div>
  );
}

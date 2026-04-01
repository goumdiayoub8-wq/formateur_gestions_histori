import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '../../../lib/cn';
import { getQuestionDescription, getQuestionTitle } from './useQuestionnaire';

const ratingOptions = [
  {
    value: 1,
    label: 'Insuffisant',
    description: 'Les bases doivent etre reprises.',
  },
  {
    value: 2,
    label: 'Fragile',
    description: 'Des acquis existent, mais restent inegaux.',
  },
  {
    value: 3,
    label: 'Correct',
    description: 'Le niveau attendu est atteint de facon globale.',
  },
  {
    value: 4,
    label: 'Solide',
    description: 'La maitrise est claire et reguliere.',
  },
  {
    value: 5,
    label: 'Excellent',
    description: 'Tres bonne maitrise avec une execution rassurante.',
  },
];

function QuestionChoices({ question, selectedValue, disabled, onChange }) {
  if (question?.type === 'text') {
    return (
      <motion.textarea
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        rows={5}
        disabled={disabled}
        value={selectedValue || ''}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Partagez votre reponse ici..."
        className="min-h-[144px] w-full rounded-[28px] border border-white/70 bg-white/70 px-5 py-4 text-[15px] text-slate-800 outline-none backdrop-blur-xl transition focus:border-[#3b82f6] focus:bg-white disabled:cursor-not-allowed disabled:opacity-70"
      />
    );
  }

  const options =
    question?.type === 'yes/no'
      ? [
          { value: 'yes', label: 'Oui', description: 'La reponse est positive.' },
          { value: 'no', label: 'Non', description: 'La reponse est negative.' },
        ]
      : ratingOptions;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((option, index) => {
        const active = `${selectedValue}` === `${option.value}`;

        return (
          <motion.button
            key={`${question?.id || 'question'}-${option.value}`}
            type="button"
            disabled={disabled}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, delay: index * 0.04 }}
            whileHover={disabled ? undefined : { y: -3, scale: 1.01 }}
            whileTap={disabled ? undefined : { scale: 0.99 }}
            onClick={() => onChange(option.value)}
            className={cn(
              'group rounded-[24px] border px-5 py-5 text-left transition backdrop-blur-xl',
              active
                ? 'border-[#2563eb] bg-[linear-gradient(135deg,rgba(37,99,235,0.12),rgba(14,165,233,0.12))] shadow-[0_18px_45px_rgba(37,99,235,0.16)]'
                : 'border-white/75 bg-white/68 hover:border-[#bfdbfe] hover:bg-white/84',
              disabled ? 'cursor-not-allowed opacity-70' : '',
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[16px] font-semibold text-slate-900">{option.label}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">{option.description}</p>
              </div>
              <span
                className={cn(
                  'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition',
                  active
                    ? 'border-[#2563eb] bg-[#2563eb] text-white'
                    : 'border-slate-200 bg-white text-transparent group-hover:border-[#93c5fd]',
                )}
              >
                <Check className="h-4 w-4" />
              </span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

export default function QuestionCard({
  currentQuestion,
  currentQuestionIndex,
  totalQuestions,
  selectedValue,
  disabled,
  notice,
  onChange,
}) {
  return (
    <>
      {notice ? (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700"
        >
          {notice}
        </motion.div>
      ) : null}

      <div className="mt-6 rounded-[30px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(248,250,252,0.92))] p-5 sm:p-7">
        <AnimatePresence mode="wait">
          <motion.article
            key={currentQuestion?.id || currentQuestionIndex}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.32, ease: 'easeOut' }}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Question {currentQuestionIndex + 1}
                </p>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-[32px]">
                  {getQuestionTitle(currentQuestion, currentQuestionIndex)}
                </h2>
                <p className="mt-3 text-[15px] leading-7 text-slate-600">
                  {getQuestionDescription(currentQuestion)}
                </p>
              </div>

              <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">
                  {currentQuestion?.required === false ? 'Optionnelle' : 'Obligatoire'}
                </p>
                {currentQuestion?.type !== 'text' && currentQuestion?.global_score?.percentage !== null ? (
                  <p className="mt-1">
                    Moyenne globale {Math.round(Number(currentQuestion.global_score.percentage || 0))}%
                  </p>
                ) : null}
              </div>
            </div>

            {Array.isArray(currentQuestion?.skills) && currentQuestion.skills.length ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {currentQuestion.skills.map((skill) => (
                  <span
                    key={`${currentQuestion.id}-${skill}`}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="mt-8">
              <QuestionChoices
                question={currentQuestion}
                selectedValue={selectedValue}
                disabled={disabled}
                onChange={onChange}
              />
            </div>

            <p className="mt-6 text-sm text-slate-500">
              {currentQuestionIndex + 1 === totalQuestions
                ? 'Derniere question. Verifiez votre selection puis envoyez.'
                : 'Continuez pour afficher la question suivante.'}
            </p>
          </motion.article>
        </AnimatePresence>
      </div>
    </>
  );
}

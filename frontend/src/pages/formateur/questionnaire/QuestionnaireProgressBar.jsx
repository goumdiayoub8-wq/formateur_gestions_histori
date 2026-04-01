import React from 'react';
import { motion } from 'framer-motion';

export default function QuestionnaireProgressBar({ currentQuestionIndex, totalQuestions }) {
  const progress = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;

  return (
    <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-200/80">
      <motion.div
        animate={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="h-full rounded-full bg-[linear-gradient(90deg,#2563eb,#06b6d4)]"
      />
    </div>
  );
}

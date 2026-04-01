import { useEffect, useMemo, useState } from 'react';
import QuestionnaireService from '../../../services/questionnaireService';

function isQuestionRequired(question) {
  return question ? question.required !== false : true;
}

function isAnswerEmpty(value) {
  return value === undefined || value === null || `${value}`.trim() === '';
}

function getCurrentAnswerValue(question, answers) {
  if (!question) {
    return '';
  }

  return answers[question.id] ?? '';
}

function isAnswerValid(question, answers) {
  if (!question) {
    return false;
  }

  if (!isQuestionRequired(question)) {
    return true;
  }

  return !isAnswerEmpty(getCurrentAnswerValue(question, answers));
}

export function getScoreMeta(percentage) {
  const value = Number(percentage);

  if (!Number.isFinite(value)) {
    return {
      badgeClassName: 'bg-slate-100 text-slate-600',
      progressClassName: 'from-slate-400 to-slate-500',
      label: 'Non evalue',
    };
  }

  if (value >= 75) {
    return {
      badgeClassName: 'bg-emerald-100 text-emerald-700',
      progressClassName: 'from-emerald-400 to-teal-500',
      label: 'Excellent',
    };
  }

  if (value >= 50) {
    return {
      badgeClassName: 'bg-amber-100 text-amber-700',
      progressClassName: 'from-amber-400 to-orange-500',
      label: 'Bon',
    };
  }

  return {
    badgeClassName: 'bg-rose-100 text-rose-700',
    progressClassName: 'from-rose-400 to-red-500',
    label: 'A ameliorer',
  };
}

export function getQuestionTitle(question, fallbackIndex) {
  return question?.name || question?.question_text || `Question ${fallbackIndex + 1}`;
}

export function getQuestionDescription(question) {
  return question?.description || 'Choisissez la reponse qui correspond le mieux a votre experience.';
}

export function useQuestionnaire(token) {
  const [questionnaireData, setQuestionnaireData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadQuestionnaire() {
      try {
        setLoading(true);
        setNotice('');
        setSubmitSuccess(false);

        const questionnaireResponse = await QuestionnaireService.getEvaluationForm({ token });

        if (!mounted) {
          return;
        }

        setQuestionnaireData(questionnaireResponse || null);
        setAnswers(questionnaireResponse?.existing_answers || {});
        setScore(questionnaireResponse?.score || null);
        setCurrentQuestionIndex(0);
        setStarted(false);
      } catch (error) {
        if (mounted) {
          setQuestionnaireData(null);
          setScore(null);
          setNotice(error?.message || 'Impossible de charger le questionnaire.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadQuestionnaire();

    return () => {
      mounted = false;
    };
  }, [token]);

  const questions = questionnaireData?.models || questionnaireData?.questions || [];
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentQuestionIndex] || null;
  const canSubmit = Boolean(questionnaireData?.can_submit);
  const currentAnswerValue = getCurrentAnswerValue(currentQuestion, answers);
  const isCurrentStepValid = isAnswerValid(currentQuestion, answers);

  const summary = useMemo(() => {
    const requiredQuestions = questions.filter((question) => isQuestionRequired(question)).length;
    const answeredQuestions = questions.filter((question) => !isAnswerEmpty(answers[question.id])).length;

    return {
      answeredQuestions,
      requiredQuestions,
    };
  }, [answers, questions]);

  const handleStart = () => {
    setStarted(true);
    setNotice('');
  };

  const handleAnswerChange = (value) => {
    if (!currentQuestion || submitting) {
      return;
    }

    setAnswers((current) => ({
      ...current,
      [currentQuestion.id]: value,
    }));

    if (notice) {
      setNotice('');
    }
  };

  const handleNext = () => {
    if (!currentQuestion) {
      return;
    }

    if (!isCurrentStepValid) {
      setNotice('Merci de selectionner une reponse avant de continuer.');
      return;
    }

    setNotice('');
    setCurrentQuestionIndex((current) => Math.min(current + 1, totalQuestions - 1));
  };

  const handleBack = () => {
    setNotice('');
    setCurrentQuestionIndex((current) => Math.max(current - 1, 0));
  };

  const handleSubmit = async () => {
    if (!currentQuestion || !isCurrentStepValid || submitting) {
      if (!isCurrentStepValid) {
        setNotice('Merci de selectionner une reponse avant l envoi.');
      }
      return;
    }

    try {
      setSubmitting(true);
      setNotice('');

      const payload = {
        answers: questions
          .map((question) => ({
            question_id: question.id,
            value: answers[question.id] ?? '',
          }))
          .filter((answer) => {
            const question = questions.find((entry) => entry.id === answer.question_id);
            return !isAnswerEmpty(answer.value) || isQuestionRequired(question);
          }),
      };

      const response = await QuestionnaireService.submitEvaluationForm(payload, { token });

      setScore(response || null);
      setQuestionnaireData((current) => ({
        ...(current || {}),
        score: response || null,
        can_submit: false,
      }));
      setSubmitSuccess(true);
    } catch (error) {
      setNotice(error?.message || 'Soumission impossible pour le moment.');
    } finally {
      setSubmitting(false);
    }
  };

  return {
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
    questions,
    score,
    started,
    submitSuccess,
    submitting,
    summary,
    totalQuestions,
    isCurrentStepValid,
  };
}

import React from 'react';
import type { Question } from '@/types/quiz';

interface QuestionRendererProps {
  question: Question;
  selectedAnswer: string | null;
  onAnswerSelect: (answer: string) => void;
  showFeedback?: boolean;
  isCorrect?: boolean;
  disabled?: boolean;
}

export default function QuestionRenderer({
  question,
  selectedAnswer,
  onAnswerSelect,
  showFeedback = false,
  isCorrect,
  disabled = false,
}: QuestionRendererProps) {
  const renderPrompt = () => {
    switch (question.type) {
      case 'matrix':
        return (
          <div>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Complete the matrix by finding the missing value:
            </p>
            <div className="inline-block bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
              <table className="border-collapse">
                <tbody>
                  {question.prompt.map((row, rowIdx) => (
                    <tr key={rowIdx}>
                      {row.map((cell, cellIdx) => (
                        <td
                          key={cellIdx}
                          className="border-2 border-gray-400 dark:border-gray-500 w-16 h-16 text-center font-semibold text-gray-900 dark:text-white"
                        >
                          {cell === null ? '?' : cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'quantified_logic':
        return (
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300 font-medium">
              Evaluate whether the conclusion follows from the premises:
            </p>
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg space-y-2">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Premises:</p>
                {question.prompt.premises.map((premise, idx) => (
                  <p key={idx} className="text-gray-900 dark:text-white ml-4">
                    {idx + 1}. {formatQuantifier(premise.quantifier)} {premise.subject} are {premise.predicate}
                  </p>
                ))}
              </div>
              <div className="pt-2 border-t border-gray-300 dark:border-gray-600">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Conclusion:</p>
                <p className="text-gray-900 dark:text-white ml-4 font-medium">
                  {formatQuantifier(question.prompt.conclusion.quantifier)} {question.prompt.conclusion.subject} are {question.prompt.conclusion.predicate}
                </p>
              </div>
            </div>
          </div>
        );

      case 'propositional_logic':
        return (
          <div className="space-y-4">
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg space-y-2">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Premises:</p>
                {question.prompt.premises.map((premise, idx) => (
                  <p key={idx} className="text-gray-900 dark:text-white ml-4 font-mono">
                    {idx + 1}. {premise}
                  </p>
                ))}
              </div>
              <div className="pt-2 border-t border-gray-300 dark:border-gray-600">
                <p className="text-gray-900 dark:text-white font-medium">
                  {question.prompt.question}
                </p>
              </div>
            </div>
          </div>
        );

      case 'logic_puzzle':
        return (
          <div className="space-y-4">
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg space-y-3">
              <p className="text-gray-900 dark:text-white">{question.prompt.setup}</p>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Statements:</p>
                {Object.entries(question.prompt.statements).map(([key, value]) => (
                  <p key={key} className="text-gray-900 dark:text-white ml-4 text-sm">
                    <span className="font-medium">{key}:</span> {value}
                  </p>
                ))}
              </div>
              <div className="pt-2 border-t border-gray-300 dark:border-gray-600">
                <p className="text-gray-900 dark:text-white font-medium">
                  {question.prompt.constraint}
                </p>
              </div>
            </div>
          </div>
        );

      case 'symbol_encoding':
        return (
          <div className="space-y-4">
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg space-y-3">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Example:</p>
                <p className="text-gray-900 dark:text-white font-mono text-lg">{question.prompt.example}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Hint:</p>
                <p className="text-gray-700 dark:text-gray-300 text-sm italic">{question.prompt.rule_hint}</p>
              </div>
              <div className="pt-2 border-t border-gray-300 dark:border-gray-600">
                <p className="text-gray-900 dark:text-white font-mono text-lg font-medium">
                  {question.prompt.question}
                </p>
              </div>
            </div>
          </div>
        );

      case 'custom_operator':
        return (
          <div className="space-y-3">
            {question.definition && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 rounded-lg">
                <p className="text-blue-900 dark:text-blue-200 font-mono text-sm">
                  Definition: {question.definition}
                </p>
              </div>
            )}
            <p className="text-gray-900 dark:text-white text-lg">{question.prompt}</p>
          </div>
        );

      default:
        // For simple question types (sequence, mapping, recurrence, arithmetic_word, analogy, classification)
        return <p className="text-gray-900 dark:text-white text-lg">{question.prompt}</p>;
    }
  };

  const formatQuantifier = (quantifier: string) => {
    switch (quantifier) {
      case 'all':
        return 'All';
      case 'some':
        return 'Some';
      case 'none':
        return 'No';
      default:
        return quantifier;
    }
  };

  const getChoiceStyle = (choiceKey: string) => {
    const isSelected = selectedAnswer === choiceKey;
    const baseStyle = 'w-full text-left p-4 border-2 rounded-lg transition-all';

    if (!showFeedback) {
      return `${baseStyle} ${
        isSelected
          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
      }`;
    }

    // Show feedback
    const correctAnswer = question.answer.toLowerCase();
    const isThisCorrect = choiceKey.toLowerCase() === correctAnswer;

    if (isSelected) {
      if (isCorrect) {
        return `${baseStyle} border-green-600 bg-green-50 dark:bg-green-900/20`;
      } else {
        return `${baseStyle} border-red-600 bg-red-50 dark:bg-red-900/20`;
      }
    } else if (isThisCorrect && !isCorrect) {
      // Show correct answer if user was wrong
      return `${baseStyle} border-green-600 bg-green-50 dark:bg-green-900/20`;
    }

    return `${baseStyle} border-gray-300 dark:border-gray-600`;
  };

  const getFeedbackIcon = (choiceKey: string) => {
    if (!showFeedback) return null;

    const correctAnswer = question.answer.toLowerCase();
    const isThisCorrect = choiceKey.toLowerCase() === correctAnswer;
    const isSelected = selectedAnswer === choiceKey;

    if (isSelected && isCorrect) {
      return <span className="text-green-600 dark:text-green-400 text-xl">✓</span>;
    }

    if (isSelected && !isCorrect) {
      return <span className="text-red-600 dark:text-red-400 text-xl">✗</span>;
    }

    if (isThisCorrect && !isCorrect) {
      return <span className="text-green-600 dark:text-green-400 text-xl">✓</span>;
    }

    return null;
  };

  return (
    <div className="space-y-6">
      {/* Question Prompt */}
      <div>{renderPrompt()}</div>

      {/* Choices */}
      <div className="space-y-3">
        {Object.entries(question.choices).map(([key, value]) => (
          <button
            key={key}
            onClick={() => !disabled && onAnswerSelect(key)}
            disabled={disabled}
            className={getChoiceStyle(key)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase">
                  {key}.
                </span>
                <span className="text-gray-900 dark:text-white">{value}</span>
              </div>
              {getFeedbackIcon(key)}
            </div>
          </button>
        ))}
      </div>

      {/* Feedback Message */}
      {showFeedback && (
        <div
          className={`p-4 rounded-lg ${
            isCorrect
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}
        >
          <p className={`font-medium ${isCorrect ? 'text-green-900 dark:text-green-200' : 'text-red-900 dark:text-red-200'}`}>
            {isCorrect ? 'Correct!' : 'Incorrect'}
          </p>
          {!isCorrect && (
            <p className="text-red-700 dark:text-red-300 text-sm mt-1">
              The correct answer is: <span className="font-semibold uppercase">{question.answer}</span> - {question.choices[question.answer]}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

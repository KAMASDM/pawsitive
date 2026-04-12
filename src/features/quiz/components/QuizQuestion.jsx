import React from "react";
import { motion } from "framer-motion";

/**
 * Single quiz question with 4 answer options.
 * Props:
 *  question  — { q, options, correct, explanation }
 *  answered  — index of chosen answer or null
 *  onAnswer  — fn(index)
 */
export default function QuizQuestion({ question, answered, onAnswer }) {
  const isAnswered = answered !== null;

  return (
    <div className="space-y-3">
      <p className="text-base font-bold text-slate-800 leading-snug">{question.q}</p>

      {question.options.map((opt, i) => {
        let style = "bg-white border border-slate-200 text-slate-700";
        if (isAnswered) {
          if (i === question.correct) {
            style = "bg-emerald-50 border-emerald-400 text-emerald-700";
          } else if (i === answered && i !== question.correct) {
            style = "bg-red-50 border-red-400 text-red-600";
          } else {
            style = "bg-white border border-slate-100 text-slate-400 opacity-60";
          }
        }

        return (
          <motion.button
            key={i}
            whileTap={{ scale: isAnswered ? 1 : 0.97 }}
            onClick={() => !isAnswered && onAnswer(i)}
            disabled={isAnswered}
            className={`w-full text-left px-4 py-3.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-3 ${style}`}
          >
            <span className="w-6 h-6 flex-shrink-0 rounded-full border-2 border-current flex items-center justify-center text-xs font-black">
              {String.fromCharCode(65 + i)}
            </span>
            <span className="flex-1">{opt}</span>
            {isAnswered && i === question.correct && (
              <span className="text-emerald-600 text-base">✓</span>
            )}
            {isAnswered && i === answered && i !== question.correct && (
              <span className="text-red-500 text-base">✗</span>
            )}
          </motion.button>
        );
      })}

      {/* Explanation (shown after answering) */}
      {isAnswered && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-sm text-indigo-800 leading-relaxed"
        >
          <span className="font-bold">💡 </span>{question.explanation}
        </motion.div>
      )}
    </div>
  );
}

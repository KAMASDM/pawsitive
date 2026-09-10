import React from 'react';
import { Check, Circle } from 'lucide-react';

export default function CareTask({ task, busy, onToggle, sample = false }) {
  return <div className={`flex items-center gap-3 p-4 rounded-2xl border ${task.completed ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-violet-100'}`}>
    <button type="button" disabled={busy} onClick={onToggle} aria-label={`${task.completed ? 'Undo' : 'Complete'} ${task.title} for ${task.petName}`} aria-pressed={task.completed} className="shrink-0 min-w-11 min-h-11 flex items-center justify-center rounded-full text-violet-700 focus-visible:ring-4 focus-visible:ring-violet-300 disabled:opacity-50">
      {task.completed ? <Check size={26} className="text-emerald-700" /> : <Circle size={26} />}
    </button>
    <div className="min-w-0 flex-1"><p className="font-semibold text-slate-900 break-words">{task.title}</p><p className="text-sm text-slate-600">{task.petName} · {task.time}</p>
      {task.completed && <p className="text-xs text-emerald-800 mt-1">{sample ? 'Sample completion' : `Recorded by ${task.recordedBy || 'you'}`} · tap the check to undo</p>}
    </div>
  </div>;
}

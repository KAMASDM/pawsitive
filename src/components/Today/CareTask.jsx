import React from 'react';
import { Check, LoaderCircle } from 'lucide-react';

export default function CareTask({ task, busy, onToggle, sample = false, saving = false }) {
  const [hour, minute] = (task.time || '00:00').split(':').map(Number);
  const time = `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
  return <div className={`care-task ${task.completed ? 'is-complete' : ''}`}>
    <button type="button" disabled={busy} onClick={onToggle} aria-label={`${task.completed ? 'Undo' : 'Complete'} ${task.title} for ${task.petName}`} aria-pressed={task.completed} className="care-task-toggle">
      <span className="care-task-check">{saving ? <LoaderCircle size={18} className="animate-spin" aria-hidden="true" /> : task.completed ? <Check size={17} strokeWidth={2.5} aria-hidden="true" /> : null}</span>
    </button>
    <div className="care-task-copy"><p>{task.title}</p><span>{task.petName}{task.completed ? ` · ${sample ? 'Sample completion' : `Recorded by ${task.recordedBy || 'you'}`}` : ''}</span></div>
    <time className="care-task-time" dateTime={task.time}>{time}</time>
  </div>;
}

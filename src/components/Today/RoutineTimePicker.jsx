import React from 'react';
import { Clock3, Moon, Sun, Sunrise } from 'lucide-react';
import './RoutineTimePicker.css';

export default function RoutineTimePicker({ value, onChange, timeZone }) {
  const [hour24, minute] = value.split(':').map(Number);
  const hour = hour24 % 12 || 12;
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const change = (nextHour, nextMinute, nextPeriod) => onChange(`${String(nextHour % 12 + (nextPeriod === 'PM' ? 12 : 0)).padStart(2, '0')}:${String(nextMinute).padStart(2, '0')}`);
  return <fieldset className="routine-time-picker sm:col-span-2">
    <legend>Time in your day</legend>
    <div className="routine-time-surface">
      <div className="routine-time-controls"><Clock3 size={22} aria-hidden="true" />
        <label><span>Hour</span><select aria-label="Routine hour" value={hour} onChange={event => change(Number(event.target.value), minute, period)}>{Array.from({ length: 12 }, (_, index) => index + 1).map(n => <option key={n} value={n}>{String(n).padStart(2, '0')}</option>)}</select></label>
        <span className="routine-time-colon" aria-hidden="true">:</span>
        <label><span>Minute</span><select aria-label="Routine minute" value={minute} onChange={event => change(hour, Number(event.target.value), period)}>{Array.from({ length: 60 }, (_, n) => <option key={n} value={n}>{String(n).padStart(2, '0')}</option>)}</select></label>
        <div className="routine-time-period" role="group" aria-label="Morning or afternoon">{['AM', 'PM'].map(part => <button type="button" key={part} aria-pressed={part === period} onClick={() => change(hour, minute, part)}>{part}</button>)}</div>
      </div>
      <div className="routine-time-presets">{[{ label: 'Morning', time: '08:00', Icon: Sunrise }, { label: 'Afternoon', time: '13:00', Icon: Sun }, { label: 'Evening', time: '19:00', Icon: Moon }].map(({ label, time, Icon }) => <button type="button" key={label} aria-pressed={value === time} onClick={() => onChange(time)}><Icon size={16} aria-hidden="true" /><span>{label}<small>{time === '08:00' ? '8 AM' : time === '13:00' ? '1 PM' : '7 PM'}</small></span></button>)}</div>
    </div>
    <p className="routine-time-help">Your care-plan time zone: {timeZone.replaceAll('_', ' ')}. This organises your day; it does not set an individual push reminder.</p>
  </fieldset>;
}

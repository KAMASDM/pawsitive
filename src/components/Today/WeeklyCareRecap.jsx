import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Share2, CalendarDays, ChevronDown } from 'lucide-react';
import { weeklyCareSummary } from '../../domain/care.mjs';

export default function WeeklyCareRecap({ days, pets, day, filter, canShare = false }) {
  const [expanded, setExpanded] = useState(false);
  const recap = weeklyCareSummary(days, pets, day, filter);
  const weekday = date => new Intl.DateTimeFormat('en', { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));
  return <section className="today-week-card rounded-3xl p-6" aria-label="Weekly care recap">
    <div className="flex items-center justify-between"><h2 className="font-semibold">A week of little wins</h2><CalendarDays size={20} /></div>
    <p className="week-number mt-3">{recap.total} <span className="text-sm font-medium tracking-normal">{recap.total === 1 ? 'care moment' : 'care moments'}</span></p>
    <p className="text-xs mt-1 opacity-80">Recorded on {recap.activeDays} of the last 7 days</p>
    <div className="week-bars" aria-label="Care activity in the last seven days">{recap.activity.map(({ date, count }) => <div key={date} className="week-bar-wrap" aria-label={`${date}: ${count} recorded actions`}><span className="week-bar" style={{ height: `${Math.max(3, count / Math.max(1, ...recap.activity.map(item => item.count)) * 35)}px`, opacity: count ? 1 : .3 }} /><span>{weekday(date)}</span></div>)}</div>
    {!recap.total && <p className="text-sm leading-relaxed mt-4">Your week starts with one small act of care. Record a routine when it is done to see it here.</p>}
    <button type="button" className="mt-5 w-full flex items-center justify-between rounded-xl border border-current/20 px-3 py-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4" aria-expanded={expanded} aria-controls="weekly-care-details" onClick={() => setExpanded(!expanded)}>Explore your week<ChevronDown size={17} style={{ transform: expanded ? 'rotate(180deg)' : undefined }} /></button>
    {canShare && <Link className="app-text-button mt-3" to={`/care/${filter || Object.keys(pets)[0]}/week`}><Share2 size={15} />Make a share card</Link>}
    {expanded && <div id="weekly-care-details" className="mt-5 space-y-5">
      {!!recap.pets.length && <div><h3 className="text-xs font-bold uppercase tracking-wide mb-2">Care by pet</h3>{recap.pets.map(pet => <p key={pet.id} className="flex justify-between gap-3 py-2 text-sm border-b border-current/10"><span className="min-w-0 break-words">{pet.name}</span><span className="shrink-0">{pet.count} recorded</span></p>)}</div>}
      {!!recap.routines.length && <div><h3 className="text-xs font-bold uppercase tracking-wide mb-2">Most recorded routines</h3>{recap.routines.map(routine => <p key={routine.title} className="flex justify-between gap-3 py-2 text-sm"><span className="min-w-0 break-words">{routine.title}</span><span className="shrink-0">{routine.count}</span></p>)}</div>}
      <div><h3 className="text-xs font-bold uppercase tracking-wide mb-2">Day by day</h3>{recap.activity.map(item => <p key={item.date} className="flex justify-between py-1 text-xs"><span>{weekday(item.date)} · {item.date.slice(5)}</span><span>{item.count ? `${item.count} recorded` : 'No entries'}</span></p>)}</div>
      <p className="text-xs leading-relaxed opacity-80">This reflects saved completions, including corrections. A day with no entries does not mean care was missed.</p>
    </div>}
  </section>;
}

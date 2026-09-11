import React, { useEffect, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { Link, useSearchParams } from 'react-router-dom';
import { endAt, onValue, orderByKey, query, ref, startAt } from 'firebase/database';
import { ArrowRight, CalendarDays, Heart, PawPrint, Plus } from 'lucide-react';
import { auth, database, functions } from '../../firebase';
import { careDate, careTimeZone, ROUTINE_KINDS, shiftDate, todayTasks } from '../../domain/care.mjs';
import { createFirstPet, createRoutine, recordCare, setRoutineActive } from '../../services/careService';
import CareTask from './CareTask';
import TodayWelcome, { TodayDiscover } from './TodayWelcome';

const inputClass = 'mt-1 w-full rounded-xl border border-slate-300 p-3 text-slate-900 bg-white focus:ring-2 focus:ring-violet-500';
const primaryClass = 'inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 py-3 font-semibold text-white hover:bg-violet-800 disabled:opacity-50';

export default function Today() {
  const uid = auth.currentUser.uid;
  const [params, setParams] = useSearchParams();
  const ownerId = params.get('family') || uid;
  const isShared = ownerId !== uid;
  const [shared, setShared] = useState({});
  const [access, setAccess] = useState(null);
  const [pets, setPets] = useState({});
  const [routines, setRoutines] = useState({});
  const [days, setDays] = useState({});
  const [user, setUser] = useState({});
  const [loaded, setLoaded] = useState({});
  const [filter, setFilter] = useState('');
  const [now, setNow] = useState(new Date());
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState('');
  const [petName, setPetName] = useState('');
  const [petType, setPetType] = useState('Dog');
  const [form, setForm] = useState({ petId: '', title: 'Fresh water', kind: 'water', time: '08:00' });
  const [manage, setManage] = useState(false);
  const timeZone = careTimeZone(user);
  const day = careDate(now, timeZone);
  const weekStart = shiftDate(day, -6);
  const showForm = params.get('add') === '1';

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    const resume = () => setNow(new Date());
    window.addEventListener('focus', resume);
    return () => { clearInterval(timer); window.removeEventListener('focus', resume); };
  }, []);
  useEffect(() => {
    let active = true;
    setLoaded({}); setPets({}); setRoutines({}); setDays({}); setUser({}); setFilter(''); setAccess(null); setError('');
    const failed = () => { setPets({}); setRoutines({}); setDays({}); setLoaded({}); setError('This care plan is unavailable. Your access may have ended; return to your own Today or check your connection.'); };
    const watch = (path, key, setter) => onValue(ref(database, path), snapshot => { setter(snapshot.val() || {}); setLoaded(previous => ({ ...previous, [key]: true })); }, failed);
    const stops = [watch(`careRoutines/${ownerId}`, 'routines', setRoutines)];
    let timer;
    if (isShared) {
      const refresh = async () => {
        try {
          const { data } = await httpsCallable(functions, 'getSharedCarePets')({ ownerId });
          if (!active) return;
          setPets(data.pets); setUser({ timeZone: data.timeZone }); setShared(data);
          setLoaded(previous => ({ ...previous, pets: true, user: true }));
        } catch { if (active) failed(); }
      };
      stops.push(onValue(ref(database, `careAccess/${uid}/${ownerId}`), snapshot => {
        const value = snapshot.val(); setAccess(value);
        if (!value || value.expiresAt <= Date.now()) failed();
      }, failed));
      refresh(); timer = setInterval(refresh, 30000);
    } else {
      stops.push(watch(`userPets/${uid}`, 'pets', setPets), watch(`users/${uid}`, 'user', setUser));
    }
    return () => { active = false; clearInterval(timer); stops.forEach(stop => stop()); };
  }, [uid, ownerId, isShared]);
  useEffect(() => {
    setLoaded(previous => ({ ...previous, days: false }));
    return onValue(query(ref(database, `careDays/${ownerId}`), orderByKey(), startAt(weekStart), endAt(day)), snapshot => { setDays(snapshot.val() || {}); setLoaded(previous => ({ ...previous, days: true })); }, () => setError('Completed care could not be loaded. Reload before recording care.'));
  }, [ownerId, day, weekStart]);

  const petList = Object.entries(pets);
  const tasks = todayTasks(routines, pets, day, days[day], filter).map(task => ({ ...task, recordedBy: task.record?.updatedBy === uid ? 'you' : shared.members?.[task.record?.updatedBy] || (task.record?.updatedBy === ownerId ? shared.ownerName : 'a caregiver') }));
  const canRecord = !isShared || (access?.expiresAt > now.getTime() && ['caregiver', 'sitter'].includes(access?.role));
  const completed = tasks.filter(task => task.completed).length;
  const weekCount = Object.values(days).flatMap(records => Object.values(records)).filter(record => record.status === 'done' && (!filter || record.petId === filter)).length;
  const ready = loaded.pets && loaded.user && loaded.routines && loaded.days;
  useEffect(() => {
    if (!showForm || !ready || !petList.length) return;
    const timer = setTimeout(() => { const section = document.getElementById('routine-form'); section?.scrollIntoView({ block: 'center' }); section?.querySelector('select')?.focus({ preventScroll: true }); }, 50);
    return () => clearTimeout(timer);
  }, [showForm, ready, petList.length]);
  const run = async (key, action) => {
    setBusy(key); setError(''); setNotice('');
    try { await action(); } catch (err) { setError(err.code === 'PERMISSION_DENIED' ? 'This action is not available for your account. Please reload and try again.' : err.message || 'Could not save. Please try again.'); }
    finally { setBusy(''); }
  };
  const openForm = () => { setForm(previous => ({ ...previous, petId: filter || previous.petId || petList[0]?.[0] || '' })); setParams({ add: '1' }); };

  const weekActivity = Array.from({ length: 7 }, (_, index) => {
    const date = shiftDate(day, index - 6);
    return { date, count: Object.values(days[date] || {}).filter(record => record.status === 'done' && (!filter || record.petId === filter)).length };
  });

  return <div className="today-home">
    <div className="today-shell">
      <TodayWelcome user={user} now={now} timeZone={timeZone} pets={petList} filter={filter} onFilter={setFilter} ready={ready} isShared={isShared} onStart={() => document.getElementById('today-care')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })} />
      <div id="today-care" className="scroll-mt-24" />
      {isShared && <div className="p-4 mb-5 rounded-xl bg-violet-100"><p className="font-semibold">Shared care · {shared.ownerName || "Family"}’s pets</p><p className="text-sm mt-1">{canRecord ? "You can view and record daily care." : "You have view-only access to this plan."}</p><Link to="/today" className="inline-block mt-2 text-sm underline text-violet-800">Return to my Today</Link></div>}
      {error && <p role="alert" className="p-4 mb-4 bg-red-50 border border-red-200 rounded-xl text-red-800">{error}</p>}
      <p role="status" className="text-sm text-emerald-800 mb-3">{notice}</p>
      {!ready ? <p className="p-8 bg-white rounded-2xl">Loading your care plan…</p> : <>
        {!petList.length ? isShared ? <p>No pets have been added to this care plan yet.</p> : <section className="max-w-xl bg-white rounded-3xl p-6 sm:p-8 border border-violet-100"><PawPrint className="text-violet-700 mb-4" /><h2 className="text-2xl font-bold">Who are we caring for?</h2><p className="mt-2 text-slate-600">Start with a name. Then choose one daily routine that would help you.</p><form className="space-y-4 mt-6" onSubmit={event => { event.preventDefault(); run('pet', async () => { const id = await createFirstPet(petName, petType); setForm(previous => ({ ...previous, petId: id })); setParams({ add: '1' }); setNotice('Pet added. Choose your first routine below.'); }); }}><label className="block">Pet’s name<input className={inputClass} value={petName} onChange={event => setPetName(event.target.value)} required maxLength={60} /></label><label className="block">Pet type<select className={inputClass} value={petType} onChange={event => setPetType(event.target.value)}><option>Dog</option><option>Cat</option><option>Other</option></select></label><p className="text-sm text-slate-500">Your new pet profile starts private. You can add a photo, health records, and sharing preferences later.</p><button className={primaryClass} disabled={!!busy}>Add my pet <ArrowRight size={18} /></button></form></section> : <>
          <div className="flex flex-wrap items-end justify-between gap-4 mb-6"><label className="text-sm font-semibold">Showing care for<select aria-label="Filter by pet" className={inputClass} value={filter} onChange={event => setFilter(event.target.value)}><option value="">All my pets</option>{petList.map(([id, pet]) => <option key={id} value={id}>{pet.name}</option>)}</select></label>{!isShared && <button onClick={openForm} className={primaryClass}><Plus size={18} /> Add a routine</button>}</div>
          <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6 items-start"><section className="today-care-panel bg-white rounded-3xl border border-violet-100 p-5 sm:p-7"><div className="flex items-center justify-between mb-2"><div><p className="today-eyebrow">THE LITTLE THINGS THAT MATTER</p><h2 className="text-2xl font-bold">Today’s care</h2></div><span className="text-sm font-semibold text-violet-700">{completed} of {tasks.length} done</span></div><p className="text-sm text-slate-600 mb-5">Your chosen routines. Times help organise your day.</p>
            {tasks.length > 0 && <div role="progressbar" aria-label="Today's care progress" aria-valuemin={0} aria-valuemax={tasks.length} aria-valuenow={completed} className="h-2 rounded-full bg-violet-100 mb-6 overflow-hidden"><div className="h-full bg-emerald-600 transition-all" style={{ width: `${completed / tasks.length * 100}%` }} /></div>}
            <div className="space-y-3">{tasks.map(task => <CareTask key={task.id} task={task} busy={!!busy || !canRecord} onToggle={() => run(task.id, async () => { const saved = await recordCare(day, task, task.completed ? 'open' : 'done', ownerId); setNotice(saved ? task.completed ? 'Completion corrected.' : `${task.title} recorded for ${task.petName}.` : 'This task changed on another device. Your plan has been refreshed.'); })} />)}</div>
            {!tasks.length && <div className="py-8"><Heart className="text-violet-500 mb-3" /><h3 className="font-semibold text-lg">Make tomorrow easier, starting today.</h3><p className="text-slate-600 my-3">Choose a meal, fresh water, play, or another daily activity. Start with just one.</p>{!isShared && <button onClick={openForm} className="font-semibold text-violet-700 underline underline-offset-4">Choose my first routine</button>}</div>}
            {!!tasks.length && completed === tasks.length && <p className="mt-5 text-emerald-800 bg-emerald-50 rounded-xl p-4">Today’s routines are recorded. Enjoy some time together.</p>}
            {!isShared && <button className="mt-6 text-sm text-violet-700 underline underline-offset-4" onClick={() => setManage(!manage)} aria-expanded={manage}>Manage routines</button>}
            {manage && !isShared && <div className="mt-4 space-y-3">{Object.entries(routines).filter(([, routine]) => pets[routine.petId] && (!filter || routine.petId === filter)).map(([id, routine]) => <div key={id} className="flex items-center justify-between gap-3 text-sm border-t pt-3"><span>{routine.title} · {pets[routine.petId].name} · {routine.active ? 'Daily' : 'Paused'}</span><button disabled={!!busy} onClick={() => run(id, () => setRoutineActive(id, !routine.active))} className="px-3 py-2 rounded-lg bg-violet-50 text-violet-800">{routine.active ? 'Pause' : 'Resume'}</button></div>)}</div>}
          </section><aside className="space-y-5"><section className="today-week-card rounded-3xl p-6"><div className="flex items-center justify-between"><h2 className="font-semibold">A week of little wins</h2><CalendarDays size={20} /></div><p className="week-number mt-3">{weekCount} <span className="text-sm font-medium tracking-normal">care moments</span></p><p className="text-xs mt-1 opacity-80">Recorded over the last 7 days</p><div className="week-bars" aria-label="Care activity in the last seven days">{weekActivity.map(({ date, count }) => <div key={date} className="week-bar-wrap" aria-label={`${date}: ${count} recorded actions`}><span className="week-bar" style={{ height: `${Math.max(3, count / Math.max(1, ...weekActivity.map(item => item.count)) * 35)}px`, opacity: count ? 1 : .3 }} /><span>{new Intl.DateTimeFormat('en', { weekday: 'narrow', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`))}</span></div>)}</div></section>{!isShared && <section className="bg-white p-6 rounded-3xl border border-violet-100"><h2 className="font-bold text-xl">Keep the bigger picture close</h2><p className="text-slate-600 text-sm mt-2 mb-4">Vaccinations, medications, weight, and expenses live in each pet’s care record.</p>{petList.filter(([id]) => !filter || filter === id).map(([id, pet]) => <Link key={id} to={`/pet-details/${id}`} className="flex justify-between gap-3 py-3 text-violet-800 font-semibold border-t">{pet.name}’s care <ArrowRight size={18} /></Link>)}<Link to="/care" className="text-sm underline text-violet-700">All care tools</Link></section>}<Link to="/settings" className="block bg-violet-100 rounded-3xl p-6"><h2 className="font-bold">Make reminders work for you</h2><p className="text-sm text-slate-700 mt-2">Choose health reminders, quiet hours, and your time zone. Opt in to a daily briefing when routines remain open. Activity times organise Today; they do not send individual alerts.</p></Link></aside></div>
          {showForm && !isShared && <section id="routine-form" className="mt-6 bg-white border-2 border-violet-200 rounded-3xl p-5 sm:p-7 max-w-2xl"><h2 className="text-2xl font-bold">Choose a daily routine</h2><p className="text-sm text-slate-600 mt-2">Use routines for everyday care. Keep medication instructions and doses in your pet’s health record.</p><form className="grid sm:grid-cols-2 gap-4 mt-5" onSubmit={event => { event.preventDefault(); run('routine', async () => { await createRoutine({ ...form, petId: form.petId || petList[0][0], startDate: day }); setParams({}); setNotice('Routine added to Today. You can record it when it is done.'); }); }}><label>Pet<select className={inputClass} value={form.petId || petList[0][0]} onChange={event => setForm({ ...form, petId: event.target.value })}>{petList.map(([id, pet]) => <option key={id} value={id}>{pet.name}</option>)}</select></label><label>Activity<select className={inputClass} value={form.kind} onChange={event => setForm({ ...form, kind: event.target.value, title: ROUTINE_KINDS[event.target.value] })}>{Object.entries(ROUTINE_KINDS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label>Routine name<input className={inputClass} value={form.title} required maxLength={80} onChange={event => setForm({ ...form, title: event.target.value })} /></label><label>Time in your day<input className={inputClass} type="time" required value={form.time} onChange={event => setForm({ ...form, time: event.target.value })} /></label><div className="sm:col-span-2 flex gap-3"><button className={primaryClass} disabled={!!busy}>Save daily routine</button><button type="button" onClick={() => setParams({})} className="px-4 py-3 text-slate-600">Cancel</button></div></form></section>}
        </>}
      </>}
      {!isShared && <TodayDiscover />}
    </div>
  </div>;
}

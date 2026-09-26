import React, { useEffect, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { Link, useSearchParams } from 'react-router-dom';
import { endAt, onValue, orderByKey, query, ref, startAt } from 'firebase/database';
import { ArrowRight, Check, Heart, Plus, Settings2, Sparkles, Users } from 'lucide-react';
import { auth, database, functions } from '../../firebase';
import { careDate, careTimeZone, ROUTINE_KINDS, shiftDate, todayTasks } from '../../domain/care.mjs';
import { createFirstPet, createRoutine, recordCare, setRoutineActive } from '../../services/careService';
import CareTask from './CareTask';
import WeeklyCareRecap from './WeeklyCareRecap';
import RoutineTimePicker from './RoutineTimePicker';
import TodayWelcome from './TodayWelcome';
import { ActionRow, EmptyState, PageLoading, Sheet } from '../UI/AppUI';

const inputClass = 'app-input';
const primaryClass = 'app-button';

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
  const ready = loaded.pets && loaded.user && loaded.routines && loaded.days;
  const run = async (key, action) => {
    setBusy(key); setError(''); setNotice('');
    try { await action(); } catch (err) { setError(err.code === 'PERMISSION_DENIED' ? 'This action is not available for your account. Please reload and try again.' : err.message || 'Could not save. Please try again.'); }
    finally { setBusy(''); }
  };
  const openForm = event => { event?.currentTarget?.focus({ preventScroll: true }); setForm(previous => ({ ...previous, petId: filter || previous.petId || petList[0]?.[0] || '' })); setParams({ add: '1' }); };


  const closeForm = () => setParams(previous => { const next = new URLSearchParams(previous); next.delete('add'); return next; });
  const pending = tasks.filter(task => !task.completed);
  const done = tasks.filter(task => task.completed);
  const taskRow = task => <CareTask key={task.id} task={task} busy={!!busy || !canRecord} saving={busy === task.id} onToggle={() => run(task.id, async () => {
    const saved = await recordCare(day, task, task.completed ? 'open' : 'done', ownerId);
    setNotice(saved ? task.completed ? 'Completion corrected.' : `${task.title} recorded for ${task.petName}.` : 'This task changed on another device. Your plan has been refreshed.');
  })} />;

  return <div className="app-page today-home">
    <TodayWelcome user={user} now={now} timeZone={timeZone} pets={petList} filter={filter} onFilter={setFilter} ready={ready} isShared={isShared} />
    {isShared && <div className="today-shared"><Users size={20} aria-hidden="true" /><div><p>Shared care · {shared.ownerName || 'Family'}’s pets</p><small>{canRecord ? 'You can view and record daily care.' : 'You have view-only access to this plan.'}</small><Link to="/today">Return to my Today <ArrowRight size={14} /></Link></div></div>}
    {error && !showForm && !manage && <p role="alert" className="app-notice app-notice-error">{error}</p>}
    <p role="status" className="app-notice">{notice}</p>
    {!ready ? !error && <PageLoading /> : !petList.length ? isShared ? <EmptyState title="A care plan is on its way">Pets will appear here when their parent adds them.</EmptyState> : <section className="app-panel today-onboarding">
      <EmptyState title="Who are we caring for?">Start with a name. Build a daily rhythm around the little things they need.</EmptyState>
      <form className="today-pet-form" onSubmit={event => { event.preventDefault(); run('pet', async () => { const id = await createFirstPet(petName, petType); setForm(previous => ({ ...previous, petId: id })); setParams({ add: '1' }); setNotice('Pet added. Choose your first routine.'); }); }}>
        <label className="app-field">Pet’s name<input className={inputClass} value={petName} onChange={event => setPetName(event.target.value)} placeholder="e.g. Milo" required maxLength={60} autoComplete="off" /></label>
        <label className="app-field">Pet type<select className={inputClass} value={petType} onChange={event => setPetType(event.target.value)}><option>Dog</option><option>Cat</option><option>Other</option></select></label>
        <p className="app-caption">Their profile starts private. You can add photos and health records later.</p><button className={primaryClass} disabled={!!busy}>{busy ? 'Adding your pet…' : 'Add my pet'} <ArrowRight size={17} /></button>
      </form>
    </section> : <>
      <div className="today-layout">
        <section className="app-panel today-care-panel" aria-label="Today’s care">
          <div className="app-section-top"><div><h2 className="app-section-title">Today’s care</h2><p className="app-caption">{tasks.length ? `${completed} of ${tasks.length} done${filter ? ` for ${pets[filter]?.name || 'your pet'}` : ''}` : 'Your daily rhythm starts here'}</p></div>{!isShared && <button type="button" onClick={openForm} className="app-button today-add-routine"><Plus size={18} aria-hidden="true" /><span>Add a routine</span></button>}</div>
          {tasks.length > 0 && <div role="progressbar" aria-label="Today's care progress" aria-valuemin={0} aria-valuemax={tasks.length} aria-valuenow={completed} className="today-progress"><div style={{ width: `${completed / tasks.length * 100}%` }} /></div>}
          {pending.length > 0 && <div className="today-task-list">{pending.map(taskRow)}</div>}
          {done.length > 0 && <div className="today-completed"><h3>Completed <span>{done.length}</span></h3>{done.map(taskRow)}<p className="app-caption today-undo-hint">{canRecord ? 'Tap a checkmark to undo a completion.' : 'Care is recorded by the parent and caregivers.'}</p></div>}
          {!tasks.length && <EmptyState icon={Heart} title={filter ? `A little routine for ${pets[filter]?.name}` : 'Small routines. Happier days.'} action={!isShared && <button onClick={openForm} className="app-button">Choose my first routine</button>}>Fresh water, a walk, a little play. Choose one thing to make part of their day.</EmptyState>}
          {!!tasks.length && completed === tasks.length && <div className="today-all-done"><Check size={18} aria-hidden="true" /><span>All cared for. Enjoy some time together.</span></div>}
          {!isShared && Object.keys(routines).length > 0 && <button className="app-text-button today-manage" onClick={() => setManage(true)} aria-expanded={manage}><Settings2 size={15} aria-hidden="true" />Manage routines</button>}
        </section>
        <aside className="today-aside"><WeeklyCareRecap days={days} pets={pets} day={day} filter={filter} />
          {!isShared && <div className="app-action-list"><ActionRow to="/care" icon={Heart} title="Their health, all together" detail="Records, weight & vet visits" /><ActionRow to="/copilot" icon={Sparkles} title="A little help with care" detail="Questions & record summaries · AI beta" /></div>}
        </aside>
      </div>
      {!isShared && <nav className="today-secondary" aria-label="Pet care shortcuts"><ActionRow to="/family" icon={Users} title="Share the everyday" detail="Invite family or a trusted caregiver" /><ActionRow to="/settings" icon={Settings2} title="Reminders that fit your day" detail="Choose updates, quiet hours & your time zone" /></nav>}
    </>}
    <Sheet open={showForm && ready && petList.length > 0 && !isShared} onClose={closeForm} busy={!!busy} title="Choose a daily routine" description="For the everyday things. Keep medication instructions and doses in your pet’s health record.">
      {error && <p role="alert" className="app-notice app-notice-error">{error}</p>}
      <form onSubmit={event => { event.preventDefault(); run('routine', async () => { await createRoutine({ ...form, petId: form.petId || petList[0][0], startDate: day }); closeForm(); setNotice('Routine added to Today. You can record it when it is done.'); }); }}>
        <div className="app-form-grid"><label className="app-field">Pet<select className={inputClass} value={form.petId || petList[0]?.[0]} onChange={event => setForm({ ...form, petId: event.target.value })}>{petList.map(([id, pet]) => <option key={id} value={id}>{pet.name}</option>)}</select></label>
        <label className="app-field">Activity<select className={inputClass} value={form.kind} onChange={event => setForm({ ...form, kind: event.target.value, title: ROUTINE_KINDS[event.target.value] })}>{Object.entries(ROUTINE_KINDS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label className="app-field app-form-wide">Routine name<input className={inputClass} value={form.title} required maxLength={80} onChange={event => setForm({ ...form, title: event.target.value })} /></label>
        <div className="app-form-wide"><RoutineTimePicker value={form.time} onChange={time => setForm({ ...form, time })} timeZone={timeZone} /></div></div>
        <div className="app-form-actions"><button type="button" onClick={closeForm} disabled={!!busy} className="app-text-button">Cancel</button><button className={primaryClass} disabled={!!busy}>{busy === 'routine' ? 'Saving…' : 'Save daily routine'}</button></div>
      </form>
    </Sheet>
    <Sheet open={manage && !isShared} onClose={() => setManage(false)} busy={!!busy} title="Manage routines" description="Pause a routine when plans change. Your recorded care stays in your history.">
      {error && <p role="alert" className="app-notice app-notice-error">{error}</p>}
      <div className="today-managed-list">{Object.entries(routines).filter(([, routine]) => pets[routine.petId] && (!filter || routine.petId === filter)).map(([id, routine]) => <div key={id}><div><strong>{routine.title}</strong><p>{pets[routine.petId].name} · {routine.active ? 'Daily' : 'Paused'}</p></div><button disabled={!!busy} onClick={() => run(id, () => setRoutineActive(id, !routine.active))} className="app-button app-button-secondary">{routine.active ? 'Pause' : 'Resume'}</button></div>)}</div>
    </Sheet>
  </div>;
}

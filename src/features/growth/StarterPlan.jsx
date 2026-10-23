import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { get, onValue, ref, serverTimestamp, update } from 'firebase/database';
import { Check, Sparkles } from 'lucide-react';
import { auth, database } from '../../firebase';
import { PageHeader, PageLoading } from '../../components/UI/AppUI';
import { careDate, careTimeZone } from '../../domain/care.mjs';
import { trackProductEvent } from '../../services/productAnalytics';
import useOwnPet from './useOwnPet';
import useDraft from '../../hooks/useDraft';
import { starterSuggestions, starterWrites, routineAlreadyExists, refreshStarterSuggestions } from './starterPlans.mjs';

function PlanEditor({ pet }) {
  const uid = auth.currentUser.uid;
  const [draft, setDraft, clearDraft] = useDraft(`pawppy:starter:${uid}:${pet.id}`, () => ({ lifeStage: 'adult', goal: 'steady', suggestions: starterSuggestions(pet.type) }));
  const [existing, setExisting] = useState({}), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  useEffect(() => onValue(ref(database, `careRoutines/${uid}`), snapshot => setExisting(snapshot.val() || {}), () => setError('Your routines could not be loaded. Reload before saving.')), [uid]);
  const regenerate = values => { setDraft(current => refreshStarterSuggestions(pet.type, current, values)); setNotice('Suggestions refreshed. Your edited names, times and selected routines were kept.'); };
  const change = (index, values) => setDraft(current => ({ ...current, suggestions: current.suggestions.map((item, i) => i === index ? { ...item, ...values } : item) }));
  return <><section className="app-panel"><div className="app-form-grid"><label className="app-field">Life stage<select className="app-input" value={draft.lifeStage} disabled={busy} onChange={event => regenerate({ lifeStage: event.target.value })}><option value="young">Young pet</option><option value="adult">Adult</option><option value="older">Older pet</option></select></label><label className="app-field">What would help most?<select className="app-input" value={draft.goal} disabled={busy} onChange={event => regenerate({ goal: event.target.value })}><option value="steady">An everyday rhythm</option><option value="settling">Settling into a new home</option><option value="shared">Sharing care with someone</option></select></label></div><p className="app-caption mt-4">These are editable daily check-ins, not a prescribed care schedule. Choose times and activities that fit your pet and their existing care instructions. Changing the choices above refreshes the suggestions while keeping your edits.</p></section>
    {error && <p role="alert" className="app-notice app-notice-error mt-5">{error}</p>}{notice && <p role="status" className="app-notice mt-5">{notice}</p>}
    <form className="app-panel mt-6" onSubmit={async event => { event.preventDefault(); setBusy(true); setError(''); try {
      const [user, records] = await Promise.all([get(ref(database, `users/${uid}`)), get(ref(database, `careRoutines/${uid}`))]);
      const writes = starterWrites(records.val(), pet.id, draft.suggestions, careDate(new Date(), careTimeZone(user.val() || {})), serverTimestamp());
      if (Object.keys(writes).length) { await update(ref(database, `careRoutines/${uid}`), writes); trackProductEvent('starter_plan_saved', 'care'); trackProductEvent('routine_created', 'care'); }
      clearDraft(); setNotice(Object.keys(writes).length ? 'Your selected routines are on Today. Existing routines were preserved.' : 'These routines are already saved. You can review them on Today.');
    } catch (err) { setError(err.message || 'The plan could not be saved. Your draft is still here.'); } finally { setBusy(false); } }}><h2 className="app-section-title">Choose your little routines</h2>
      <div className="growth-stack mt-5">{draft.suggestions.map((item, index) => { const saved = routineAlreadyExists(existing, pet.id, item); return <fieldset className="growth-record" key={item.id}><legend>{saved ? 'Already on your plan' : 'Suggested routine'}</legend><label className="growth-check"><input type="checkbox" checked={item.selected} disabled={busy || saved} onChange={event => change(index, { selected: event.target.checked })} />{saved ? <><Check size={16} />Already saved</> : 'Add to Today'}</label><div className="app-form-grid mt-4"><label className="app-field">Routine name<input className="app-input" value={item.title} maxLength={80} required={item.selected} disabled={busy || saved} onChange={event => change(index, { title: event.target.value })} /></label><label className="app-field">Time<input type="time" className="app-input" required={item.selected} value={item.time} disabled={busy || saved} onChange={event => change(index, { time: event.target.value })} /></label></div>{saved && <p className="app-caption mt-3">Use Manage routines on Today to pause or resume the saved routine.</p>}</fieldset>; })}</div><div className="app-form-actions"><Link to="/today" className="app-text-button">Open Today</Link><button className="app-button" disabled={busy || !draft.suggestions.some(item => item.selected)}><Sparkles size={17} />{busy ? 'Saving…' : 'Add selected routines'}</button></div>
    </form>{draft.goal === 'shared' && <div className="app-action-list mt-6"><Link className="app-action-row" to="/family"><span className="app-row-copy"><strong>Bring their caregiver into the rhythm</strong><small>Invite someone you trust to view and record daily care.</small></span></Link></div>}</>;
}
export default function StarterPlan() {
  const { petId } = useParams(), { pet, error } = useOwnPet(petId);
  return <div className="app-page app-page-narrow growth-screen"><Link to="/care" className="app-text-button">Back to Care</Link><PageHeader eyebrow="Make room for the everyday" title="A care plan to start with" description={pet ? `A few small routines for life with ${pet.name}. Choose what fits and leave the rest.` : 'Small steps, at your pace.'} />{error && <p role="alert" className="app-notice app-notice-error">{error}</p>}{pet ? <PlanEditor key={petId} pet={pet} /> : !error && <PageLoading />}</div>;
}

import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { onValue, ref } from 'firebase/database';
import { auth, database } from '../../firebase';
import { PageHeader, PageLoading, PetAvatar } from '../../components/UI/AppUI';
import useDraft from '../../hooks/useDraft';
import { callGrowth, saveHandover } from './growthService';

const fields = [ ['feeding', 'Food & water instructions', 'Use their usual food and the instructions you have agreed.'], ['routineNotes', 'Routine & comfort notes', 'Favourite places, where things are kept, and what helps them settle.'], ['emergencyName', 'Emergency contact name', 'Their parent or an agreed emergency contact.'], ['emergencyPhone', 'Emergency contact phone', 'Include the country code.'], ['extraNotes', 'Anything else to know', 'For example: Please keep the front gate closed.'] ];
function PetHandover({ id, pet, saved, canEdit }) {
  const [draft, setDraft, clearDraft] = useDraft(`pawppy:handover:${auth.currentUser.uid}:${id}`, canEdit ? saved || {} : {});
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  return <section className="app-panel"><div className="profile-pet-heading !p-0 mb-6"><PetAvatar pet={pet} /><div><h2>{pet.name}</h2><p>{pet.type}</p></div></div>
    {canEdit ? <form onSubmit={async event => { event.preventDefault(); setBusy(true); setError(''); try { await saveHandover(id, draft); clearDraft(); setNotice('Instructions saved for your active care team.'); } catch (err) { setError(err.message || 'Instructions could not be saved. Your draft is still here.'); } finally { setBusy(false); } }}><div className="growth-stack">{fields.map(([key, label, placeholder]) => <label className="app-field" key={key}>{label}{key.startsWith('emergency') ? <input className="app-input" type={key === 'emergencyPhone' ? 'tel' : 'text'} value={draft[key] || ''} maxLength={key === 'emergencyPhone' ? 40 : 100} onChange={event => setDraft({ ...draft, [key]: event.target.value })} placeholder={placeholder} disabled={busy} /> : <textarea className="app-input" rows={3} maxLength={1500} value={draft[key] || ''} onChange={event => setDraft({ ...draft, [key]: event.target.value })} placeholder={placeholder} disabled={busy} />}</label>)}</div>{error && <p role="alert" className="app-notice app-notice-error mt-4">{error}</p>}{notice && <p role="status" className="app-notice mt-4">{notice}</p>}<div className="app-form-actions"><button className="app-button" disabled={busy} aria-label={`Save ${pet.name}’s instructions`}>{busy ? 'Saving…' : 'Save instructions'}</button></div></form> : <dl className="growth-instructions">{fields.map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{saved?.[key] || 'No instructions shared yet.'}</dd></div>)}</dl>}
  </section>;
}
export default function Handover() {
  const [params] = useSearchParams(), uid = auth.currentUser.uid, ownerId = params.get('family') || uid, isShared = ownerId !== uid;
  const [pets, setPets] = useState(null), [handovers, setHandovers] = useState(null), [error, setError] = useState('');
  useEffect(() => {
    let active = true; const stops = [];
    const failed = () => { setPets(null); setHandovers(null); setError('These instructions are unavailable. Your shared-care access may have ended.'); };
    if (isShared) {
      const load = () => callGrowth('getSharedCarePets', { ownerId }).then(value => { if (active) setPets(value.pets); }).catch(() => { if (active) failed(); });
      load(); const timer = setInterval(load, 30000); stops.push(() => clearInterval(timer));
      stops.push(onValue(ref(database, `careAccess/${uid}/${ownerId}`), snapshot => { if (!snapshot.val() || snapshot.val().expiresAt <= Date.now()) failed(); }, failed));
    } else stops.push(onValue(ref(database, `userPets/${uid}`), snapshot => setPets(snapshot.val() || {}), failed));
    stops.push(onValue(ref(database, `careHandovers/${ownerId}`), snapshot => setHandovers(snapshot.val() || {}), failed));
    return () => { active = false; stops.forEach(stop => stop()); };
  }, [uid, ownerId, isShared]);
  return <div className="app-page app-page-narrow growth-screen"><Link to={isShared ? `/today?family=${encodeURIComponent(ownerId)}` : '/family'} className="app-text-button">{isShared ? 'Back to shared care' : 'Back to Family'}</Link><PageHeader eyebrow="The details that make them feel at home" title="Sitter handover" description={isShared ? 'Instructions their parent chose to share with the care team.' : 'Write the instructions you want your active caregivers and sitters to see. Access ends when their invitation expires or you remove them.'} />{error && <p role="alert" className="app-notice app-notice-error">{error}</p>}
    {!pets || handovers === null ? !error && <PageLoading label="Loading care instructions…" /> : <div className="growth-stack">{!Object.keys(pets).length && <div className="app-panel"><p className="app-caption">Add a pet first to prepare their handover.</p><Link to="/today" className="app-text-button">Add my pet</Link></div>}{Object.entries(pets).map(([id, pet]) => <PetHandover key={`${ownerId}:${id}`} id={id} pet={pet} saved={handovers[id]} canEdit={!isShared} />)}</div>}
    {!isShared && <p className="app-caption mt-5">Only these instructions are shared. Your team does not get access to health records, expenses or private events. Your unsaved instructions stay in this browser session.</p>}
  </div>;
}

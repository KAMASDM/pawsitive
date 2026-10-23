import React, { useEffect, useState } from 'react';
import { onValue, ref, serverTimestamp, set } from 'firebase/database';
import { Camera, ImagePlus } from 'lucide-react';
import { auth, database } from '../../firebase';
import { Sheet } from '../../components/UI/AppUI';
import useDraft from '../../hooks/useDraft';
import { smallPhoto } from './documentReader';
import { trackProductEvent } from '../../services/productAnalytics';

export default function CareUpdate({ task, day, ownerId, canRecord }) {
  const uid = auth.currentUser.uid, path = `careUpdates/${ownerId}/${day}/${task.id}`;
  const [saved, setSaved] = useState(null), [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [draft, setDraft, clearDraft] = useDraft(`pawppy:care-update:${uid}:${ownerId}:${day}:${task.id}`, { note: '', photo: '' });
  useEffect(() => onValue(ref(database, path), snapshot => setSaved(snapshot.val()), () => { setSaved(null); setOpen(false); }), [path]);
  const canEdit = canRecord && (!saved || saved.authorId === uid || ownerId === uid);
  if (!canRecord && !saved) return null;
  return <><button type="button" className="app-text-button care-update-button" aria-label={`${saved ? 'View' : 'Add'} update for ${task.title} for ${task.petName}`} onClick={() => { setError(''); setNotice(''); if (canEdit && saved && !draft.note && !draft.photo) setDraft({ note: saved.note || '', photo: saved.photo || '' }); setOpen(true); }}><Camera size={16} /><span>{saved ? 'Update' : 'Add update'}</span></button>
    <Sheet open={open} onClose={() => setOpen(false)} busy={busy} title={`${task.title} · ${task.petName}`} description="An optional note or photo for the active care team. Health records remain private.">
      {error && <p role="alert" className="app-notice app-notice-error">{error}</p>}{notice && <p role="status" className="app-notice">{notice}</p>}
      {saved && <div className="growth-saved-update">{saved.photo && <img src={saved.photo} alt={`Care update for ${task.petName}`} />}{saved.note && <p>{saved.note}</p>}<small>Saved {new Date(saved.updatedAt).toLocaleString()}</small></div>}
      {canEdit ? <form onSubmit={async event => { event.preventDefault(); setBusy(true); setError(''); try { await set(ref(database, path), { authorId: uid, note: draft.note.trim(), photo: draft.photo, updatedAt: serverTimestamp() }); clearDraft(); setDraft({ note: '', photo: '' }); setNotice('Update saved for the care team.'); trackProductEvent('care_update_saved', 'care'); } catch { setError('The update could not be saved. Check your connection and shared-care access. Your draft is still here.'); } finally { setBusy(false); } }}><label className="app-field mt-4">A little update<textarea rows={3} className="app-input" value={draft.note} maxLength={500} disabled={busy} onChange={event => setDraft({ ...draft, note: event.target.value })} placeholder="For example: A relaxed walk and a drink when we got home." /></label><label className="growth-upload mt-4"><ImagePlus size={20} />Choose a photo<input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={async event => { const file = event.target.files?.[0]; if (!file) return; setBusy(true); setError(''); try { setDraft(current => ({ ...current, photo: '' })); const photo = await smallPhoto(file); setDraft(current => ({ ...current, photo })); } catch (err) { setError(err.message); } finally { setBusy(false); } }} /></label>{draft.photo && <div className="growth-photo-draft"><img src={draft.photo} alt="Photo ready to attach" /><button className="app-text-button" type="button" onClick={() => setDraft({ ...draft, photo: '' })}>Remove photo</button></div>}<div className="app-form-actions"><button className="app-button" disabled={busy || (!draft.note.trim() && !draft.photo)}>{busy ? 'Saving…' : saved ? 'Replace update' : 'Save care update'}</button></div></form> : <p className="app-caption mt-4">{saved ? 'This update was shared by another caregiver.' : 'There is no photo or note for this completion yet.'}</p>}
    </Sheet></>;
}

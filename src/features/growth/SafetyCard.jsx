import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { PawPrint, Printer, Share2, ShieldCheck } from 'lucide-react';
import { auth } from '../../firebase';
import { PageHeader, PageLoading } from '../../components/UI/AppUI';
import { trackProductEvent } from '../../services/productAnalytics';
import useOwnPet from './useOwnPet';
import useDraft from '../../hooks/useDraft';
import { callGrowth, shareLink } from './growthService';

const empty = { enabled: false, contactName: '', phone: '', email: '', message: '', shareBreed: false, sharePhoto: false };
function SafetyEditor({ pet, saved }) {
  const [form, setForm, clearDraft] = useDraft(`pawppy:safety:${auth.currentUser.uid}:${pet.id}:${saved?.revision || 0}`, { ...empty, ...saved });
  const [current, setCurrent] = useState(saved), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const url = current?.enabled ? `${window.location.origin}/found/${current.token}` : '';
  const save = async event => {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try { const result = await callGrowth('saveSafetyCard', { ...form, petId: pet.id }); setCurrent(result); setForm(result); clearDraft(); setNotice(result.enabled ? 'Safety card saved. Only the contact details you chose are available through this link.' : 'Safety card disabled. Its link no longer reveals pet or contact details.'); if (result.enabled) trackProductEvent('safety_card_enabled', 'care'); }
    catch (err) { setError(err.message || 'The card could not be saved. Your draft is still here.'); }
    finally { setBusy(false); }
  };
  return <>
    {error && <p role="alert" className="app-notice app-notice-error">{error}</p>}{notice && <p role="status" className="app-notice">{notice}</p>}
    <form className="app-panel" onSubmit={save}><h2 className="app-section-title">Choose what a finder can see</h2><p className="app-caption mt-3">Anyone with the card link can see your pet’s name, type, and the contact details you enter here. This is separate from their social profile. Health records, your account email and your address are never added automatically.</p>
      <label className="growth-check my-5"><input type="checkbox" checked={form.enabled} onChange={event => setForm({ ...form, enabled: event.target.checked })} />Enable the public safety card</label>
      <div className="app-form-grid"><label className="app-field app-form-wide">Contact name (optional)<input className="app-input" maxLength={60} value={form.contactName} onChange={event => setForm({ ...form, contactName: event.target.value })} /></label><label className="app-field">Contact phone<input className="app-input" type="tel" maxLength={30} value={form.phone} onChange={event => setForm({ ...form, phone: event.target.value })} placeholder="Include your country code" /></label><label className="app-field">Contact email<input className="app-input" type="email" maxLength={120} value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} /></label><label className="app-field app-form-wide">Message for a finder (optional)<textarea className="app-input" rows={3} maxLength={500} value={form.message} onChange={event => setForm({ ...form, message: event.target.value })} placeholder="For example: Please call my parent. I can be nervous around traffic." /></label></div>
      <div className="growth-inline mt-5"><label className="growth-check"><input type="checkbox" checked={form.shareBreed} onChange={event => setForm({ ...form, shareBreed: event.target.checked })} />Include breed</label><label className="growth-check"><input type="checkbox" checked={form.sharePhoto} onChange={event => setForm({ ...form, sharePhoto: event.target.checked })} />Include profile photo</label></div><p className="app-caption mt-4">Choose at least one contact method when enabling the card. To revoke access later, turn the card off and save.</p><div className="app-form-actions"><button className="app-button" disabled={busy}>{busy ? 'Saving…' : 'Save safety card'}</button></div>
    </form>
    {url && <section className="app-panel mt-6"><div className="app-section-top"><h2 className="app-section-title">Ready for their collar</h2><ShieldCheck size={21} /></div><div className="safety-print-area"><span className="growth-wordmark"><PawPrint size={21} />pawppy</span><h2>{pet.name}</h2><QRCodeSVG value={url} size={180} level="M" marginSize={4} title={`${pet.name}’s safety card`} /><p>Found me? Scan to contact my parent.</p><small>pawppy.in</small></div><p className="app-caption my-4">Print and cut out the card, then attach it securely to a tag or carrier. The code is a contact card and does not track your pet’s location.</p><div className="growth-inline"><button type="button" className="app-button app-button-secondary" onClick={() => window.print()}><Printer size={17} />Print safety card</button><button type="button" className="app-button" onClick={async () => { const result = await shareLink({ title: `${pet.name}’s safety card`, text: 'Scan or open this link to contact my pet’s parent.', url }); setNotice(result); if (result && !result.startsWith('Select')) trackProductEvent('safety_card_shared', 'care'); }}><Share2 size={17} />Share card</button><a className="app-text-button" href={url} target="_blank" rel="noreferrer">Preview public card</a></div><label className="app-field mt-4">Safety card link<input className="app-input" readOnly value={url} onFocus={event => event.target.select()} /></label></section>}
  </>;
}
export default function SafetyCard() {
  const { petId } = useParams(), { pet, error: petError } = useOwnPet(petId);
  const [saved, setSaved] = useState(undefined), [error, setError] = useState(''), [attempt, setAttempt] = useState(0);
  useEffect(() => { let active = true; setError(''); callGrowth('getMySafetyCard', { petId }).then(value => { if (active) setSaved(value); }).catch(err => { if (active) setError(err.message || 'Your safety card could not be loaded.'); }); return () => { active = false; }; }, [petId, attempt]);
  return <div className="app-page app-page-narrow growth-screen"><Link to="/care" className="app-text-button">Back to Care</Link><PageHeader eyebrow="A way back to their people" title="Safety card" description={pet ? `A simple, scannable contact card for ${pet.name}.` : 'Help a finder get in touch.'} />{(error || petError) && <p role="alert" className="app-notice app-notice-error">{error || petError} {error && <button className="app-text-button" onClick={() => setAttempt(value => value + 1)}>Try again</button>}</p>}{!pet || saved === undefined ? !(error || petError) && <PageLoading label="Loading their safety card…" /> : <SafetyEditor key={petId} pet={pet} saved={saved} />}</div>;
}

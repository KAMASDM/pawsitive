import React, { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FileUp, Plus, Trash2 } from 'lucide-react';
import { auth } from '../../firebase';
import useDraft from '../../hooks/useDraft';
import { PageHeader, PageLoading } from '../../components/UI/AppUI';
import { trackProductEvent } from '../../services/productAnalytics';
import useOwnPet from './useOwnPet';
import { extractVaccinations } from './recordParser.mjs';
import { saveImportedVaccinations } from './growthService';

export default function RecordImport() {
  const { petId } = useParams();
  const { pet, error: loadError } = useOwnPet(petId);
  const [draft, setDraft, clearDraft] = useDraft(`pawppy:import:${auth.currentUser.uid}:${petId}`, { text: '', order: 'DMY', records: [] });
  const [busy, setBusy] = useState(false), [progress, setProgress] = useState(''), [error, setError] = useState(''), [notice, setNotice] = useState(''), [reviewed, setReviewed] = useState(false);
  const fileInput = useRef(null);
  const update = (id, change) => { setReviewed(false); setDraft(current => ({ ...current, records: current.records.map(item => item.id === id ? { ...item, ...change } : item) })); };
  const suggest = (text = draft.text, order = draft.order) => {
    const records = extractVaccinations(text, order).map(item => ({ ...item, id: crypto.randomUUID() }));
    setDraft(current => ({ ...current, text, order, records })); setReviewed(false);
    setNotice(records.length ? 'Suggestions are ready. Compare each row with the original card before selecting it.' : 'No vaccination rows were recognised. You can add a row below and use the extracted text as a reference.');
  };
  const read = async event => {
    const file = event.target.files?.[0]; if (!file) return;
    setBusy(true); setError(''); setNotice(''); setProgress('Opening your document…');
    trackProductEvent('record_import_started', 'care');
    try { const { readDocument } = await import('./documentReader'); const text = await readDocument(file, setProgress); suggest(text); }
    catch (err) { setError(err.message || 'This card could not be read. Try a clearer photo or paste the text below.'); }
    finally { setBusy(false); setProgress(''); if (fileInput.current) fileInput.current.value = ''; }
  };
  const save = async event => {
    event.preventDefault(); if (!reviewed) return;
    setBusy(true); setError('');
    try {
      const rows = draft.records.filter(item => item.selected);
      await saveImportedVaccinations(petId, rows);
      setDraft(current => ({ ...current, records: current.records.map(item => ({ ...item, selected: false })) })); clearDraft(); setReviewed(false);
      setNotice('Reviewed records saved. Matching vaccine names and given dates are kept once; existing records were preserved.');
    } catch (err) { setError(err.message || 'The records could not be saved. Your draft is still here.'); }
    finally { setBusy(false); }
  };
  return <div className="app-page app-page-narrow growth-screen">
    <Link to="/care" className="app-text-button">Back to Care</Link>
    <PageHeader eyebrow="Less typing. More time together." title="Read a vaccination card" description={pet ? `Add ${pet.name}’s vaccinations from a photo or document, then review every detail.` : 'Bring your pet’s records together.'} />
    {(error || loadError) && <p role="alert" className="app-notice app-notice-error">{error || loadError}</p>}
    {notice && <p role="status" className="app-notice">{notice}</p>}
    {!pet ? !loadError && <PageLoading /> : <>
      <section className="app-panel"><h2 className="app-section-title">Start with their card</h2><p className="app-caption mt-3">Choose a clear photo, a PDF with up to five pages, or a text file (up to 10 MB). Reading happens on this device. Your original document is not uploaded or saved. The reader works best with printed English text; handwriting and unclear dates need manual review.</p>
        <label className="growth-upload"><FileUp size={22} /><span>Choose vaccination card</span><input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,application/pdf,text/plain" disabled={busy} onChange={read} /></label>
        {busy && <p role="status" className="app-caption my-3">{progress || 'Saving reviewed records…'}</p>}
        <details className="growth-details" open={!!draft.text}><summary>Paste or review extracted text</summary><label className="app-field">Card text<textarea className="app-input" rows={6} maxLength={60000} value={draft.text} disabled={busy} onChange={event => setDraft({ ...draft, text: event.target.value })} /></label><div className="growth-inline mt-4"><label className="app-field">Date format on the card<select className="app-input" disabled={busy} value={draft.order} onChange={event => { setDraft({ ...draft, order: event.target.value }); setReviewed(false); }}><option value="DMY">Day / month / year</option><option value="MDY">Month / day / year</option></select></label><button type="button" className="app-button app-button-secondary" disabled={busy || !draft.text.trim()} onClick={() => suggest()}>Find vaccination rows</button></div><p className="app-caption mt-3">Check the date order before finding rows. Two-digit years and unclear dates are left blank.</p></details>
      </section>
      <form onSubmit={save} className="app-panel mt-6"><div className="app-section-top"><h2 className="app-section-title">Review your records</h2><button type="button" className="app-text-button" disabled={busy || draft.records.length >= 30} onClick={() => { setDraft({ ...draft, records: [...draft.records, { id: crypto.randomUUID(), name: '', date: '', nextDue: '', selected: false }] }); setReviewed(false); }}><Plus size={17} />Add row</button></div>
        {!draft.records.length && <p className="app-caption">Your suggestions will appear here. You can also add a row yourself.</p>}
        {draft.records.map((record, index) => <fieldset className="growth-record" key={record.id}><legend>Vaccination {index + 1}</legend><div className="app-section-top"><label className="growth-check"><input type="checkbox" disabled={busy} checked={record.selected} onChange={event => update(record.id, { selected: event.target.checked })} />Include this record</label><button type="button" disabled={busy} className="app-icon-button" aria-label={`Remove vaccination ${index + 1}`} onClick={() => { setDraft({ ...draft, records: draft.records.filter(item => item.id !== record.id) }); setReviewed(false); }}><Trash2 size={18} /></button></div><div className="app-form-grid"><label className="app-field app-form-wide">Vaccine name<input className="app-input" maxLength={100} value={record.name} disabled={busy} onChange={event => update(record.id, { name: event.target.value })} required={record.selected} /></label><label className="app-field">Given date<input type="date" className="app-input" value={record.date} disabled={busy} required={record.selected} onChange={event => update(record.id, { date: event.target.value })} /></label><label className="app-field">Next date on card (optional)<input type="date" className="app-input" value={record.nextDue} disabled={busy} onChange={event => update(record.id, { nextDue: event.target.value })} /></label></div>{record.sourceLine && <p className="app-caption mt-3">From the card: {record.sourceLine}</p>}</fieldset>)}
        {!!draft.records.length && <><label className="growth-check mt-5"><input type="checkbox" disabled={busy} checked={reviewed} onChange={event => setReviewed(event.target.checked)} />I compared the selected names and dates with the original card.</label><p className="app-caption mt-3">Only the rows you select are saved. Reminder dates use the next date you confirm here. No dates are calculated for you.</p><div className="app-form-actions"><button className="app-button" disabled={busy || !reviewed || !draft.records.some(item => item.selected)}>{busy ? 'Saving…' : 'Save reviewed vaccinations'}</button></div></>}
      </form><p className="app-caption mt-4">Your unsaved text and rows stay in this browser session when you leave and come back.</p>
    </>}
  </div>;
}

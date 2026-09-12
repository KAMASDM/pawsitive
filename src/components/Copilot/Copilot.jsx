import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { onValue, ref } from 'firebase/database';
import { httpsCallable } from 'firebase/functions';
import { ArrowLeft, ArrowUpRight, Check, FileText, LockKeyhole, MessageCircle, RotateCcw, Send, Sparkles } from 'lucide-react';
import { auth, database, functions } from '../../firebase';
import './Copilot.css';

const SUGGESTIONS = ['Suggest a few gentle indoor enrichment ideas for a cat.', 'Help me build a simple grooming routine for a dog.', 'What should I pack for a day out with my pet?'];
const PRIVACY_URL = 'https://docs.cloud.google.com/vertex-ai/generative-ai/docs/data-governance';
const errorText = error => error?.message || 'Copilot could not connect. Please try again.';

export default function Copilot() {
  const [params] = useSearchParams();
  const [mode, setMode] = useState(params.get('pet') ? 'summary' : 'question');
  const [pets, setPets] = useState({});
  const [petId, setPetId] = useState(params.get('pet') || '');
  const [status, setStatus] = useState(null);
  const [preview, setPreview] = useState(null);
  const [question, setQuestion] = useState(params.get('pet') ? 'Summarise the previewed records and suggest questions to take to my veterinarian.' : '');
  const [consent, setConsent] = useState(false);
  const [approveRecords, setApproveRecords] = useState(false);
  const [busy, setBusy] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState('');
  const [answer, setAnswer] = useState(null);
  const [answerSources, setAnswerSources] = useState([]);
  const [previewRevision, setPreviewRevision] = useState(0);
  const uid = auth.currentUser.uid;

  useEffect(() => {
    let live = true;
    httpsCallable(functions, 'getCopilotStatus')({}).then(({ data }) => { if (live) setStatus(data); }).catch(err => { if (live) setError(errorText(err)); });
    const stop = onValue(ref(database, `userPets/${uid}`), snapshot => { setPets(snapshot.val() || {}); }, () => setError('Your pets could not be loaded. Please reconnect.'));
    return () => { live = false; stop(); };
  }, [uid]);
  useEffect(() => {
    let live = true;
    setPreview(null); setApproveRecords(false); setConsent(false); setAnswer(null); setAnswerSources([]);
    if (mode !== 'summary' || !petId) { setPreviewLoading(false); return () => { live = false; }; }
    setPreviewLoading(true); setError('');
    httpsCallable(functions, 'previewCopilotRecords')({ petId }).then(({ data }) => { if (live) setPreview(data); }).catch(err => { if (live) setError(errorText(err)); }).finally(() => { if (live) setPreviewLoading(false); });
    return () => { live = false; };
  }, [mode, petId, previewRevision]);

  const switchMode = next => {
    if (busy) return;
    setMode(next); setError(''); setConsent(false);
    setQuestion(next === 'summary' ? 'Summarise the previewed records and suggest questions to take to my veterinarian.' : '');
  };
  const ask = async event => {
    event.preventDefault();
    if (busy || !consent || !status?.enabled || (mode === 'summary' && (!preview || !approveRecords))) return;
    setBusy(true); setError(''); setAnswer(null); setAnswerSources([]);
    const approvedSources = preview?.sources || [];
    try {
      const payload = { mode, question: question.trim(), requestId: crypto.randomUUID(), consent: true, consentVersion: status.consentVersion, ...(mode === 'summary' ? { petId, fingerprint: preview.fingerprint, approveRecords: true } : {}) };
      const { data } = await httpsCallable(functions, 'askPetCopilot', { timeout: 60000 })(payload);
      setAnswer(data); setAnswerSources(mode === 'summary' ? approvedSources : []);
    } catch (err) { setError(errorText(err)); }
    finally { setBusy(false); setConsent(false); setApproveRecords(false); }
  };
  const clear = () => { setQuestion(''); setAnswer(null); setAnswerSources([]); setConsent(false); setApproveRecords(false); setError(''); };

  return <div className="copilot-page"><div className="copilot-shell">
    <Link to="/today" className="copilot-back"><ArrowLeft size={16} /> Back to your day</Link>
    <header className="copilot-heading"><div className="copilot-mark"><Sparkles size={27} /></div><div><p>PAWPPY COPILOT <span>Beta</span></p><h1>A little help. A little more confidence.</h1><div className="copilot-subtitle">Everyday care ideas and a clearer view of the records you choose to share.</div></div></header>
    <div className="copilot-layout"><div>
      <section className="copilot-workspace" aria-label="Pet Care Copilot">
        <div className="copilot-modes" role="group" aria-label="Copilot mode"><button type="button" disabled={busy} aria-pressed={mode === 'question'} onClick={() => switchMode('question')}><MessageCircle size={18} /> Ask about care</button><button type="button" disabled={busy} aria-pressed={mode === 'summary'} onClick={() => switchMode('summary')}><FileText size={18} /> Review my records</button></div>
        {status && !status.enabled && <p className="copilot-notice">Copilot is temporarily unavailable. You can still use your saved records and daily care tools.</p>}
        {!status && !error && <p className="copilot-notice">Connecting to Copilot…</p>}
        {mode === 'question' ? <div className="copilot-intro"><h2>What would make today easier?</h2><p>Start with a question about play, grooming, everyday routines, or preparing for an outing. Each question starts fresh; previous answers are not sent.</p><div className="copilot-suggestions">{SUGGESTIONS.map(text => <button key={text} disabled={busy} onClick={() => { setQuestion(text); setConsent(false); }}>{text}<ArrowUpRight size={15} /></button>)}</div></div> : <div className="copilot-intro"><h2>Your records, ready for a conversation.</h2><p>Choose your pet, review exactly what will be included, then approve a draft summary. Family access does not include AI access to another owner’s medical records.</p><label className="copilot-label">Choose your pet<select value={petId} disabled={busy} onChange={event => setPetId(event.target.value)}><option value="">Select a pet</option>{Object.entries(pets).map(([id, pet]) => <option key={id} value={id}>{pet.name}</option>)}</select></label>
          {previewLoading && <p className="copilot-notice">Preparing your record preview…</p>}
          {preview && <section className="copilot-preview" aria-label="Records to send"><div className="copilot-preview-title"><h3>Only these records will be sent</h3><button type="button" disabled={busy} onClick={() => setPreviewRevision(value => value + 1)} aria-label="Refresh record preview"><RotateCcw size={16} /></button></div><p>{preview.scope}</p><dl>{preview.sources.map(source => <div key={source.id}><dt>{source.label}</dt><dd>{source.value}</dd></div>)}</dl><p>Medication dose fields, free-form notes, documents, expenses, messages, contact details and photos are excluded.</p><label className="copilot-consent"><input type="checkbox" checked={approveRecords} disabled={busy} onChange={event => setApproveRecords(event.target.checked)} /><span>I approve sending these previewed records to Google Gemini for this request.</span></label></section>}
        </div>}
        <form onSubmit={ask} className="copilot-form"><label className="copilot-label">{mode === 'summary' ? 'What should the summary help you prepare?' : 'Your question'}<textarea value={question} disabled={busy} onChange={event => { setQuestion(event.target.value); setConsent(false); }} maxLength={1000} rows={4} required placeholder="For example, how can I keep my cat entertained indoors?" /></label><div className="copilot-character-count">{question.length} / 1,000</div>
          <label className="copilot-consent"><input type="checkbox" checked={consent} disabled={busy} onChange={event => setConsent(event.target.checked)} /><span>I agree to send this question to Google Gemini. {mode === 'question' ? 'No saved pet records will be included.' : 'Only the records approved above will be included.'}</span></label>
          <p className="copilot-privacy">Pawppy does not save your questions or answers. Google processes this request under its <a href={PRIVACY_URL} target="_blank" rel="noreferrer">data-handling terms</a>, including applicable abuse-monitoring retention. This is not a zero-retention service.</p>
          <div className="copilot-form-actions"><button type="submit" className="copilot-send" disabled={busy || !status?.enabled || !question.trim() || !consent || (mode === 'summary' && (!preview || !approveRecords))}><Send size={17} />{busy ? 'Preparing your answer…' : mode === 'summary' ? 'Prepare draft summary' : 'Ask Copilot'}</button><button type="button" className="copilot-clear" onClick={clear} disabled={busy}>Clear this session</button></div>
        </form>
      </section>
      {error && <p role="alert" className="copilot-error">{error}</p>}
      {answer && <section className="copilot-answer" aria-label="Copilot answer" aria-live="polite"><div className="copilot-answer-heading"><Sparkles size={19} /><h2>{answer.safetyNotice ? 'A note about getting help' : mode === 'summary' ? 'Your draft summary' : 'A starting point for your day'}</h2></div><p className="copilot-answer-text">{answer.answer}</p>{answer.references?.length > 0 && <div className="copilot-answer-sources"><h3>Records referenced in this draft</h3>{answer.references.map(id => { const source = answerSources.find(item => item.id === id); return source ? <p key={id}><Check size={13} /><span><strong>{source.label}:</strong> {source.value}</span></p> : null; })}<Link to={`/pet-details/${petId}`}>Review original care records <ArrowUpRight size={14} /></Link></div>}{answer.followUpQuestions?.length > 0 && <div className="copilot-followups"><h3>Questions to consider</h3><ul>{answer.followUpQuestions.map(text => <li key={text}>{text}</li>)}</ul></div>}<p className="copilot-answer-footer">{answer.provider}{answer.model ? ` · ${answer.model}` : ''}. {answer.safetyNotice ? '' : 'AI can make mistakes. Review this draft against your records. Nothing has been saved or changed.'}</p></section>}
    </div><aside className="copilot-sidebar"><section><LockKeyhole size={23} /><h2>You choose what’s shared.</h2><p>Record summaries use only the preview you approve. Your family’s access permissions stay the same, and Copilot cannot change your care plan.</p></section><section><h2>Help for the everyday.</h2><ul><li>Play and enrichment ideas</li><li>Grooming and routine planning</li><li>Preparing questions for a vet visit</li><li>Organising selected saved records</li></ul></section><section className="copilot-boundary"><h2>Your veterinarian comes first.</h2><p>Copilot does not diagnose, interpret tests, recommend treatments, or calculate medication doses. If your pet seems unwell, contact a veterinarian. For an emergency, seek veterinary care now.</p></section><p className="copilot-quota">Beta: {status?.dailyLimit || 5} requests per account per UTC day, with a shared daily allowance. Attempts count toward the limit, including failed requests. Please leave 15 seconds between requests.</p></aside></div>
  </div></div>;
}

import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { endAt, onValue, orderByKey, query, ref, startAt } from 'firebase/database';
import { Download, PawPrint, Share2 } from 'lucide-react';
import { auth, database } from '../../firebase';
import { PageHeader, PageLoading, Sheet } from '../../components/UI/AppUI';
import { careDate, careTimeZone, shiftDate, weeklyCareSummary } from '../../domain/care.mjs';
import { trackProductEvent } from '../../services/productAnalytics';
import useDraft from '../../hooks/useDraft';
import useOwnPet from './useOwnPet';
import { callGrowth, shareLink, shareToken } from './growthService';
import { smallPhoto } from './documentReader';

export function WeekCard({ card }) {
  return <article className="growth-week-card"><span className="growth-wordmark"><PawPrint size={22} />pawppy</span><p className="app-eyebrow">{card.startDate} – {card.endDate}</p><h2>{card.name}’s week</h2>{card.photo ? <img src={card.photo} alt={`${card.name}’s favourite moment`} /> : <span className="growth-week-paw"><PawPrint size={64} /></span>}{card.caption && <p className="growth-week-caption">{card.caption}</p>}{card.milestones?.length > 0 && <ul>{card.milestones.map((title, index) => <li key={index}>{title}</li>)}</ul>}{Number.isInteger(card.careCount) && <p className="growth-week-count">{card.careCount} recorded care {card.careCount === 1 ? 'moment' : 'moments'}</p>}<small>A little life together · pawppy.in</small></article>;
}
async function cardImage(card) {
  const canvas = document.createElement('canvas'); canvas.width = 1080;
  const ctx = canvas.getContext('2d');
  const linesFor = (text, font) => {
    ctx.font = font;
    const lines = [];
    for (const paragraph of String(text || '').split('\n')) {
      let line = '';
      for (const character of paragraph) {
        if (ctx.measureText(line + character).width > 930 && line) { lines.push(line); line = ''; }
        line += character;
      }
      if (line) lines.push(line);
    }
    return lines;
  };
  const rows = [
    { text: card.caption, font: '32px sans-serif', color: '#292733', height: 44 },
    ...(card.milestones || []).map(title => ({ text: `• ${title}`, font: '30px sans-serif', color: '#292733', height: 42 })),
    ...(Number.isInteger(card.careCount) ? [{ text: `${card.careCount} recorded care moments`, font: 'bold 28px sans-serif', color: '#71568e', height: 40 }] : []),
  ].filter(row => row.text).map(row => ({ ...row, lines: linesFor(row.text, row.font) }));
  canvas.height = Math.max(1350, 920 + rows.reduce((height, row) => height + row.lines.length * row.height + 18, 0) + 100);
  ctx.fillStyle = '#f6f5f2'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#71568e'; ctx.font = 'bold 36px sans-serif'; ctx.fillText('pawppy', 72, 90);
  ctx.fillStyle = '#716e79'; ctx.font = '24px sans-serif'; ctx.fillText(`${card.startDate} – ${card.endDate}`, 72, 146);
  ctx.fillStyle = '#292733'; ctx.font = 'bold 56px sans-serif'; ctx.fillText(`${card.name}’s week`, 72, 226, 936);
  if (card.photo) {
    const image = new Image(); image.src = card.photo; await image.decode();
    const crop = Math.min(image.naturalWidth, image.naturalHeight); ctx.drawImage(image, (image.naturalWidth - crop) / 2, (image.naturalHeight - crop) / 2, crop, crop, 72, 270, 936, 580);
  } else { ctx.fillStyle = '#eee8f3'; ctx.fillRect(72, 270, 936, 580); ctx.fillStyle = '#71568e'; ctx.font = 'bold 72px sans-serif'; ctx.fillText('A little life together', 120, 580, 840); }
  let y = 920;
  for (const row of rows) { ctx.fillStyle = row.color; ctx.font = row.font; for (const line of row.lines) { ctx.fillText(line, 72, y); y += row.height; } y += 18; }
  ctx.fillStyle = '#716e79'; ctx.font = '24px sans-serif'; ctx.fillText('Made with love on pawppy.in', 72, canvas.height - 50);
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('The image could not be prepared.')), 'image/png'));
}
export default function WeeklyCard() {
  const { petId } = useParams(), { pet, error: petError } = useOwnPet(petId);
  const [user, setUser] = useState({}), [events, setEvents] = useState({}), [days, setDays] = useState({}), [links, setLinks] = useState([]), [confirm, setConfirm] = useState(null);
  const [draft, setDraft] = useDraft(`pawppy:week:${auth.currentUser.uid}:${petId}`, () => ({ requestId: shareToken(), caption: '', photo: '', milestoneIds: [], includeCareCount: false, published: null }));
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const endDate = careDate(new Date(), careTimeZone(user)), startDate = shiftDate(endDate, -6);
  const refresh = () => callGrowth('listMyWeeklyCards', { petId }).then(setLinks);
  useEffect(() => {
    const failed = () => setError('Some of your saved moments could not be loaded. Please reload before creating a card.');
    const stopUser = onValue(ref(database, `users/${auth.currentUser.uid}`), snapshot => setUser(snapshot.val() || {}), failed);
    const stopEvents = onValue(ref(database, `petEvents/${petId}`), snapshot => setEvents(snapshot.val() || {}), failed);
    const stopDays = onValue(query(ref(database, `careDays/${auth.currentUser.uid}`), orderByKey(), startAt(startDate), endAt(endDate)), snapshot => setDays(snapshot.val() || {}), failed);
    refresh().catch(() => setError('Previously shared cards could not be loaded. Please reload to manage them.'));
    return () => { stopUser(); stopEvents(); stopDays(); };
  }, [petId, startDate, endDate]); // eslint-disable-line react-hooks/exhaustive-deps
  const milestones = Object.entries(events).filter(([, event]) => ['birthday', 'adoption', 'achievement', 'milestone', 'grooming', 'training'].includes(event.type) && typeof event.date === 'string' && event.date.slice(0,10) >= startDate && event.date.slice(0,10) <= endDate);
  const preview = { name: pet?.name || 'My pet', caption: draft.caption, photo: draft.photo, startDate, endDate, milestones: milestones.filter(([id]) => draft.milestoneIds.includes(id)).map(([, item]) => item.title), ...(draft.includeCareCount ? { careCount: weeklyCareSummary(days, { [petId]: pet }, endDate, petId).total } : {}) };
  const card = draft.published?.card || preview;
  const url = draft.published ? `${window.location.origin}/week/${draft.published.token}` : '';
  const change = update => { setDraft(current => ({ ...current, ...update, requestId: shareToken(), published: null })); setNotice(''); };
  const photo = async file => { if (!file) return; setBusy(true); setError(''); try { change({ photo: await smallPhoto(file) }); } catch (err) { setError(err.message); } finally { setBusy(false); } };
  const publish = async () => { setBusy(true); setError(''); try { const result = await callGrowth('publishWeeklyCard', { ...draft, petId }); setDraft(current => ({ ...current, published: result })); await refresh(); setNotice('Your reviewed card is ready. Anyone with its link can view it without an account.'); trackProductEvent('weekly_card_created', 'care'); } catch (err) { setError(err.message || 'Your card could not be created. The draft is still here.'); } finally { setBusy(false); } };
  return <div className="app-page growth-screen"><Link to="/care" className="app-text-button">Back to Care</Link><PageHeader eyebrow="The little things worth remembering" title="Their week, worth sharing" description="Choose a favourite photo and the moments you want to share. Your health records stay private." />{(error || petError) && <p role="alert" className="app-notice app-notice-error">{error || petError}</p>}{notice && <p role="status" className="app-notice">{notice}</p>}
    {!pet ? !petError && <PageLoading /> : <div className="growth-two-columns"><section className="app-panel"><h2 className="app-section-title">Make it theirs</h2><label className="app-field mt-5">A little caption<textarea className="app-input" rows={3} maxLength={280} value={draft.caption} disabled={busy} onChange={event => change({ caption: event.target.value })} placeholder="A sunny walk and a new favourite toy." /></label><label className="growth-upload mt-4">Choose a favourite photo<input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={event => photo(event.target.files?.[0])} /></label>{draft.photo && <button type="button" className="app-text-button" onClick={() => change({ photo: '' })}>Remove photo</button>}
      {!!milestones.length && <fieldset className="growth-stack mt-5"><legend className="app-section-title">Choose this week’s milestones</legend>{milestones.map(([id, event]) => <label className="growth-check" key={id}><input type="checkbox" checked={draft.milestoneIds.includes(id)} disabled={busy || (!draft.milestoneIds.includes(id) && draft.milestoneIds.length >= 5)} onChange={event => change({ milestoneIds: event.target.checked ? [...draft.milestoneIds, id] : draft.milestoneIds.filter(value => value !== id) })} />{event.title}</label>)}</fieldset>}
      <label className="growth-check mt-5"><input type="checkbox" checked={draft.includeCareCount} disabled={busy} onChange={event => change({ includeCareCount: event.target.checked })} />Include the number of care moments recorded this week</label><p className="app-caption mt-4">Your photo, caption and selected milestones will be public to anyone with the link. Only an optional care count is shared; routines, medical details and caregiver names are excluded.</p>
      <div className="app-form-actions"><button type="button" className="app-button" disabled={busy || !!url} onClick={publish}>{busy ? 'Preparing…' : url ? 'Card created' : 'Create reviewed share link'}</button></div>
      {url && <><label className="app-field mt-5">Weekly card link<input className="app-input" readOnly value={url} onFocus={event => event.target.select()} /></label><div className="growth-inline mt-4"><button className="app-button" type="button" disabled={busy} onClick={async () => { const result = await shareLink({ title: `${pet.name}’s week`, text: 'A little life together on Pawppy.', url }); setNotice(result); if (result && !result.startsWith('Select')) trackProductEvent('weekly_card_shared', 'care'); }}><Share2 size={17} />Share link</button><a href={url} target="_blank" rel="noreferrer" className="app-text-button">Open public card</a></div></>}
      <button className="app-text-button mt-4 mr-5" type="button" disabled={busy} onClick={async () => { setBusy(true); setError(''); try { const blob = await cardImage(card); const result = await shareLink({ title: `${pet.name}’s week`, files: [new File([blob], 'pawppy-week.png', { type: 'image/png' })] }); setNotice(result); if (result && !result.startsWith('Select')) trackProductEvent('weekly_card_shared', 'care'); } catch (err) { setError(err.message); } finally { setBusy(false); } }}><Share2 size={17} />Share card image</button>
      <button className="app-text-button mt-4" type="button" disabled={busy} onClick={async () => { setBusy(true); setError(''); try { const blob = await cardImage(card), href = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = href; link.download = 'pawppy-week.png'; link.click(); setTimeout(() => URL.revokeObjectURL(href), 1000); } catch (err) { setError(err.message); } finally { setBusy(false); } }}><Download size={17} />Download card image</button>
      <p className="app-caption mt-4">Your draft stays in this browser session. Downloading an image does not publish a link.</p>
    </section><div><WeekCard card={card} /></div></div>}
    {!!links.length && <section className="app-panel mt-6"><h2 className="app-section-title">Your recent shared cards</h2><p className="app-caption mt-3">Turn off a link whenever you like. Images someone already downloaded stay with them.</p>{links.map(item => <div className="family-member" key={item.token}><div><strong>Week ending {item.endDate}</strong><a className="app-text-button" href={`/week/${item.token}`} target="_blank" rel="noreferrer">View card</a></div><button className="app-text-button family-remove" onClick={() => { setError(''); setConfirm(item); }}>Turn off link</button></div>)}</section>}
    <Sheet open={!!confirm} onClose={() => setConfirm(null)} busy={busy} title="Turn off this weekly card?" description="Its shared link will stop displaying the card. Downloaded copies cannot be removed.">{error && <p role="alert" className="app-notice app-notice-error">{error}</p>}<div className="app-form-actions"><button className="app-text-button" disabled={busy} onClick={() => setConfirm(null)}>Keep sharing</button><button className="app-button app-button-danger" disabled={busy} onClick={async () => { setBusy(true); try { await callGrowth('revokeWeeklyCard', { token: confirm.token }); if (draft.published?.token === confirm.token) change({}); await refresh(); setConfirm(null); setNotice('Shared link turned off.'); } catch (err) { setError(err.message); } finally { setBusy(false); } }}>Turn off link</button></div></Sheet>
  </div>;
}

import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { onValue, ref } from 'firebase/database';
import { ArrowRight, Check, Copy, Plus, Share2, ShieldCheck, Users } from 'lucide-react';
import { shareLink } from '../../features/growth/growthService';
import { trackProductEvent } from '../../services/productAnalytics';
import { auth, database, functions } from '../../firebase';
import { EmptyState, PageHeader, PageLoading, Sheet } from '../UI/AppUI';

const call = async (name, data = {}) => (await httpsCallable(functions, name)(data)).data;
const roles = [
  { value: 'caregiver', label: 'Caregiver', detail: 'View routines and record care · 1 year' },
  { value: 'viewer', label: 'Viewer', detail: 'Follow along with view-only access · 1 year' },
  { value: 'sitter', label: 'Temporary sitter', detail: 'View and record care for 1–30 days' },
];
export default function Family() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [family, setFamily] = useState(null);
  const [access, setAccess] = useState({});
  const [role, setRole] = useState('caregiver');
  const [days, setDays] = useState(7);
  const [link, setLink] = useState('');
  const [inviting, setInviting] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const refresh = useCallback(async () => setFamily(await call('listCareFamily')), []);
  useEffect(() => {
    refresh().catch(() => setError('Shared care could not be loaded. Please try again.'));
    return onValue(ref(database, `careAccess/${auth.currentUser.uid}`), snapshot => setAccess(snapshot.val() || {}), () => setError('Shared care plans could not be loaded. Please try again.'));
  }, [refresh]);
  const run = async action => { setBusy(true); setError(''); setNotice(''); try { await action(); await refresh(); } catch (err) { setError(err.message || 'Could not update shared care.'); } finally { setBusy(false); } };
  const invite = event => { event?.currentTarget?.focus({ preventScroll: true }); setLink(''); setError(''); setInviting(true); };
  return <div className="app-page app-page-narrow">
    <PageHeader eyebrow="Your circle of care" title="Family" description="Their favourite people, looking after them together." action={<button className="app-button" onClick={invite}><Plus size={17} aria-hidden="true" />Invite</button>} />
    {error && !inviting && !confirm && <p role="alert" className="app-notice app-notice-error">{error}</p>}<p role="status" className="app-notice">{notice}</p>
    {params.get('invite') && <section className="app-panel family-invitation"><h2 className="app-section-title">You’ve been invited to shared care</h2><p className="app-caption mt-3">Accept to see this parent’s daily care plan. You can leave at any time.</p><div className="flex flex-wrap gap-3 mt-5"><button className="app-button" disabled={busy} onClick={() => run(async () => { const result = await call('acceptCareInvitation', { ownerId: params.get('owner'), token: params.get('invite') }); trackProductEvent('care_invitation_accepted', 'care'); setParams({}); navigate(`/today?family=${encodeURIComponent(result.ownerId)}`); })}>Accept invitation</button><button className="app-text-button" onClick={() => setParams({})}>Dismiss</button></div></section>}
    <section className="app-panel"><div className="app-section-top"><h2 className="app-section-title">Your care team</h2><Users size={21} className="text-stone-400" aria-hidden="true" /></div>
      {!family ? error ? <button onClick={() => run(refresh)} disabled={busy} className="app-button app-button-secondary">Try again</button> : <PageLoading label="Loading your care team…" /> : <>
        {!Object.keys(family.members || {}).length && <EmptyState icon={Users} title="Good care takes a little team" action={<button className="app-button" onClick={invite}>Invite a caregiver</button>}>Invite family or someone you trust. They’ll know what’s been done and where they can help.</EmptyState>}
        {Object.entries(family.members || {}).map(([id, member]) => <div key={id} className="family-member"><span className="family-avatar">{(member.displayName || 'C').slice(0,1)}</span><div><strong>{member.displayName}</strong><p>{member.role} · until {new Date(member.expiresAt).toLocaleDateString()}</p></div><button disabled={busy} className="app-text-button family-remove" onClick={() => setConfirm({ title: `Remove ${member.displayName}’s access?`, description: 'They will no longer be able to view or record care for your pets. Existing care records will stay in your history.', label: 'Remove access', action: async () => { await call('revokeCareAccess', { memberId: id }); setNotice('Caregiver access removed.'); } })}>Remove</button></div>)}
        {Object.entries(family.invitations || {}).map(([id, invitation]) => <div key={id} className="family-member"><span className="family-avatar"><Users size={18} /></span><div><strong>Invitation pending</strong><p>{invitation.role} · expires {new Date(invitation.expiresAt).toLocaleDateString()}</p></div><button disabled={busy} className="app-text-button family-remove" onClick={() => setConfirm({ title: 'Cancel this invitation?', description: 'The invitation link will stop working. You can create a new invitation at any time.', label: 'Cancel invitation', action: async () => { await call('revokeCareAccess', { invitationId: id }); setLink(''); setNotice('Invitation cancelled.'); } })}>Cancel</button></div>)}
      </>}
    </section>
    <div className="family-privacy"><ShieldCheck size={21} aria-hidden="true" /><p>Share the everyday. Keep the personal, personal.<span>Your team sees pet names, photos, routines, care updates and the instructions you choose to share. Medical records, expenses and private events stay with you.</span></p></div>
    <div className="app-action-list mt-6"><Link to="/family/handover" className="app-action-row"><span className="app-row-copy"><strong>Prepare a sitter handover</strong><small>Food, comfort notes and emergency contacts for your care team</small></span><ArrowRight size={17} /></Link></div><p className="app-section-label">Care plans shared with you</p><section className="app-panel">
      {!Object.keys(access).length && <p className="app-caption">When you accept an invitation, their care plan will appear here.</p>}
      {Object.entries(access).map(([id, entry]) => <div key={id} className="family-member"><span className="family-avatar">{(entry.displayName || 'C').slice(0,1)}</span><div><strong>{entry.displayName}’s pets</strong><p>{entry.role} · {entry.expiresAt > Date.now() ? 'Active' : 'Expired'}</p>{entry.expiresAt > Date.now() && <Link to={`/today?family=${id}`} className="app-text-button">Open Today <ArrowRight size={15} /></Link>}</div><button disabled={busy} className="app-text-button family-remove" onClick={() => setConfirm({ title: 'Leave this care plan?', description: 'You will need a new invitation to join again.', label: 'Leave plan', action: () => call('leaveCareFamily', { ownerId: id }) })}>Leave</button></div>)}
    </section>
    <Sheet open={inviting} onClose={() => setInviting(false)} busy={busy} title={link ? 'Your invitation is ready' : 'Invite a caregiver'} description={link ? 'Send this private link directly to someone you trust.' : 'Choose how they can help. You can remove access at any time.'}>
      {error && <p role="alert" className="app-notice app-notice-error">{error}</p>}
      {link ? <div><span className="app-empty-icon"><Check size={28} /></span><label className="app-field">Invitation link<input readOnly className="app-input" value={link} onFocus={event => event.target.select()} /></label><p className="app-caption my-4">This link can be used once and expires after 7 days. Anyone with the link can accept it.</p><button className="app-button w-full mb-3" onClick={async () => { const message = await shareLink({ title: 'Help care for our pets', text: 'Join my private care team on Pawppy.', url: link }); setNotice(message); if (message && !message.startsWith('Select')) trackProductEvent('care_invitation_shared', 'care'); }}><Share2 size={17} />Share invitation</button><button className="app-button app-button-secondary w-full" onClick={async () => { try { await navigator.clipboard.writeText(link); setNotice('Invitation link copied.'); trackProductEvent('care_invitation_shared', 'care'); setInviting(false); } catch { setError('Select the invitation link above and copy it.'); } }}><Copy size={17} />Copy invitation</button></div> : <form onSubmit={event => { event.preventDefault(); run(async () => { const invitation = await call('createCareInvitation', { role, days }); setLink(`${window.location.origin}/invite/${encodeURIComponent(invitation.ownerId)}/${invitation.token}`); }); }}>
        <fieldset className="family-role-options"><legend className="sr-only">Access</legend>{roles.map(item => <label key={item.value}><input type="radio" name="caregiver-role" value={item.value} checked={role === item.value} onChange={() => setRole(item.value)} /><span><strong>{item.label}</strong><small>{item.detail}</small></span></label>)}</fieldset>
        {role === 'sitter' && <label className="app-field mt-5">Days of access<input type="number" min={1} max={30} required className="app-input" value={days} onChange={event => setDays(Number(event.target.value))} /></label>}
        <p className="app-caption mt-5">Access starts when they accept. Invitations are private links that can be used once and expire after 7 days.</p><div className="app-form-actions"><button className="app-button" disabled={busy}>{busy ? 'Creating…' : 'Create invitation link'}</button></div>
      </form>}
    </Sheet>
    <Sheet open={!!confirm} onClose={() => setConfirm(null)} busy={busy} title={confirm?.title} description={confirm?.description}>{error && <p role="alert" className="app-notice app-notice-error">{error}</p>}<div className="app-form-actions"><button className="app-text-button" disabled={busy} onClick={() => setConfirm(null)}>Keep access</button><button className="app-button app-button-danger" disabled={busy} onClick={() => run(async () => { await confirm.action(); setConfirm(null); })}>{busy ? 'Updating…' : confirm?.label}</button></div></Sheet>
  </div>;
}

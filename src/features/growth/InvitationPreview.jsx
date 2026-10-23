import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PawPrint, Users } from 'lucide-react';
import { auth } from '../../firebase';
import { EmptyState, PageLoading } from '../../components/UI/AppUI';
import { callGrowth, joinLink } from './growthService';
export default function InvitationPreview() {
  const { ownerId, token } = useParams();
  const [preview, setPreview] = useState(undefined), [error, setError] = useState(''), [user, setUser] = useState(auth.currentUser), [attempt, setAttempt] = useState(0);
  useEffect(() => auth.onAuthStateChanged(setUser), []);
  useEffect(() => { let active = true; callGrowth('previewCareInvitation', { ownerId, token }).then(value => { if (active) setPreview(value); }).catch(() => { if (active) setError('This invitation could not be loaded. Please try again.'); }); return () => { active = false; }; }, [ownerId, token, attempt]);
  const next = `/family?owner=${encodeURIComponent(ownerId)}&invite=${encodeURIComponent(token)}`;
  const verified = user && (user.emailVerified || !user.providerData.some(provider => provider.providerId === 'password'));
  return <div className="app-page app-page-narrow growth-screen shared-public"><Link to="/" className="app-wordmark"><PawPrint />pawppy</Link>{error ? <p role="alert" className="app-notice app-notice-error mt-6">{error}<button className="app-text-button" onClick={() => { setError(''); setAttempt(value => value + 1); }}>Try again</button></p> : preview === undefined ? <PageLoading label="Opening your invitation…" /> : !preview ? <EmptyState icon={Users} title="This invitation is no longer available">Ask the pet parent for a fresh invitation link.</EmptyState> : <section className="app-panel mt-6"><span className="app-empty-icon"><Users size={28} /></span><h1>{preview.ownerName} invited you to help with care</h1><p className="app-page-description">{preview.role === 'viewer' ? 'View the daily care plan and shared instructions.' : 'View their daily plan, record care, and share a note or photo after a routine.'}</p><div className="app-notice mt-5">{preview.role === 'sitter' ? `${preview.accessDays} days of access after accepting` : 'Access lasts up to one year'} · You can leave at any time.</div><p className="app-caption">Only the owner’s shared care information becomes available after you accept. Private medical records, expenses and private events stay with the owner.</p><div className="growth-inline mt-6"><Link className="app-button" to={verified ? next : joinLink('family', next)}>{verified ? 'Review invitation' : 'Create an account to join'}</Link>{!verified && <Link className="app-text-button" to={`/login?source=family&next=${encodeURIComponent(next)}`}>Already a member? Sign in</Link>}</div></section>}</div>;
}

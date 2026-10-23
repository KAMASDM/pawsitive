import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Mail, PawPrint, Phone, Share2 } from 'lucide-react';
import { EmptyState, PageLoading } from '../../components/UI/AppUI';
import { callGrowth, joinLink, shareLink } from './growthService';
import { WeekCard } from './WeeklyCard';

export default function PublicSharedPage({ kind }) {
  const { token } = useParams();
  const [card, setCard] = useState(undefined), [error, setError] = useState(''), [notice, setNotice] = useState(''), [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    const load = async () => { try { const value = await callGrowth(kind === 'safety' ? 'getSafetyCard' : 'getWeeklyCard', { token }); if (active) { setCard(value); setError(''); } } catch { if (active) setError('This card could not be loaded. Check your connection and try again.'); } };
    load(); const timer = setInterval(load, 30000); window.addEventListener('focus', load);
    return () => { active = false; clearInterval(timer); window.removeEventListener('focus', load); };
  }, [token, kind, attempt]);
  return <div className="app-page app-page-narrow growth-screen shared-public"><Link to="/" className="app-wordmark"><PawPrint />pawppy</Link>
    {error && <div role="alert" className="app-notice app-notice-error mt-6">{error}<button className="app-text-button" onClick={() => setAttempt(value => value + 1)}>Try again</button></div>}{card === undefined ? !error && <PageLoading label="Opening their card…" /> : !card ? <EmptyState title="This card is no longer available">Their parent may have turned off sharing or removed this card.</EmptyState> : <>
      {kind === 'safety' ? <section className="app-panel safety-public-card"><span className="app-eyebrow">Let’s get them home</span>{card.image && <img src={card.image} alt={card.name} className="growth-pet-photo" />}<h1>Have you found {card.name}?</h1><p className="app-caption mt-3">{[card.type, card.breed].filter(Boolean).join(' · ')}</p>{card.message && <p className="growth-finder-message">{card.message}</p>}<h2 className="app-section-title mt-6">Contact {card.contactName || 'their parent'}</h2><div className="growth-stack mt-4">{card.phone && <a className="app-button" href={`tel:${card.phone.replace(/[^+\d]/g, '')}`}><Phone size={18} />Call {card.phone}</a>}{card.email && <a className="app-button app-button-secondary" href={`mailto:${card.email}`}><Mail size={18} /><span className="growth-wrap">Email their parent</span></a>}</div><p className="app-caption mt-5">Contact details were chosen by this pet’s parent. No account is needed to get in touch.</p></section> : <div className="mt-6"><WeekCard card={card} /></div>}
      <div className="growth-inline my-5"><button type="button" className="app-text-button" onClick={async () => setNotice(await shareLink({ title: kind === 'safety' ? `${card.name}’s safety card` : `${card.name}’s week`, url: window.location.href }))}><Share2 size={17} />Share this card</button></div>{notice && <p role="status" className="app-notice">{notice}</p>}
      <section className="growth-public-cta"><PawPrint size={25} /><h2>A little care for your own pet</h2><p>Keep routines, records and their favourite moments together.</p><Link to={joinLink(kind)} className="app-button">Create my pet’s space</Link><Link to="/" className="app-text-button">Explore Pawppy</Link></section>
    </>}
  </div>;
}

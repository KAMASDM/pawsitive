import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bell, Heart, MapPin, PawPrint, Plus, ShieldPlus, Sparkles, Users, Camera, Stethoscope } from 'lucide-react';
import companions from '../../assets/landing/pawppy-companions-v2.webp';
import CheckForUpdatesButton from '../PWA/CheckForUpdatesButton';
import './Today.css';

function PetPhoto({ pet }) {
  const [failed, setFailed] = useState(false);
  return pet.image && !failed ? <img src={pet.image} alt={pet.name} onError={() => setFailed(true)} /> : <span className="today-pet-placeholder"><PawPrint size={34} aria-hidden="true" /></span>;
}

const shortcuts = [
  { to: '/care', icon: ShieldPlus, title: 'Health & care', detail: 'Their records, together', color: 'violet' },
  { to: '/resource', state: { category: 'all', subCategory: 'Health & Wellness' }, icon: Stethoscope, title: 'Find a vet', detail: 'Explore care resources', color: 'rose' },
  { to: '/place-tagging', icon: MapPin, title: 'Pet-friendly places', detail: 'Find your next outing', color: 'mint' },
  { to: '/family', icon: Users, title: 'Family care', detail: 'Share the everyday', color: 'peach' },
];

export default function TodayWelcome({ user, now, timeZone, pets, filter, onFilter, ready, isShared, onStart }) {
  const hour = Number(new Intl.DateTimeFormat('en', { timeZone, hour: 'numeric', hourCycle: 'h23' }).format(now));
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = (user.displayName || '').trim().split(/\s+/)[0];
  return <>
    <header className="today-welcome-bar">
      <div><p className="today-eyebrow">YOUR EVERYDAY, TOGETHER</p><p className="today-greeting">{greeting}{firstName && !isShared ? `, ${firstName}` : ''}</p><p className="today-date">{new Intl.DateTimeFormat('en', { timeZone, weekday: 'long', month: 'short', day: 'numeric' }).format(now)}</p></div>
      <div className="today-header-actions"><CheckForUpdatesButton compact /><Link to="/settings" aria-label="Reminder settings" className="today-icon-link"><Bell size={20} /></Link></div>
    </header>
    <section className="today-hero">
      <div className="today-hero-copy"><span className="today-hero-kicker"><PawPrint size={15} /> A little love. A little care.</span><h1>Happy pets.<br />Happy you.</h1><p>Healthy routines, happy adventures, and everything in between.</p><button type="button" onClick={onStart} className="today-hero-button">{pets.length ? 'See today’s care' : 'Meet your pet’s new home'} <ArrowRight size={17} /></button></div>
      <div className="today-hero-art"><img src={companions} alt="A golden retriever and a ginger cat, ready for a day together" /><span className="today-hero-note"><Heart size={16} fill="currentColor" /> More happy moments</span></div>
      <PawPrint className="today-hero-paw" size={95} aria-hidden="true" />
    </section>
    {ready && pets.length > 0 && <section className="today-pets" aria-label="Your pets">
      <div className="today-section-heading"><div><h2>{isShared ? 'Your care companions' : 'Your little family'} <span>{pets.length}</span></h2><p>Tap a pet to see their day.</p></div>{!isShared && <Link to="/my-pets?picker=true">Manage pets <ArrowRight size={15} /></Link>}</div>
      <div className="today-pet-strip">
        <button type="button" className={`today-all-pets ${!filter ? 'is-selected' : ''}`} aria-pressed={!filter} onClick={() => onFilter('')}><span><PawPrint size={28} /></span><strong>Everyone</strong><small>All daily routines</small></button>
        {pets.map(([id, pet]) => <button type="button" key={id} className={`today-pet-card ${filter === id ? 'is-selected' : ''}`} aria-label={`Show ${pet.name}’s routines`} aria-pressed={filter === id} onClick={() => onFilter(id)}><div className="today-pet-photo"><PetPhoto pet={pet} /><span>{pet.type || 'Pet'}</span></div><div className="today-pet-caption"><div><strong>{pet.name}</strong><small>{pet.breed || 'Your daily dose of joy'}</small></div><ArrowRight size={16} /></div></button>)}
        {!isShared && <Link to="/profile" className="today-add-pet"><Plus size={24} /><span>Add a pet</span></Link>}
      </div>
    </section>}
    {!isShared && <nav className="today-shortcuts" aria-label="Pet care shortcuts">{shortcuts.map(({ to, state, icon: Icon, title, detail, color }) => <Link key={to} to={to} state={state} className={`today-shortcut today-${color}`}><span className="today-shortcut-icon"><Icon size={23} /></span><span><strong>{title}</strong><small>{detail}</small></span><ArrowRight size={16} className="today-shortcut-arrow" /></Link>)}</nav>}
  </>;
}

export function TodayDiscover() {
  return <section className="today-discover"><div className="today-section-heading"><div><p className="today-eyebrow">BEYOND THE EVERYDAY</p><h2>A little more to explore</h2></div><Link to="/discover">Discover <ArrowRight size={15} /></Link></div><div className="today-discover-grid">
    <Link to="/challenge" className="today-discover-card today-violet"><Camera size={27} /><div><h3>Show their best side</h3><p>Join the photo challenge. Every pet has a moment worth sharing.</p></div><ArrowRight size={19} /></Link>
    <Link to="/adopt-pets" className="today-discover-card today-peach"><Heart size={27} /><div><h3>Make room for love</h3><p>Meet pets looking for a family and explore adoption.</p></div><ArrowRight size={19} /></Link>
    <Link to="/quiz" className="today-discover-card today-mint"><Sparkles size={27} /><div><h3>Curious pet parent?</h3><p>Try a pet-care quiz and learn something new together.</p></div><ArrowRight size={19} /></Link>
  </div></section>;
}

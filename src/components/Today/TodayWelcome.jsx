import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, PawPrint } from 'lucide-react';
import { PageHeader, PetAvatar } from '../UI/AppUI';
import './Today.css';

export default function TodayWelcome({ user, now, timeZone, pets, filter, onFilter, ready, isShared }) {
  const hour = Number(new Intl.DateTimeFormat('en', { timeZone, hour: 'numeric', hourCycle: 'h23' }).format(now));
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = (user.displayName || '').trim().split(/\s+/)[0];
  const date = new Intl.DateTimeFormat('en', { timeZone, weekday: 'long', month: 'long', day: 'numeric' }).format(now);
  return <>
    <PageHeader eyebrow={date} title="Today" description={`${greeting}${firstName && !isShared ? `, ${firstName}` : ''}. ${pets.length ? 'A little care goes a long way.' : 'Let’s make a little room for your pet.'}`} />
    {ready && pets.length > 0 && <section className="today-pets" aria-label="Your pets">
      <div className="today-pets-label"><h2>{isShared ? 'Your care companions' : 'Your pets'}</h2>{!isShared && <Link to="/my-pets?picker=true">Manage <ChevronRight size={15} aria-hidden="true" /></Link>}</div>
      <div className="today-pet-strip" role="group" aria-label="Filter care by pet">
        <button type="button" className="today-pet-filter" aria-pressed={!filter} onClick={() => onFilter('')}><span className="pet-avatar"><PawPrint size={23} aria-hidden="true" /></span><span>Everyone</span></button>
        {pets.map(([id, pet]) => <button type="button" key={id} className="today-pet-filter" aria-label={`Show ${pet.name}’s routines`} aria-pressed={filter === id} onClick={() => onFilter(id)}><PetAvatar pet={pet} /><span>{pet.name}</span></button>)}
      </div>
    </section>}
  </>;
}

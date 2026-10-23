import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { onValue, ref } from 'firebase/database';
import { CalendarHeart, FileHeart, FileUp, PawPrint, Plus, Settings2, ShieldCheck, Share2, Sparkles } from 'lucide-react';
import { auth, database } from '../../firebase';
import { ActionRow, EmptyState, PageHeader, PageLoading, PetAvatar } from '../UI/AppUI';

export default function CareHome() {
  const [pets, setPets] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => onValue(ref(database, `userPets/${auth.currentUser.uid}`), snapshot => setPets(snapshot.val() || {}), () => setError('Your pet records could not be loaded. Please reload.')), []);
  return <div className="app-page">
    <PageHeader eyebrow="A little peace of mind" title="Care" description="Their records, their little milestones. All in one place." action={<Link to="/my-pets?picker=true" className="app-text-button">Manage pets</Link>} />
    {error && <p role="alert" className="app-notice app-notice-error">{error}</p>}
    {!pets ? !error && <PageLoading label="Loading your pets…" /> : !Object.keys(pets).length ? <section className="app-panel"><EmptyState title="Their story starts here" action={<Link to="/today" className="app-button"><Plus size={17} />Add your first pet</Link>}>Add your pet to keep their health records and daily care close.</EmptyState></section> : <div className="care-pet-grid">{Object.entries(pets).map(([id, pet]) => <section key={id} className="care-pet-panel">
      <header><PetAvatar pet={pet} /><div><h2>{pet.name}</h2><p>{[pet.type, pet.breed].filter(Boolean).join(' · ')}</p></div></header>
      <ActionRow to={`/pet-details/${id}`} icon={FileHeart} title="Health & records" detail="Vaccinations, weight & expenses" />
      <ActionRow to={`/care/${id}/visit`} icon={CalendarHeart} title="Prepare for a vet visit" detail="Bring the important details together" />
      <ActionRow to={`/copilot?pet=${encodeURIComponent(id)}`} icon={Sparkles} title="Understand their records" detail="Optional AI summary for you to review" />
      <ActionRow to={`/my-pets/${id}`} icon={PawPrint} title="Profile & memories" />
      <div className="growth-care-tools"><p className="app-section-label">A little more for {pet.name}</p>
        <ActionRow to={`/care/${id}/import`} icon={FileUp} title="Read a vaccination card" detail="Import, review and save" />
        <ActionRow to={`/care/${id}/safety`} icon={ShieldCheck} title="QR safety card" detail="Help a finder contact you" />
        <ActionRow to={`/care/${id}/week`} icon={Share2} title="Share their week" detail="A favourite photo & little milestones" />
        <ActionRow to={`/care/${id}/start`} icon={Sparkles} title="Care starter plan" detail="A few routines to make your own" />
      </div>
    </section>)}</div>}
    <p className="app-section-label">Everyday essentials</p><div className="app-action-list"><ActionRow to="/today?add=1" icon={Plus} title="Add a daily routine" detail="Make room for the little things" /><ActionRow to="/settings" icon={Settings2} title="Reminder preferences" detail="Choose when and how to hear from us" /></div>
  </div>;
}

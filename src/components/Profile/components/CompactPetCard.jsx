import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { PetAvatar, Sheet } from '../../UI/AppUI';

export default function CompactPetCard({ pet, onEditPet, onDeletePet }) {
  const [options, setOptions] = useState(false);
  return <article className="profile-pet-card">
    <div className="profile-pet-heading"><PetAvatar pet={pet} /><div><h3>{pet.name || 'Your pet'}</h3><p>{[pet.type, pet.breed].filter(Boolean).join(' · ')}</p></div><button type="button" className="app-icon-button" aria-label={`Options for ${pet.name || 'pet'}`} onClick={() => setOptions(true)}><MoreHorizontal size={21} /></button></div>
    <div className="profile-pet-actions"><Link to={`/my-pets/${pet.id}`} state={{ openHealthCenter: true }}>Care & profile <ChevronRight size={16} aria-hidden="true" /></Link>{pet.slug ? <Link to={`/pet/${pet.slug}`}>View shared profile <ChevronRight size={16} aria-hidden="true" /></Link> : <button type="button" onClick={() => onEditPet(pet)}>Edit details <Pencil size={15} aria-hidden="true" /></button>}</div>
    <Sheet open={options} onClose={() => setOptions(false)} title={`${pet.name || 'Pet'}’s profile`} description="Manage their details and community availability."><div className="profile-pet-options"><button className="app-action-row" onClick={() => { setOptions(false); onEditPet(pet); }}><Pencil size={19} /><span className="app-row-copy"><strong>Edit pet details</strong><small>Profile, privacy and adoption or mating availability</small></span><ChevronRight size={17} /></button><button className="app-action-row family-remove" onClick={() => { setOptions(false); onDeletePet?.(pet.id); }}><Trash2 size={19} /><span className="app-row-copy"><strong>Delete pet</strong><small>You’ll be asked to confirm before deletion.</small></span></button></div></Sheet>
  </article>;
}

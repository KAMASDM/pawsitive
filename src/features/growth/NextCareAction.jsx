import React from 'react';
import { FileUp, Sparkles } from 'lucide-react';
import { ActionRow } from '../../components/UI/AppUI';
export default function NextCareAction({ pets, routines, filter }) {
  const entries = Object.entries(pets).filter(([id]) => !filter || id === filter);
  if (!entries.length) return null;
  const withoutRoutine = entries.find(([id]) => !Object.values(routines).some(routine => routine.petId === id));
  const withoutRecords = entries.find(([, pet]) => !Object.keys(pet.vaccinations || {}).length);
  const [id, pet] = withoutRoutine || withoutRecords || entries[0];
  return <section aria-label="Your next little step"><p className="app-section-label !mt-0">Your next little step</p><div className="app-action-list"><ActionRow to={`/care/${id}/${withoutRoutine ? 'start' : withoutRecords ? 'import' : 'week'}`} icon={withoutRecords && !withoutRoutine ? FileUp : Sparkles} title={withoutRoutine ? `Start ${pet.name}’s daily rhythm` : withoutRecords ? 'Bring their vaccination card' : 'A week worth remembering'} detail={withoutRoutine ? 'Choose a few editable routines' : withoutRecords ? 'Read a card, then review the details' : 'Make a share card with the moments you choose'} /></div></section>;
}

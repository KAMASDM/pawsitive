import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { onValue, ref } from 'firebase/database';
import { Download, Printer } from 'lucide-react';
import { auth, database } from '../../firebase';

const values = value => value && typeof value === 'object' ? Object.values(value).filter(item => item && typeof item === 'object') : [];
const text = value => typeof value === 'string' || typeof value === 'number' ? String(value) : 'Not recorded';
const lines = (label, items) => [label, ...(items.length ? items : ['Not recorded']), ''];
export function buildBrief(pet, questions, date) {
  return [
    `PAWPPY · VISIT PREPARATION · ${date}`, `${text(pet.name)} · ${text(pet.type)} · ${text(pet.breed)}`, `Date of birth: ${text(pet.dateOfBirth)}`, '',
    'Parent-entered records, for review with your veterinarian. This is not a clinical assessment.', '',
    ...lines('QUESTIONS FOR THE VISIT', [questions.trim() || 'Add questions before your visit.']),
    ...lines('SAVED MEDICATIONS — VERIFY CURRENT INSTRUCTIONS', values(pet.medications).map(item => `${text(item.name)} · dose: ${text(item.dosage)} · frequency: ${text(item.frequency)} · next saved date: ${text(item.nextDose)}${item.active === false ? ' · marked inactive' : ''}\nNotes: ${text(item.notes)}`)),
    ...lines('VACCINATION RECORDS', values(pet.vaccinations).map(item => `${text(item.name)} · given: ${text(item.date)} · next saved date: ${text(item.nextDue)}`)),
    ...lines('RECORDED CONDITIONS & ALLERGIES', [...(Array.isArray(pet.medicalConditions) ? pet.medicalConditions.map(text) : []), ...(Array.isArray(pet.medical?.conditions) ? pet.medical.conditions.map(text) : []), ...(Array.isArray(pet.medical?.allergies) ? pet.medical.allergies.map(item => `Allergy: ${text(item)}`) : [])]),
    ...lines('RECENT WEIGHT ENTRIES', values(pet.weightHistory).sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 10).map(item => `${text(item.date)} · ${text(item.weight)} kg · ${text(item.notes)}`)),
    ...lines('NOTES', [text(pet.notes)]),
    'Review the saved dates and instructions against the original records before sharing.',
  ].join('\n');
}

export default function CareBrief() {
  const { petId } = useParams();
  const [pet, setPet] = useState(null);
  const [questions, setQuestions] = useState('');
  const [error, setError] = useState('');
  useEffect(() => onValue(ref(database, `userPets/${auth.currentUser.uid}/${petId}`), snapshot => { setPet(snapshot.val()); if (!snapshot.exists()) setError('This pet record is unavailable.'); }, () => setError('The record could not be loaded. Please try again.')), [petId]);
  const brief = pet ? buildBrief(pet, questions, new Date().toLocaleDateString()) : '';
  const download = () => {
    const url = URL.createObjectURL(new Blob([brief], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'pawppy-visit-preparation.txt'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <div className="max-w-4xl mx-auto px-4 py-10 pb-32"><div className="print:hidden"><Link to="/care" className="text-violet-700 underline">Back to Care</Link><h1 className="text-3xl font-bold mt-5">Make the next visit easier.</h1><p className="text-slate-600 mt-3">Review your saved records, add questions, then print or download a copy. This export contains private care information. Questions stay on this page until you leave.</p>{error && <p role="alert" className="text-red-800 mt-4">{error}</p>}{pet && <><label className="block mt-6 font-semibold">Questions for your veterinarian<textarea rows={4} maxLength={4000} className="block w-full border rounded-xl p-3 mt-2 font-normal" value={questions} onChange={event => setQuestions(event.target.value)} placeholder="What would you like to ask at the appointment?" /></label><div className="flex flex-wrap gap-3 my-6"><button onClick={download} className="flex items-center gap-2 px-5 py-3 bg-violet-700 text-white rounded-xl"><Download size={18} /> Download reviewed summary</button><button onClick={() => window.print()} className="flex items-center gap-2 px-5 py-3 bg-white border border-violet-200 rounded-xl"><Printer size={18} /> Print / save as PDF</button><Link to={`/pet-details/${petId}`} className="px-5 py-3 text-violet-700 underline">Correct a record</Link></div></>}</div>{pet ? <pre className="whitespace-pre-wrap break-words rounded-2xl bg-white border p-5 sm:p-8 text-sm leading-relaxed font-sans">{brief}</pre> : !error && <p>Loading saved records…</p>}<style>{'@media print { header, footer, nav, [class*="fixed"], .print\\:hidden { display: none !important; } main { padding: 0 !important; } pre { border: none !important; } }'}</style></div>;
}

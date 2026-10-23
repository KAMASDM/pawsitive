import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { onValue, ref } from 'firebase/database';
import { ArrowUpRight, Search } from 'lucide-react';
import { auth, database } from '../../firebase';
import { Sheet } from '../UI/AppUI';

let openSearch = null;
export const triggerSearch = event => { event?.currentTarget?.focus({ preventScroll: true }); openSearch?.(); };
const QUICK_LINKS = [
  { label: 'Today’s care', detail: 'Daily routines for your pets', path: '/today', keywords: 'routine complete water meal' },
  { label: 'Care records', detail: 'Health, weight and expenses', path: '/care', keywords: 'health vaccination medication vet' },
  { label: 'Sitter handover', detail: 'Shared instructions and emergency contacts', path: '/family/handover', keywords: 'sitter handover feeding instructions emergency' },
  { label: 'Family care', detail: 'Caregivers and shared plans', path: '/family', keywords: 'invite family sitter' },
  { label: 'Places & services', detail: 'Find vets, stores and services', path: '/resource', keywords: 'vet resource groomer store' },
  { label: 'Shop', detail: 'Browse pet products', path: '/shop', keywords: 'shop market food toys treats' },
  { label: 'Seller Studio', detail: 'Apply or manage your store', path: '/shop/seller', keywords: 'seller vendor business' },
  { label: 'Breeding connections', detail: 'Profiles available for mating', path: '/nearby-mates', keywords: 'mate mating nearby' },
  { label: 'Adoption', detail: 'Meet pets looking for a family', path: '/adopt-pets', keywords: 'adopt adoption' },
  { label: 'Lost & found', detail: 'Report or browse lost pets', path: '/lost-and-found', keywords: 'lost found report' },
  { label: 'Photo challenges', detail: 'Share a favourite moment', path: '/challenge', keywords: 'challenge photo contest' },
  { label: 'Pet quizzes', detail: 'Learn something new', path: '/quiz', keywords: 'quiz trivia' },
  { label: 'Notifications', detail: 'Reminders and alerts', path: '/notifications', keywords: 'notifications reminders alerts inbox' },
  { label: 'Settings', detail: 'Reminders, privacy and app updates', path: '/settings', keywords: 'settings update preferences privacy' },
];
export default function GlobalSearch() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [pets, setPets] = useState([]);
  const [user, setUser] = useState(auth.currentUser);
  useEffect(() => { openSearch = () => setOpen(true); return () => { openSearch = null; }; }, []);
  useEffect(() => {
    const onKeyDown = event => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setOpen(true); } };
    window.addEventListener('keydown', onKeyDown); return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
  useEffect(() => onAuthStateChanged(auth, setUser), []);
  useEffect(() => {
    if (!user) { setPets([]); return; }
    return onValue(ref(database, `userPets/${user.uid}`), snapshot => setPets(Object.entries(snapshot.val() || {}).map(([id, pet]) => ({ petId: id, label: pet.name || 'Pet', detail: [pet.breed, pet.type].filter(Boolean).join(' · ') || 'Pet profile', path: `/my-pets/${id}`, keywords: `${pet.name || ''} ${pet.breed || ''}` }))), () => setPets([]));
  }, [user]);
  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    const tools = term ? pets.flatMap(pet => [
      { label: `${pet.label}’s safety card`, detail: 'QR contact card for a finder', path: `/care/${pet.petId}/safety`, keywords: 'qr safety collar contact found' },
      { label: `Read ${pet.label}’s vaccination card`, detail: 'Import and review records', path: `/care/${pet.petId}/import`, keywords: 'import scan upload vaccine vaccination record' },
      { label: `${pet.label}’s care starter plan`, detail: 'Choose a few daily routines', path: `/care/${pet.petId}/start`, keywords: 'starter routine plan' },
      { label: `${pet.label}’s weekly card`, detail: 'A photo and milestones to share', path: `/care/${pet.petId}/week`, keywords: 'share week photo memories' },
    ]) : [];
    const all = [...pets, ...tools, ...QUICK_LINKS];
    return (term ? all.filter(item => `${item.label} ${item.detail} ${item.keywords}`.toLowerCase().includes(term)) : all).slice(0, term ? 10 : 7);
  }, [pets, query]);
  const close = () => { setOpen(false); setQuery(''); };
  return <Sheet open={open} onClose={close} title="Search Pawppy" className="app-search-sheet">
    <label className="app-search-field"><Search size={20} aria-hidden="true" /><input data-sheet-autofocus aria-label="Search pets and features" value={query} onChange={event => setQuery(event.target.value)} placeholder="Pets, care, places…" autoComplete="off" /></label>
    <p className="app-section-label">{query ? `${results.length} ${results.length === 1 ? 'result' : 'results'}` : 'Your pets & quick links'}</p>
    <div className="app-search-results">{results.length ? results.map(item => <button type="button" key={item.path} className="app-action-row" onClick={() => { close(); navigate(item.path); }}><span className="app-row-copy"><strong>{item.label}</strong><small>{item.detail}</small></span><ArrowUpRight size={17} className="app-chevron" aria-hidden="true" /></button>) : <p className="app-caption py-8 text-center">No matches yet. Try a pet’s name or “care”.</p>}</div>
  </Sheet>;
}

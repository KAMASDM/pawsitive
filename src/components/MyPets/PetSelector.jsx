import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { get, ref } from 'firebase/database';
import { Compass, FileHeart, Heart, MapPin, Plus, Search, Users, BookOpen, Award, ChevronRight } from 'lucide-react';
import { auth, database } from '../../firebase';
import { readPetDirectorySnapshot } from '../../services/profileData';
import { usePetOperations } from '../../hooks/usePetOperations';
import { PetDialog, VaccinationDialog } from '../Profile/components';
import { ActionRow, EmptyState, PageHeader, PageLoading, PetAvatar, Sheet } from '../UI/AppUI';
import CompactPetCard from '../Profile/components/CompactPetCard';
import OnboardingChecklist from './OnboardingChecklist';

const features = [
  ['/nearby-mates', MapPin, 'Explore map', 'Find pets near you'],
  ['/place-tagging', Compass, 'Tag a place', 'Share a pet-friendly spot'],
  ['/lost-and-found', Search, 'Lost & found', 'Report or search for a pet'],
  ['/adopt-pets', Heart, 'Adopt a pet', 'Help them find their people'],
  ['/resource', BookOpen, 'Places & services', 'Vets, groomers & everyday essentials'],
  ['/nearby-mates', Users, 'Breeding connections', 'Pets available for mating'],
  ['/activity', Award, 'My activity', 'Challenges & quizzes'],
];

export default function PetSelector() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isPicker = searchParams.get('picker') === 'true';
  const user = auth.currentUser;
  const [pets, setPets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletePet, setDeletePet] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [discoveryPets, setDiscoveryPets] = useState([]);
  const petOps = usePetOperations(pets, setPets);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setIsLoading(true);
    setError('');
    get(ref(database, `userPets/${user.uid}`)).then(snapshot => {
      if (!active) return;
      const list = Object.entries(snapshot.val() || {}).map(([id, pet]) => ({ ...pet, id }));
      setPets(list);
      if (!isPicker && list.length) {
        const lastId = localStorage.getItem('pawppy_last_pet_id');
        navigate(`/my-pets/${(list.find(pet => pet.id === lastId) || list[0]).id}`, { replace: true });
      }
    }).catch(() => {
      if (active) setError('Your pets could not be loaded. Please try again.');
    }).finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [user, isPicker, navigate, loadAttempt]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    readPetDirectorySnapshot().then(snapshot => {
      const found = [];
      for (const [ownerId, records] of Object.entries(snapshot.val() || {})) {
        if (ownerId === user.uid) continue;
        for (const [id, pet] of Object.entries(records)) {
          if (pet.slug && !pet.privacy?.isPrivate) found.push({ ...pet, id, ownerId });
          if (found.length >= 12) break;
        }
        if (found.length >= 12) break;
      }
      if (active) setDiscoveryPets(found);
    }).catch(() => {});
    return () => { active = false; };
  }, [user]);

  const openHealthRecordSetup = () => {
    const pet = pets.find(pet => !(pet.vaccinations || []).length) || pets[0];
    if (pet) petOps.handleEditPet(pet, ['dog', 'cat'].includes(pet.type?.toLowerCase()) ? 'vaccinations' : 'basic');
    else petOps.handleAddPet();
  };

  return (
    <div className="app-page manage-pets-page">
      <PageHeader eyebrow="Your little family" title="Manage pets" description="Their details, care and memories. A place for every pet." action={<button type="button" className="app-button" onClick={petOps.handleAddPet}><Plus size={18} aria-hidden="true" />Add pet</button>} />
      {error && <div role="alert" className="app-notice app-notice-error">{error} <button type="button" className="app-text-button" onClick={() => setLoadAttempt(value => value + 1)}>Try again</button></div>}
      {isLoading ? <PageLoading label="Loading your pets…" /> : !error && <>
        {pets.length ? <section aria-labelledby="managed-pets-heading">
          <div className="app-section-top"><h2 id="managed-pets-heading" className="app-section-title">My pets <span className="app-caption">({pets.length})</span></h2><Link to="/care" className="app-text-button"><FileHeart size={17} />Care records</Link></div>
          <div className="manage-pets-grid">{pets.map(pet => <CompactPetCard key={pet.id} pet={pet} onEditPet={petOps.handleEditPet} onDeletePet={id => setDeletePet(pets.find(pet => pet.id === id))} />)}</div>
        </section> : <section className="app-panel"><EmptyState title="Their story starts here" action={<button type="button" className="app-button" onClick={petOps.handleAddPet}><Plus size={17} />Add your first pet</button>}>Keep their health records, favourite moments and everyday details together.</EmptyState></section>}
        <div className="manage-pets-setup"><OnboardingChecklist pets={pets} onAddPet={petOps.handleAddPet} onAddHealthRecord={openHealthRecordSetup} onEditProfile={() => pets.length ? petOps.handleEditPet(pets[0]) : petOps.handleAddPet()} onEnableNotifications={() => navigate('/settings')} /></div>
      </>}
      {discoveryPets.length > 0 && <section className="manage-pets-discovery" aria-labelledby="discover-pets-heading"><div className="app-section-top"><h2 id="discover-pets-heading" className="app-section-title">Discover pets</h2><Link to="/nearby-mates" className="app-text-button">See all<ChevronRight size={16} /></Link></div><div className="manage-pets-strip">{discoveryPets.map(pet => <Link key={`${pet.ownerId}-${pet.id}`} to={`/pet/${pet.slug}`} className="manage-pets-neighbour"><PetAvatar pet={pet} /><strong>{pet.name}</strong><small>{pet.breed || pet.type}</small></Link>)}</div></section>}
      <section className="manage-pets-explore" aria-labelledby="pet-explore-heading"><div className="app-section-top"><h2 id="pet-explore-heading" className="app-section-title">Explore together</h2><Link to="/discover" className="app-text-button">Discover<ChevronRight size={16} /></Link></div><div className="manage-pets-links">{features.map(([to, icon, title, detail]) => <ActionRow key={title} to={to} icon={icon} title={title} detail={detail} />)}</div></section>
      <div className="manage-pets-about"><ActionRow to="/about-us" icon={Heart} title="About Pawppy" detail="A little more about the care we share" /></div>
      <Sheet open={Boolean(deletePet)} onClose={() => setDeletePet(null)} busy={isDeleting} title={`Delete ${deletePet?.name || 'pet'}?`} description="This will remove their pet record and shared profile link. This cannot be undone.">
        <div className="app-form-actions"><button type="button" className="app-button app-button-secondary" disabled={isDeleting} onClick={() => setDeletePet(null)}>Keep pet</button><button type="button" className="app-button app-button-danger" disabled={isDeleting} onClick={async () => { setIsDeleting(true); try { await petOps.handleDeletePet(deletePet.id); setDeletePet(null); } finally { setIsDeleting(false); } }}>{isDeleting ? 'Deleting…' : 'Delete pet'}</button></div>
      </Sheet>
      {/* Dialogs */}
      {petOps.openPetDialog && (
        <PetDialog
          open={petOps.openPetDialog}
          onClose={() => petOps.setOpenPetDialog(false)}
          pet={petOps.currentPet}
          setPet={petOps.setCurrentPet}
          onSave={petOps.handleSavePet}
          isEditMode={petOps.isEditMode}
          onAddVaccination={petOps.handleAddVaccination}
          onEditVaccination={petOps.handleEditVaccination}
          onDeleteVaccination={petOps.handleDeleteVaccination}
          tabValue={petOps.tabValue}
          onTabChange={(_, val) => petOps.setTabValue(val)}
        />
      )}
      {petOps.openVaccinationDialog && (
        <VaccinationDialog
          open={petOps.openVaccinationDialog}
          onClose={() => petOps.setOpenVaccinationDialog(false)}
          vaccination={petOps.currentVaccination}
          setVaccination={petOps.setCurrentVaccination}
          onSave={petOps.handleSaveVaccination}
          isEditMode={petOps.vaccinationEditIndex >= 0}
          petType={petOps.currentPet?.type}
          petDateOfBirth={petOps.currentPet?.dateOfBirth}
          loading={petOps.isSavingVaccination}
        />
      )}
    </div>
  );
}

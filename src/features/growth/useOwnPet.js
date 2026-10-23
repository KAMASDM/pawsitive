import { useEffect, useState } from 'react';
import { onValue, ref } from 'firebase/database';
import { auth, database } from '../../firebase';
export default function useOwnPet(petId) {
  const [pet, setPet] = useState(null), [error, setError] = useState('');
  useEffect(() => onValue(ref(database, `userPets/${auth.currentUser.uid}/${petId}`), snapshot => {
    setPet(snapshot.exists() ? { ...snapshot.val(), id: petId } : null);
    if (!snapshot.exists()) setError('This pet is no longer available.');
  }, () => setError('Your pet could not be loaded. Please try again.')), [petId]);
  return { pet, error };
}

import React from 'react';
import { Camera, Compass, Heart, MapPin, Search, ShoppingBag, Sparkles, Users } from 'lucide-react';
import { ActionRow, PageHeader } from '../UI/AppUI';

const groups = [
  { title: 'Around you', description: 'Useful places for life together.', links: [
    ['/resource', MapPin, 'Places & services', 'Vets, groomers & everyday essentials'],
    ['/place-tagging', Compass, 'Pet-friendly places', 'Explore and share a favourite spot'],
  ] },
  { title: 'A little connection', description: 'A community that cares.', links: [
    ['/adopt-pets', Heart, 'Adoption', 'Meet pets looking for their people'],
    ['/lost-and-found', Search, 'Lost & found', 'Help a pet find their way home'],
    ['/nearby-mates', Users, 'Breeding connections', 'Profiles listed as available for mating'],
  ] },
  { title: 'Something to enjoy', description: 'For curious pets and their people.', links: [
    ['/challenge', Camera, 'Photo challenges', 'A moment worth sharing'],
    ['/quiz', Sparkles, 'Pet quizzes', 'Learn something new together'],
    ['/shop', ShoppingBag, 'Shop for your pet', 'Browse food, toys & everyday care'],
  ] },
];
export default function Discover() {
  return <div className="app-page"><PageHeader eyebrow="Beyond the everyday" title="Discover" description="Good places. Kind people. More life together." />
    <div className="discover-groups">{groups.map(group => <section key={group.title}><div className="discover-group-heading"><h2>{group.title}</h2><p>{group.description}</p></div><div className="app-action-list">{group.links.map(([to, icon, title, detail]) => <ActionRow key={to} to={to} icon={icon} title={title} detail={detail} />)}</div></section>)}</div>
  </div>;
}

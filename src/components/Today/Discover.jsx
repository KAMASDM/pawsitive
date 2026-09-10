import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

const destinations = [
  ['/resource', 'Places & services', 'Find resources for life with your pet.'],
  ['/adopt-pets', 'Adoption', 'Explore pets listed for adoption and contact their parents.'],
  ['/lost-and-found', 'Lost & found', 'Report a missing pet or help reunite a family.'],
  ['/challenge', 'Photo challenges', 'An optional way to make and share a memory.'],
  ['/quiz', 'Pet quizzes', 'A little learning when you have a moment.'],
  ['/shop', 'Shop', 'Browse products and see prices before purchasing.'],
  ['/nearby-mates', 'Breeding connections', 'Browse profiles explicitly listed as available for mating.'],
  ['/place-tagging', 'Share a pet-friendly place', 'Help other parents find welcoming places.'],
];
export default function Discover() {
  return <div className="max-w-5xl mx-auto px-4 py-10 pb-32"><p className="text-sm font-semibold text-violet-700">EXPLORE AT YOUR PACE</p><h1 className="text-4xl font-bold mt-2">More life together.</h1><p className="text-slate-600 mt-3 mb-8">Community, useful places, and things to enjoy beyond the daily routine.</p><div className="grid sm:grid-cols-2 gap-4">{destinations.map(([to, title, description]) => <Link to={to} key={to} className="rounded-2xl border border-violet-100 bg-white p-6 hover:border-violet-400"><div className="flex justify-between gap-4"><h2 className="font-semibold text-lg">{title}</h2><ArrowUpRight className="text-violet-600 shrink-0" size={20} /></div><p className="text-slate-600 text-sm mt-2">{description}</p></Link>)}</div></div>;
}

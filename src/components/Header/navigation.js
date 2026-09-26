import { Sun, Heart, Users, Compass, UserRound } from 'lucide-react';
export const APP_TABS = [
  { label: 'Today', path: '/today', icon: Sun },
  { label: 'Care', path: '/care', icon: Heart },
  { label: 'Family', path: '/family', icon: Users },
  { label: 'Discover', path: '/discover', icon: Compass },
  { label: 'Profile', path: '/profile', icon: UserRound },
];
export function activeTab(pathname) {
  if (pathname === '/today' || pathname === '/home') return '/today';
  if (/^\/(care|my-pets|pet-details|copilot)(\/|$)/.test(pathname)) return '/care';
  if (pathname === '/family') return '/family';
  if (/^\/(profile|settings|notifications)(\/|$)/.test(pathname)) return '/profile';
  if (/^\/(discover|shop|store|products|cart|checkout|orders|quiz|challenge|resource|adopt-pets|nearby-mates|lost-and-found|place-tagging|activity)(\/|$)/.test(pathname)) return '/discover';
  return null;
}

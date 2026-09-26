import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { onValue, ref } from 'firebase/database';
import { Bell, PawPrint, Search, Settings2 } from 'lucide-react';
import { auth, database } from '../../firebase';
import { triggerSearch } from '../Search/GlobalSearch';
import { APP_TABS, activeTab } from './navigation';
import BottomNavigation from './BottomNavigation';

export default function Header() {
  const { pathname } = useLocation();
  const [user, setUser] = useState(auth.currentUser);
  const [unread, setUnread] = useState(0);
  useEffect(() => auth.onAuthStateChanged(setUser), []);
  useEffect(() => {
    if (!user) { setUnread(0); return; }
    return onValue(ref(database, `users/${user.uid}/unreadNotifications`), snapshot => setUnread(Number(snapshot.val()) || 0), () => setUnread(0));
  }, [user]);
  if (!user || pathname === '/' || pathname === '/login') return null;
  return <>
    <header className="app-toolbar"><div className="app-toolbar-inner">
      <Link to="/today" className="app-wordmark" aria-label="Pawppy Today"><PawPrint aria-hidden="true" strokeWidth={2.2} />pawppy</Link>
      <nav className="app-desktop-nav" aria-label="Main navigation">{APP_TABS.map(({ label, path }) => <Link key={path} to={path} aria-current={activeTab(pathname) === path ? 'page' : undefined}>{label}</Link>)}</nav>
      <div className="app-toolbar-actions"><button type="button" onClick={triggerSearch} className="app-icon-button" aria-label="Search Pawppy"><Search size={21} /></button><Link to="/notifications" className="app-icon-button app-notification-link" aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}><Bell size={21} />{unread > 0 && <span className="app-unread" aria-hidden="true">{unread > 9 ? '9+' : unread}</span>}</Link><Link to="/settings" className="app-icon-button" aria-label="Settings"><Settings2 size={21} /></Link></div>
    </div></header>
    <BottomNavigation />
  </>;
}

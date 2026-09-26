import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { APP_TABS, activeTab } from './navigation';

export default function BottomNavigation() {
  const { pathname } = useLocation();
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  useEffect(() => {
    const viewport = window.visualViewport;
    const sync = () => {
      const editing = document.activeElement?.matches('input, textarea, [contenteditable="true"]');
      setKeyboardOpen(Boolean(editing && viewport && window.innerHeight - viewport.height > 150));
    };
    viewport?.addEventListener('resize', sync);
    document.addEventListener('focusin', sync);
    document.addEventListener('focusout', sync);
    return () => { viewport?.removeEventListener('resize', sync); document.removeEventListener('focusin', sync); document.removeEventListener('focusout', sync); };
  }, []);
  return <nav className={`app-tabbar ${keyboardOpen ? 'is-keyboard-open' : ''}`} aria-label="Main navigation"><ul>{APP_TABS.map(({ label, path, icon: Icon }) => <li key={path}><Link to={path} aria-current={activeTab(pathname) === path ? 'page' : undefined}><Icon aria-hidden="true" /><span>{label}</span></Link></li>)}</ul></nav>;
}

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
export default function Footer() {
  const { pathname } = useLocation();
  if (pathname === '/' || pathname === '/login') return null;
  return <footer className="app-footer"><span>© {new Date().getFullYear()} Pawppy</span><nav aria-label="Support and legal"><Link to="/contact-us">Support</Link><Link to="/privacy-policy">Privacy</Link><Link to="/terms-and-conditions">Terms</Link></nav></footer>;
}

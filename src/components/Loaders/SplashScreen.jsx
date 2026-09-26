import React from 'react';
import { PawPrint } from 'lucide-react';
export default function SplashScreen() {
  return <div className="app-splash" role="status"><PawPrint size={34} strokeWidth={1.7} aria-hidden="true" /><span>Opening your pet’s world…</span><span className="app-spinner" aria-hidden="true" /></div>;
}

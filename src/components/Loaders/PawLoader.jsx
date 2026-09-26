import React from 'react';
import { PageLoading } from '../UI/AppUI';
export default function PawLoader({ message = 'Opening Pawppy…', fullScreen = false }) {
  return <div style={fullScreen ? { minHeight: '60dvh', display: 'grid', alignItems: 'center' } : undefined}><PageLoading label={message} /></div>;
}

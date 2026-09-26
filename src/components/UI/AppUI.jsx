import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { ChevronRight, PawPrint, X } from 'lucide-react';

export function PageHeader({ eyebrow, title, description, action }) {
  return <header className="app-page-heading"><div>{eyebrow && <p className="app-eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p className="app-page-description">{description}</p>}</div>{action}</header>;
}

export function PetAvatar({ pet, className = '' }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [pet.image]);
  return <span className={`pet-avatar ${className}`}>{pet.image && !failed ? <img src={pet.image} alt="" onError={() => setFailed(true)} /> : <PawPrint aria-hidden="true" size={24} />}</span>;
}

export function ActionRow({ to, icon: Icon, title, detail, trailing, ...props }) {
  return <Link to={to} className="app-action-row" {...props}>{Icon && <span className="app-row-icon"><Icon size={21} aria-hidden="true" /></span>}<span className="app-row-copy"><strong>{title}</strong>{detail && <small>{detail}</small>}</span>{trailing}<ChevronRight className="app-chevron" size={17} aria-hidden="true" /></Link>;
}

export function PageLoading({ label = 'Loading your care plan…' }) {
  return <div className="app-loading" role="status"><span className="app-spinner" aria-hidden="true" /><span>{label}</span></div>;
}

export function EmptyState({ icon: Icon = PawPrint, title, children, action }) {
  return <div className="app-empty"><span className="app-empty-icon"><Icon size={28} aria-hidden="true" /></span><h2>{title}</h2>{children && <p>{children}</p>}{action}</div>;
}

function keepFocusInSheet(event) {
  if (event.key !== 'Tab') return;
  const dialog = event.currentTarget;
  const candidates = [...dialog.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])')]
    .filter(element => element.tabIndex >= 0 && element.getClientRects().length);
  const controls = candidates.filter(element => element.type !== 'radio' || element.checked || !candidates.some(other => other.type === 'radio' && other.name === element.name && other.checked));
  event.preventDefault();
  if (!controls.length) return;
  // Safari's keyboard preferences can skip buttons during native tab traversal.
  // Advance explicitly so every control is reachable and focus stays in the sheet.
  const index = controls.indexOf(document.activeElement);
  const next = index < 0 ? (event.shiftKey ? controls.length - 1 : 0) : (index + (event.shiftKey ? -1 : 1) + controls.length) % controls.length;
  controls[next].focus();
}

// Native dialog supplies background isolation and Escape handling.
// A portal keeps it independent of route animations and stacking contexts.
export function Sheet({ open, onClose, title, description, children, busy = false, className = '' }) {
  const ref = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const dialog = ref.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    dialog.querySelector('[data-sheet-autofocus]')?.focus({ preventScroll: true });
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [open]);
  if (!open) return null;
  return createPortal(<dialog ref={ref} className={`app-sheet ${className}`} aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} onKeyDown={keepFocusInSheet} onCancel={event => { event.preventDefault(); if (!busy) closeRef.current(); }} onClick={event => { if (event.target === event.currentTarget && !busy) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeRef.current(); } }}>
    <div className="app-sheet-heading"><div><h2 id={titleId}>{title}</h2>{description && <p id={descriptionId}>{description}</p>}</div><button type="button" className="app-icon-button" aria-label={`Close ${title}`} disabled={busy} onClick={onClose}><X size={21} /></button></div>
    <div className="app-sheet-body">{children}</div>
  </dialog>, document.body);
}

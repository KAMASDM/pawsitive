import React from "react";
import { FiArrowLeft, FiChevronRight } from "react-icons/fi";
import PawMark from "../Brand/PawMark";

export function ExperienceHero({
  eyebrow,
  title,
  description,
  onBack,
  actions,
  children,
  compact = false,
}) {
  return (
    <section className="relative overflow-hidden bg-[#30274e] text-white">
      <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-violet-400/15 blur-3xl" />
      <PawMark size={220} className="pointer-events-none absolute -bottom-20 -right-8 rotate-[-14deg] opacity-[0.045]" />
      <div className={`relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${compact ? "py-7 sm:py-9" : "py-9 sm:py-12"}`}>
        <div className="flex items-start gap-3">
          {onBack && (
            <button onClick={onBack} aria-label="Go back" className="mt-0.5 grid h-9 w-9 flex-none place-items-center rounded-full border border-white/10 bg-white/10 text-violet-100 transition hover:bg-white/15">
              <FiArrowLeft />
            </button>
          )}
          <div className="min-w-0 flex-1">
            {eyebrow && <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-200">{eyebrow}</p>}
            <h1 className="mt-1.5 text-3xl font-black tracking-[-0.04em] sm:text-4xl">{title}</h1>
            {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-violet-100/70 sm:text-base">{description}</p>}
          </div>
          {actions && <div className="hidden flex-none items-center gap-2 sm:flex">{actions}</div>}
        </div>
        {actions && <div className="mt-5 flex gap-2 sm:hidden">{actions}</div>}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </section>
  );
}

export function ResultsHeading({ eyebrow = "Results", title, count, detail, actionLabel, onAction }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-500">{eyebrow}</p>
        <h2 className="mt-1 text-lg font-black tracking-tight text-[#30274e] sm:text-xl">
          {title} {typeof count === "number" && <span className="text-violet-500">({count})</span>}
        </h2>
        {detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}
      </div>
      {actionLabel && (
        <button onClick={onAction} className="flex flex-none items-center gap-1 text-xs font-bold text-violet-600">
          {actionLabel} <FiChevronRight />
        </button>
      )}
    </div>
  );
}

export function ExperienceEmptyState({ icon = "🐾", title, description, primaryLabel, onPrimary, secondaryLabel, onSecondary }) {
  return (
    <div className="rounded-[26px] border border-white bg-white/85 px-5 py-10 text-center shadow-[0_12px_40px_rgba(66,50,108,0.07)]">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-violet-50 text-3xl">{icon}</span>
      <h3 className="mt-4 text-lg font-black text-[#30274e]">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
      {(primaryLabel || secondaryLabel) && (
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          {primaryLabel && <button onClick={onPrimary} className="rounded-full bg-[#4a3d7d] px-5 py-2.5 text-xs font-black text-white shadow-lg">{primaryLabel}</button>}
          {secondaryLabel && <button onClick={onSecondary} className="rounded-full border border-violet-200 bg-white px-5 py-2.5 text-xs font-bold text-violet-700">{secondaryLabel}</button>}
        </div>
      )}
    </div>
  );
}


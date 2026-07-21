import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { auth, database } from "../../firebase";
import { ref, get, set, update, onValue, off } from "firebase/database";
import {
  FiArrowLeft,
  FiEdit2,
  FiShare2,
  FiChevronDown,
  FiChevronUp,
  FiChevronRight,
  FiMessageSquare,
  FiMapPin,
  FiAlertCircle,
  FiHeart,
  FiBook,
  FiActivity,
  FiGrid,
  FiX,
} from "react-icons/fi";
import {
  FaPaw,
  FaSyringe,
  FaExclamationTriangle,
  FaHeart,
  FaCheck,
  FaTimes,
  FaPlus,
  FaQrcode,
} from "react-icons/fa";
import { QRCodeSVG } from "qrcode.react";
import { usePetOperations } from "../../hooks/usePetOperations";
import {
  PetDialog,
  VaccinationDialog,
  MessageDialog,
} from "../Profile/components";
import ConversationsList from "../Profile/components/ConversationsList";
import PetPostsFeed from "../PetProfile/PetPostsFeed";
import { sendMatingRequestAcceptedNotification } from "../../services/notificationService";
import useResponsive from "../../hooks/useResponsive";
import PetTimeline from "./PetTimeline";
import ChallengeQuizCards from "./ChallengeQuizCards";

// ---- Helpers ----

const PET_EMOJI = { dog: "🐕", cat: "🐈", bird: "🦜", fish: "🐠", rabbit: "🐇", hamster: "🐹", turtle: "🐢" };
const getPetEmoji = (type) => PET_EMOJI[type?.toLowerCase()] ?? "🐾";

const getPetAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  const now = new Date();
  const months = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
  if (months < 1) return "< 1 mo";
  if (months < 12) return `${months} mo`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${years} yr ${rem} mo` : `${years} yr`;
};

const getVaccinationStatus = (nextDue) => {
  if (!nextDue) return "unknown";
  const due = new Date(nextDue);
  const now = new Date();
  const soon = new Date();
  soon.setMonth(now.getMonth() + 1);
  if (due < now) return "overdue";
  if (due <= soon) return "due-soon";
  return "up-to-date";
};

const VAC_COLORS = {
  "up-to-date": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "due-soon": "bg-amber-100 text-amber-700 border-amber-200",
  overdue: "bg-red-100 text-red-700 border-red-200",
  unknown: "bg-gray-100 text-gray-500 border-gray-200",
};

const VAC_DOT = { "up-to-date": "#34d399", "due-soon": "#fbbf24", overdue: "#f87171", unknown: "#d1d5db" };

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

// Decorative paw SVG watermark
const PawPrint = ({ size = 24, color = "#fff", opacity = 0.1, rotate = 0 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill={color}
    opacity={opacity}
    style={{ transform: `rotate(${rotate}deg)` }}
  >
    <ellipse cx="16" cy="14" rx="7" ry="9" />
    <ellipse cx="32" cy="10" rx="7" ry="9" />
    <ellipse cx="48" cy="14" rx="7" ry="9" />
    <ellipse cx="8"  cy="28" rx="6" ry="8" />
    <path d="M32 56 C14 56 10 38 14 30 C18 22 46 22 50 30 C54 38 50 56 32 56Z" />
  </svg>
);

// ---- QR Modal ----
const QRModal = ({ url, petName, onClose }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ background: "rgba(0,0,0,0.55)" }}
    onClick={onClose}
  >
    <motion.div
      className="bg-white rounded-3xl p-7 flex flex-col items-center gap-4 max-w-xs w-full"
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between w-full">
        <h3 className="font-bold text-slate-800 text-base">Share {petName}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
          <FiX size={18} />
        </button>
      </div>
      <QRCodeSVG value={url} size={180} fgColor="#4c1d95" />
      <p className="text-xs text-gray-400 text-center break-all">{url}</p>
      <button
        onClick={() => { navigator.clipboard?.writeText(url); onClose(); }}
        className="w-full py-2.5 rounded-xl bg-violet-500 text-white text-sm font-semibold hover:bg-violet-600 transition-colors"
      >
        Copy Link
      </button>
    </motion.div>
  </div>
);

// ---- Feature action button (vertical: icon + label) ----
const ActionPill = ({ emoji, icon: Icon, label, badge, onClick, accent }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
  >
    <div
      className={`relative w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-active:scale-95 ${accent}`}
    >
      {emoji && <span className="text-2xl leading-none">{emoji}</span>}
      {Icon && <Icon size={22} className="text-white" />}
      {badge > 0 && (
        <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center px-1">
          <span className="text-[9px] text-white font-bold">{badge}</span>
        </div>
      )}
    </div>
    <span className="text-[10px] font-semibold text-gray-600 text-center leading-tight max-w-[60px]">
      {label}
    </span>
  </button>
);

// ---- Health Widget ----
const HealthWidget = ({ pet, onAdd, onEdit, onDelete, onViewAll }) => {
  const [expanded, setExpanded] = useState(false);
  const vaccinations = pet?.vaccinations || [];

  const worstStatus = vaccinations.reduce((worst, vac) => {
    const s = getVaccinationStatus(vac.nextDue);
    if (s === "overdue") return "overdue";
    if (s === "due-soon" && worst !== "overdue") return "due-soon";
    if (s === "up-to-date" && worst === "unknown") return "up-to-date";
    return worst;
  }, "unknown");

  const statusLabel = { "up-to-date": "All vaccinations up to date", "due-soon": "Vaccination due soon", overdue: "Vaccination overdue!", unknown: "No vaccinations recorded" };
  const statusColor = { "up-to-date": "text-emerald-600", "due-soon": "text-amber-600", overdue: "text-red-600", unknown: "text-gray-400" };
  const statusBg = { "up-to-date": "bg-emerald-50 border-emerald-100", "due-soon": "bg-amber-50 border-amber-100", overdue: "bg-red-50 border-red-100", unknown: "bg-gray-50 border-gray-100" };

  return (
    <div className={`rounded-2xl border overflow-hidden ${statusBg[worstStatus]}`}>
      <div className="w-full flex items-center gap-2 px-4 py-3.5">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="min-w-0 flex flex-1 items-center gap-3 text-left"
        >
          <FaSyringe className={`flex-shrink-0 ${statusColor[worstStatus]}`} size={14} />
          <span className={`min-w-0 text-sm font-semibold flex-1 ${statusColor[worstStatus]}`}>
            {statusLabel[worstStatus]}
          </span>
          {expanded ? (
            <FiChevronUp size={14} className="flex-shrink-0 text-gray-400" />
          ) : (
            <FiChevronDown size={14} className="flex-shrink-0 text-gray-400" />
          )}
        </button>
        <button
          type="button"
          onClick={onAdd}
          className="flex-shrink-0 text-xs font-semibold text-violet-600 hover:text-violet-800 bg-white/70 px-2 py-0.5 rounded-full"
        >
          + Add
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 space-y-2">
              {vaccinations.length === 0 ? (
                <p className="text-sm text-gray-400 py-2 text-center">
                  No vaccinations recorded.
                </p>
              ) : (
                vaccinations.map((vac, idx) => {
                  const st = getVaccinationStatus(vac.nextDue);
                  return (
                    <div
                      key={vac.id || idx}
                      className="flex items-center justify-between bg-white rounded-xl px-3 py-2.5 shadow-sm"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{vac.name}</p>
                        <p className="text-[10px] text-gray-400">
                          {vac.nextDue ? `Due: ${formatDate(vac.nextDue)}` : "No due date"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${VAC_COLORS[st]}`}
                        >
                          {st === "up-to-date" ? "✓ OK" : st === "due-soon" ? "Due soon" : st === "overdue" ? "Overdue" : "—"}
                        </span>
                        <button onClick={() => onEdit(vac, idx)} className="text-gray-300 hover:text-violet-500 p-0.5">
                          <FiEdit2 size={11} />
                        </button>
                        <button onClick={() => onDelete(idx)} className="text-gray-300 hover:text-red-500 p-0.5">
                          <FaTimes size={10} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
              {vaccinations.length > 0 && (
                <button
                  onClick={onViewAll}
                  className="w-full text-xs text-violet-500 hover:text-violet-700 font-semibold py-1"
                >
                  View full health record →
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ---- Inline Requests section ----
const RequestsInline = ({ requests, onAccept, onDecline }) => {
  const pending = requests.filter((r) => r.direction === "incoming" && r.status === "pending");
  const [open, setOpen] = useState(true);

  if (pending.length === 0) return null;

  return (
    <div className="rounded-2xl border border-pink-200 bg-pink-50 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left"
      >
        <FaHeart className="text-pink-500 flex-shrink-0" size={13} />
        <span className="text-sm font-semibold text-pink-700 flex-1">
          {pending.length} mating request{pending.length > 1 ? "s" : ""} waiting
        </span>
        {open ? <FiChevronUp size={14} className="text-pink-400" /> : <FiChevronDown size={14} className="text-pink-400" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 space-y-2.5">
              {pending.map((req) => (
                <div
                  key={req.id}
                  className="bg-white rounded-xl p-3.5 flex items-center gap-3 shadow-sm"
                >
                  <div className="flex -space-x-2 flex-shrink-0">
                    {[req.senderPetImage, req.receiverPetImage].map((img, i) => (
                      <div
                        key={i}
                        className="w-9 h-9 rounded-full border-2 border-white bg-violet-100 overflow-hidden flex items-center justify-center"
                      >
                        {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <span className="text-base">🐾</span>}
                      </div>
                    ))}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-700 truncate">{req.senderPetName}</p>
                    <p className="text-[10px] text-gray-400">from {req.senderName}</p>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => onAccept(req)}
                      className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-colors"
                    >
                      <FaCheck size={11} />
                    </button>
                    <button
                      onClick={() => onDecline(req)}
                      className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-red-100 hover:text-red-500 transition-colors"
                    >
                      <FaTimes size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ActionSheet = ({ open, onClose, actions }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[210] bg-black/40 flex items-end md:items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-3xl p-4 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-base font-extrabold text-slate-800">What do you want to do?</p>
            <p className="text-xs text-gray-400">Quick actions for this pet.</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-gray-50 text-gray-500 flex items-center justify-center">
            <FiX size={17} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {actions.map(({ label, detail, Icon, onClick }) => (
            <button
              key={label}
              onClick={() => {
                onClick();
                onClose();
              }}
              className="rounded-2xl border border-violet-100 bg-violet-50/40 text-left p-3 min-h-[92px]"
            >
              <span className="w-10 h-10 rounded-xl bg-white text-violet-600 flex items-center justify-center">
                <Icon size={17} />
              </span>
              <span className="block text-sm font-bold text-slate-700 mt-2">{label}</span>
              <span className="block text-[11px] text-gray-400 mt-0.5">{detail}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const JOURNEY_TONES = {
  care: {
    shell: "border-emerald-100 bg-gradient-to-br from-white to-emerald-50/60",
    eyebrow: "text-emerald-600",
    icon: "bg-emerald-100 text-emerald-700",
    item: "border-emerald-100 hover:border-emerald-200 hover:bg-emerald-50/70",
  },
  social: {
    shell: "border-violet-100 bg-gradient-to-br from-white to-violet-50/70",
    eyebrow: "text-violet-600",
    icon: "bg-violet-100 text-violet-700",
    item: "border-violet-100 hover:border-violet-200 hover:bg-violet-50/70",
  },
  safety: {
    shell: "border-amber-100 bg-gradient-to-br from-white to-amber-50/60",
    eyebrow: "text-amber-600",
    icon: "bg-amber-100 text-amber-700",
    item: "border-amber-100 hover:border-amber-200 hover:bg-amber-50/70",
  },
};

const JourneySection = ({ journey, compact = false }) => {
  const tone = JOURNEY_TONES[journey.tone];
  return (
    <section className={`rounded-[24px] border p-4 shadow-[0_10px_30px_rgba(76,61,125,0.05)] ${tone.shell}`}>
      <div className="flex items-start gap-3 mb-3.5">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${tone.icon}`}>
          <span className="text-xl leading-none" aria-hidden="true">{journey.emoji}</span>
        </div>
        <div className="min-w-0">
          <p className={`text-[10px] font-extrabold uppercase tracking-[0.16em] ${tone.eyebrow}`}>{journey.eyebrow}</p>
          <h2 className="text-base font-extrabold text-slate-800 leading-tight mt-0.5">{journey.title}</h2>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{journey.detail}</p>
        </div>
      </div>
      <div className={compact ? "grid grid-cols-1 gap-2" : "grid grid-cols-2 gap-2"}>
        {journey.items.map((item) => (
          <button
            type="button"
            key={item.label}
            onClick={item.onClick}
            className={`relative min-w-0 rounded-2xl border bg-white/80 p-3 text-left transition-all active:scale-[0.98] ${tone.item}`}
          >
            {item.badge > 0 && (
              <span className="absolute right-2.5 top-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-[9px] font-bold text-white flex items-center justify-center">
                {item.badge}
              </span>
            )}
            <span className="text-xl leading-none" aria-hidden="true">{item.emoji}</span>
            <span className="block text-xs font-bold text-slate-700 mt-2 pr-4">{item.label}</span>
            <span className="block text-[10px] text-slate-400 mt-0.5 leading-snug">{item.detail}</span>
          </button>
        ))}
      </div>
    </section>
  );
};

const HealthCenter = ({ open, pet, onClose, onAdd, onEdit, onEditMedical }) => {
  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  const vaccinations = pet?.vaccinations || [];
  const statuses = vaccinations.map((vaccination) => getVaccinationStatus(vaccination.nextDue));
  const attentionCount = statuses.filter((status) => status === "overdue" || status === "due-soon").length;
  const conditions = Array.isArray(pet?.medical?.conditions) ? pet.medical.conditions : [];
  const allergies = Array.isArray(pet?.medical?.allergies) ? pet.medical.allergies : [];
  const savedMedications = pet?.medications ?? pet?.medical?.medications;
  const medications = Array.isArray(savedMedications)
    ? savedMedications
    : savedMedications
      ? [savedMedications]
      : [];

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[230] flex items-end md:items-center justify-center bg-slate-950/55 md:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="health-center-title"
            initial={{ y: 60, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 360, damping: 34 }}
            className="w-full md:max-w-3xl max-h-[92dvh] overflow-hidden rounded-t-[30px] md:rounded-[30px] bg-[#f8f7fc] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="relative overflow-hidden bg-gradient-to-br from-[#6857b7] via-[#51418d] to-[#312650] px-5 py-5 text-white md:px-7">
              <div className="absolute -right-6 -top-8 opacity-10"><PawPrint size={130} opacity={1} /></div>
              <div className="relative flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
                  <FaSyringe size={19} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-violet-200">Health center</p>
                  <h2 id="health-center-title" className="text-xl font-extrabold mt-1">{pet?.name}'s care record</h2>
                  <p className="text-xs text-violet-200 mt-1">See what is recorded, what needs attention, and add updates.</p>
                </div>
                <button type="button" onClick={onClose} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center" aria-label="Close health center">
                  <FiX size={17} />
                </button>
              </div>
            </header>

            <div className="max-h-[calc(92dvh-116px)] overflow-y-auto px-4 py-5 md:px-7 md:py-6">
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { value: vaccinations.length, label: "Vaccinations", color: "text-violet-700 bg-violet-100" },
                  { value: attentionCount, label: "Need attention", color: attentionCount ? "text-amber-700 bg-amber-100" : "text-emerald-700 bg-emerald-100" },
                  { value: conditions.length + allergies.length + medications.length, label: "Health notes", color: "text-sky-700 bg-sky-100" },
                ].map((summary) => (
                  <div key={summary.label} className="rounded-2xl border border-white bg-white p-3 text-center shadow-sm">
                    <span className={`inline-flex min-w-8 h-8 px-2 rounded-xl items-center justify-center text-sm font-extrabold ${summary.color}`}>{summary.value}</span>
                    <p className="text-[10px] font-semibold text-slate-500 mt-2 leading-tight">{summary.label}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mt-6 mb-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">Vaccination records</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Complete history for {pet?.name}</p>
                </div>
                <button type="button" onClick={onAdd} className="flex items-center gap-1.5 rounded-full bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-violet-700">
                  <FaPlus size={10} /> Add new
                </button>
              </div>

              {vaccinations.length > 0 ? (
                <div className="space-y-2.5">
                  {vaccinations.map((vaccination, index) => {
                    const status = getVaccinationStatus(vaccination.nextDue);
                    const statusText = status === "up-to-date" ? "Up to date" : status === "due-soon" ? "Due soon" : status === "overdue" ? "Overdue" : "No due date";
                    return (
                      <article key={vaccination.id || `${vaccination.name}-${index}`} className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center flex-shrink-0"><FaSyringe size={14} /></div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start gap-2">
                              <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-extrabold text-slate-800 truncate">{vaccination.name || "Vaccination"}</h4>
                                <p className="text-[11px] text-slate-400 mt-0.5">Given {formatDate(vaccination.date)}</p>
                              </div>
                              <span className={`text-[9px] font-extrabold rounded-full border px-2 py-1 ${VAC_COLORS[status]}`}>{statusText}</span>
                            </div>
                            <div className="flex items-end justify-between gap-3 mt-3 pt-3 border-t border-slate-100">
                              <div>
                                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Next due</p>
                                <p className="text-xs font-semibold text-slate-600 mt-0.5">{formatDate(vaccination.nextDue)}</p>
                              </div>
                              <button type="button" onClick={() => onEdit(vaccination, index)} className="flex items-center gap-1.5 rounded-xl bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700 hover:bg-violet-100">
                                <FiEdit2 size={12} /> Edit
                              </button>
                            </div>
                            {vaccination.notes && <p className="text-[11px] text-slate-500 mt-3 rounded-xl bg-slate-50 px-3 py-2">{vaccination.notes}</p>}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-violet-200 bg-white px-6 py-8 text-center">
                  <div className="mx-auto w-14 h-14 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center"><FaSyringe size={20} /></div>
                  <h4 className="text-sm font-extrabold text-slate-800 mt-4">No vaccination records yet</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Add the first record to start a clear health history and keep upcoming dates visible.</p>
                  <button type="button" onClick={onAdd} className="mt-4 rounded-full bg-violet-600 px-5 py-2.5 text-xs font-bold text-white">Add first vaccination</button>
                </div>
              )}

              <div className="mt-6">
                <h3 className="text-base font-extrabold text-slate-800">Other health records</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Medical details already saved on {pet?.name}'s profile</p>
                <div className="grid gap-2.5 mt-3 md:grid-cols-3">
                  {[
                    { label: "Conditions", emoji: "🩺", values: conditions },
                    { label: "Allergies", emoji: "🌿", values: allergies },
                    { label: "Medications", emoji: "💊", values: medications },
                  ].map((record) => (
                    <div key={record.label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span aria-hidden="true">{record.emoji}</span>
                          <p className="text-xs font-extrabold text-slate-700">{record.label}</p>
                        </div>
                        <button
                          type="button"
                          onClick={onEditMedical}
                          className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[10px] font-bold text-slate-600 hover:bg-violet-100 hover:text-violet-700"
                        >
                          {record.values.length > 0 ? "Edit" : "Add"}
                        </button>
                      </div>
                      {record.values.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {record.values.map((value, index) => {
                            const label = typeof value === "string" ? value : value?.name || value?.label || "Recorded";
                            return <span key={`${label}-${index}`} className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">{label}</span>;
                          })}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 mt-3">None recorded</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

// ---- Main Component ----

export default function PetDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { petId } = useParams();
  const { isDesktop } = useResponsive();
  const user = auth.currentUser;

  const [pet, setPet] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [matingRequests, setMatingRequests] = useState([]);
  const [posts, setPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [showQR, setShowQR] = useState(false);
  const [openMessageDialog, setOpenMessageDialog] = useState(false);
  const [openActions, setOpenActions] = useState(false);
  const [openHealthCenter, setOpenHealthCenter] = useState(false);
  const [returnToHealthCenter, setReturnToHealthCenter] = useState(false);
  const [returnFromMedicalEditor, setReturnFromMedicalEditor] = useState(false);
  const [postComposerSignal, setPostComposerSignal] = useState(0);
  const [eventComposerSignal, setEventComposerSignal] = useState(0);
  const healthRef = useRef(null);
  const requestsRef = useRef(null);
  const feedRef = useRef(null);
  const [currentMessage, setCurrentMessage] = useState({
    conversationId: null,
    recipientId: null,
    recipientName: null,
    senderPet: null,
    receiverPet: null,
  });

  // Wrap single-pet state for usePetOperations
  const [petsArr, setPetsArr] = useState([]);
  const petOps = usePetOperations(petsArr, (updater) => {
    const next = typeof updater === "function" ? updater(petsArr) : updater;
    setPetsArr(next);
    const updated = next.find((p) => p.id === petId);
    if (updated) setPet(updated);
  });

  const openEditPet = useCallback(
    (p, section) => { petOps.handleEditPet(p || pet, section); },
    [pet, petOps]
  );
  const closeHealthCenter = useCallback(() => setOpenHealthCenter(false), []);

  // Save last viewed pet id for auto-redirect
  useEffect(() => {
    if (petId) localStorage.setItem("pawppy_last_pet_id", petId);
  }, [petId]);

  // Profile pet cards can open this dashboard directly into the same Health
  // Center used here. Consume the navigation state once so refreshes and
  // later renders do not reopen the modal unexpectedly.
  useEffect(() => {
    if (!pet || !location.state?.openHealthCenter) return;
    setOpenHealthCenter(true);
    navigate(location.pathname, { replace: true, state: {} });
  }, [pet, location.pathname, location.state?.openHealthCenter, navigate]);

  // Load pet data
  useEffect(() => {
    if (!user || !petId) return;
    const fetchData = async () => {
      try {
        const snap = await get(ref(database, `userPets/${user.uid}/${petId}`));
        if (snap.exists()) {
          const petData = { id: petId, ...snap.val() };
          setPet(petData);
          setPetsArr([petData]);
        } else {
          navigate("/my-pets?picker=true", { replace: true });
        }
      } catch (err) {
        console.error("Error fetching pet:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user, petId, navigate]);

  // Posts + Events listeners
  useEffect(() => {
    if (!petId) return;
    const postsRef = ref(database, `petPosts/${petId}`);
    const eventsRef = ref(database, `petEvents/${petId}`);
    onValue(postsRef, (snap) => {
      if (snap.exists()) {
        const arr = [];
        snap.forEach((c) => { arr.push({ id: c.key, ...c.val() }); });
        arr.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setPosts(arr);
      } else setPosts([]);
    });
    onValue(eventsRef, (snap) => {
      if (snap.exists()) {
        const arr = [];
        snap.forEach((c) => { arr.push({ id: c.key, ...c.val() }); });
        arr.sort((a, b) => new Date(a.date) - new Date(b.date));
        setEvents(arr);
      } else setEvents([]);
    });
    return () => { off(postsRef); off(eventsRef); };
  }, [petId]);

  // Mating requests
  useEffect(() => {
    if (!user || !petId) return;
    const fetchRequests = async () => {
      try {
        const [inSnap, outSnap] = await Promise.all([
          get(ref(database, `matingRequests/received/${user.uid}`)),
          get(ref(database, `matingRequests/sent/${user.uid}`)),
        ]);
        const processSnap = async (snapshot, direction) => {
          if (!snapshot.exists()) return [];
          const data = snapshot.val();
          const filtered = Object.keys(data)
            .map((id) => ({ id, ...data[id] }))
            .filter((r) => r.receiverPetId === petId || r.senderPetId === petId);
          return Promise.all(
            filtered.map(async (req) => {
              const otherId = direction === "incoming" ? req.senderId : req.receiverId;
              const otherPetId = direction === "incoming" ? req.senderPetId : req.receiverPetId;
              const [userSnap, petSnap] = await Promise.all([
                get(ref(database, `users/${otherId}`)),
                get(ref(database, `userPets/${otherId}/${otherPetId}`)),
              ]);
              const ud = userSnap.exists() ? userSnap.val() : {};
              const pd = petSnap.exists() ? petSnap.val() : {};
              return {
                ...req,
                direction,
                senderName: direction === "incoming" ? ud.displayName : user.displayName,
                senderPetName: direction === "incoming" ? pd.name : pet?.name,
                senderPetImage: direction === "incoming" ? pd.image : pet?.image,
                receiverPetImage: direction === "outgoing" ? pd.image : pet?.image,
              };
            })
          );
        };
        const [incoming, outgoing] = await Promise.all([
          processSnap(inSnap, "incoming"),
          processSnap(outSnap, "outgoing"),
        ]);
        setMatingRequests([...incoming, ...outgoing].sort((a, b) => b.createdAt - a.createdAt));
      } catch (err) {
        console.error("Error fetching requests:", err);
      }
    };
    fetchRequests();
  }, [user, petId, pet?.name, pet?.image]);

  const pendingCount = matingRequests.filter(
    (r) => r.direction === "incoming" && r.status === "pending"
  ).length;

  const handleUpdateRequest = useCallback(
    async (request, status) => {
      try {
        const ts = Date.now();
        await update(ref(database), {
          [`matingRequests/received/${user.uid}/${request.id}/status`]: status,
          [`matingRequests/received/${user.uid}/${request.id}/updatedAt`]: ts,
          [`matingRequests/sent/${request.senderId}/${request.id}/status`]: status,
          [`matingRequests/sent/${request.senderId}/${request.id}/updatedAt`]: ts,
        });
        setMatingRequests((prev) =>
          prev.map((r) => (r.id === request.id ? { ...r, status } : r))
        );
        if (status === "accepted") {
          const senderSnap = await get(ref(database, `users/${request.senderId}`));
          if (senderSnap.exists()) {
            sendMatingRequestAcceptedNotification(
              senderSnap.val(),
              { uid: user.uid, displayName: user.displayName, email: user.email },
              request
            ).catch(() => {});
          }
        }
      } catch (err) {
        console.error("Error updating request:", err);
      }
    },
    [user]
  );

  const handleOpenConversation = useCallback((msg) => {
    setCurrentMessage(msg);
    setOpenMessageDialog(true);
  }, []);

  const publicUrl = pet?.slug ? `${window.location.origin}/pet/${pet.slug}` : "";

  const scrollToSection = useCallback((sectionRef) => {
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const shareProfile = () => {
    if (navigator.share && publicUrl) {
      navigator.share({ title: pet.name, url: publicUrl }).catch(() => {});
    } else if (publicUrl) {
      navigator.clipboard?.writeText(publicUrl).catch(() => {});
    }
  };

  const petType = pet?.type?.toLowerCase() ?? "";

  const navToMates = () => navigate("/nearby-mates", { state: { selectedPetId: petId } });
  const navToReportLost = () => navigate("/lost-and-found", { state: { openTab: "report-lost", petId } });
  const navToAdopt = () => navigate("/adopt-pets", { state: { petType } });
  const navToResources = () => navigate("/resource", { state: { category: petType === "dog" ? "dog" : petType === "cat" ? "cat" : "all" } });
  const navToPlaces = () => navigate("/place-tagging");
  const navToMessages = () => navigate("/profile", { state: { tab: "messages" } });
  const openPostComposer = () => {
    scrollToSection(feedRef);
    setPostComposerSignal((value) => value + 1);
  };
  const openEventComposer = () => {
    scrollToSection(feedRef);
    setEventComposerSignal((value) => value + 1);
  };
  const openVaccinationForm = (vaccination, index) => {
    petOps.prepareVaccinationForPet(pet);
    setOpenHealthCenter(false);
    setReturnToHealthCenter(true);
    if (vaccination) petOps.handleEditVaccination(vaccination, index);
    else petOps.handleAddVaccination();
  };
  const openMedicalEditor = () => {
    setOpenHealthCenter(false);
    setReturnFromMedicalEditor(true);
    openEditPet(pet, "medical");
  };
  const petActions = [
    { Icon: FiMessageSquare, label: "Add post", detail: "Share a pet moment", onClick: openPostComposer },
    { Icon: FiActivity, label: "Add event", detail: "Log a memory or appointment", onClick: openEventComposer },
    { Icon: FaSyringe, label: "Add vaccine", detail: "Update health records", onClick: () => openVaccinationForm() },
    { Icon: FiAlertCircle, label: "Report lost", detail: "Start a lost pet report", onClick: navToReportLost },
    { Icon: FiHeart, label: "Find mate", detail: "Browse nearby matches", onClick: navToMates },
    { Icon: FaQrcode, label: "Show QR", detail: "Share this pet profile", onClick: () => setShowQR(true) },
  ];

  useEffect(() => {
    if (!returnToHealthCenter || petOps.openVaccinationDialog) return;
    setOpenHealthCenter(true);
    setReturnToHealthCenter(false);
  }, [petOps.openVaccinationDialog, returnToHealthCenter]);

  useEffect(() => {
    if (!returnFromMedicalEditor || petOps.openPetDialog) return;
    setOpenHealthCenter(true);
    setReturnFromMedicalEditor(false);
  }, [petOps.openPetDialog, returnFromMedicalEditor]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-violet-100 animate-pulse" />
          <div className="w-36 h-4 bg-violet-100 rounded animate-pulse" />
          <div className="w-24 h-3 bg-violet-50 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!pet) return null;

  // ---- Shared pill/chip ----
  const InfoChip = ({ label }) => (
    <span className="text-xs bg-white/20 text-white rounded-full px-3 py-0.5 backdrop-blur-sm">{label}</span>
  );

  const journeys = [
    {
      tone: "care",
      emoji: "✦",
      eyebrow: "Everyday care",
      title: `Care for ${pet.name}`,
      detail: "Health records, useful services, and the moments you need to remember.",
      items: [
        { emoji: "🏥", label: "Health record", detail: "Vaccines and care history", onClick: () => setOpenHealthCenter(true) },
        { emoji: "📚", label: "Find care", detail: "Vets, groomers and services", onClick: navToResources },
        { emoji: "💉", label: "Add vaccine", detail: "Keep reminders accurate", onClick: () => openVaccinationForm() },
        { emoji: "📅", label: "Add event", detail: "Memory or appointment", onClick: openEventComposer },
      ],
    },
    {
      tone: "social",
      emoji: "🐾",
      eyebrow: "Their digital life",
      title: "Social profile",
      detail: "Build a page people can discover, enjoy, and share beyond Pawppy.",
      items: [
        { emoji: "✍️", label: "Add post", detail: "Share a pet moment", onClick: openPostComposer },
        {
          emoji: "🔗",
          label: pet.slug ? "View profile" : "Create profile link",
          detail: pet.slug ? "Open their public page" : "Finish profile setup",
          onClick: pet.slug ? () => navigate(`/pet/${pet.slug}`) : () => openEditPet(pet, "basic"),
        },
        { emoji: "💕", label: "Meet pets", detail: "Find nearby matches", onClick: navToMates },
        { emoji: "💬", label: "Messages", detail: "Open conversations", onClick: navToMessages },
      ],
    },
    {
      tone: "safety",
      emoji: "⌁",
      eyebrow: "Help when it matters",
      title: "Safety & community",
      detail: "Protection, trusted places, and community support in one calm space.",
      items: [
        { emoji: "🚨", label: "Lost & found", detail: "Report or search quickly", onClick: navToReportLost },
        { emoji: "🏠", label: "Adoption", detail: "Browse or rehome", onClick: navToAdopt },
        { emoji: "📍", label: "Tag a place", detail: "Share pet-friendly spots", onClick: navToPlaces },
        { emoji: "❤️", label: "Requests", detail: pendingCount ? `${pendingCount} need attention` : "No pending requests", onClick: () => scrollToSection(requestsRef), badge: pendingCount },
      ],
    },
  ];

  // ---- MOBILE LAYOUT ----
  const mobileLayout = (
    <div className="min-h-screen bg-slate-50 pb-10">
      {/* Sticky top bar */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-violet-100 sticky top-0 z-30 h-14 flex items-center px-4 gap-3">
        <button
          onClick={() => navigate("/my-pets?picker=true")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-violet-600 font-medium transition-colors"
        >
          <FiArrowLeft size={16} />
          <span>My Pets</span>
        </button>
        <span className="font-bold text-slate-800 truncate flex-1 text-center">{pet.name}</span>
        <button
          onClick={() => openEditPet(pet, "basic")}
          className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-full transition-colors"
        >
          <FiEdit2 size={13} /> Edit
        </button>
      </div>

      {/* Social Profile Hero */}
      <div
        className="relative pt-8 pb-0 overflow-hidden"
        style={{ background: "linear-gradient(160deg, #6d5dbf 0%, #4a3d7d 60%, #2e2550 100%)" }}
      >
        {/* Decorative paw watermarks */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <PawPrint size={80} opacity={0.07} rotate={-20} />
          <div className="absolute bottom-10 right-4"><PawPrint size={60} opacity={0.06} rotate={15} /></div>
          <div className="absolute top-5 right-8"><PawPrint size={45} opacity={0.05} rotate={0} /></div>
        </div>

        {/* Avatar */}
        <div className="relative z-10 flex flex-col items-center px-6">
          <div className="w-24 h-24 rounded-full border-4 border-white/40 overflow-hidden bg-violet-300 shadow-2xl mb-3 flex items-center justify-center">
            {pet.image ? (
              <img src={pet.image} alt={pet.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-5xl select-none">{PET_EMOJI[petType] || "🐾"}</span>
            )}
          </div>

          {/* Name & breed */}
          <h1 className="text-2xl font-bold text-white leading-tight">{pet.name}</h1>
          <p className="text-violet-200 text-sm mt-0.5 capitalize">
            {[pet.breed || pet.type, pet.gender].filter(Boolean).join(" · ")}
          </p>

          {/* Stats row */}
          <div className="flex gap-4 mt-3 text-white text-center">
            <div>
              <p className="text-lg font-bold leading-none">{posts.length}</p>
              <p className="text-[11px] text-violet-300">Posts</p>
            </div>
            <div className="w-px bg-white/20" />
            <div>
              <p className="text-lg font-bold leading-none">{events.length}</p>
              <p className="text-[11px] text-violet-300">Events</p>
            </div>
            {(pet.vaccinations?.length ?? 0) > 0 && (
              <>
                <div className="w-px bg-white/20" />
                <div>
                  <p className="text-lg font-bold leading-none">{pet.vaccinations.length}</p>
                  <p className="text-[11px] text-violet-300">Vaccines</p>
                </div>
              </>
            )}
          </div>

          {/* Info chips */}
          <div className="flex flex-wrap justify-center gap-1.5 mt-3">
            {getPetAge(pet.dateOfBirth) && <InfoChip label={`🎂 ${getPetAge(pet.dateOfBirth)}`} />}
            {pet.weight && <InfoChip label={`⚖️ ${pet.weight} kg`} />}
            {pet.color && <InfoChip label={`🎨 ${pet.color}`} />}
          </div>

          {/* Availability toggle pills */}
          <div className="flex gap-2 mt-3 flex-wrap justify-center">
            <button
              onClick={() => petOps.handleToggleAvailability(pet, "availableForMating")}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                pet.availableForMating
                  ? "bg-pink-500 text-white border-pink-500"
                  : "bg-white/10 text-violet-200 border-white/20 hover:bg-white/20"
              }`}
            >
              💕 {pet.availableForMating ? "Available for Mating" : "Not for Mating"}
            </button>
            <button
              onClick={() => petOps.handleToggleAvailability(pet, "availableForAdoption")}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                pet.availableForAdoption
                  ? "bg-teal-500 text-white border-teal-500"
                  : "bg-white/10 text-violet-200 border-white/20 hover:bg-white/20"
              }`}
            >
              🏠 {pet.availableForAdoption ? "Up for Adoption" : "Not for Adoption"}
            </button>
          </div>

          {/* Action row: Share + QR + Profile */}
          <div className="flex gap-2 mt-4 mb-0">
            <button
              onClick={shareProfile}
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-4 py-2 rounded-full transition-colors backdrop-blur-sm"
            >
              <FiShare2 size={13} /> Share
            </button>
            <button
              onClick={() => setShowQR(true)}
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-4 py-2 rounded-full transition-colors backdrop-blur-sm"
            >
              <FaQrcode size={13} /> QR Code
            </button>
            {pet.slug && (
              <button
                onClick={() => window.open(publicUrl, "_blank")}
                className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-4 py-2 rounded-full transition-colors backdrop-blur-sm"
              >
                🔗 Profile
              </button>
            )}
          </div>
        </div>

        {/* Curved white bottom */}
        <div className="mt-6 h-8 bg-slate-50" style={{ borderRadius: "60% 60% 0 0 / 100% 100% 0 0" }} />
      </div>

      {/* Existing capabilities, organised around the user's intent. */}
      <div className="px-4 mt-3 space-y-4">
        <div className="flex items-end justify-between px-1">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-violet-500">Your pet's world</p>
            <h2 className="text-lg font-extrabold text-slate-800 mt-0.5">Everything starts here</h2>
          </div>
          <button
            type="button"
            onClick={() => setOpenActions(true)}
            className="text-xs font-bold text-violet-600 bg-violet-100 px-3 py-1.5 rounded-full"
          >
            Quick add
          </button>
        </div>
        {journeys.map((journey) => (
          <JourneySection key={journey.tone} journey={journey} />
        ))}
      </div>

      {/* Feed Section: Posts + Events */}
      <div ref={feedRef} className="mt-4 scroll-mt-20">
        <PetPostsFeed
          embedded
          posts={posts}
          events={events}
          pet={pet}
          isOwner={true}
          currentUser={{ uid: user?.uid, name: user?.displayName, email: user?.email }}
          openComposerSignal={postComposerSignal}
          openEventSignal={eventComposerSignal}
        />
      </div>

      <PetTimeline
        pet={pet}
        posts={posts}
        events={events}
        requests={matingRequests}
        onHealth={() => setOpenHealthCenter(true)}
        onRequests={() => scrollToSection(requestsRef)}
        onFeed={() => scrollToSection(feedRef)}
      />

      <ChallengeQuizCards />

      {/* Health Widget */}
      <div ref={healthRef} className="px-4 mt-5 scroll-mt-20">
        {(pet.vaccinations?.length ?? 0) > 0 ? (
          <HealthWidget
            pet={pet}
            onAdd={() => openVaccinationForm()}
            onEdit={openVaccinationForm}
            onDelete={petOps.handleDeleteVaccination}
            onViewAll={() => setOpenHealthCenter(true)}
          />
        ) : (
          <button
            onClick={() => setOpenHealthCenter(true)}
            className="w-full rounded-2xl border border-dashed border-violet-200 bg-white px-4 py-4 text-left active:scale-[0.99] transition-all"
          >
            <p className="text-sm font-bold text-slate-800">Start {pet.name}'s health record</p>
            <p className="text-xs text-gray-400 mt-1">Add vaccinations once and Pawppy can surface reminders here.</p>
          </button>
        )}
      </div>

      {/* Inline Mating Requests Banner */}
      <div ref={requestsRef} className="px-4 mt-4 scroll-mt-20">
        {pendingCount > 0 ? (
          <RequestsInline
            requests={matingRequests}
            onAccept={(r) => handleUpdateRequest(r, "accepted")}
            onDecline={(r) => handleUpdateRequest(r, "declined")}
          />
        ) : (
          <div className="rounded-2xl border border-violet-100 bg-white px-4 py-4">
            <p className="text-sm font-bold text-slate-800">No pending requests</p>
            <p className="text-xs text-gray-400 mt-1">Mating and adoption conversations will appear here when they need your attention.</p>
          </div>
        )}
      </div>

    </div>
  );

  // ---- DESKTOP LAYOUT ----
  const desktopLayout = (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop top bar */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-violet-100 sticky top-0 z-30 h-14 flex items-center px-8 gap-4" style={{ boxShadow: "0 1px 0 0 rgba(109,93,191,0.08)" }}>
        <button
          onClick={() => navigate("/my-pets?picker=true")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-violet-600 font-medium transition-colors"
        >
          <FiArrowLeft size={16} /> My Pets
        </button>
        <div className="w-px h-4 bg-gray-200" />
        <span className="font-bold text-slate-800 truncate">{pet.name}</span>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={shareProfile} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-violet-600 px-3 py-1.5 rounded-full hover:bg-violet-50 transition-colors">
            <FiShare2 size={14} /> Share
          </button>
          <button
            onClick={() => openEditPet(pet, "basic")}
            className="flex items-center gap-1.5 text-sm font-semibold text-white bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 px-4 py-1.5 rounded-full transition-all shadow-sm"
          >
            <FiEdit2 size={13} /> Edit Profile
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8 flex gap-8">
        {/* Left sidebar */}
        <aside className="w-72 flex-shrink-0 space-y-5 sticky top-20 self-start">
          {/* Profile card */}
          <div
            className="rounded-3xl overflow-hidden shadow-lg"
            style={{ background: "linear-gradient(160deg, #6d5dbf 0%, #4a3d7d 60%, #2e2550 100%)" }}
          >
            <div className="relative p-6 flex flex-col items-center text-center">
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <PawPrint size={70} opacity={0.07} rotate={-10} />
              </div>
              <div className="w-20 h-20 rounded-full border-4 border-white/40 overflow-hidden bg-violet-300 shadow-xl mb-3 flex items-center justify-center">
                {pet.image ? (
                  <img src={pet.image} alt={pet.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl select-none">{PET_EMOJI[petType] || "🐾"}</span>
                )}
              </div>
              <h2 className="text-xl font-bold text-white">{pet.name}</h2>
              <p className="text-violet-200 text-xs mt-0.5 capitalize mb-3">
                {[pet.breed || pet.type, pet.gender].filter(Boolean).join(" · ")}
              </p>
              <div className="flex gap-4 text-white text-center mb-4 w-full justify-center">
                <div><p className="text-base font-bold">{posts.length}</p><p className="text-[10px] text-violet-300">Posts</p></div>
                <div className="w-px bg-white/20" />
                <div><p className="text-base font-bold">{events.length}</p><p className="text-[10px] text-violet-300">Events</p></div>
              </div>
              <div className="flex flex-wrap gap-1.5 justify-center mb-4">
                {getPetAge(pet.dateOfBirth) && <InfoChip label={`🎂 ${getPetAge(pet.dateOfBirth)}`} />}
                {pet.weight && <InfoChip label={`⚖️ ${pet.weight} kg`} />}
              </div>
              <div className="flex gap-2 justify-center">
                <button onClick={shareProfile} className="flex items-center gap-1 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors">
                  <FiShare2 size={12} /> Share
                </button>
                <button onClick={() => setShowQR(true)} className="flex items-center gap-1 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors">
                  <FaQrcode size={12} /> QR
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 justify-center mt-3">
                <button
                  onClick={() => petOps.handleToggleAvailability(pet, "availableForMating")}
                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${pet.availableForMating ? "bg-pink-500 text-white border-pink-500" : "bg-white/10 text-violet-200 border-white/20"}`}
                >
                  💕 {pet.availableForMating ? "For Mating" : "Not for Mating"}
                </button>
                <button
                  onClick={() => petOps.handleToggleAvailability(pet, "availableForAdoption")}
                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${pet.availableForAdoption ? "bg-teal-500 text-white border-teal-500" : "bg-white/10 text-violet-200 border-white/20"}`}
                >
                  🏠 {pet.availableForAdoption ? "For Adoption" : "Not for Adoption"}
                </button>
              </div>
            </div>
          </div>

          {/* Health widget */}
          <div ref={healthRef} className="scroll-mt-24">
            {(pet.vaccinations?.length ?? 0) > 0 ? (
            <HealthWidget
              pet={pet}
              onAdd={() => openVaccinationForm()}
              onEdit={openVaccinationForm}
              onDelete={petOps.handleDeleteVaccination}
              onViewAll={() => setOpenHealthCenter(true)}
            />
            ) : (
              <button
                onClick={() => setOpenHealthCenter(true)}
                className="w-full rounded-2xl border border-dashed border-violet-200 bg-white px-4 py-4 text-left hover:bg-violet-50 transition-colors"
              >
                <p className="text-sm font-bold text-slate-800">Start health record</p>
                <p className="text-xs text-gray-400 mt-1">Add vaccinations and reminders.</p>
              </button>
            )}
          </div>

          {/* Pending requests */}
          <div ref={requestsRef} className="scroll-mt-24">
            {pendingCount > 0 ? (
            <RequestsInline
              requests={matingRequests}
              onAccept={(r) => handleUpdateRequest(r, "accepted")}
              onDecline={(r) => handleUpdateRequest(r, "declined")}
            />
            ) : (
              <div className="rounded-2xl border border-violet-100 bg-white px-4 py-4">
                <p className="text-sm font-bold text-slate-800">No pending requests</p>
                <p className="text-xs text-gray-400 mt-1">New request decisions appear here.</p>
              </div>
            )}
          </div>

          {/* Make the shareable profile legible as a product, not a hidden utility. */}
          <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-white to-violet-50 p-4 shadow-sm">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-violet-500">Public profile</p>
            <p className="text-sm font-extrabold text-slate-800 mt-1">
              {pet.slug ? `${pet.name} has a page to share` : `Create ${pet.name}'s shareable page`}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Posts, milestones and pet details come together in one beautiful link.
            </p>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button
                type="button"
                onClick={pet.slug ? () => navigate(`/pet/${pet.slug}`) : () => openEditPet(pet, "basic")}
                className="rounded-xl bg-violet-600 px-3 py-2 text-xs font-bold text-white"
              >
                {pet.slug ? "View page" : "Set up"}
              </button>
              <button
                type="button"
                onClick={pet.slug ? shareProfile : () => openEditPet(pet, "basic")}
                className="rounded-xl border border-violet-200 bg-white px-3 py-2 text-xs font-bold text-violet-700"
              >
                {pet.slug ? "Share link" : "Learn more"}
              </button>
            </div>
          </div>
        </aside>

        {/* Main feed column */}
        <main className="flex-1 min-w-0">
          <div className="mb-7">
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-violet-500">Your pet's world</p>
                <h1 className="text-2xl font-extrabold text-slate-800 mt-1">Everything starts with {pet.name}</h1>
                <p className="text-sm text-slate-400 mt-1">Care, connection and safety—organised around what you want to do.</p>
              </div>
              <button
                type="button"
                onClick={() => setOpenActions(true)}
                className="flex-shrink-0 rounded-full bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-violet-700"
              >
                + Quick add
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4 items-start">
              {journeys.map((journey) => (
                <JourneySection key={journey.tone} journey={journey} compact />
              ))}
            </div>
          </div>
          <div ref={feedRef} className="scroll-mt-24">
            <PetPostsFeed
              embedded
              posts={posts}
              events={events}
              pet={pet}
              isOwner={true}
              currentUser={{ uid: user?.uid, name: user?.displayName, email: user?.email }}
              openComposerSignal={postComposerSignal}
              openEventSignal={eventComposerSignal}
            />
          </div>
          <div className="mt-6">
            <PetTimeline
              pet={pet}
              posts={posts}
              events={events}
              requests={matingRequests}
              onHealth={() => setOpenHealthCenter(true)}
              onRequests={() => scrollToSection(requestsRef)}
              onFeed={() => scrollToSection(feedRef)}
            />
          </div>
          <ChallengeQuizCards />
        </main>
      </div>
    </div>
  );

  return (
    <>
      {isDesktop ? desktopLayout : mobileLayout}

      <button
        onClick={() => setOpenActions(true)}
        className="fixed right-4 bottom-[190px] md:bottom-20 z-40 w-14 h-14 rounded-full border-4 border-white bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-[0_16px_34px_rgba(91,67,170,0.32)] flex items-center justify-center active:scale-95 transition-transform"
        aria-label="Pet actions"
      >
        <FaPlus size={18} />
      </button>

      <ActionSheet
        open={openActions}
        onClose={() => setOpenActions(false)}
        actions={petActions}
      />

      <HealthCenter
        open={openHealthCenter}
        pet={pet}
        onClose={closeHealthCenter}
        onAdd={() => openVaccinationForm()}
        onEdit={openVaccinationForm}
        onEditMedical={openMedicalEditor}
      />

      {/* QR modal */}
      {showQR && publicUrl && (
        <QRModal url={publicUrl} petName={pet.name} onClose={() => setShowQR(false)} />
      )}

      {/* Pet dialogs */}
      {petOps.openPetDialog && (
        <PetDialog
          open={petOps.openPetDialog}
          onClose={() => petOps.setOpenPetDialog(false)}
          pet={petOps.currentPet}
          setPet={petOps.setCurrentPet}
          onSave={petOps.handleSavePet}
          isEditMode={petOps.isEditMode}
          onAddVaccination={petOps.handleAddVaccination}
          onEditVaccination={petOps.handleEditVaccination}
          onDeleteVaccination={petOps.handleDeleteVaccination}
          tabValue={petOps.tabValue}
          onTabChange={(_, val) => petOps.setTabValue(val)}
        />
      )}
      {petOps.openVaccinationDialog && (
        <VaccinationDialog
          open={petOps.openVaccinationDialog}
          onClose={() => petOps.setOpenVaccinationDialog(false)}
          vaccination={petOps.currentVaccination}
          setVaccination={petOps.setCurrentVaccination}
          onSave={petOps.handleSaveVaccination}
          isEditMode={petOps.vaccinationEditIndex >= 0}
          petType={petOps.currentPet?.type?.toLowerCase()}
          petDateOfBirth={petOps.currentPet?.dateOfBirth}
          loading={petOps.isSavingVaccination}
        />
      )}
      {openMessageDialog && (
        <MessageDialog
          open={openMessageDialog}
          onClose={() => setOpenMessageDialog(false)}
          conversationId={currentMessage.conversationId}
          recipientId={currentMessage.recipientId}
          recipientName={currentMessage.recipientName}
          senderPet={currentMessage.senderPet}
          receiverPet={currentMessage.receiverPet}
        />
      )}
    </>
  );
}

import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FaPaw } from "react-icons/fa";
import {
  FiArrowUpRight,
  FiEdit2,
  FiHeart,
  FiHome,
  FiTrash2,
} from "react-icons/fi";

const toList = (value) => (
  Array.isArray(value)
    ? value.filter(Boolean)
    : Object.values(value || {}).filter(Boolean)
);

const getVaccinationStatus = (vaccinations) => {
  const list = toList(vaccinations);
  if (list.length === 0) {
    return { label: "No vaccines", className: "bg-slate-100 text-slate-500" };
  }

  const today = new Date();
  const soon = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  let overdue = false;
  let dueSoon = false;

  list.forEach((vaccination) => {
    if (!vaccination?.nextDue) return;
    const dueDate = new Date(vaccination.nextDue);
    if (dueDate < today) overdue = true;
    else if (dueDate <= soon) dueSoon = true;
  });

  if (overdue) return { label: "Vaccine overdue", className: "bg-rose-50 text-rose-600" };
  if (dueSoon) return { label: "Due soon", className: "bg-amber-50 text-amber-700" };
  return { label: "Vaccines current", className: "bg-emerald-50 text-emerald-700" };
};

const CompactPetCard = ({
  pet,
  index,
  onEditPet,
  onDeletePet,
  onToggleAvailability,
}) => {
  const vaccineStatus = getVaccinationStatus(pet.vaccinations);
  const details = [pet.breed, pet.gender, pet.age].filter(Boolean).join(" · ");

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.2) }}
      className="rounded-[22px] border border-violet-100 bg-white p-3 shadow-[0_8px_26px_rgba(74,61,125,0.07)] transition-shadow hover:shadow-md"
    >
      <div className="flex gap-3">
        <div className="relative h-[92px] w-[92px] shrink-0 overflow-hidden rounded-[18px] bg-gradient-to-br from-violet-100 to-indigo-100 sm:h-24 sm:w-24">
          {pet.image ? (
            <img src={pet.image} alt={pet.name || "Pet"} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <FaPaw className="text-2xl text-violet-300" />
            </div>
          )}
          {pet.slug && (
            <span className="absolute bottom-1.5 left-1.5 rounded-full bg-slate-950/55 px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wide text-white backdrop-blur">
              Public
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1 py-0.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-black leading-tight text-slate-900">{pet.name || "Unnamed pet"}</h3>
              <p className="mt-1 truncate text-xs text-slate-500">{details || pet.type || "Pet profile"}</p>
            </div>
            <button
              type="button"
              onClick={() => onEditPet(pet)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 transition hover:bg-violet-100"
              aria-label={`Edit ${pet.name || "pet"}`}
            >
              <FiEdit2 size={14} />
            </button>
          </div>

          <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${vaccineStatus.className}`}>
            {vaccineStatus.label}
          </span>

          <div className="mt-2 flex gap-1.5">
            <button
              type="button"
              onClick={() => onToggleAvailability?.(pet, "availableForMating")}
              className={`flex min-w-0 flex-1 items-center justify-center gap-1 rounded-lg px-1.5 py-1.5 text-[10px] font-bold transition ${
                pet.availableForMating
                  ? "bg-rose-500 text-white"
                  : "bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
              }`}
              aria-pressed={Boolean(pet.availableForMating)}
            >
              <FiHeart size={11} /> Mating
            </button>
            <button
              type="button"
              onClick={() => onToggleAvailability?.(pet, "availableForAdoption")}
              className={`flex min-w-0 flex-1 items-center justify-center gap-1 rounded-lg px-1.5 py-1.5 text-[10px] font-bold transition ${
                pet.availableForAdoption
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-100 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600"
              }`}
              aria-pressed={Boolean(pet.availableForAdoption)}
            >
              <FiHome size={11} /> Adopt
            </button>
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-[1fr_1fr_auto] gap-2 border-t border-slate-100 pt-2.5">
        <Link
          to={`/my-pets/${pet.id}`}
          state={{ openHealthCenter: true }}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-50 px-2 py-2 text-xs font-bold text-slate-600 transition hover:bg-violet-50 hover:text-violet-700"
        >
          <FaPaw size={11} /> Care
        </Link>
        {pet.slug ? (
          <Link
            to={`/pet/${pet.slug}`}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-violet-50 px-2 py-2 text-xs font-bold text-violet-700 transition hover:bg-violet-100"
          >
            Profile <FiArrowUpRight size={12} />
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => onEditPet(pet)}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-violet-50 px-2 py-2 text-xs font-bold text-violet-700 transition hover:bg-violet-100"
          >
            Complete profile
          </button>
        )}
        <button
          type="button"
          onClick={() => onDeletePet?.(pet.id)}
          className="flex h-8 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-500 transition hover:bg-rose-100"
          aria-label={`Delete ${pet.name || "pet"}`}
        >
          <FiTrash2 size={13} />
        </button>
      </div>
    </motion.article>
  );
};

export default CompactPetCard;

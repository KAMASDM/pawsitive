import React from "react";
import { FiActivity, FiBell, FiCheck, FiPlus, FiShare2 } from "react-icons/fi";

export default function OnboardingChecklist({ pets = [], onAddPet, onAddHealthRecord, onEnableNotifications }) {
  const hasPet = pets.length > 0;
  const hasHealthRecord = pets.some((pet) => (pet.vaccinations || []).length > 0);
  const hasSharedProfile = pets.some((pet) => Boolean(pet.slug));
  const notificationsEnabled = typeof Notification !== "undefined" && Notification.permission === "granted";

  const items = [
    {
      label: "Add your first pet",
      done: hasPet,
      action: onAddPet,
      actionLabel: "Add",
      Icon: FiPlus,
    },
    {
      label: "Add a health record",
      done: hasHealthRecord,
      action: onAddHealthRecord || onAddPet,
      actionLabel: "Open",
      Icon: FiActivity,
    },
    {
      label: "Enable reminders",
      done: notificationsEnabled,
      action: onEnableNotifications,
      actionLabel: "Enable",
      Icon: FiBell,
    },
    {
      label: "Create a shareable pet profile",
      done: hasSharedProfile,
      action: onAddPet,
      actionLabel: "Open",
      Icon: FiShare2,
    },
  ];

  if (items.every((item) => item.done)) return null;

  return (
    <section className="rounded-2xl bg-white border border-violet-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-extrabold text-slate-800">Quick setup</p>
          <p className="text-xs text-gray-400 mt-0.5">Finish these to unlock the best Pawppy experience.</p>
        </div>
        <span className="text-xs font-bold text-violet-600 bg-violet-50 rounded-full px-2 py-1">
          {items.filter((item) => item.done).length}/{items.length}
        </span>
      </div>
      <div className="space-y-2">
        {items.map(({ label, done, action, actionLabel, Icon }) => (
          <button
            key={label}
            onClick={done ? undefined : action}
            className="w-full flex items-center gap-3 rounded-xl border border-violet-50 bg-violet-50/40 px-3 py-2.5 text-left"
          >
            <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${done ? "bg-emerald-100 text-emerald-600" : "bg-white text-violet-500"}`}>
              {done ? <FiCheck size={14} /> : <Icon size={14} />}
            </span>
            <span className={`flex-1 text-sm font-semibold ${done ? "text-gray-400 line-through" : "text-slate-700"}`}>
              {label}
            </span>
            {!done && <span className="text-xs font-bold text-violet-600">{actionLabel}</span>}
          </button>
        ))}
      </div>
    </section>
  );
}

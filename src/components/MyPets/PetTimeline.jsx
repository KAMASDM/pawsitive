import React from "react";
import { FiCalendar, FiChevronRight, FiHeart, FiMessageSquare } from "react-icons/fi";
import { FaSyringe } from "react-icons/fa";

const toTime = (value) => {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
};

const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

export default function PetTimeline({
  pet,
  posts = [],
  events = [],
  requests = [],
  onHealth,
  onRequests,
  onFeed,
}) {
  const now = new Date();
  const soon = new Date();
  soon.setDate(now.getDate() + 30);

  const vaccineItems = (pet?.vaccinations || [])
    .filter((vac) => vac.nextDue && new Date(vac.nextDue) <= soon)
    .map((vac) => ({
      id: `vac-${vac.id || vac.name}`,
      type: "Health",
      title: vac.name || "Vaccination",
      detail: new Date(vac.nextDue) < now ? `Overdue since ${formatDate(vac.nextDue)}` : `Due ${formatDate(vac.nextDue)}`,
      tone: new Date(vac.nextDue) < now ? "red" : "amber",
      time: toTime(vac.nextDue),
      Icon: FaSyringe,
      onClick: onHealth,
    }));

  const requestItems = requests
    .filter((request) => request.direction === "incoming" && request.status === "pending")
    .slice(0, 2)
    .map((request) => ({
      id: `request-${request.id}`,
      type: "Request",
      title: `${request.senderPetName || "A pet"} wants to connect`,
      detail: request.senderName ? `From ${request.senderName}` : "New request waiting",
      tone: "pink",
      time: request.createdAt || Date.now(),
      Icon: FiHeart,
      onClick: onRequests,
    }));

  const eventItems = events
    .filter((event) => event.date && new Date(event.date) >= now)
    .slice(0, 2)
    .map((event) => ({
      id: `event-${event.id}`,
      type: "Event",
      title: event.title,
      detail: formatDate(event.date),
      tone: "violet",
      time: toTime(event.date),
      Icon: FiCalendar,
      onClick: onFeed,
    }));

  const postItems = posts.slice(0, 1).map((post) => ({
    id: `post-${post.id}`,
    type: "Post",
    title: post.caption || post.text || "Latest post",
    detail: "Recent memory",
    tone: "blue",
    time: post.timestamp || 0,
    Icon: FiMessageSquare,
    onClick: onFeed,
  }));

  const items = [...vaccineItems, ...requestItems, ...eventItems, ...postItems]
    .sort((a, b) => b.time - a.time)
    .slice(0, 5);

  if (items.length === 0) {
    return (
      <section className="px-4 mt-4">
        <button
          onClick={onFeed}
          className="w-full rounded-2xl bg-white border border-violet-100 px-4 py-4 text-left shadow-sm"
        >
          <p className="text-sm font-bold text-slate-800">Timeline is ready</p>
          <p className="text-xs text-gray-400 mt-1">Posts, events, reminders, and requests will appear here together.</p>
        </button>
      </section>
    );
  }

  const toneClass = {
    red: "bg-red-50 text-red-600 border-red-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    pink: "bg-pink-50 text-pink-600 border-pink-100",
    violet: "bg-violet-50 text-violet-600 border-violet-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
  };

  return (
    <section className="px-4 mt-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-base font-extrabold text-slate-800">Today with {pet?.name}</p>
          <p className="text-xs text-gray-400">One place for care, requests, events, and memories.</p>
        </div>
        <button onClick={onFeed} className="text-xs font-bold text-violet-600 flex items-center gap-1">
          Feed <FiChevronRight size={13} />
        </button>
      </div>
      <div className="space-y-2">
        {items.map(({ id, type, title, detail, tone, Icon, onClick }) => (
          <button
            key={id}
            onClick={onClick}
            className="w-full bg-white border border-violet-100 rounded-2xl px-3 py-3 flex items-center gap-3 text-left shadow-sm"
          >
            <span className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${toneClass[tone]}`}>
              <Icon size={16} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-bold text-violet-400 uppercase tracking-widest">{type}</span>
              <span className="block text-sm font-bold text-slate-700 truncate">{title}</span>
              <span className="block text-xs text-gray-400 truncate">{detail}</span>
            </span>
            <FiChevronRight size={14} className="text-gray-300" />
          </button>
        ))}
      </div>
    </section>
  );
}

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { onValue, ref, update } from "firebase/database";
import {
  FiBell,
  FiCheck,
  FiClock,
  FiMessageSquare,
  FiRefreshCw,
  FiShield,
} from "react-icons/fi";
import { auth, database } from "../../firebase";
import { clearUnreadNotifications } from "../../services/badgeService";
import { PageHeader } from "../UI/AppUI";
import "./NotificationsInbox.css";

const toMillis = (value) => {
  if (!value) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (typeof value === "object" && typeof value.seconds === "number") {
    return value.seconds * 1000;
  }
  return 0;
};

const getNotificationPath = (item) =>
  item.data?.click_action || item.data?.path || item.click_action || item.path || null;

const normalizeNotification = ([id, data], source, readMap = {}) => {
  const timestamp = toMillis(data.timestamp || data.createdAt || data.sentAt);
  const broadcastRead = source === "broadcast" && readMap[id]?.read === true;

  return {
    id,
    source,
    type: data.type || data.data?.type || "general",
    title: data.title || data.heading || data.placeName || "Pawppy update",
    body: data.body || data.message || data.comment || data.description || "",
    timestamp,
    read: source === "broadcast" ? broadcastRead : data.read === true,
    data: data.data || {},
    raw: data,
  };
};

const typeMeta = {
  message: { label: "Message", Icon: FiMessageSquare, tone: "bg-blue-50 text-blue-600" },
  mating_request: { label: "Request", Icon: FiShield, tone: "bg-pink-50 text-pink-600" },
  pet_friendly_place: { label: "Place", Icon: FiBell, tone: "bg-emerald-50 text-emerald-600" },
  new_challenge: { label: "Challenge", Icon: FiBell, tone: "bg-violet-50 text-violet-600" },
  new_quiz: { label: "Quiz", Icon: FiBell, tone: "bg-indigo-50 text-indigo-600" },
  push: { label: "Alert", Icon: FiBell, tone: "bg-violet-50 text-violet-600" },
  general: { label: "Update", Icon: FiBell, tone: "bg-gray-50 text-gray-600" },
};

export default function NotificationsInbox() {
  const navigate = useNavigate();
  const [user, setUser] = useState(auth.currentUser);
  const [personalItems, setPersonalItems] = useState([]);
  const [broadcastRecords, setBroadcastRecords] = useState([]);
  const [broadcastReads, setBroadcastReads] = useState({});
  const [loading, setLoading] = useState({ auth: true, personal: true, broadcast: true, reads: true });
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");

  useEffect(() => onAuthStateChanged(auth, (nextUser) => {
    setUser(nextUser);
    setLoading((current) => ({ ...current, auth: false }));
  }), []);

  useEffect(() => {
    if (loading.auth) return undefined;
    if (!user) {
      setPersonalItems([]);
      setBroadcastReads({});
      setLoading((current) => ({ ...current, personal: false, reads: false }));
      return undefined;
    }

    setLoading((current) => ({ ...current, personal: true, reads: true }));
    const notificationsRef = ref(database, `notifications/${user.uid}`);
    const readsRef = ref(database, `notificationReads/${user.uid}`);

    const unsubscribeNotifications = onValue(
      notificationsRef,
      (snapshot) => {
        const value = snapshot.val() || {};
        setPersonalItems(Object.entries(value).map((entry) => normalizeNotification(entry, "personal")));
        setLoading((current) => ({ ...current, personal: false }));
        setError("");
      },
      () => {
        setError("We could not load your personal notifications.");
        setLoading((current) => ({ ...current, personal: false }));
      }
    );

    const unsubscribeReads = onValue(
      readsRef,
      (snapshot) => {
        setBroadcastReads(snapshot.val() || {});
        setLoading((current) => ({ ...current, reads: false }));
      },
      () => {
        setBroadcastReads({});
        setLoading((current) => ({ ...current, reads: false }));
      }
    );

    return () => {
      unsubscribeNotifications();
      unsubscribeReads();
    };
  }, [loading.auth, user]);

  useEffect(() => {
    setLoading((current) => ({ ...current, broadcast: true }));
    const broadcastsRef = ref(database, "broadcastNotifications");
    const unsubscribe = onValue(
      broadcastsRef,
      (snapshot) => {
        const value = snapshot.val() || {};
        setBroadcastRecords(Object.entries(value).filter(([, item]) => item.active !== false));
        setLoading((current) => ({ ...current, broadcast: false }));
        setError("");
      },
      () => {
        setBroadcastRecords([]);
        setLoading((current) => ({ ...current, broadcast: false }));
      }
    );
    return () => unsubscribe();
  }, []);

  const broadcastItems = useMemo(
    () => broadcastRecords.map((entry) => normalizeNotification(entry, "broadcast", broadcastReads)),
    [broadcastReads, broadcastRecords]
  );

  const items = useMemo(() => {
    const merged = [...personalItems, ...broadcastItems]
      .sort((a, b) => b.timestamp - a.timestamp);
    return filter === "unread" ? merged.filter((item) => !item.read) : merged;
  }, [broadcastItems, filter, personalItems]);

  const unreadCount = useMemo(
    () => [...personalItems, ...broadcastItems].filter((item) => !item.read).length,
    [broadcastItems, personalItems]
  );

  const isLoading = loading.auth || loading.personal || loading.broadcast || loading.reads;

  const markRead = async (item) => {
    if (!user || item.read) return;
    if (item.source === "broadcast") {
      setBroadcastReads((current) => ({
        ...current,
        [item.id]: { read: true, readAt: Date.now() },
      }));
      await update(ref(database), {
        [`notificationReads/${user.uid}/${item.id}`]: {
          read: true,
          readAt: Date.now(),
        },
      }).catch(() => {});
      return;
    }
    await update(ref(database), {
      [`notifications/${user.uid}/${item.id}/read`]: true,
    });
  };

  const markAllRead = async () => {
    if (!user || unreadCount === 0) return;
    const updates = {};
    [...personalItems, ...broadcastItems].forEach((item) => {
      if (item.read) return;
      if (item.source === "broadcast") {
        updates[`notificationReads/${user.uid}/${item.id}`] = { read: true, readAt: Date.now() };
      } else {
        updates[`notifications/${user.uid}/${item.id}/read`] = true;
      }
    });
    setBroadcastReads((current) => {
      const next = { ...current };
      broadcastItems.forEach((item) => {
        next[item.id] = { read: true, readAt: Date.now() };
      });
      return next;
    });
    await update(ref(database), updates).catch(() => {});
    await clearUnreadNotifications(user.uid);
  };

  const goForNotification = async (item) => {
    await markRead(item);
    const path = getNotificationPath(item) || getNotificationPath(item.raw);
    if (path) navigate(path);
  };

  if (!loading.auth && !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white border border-violet-100 rounded-2xl p-6 text-center shadow-sm">
          <FiBell className="w-10 h-10 text-violet-300 mx-auto mb-3" />
          <p className="font-extrabold text-slate-800">Sign in to view notifications</p>
          <button onClick={() => navigate("/login")} className="mt-4 rounded-full bg-violet-600 text-white text-sm font-bold px-5 py-2">
            Sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page app-page-narrow inbox-page">
      <PageHeader eyebrow="You’re in the loop" title="Notifications" description={unreadCount ? `${unreadCount} unread ${unreadCount === 1 ? 'update' : 'updates'}` : 'All caught up. A little peace of mind.'} />
      <div>
        <div className="inbox-toolbar">
          <div className="inbox-filters" role="group" aria-label="Filter notifications">
            {["all", "unread"].map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => setFilter(item)}
                aria-pressed={filter === item}
                className="inbox-filter"
              >
                {item === "all" ? "All" : "Unread"}
              </button>
            ))}
          </div>
          <button type="button" onClick={markAllRead} disabled={isLoading || unreadCount === 0} className="app-text-button inbox-mark-read">Mark all read</button>
        </div>

        {error && (
          <div className="mb-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700 flex items-center gap-2">
            <FiRefreshCw size={15} />
            {error}
          </div>
        )}

        <div className="space-y-3">
          {isLoading ? (
            [1, 2, 3].map((item) => (
              <div key={item} className="h-20 rounded-2xl bg-white border border-violet-100 animate-pulse" />
            ))
          ) : items.length === 0 ? (
            <div className="bg-white border border-violet-100 rounded-2xl text-center py-16 px-6">
              <FiBell className="w-10 h-10 text-violet-200 mx-auto mb-3" />
              <p className="font-bold text-slate-700">Nothing waiting</p>
              <p className="text-sm text-gray-400 mt-1">Live app alerts and Pawppy updates will appear here.</p>
            </div>
          ) : (
            items.map((item) => {
              const meta = typeMeta[item.type] || typeMeta.general;
              const Icon = meta.Icon;
              return (
                <button
                  type="button"
                  key={`${item.source}-${item.id}`}
                  onClick={() => goForNotification(item)}
                  className="inbox-notification app-panel"
                >
                  <span aria-hidden="true" className={`inbox-notification-icon ${item.read ? "bg-gray-100 text-gray-400" : meta.tone}`}>
                    {item.read ? <FiCheck size={16} /> : <Icon size={16} />}
                  </span>
                  <span className="inbox-notification-copy">
                    <span className="inbox-notification-meta">
                      <span className="inbox-notification-type">{meta.label}</span>
                      {item.source === "broadcast" && <span className="inbox-notification-source">Pawppy</span>}
                      {!item.read && <span className="inbox-notification-unread"><span className="sr-only">Unread</span></span>}
                    </span>
                    <span className="inbox-notification-title">{item.title}</span>
                    {item.body && <span className="inbox-notification-body">{item.body}</span>}
                    {item.timestamp > 0 && (
                      <span className="inbox-notification-time">
                        <FiClock size={12} aria-hidden="true" />
                        <time dateTime={new Date(item.timestamp).toISOString()}>{new Date(item.timestamp).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</time>
                      </span>
                    )}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

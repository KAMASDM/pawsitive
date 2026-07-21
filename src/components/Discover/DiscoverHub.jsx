import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiActivity,
  FiAlertTriangle,
  FiArrowRight,
  FiBookOpen,
  FiHeart,
  FiMapPin,
  FiSearch,
  FiShoppingBag,
  FiUsers,
} from "react-icons/fi";
import { triggerSearch } from "../Search/GlobalSearch";
import PawMark from "../Brand/PawMark";

const discoveryCards = [
  {
    title: "Pet care near you",
    detail: "Vets, emergency hospitals, groomers, boarding and pet stores",
    path: "/resource",
    Icon: FiMapPin,
    tone: "text-violet-700",
    soft: "bg-violet-100",
  },
  {
    title: "Meet other pets",
    detail: "Search public pet profiles and connect with nearby pet parents",
    path: "/nearby-mates",
    Icon: FiUsers,
    tone: "text-teal-700",
    soft: "bg-teal-100",
  },
  {
    title: "Adopt a pet",
    detail: "Browse pets that are ready to meet their next family",
    path: "/adopt-pets",
    Icon: FiHeart,
    tone: "text-rose-700",
    soft: "bg-rose-100",
  },
  {
    title: "Lost & found",
    detail: "Report, search, match and help reunite pets with their families",
    path: "/lost-and-found",
    Icon: FiAlertTriangle,
    tone: "text-amber-700",
    soft: "bg-amber-100",
  },
  {
    title: "Pet-friendly places",
    detail: "Explore community-tagged parks, cafes and useful local places",
    path: "/place-tagging",
    Icon: FiMapPin,
    tone: "text-emerald-700",
    soft: "bg-emerald-100",
  },
  {
    title: "Pawppy Market",
    detail: "Find food, toys, care essentials and independent pet sellers",
    path: "/shop",
    Icon: FiShoppingBag,
    tone: "text-indigo-700",
    soft: "bg-indigo-100",
  },
];

const playCards = [
  { title: "Weekly challenge", detail: "Share, vote and earn XP", path: "/challenge", Icon: FiActivity },
  { title: "Pet quiz", detail: "Learn and climb the leaderboard", path: "/quiz", Icon: FiBookOpen },
];

export default function DiscoverHub() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f7f5fb] pb-28 md:pb-12">
      <section className="relative overflow-hidden bg-[#30274e] text-white">
        <PawMark size={240} className="absolute -bottom-20 -right-10 rotate-[-14deg] opacity-[0.045]" />
        <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-200">Discover Pawppy</p>
          <h1 className="mt-2 max-w-2xl text-3xl font-black tracking-[-0.04em] sm:text-4xl">
            Everything for pet life, in one place.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-violet-100/70 sm:text-base">
            Search for pets, find trusted care nearby, help your community or explore something fun.
          </p>
          <button
            onClick={() => triggerSearch()}
            className="mt-7 flex w-full max-w-xl items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3.5 text-left text-sm text-violet-100 backdrop-blur-xl transition hover:bg-white/15"
          >
            <FiSearch size={18} />
            <span className="flex-1">Search pets, vets, groomers and features</span>
            <span className="hidden rounded-lg bg-white/10 px-2 py-1 text-[10px] sm:block">⌘ K</span>
          </button>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-500">Explore</p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-[#2d2547]">What are you looking for?</h2>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {discoveryCards.map(({ title, detail, path, Icon, tone, soft }, index) => (
            <motion.button
              key={path}
              onClick={() => navigate(path)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="group flex min-h-36 items-start gap-4 rounded-[24px] border border-white bg-white/85 p-5 text-left shadow-[0_10px_35px_rgba(66,50,108,0.07)] transition hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(66,50,108,0.11)]"
            >
              <span className={`grid h-12 w-12 flex-none place-items-center rounded-2xl ${soft} ${tone}`}><Icon size={20} /></span>
              <span className="min-w-0 flex-1">
                <strong className="block text-base font-black text-[#30274e]">{title}</strong>
                <span className="mt-1.5 block text-xs leading-5 text-slate-500">{detail}</span>
              </span>
              <FiArrowRight className="mt-1 flex-none text-slate-300 transition group-hover:translate-x-1" />
            </motion.button>
          ))}
        </div>

        <section className="mt-8 rounded-[28px] bg-gradient-to-r from-[#e9e1f8] to-[#f6eadb] p-5 sm:p-6">
          <div className="mb-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-500">Play & learn</p>
            <h2 className="mt-1 text-lg font-black text-[#30274e]">A little joy for you and your pet</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {playCards.map(({ title, detail, path, Icon }) => (
              <button key={path} onClick={() => navigate(path)} className="flex items-center gap-3 rounded-2xl bg-white/75 p-4 text-left shadow-sm transition hover:bg-white">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#4a3d7d] text-white"><Icon /></span>
                <span className="flex-1"><strong className="block text-sm font-black text-[#30274e]">{title}</strong><span className="text-[11px] text-slate-500">{detail}</span></span>
                <FiArrowRight className="text-violet-400" />
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

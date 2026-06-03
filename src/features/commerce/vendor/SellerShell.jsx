import React from "react";
import { Link, NavLink } from "react-router-dom";
import { BarChart3, Boxes, ClipboardList, Plus, Store } from "lucide-react";
import { useCommerceUser } from "../auth/useCommerceUser";

const navItems = [
  { to: "/vendor/dashboard", label: "Dashboard", icon: BarChart3 },
  { to: "/vendor/products", label: "Products", icon: Boxes },
  { to: "/vendor/orders", label: "Orders", icon: ClipboardList },
  { to: "/vendor/store", label: "Store", icon: Store },
  { to: "/vendor/products/new", label: "Add", icon: Plus },
];

const SellerShell = ({ children, title, eyebrow, action }) => {
  const { vendor } = useCommerceUser();

  return (
    <div className="min-h-screen bg-[#f7f4ff] px-4 py-5 pb-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 overflow-hidden rounded-[28px] bg-[#20164d] text-white shadow-xl shadow-violet-200/70">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-violet-100">
                <Store className="h-3.5 w-3.5" />
                {eyebrow || vendor?.businessName || "Pawppy Seller"}
              </div>
              <h1 className="text-2xl font-black tracking-normal sm:text-3xl">{title}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-violet-100">
                Manage your Pawppy store, catalog, inventory, and launch-ready product pages from one workspace.
              </p>
            </div>
            {action}
          </div>
          <div className="flex gap-2 overflow-x-auto border-t border-white/10 px-4 py-3 sm:px-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${
                      isActive ? "bg-white text-[#20164d]" : "bg-white/10 text-violet-100 hover:bg-white/15"
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}
            <Link
              to="/vendor/status"
              className="inline-flex shrink-0 items-center rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-violet-100 hover:bg-white/15"
            >
              Compliance
            </Link>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
};

export default SellerShell;

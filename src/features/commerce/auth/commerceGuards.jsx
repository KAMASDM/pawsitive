import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import SplashScreen from "../../../components/Loaders/SplashScreen";
import { COMMERCE_ADMIN_EMAIL, hasRole, useCommerceUser } from "./useCommerceUser";

const GuardShell = ({ children, fallback }) => {
  const commerceUser = useCommerceUser();

  if (commerceUser.loading) return <SplashScreen />;
  return fallback(commerceUser) || children;
};

export const RequireAuth = ({ children }) => {
  const location = useLocation();
  return (
    <GuardShell
      fallback={({ user }) => (!user ? <Navigate to="/" replace state={{ from: location.pathname }} /> : null)}
    >
      {children}
    </GuardShell>
  );
};

export const RequireRole = ({ role, children }) => {
  const location = useLocation();
  return (
    <GuardShell
      fallback={({ user, claims, profile }) => {
        if (!user) return <Navigate to="/" replace state={{ from: location.pathname }} />;
        if (role === "admin" && user.email?.toLowerCase() === COMMERCE_ADMIN_EMAIL) return null;
        if (!hasRole(claims, profile, role)) return <Navigate to="/my-pets" replace />;
        return null;
      }}
    >
      {children}
    </GuardShell>
  );
};

export const RequireApprovedVendor = ({ children }) => {
  const location = useLocation();
  return (
    <GuardShell
      fallback={({ user, claims, profile, vendor }) => {
        if (!user) return <Navigate to="/" replace state={{ from: location.pathname }} />;
        if (!hasRole(claims, profile, "vendor")) return <Navigate to="/vendor/register" replace />;
        if (vendor?.status !== "approved") return <Navigate to="/vendor/status" replace />;
        return null;
      }}
    >
      {children}
    </GuardShell>
  );
};

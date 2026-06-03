import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../../../firebase";
import { callCommerceFunction } from "../services/netlifyCommerceApi";

export const COMMERCE_ADMIN_EMAIL = "anantsoftcomputing@gmail.com";

const initialState = {
  loading: true,
  user: null,
  claims: {},
  profile: null,
  vendorId: null,
  vendor: null,
};

export const useCommerceUser = () => {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    let unsubscribeProfile = () => {};
    let unsubscribeVendor = () => {};

    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      unsubscribeProfile();
      unsubscribeVendor();

      if (!user) {
        setState({ ...initialState, loading: false });
        return;
      }

      const token = await user.getIdTokenResult();
      const claims = token.claims || {};

      unsubscribeProfile = onSnapshot(doc(db, "users", user.uid), (profileSnapshot) => {
        const profile = profileSnapshot.exists() ? { id: profileSnapshot.id, ...profileSnapshot.data() } : null;
        const vendorId = claims.vendorId || profile?.vendorId || null;

        setState((current) => ({
          ...current,
          loading: !vendorId && false,
          user,
          claims,
          profile,
          vendorId,
          vendor: vendorId ? current.vendor : null,
        }));

        unsubscribeVendor();
        if (vendorId) {
          unsubscribeVendor = onSnapshot(doc(db, "vendors", vendorId), (vendorSnapshot) => {
            setState((current) => ({
              ...current,
              loading: false,
              vendor: vendorSnapshot.exists() ? { id: vendorSnapshot.id, ...vendorSnapshot.data() } : null,
            }));
          });
        }
      });
    });

    return () => {
      unsubscribeAuth();
      unsubscribeProfile();
      unsubscribeVendor();
    };
  }, []);

  return state;
};

export const hasRole = (claims = {}, profile = null, role) => {
  if (!role) return true;
  if (claims.role === "admin") return true;
  if (claims.role === role) return true;
  return profile?.role === role;
};

export const ensureCommerceAdminClaim = async () => {
  const user = auth.currentUser;
  if (!user || user.email?.toLowerCase() !== COMMERCE_ADMIN_EMAIL) return false;
  const token = await user.getIdTokenResult();
  if (token.claims?.role === "admin") return true;

  await callCommerceFunction("commerce-provision-admin");
  await user.getIdToken(true);
  return true;
};

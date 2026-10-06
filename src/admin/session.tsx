import type { Session } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { adminDb } from "@/admin/supabase";
import { CMS_CONFIG } from "@/cms/config";

export type AdminRole = "super" | "admin" | "editor" | "contributor";

type AdminSession = {
  status: "loading" | "signed-out" | "set-password" | "no-access" | "ready";
  session: Session | null;
  role: AdminRole | null;
  signOut: () => Promise<void>;
  passwordSet: () => void;
};

const Ctx = createContext<AdminSession | null>(null);

export const ROLE_LABELS: Record<AdminRole, string> = {
  super: "Super-administratrice",
  admin: "Administrateur",
  editor: "Éditeur",
  contributor: "Contributeur",
};

async function roleOf(userId: string): Promise<AdminRole | null> {
  const db = adminDb();
  const [platform, member] = await Promise.all([
    db.from("platform_admins").select("user_id").eq("user_id", userId).maybeSingle(),
    db.from("site_members").select("role").eq("site_id", CMS_CONFIG.siteId).eq("user_id", userId).maybeSingle(),
  ]);
  if (platform.data) return "super";
  return (member.data?.role as AdminRole | undefined) ?? null;
}

/** Arrivée par un lien d'invitation ou de réinitialisation : il faut choisir un mot de passe. */
function arrivedToSetPassword() {
  const hash = window.location.hash;
  return /type=(invite|recovery)/.test(hash);
}

export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Omit<AdminSession, "signOut" | "passwordSet">>({ status: "loading", session: null, role: null });

  const resolve = useCallback(async (session: Session | null, mustSetPassword: boolean) => {
    if (!session) return setState({ status: "signed-out", session: null, role: null });
    const role = await roleOf(session.user.id);
    if (mustSetPassword) return setState({ status: "set-password", session, role });
    setState({ status: role ? "ready" : "no-access", session, role });
  }, []);

  useEffect(() => {
    const db = adminDb();
    const mustSetPassword = arrivedToSetPassword();
    db.auth.getSession().then(({ data }) => resolve(data.session, mustSetPassword));
    const { data } = db.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") void resolve(session, true);
      else if (event === "SIGNED_OUT") void resolve(null, false);
      else if (event === "SIGNED_IN") void resolve(session, arrivedToSetPassword());
    });
    return () => data.subscription.unsubscribe();
  }, [resolve]);

  const signOut = useCallback(async () => {
    await adminDb().auth.signOut();
  }, []);
  const passwordSet = useCallback(() => {
    history.replaceState(null, "", window.location.pathname);
    setState((s) => ({ ...s, status: s.role ? "ready" : "no-access" }));
  }, []);

  return <Ctx.Provider value={{ ...state, signOut, passwordSet }}>{children}</Ctx.Provider>;
}

export function useAdminSession(): AdminSession {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAdminSession hors du back-office");
  return ctx;
}

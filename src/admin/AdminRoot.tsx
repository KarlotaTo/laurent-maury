import { Outlet } from "@tanstack/react-router";
import { LoginScreen } from "@/admin/screens/Login";
import { NoAccessScreen } from "@/admin/screens/NoAccess";
import { SetPasswordScreen } from "@/admin/screens/SetPassword";
import { AdminShell } from "@/admin/screens/Shell";
import { AdminSessionProvider, useAdminSession } from "@/admin/session";

function Gate() {
  const { status } = useAdminSession();
  if (status === "loading") return <p className="py-24 text-center text-muted-foreground">Chargement…</p>;
  if (status === "signed-out") return <LoginScreen />;
  if (status === "set-password") return <SetPasswordScreen />;
  if (status === "no-access") return <NoAccessScreen />;
  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}

/** Racine du back-office : session, contrôle d'accès, puis cadre et écrans. */
export function AdminRoot() {
  return (
    <AdminSessionProvider>
      <Gate />
    </AdminSessionProvider>
  );
}

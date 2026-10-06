import { useAdminSession } from "@/admin/session";
import { btnDark, SplitScreen } from "@/admin/ui";

export function NoAccessScreen() {
  const { session, signOut } = useAdminSession();
  return (
    <SplitScreen>
      <h1 className="font-display text-4xl text-accent">Accès non autorisé</h1>
      <p className="mt-3 text-[15px] text-ink-soft">
        Le compte {session?.user.email} n'a pas accès à l'administration de ce site. Si c'est une erreur, contactez votre administratrice.
      </p>
      <button type="button" onClick={() => void signOut()} className={`${btnDark} mt-8 w-full`}>
        Se déconnecter
      </button>
    </SplitScreen>
  );
}

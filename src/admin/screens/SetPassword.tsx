import { useState, type FormEvent } from "react";
import { useAdminSession } from "@/admin/session";
import { adminDb, frenchAuthError } from "@/admin/supabase";
import { btnDark, ErrorNote, Field, inputCls, SplitScreen } from "@/admin/ui";

const RULE = "Au moins 10 caractères, avec des minuscules, des majuscules et des chiffres.";
const valid = (p: string) => p.length >= 10 && /[a-z]/.test(p) && /[A-Z]/.test(p) && /\d/.test(p);

/** Arrivée par une invitation ou un lien « mot de passe oublié » : choix du mot de passe. */
export function SetPasswordScreen() {
  const { session, passwordSet } = useAdminSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password"));
    if (!valid(password)) return setError(RULE);
    if (password !== String(form.get("confirm"))) return setError("Les deux mots de passe ne sont pas identiques.");
    setBusy(true);
    setError(null);
    const { error } = await adminDb().auth.updateUser({ password });
    setBusy(false);
    if (error) setError(frenchAuthError(error.message));
    else passwordSet();
  };

  return (
    <SplitScreen>
      <h1 className="font-display text-4xl text-accent">Choisissez votre mot de passe</h1>
      <p className="mt-2 text-[15px] text-ink-soft">Pour le compte {session?.user.email}.</p>
      <form onSubmit={submit} className="mt-8 space-y-5">
        <Field id="password" label="Nouveau mot de passe" hint={RULE}>
          <input id="password" name="password" type="password" required autoComplete="new-password" className={inputCls} />
        </Field>
        <Field id="confirm" label="Confirmer le mot de passe">
          <input id="confirm" name="confirm" type="password" required autoComplete="new-password" className={inputCls} />
        </Field>
        {error ? <ErrorNote>{error}</ErrorNote> : null}
        <button type="submit" disabled={busy} className={`${btnDark} w-full`}>
          {busy ? "Enregistrement…" : "Enregistrer et accéder au back-office"}
        </button>
      </form>
    </SplitScreen>
  );
}

import { useState, type FormEvent } from "react";
import { adminDb, frenchAuthError } from "@/admin/supabase";
import { btnDark, ErrorNote, Field, inputCls, SplitScreen, SuccessNote } from "@/admin/ui";

export function LoginScreen() {
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const login = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    const { error } = await adminDb().auth.signInWithPassword({
      email: String(form.get("email")).trim(),
      password: String(form.get("password")),
    });
    setBusy(false);
    if (error) setError(frenchAuthError(error.message));
  };

  const forgot = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email")).trim();
    setBusy(true);
    setError(null);
    const { error } = await adminDb().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin`,
    });
    setBusy(false);
    // Même message que l'adresse existe ou non : on ne révèle pas qui a un compte.
    if (error && !/user not found/i.test(error.message)) setError(frenchAuthError(error.message));
    else setSent(true);
  };

  return (
    <SplitScreen>
      <h1 className="font-display text-4xl text-accent">{mode === "login" ? "Bienvenue" : "Mot de passe oublié"}</h1>
      <p className="mt-2 text-[15px] text-ink-soft">
        {mode === "login"
          ? "Accédez à votre espace d'administration"
          : "Indiquez votre e-mail : vous recevrez un lien pour choisir un nouveau mot de passe."}
      </p>

      {mode === "login" ? (
        <form onSubmit={login} className="mt-8 space-y-5">
          <Field id="email" label="E-mail">
            <input id="email" name="email" type="email" required autoComplete="email" className={inputCls} />
          </Field>
          <Field id="password" label="Mot de passe">
            <input id="password" name="password" type="password" required autoComplete="current-password" className={inputCls} />
          </Field>
          {error ? <ErrorNote>{error}</ErrorNote> : null}
          <button type="submit" disabled={busy} className={`${btnDark} w-full`}>
            {busy ? "Connexion…" : "Se connecter"}
          </button>
          <button type="button" onClick={() => { setMode("forgot"); setError(null); }} className="text-[14px] text-accent underline-offset-4 hover:underline">
            Mot de passe oublié ?
          </button>
        </form>
      ) : sent ? (
        <div className="mt-8 space-y-5">
          <SuccessNote>Si un compte existe pour cette adresse, un e-mail vient d'être envoyé. Pensez à regarder dans les indésirables.</SuccessNote>
          <button type="button" onClick={() => { setMode("login"); setSent(false); }} className="text-[14px] text-accent underline-offset-4 hover:underline">
            Retour à la connexion
          </button>
        </div>
      ) : (
        <form onSubmit={forgot} className="mt-8 space-y-5">
          <Field id="email" label="E-mail">
            <input id="email" name="email" type="email" required autoComplete="email" className={inputCls} />
          </Field>
          {error ? <ErrorNote>{error}</ErrorNote> : null}
          <button type="submit" disabled={busy} className={`${btnDark} w-full`}>
            {busy ? "Envoi…" : "Recevoir le lien"}
          </button>
          <button type="button" onClick={() => { setMode("login"); setError(null); }} className="text-[14px] text-accent underline-offset-4 hover:underline">
            Retour à la connexion
          </button>
        </form>
      )}
      <p className="mt-10 text-center text-[12px] text-muted-foreground">Espace sécurisé · conçu par UpSEO</p>
    </SplitScreen>
  );
}

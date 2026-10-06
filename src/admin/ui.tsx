import type { ReactNode } from "react";
import { useSite } from "@/cms/context";

/** Petits éléments d'interface communs au back-office. */

export function SiteWordmark({ className = "" }: { className?: string }) {
  const name = useSite().general.name;
  const [first, ...rest] = name.split(" ");
  return (
    <span className={`font-display leading-none ${className}`}>
      {first} {rest.length ? <span className="text-accent">{rest.join(" ")}</span> : null}
    </span>
  );
}

export function Field({ id, label, hint, children }: { id: string; label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-ink">
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export const inputCls =
  "w-full min-h-11 rounded-lg border border-line bg-background px-3.5 py-2.5 text-[15px] text-ink placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 read-only:cursor-not-allowed read-only:border-dashed read-only:bg-sand read-only:text-muted-foreground";

export const btnPrimary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-accent px-5 text-[14px] font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";
export const btnDark =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-[14px] font-medium text-primary-foreground transition-colors hover:bg-ink disabled:cursor-not-allowed disabled:opacity-50";
export const btnGhost =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line bg-background px-4 text-[14px] text-ink transition-colors hover:bg-sand disabled:cursor-not-allowed disabled:opacity-50";

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-lg border border-accent/30 bg-accent/5 px-3.5 py-2.5 text-[14px] text-accent">
      {children}
    </p>
  );
}

export function SuccessNote({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-[14px] text-emerald-800">
      {children}
    </p>
  );
}

/** Écran en deux colonnes (connexion, mot de passe) : nom du site à gauche, carte à droite. */
export function SplitScreen({ children }: { children: ReactNode }) {
  const g = useSite().general;
  return (
    <div className="flex min-h-screen flex-wrap bg-background">
      <div className="flex flex-[1_1_420px] flex-col items-center justify-center gap-4 bg-sand px-8 py-16 text-center">
        <SiteWordmark className="text-6xl text-ink" />
        <p className="text-[12px] uppercase tracking-[0.28em] text-muted-foreground">
          {g.baseline} · depuis {g.since}
        </p>
      </div>
      <div className="flex flex-[1_1_480px] items-center justify-center px-5 py-12">
        <div className="w-full max-w-md rounded-2xl border border-line bg-background p-8 sm:p-10">{children}</div>
      </div>
    </div>
  );
}

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { CMS_CONFIG } from "@/cms/config";

/**
 * Client Supabase du back-office (navigateur uniquement).
 * Toutes les lectures et écritures passent par la session de l'utilisateur :
 * les règles d'accès de la base s'appliquent toujours.
 */
let client: SupabaseClient | null = null;

export function adminDb(): SupabaseClient {
  if (typeof window === "undefined") throw new Error("Le back-office ne s'exécute que dans le navigateur");
  client ??= createClient(CMS_CONFIG.supabaseUrl, CMS_CONFIG.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "implicit" },
  });
  return client;
}

/** Messages d'erreur de connexion, en français. */
export function frenchAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "E-mail ou mot de passe incorrect.";
  if (m.includes("email not confirmed")) return "Adresse e-mail pas encore confirmée : utilisez le lien reçu par e-mail.";
  if (m.includes("rate limit") || m.includes("too many")) return "Trop de tentatives. Patientez quelques minutes avant de réessayer.";
  if (m.includes("password should")) return "Le mot de passe doit faire au moins 10 caractères, avec des minuscules, des majuscules et des chiffres.";
  if (m.includes("same password") || m.includes("different from the old")) return "Choisissez un mot de passe différent de l'ancien.";
  if (m.includes("network") || m.includes("fetch")) return "Connexion impossible. Vérifiez votre accès à internet.";
  return "Une erreur est survenue. Réessayez dans un instant.";
}

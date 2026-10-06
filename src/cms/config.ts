/**
 * Configuration publique du CMS pour ce site.
 * La clé « anon » est publique par conception : la base n'autorise avec elle
 * que la lecture des pages publiées et des réglages publics.
 */
export const CMS_CONFIG = {
  supabaseUrl: "https://bqwpwhyknjxnvbmgpcjx.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxd3B3aHlrbmp4bnZibWdwY2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyNzEzODUsImV4cCI6MjEwNjg0NzM4NX0.hTVpaWiSe2GJNaYHkP5mhdlZtey-GVcBGNc8edUUnDI",
  siteId: "5b13a59a-863b-4595-afdc-4e883d638271",
  /** Durée pendant laquelle le serveur garde les contenus en mémoire (millisecondes). */
  cacheMs: 30_000,
  /** Au-delà, la base est considérée comme injoignable et le filet de sécurité prend le relais. */
  timeoutMs: 2_500,
};

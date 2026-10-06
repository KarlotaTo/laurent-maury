import { useEffect } from "react";
import { useSite } from "@/cms/context";
import { TRACKING_PATTERNS } from "@/cms/settings";

export const CONSENT_KEY = "maury-laurent-cookie-consent";
export const CONSENT_EVENT = "cookie-consent-change";

function addScript(id: string, src: string | null, inline?: string) {
  if (document.getElementById(id)) return;
  const el = document.createElement("script");
  el.id = id;
  el.async = true;
  if (src) el.src = src;
  if (inline) el.text = inline;
  document.head.appendChild(el);
}

/**
 * Outils de mesure connectés dans le back-office (Tag Manager, GA4, Clarity).
 * Chargés uniquement après acceptation des cookies ; les identifiants sont
 * revérifiés ici (format strict) avant tout chargement.
 */
export function TrackingScripts() {
  const { tracking } = useSite();

  useEffect(() => {
    const load = () => {
      let consent: string | null = null;
      try {
        consent = window.localStorage.getItem(CONSENT_KEY);
      } catch {
        consent = null;
      }
      if (consent !== "accepted") return;
      const { gtm, ga4, clarity } = tracking;
      if (gtm && TRACKING_PATTERNS.gtm.test(gtm)) {
        addScript("cms-gtm", null, `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm}');`);
      }
      if (ga4 && TRACKING_PATTERNS.ga4.test(ga4)) {
        addScript("cms-ga4-lib", `https://www.googletagmanager.com/gtag/js?id=${ga4}`);
        addScript("cms-ga4", null, `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4}');`);
      }
      if (clarity && TRACKING_PATTERNS.clarity.test(clarity)) {
        addScript("cms-clarity", null, `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${clarity}");`);
      }
    };
    load();
    window.addEventListener(CONSENT_EVENT, load);
    return () => window.removeEventListener(CONSENT_EVENT, load);
  }, [tracking]);

  return null;
}

/** Balises de validation Search Console et Bing (sans cookie, toujours présentes). */
export function verificationMeta(tracking: { googleVerification?: string; bingVerification?: string }) {
  const meta: { name: string; content: string }[] = [];
  if (tracking.googleVerification && TRACKING_PATTERNS.googleVerification.test(tracking.googleVerification)) {
    meta.push({ name: "google-site-verification", content: tracking.googleVerification });
  }
  if (tracking.bingVerification && TRACKING_PATTERNS.bingVerification.test(tracking.bingVerification)) {
    meta.push({ name: "msvalidate.01", content: tracking.bingVerification });
  }
  return meta;
}

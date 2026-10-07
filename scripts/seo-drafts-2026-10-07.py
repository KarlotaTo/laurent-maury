import json, glob, copy, re, sys
SRC = "src/content/cms/pages"
pages = {json.load(open(f))["path"]: json.load(open(f)) for f in glob.glob(f"{SRC}/*.json")}
out = {}

def page(path):
    p = copy.deepcopy(pages[path]); out[path] = p; return p
def block(p, type_, n=0):
    return [b for b in p["blocks"] if b["type"] == type_][n]["data"]
def replace(text, old, new):
    assert old in text, (old[:60], text[:120]); return text.replace(old, new, 1)
def faq_block(id_, title, eyebrow="Questions fréquentes", category="", limit=10, bg="light"):
    return {"id": id_, "type": "faq", "background": bg, "data": {"eyebrow": eyebrow, "title": title, "category": category, "limit": limit}}

# ---------- Accueil
p = page("/"); p["seo"]["focusKeyword"] = "rénovation Bouloc"

# ---------- Savoir-faire
p = page("/peinture-decoration"); p["seo"]["focusKeyword"] = "peintre décorateur Bouloc"
h = block(p, "hero"); h["intro"] = replace(h["intro"], "Le cœur de notre métier.", "Le cœur de notre métier de peintre décorateur.")
m = block(p, "textTitle", 0)
m["text"] = replace(m["text"], "nous pouvons le mener de A à Z, en rénovation clé en main.", "nous pouvons le mener de A à Z, en [rénovation intérieure clé en main](/renovation-interieure). Pour vous faire une idée du rendu, parcourez nos [réalisations](/realisations).")

p = page("/sols-parquets"); p["seo"]["focusKeyword"] = "parquet Bouloc"
m = block(p, "textTitle", 0)
m["text"] = replace(m["text"], "nous la menons de A à Z.", "nous la menons de A à Z : voyez notre approche de la [rénovation intérieure](/renovation-interieure) et nos [réalisations](/realisations).")

p = page("/murs-revetements"); p["seo"]["focusKeyword"] = "murs placo Bouloc"
p["seo"]["title"] = "Murs, enduits, placo et isolation à Bouloc | Maury Laurent"
h = block(p, "hero"); h["titleSeoPrefix"] = "Murs, enduits, placo et isolation à Bouloc"
h["intro"] = replace(h["intro"], "c'est grâce à eux qu'un mur paraît parfait.", "c'est grâce à eux que vos murs paraissent parfaits.")
m = block(p, "textTitle", 0)
m["text"] = replace(m["text"], "nous menons la rénovation de A à Z.", "nous menons la [rénovation intérieure de A à Z](/renovation-interieure). Une fois les murs prêts, place à la [peinture et à la décoration](/peinture-decoration).")

p = page("/renovation-interieure"); p["seo"]["focusKeyword"] = "rénovation intérieure Bouloc"
p["seo"]["title"] = "Rénovation intérieure clé en main à Bouloc | Maury Laurent"
p["seo"]["description"] = "Rénovation intérieure clé en main ou travaux ciblés à Bouloc, L'Union et Blagnac : un seul artisan de A à Z, devis gratuit sans rajout."
h = block(p, "hero"); h["titleSeoPrefix"] = "Rénovation intérieure clé en main à Bouloc"
h["intro"] = replace(h["intro"], "Rénovation clé en main ou chantier ciblé", "Rénovation intérieure clé en main ou chantier ciblé")
m = [b for b in p["blocks"] if b["type"] == "textTitle"][-1]["data"]
m["text"] = replace(m["text"], "et nous restons joignables ensuite.", "et nous restons joignables ensuite. Découvrez nos [réalisations](/realisations) et nos [zones d'intervention](/zones-intervention).")
cta_i = next(i for i, b in enumerate(p["blocks"]) if b["type"] == "contactCta")
p["blocks"].insert(cta_i, faq_block("renovation-interieure-faq", "Vos questions sur la rénovation", limit=6, bg="light"))

p = page("/facades-exterieur"); p["seo"]["focusKeyword"] = "ravalement façade Bouloc"
h = block(p, "hero"); h["intro"] = replace(h["intro"], "Préparation, réparation des fissures, peinture de façade", "Préparation, réparation des fissures, ravalement et peinture de façade")
m = block(p, "textTitle", 0)
m["text"] = replace(m["text"], "selon les règles d'urbanisme locales.", "selon les règles d'urbanisme locales. Pour les clôtures, volets et boiseries, voyez aussi l'[entretien extérieur](/entretien-bati) et nos [réalisations](/realisations).")

p = page("/entretien-bati"); p["seo"]["focusKeyword"] = "entretien extérieur Bouloc"
h = block(p, "hero"); h["intro"] = replace(h["intro"], "Nous savons lire ces signaux et intervenir tant que c'est encore simple", "Nous savons lire ces signaux et assurer l'entretien extérieur tant que c'est encore simple")
m = block(p, "textTitle", 0)
m["text"] = replace(m["text"], "nous savons revenir.", "nous savons revenir. Pour une remise en état plus complète, voyez le [ravalement de façade](/facades-exterieur) ou nos [réalisations](/realisations).")

# ---------- Réalisations
p = page("/realisations"); p["seo"]["focusKeyword"] = "réalisations rénovation Bouloc"
p["seo"]["title"] = "Réalisations de rénovation à Bouloc | Maury Laurent"
p["seo"]["description"] = "Rénovation intérieure, peinture, murs et parquets : découvrez les réalisations de Maury Laurent, artisan de la rénovation à Bouloc et au nord de Toulouse."
h = block(p, "heroSplit"); h["title"] = "Des réalisations de rénovation à Bouloc, de la pièce à la maison entière"
h["intro"] = replace(h["intro"], "depuis 1994, Maury Laurent accompagne", "depuis 1994, à Bouloc et dans le nord de Toulouse, Maury Laurent accompagne")
h["intro"] = replace(h["intro"], "Peinture, décoration, murs, sols et façades, chaque chantier raconte", "Rénovation, peinture, décoration, murs, sols et façades : chaque réalisation raconte")

p = page("/realisations/renovation-peinture-interieure-bouloc"); p["seo"]["focusKeyword"] = "rénovation peinture intérieure Bouloc"
p["seo"]["description"] = "Rénovation et peinture intérieure d’une maison à Bouloc : salon lumineux, mur graphique, entrée rose poudré et chambre au parquet naturel."
h = block(p, "projectHero"); h["intro"] = replace(h["intro"], "Isabelle souhaitait", "À Bouloc, Isabelle souhaitait")

p = page("/realisations/renovation-veranda-balma"); p["seo"]["focusKeyword"] = "rénovation véranda Balma"
h = block(p, "projectHero"); h["intro"] = replace(h["intro"], "est intervenu pour donner un nouveau caractère à cette véranda.", "est intervenu pour la rénovation de cette véranda, afin de lui donner un nouveau caractère.")

# ---------- L'entreprise
p = page("/entreprise"); p["seo"]["focusKeyword"] = "entreprise rénovation Bouloc"
p["seo"]["title"] = "Entreprise de rénovation à Bouloc | Maury Laurent"
p["seo"]["description"] = "Maury Laurent, entreprise de rénovation à Bouloc depuis 1994 : quatre générations d'artisans, une rénovation de A à Z, un seul interlocuteur."
h = block(p, "hero"); h["titleSeoPrefix"] = "Entreprise de rénovation à Bouloc depuis 1994"
m = block(p, "textTitle", 0)
m["text"] = replace(m["text"], "La personne qui vous reçoit est celle qui réalise les travaux.", "La personne qui vous reçoit est celle qui réalise les travaux, de la [rénovation intérieure](/renovation-interieure) à la [peinture décorative](/peinture-decoration).")

# ---------- Zones d'intervention
p = page("/zones-intervention"); p["seo"]["focusKeyword"] = "zones d'intervention Bouloc"
p["seo"]["title"] = "Zones d'intervention autour de Bouloc | Maury Laurent"
p["seo"]["description"] = "Zones d'intervention de Maury Laurent : peinture et rénovation à Bouloc, Fronton, Castelginest, Aucamville, L’Union, Grenade et Blagnac."
h = block(p, "hero"); h["titleSeoPrefix"] = "Artisan rénovation à Bouloc et au nord de Toulouse"
h["intro"] = "Basée à Bouloc depuis 1994, l'entreprise couvre des zones d'intervention resserrées au nord de Toulouse : des déplacements rapides et un vrai suivi de chantier, du premier rendez-vous à la réception."
grid_i = next(i for i, b in enumerate(p["blocks"]) if b["type"] == "communesGrid")
p["blocks"].insert(grid_i + 1, {"id": "zones-secteur", "type": "textTitle", "background": "light", "data": {
  "eyebrow": "Notre secteur",
  "title": "Un secteur resserré, pour être vraiment présents",
  "lead": "Depuis 1994, l'entreprise intervient autour de son siège de [Bouloc](/zones-intervention/bouloc) : [Fronton](/zones-intervention/fronton) et son vignoble, [Castelginest](/zones-intervention/castelginest) et [Aucamville](/zones-intervention/aucamville) aux portes de Toulouse, [L'Union](/zones-intervention/l-union), la bastide de [Grenade](/zones-intervention/grenade) et [Blagnac](/zones-intervention/blagnac), jusqu'aux bords de Garonne.",
  "text": "Ce périmètre volontairement limité permet des visites rapides, des chantiers suivis de près et des reprises sans délai. Dans chaque commune, les mêmes savoir-faire : [peinture et décoration](/peinture-decoration), [rénovation intérieure](/renovation-interieure), [sols et parquets](/sols-parquets), [murs et revêtements](/murs-revetements), [façades](/facades-exterieur) et [entretien extérieur](/entretien-bati). Toujours avec un seul interlocuteur, une visite sur place et un devis gratuit, détaillé poste par poste. Sur chaque page commune, vous trouverez les travaux les plus demandés sur place, une réalisation en images et les communes voisines.",
}})
cta_i = next(i for i, b in enumerate(p["blocks"]) if b["type"] == "contactCta")
p["blocks"].insert(cta_i, faq_block("zones-faq", "Vos questions sur notre secteur", category="Secteur", limit=6, bg="light"))

# ---------- Contact
p = page("/contact"); p["seo"]["focusKeyword"] = "contact devis Bouloc"
h = block(p, "hero"); h["titleSeoPrefix"] = "Contact et devis gratuit à Bouloc"
h["intro"] = "Pour un devis à Bouloc ou dans le nord de Toulouse, contactez-nous : décrivez les travaux envisagés en quelques lignes, nous vous répondons pour organiser une visite sur place, suivie d'un devis détaillé poste par poste."
p["blocks"].append({"id": "contact-deroule", "type": "textTitle", "background": "sand", "data": {
  "eyebrow": "Votre demande",
  "title": "Comment se passe une demande de devis ?",
  "lead": "Tout commence par une visite chez vous : Laurent mesure, observe l'existant et surtout vous écoute. Le devis, gratuit, détaille ensuite chaque poste pièce par pièce, et il est tenu : aucun rajout une fois signé.",
  "text": "Le planning est annoncé avant le démarrage, puis respecté. Vous gardez un seul interlocuteur du premier rendez-vous à la réception des travaux, faite ensemble, pièce par pièce. Pour vous faire une idée du résultat, parcourez nos [réalisations](/realisations), ou vérifiez que votre commune fait partie de nos [zones d'intervention](/zones-intervention).",
}})
p["blocks"].append(faq_block("contact-faq", "Vos questions avant un devis", limit=10, bg="light"))

# ---------- Villes
V = {
  "bouloc": ("peintre Bouloc", None, None),
  "fronton": ("peintre Fronton", None, None),
  "castelginest": ("rénovation intérieure Castelginest", "Rénovation intérieure à Castelginest | Laurent Maury", None),
  "aucamville": ("peintre Aucamville", "Peintre et rénovation à Aucamville | Laurent Maury", ("Laurent Maury y intervient pour repeindre", "Laurent Maury, artisan peintre, y intervient pour repeindre")),
  "l-union": ("rénovation intérieure L'Union", "Rénovation intérieure à L'Union | Laurent Maury", ("dans un seul chantier, suivi de A à Z.", "dans un seul chantier de rénovation intérieure, suivi de A à Z.")),
  "grenade": ("peintre Grenade", None, None),
  "blagnac": ("rénovation intérieure Blagnac", None, ("Laurent Maury réalise peinture intérieure, décoration,", "Laurent Maury réalise la rénovation intérieure : peinture, décoration,")),
}
for slug, (kw, title, intro) in V.items():
    p = page(f"/zones-intervention/{slug}"); p["seo"]["focusKeyword"] = kw
    if title: p["seo"]["title"] = title
    if intro:
        h = block(p, "zoneHero"); h["intro"] = replace(h["intro"], *intro)

FAQ = {"items": [
  {"question": "Le devis est-il gratuit ?", "answer": "Oui. Après une visite sur place et un métrage, Maury Laurent remet un devis gratuit, détaillé poste par poste et pièce par pièce. Ce qui est écrit est ce qui sera facturé : aucun rajout une fois le devis signé.", "category": "Devis"},
  {"question": "Dans quelles communes intervenez-vous ?", "answer": "Autour de Bouloc, siège de l'entreprise : Fronton, Castelginest, Aucamville, L'Union, Grenade et Blagnac, au nord de Toulouse. Pour un projet situé en dehors, notamment une rénovation complète, contactez-nous : chaque demande est étudiée. Voir les [zones d'intervention](/zones-intervention).", "category": "Secteur"},
  {"question": "Depuis quand l'entreprise existe-t-elle ?", "answer": "Laurent Maury a créé son entreprise à Bouloc en 1994. Il est issu d'une famille de quatre générations d'artisans et travaille aujourd'hui avec son fils.", "category": "Secteur"},
  {"question": "Faites-vous appel à des sous-traitants ?", "answer": "Non. Laurent et son fils réalisent eux-mêmes les travaux, sans faire appel à un autre prestataire : un seul interlocuteur et une seule responsabilité, du premier rendez-vous à la réception.", "category": "Rénovation"},
  {"question": "Proposez-vous la rénovation clé en main ?", "answer": "Oui. De la pièce à la maison entière, la [rénovation intérieure](/renovation-interieure) est menée de A à Z : préparation des supports, placo, isolation, sols, peinture et finitions.", "category": "Rénovation"},
  {"question": "Peut-on rester dans la maison pendant les travaux ?", "answer": "Oui, dans la plupart des cas. Le chantier est organisé par zones, les protections sont posées chaque matin et le chantier est rangé chaque soir, pour que la maison reste habitable.", "category": "Rénovation"},
  {"question": "Les délais annoncés sont-ils tenus ?", "answer": "Un planning est annoncé avant le démarrage, puis tenu. En cas d'aléa, vous êtes prévenu immédiatement.", "category": "Devis"},
  {"question": "Les travaux sont-ils garantis ?", "answer": "Oui. Les travaux sont couverts par la garantie décennale, et l'entreprise reste joignable après le chantier pour toute reprise ou question.", "category": "Devis"},
  {"question": "Faites-vous du crépi sur les façades ?", "answer": "Non. Pour les [façades](/facades-exterieur), l'entreprise privilégie une peinture de façade épaisse, dite plastifiée, qui forme une véritable peau protectrice contre les UV et les intempéries.", "category": "Façades"},
  {"question": "Quels sont vos horaires ?", "answer": "Du lundi au vendredi, de 9h à 17h. Vous pouvez écrire à toute heure : nous vous rappelons pendant les heures d'ouverture.", "category": "Devis"},
]}
json.dump({"pages": list(out.values()), "faq": FAQ}, open(sys.argv[1], "w"), ensure_ascii=False, indent=1)
print(len(out), "pages améliorées")

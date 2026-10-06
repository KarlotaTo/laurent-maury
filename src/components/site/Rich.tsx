import { Link } from "@tanstack/react-router";
import { Fragment, type ReactNode } from "react";

/**
 * Affiche un texte issu du CMS avec une mise en forme minimale :
 * **gras**, *italique*, [lien](/page-du-site) et retours à la ligne.
 * Les liens mènent à une page du site (adresse commençant par /),
 * à un numéro de téléphone (tel:) ou à une adresse e-mail (mailto:).
 */
export function Rich({
  text,
  emClassName,
  linkClassName,
}: {
  text: string;
  emClassName?: string;
  linkClassName?: string;
}) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {inline(line, emClassName, linkClassName)}
        </Fragment>
      ))}
    </>
  );
}

const TOKEN = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\((?:\/|tel:|mailto:)[^)\s]*\))/g;

function inline(line: string, emClassName?: string, linkClassName?: string): ReactNode[] {
  return line.split(TOKEN).map((part, i) => {
    const external = /^\[([^\]]+)\]\(((?:tel|mailto):[^)\s]+)\)$/.exec(part);
    if (external) {
      return (
        <a key={i} href={external[2]} className={linkClassName}>
          {external[1]}
        </a>
      );
    }
    const link = /^\[([^\]]+)\]\((\/[^)\s]*)\)$/.exec(part);
    if (link) {
      return (
        <Link key={i} to={link[2]!} className={linkClassName}>
          {link[1]}
        </Link>
      );
    }
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return emClassName ? (
        <span key={i} className={emClassName}>
          {part.slice(1, -1)}
        </span>
      ) : (
        <em key={i}>{part.slice(1, -1)}</em>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

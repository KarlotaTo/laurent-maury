import { createFileRoute } from "@tanstack/react-router";
import { MediaLibrary } from "@/admin/MediaLibrary";

function MediaScreen() {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="font-display text-4xl">Médiathèque</h1>
        <p className="mt-1 max-w-2xl text-[14px] text-muted-foreground">
          Vos photos, prêtes à être utilisées dans les pages. Pensez à leur donner une description : Google la lit, ainsi que les personnes malvoyantes.
        </p>
      </div>
      <MediaLibrary />
    </section>
  );
}

export const Route = createFileRoute("/admin/medias")({ component: MediaScreen });

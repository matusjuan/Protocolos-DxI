function urlEmbebible(url: string): string | null {
  const yt = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{6,})/
  );
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;

  const drive = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (drive) return `https://drive.google.com/file/d/${drive[1]}/preview`;

  return null;
}

export function VideoEmbed({ etiqueta, url }: { etiqueta: string; url: string }) {
  const embebible = urlEmbebible(url);

  return (
    <div className="overflow-hidden rounded border border-border bg-surface">
      {embebible ? (
        <div className="aspect-video w-full">
          <iframe
            src={embebible}
            title={etiqueta}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
      ) : (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 p-6 text-sm text-rm hover:underline"
        >
          Ver video ↗
        </a>
      )}
      <p className="truncate px-2 py-1.5 text-xs text-ink-dim">{etiqueta}</p>
    </div>
  );
}

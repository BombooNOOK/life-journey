const D_KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33] as const;

export default async function DestinyPdfPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ destiny?: string }>;
}) {
  const requested = Number((await searchParams).destiny ?? "1");
  const destiny = D_KEYS.includes(requested as (typeof D_KEYS)[number]) ? requested : 1;
  const src = `/api/dev/destiny-preview?destiny=${destiny}`;

  return (
    <div className="flex min-h-screen flex-col bg-stone-100 text-stone-900">
      <header className="shrink-0 border-b border-stone-200 bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2">
          <span className="text-sm text-stone-700">ディスティニーPDF確認:</span>
          {D_KEYS.map((n) => (
            <a
              key={n}
              href={`/preview/destiny-pdf?destiny=${n}`}
              className={`rounded px-2 py-1 text-sm ${
                n === destiny ? "bg-stone-800 text-white" : "bg-stone-200 text-stone-800"
              }`}
            >
              D{n}
            </a>
          ))}
        </div>
      </header>
      <iframe title={`destiny-${destiny}`} src={src} className="min-h-0 w-full flex-1 border-0 bg-stone-200" />
    </div>
  );
}

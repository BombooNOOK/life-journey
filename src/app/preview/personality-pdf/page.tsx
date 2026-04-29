const P_KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33] as const;

export default async function PersonalityPdfPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ personality?: string }>;
}) {
  const requested = Number((await searchParams).personality ?? "1");
  const personality = P_KEYS.includes(requested as (typeof P_KEYS)[number]) ? requested : 1;
  const src = `/api/dev/personality-preview?personality=${personality}`;

  return (
    <div className="flex min-h-screen flex-col bg-stone-100 text-stone-900">
      <header className="shrink-0 border-b border-stone-200 bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2">
          <span className="text-sm text-stone-700">パーソナリティPDF確認:</span>
          {P_KEYS.map((n) => (
            <a
              key={n}
              href={`/preview/personality-pdf?personality=${n}`}
              className={`rounded px-2 py-1 text-sm ${
                n === personality ? "bg-stone-800 text-white" : "bg-stone-200 text-stone-800"
              }`}
            >
              P{n}
            </a>
          ))}
        </div>
      </header>
      <iframe title={`personality-${personality}`} src={src} className="min-h-0 w-full flex-1 border-0 bg-stone-200" />
    </div>
  );
}

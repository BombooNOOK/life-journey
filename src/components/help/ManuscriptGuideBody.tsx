import { parseManuscriptLineMarkup } from "@/lib/pdf/pdfManuscriptMarkup";

type Props = {
  body: string;
  className?: string;
};

function ManuscriptLine({ line }: { line: string }) {
  const segments = parseManuscriptLineMarkup(line);
  return (
    <>
      {segments.map((segment, index) =>
        segment.italic ? (
          <em key={index} className="italic">
            {segment.text}
          </em>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </>
  );
}

/** 鑑定書ガイド原稿（`pdfCoreNumberGuideCopy` 等）を Web 向けに表示 */
export function ManuscriptGuideBody({ body, className }: Props) {
  const paragraphs = body.split(/\n\n+/);

  return (
    <div className={["space-y-4 text-sm leading-[1.75] text-stone-700 sm:text-[0.9375rem]", className].filter(Boolean).join(" ")}>
      {paragraphs.map((paragraph) => {
        const lines = paragraph.split("\n");
        return (
          <p key={paragraph.slice(0, 24)}>
            {lines.map((line, lineIndex) => (
              <span key={`${lineIndex}-${line.slice(0, 12)}`}>
                {lineIndex > 0 ? <br /> : null}
                <ManuscriptLine line={line} />
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

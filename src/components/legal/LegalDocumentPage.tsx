import Link from "next/link";

import type { LegalDocumentSection } from "@/lib/legal/privacyPolicyContent";

type Props = {
  title: string;
  intro: readonly string[];
  sections: LegalDocumentSection[];
  enactedAt: string;
  revisedAt: string;
  operator: string;
  contact: string;
  backLink?: { href: string; label: string };
};

export function LegalDocumentPage({
  title,
  intro,
  sections,
  enactedAt,
  revisedAt,
  operator,
  contact,
  backLink,
}: Props) {
  return (
    <article className="mx-auto max-w-2xl space-y-8 pb-10 sm:space-y-10 sm:pb-12">
      <header className="space-y-4 border-b border-stone-200/80 pb-6 sm:pb-8">
        {backLink ? (
          <Link href={backLink.href} className="text-sm text-stone-600 hover:text-stone-900">
            {backLink.label}
          </Link>
        ) : null}
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">{title}</h1>
        <div className="space-y-3 text-sm leading-7 text-stone-700 sm:text-[15px] sm:leading-8">
          {intro.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </header>

      <div className="space-y-8 sm:space-y-10">
        {sections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-6 space-y-3">
            <h2 className="text-base font-semibold tracking-tight text-stone-900 sm:text-lg">
              {section.title}
            </h2>
            {section.paragraphs?.map((paragraph) => (
              <p
                key={paragraph}
                className="text-sm leading-7 text-stone-700 sm:text-[15px] sm:leading-8"
              >
                {paragraph}
              </p>
            ))}
            {section.bullets?.length ? (
              <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-stone-700 sm:text-[15px] sm:leading-8">
                {section.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>

      <footer className="space-y-2 border-t border-stone-200/80 pt-6 text-sm leading-7 text-stone-600 sm:pt-8">
        <p>運営者：{operator}</p>
        <p>お問い合わせ先：{contact}</p>
        <p>制定日：{enactedAt}</p>
        <p>最終改定日：{revisedAt}</p>
      </footer>
    </article>
  );
}

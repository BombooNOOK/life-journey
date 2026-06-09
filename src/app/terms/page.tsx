import type { Metadata } from "next";

import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import {
  TERMS_OF_SERVICE_INTRO,
  TERMS_OF_SERVICE_META,
  TERMS_OF_SERVICE_SECTIONS,
} from "@/lib/legal/termsOfServiceContent";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: TERMS_OF_SERVICE_META.title,
  description: `${TERMS_OF_SERVICE_META.serviceName}の利用規約です。`,
};

export default function TermsOfServicePage() {
  return (
    <div className="-mx-4 rounded-none bg-[#fffdf9] px-4 py-8 sm:mx-0 sm:rounded-2xl sm:border sm:border-stone-200/70 sm:px-6 sm:py-10">
      <LegalDocumentPage
        title={TERMS_OF_SERVICE_META.title}
        intro={TERMS_OF_SERVICE_INTRO}
        sections={TERMS_OF_SERVICE_SECTIONS}
        enactedAt={TERMS_OF_SERVICE_META.enactedAt}
        revisedAt={TERMS_OF_SERVICE_META.revisedAt}
        operator={TERMS_OF_SERVICE_META.operator}
        contact={TERMS_OF_SERVICE_META.contact}
        backLink={{ href: "/", label: "← トップへ" }}
      />
    </div>
  );
}

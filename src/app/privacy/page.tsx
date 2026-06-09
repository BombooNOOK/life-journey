import type { Metadata } from "next";

import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import {
  PRIVACY_POLICY_INTRO,
  PRIVACY_POLICY_META,
  PRIVACY_POLICY_SECTIONS,
} from "@/lib/legal/privacyPolicyContent";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: PRIVACY_POLICY_META.title,
  description: `${PRIVACY_POLICY_META.serviceName}のプライバシーポリシーです。`,
};

export default function PrivacyPolicyPage() {
  return (
    <div className="-mx-4 rounded-none bg-[#fffdf9] px-4 py-8 sm:mx-0 sm:rounded-2xl sm:border sm:border-stone-200/70 sm:px-6 sm:py-10">
      <LegalDocumentPage
        title={PRIVACY_POLICY_META.title}
        intro={PRIVACY_POLICY_INTRO}
        sections={PRIVACY_POLICY_SECTIONS}
        enactedAt={PRIVACY_POLICY_META.enactedAt}
        revisedAt={PRIVACY_POLICY_META.revisedAt}
        operator={PRIVACY_POLICY_META.operator}
        contact={PRIVACY_POLICY_META.contact}
        backLink={{ href: "/", label: "← トップへ" }}
      />
    </div>
  );
}

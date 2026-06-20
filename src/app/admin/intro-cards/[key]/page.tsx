import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminIntroCardFullscreen } from "@/components/admin/AdminIntroCardFullscreen";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { isAdminEmail } from "@/lib/admin/access";
import { adminIntroCardByKey } from "@/lib/admin/introCardAssets";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ key: string }>;
};

export default async function AdminIntroCardDetailPage({ params }: Props) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!(await isAdminEmail(viewerEmail))) {
    notFound();
  }

  const { key } = await params;
  const card = adminIntroCardByKey(key);
  if (!card) {
    notFound();
  }

  return (
    <>
      <div className="sr-only">
        <Link href="/admin/intro-cards">対面紹介用カード一覧へ戻る</Link>
      </div>
      <AdminIntroCardFullscreen
        backHref="/admin/intro-cards"
        title={card.title}
        imageSrc={card.imageSrc}
        imageAlt={card.imageAlt}
        imageFit={card.imageFit}
      />
    </>
  );
}

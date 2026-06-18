import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

/** 旧URL：鑑定ページ上部の今日のヒントへ */
export default async function TodayHintRedirectPage({ params }: Props) {
  const { id } = await params;
  redirect(`/orders/${id}#today-hint`);
}

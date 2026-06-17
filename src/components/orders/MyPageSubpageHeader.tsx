import Link from "next/link";

type Props = {
  title: string;
  description?: string;
};

export function MyPageSubpageHeader({ title, description }: Props) {
  return (
    <div>
      <Link href="/orders" className="text-sm text-stone-600 hover:text-stone-900">
        ← マイページ
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-stone-900">{title}</h1>
      {description ? <p className="mt-1 text-sm text-stone-600">{description}</p> : null}
    </div>
  );
}

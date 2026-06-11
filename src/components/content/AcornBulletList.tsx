import { DecorationImage } from "@/components/ui/DecorationImage";

function AcornBulletFallback() {
  return (
    <span
      aria-hidden
      className="mt-[0.42rem] inline-block h-2 w-2 shrink-0 rounded-full bg-amber-900/30"
    />
  );
}

type Props = {
  items: readonly string[];
};

/** どんぐりアイコン付き箇条書き（説明文のやわらげ用） */
export function AcornBulletList({ items }: Props) {
  return (
    <ul className="space-y-2 sm:space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5">
          <DecorationImage
            name="acorn-sm"
            size="md"
            className="mt-1 opacity-90"
            fallback={<AcornBulletFallback />}
          />
          <span className="min-w-0 flex-1 text-sm leading-6 text-stone-700 sm:text-[15px] sm:leading-7">
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}

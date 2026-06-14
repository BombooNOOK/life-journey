import Image from "next/image";

type Props = {
  src: string;
  alt: string;
  caption: string;
  step?: number;
};

export function HelpScreenshotFigure({ src, alt, caption, step }: Props) {
  return (
    <figure className="overflow-hidden rounded-xl border border-stone-200/80 bg-[#fffdf9] p-2 shadow-sm">
      {step ? (
        <p className="mb-2 px-1 text-xs font-medium text-emerald-900">
          <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-700 text-[10px] font-semibold text-white">
            {step}
          </span>
          {caption}
        </p>
      ) : null}
      <Image
        src={src}
        alt={alt}
        width={390}
        height={844}
        className="mx-auto w-full max-w-[260px] rounded-lg"
        sizes="(max-width: 640px) 260px, 260px"
      />
      {!step ? (
        <figcaption className="mt-2 px-1 text-center text-xs leading-relaxed text-stone-500">{caption}</figcaption>
      ) : null}
    </figure>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";

type Props = {
  backHref: string;
  title: string;
  imageSrc: string;
  imageAlt: string;
};

/** 対面紹介：1枚のカードを画面いっぱいに表示 */
export function AdminIntroCardFullscreen({ backHref, title, imageSrc, imageAlt }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#14120f]">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-black/75 px-4 py-3 backdrop-blur-sm">
        <Link href={backHref} className="text-sm font-medium text-white/85 hover:text-white">
          ← 戻る
        </Link>
        <p className="truncate text-sm font-medium text-white">{title}</p>
        <span className="w-12 shrink-0" aria-hidden />
      </header>

      <div className="relative min-h-0 flex-1">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          sizes="100vw"
          className="object-contain"
          priority
          unoptimized
        />
      </div>
    </div>
  );
}

import type { ReactNode } from "react";

import { mobileReadable } from "@/lib/auth/mobileReadableStyles";

type Props = {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function MyPageAccountSectionCard({ title, children, footer, className = "" }: Props) {
  return (
    <section
      className={`space-y-4 rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:space-y-5 sm:p-5 ${className}`.trim()}
    >
      <h2 className={mobileReadable.sectionTitle}>{title}</h2>
      {children}
      {footer ? <div className="pt-1">{footer}</div> : null}
    </section>
  );
}

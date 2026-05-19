/**
 * Usage: npx tsx scripts/verify-core-number-intro-pages.tsx
 */
import React from "react";
import { Document, renderToBuffer } from "@react-pdf/renderer";
import { PDFDocument } from "pdf-lib";

import { CoreNumberIntroBleedPage } from "@/components/pdf/pages/CoreNumberIntroBleedPage";
import type { CoreNumberIntroKey } from "@/lib/numerology/pdfCoreNumberIntroCopy";
import {
  getCoreNumberIntroSubtitle,
  getCoreNumberIntroThemeLine,
} from "@/lib/numerology/pdfCoreIntroSubtitle";
import { maturityNumberFromNumerology } from "@/lib/numerology/reduce";
import { ensureJapaneseFont } from "@/components/pdf/registerFonts";
import { getSampleBookletOrder } from "@/lib/pdf/sampleBookletOrder";

const KEYS: CoreNumberIntroKey[] = [
  "lifePath",
  "destiny",
  "soul",
  "personality",
  "birthday",
  "maturity",
];

async function main() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).React = React;
  ensureJapaneseFont();
  const order = getSampleBookletOrder();
  const maturity = maturityNumberFromNumerology(order.numerology);
  const buf = await renderToBuffer(
    <Document>
      {KEYS.map((coreKey) => (
        <CoreNumberIntroBleedPage
          key={coreKey}
          coreKey={coreKey}
          subtitle={getCoreNumberIntroSubtitle(coreKey, order, maturity)}
          themeLine={getCoreNumberIntroThemeLine(coreKey, order)}
        />
      ))}
    </Document>,
  );
  const pages = (await PDFDocument.load(buf)).getPageCount();
  console.log(`core-number-intro: ${pages} page(s) ${pages === 6 ? "OK" : "FAIL"}`);
  if (pages !== 6) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

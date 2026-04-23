import fs from "node:fs";
import path from "node:path";
import React from "react";

import { Document, renderToBuffer } from "@react-pdf/renderer";

import { ReportPdfPages } from "@/components/pdf/ReportPdfPages";
import { ensureJapaneseFont } from "@/components/pdf/registerFonts";
import { buildOrderPayload } from "@/lib/order/buildSnapshot";
import type { CustomerFormValues } from "@/lib/order/types";

async function main() {
  // @react-pdf/renderer の一部経路で `React` シンボルを参照されるため、
  // TS/Next の自動ランタイムとズレる実行環境を吸収する。
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).React = React;

  // ダミーデータ（PDF見た目確認用）
  const base: CustomerFormValues = {
    lastName: "山田",
    firstName: "太郎",
    lastNameKana: "やまだ",
    firstNameKana: "たろう",
    lastNameRoman: "",
    firstNameRoman: "",
    fullNameDisplay: "",
    fullNameKanaDisplay: "",
    fullNameRomanDisplay: "",
    birthDate: "1990-05-21",
    birthYear: 1990,
    birthMonth: 5,
    birthDay: 21,
    postalCode: "1000001",
    address: "東京都千代田区千代田",
    phone: "090-0000-0000",
    email: "taro@example.com",
    stoneFocusTheme: "none",
  };

  const order = {
    ...buildOrderPayload(base),
    // パーソナルマンス算出起点を固定
    purchaseDateIso: "2026-04-01T12:00:00Z",
  };

  ensureJapaneseFont();

  const buffer = await renderToBuffer(
    <Document>
      <ReportPdfPages order={order} renderConfig={{ focusPage: "all" }} segment="full" />
    </Document>,
  );

  const outPath = path.join(process.cwd(), "sample-booklet.pdf");
  fs.writeFileSync(outPath, Buffer.from(buffer));
  // eslint-disable-next-line no-console
  console.log(outPath);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});

